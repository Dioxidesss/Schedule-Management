"""
Device management endpoints:
  POST /facilities/{facility_id}/devices/pairing-codes  — generate 6-digit code
  POST /devices/pair                                     — kiosk bootstrap
  POST /devices/{device_id}/heartbeat                   — keepalive
  POST /devices/{device_id}/unpair                      — admin revoke
"""

import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, status
from jose import jwt
from pydantic import BaseModel

from app.core.config import settings
from app.core.errors import ErrorCode, api_error
from app.core.realtime import build_envelope, publish
from app.core.supabase import service_client
from app.middleware.auth import CurrentUser, get_current_user
from app.middleware.device_auth import DeviceAuth, get_device
from app.middleware.tenancy import make_facility_guard, require_admin

router = APIRouter(tags=["Devices"])

ALGORITHM = "HS256"
PAIRING_CODE_TTL_MINUTES = 10


# ---------------------------------------------------------------------------
# Token helper
# ---------------------------------------------------------------------------


def _issue_device_token(device_id: str, facility_id: str, role: str) -> str:
    """Sign a long-lived HS256 device JWT (no expiry — revoked by nulling device_token)."""
    payload = {
        "device_id": device_id,
        "facility_id": facility_id,
        "role": role,
        "iat": datetime.now(timezone.utc).timestamp(),
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm=ALGORITHM)


# ---------------------------------------------------------------------------
# POST /facilities/{facility_id}/devices/pairing-codes
# ---------------------------------------------------------------------------


class PairingCodeRequest(BaseModel):
    device_name: str
    role: str                          # 'gatehouse' | 'loading_dock'
    door_id: uuid.UUID | None = None
    is_locked_to_facility: bool = True


