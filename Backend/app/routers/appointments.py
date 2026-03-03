"""
Appointment endpoints:
  GET  /appointments/{appointment_id}           — Phase 2
  POST /facilities/{facility_id}/appointments   — Phase 3
  PATCH /appointments/{appointment_id}          — Phase 3
"""

import uuid
from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, Request, status
from pydantic import BaseModel

from app.core.ai import estimate_scheduled_end
from app.core.audit import audit
from app.core.db import enrich_appointment, get_plan_feature_flags
from app.core.errors import ErrorCode, api_error
from app.core.idempotency import check_idempotency, store_idempotency
from app.core.realtime import build_envelope, publish
from app.core.state_machine import (
    validate_appointment_transition,
    validate_completed_invariant,
    validate_time_window,
)
from app.core.supabase import service_client
from app.middleware.auth import CurrentUser, get_current_user
from app.middleware.tenancy import make_facility_guard, require_manager_or_admin

router = APIRouter(tags=["Appointments"])

ManagerOrAdmin = Annotated[CurrentUser, Depends(require_manager_or_admin)]

# ---------------------------------------------------------------------------
# DB-backed idempotency (Phase 12) — replaces in-process dict
# The _idempotency_cache below is kept as a fast L1 within the same process
# instance; DB is the L2 for cross-instance replay protection.
# ---------------------------------------------------------------------------
_idempotency_cache: dict[str, dict] = {}



# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------


def _fetch_appointment_scoped(appointment_id: str, current_user: CurrentUser) -> dict:
    """
    Fetch appointment and enforce company + facility scope.
    Returns the raw DB row (without is_overrun).
    Raises appointment_not_found (404) on any scope violation.
    """
    result = (
        service_client.table("appointments")
        .select(
            "id, company_id, facility_id, po_number, carrier_name, load_type, "
            "status, scheduled_start, scheduled_end, actual_start, actual_end, "
            "checked_in_at, door_id, gate_device_id, dock_device_id"
        )
        .eq("id", appointment_id)
        .maybe_single()
        .execute()
    )
    appt = result.data
    if not appt:
        raise api_error(ErrorCode.APPOINTMENT_NOT_FOUND, 404, "Appointment ID not found in caller scope.")

    if appt["company_id"] != str(current_user.company_id):
        raise api_error(ErrorCode.APPOINTMENT_NOT_FOUND, 404, "Appointment ID not found in caller scope.")

    if current_user.role == "manager" and appt["facility_id"] != str(current_user.facility_id):
        raise api_error(ErrorCode.APPOINTMENT_NOT_FOUND, 404, "Appointment ID not found in caller scope.")

    return appt


# ---------------------------------------------------------------------------
# GET /appointments/{appointment_id}
# ---------------------------------------------------------------------------


@router.get("/appointments/{appointment_id}", status_code=status.HTTP_200_OK)
async def get_appointment(appointment_id: uuid.UUID, current_user: ManagerOrAdmin):
    """Fetch a single appointment by ID, enforcing company + facility scope."""
    appt = _fetch_appointment_scoped(str(appointment_id), current_user)
    return enrich_appointment(appt)


# ---------------------------------------------------------------------------
# POST /facilities/{facility_id}/appointments
# ---------------------------------------------------------------------------


class CreateAppointmentRequest(BaseModel):
    po_number: str
    carrier_name: str
    scheduled_start: datetime
    scheduled_end: datetime | None = None
    load_type: str  # 'palletized' | 'floor_loaded'


