"""
Kiosk action endpoints:
  POST /gatehouse/check-in      — truck arrival + auto-routing
  POST /dock-worker/start-unload
  POST /dock-worker/complete-unload — triggers next yard_queue auto-assign
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, status
from pydantic import BaseModel

from app.core.db import enrich_appointment
from app.core.errors import ErrorCode, api_error
from app.core.state_machine import validate_appointment_transition, validate_completed_invariant
from app.core.supabase import service_client
from app.middleware.device_auth import DockDevice, GatehouseDevice

router = APIRouter(tags=["Kiosk"])


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------


def _get_appointment(appointment_id: str) -> dict:
    """Fetch a full appointment row or raise appointment_not_found."""
    result = (
        service_client.table("appointments")
        .select(
            "id, company_id, facility_id, po_number, status, door_id, "
            "gate_device_id, dock_device_id, "
            "scheduled_start, scheduled_end, actual_start, actual_end, checked_in_at"
        )
        .eq("id", appointment_id)
        .maybe_single()
        .execute()
    )
    appt = result.data
    if not appt:
        raise api_error(ErrorCode.APPOINTMENT_NOT_FOUND, 404, "Appointment not found.")
    return appt


def _find_free_door(facility_id: str) -> str | None:
    """
    Find the first active door in the facility that has no current assigned/unloading appointment.
    Returns door_id str or None.
    """
    # Fetch all active doors
    doors_res = (
        service_client.table("doors")
        .select("id")
        .eq("facility_id", facility_id)
        .eq("is_active", True)
        .execute()
    )
    all_door_ids = {d["id"] for d in (doors_res.data or [])}
    if not all_door_ids:
        return None

    # Find doors currently occupied by assigned/unloading appointments
    occupied_res = (
        service_client.table("appointments")
        .select("door_id")
        .eq("facility_id", facility_id)
        .in_("status", ["assigned", "unloading"])
        .not_.is_("door_id", "null")
        .execute()
    )
    occupied = {r["door_id"] for r in (occupied_res.data or []) if r.get("door_id")}

    free = all_door_ids - occupied
    return next(iter(free)) if free else None


# ---------------------------------------------------------------------------
# POST /gatehouse/check-in
# ---------------------------------------------------------------------------


class CheckInRequest(BaseModel):
    facility_id: uuid.UUID
    identifier: str        # po_number (or license_plate – treated as po_number fallback)
    checked_in_at: datetime


@router.post("/gatehouse/check-in", status_code=status.HTTP_200_OK)
async def gatehouse_check_in(body: CheckInRequest, device: GatehouseDevice):
    """
    Truck arrives at gate.
    1. Look up scheduled appointment by po_number.
    2. Set checked_in_at + gate_device_id.
    3. If a free door exists → assigned (set door_id). Else → yard_queue.
    Returns: appointment_id, match_status, assigned_door_id?
    """
    # Device must be in the same facility as the check-in
    if device.facility_id != body.facility_id:
        raise api_error(ErrorCode.FACILITY_SCOPE_VIOLATION, 403, "Device facility mismatch.")

    # Find appointment: status='scheduled' or 'yard_queue' (re-scan scenario)
    result = (
        service_client.table("appointments")
        .select("id, status, door_id, facility_id")
        .eq("facility_id", str(body.facility_id))
        .eq("po_number", body.identifier)
        .in_("status", ["scheduled", "yard_queue"])
        .order("scheduled_start", desc=False)
        .limit(1)
        .execute()
    )

    appt = (result.data or [None])[0]
    if not appt:
        raise api_error(
            ErrorCode.APPOINTMENT_NOT_FOUND, 404,
            f"No scheduled/queued appointment found for identifier '{body.identifier}'."
        )

    appt_id = appt["id"]
    current_status = appt["status"]

    # Try to find a free door for direct assignment
    free_door_id = _find_free_door(str(body.facility_id))

    if free_door_id:
        validate_appointment_transition(current_status, "assigned")
        new_status = "assigned"
    else:
        validate_appointment_transition(current_status, "yard_queue")
        new_status = "yard_queue"

    updates: dict = {
        "status": new_status,
        "checked_in_at": body.checked_in_at.isoformat(),
        "gate_device_id": str(device.device_id),
    }
    if free_door_id:
        updates["door_id"] = free_door_id

    service_client.table("appointments").update(updates).eq("id", appt_id).execute()

    return {
        "appointment_id": appt_id,
        "match_status": "matched",
        "assigned_door_id": free_door_id,
    }


# ---------------------------------------------------------------------------
# POST /dock-worker/start-unload
# ---------------------------------------------------------------------------


class StartUnloadRequest(BaseModel):
    appointment_id: uuid.UUID
    actual_start: datetime


@router.post("/dock-worker/start-unload", status_code=status.HTTP_200_OK)
async def start_unload(body: StartUnloadRequest, device: DockDevice):
    """
    Dock worker begins unloading.
    Transitions: assigned → unloading. Sets actual_start + dock_device_id.
    """
    appt = _get_appointment(str(body.appointment_id))

    # Facility scope: device must be in the same facility
    if str(device.facility_id) != appt["facility_id"]:
        raise api_error(ErrorCode.FACILITY_SCOPE_VIOLATION, 403, "Device facility mismatch.")

    # Door scope: dock device must be assigned to this appointment's door
    if device.door_id and str(device.door_id) != appt.get("door_id"):
        raise api_error(
            ErrorCode.FACILITY_SCOPE_VIOLATION, 403,
            "Dock device is assigned to a different door."
        )

    validate_appointment_transition(appt["status"], "unloading")

    service_client.table("appointments").update(
        {
            "status": "unloading",
            "actual_start": body.actual_start.isoformat(),
            "dock_device_id": str(device.device_id),
        }
    ).eq("id", str(body.appointment_id)).execute()

    return {"appointment_id": str(body.appointment_id), "status": "unloading"}


# ---------------------------------------------------------------------------
# POST /dock-worker/complete-unload
# ---------------------------------------------------------------------------


class CompleteUnloadRequest(BaseModel):
    appointment_id: uuid.UUID
    actual_end: datetime


@router.post("/dock-worker/complete-unload", status_code=status.HTTP_200_OK)
async def complete_unload(body: CompleteUnloadRequest, device: DockDevice):
    """
    Dock worker finishes unloading.
    Transitions: unloading → completed. Sets actual_end.
    Side-effect: auto-assigns next yard_queue truck to the freed door (ai_logic.md routing).
    """
    appt = _get_appointment(str(body.appointment_id))

    if str(device.facility_id) != appt["facility_id"]:
        raise api_error(ErrorCode.FACILITY_SCOPE_VIOLATION, 403, "Device facility mismatch.")

    validate_appointment_transition(appt["status"], "completed")

    # Merge actual_end into row for completed invariant check
    merged = {**appt, "actual_end": body.actual_end.isoformat()}
    validate_completed_invariant(merged)

    freed_door_id = appt.get("door_id")

    service_client.table("appointments").update(
        {
            "status": "completed",
            "actual_end": body.actual_end.isoformat(),
        }
    ).eq("id", str(body.appointment_id)).execute()

    # --- Auto-routing side-effect (ai_logic.md) ---
    # Assign next yard_queue truck to the now-free door
    if freed_door_id:
        next_res = (
            service_client.table("appointments")
            .select("id")
            .eq("facility_id", appt["facility_id"])
            .eq("status", "yard_queue")
            .order("checked_in_at", desc=False)
            .limit(1)
            .execute()
        )
        next_appt = (next_res.data or [None])[0]
        if next_appt:
            try:
                validate_appointment_transition("yard_queue", "assigned")
                service_client.table("appointments").update(
                    {"status": "assigned", "door_id": freed_door_id}
                ).eq("id", next_appt["id"]).execute()
            except Exception:
                # Non-fatal: if routing fails, yard_queue truck stays queued
                pass

    return {"appointment_id": str(body.appointment_id), "status": "completed"}
