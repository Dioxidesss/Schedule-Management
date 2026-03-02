"""
Auth routes: signup, login, Google OAuth, logout.

These are optional server-side wrappers over Supabase Auth.
The frontend may call Supabase directly for login/OAuth; however,
signup MUST go through this endpoint so the server can atomically
bootstrap public.users and companies using the service role key.
"""

import uuid
from typing import Any

from fastapi import APIRouter, status
from pydantic import BaseModel, EmailStr

from app.core.errors import APIError, ErrorCode, api_error
from app.core.supabase import anon_client, service_client
from app.middleware.auth import AuthUser

router = APIRouter(prefix="/auth", tags=["Auth"])


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    company_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleOAuthRequest(BaseModel):
    google_id_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class AuthSession(BaseModel):
    user_id: uuid.UUID
    role: str
    company_id: uuid.UUID
    facility_id: uuid.UUID | None
    access_token: str
    refresh_token: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_session(auth_user_id: str, session: Any, role: str, company_id: str, facility_id: str | None) -> dict:
    return {
        "user_id": auth_user_id,
        "role": role,
        "company_id": company_id,
        "facility_id": facility_id,
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
    }


def _fetch_user_profile_for_session(auth_uid: str) -> dict:
    """Fetch public.users row to get role/company/facility for the session response."""
    result = (
        service_client.table("users")
        .select("role, company_id, facility_id")
        .eq("id", auth_uid)
        .single()
        .execute()
    )
    if not result.data:
        raise api_error(
            ErrorCode.SESSION_EXPIRED, 401, "Access token expired or revoked."
        )
    return result.data


# ---------------------------------------------------------------------------
# POST /auth/signup
# ---------------------------------------------------------------------------


@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=AuthSession)
async def signup(body: SignupRequest):
    """
    Create a new admin user + company in one atomic server-side flow:
    1. Sign up in Supabase Auth (auth.users)
    2. Insert companies row
    3. Insert public.users row (role=admin, oauth_provider=email)
    """
    # Step 1: Create auth.users entry
    try:
        auth_result = service_client.auth.admin.create_user(
            {
                "email": body.email,
                "password": body.password,
                "user_metadata": {"full_name": body.full_name},
                "email_confirm": True,  # auto-confirm for server-side signup
            }
        )
    except Exception as e:
        err_str = str(e).lower()
        if "already registered" in err_str or "already exists" in err_str or "unique" in err_str:
            raise api_error(
                ErrorCode.INVITE_EMAIL_CONFLICT,
                409,
                "Email already belongs to active user.",
            )
        raise api_error(ErrorCode.UPSTREAM_UNAVAILABLE, 503, "Auth provider error.", {"detail": str(e)})

    auth_uid = auth_result.user.id

    # Step 2: Create company
    company_result = (
        service_client.table("companies")
        .insert({"name": body.company_name})
        .execute()
    )
    if not company_result.data:
        # Rollback: delete the auth user to avoid orphaned auth.users row
        try:
            service_client.auth.admin.delete_user(auth_uid)
        except Exception:
            pass
        raise api_error(ErrorCode.INTERNAL_ERROR, 500, "Unexpected server-side failure.")

    company_id = company_result.data[0]["id"]

    # Step 3: Insert public.users row
    users_result = (
        service_client.table("users")
        .insert(
            {
                "id": auth_uid,
                "company_id": company_id,
                "role": "admin",
                "full_name": body.full_name,
                "email": body.email,
                "oauth_provider": "email",
                "is_active": True,
            }
        )
        .execute()
    )
    if not users_result.data:
        try:
            service_client.auth.admin.delete_user(auth_uid)
        except Exception:
            pass
        raise api_error(ErrorCode.INTERNAL_ERROR, 500, "Unexpected server-side failure.")

    # Step 4: Sign in to get a live session (tokens)
    try:
        session_result = anon_client.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception as e:
        raise api_error(ErrorCode.UPSTREAM_UNAVAILABLE, 503, "Auth provider error.", {"detail": str(e)})

    return AuthSession(
        user_id=auth_uid,
        role="admin",
        company_id=company_id,
        facility_id=None,
        access_token=session_result.session.access_token,
        refresh_token=session_result.session.refresh_token,
    )


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------


