import uuid
from typing import Annotated

from fastapi import Depends

from app.core.errors import APIError, ErrorCode
from app.core.supabase import service_client
from app.middleware.auth import AuthUser, CurrentUser


def require_admin(current_user: AuthUser) -> CurrentUser:
    """Guard: caller must be an admin."""
    if current_user.role != "admin":
        raise APIError(
            status_code=403,
            code=ErrorCode.FORBIDDEN_ROLE,
            message="Caller role not permitted.",
        )
    return current_user


def require_manager_or_admin(current_user: AuthUser) -> CurrentUser:
    """Guard: caller must be a manager or admin."""
    if current_user.role not in ("admin", "manager"):
        raise APIError(
            status_code=403,
            code=ErrorCode.FORBIDDEN_ROLE,
            message="Caller role not permitted.",
        )
    return current_user


def _assert_facility_belongs_to_company(
    facility_id: uuid.UUID, company_id: uuid.UUID
) -> None:
    """Verify the facility exists and belongs to the caller's company."""
    result = (
        service_client.table("facilities")
        .select("id")
        .eq("id", str(facility_id))
        .eq("company_id", str(company_id))
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise APIError(
            status_code=403,
            code=ErrorCode.FACILITY_SCOPE_VIOLATION,
            message="Manager attempted out-of-facility access.",
        )


def make_facility_guard(facility_id: uuid.UUID):
    """
    Returns a FastAPI dependency that enforces facility-level scoping:
    - admin: facility must belong to caller's company
    - manager: facility must match caller's own facility_id
    """

    def facility_guard(current_user: AuthUser) -> CurrentUser:
        if current_user.role == "admin":
            _assert_facility_belongs_to_company(facility_id, current_user.company_id)
        else:
            # manager
            if current_user.facility_id != facility_id:
                raise APIError(
                    status_code=403,
                    code=ErrorCode.FACILITY_SCOPE_VIOLATION,
                    message="Manager attempted out-of-facility access.",
                )
        return current_user

    return facility_guard


# Convenient type alias for admin-only routes
AdminUser = Annotated[CurrentUser, Depends(require_admin)]

# Convenient type alias for manager-or-admin routes
ManagerOrAdminUser = Annotated[CurrentUser, Depends(require_manager_or_admin)]