@router.post(
    "/facilities/{facility_id}/appointments",
    status_code=status.HTTP_201_CREATED,
)
async def create_appointment(
    facility_id: uuid.UUID,
    body: CreateAppointmentRequest,
    current_user: CurrentUser = Depends(get_current_user),
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
):
    """
    Create a new appointment for the facility.
    - Enforces facility scope
    - Validates time window (scheduled_end > scheduled_start)
    - Estimates scheduled_end via AI if omitted (ai_logic.md: SCHEDULE END PREDICTION)
    - Supports optional Idempotency-Key header
    """
    # Facility scope guard
    guard = make_facility_guard(facility_id)
    current_user = guard(current_user)

    # Validate load_type
    if body.load_type not in ("palletized", "floor_loaded"):
        raise api_error(ErrorCode.INVALID_TIME_WINDOW, 422, f"Invalid load_type: {body.load_type}")

    # Idempotency check — L1: in-process, L2: DB (Phase 12)
    if idempotency_key:
        if idempotency_key in _idempotency_cache:
            return _idempotency_cache[idempotency_key]
        db_cached = check_idempotency(idempotency_key)
        if db_cached is not None:
            _idempotency_cache[idempotency_key] = db_cached
            return db_cached

    # Resolve / estimate scheduled_end — gated on ai_autopilot feature flag
    # ai_logic.md: SCHEDULE END PREDICTION is premium-only
    if body.scheduled_end is None:
        flags = get_plan_feature_flags(str(current_user.company_id))
        if flags.get("ai_autopilot"):
            # Premium: use ML duration model
            sched_start_utc = body.scheduled_start
            if sched_start_utc.tzinfo is None:
                sched_start_utc = sched_start_utc.replace(tzinfo=timezone.utc)
            scheduled_end_dt = estimate_scheduled_end(
                str(facility_id), body.carrier_name, body.load_type, sched_start_utc
            )
            scheduled_end_str = scheduled_end_dt.isoformat()
        else:
            # Free plan: caller must supply scheduled_end
            raise api_error(
                ErrorCode.PLAN_CHANGE_NOT_ALLOWED, 422,
                "scheduled_end is required on free plan (AI prediction is a premium feature).",
            )
    else:
        scheduled_end_str = body.scheduled_end.isoformat()

    scheduled_start_str = body.scheduled_start.isoformat()

    # Validate time window
    validate_time_window(scheduled_start_str, scheduled_end_str)

    # Insert
    try:
        result = (
            service_client.table("appointments")
            .insert(
                {
                    "company_id": str(current_user.company_id),
                    "facility_id": str(facility_id),
                    "created_by_user_id": str(current_user.id),
                    "po_number": body.po_number,
                    "carrier_name": body.carrier_name,
                    "load_type": body.load_type,
                    "status": "scheduled",
                    "scheduled_start": scheduled_start_str,
                    "scheduled_end": scheduled_end_str,
                }
            )
            .execute()
        )
    except Exception as e:
        err_str = str(e).lower()
        if "unique" in err_str or "duplicate" in err_str or "conflict" in err_str or "23505" in err_str:
            raise api_error(
                ErrorCode.APPOINTMENT_PO_CONFLICT,
                409,
                "Duplicate PO in same facility + scheduled_start window.",
                {"po_number": body.po_number},
            )
        raise api_error(ErrorCode.INTERNAL_ERROR, 500, "Unexpected server-side failure.", {"detail": str(e)})

    if not result.data:
        raise api_error(ErrorCode.INTERNAL_ERROR, 500, "Unexpected server-side failure.")

    response = {
        "appointment_id": result.data[0]["id"],
        "status": "scheduled",
        "provisional_door_id": None,
    }

    # Store idempotency — L1 + L2 (Phase 12)
    if idempotency_key:
        _idempotency_cache[idempotency_key] = response
        store_idempotency(idempotency_key, response)

    # Audit: appointment_created (Phase 12)
    audit(
        "appointment_created",
        actor_kind="user",
        actor_id=str(current_user.id),
        company_id=str(current_user.company_id),
        facility_id=str(facility_id),
        resource_type="appointment",
        resource_id=result.data[0]["id"],
        metadata={"po_number": body.po_number, "carrier_name": body.carrier_name},
    )

    # Realtime: appointment_created on dashboard
    new_appt = result.data[0]
    await publish(
        f"facility:{facility_id}:dashboard",
        "appointment_created",
        build_envelope(
            "appointment_created",
            {
                "appointment": {
                    "id": new_appt["id"],
                    "po_number": body.po_number,
                    "status": "scheduled",
                    "scheduled_start": scheduled_start_str,
                    "scheduled_end": scheduled_end_str,
                    "door_id": None,
                }
            },
            facility_id=str(facility_id),
            company_id=str(current_user.company_id),
            actor_kind="user",
            actor_id=str(current_user.id),
        ),
    )

    return response


