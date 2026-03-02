"""
Profile routes: GET /me, PATCH /me, POST /me/password
"""

import uuid
from typing import Any

from fastapi import APIRouter, status
from pydantic import BaseModel

from app.core.errors import APIError, ErrorCode, api_error
from app.core.supabase import anon_client, service_client
from app.middleware.auth import AuthUser

router = APIRouter(tags=["Profile"])


# ---------------------------------------------------------------------------
# Response model
# ---------------------------------------------------------------------------


class UserProfile(BaseModel):
    user_id: uuid.UUID
    company_id: uuid.UUID
    facility_id: uuid.UUID | None
    role: str
    full_name: str | None
    email: str
    phone: str | None
    oauth_provider: str
    gmail_connected_email: str | None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _fetch_full_profile(user_id: str) -> dict:
    """Fetch the complete profile row from public.users."""
    result = (
        service_client.table("users")
        .select(
            "id, company_id, facility_id, role, full_name, email, phone, "
            "oauth_provider, gmail_connected_email"
        )
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise api_error(ErrorCode.SESSION_EXPIRED, 401, "Access token expired or revoked.")
    return result.data


def _row_to_profile(row: dict) -> UserProfile:
    return UserProfile(
        user_id=row["id"],
        company_id=row["company_id"],
        facility_id=row.get("facility_id"),
        role=row["role"],
        full_name=row.get("full_name"),
        email=row["email"],
        phone=row.get("phone"),
        oauth_provider=row["oauth_provider"],
        gmail_connected_email=row.get("gmail_connected_email"),
    )


# ---------------------------------------------------------------------------
# GET /me
# ---------------------------------------------------------------------------


@router.get("/me", status_code=status.HTTP_200_OK, response_model=UserProfile)
async def get_me(current_user: AuthUser):
    """Return the caller's profile from public.users."""
    row = _fetch_full_profile(str(current_user.id))
    return _row_to_profile(row)


# ---------------------------------------------------------------------------
# PATCH /me
# ---------------------------------------------------------------------------


class UpdateMeRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None

    model_config = {"extra": "forbid"}  # additionalProperties: false per openapi.yaml


@router.patch("/me", status_code=status.HTTP_200_OK, response_model=UserProfile)
async def update_me(body: UpdateMeRequest, current_user: AuthUser):
    """Update full_name and/or phone on the caller's public.users row."""
    updates: dict[str, Any] = {}
    if body.full_name is not None:
        updates["full_name"] = body.full_name
    if body.phone is not None:
        updates["phone"] = body.phone

    if not updates:
        # Nothing to update – return current profile
        row = _fetch_full_profile(str(current_user.id))
        return _row_to_profile(row)

    result = (
        service_client.table("users")
        .update(updates)
        .eq("id", str(current_user.id))
        .execute()
    )

    if not result.data:
        raise api_error(ErrorCode.INTERNAL_ERROR, 500, "Unexpected server-side failure.")

    return _row_to_profile(result.data[0])


# ---------------------------------------------------------------------------
# POST /me/password
# ---------------------------------------------------------------------------


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/me/password", status_code=status.HTTP_200_OK)
async def change_password(body: ChangePasswordRequest, current_user: AuthUser):
    """
    Change the caller's password.
    1. Re-authenticate with current_password to verify it's correct.
    2. Use service role to update the credential hash via admin API.
    """
    # Step 1: Verify current password by attempting sign-in
    try:
        verify_result = anon_client.auth.sign_in_with_password(
            {"email": current_user.email, "password": body.current_password}
        )
    except Exception:
        raise api_error(
            ErrorCode.INVALID_CREDENTIALS, 401, "Email/password mismatch."
        )

    if not verify_result.session:
        raise api_error(ErrorCode.INVALID_CREDENTIALS, 401, "Email/password mismatch.")

    # Step 2: Update password via admin API
    try:
        service_client.auth.admin.update_user_by_id(
            str(current_user.id),
            {"password": body.new_password},
        )
    except Exception as e:
        raise api_error(
            ErrorCode.UPSTREAM_UNAVAILABLE, 503, "Auth provider error.", {"detail": str(e)}
        )

    # Sign out the verification session we just created to keep things clean
    try:
        anon_client.auth.sign_out()
    except Exception:
        pass

    return {"success": True}
