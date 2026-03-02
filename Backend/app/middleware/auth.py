import uuid
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError, jwt
from pydantic import BaseModel

from app.core.config import settings
from app.core.errors import APIError, ErrorCode
from app.core.supabase import service_client

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    id: uuid.UUID
    role: str
    company_id: uuid.UUID
    facility_id: uuid.UUID | None
    email: str
    full_name: str | None
    is_active: bool

    model_config = {"from_attributes": True}


def _decode_jwt(token: str) -> dict:
    """
    Decode and verify a Supabase-issued JWT using the project JWT secret.
    Raises APIError with session_expired on any failure.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase JWTs don't always carry aud
        )
        return payload
    except ExpiredSignatureError:
        raise APIError(
            status_code=401,
            code=ErrorCode.SESSION_EXPIRED,
            message="Access token expired or revoked.",
        )
    except JWTError:
        raise APIError(
            status_code=401,
            code=ErrorCode.SESSION_EXPIRED,
            message="Access token expired or revoked.",
        )


def _fetch_user_row(user_id: str) -> dict:
    """
    Fetch the public.users row for the given auth UID.
    Uses the service client so the fetch works regardless of incoming JWT state.
    """
    result = (
        service_client.table("users")
        .select(
            "id, role, company_id, facility_id, email, full_name, is_active"
        )
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise APIError(
            status_code=401,
            code=ErrorCode.SESSION_EXPIRED,
            message="Access token expired or revoked.",
        )
    return result.data


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> CurrentUser:
    """
    FastAPI dependency: extracts Bearer JWT, verifies it, fetches the
    public.users row, and returns a CurrentUser.
    """
    if not credentials:
        raise APIError(
            status_code=401,
            code=ErrorCode.SESSION_EXPIRED,
            message="Access token expired or revoked.",
        )

    payload = _decode_jwt(credentials.credentials)
    user_id: str = payload.get("sub", "")
    if not user_id:
        raise APIError(
            status_code=401,
            code=ErrorCode.SESSION_EXPIRED,
            message="Access token expired or revoked.",
        )

    row = _fetch_user_row(user_id)

    if not row.get("is_active", False):
        raise APIError(
            status_code=403,
            code=ErrorCode.FORBIDDEN_ROLE,
            message="Caller role not permitted.",
        )

    return CurrentUser(**row)


# Convenience type alias for route signatures
AuthUser = Annotated[CurrentUser, Depends(get_current_user)]
