"""
Kiosk action endpoints:
  POST /gatehouse/check-in      — truck arrival, PO match, auto-routing + realtime publish
  POST /dock-worker/start-unload
  POST /dock-worker/complete-unload — triggers yard_queue auto-assign + realtime publish
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, status
from pydantic import BaseModel

from app.core.errors import ErrorCode, api_error
from app.core.realtime import build_envelope, get_queue_snapshot, publish
from app.core.routing import assign_next_from_queue
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
    Find the first active door in the facility with no assigned/unloading appointment.
    Returns door_id str or None.
    """
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
    identifier: str        # po_number (or license_plate — treated as po_number fallback)
    checked_in_at: datetime


@router.post("/gatehouse/check-in", status_code=status.HTTP_200_OK)
async def gatehouse_check_in(body: CheckInRequest, device: GatehouseDevice):
    """
    Truck arrives at gate.
    1. Look up scheduled/yard_queue appointment by po_number.
    2. Set checked_in_at + gate_device_id.
    3. If a free door exists → assigned. Else → yard_queue.
    4. Publish realtime events.
    """
    if device.facility_id != body.facility_id:
        raise api_error(ErrorCode.FACILITY_SCOPE_VIOLATION, 403, "Device facility mismatch.")

    # Find appointment
    result = (
        service_client.table("appointments")
        .select("id, status, door_id, facility_id, company_id, po_number")
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
            ErrorCode.CHECKIN_MATCH_NOT_FOUND, 404,
            f"No appointment match for PO/identifier in facility/day window.",
            {"identifier": body.identifier},
        )

    appt_id = appt["id"]
    facility_id_str = str(body.facility_id)
    company_id_str = appt.get("company_id", "")
    current_status = appt["status"]

    # Routing decision
    free_door_id = _find_free_door(facility_id_str)

    if free_door_id:
        # scheduled or yard_queue → assigned (direct door assignment)
        validate_appointment_transition(current_status, "assigned")
        new_status = "assigned"
    elif current_status == "yard_queue":
        # Re-scan: already queued, no door free — refresh timestamps only, no transition
        new_status = "yard_queue"
    else:
        # scheduled → yard_queue
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

    # -----------------------------------------------------------------------
    # Realtime: truck_checked_in on dashboard (always)
    # -----------------------------------------------------------------------
    actor = {"kind": "device", "id": str(device.device_id)}

    # Queue position — either 0 (assigned directly) or computed
    if new_status == "yard_queue":
        queue_snap = await get_queue_snapshot(facility_id_str)
        queue_pos = next((q["queue_position"] for q in queue_snap if q["appointment_id"] == appt_id), 1)
    else:
        queue_snap = None
        queue_pos = 0

    await publish(
        f"facility:{facility_id_str}:dashboard",
        "truck_checked_in",
        build_envelope(
            "truck_checked_in",
            {
                "appointment_id": appt_id,
                "po_number": appt.get("po_number", body.identifier),
                "checked_in_at": body.checked_in_at.isoformat(),
                "queue_position": queue_pos,
            },
            facility_id=facility_id_str,
            company_id=company_id_str,
            actor_kind="device",
            actor_id=str(device.device_id),
        ),
    )

    if new_status == "yard_queue":
        # queue_joined on queue channel
        await publish(
            f"facility:{facility_id_str}:queue",
            "queue_joined",
            build_envelope(
                "queue_joined",
                {"appointment_id": appt_id, "queue_position": queue_pos},
                facility_id=facility_id_str,
                company_id=company_id_str,
                actor_kind="device",
                actor_id=str(device.device_id),
            ),
        )
        # yard_queue_updated on dashboard
        await publish(
            f"facility:{facility_id_str}:dashboard",
            "yard_queue_updated",
            build_envelope(
                "yard_queue_updated",
                {"queue": queue_snap or []},
                facility_id=facility_id_str,
                company_id=company_id_str,
                actor_kind="device",
                actor_id=str(device.device_id),
            ),
        )
    else:
        # appointment_updated on dashboard
        await publish(
            f"facility:{facility_id_str}:dashboard",
            "appointment_updated",
            build_envelope(
                "appointment_updated",
                {"appointment_id": appt_id, "changes": {"status": "assigned", "door_id": free_door_id}},
                facility_id=facility_id_str,
                company_id=company_id_str,
                actor_kind="device",
                actor_id=str(device.device_id),
            ),
        )
        # door_status_changed on dashboard
        await publish(
            f"facility:{facility_id_str}:dashboard",
            "door_status_changed",
            build_envelope(
                "door_status_changed",
                {"door_id": free_door_id, "state": "occupied", "appointment_id": appt_id},
                facility_id=facility_id_str,
                company_id=company_id_str,
                actor_kind="device",
                actor_id=str(device.device_id),
            ),
        )
        # door_assignment_changed on doors channel
        await publish(
            f"facility:{facility_id_str}:doors",
            "door_assignment_changed",
            build_envelope(
                "door_assignment_changed",
                {"door_id": free_door_id, "from_appointment_id": None, "to_appointment_id": appt_id},
                facility_id=facility_id_str,
                company_id=company_id_str,
                actor_kind="device",
                actor_id=str(device.device_id),
            ),
        )

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

    if str(device.facility_id) != appt["facility_id"]:
        raise api_error(ErrorCode.FACILITY_SCOPE_VIOLATION, 403, "Device facility mismatch.")

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

    # -----------------------------------------------------------------------
    # Realtime
    # -----------------------------------------------------------------------
    facility_id_str = appt["facility_id"]
    company_id_str = appt.get("company_id", "")
    door_id = appt.get("door_id")

    await publish(
        f"facility:{facility_id_str}:dashboard",
        "appointment_updated",
        build_envelope(
            "appointment_updated",
            {"appointment_id": str(body.appointment_id), "changes": {"status": "unloading"}},
            facility_id=facility_id_str,
            company_id=company_id_str,
            actor_kind="device",
            actor_id=str(device.device_id),
        ),
    )

    if door_id:
        await publish(
            f"facility:{facility_id_str}:dashboard",
            "door_status_changed",
            build_envelope(
                "door_status_changed",
                {"door_id": door_id, "state": "occupied", "appointment_id": str(body.appointment_id)},
                facility_id=facility_id_str,
                company_id=company_id_str,
                actor_kind="device",
                actor_id=str(device.device_id),
            ),
        )

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
    Side-effect: auto-assigns next yard_queue truck to freed door + realtime publish.
    """
    appt = _get_appointment(str(body.appointment_id))

    if str(device.facility_id) != appt["facility_id"]:
        raise api_error(ErrorCode.FACILITY_SCOPE_VIOLATION, 403, "Device facility mismatch.")

    validate_appointment_transition(appt["status"], "completed")

    merged = {**appt, "actual_end": body.actual_end.isoformat()}
    validate_completed_invariant(merged)

    freed_door_id = appt.get("door_id")
    facility_id_str = appt["facility_id"]
    company_id_str = appt.get("company_id", "")

    service_client.table("appointments").update(
        {"status": "completed", "actual_end": body.actual_end.isoformat()}
    ).eq("id", str(body.appointment_id)).execute()

    # -----------------------------------------------------------------------
    # Realtime — completion events
    # -----------------------------------------------------------------------
    await publish(
        f"facility:{facility_id_str}:dashboard",
        "appointment_updated",
        build_envelope(
            "appointment_updated",
            {"appointment_id": str(body.appointment_id), "changes": {"status": "completed"}},
            facility_id=facility_id_str,
            company_id=company_id_str,
            actor_kind="device",
            actor_id=str(device.device_id),
        ),
    )

    if freed_door_id:
        await publish(
            f"facility:{facility_id_str}:doors",
            "door_released",
            build_envelope(
                "door_released",
                {
                    "door_id": freed_door_id,
                    "released_by_appointment_id": str(body.appointment_id),
                    "released_at": body.actual_end.isoformat(),
                },
                facility_id=facility_id_str,
                company_id=company_id_str,
                actor_kind="device",
                actor_id=str(device.device_id),
            ),
        )

    # -----------------------------------------------------------------------
    # Auto-routing: assign oldest yard_queue truck to the freed door
    # Uses the shared fluid routing engine (Phase 9) which also broadcasts
    # door_assignment_changed to the specific dock device channel.
    # -----------------------------------------------------------------------
    if freed_door_id:
        await assign_next_from_queue(
            facility_id=facility_id_str,
            company_id=company_id_str,
            freed_door_id=freed_door_id,
            actor_id="routing-engine",
        )

    return {"appointment_id": str(body.appointment_id), "status": "completed"}

