"""
Device authentication middleware.

Kiosk tablets authenticate with a long-lived device_token (HS256 JWT)
rather than a Supabase user session. This module provides:
  - DeviceContext  — the decoded + DB-verified device identity
  - get_device     — FastAPI dependency that validates the Bearer token
  - require_gatehouse / require_dock — role-scoped guards
"""

import uuid
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.core.errors import ErrorCode, api_error
from app.core.supabase import service_client

_bearer = HTTPBearer(auto_error=False)

ALGORITHM = "HS256"


@dataclass
class DeviceContext:
    device_id: uuid.UUID
    facility_id: uuid.UUID
    role: str          # 'gatehouse' | 'loading_dock'
    door_id: uuid.UUID | None


def _decode_device_token(token: str) -> dict:
    """Decode and verify device JWT. Raises device_token_invalid on failure."""
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=[ALGORITHM],
            options={"verify_aud": False},
        )
        return payload
    except JWTError:
        raise api_error(ErrorCode.DEVICE_TOKEN_INVALID, 401, "Device token invalid or expired.")


async def get_device(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> DeviceContext:
    """
    FastAPI dependency for device-token authentication.
    Reads Authorization: Bearer <device_token>, decodes it,
    then confirms the device row still exists and has this token.
    """
    if not credentials:
        raise api_error(ErrorCode.DEVICE_TOKEN_INVALID, 401, "Device token missing.")

    payload = _decode_device_token(credentials.credentials)

    device_id = payload.get("device_id")
    facility_id = payload.get("facility_id")
    # role from JWT is only used for the malformed-token guard below.
    # The authoritative role is read from the DB row (line 88) to prevent
    # stale JWT claims from bypassing a role change.
    role = payload.get("role")

    if not device_id or not facility_id or not role:
        raise api_error(ErrorCode.DEVICE_TOKEN_INVALID, 401, "Device token malformed.")

    # Verify the token is still live in the DB (unpair nulls device_token).
    # Note: device.status is not checked here — 'offline' is cosmetic/display-only.
    # A device in 'offline' state may still authenticate; the dashboard uses
    # last_heartbeat_at age to determine liveness, not this field.
    result = (
        service_client.table("devices")
        .select("id, facility_id, role, door_id, device_token")
        .eq("id", device_id)
        .maybe_single()
        .execute()
    )
    device_row = result.data
    if not device_row:
        raise api_error(ErrorCode.DEVICE_TOKEN_INVALID, 401, "Device not found.")

    if device_row.get("device_token") != credentials.credentials:
        raise api_error(ErrorCode.DEVICE_TOKEN_INVALID, 401, "Device token revoked.")

    return DeviceContext(
        device_id=uuid.UUID(device_row["id"]),
        facility_id=uuid.UUID(device_row["facility_id"]),
        role=device_row["role"],
        door_id=uuid.UUID(device_row["door_id"]) if device_row.get("door_id") else None,
    )


DeviceAuth = Annotated[DeviceContext, Depends(get_device)]


def require_gatehouse(device: DeviceAuth) -> DeviceContext:
    """Guard: device must be role='gatehouse'."""
    if device.role != "gatehouse":
        raise api_error(ErrorCode.FORBIDDEN_ROLE, 403, "Endpoint requires gatehouse device.")
    return device


def require_dock(device: DeviceAuth) -> DeviceContext:
    """Guard: device must be role='loading_dock'."""
    if device.role != "loading_dock":
        raise api_error(ErrorCode.FORBIDDEN_ROLE, 403, "Endpoint requires loading_dock device.")
    return device


GatehouseDevice = Annotated[DeviceContext, Depends(require_gatehouse)]
DockDevice = Annotated[DeviceContext, Depends(require_dock)]