# ---------------------------------------------------------------------------
# PATCH /appointments/{appointment_id}
# ---------------------------------------------------------------------------


class UpdateAppointmentRequest(BaseModel):
    status: str | None = None
    door_id: uuid.UUID | None = None
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    carrier_name: str | None = None
    load_type: str | None = None

    model_config = {"extra": "forbid"}


@router.patch("/appointments/{appointment_id}", status_code=status.HTTP_200_OK)
async def update_appointment(
    appointment_id: uuid.UUID,
    body: UpdateAppointmentRequest,
    current_user: ManagerOrAdmin,
):
    """
    Update a mutable appointment field.
    Status changes are validated against the appointment state machine.
    """
    current = _fetch_appointment_scoped(str(appointment_id), current_user)

    updates: dict[str, Any] = {}

    # --- Status transition validation ---
    if body.status is not None:
        validate_appointment_transition(current["status"], body.status)

        # completed invariant: all 4 timestamps must be present
        if body.status == "completed":
            # Merge existing row with any updates that may supply missing timestamps
            merged = {**current}
            if body.scheduled_start:
                merged["scheduled_start"] = body.scheduled_start.isoformat()
            if body.scheduled_end:
                merged["scheduled_end"] = body.scheduled_end.isoformat()
            validate_completed_invariant(merged)

        updates["status"] = body.status

    # --- Time window validation ---
    new_start = body.scheduled_start.isoformat() if body.scheduled_start else current.get("scheduled_start")
    new_end = body.scheduled_end.isoformat() if body.scheduled_end else current.get("scheduled_end")

    if body.scheduled_start is not None or body.scheduled_end is not None:
        if new_start and new_end:
            validate_time_window(new_start, new_end)

    if body.scheduled_start is not None:
        updates["scheduled_start"] = body.scheduled_start.isoformat()
    if body.scheduled_end is not None:
        updates["scheduled_end"] = body.scheduled_end.isoformat()

    # --- Other mutable fields ---
    if body.door_id is not None:
        updates["door_id"] = str(body.door_id)
    if body.carrier_name is not None:
        updates["carrier_name"] = body.carrier_name
    if body.load_type is not None:
        if body.load_type not in ("palletized", "floor_loaded"):
            raise api_error(ErrorCode.INVALID_TIME_WINDOW, 422, f"Invalid load_type: {body.load_type}")
        updates["load_type"] = body.load_type

    if not updates:
        return enrich_appointment(current)

    # Persist
    try:
        result = (
            service_client.table("appointments")
            .update(updates)
            .eq("id", str(appointment_id))
            .execute()
        )
    except Exception as e:
        err_str = str(e).lower()
        if "unique" in err_str or "23505" in err_str:
            raise api_error(
                ErrorCode.APPOINTMENT_PO_CONFLICT, 409,
                "Duplicate PO in same facility + scheduled_start window."
            )
        raise api_error(ErrorCode.INTERNAL_ERROR, 500, "Unexpected server-side failure.", {"detail": str(e)})

    if not result.data:
        raise api_error(ErrorCode.INTERNAL_ERROR, 500, "Unexpected server-side failure.")

    updated = result.data[0]

    # Realtime: appointment_updated on dashboard
    await publish(
        f"facility:{updated['facility_id']}:dashboard",
        "appointment_updated",
        build_envelope(
            "appointment_updated",
            {"appointment_id": str(appointment_id), "changes": updates},
            facility_id=updated["facility_id"],
            company_id=updated.get("company_id", ""),
            actor_kind="user",
            actor_id=str(current_user.id),
        ),
    )

    return enrich_appointment(updated)