@router.post("/login", status_code=status.HTTP_200_OK, response_model=AuthSession)
async def login(body: LoginRequest):
    """Email/password sign-in wrapper over Supabase Auth."""
    try:
        result = anon_client.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception as e:
        err_str = str(e).lower()
        if "invalid" in err_str or "credentials" in err_str or "password" in err_str:
            raise api_error(ErrorCode.INVALID_CREDENTIALS, 401, "Email/password mismatch.")
        raise api_error(ErrorCode.UPSTREAM_UNAVAILABLE, 503, "Auth provider error.", {"detail": str(e)})

    if not result.session:
        raise api_error(ErrorCode.INVALID_CREDENTIALS, 401, "Email/password mismatch.")

    auth_uid = result.user.id
    profile = _fetch_user_profile_for_session(auth_uid)

    return AuthSession(
        user_id=auth_uid,
        role=profile["role"],
        company_id=profile["company_id"],
        facility_id=profile.get("facility_id"),
        access_token=result.session.access_token,
        refresh_token=result.session.refresh_token,
    )


# ---------------------------------------------------------------------------
# POST /auth/oauth/google
# ---------------------------------------------------------------------------


@router.post("/oauth/google", status_code=status.HTTP_200_OK, response_model=AuthSession)
async def oauth_google(body: GoogleOAuthRequest):
    """
    Exchange a Google ID token for a Supabase session, then upsert the
    public.users row with oauth_provider='google'.
    """
    try:
        result = anon_client.auth.sign_in_with_id_token(
            {"provider": "google", "token": body.google_id_token}
        )
    except Exception as e:
        raise api_error(
            ErrorCode.GOOGLE_TOKEN_INVALID, 401, "Google ID token verification failed.", {"detail": str(e)}
        )

    if not result.session or not result.user:
        raise api_error(ErrorCode.GOOGLE_TOKEN_INVALID, 401, "Google ID token verification failed.")

    auth_uid = result.user.id
    email = result.user.email or ""
    full_name = (result.user.user_metadata or {}).get("full_name") or (result.user.user_metadata or {}).get("name")

    # Check if public.users row already exists
    existing = (
        service_client.table("users")
        .select("id, role, company_id, facility_id")
        .eq("id", auth_uid)
        .maybe_single()
        .execute()
    )

    if existing.data:
        # Update oauth fields on existing row
        service_client.table("users").update(
            {"oauth_provider": "google", "oauth_token": body.google_id_token}
        ).eq("id", auth_uid).execute()
        profile = existing.data
    else:
        # First Google sign-in: bootstrap company + user row
        company_result = (
            service_client.table("companies").insert({"name": f"{full_name or email}'s Company"}).execute()
        )
        if not company_result.data:
            raise api_error(ErrorCode.INTERNAL_ERROR, 500, "Unexpected server-side failure.")

        company_id = company_result.data[0]["id"]
        service_client.table("users").insert(
            {
                "id": auth_uid,
                "company_id": company_id,
                "role": "admin",
                "full_name": full_name,
                "email": email,
                "oauth_provider": "google",
                "oauth_token": body.google_id_token,
                "is_active": True,
            }
        ).execute()

        profile = {"role": "admin", "company_id": company_id, "facility_id": None}

    return AuthSession(
        user_id=auth_uid,
        role=profile["role"],
        company_id=profile["company_id"],
        facility_id=profile.get("facility_id"),
        access_token=result.session.access_token,
        refresh_token=result.session.refresh_token,
    )


# ---------------------------------------------------------------------------
# POST /auth/logout
# ---------------------------------------------------------------------------


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(body: LogoutRequest, current_user: AuthUser):
    """Revoke the caller's session via Supabase Admin API."""
    try:
        # Sign out all sessions for this user (safest approach)
        service_client.auth.admin.sign_out(body.refresh_token)
    except Exception as e:
        raise api_error(ErrorCode.UPSTREAM_UNAVAILABLE, 503, "Auth provider error.", {"detail": str(e)})

    return {"success": True}