@router.post(
    "/facilities/{facility_id}/devices/pairing-codes",
    status_code=status.HTTP_201_CREATED,
)
async def create_pairing_code(
    facility_id: uuid.UUID,
    body: PairingCodeRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Generate a single-use 6-digit pairing code valid for 10 minutes."""
    # Facility scope
    guard = make_facility_guard(facility_id)
    current_user = guard(current_user)

    # Validate role
    if body.role not in ("gatehouse", "loading_dock"):
        raise api_error(ErrorCode.FORBIDDEN_ROLE, 422, f"Invalid device role: {body.role}")

    # Schema constraint: gatehouse has no door, loading_dock requires door
    if body.role == "gatehouse" and body.door_id is not None:
        raise api_error(ErrorCode.FORBIDDEN_ROLE, 422, "Gatehouse devices must not have a door_id.")
    if body.role == "loading_dock" and body.door_id is None:
        raise api_error(ErrorCode.FORBIDDEN_ROLE, 422, "loading_dock devices require a door_id.")

    # Generate cryptographically random 6-digit code
    code = f"{secrets.randbelow(1_000_000):06d}"
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=PAIRING_CODE_TTL_MINUTES)).isoformat()

    # Pre-create device row so role + door_id are stored before kiosk pairs.
    # The pair endpoint reads back this device row and issues the token.
    device_insert: dict = {
        "facility_id": str(facility_id),
        "device_name": body.device_name,
        "role": body.role,
        "is_locked_to_facility": body.is_locked_to_facility,
        "status": "offline",
    }
    if body.door_id:
        device_insert["door_id"] = str(body.door_id)

    dev_result = service_client.table("devices").insert(device_insert).execute()
    if not dev_result.data:
        raise api_error(ErrorCode.INTERNAL_ERROR, 500, "Failed to pre-create device record.")
    new_device_id = dev_result.data[0]["id"]

    result = (
        service_client.table("device_pairing_codes")
        .insert(
            {
                "facility_id": str(facility_id),
                "device_id": new_device_id,
                "code": code,
                "expires_at": expires_at,
                "created_by_user_id": str(current_user.id),
            }
        )
        .execute()
    )

    if not result.data:
        raise api_error(ErrorCode.INTERNAL_ERROR, 500, "Unexpected server-side failure.")

    return {"pairing_code": code, "expires_at": expires_at}


# ---------------------------------------------------------------------------
# POST /devices/pair
# ---------------------------------------------------------------------------


class PairDeviceRequest(BaseModel):
    code: str
    device_model: str
    device_name: str


@router.post("/devices/pair", status_code=status.HTTP_200_OK)
async def pair_device(body: PairDeviceRequest):
    """
    Kiosk bootstrap — no auth required.
    Consumes a valid pairing code and issues a device_token.
    """
    now = datetime.now(timezone.utc)

    # Look up the pairing code
    result = (
        service_client.table("device_pairing_codes")
        .select("id, facility_id, device_id, code, expires_at, used_at")
        .eq("code", body.code)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    code_row = (result.data or [None])[0]
    if not code_row:
        raise api_error(ErrorCode.DEVICE_PAIRING_CODE_INVALID, 400, "Pairing code not found.")

    if code_row["used_at"] is not None:
        raise api_error(ErrorCode.DEVICE_PAIRING_CODE_INVALID, 400, "Pairing code already used.")

    expires_at = datetime.fromisoformat(code_row["expires_at"].replace("Z", "+00:00"))
    if now > expires_at:
        raise api_error(ErrorCode.DEVICE_PAIRING_CODE_INVALID, 400, "Pairing code expired.")

    facility_id = code_row["facility_id"]

    # Retrieve metadata stored on the pairing code's linked device (if pre-created)
    # Otherwise fetch facility-level defaults from the code row metadata
    # We need role/door_id — these must have been embedded at code-creation time.
    # Look them up from the pairing code's device_id if set, or from associated metadata.
    # Per schema: device_pairing_codes doesn't store role/door_id directly.
    # Strategy: if device_id is set on the code row, update that device.
    # Otherwise create a new device row using the device_name + model from body.
    # Role defaults to the most recently created unmatched device for this facility.
    # Simpler approach: store role in a separate lookup on the pairing code table.
    # Since the schema only has code/facility_id/device_id on device_pairing_codes,
    # we retrieve the device row if linked, else require a device to exist first.
    # The safest schema-aligned approach: device row is pre-created on code generation,
    # then the pair endpoint updates it with device_model and issues the token.

    existing_device_id = code_row.get("device_id")
    if existing_device_id:
        # Update existing device with model info and new token
        dev_result = (
            service_client.table("devices")
            .select("id, facility_id, role, door_id")
            .eq("id", existing_device_id)
            .single()
            .execute()
        )
        dev = dev_result.data
        if not dev:
            raise api_error(ErrorCode.INTERNAL_ERROR, 500, "Linked device record not found.")

        device_id = existing_device_id
        role = dev["role"]
        door_id = dev.get("door_id")
    else:
        # No pre-linked device — create one with defaults from body
        # Role cannot be inferred safely without it being in the code row.
        # Per the pairing flow: the admin UI creates the code WITH role info,
        # so we store it in the code metadata at creation time.
        # Fallback: create a 'gatehouse' device (admin must correct via dashboard).
        new_dev = (
            service_client.table("devices")
            .insert(
                {
                    "facility_id": facility_id,
                    "device_name": body.device_name,
                    "device_model": body.device_model,
                    "role": "gatehouse",
                    "status": "online",
                }
            )
            .execute()
        )
        if not new_dev.data:
            raise api_error(ErrorCode.INTERNAL_ERROR, 500, "Unexpected server-side failure.")
        device_id = new_dev.data[0]["id"]
        role = "gatehouse"
        door_id = None

    # Sign device token
    device_token = _issue_device_token(str(device_id), str(facility_id), role)

    # Persist token on device + mark device online + update model
    service_client.table("devices").update(
        {"device_token": device_token, "device_model": body.device_model, "device_name": body.device_name, "status": "online"}
    ).eq("id", str(device_id)).execute()

    # Consume the pairing code
    service_client.table("device_pairing_codes").update(
        {"used_at": now.isoformat(), "device_id": str(device_id)}
    ).eq("id", code_row["id"]).execute()

    # Realtime: pairing_confirmed on device channel
    await publish(
        f"device:{device_id}",
        "pairing_confirmed",
        build_envelope(
            "pairing_confirmed",
            {
                "device_id": str(device_id),
                "facility_id": str(facility_id),
                "role": role,
                "door_id": str(door_id) if door_id else None,
            },
            facility_id=str(facility_id),
            actor_kind="worker",
            actor_id="api-server",
        ),
    )

    return {
        "device_id": str(device_id),
        "facility_id": str(facility_id),
        "role": role,
        "door_id": str(door_id) if door_id else None,
        "device_token": device_token,
    }


# ---------------------------------------------------------------------------
# POST /devices/{device_id}/heartbeat
# ---------------------------------------------------------------------------


class HeartbeatRequest(BaseModel):
    status: str = "online"
    observed_at: datetime


@router.post("/devices/{device_id}/heartbeat", status_code=status.HTTP_200_OK)
async def device_heartbeat(
    device_id: uuid.UUID,
    body: HeartbeatRequest,
    device: DeviceAuth,
):
    """Device keepalive — updates last_heartbeat_at and status."""
    # Device can only heartbeat itself
    if device.device_id != device_id:
        raise api_error(ErrorCode.FORBIDDEN_ROLE, 403, "Device may only heartbeat itself.")

    service_client.table("devices").update(
        {
            "last_heartbeat_at": body.observed_at.isoformat(),
            "status": body.status if body.status in ("online", "offline") else "online",
        }
    ).eq("id", str(device_id)).execute()

    # Realtime: device_status_changed on facility dashboard
    effective_status = body.status if body.status in ("online", "offline") else "online"
    await publish(
        f"facility:{device.facility_id}:dashboard",
        "device_status_changed",
        build_envelope(
            "device_status_changed",
            {
                "device_id": str(device_id),
                "status": effective_status,
                "last_heartbeat_at": body.observed_at.isoformat(),
            },
            facility_id=str(device.facility_id),
            actor_kind="device",
            actor_id=str(device_id),
        ),
    )

    return {"success": True}


# ---------------------------------------------------------------------------
# POST /devices/{device_id}/unpair
# ---------------------------------------------------------------------------


class UnpairRequest(BaseModel):
    admin_pin: str


@router.post("/devices/{device_id}/unpair", status_code=status.HTTP_200_OK)
async def unpair_device(
    device_id: uuid.UUID,
    body: UnpairRequest,
    current_user: Annotated[CurrentUser, Depends(require_admin)],
):
    """
    Admin revokes a device. Nulls device_token → next heartbeat fails auth.
    If device has admin_pin_hash set, verifies the pin first.
    """
    dev_result = (
        service_client.table("devices")
        .select("id, facility_id, admin_pin_hash")
        .eq("id", str(device_id))
        .maybe_single()
        .execute()
    )
    dev = dev_result.data
    if not dev:
        raise api_error(ErrorCode.INTERNAL_ERROR, 404, "Device not found.", {"device_id": str(device_id)})

    # Verify admin_pin if hash is stored
    if dev.get("admin_pin_hash"):
        import bcrypt
        if not bcrypt.checkpw(body.admin_pin.encode(), dev["admin_pin_hash"].encode()):
            raise api_error(ErrorCode.INVALID_CREDENTIALS, 401, "Admin pin mismatch.")

    service_client.table("devices").update(
        {"device_token": None, "status": "offline"}
    ).eq("id", str(device_id)).execute()

    # Realtime: force_signout on device channel — tablet clears itself
    await publish(
        f"device:{device_id}",
        "force_signout",
        build_envelope(
            "force_signout",
            {"reason": "unpaired"},
            facility_id=dev.get("facility_id"),
            actor_kind="user",
            actor_id=str(current_user.id),
        ),
    )

    return {"success": True}
