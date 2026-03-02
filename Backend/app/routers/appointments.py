"""
Appointment-level endpoint:
  GET /appointments/{appointment_id}
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.db import enrich_appointment
from app.core.errors import ErrorCode, api_error
from app.core.supabase import service_client
from app.middleware.auth import CurrentUser
from app.middleware.tenancy import require_manager_or_admin

router = APIRouter(tags=["Appointments"])

ManagerOrAdmin = Annotated[CurrentUser, Depends(require_manager_or_admin)]


# ---------------------------------------------------------------------------
# GET /appointments/{appointment_id}
# ---------------------------------------------------------------------------


@router.get(
    "/appointments/{appointment_id}",
    status_code=status.HTTP_200_OK,
)
async def get_appointment(
    appointment_id: uuid.UUID,
    current_user: ManagerOrAdmin,
):
    """
    Fetch a single appointment by ID, enforcing company + facility scope.

    Security contract (per api_contracts.md):
    - Admin: must be in same company as appointment
    - Manager: must be in same company AND same facility
    - Scope violations surface as 404 (appointment_not_found) to avoid
      leaking resource existence to unprivileged callers.
    """
    result = (
        service_client.table("appointments")
        .select(
            "id, company_id, facility_id, po_number, carrier_name, load_type, "
            "status, scheduled_start, scheduled_end, actual_start, actual_end, "
            "checked_in_at, door_id, gate_device_id, dock_device_id"
        )
        .eq("id", str(appointment_id))
        .maybe_single()
        .execute()
    )

    appt = result.data
    if not appt:
        raise api_error(
            ErrorCode.APPOINTMENT_NOT_FOUND, 404, "Appointment ID not found in caller scope."
        )

    # Company scope check (admin and manager)
    if appt["company_id"] != str(current_user.company_id):
        raise api_error(
            ErrorCode.APPOINTMENT_NOT_FOUND, 404, "Appointment ID not found in caller scope."
        )

    # Facility scope check (manager only)
    if current_user.role == "manager":
        if appt["facility_id"] != str(current_user.facility_id):
            raise api_error(
                ErrorCode.APPOINTMENT_NOT_FOUND, 404, "Appointment ID not found in caller scope."
            )

    return enrich_appointment(appt)
