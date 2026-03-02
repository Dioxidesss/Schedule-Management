"""
Facility-scoped endpoints:
  GET /facilities/{facility_id}/dashboard
  GET /facilities/{facility_id}/appointments
  GET /facilities/{facility_id}/devices
"""

import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.db import compute_door_statuses, enrich_appointment, get_plan_feature_flags
from app.core.errors import ErrorCode, api_error
from app.core.supabase import service_client
from app.middleware.auth import AuthUser, CurrentUser, get_current_user
from app.middleware.tenancy import make_facility_guard

router = APIRouter(tags=["Facilities"])




# ---------------------------------------------------------------------------
# GET /facilities/{facility_id}/dashboard
# ---------------------------------------------------------------------------


@router.get(
    "/facilities/{facility_id}/dashboard",
    status_code=status.HTTP_200_OK,
)
async def get_facility_dashboard(
    facility_id: uuid.UUID,
    date_param: Annotated[date | None, Query(alias="date")] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    # Enforce scope — re-resolve guard inside handler (FastAPI doesn't allow
    # dynamic path params in Depends at declaration time cleanly)
    guard = make_facility_guard(facility_id)
    current_user = guard(current_user)

    # Resolve facility timezone
    fac_result = (
        service_client.table("facilities")
        .select("id, timezone")
        .eq("id", str(facility_id))
        .single()
        .execute()
    )
    if not fac_result.data:
        raise api_error(ErrorCode.FACILITY_SCOPE_VIOLATION, 403, "Manager attempted out-of-facility access.")

    # Default date = today
    if date_param is None:
        date_param = datetime.now(timezone.utc).date()

    date_str = date_param.isoformat()
    next_date_str = (date_param + timedelta(days=1)).isoformat()

    # 1. Appointments for the day
    appt_result = (
        service_client.table("appointments")
        .select(
            "id, company_id, facility_id, po_number, carrier_name, load_type, "
            "status, scheduled_start, scheduled_end, actual_start, actual_end, "
            "checked_in_at, door_id, gate_device_id, dock_device_id"
        )
        .eq("facility_id", str(facility_id))
        .gte("scheduled_start", f"{date_str}T00:00:00+00:00")
        .lt("scheduled_start", f"{next_date_str}T00:00:00+00:00")
        .order("scheduled_start", desc=False)
        .execute()
    )
    appointments = [enrich_appointment(r) for r in (appt_result.data or [])]

    # 2. Yard queue (all statuses='yard_queue' for this facility, ordered by checked_in_at)
    queue_result = (
        service_client.table("appointments")
        .select("id, po_number, checked_in_at")
        .eq("facility_id", str(facility_id))
        .eq("status", "yard_queue")
        .order("checked_in_at", desc=False)
        .execute()
    )
    yard_queue = [
        {
            "appointment_id": r["id"],
            "po_number": r["po_number"],
            "checked_in_at": r["checked_in_at"],
            "queue_position": i + 1,
        }
        for i, r in enumerate(queue_result.data or [])
    ]

    # 3. Door occupancy (derived from today's appointments)
    doors = compute_door_statuses(str(facility_id), appointments)

    # 4. Devices
    dev_result = (
        service_client.table("devices")
        .select("id, facility_id, door_id, device_name, device_model, role, status, last_heartbeat_at")
        .eq("facility_id", str(facility_id))
        .execute()
    )
    devices = dev_result.data or []

    # 5. Feature flags
    feature_flags = get_plan_feature_flags(str(current_user.company_id))

    return {
        "facility_id": str(facility_id),
        "date": date_str,
        "appointments": appointments,
        "yard_queue": yard_queue,
        "doors": doors,
        "devices": devices,
        "feature_flags": feature_flags,
    }


# ---------------------------------------------------------------------------
# GET /facilities/{facility_id}/appointments
# ---------------------------------------------------------------------------


@router.get(
    "/facilities/{facility_id}/appointments",
    status_code=status.HTTP_200_OK,
)
async def list_appointments(
    facility_id: uuid.UUID,
    date_param: Annotated[date, Query(alias="date")],
    appt_status: Annotated[str | None, Query(alias="status")] = None,
    po_number: Annotated[str | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    current_user: CurrentUser = Depends(get_current_user),
):
    guard = make_facility_guard(facility_id)
    current_user = guard(current_user)

    # Validate status if provided
    valid_statuses = {"scheduled", "yard_queue", "assigned", "unloading", "completed", "cancelled", "no_show"}
    if appt_status and appt_status not in valid_statuses:
        raise api_error(ErrorCode.INVALID_STATUS_TRANSITION, 422, f"Invalid status value: {appt_status}")

    date_str = date_param.isoformat()
    next_date_str = (date_param + timedelta(days=1)).isoformat()

    fields = (
        "id, company_id, facility_id, po_number, carrier_name, load_type, "
        "status, scheduled_start, scheduled_end, actual_start, actual_end, "
        "checked_in_at, door_id, gate_device_id, dock_device_id"
    )

    # Build query with optional filters
    query = (
        service_client.table("appointments")
        .select(fields, count="exact")
        .eq("facility_id", str(facility_id))
        .gte("scheduled_start", f"{date_str}T00:00:00+00:00")
        .lt("scheduled_start", f"{next_date_str}T00:00:00+00:00")
    )

    if appt_status:
        query = query.eq("status", appt_status)

    if po_number:
        query = query.ilike("po_number", f"%{po_number}%")

    # Pagination
    offset = (page - 1) * page_size
    query = query.order("scheduled_start", desc=False).range(offset, offset + page_size - 1)

    result = query.execute()
    items = [enrich_appointment(r) for r in (result.data or [])]
    total = result.count or 0

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
    }


# ---------------------------------------------------------------------------
# GET /facilities/{facility_id}/devices
# ---------------------------------------------------------------------------


@router.get(
    "/facilities/{facility_id}/devices",
    status_code=status.HTTP_200_OK,
)
async def list_facility_devices(
    facility_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
):
    guard = make_facility_guard(facility_id)
    current_user = guard(current_user)

    result = (
        service_client.table("devices")
        .select("id, facility_id, door_id, device_name, device_model, role, status, last_heartbeat_at")
        .eq("facility_id", str(facility_id))
        .execute()
    )
    return result.data or []
