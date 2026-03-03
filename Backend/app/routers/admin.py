"""
Admin team management endpoints:
  GET  /admin/team                              — list managers
  POST /admin/team/invites                      — create invite (admin only)
  POST /admin/team/invites/{invite_id}/resend   — rotate token/expiry
  POST /admin/team/invites/{token}/accept       — accept invite (no auth)
  PATCH /admin/team/{user_id}/revoke            — deactivate manager

Realtime events emitted to company:{company_id}:team:
  invite_created, invite_resent, invite_accepted, manager_revoked
"""

import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, status
from pydantic import BaseModel, EmailStr

from app.core.errors import ErrorCode, api_error
from app.core.realtime import build_envelope, publish
from app.core.supabase import service_client
from app.middleware.tenancy import AdminUser

router = APIRouter(prefix="/admin", tags=["Admin"])

INVITE_TTL_DAYS = 7


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _generate_invite_token() -> str:
    """Cryptographically random 48-char URL-safe token."""
    return secrets.token_urlsafe(36)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _expires_iso(days: int = INVITE_TTL_DAYS) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


# ---------------------------------------------------------------------------
# GET /admin/team
# ---------------------------------------------------------------------------


@router.get("/team", status_code=status.HTTP_200_OK)
async def list_team(current_user: AdminUser):
    """List all managers in the caller's company with profile + facility + status."""
    result = (
        service_client.table("users")
        .select("id, full_name, email, phone, role, facility_id, is_active, created_at")
        .eq("company_id", str(current_user.company_id))
        .eq("role", "manager")
        .order("created_at", desc=False)
        .execute()
    )
    managers = result.data or []

    # Fetch pending invites for this company so the UI can show invited-but-not-joined
    invite_result = (
        service_client.table("manager_invites")
        .select("id, full_name, email, facility_id, status, expires_at, created_at")
        .eq("company_id", str(current_user.company_id))
        .in_("status", ["pending", "expired"])
        .order("created_at", desc=True)
        .execute()
    )

    return {
        "managers": managers,
        "invites": invite_result.data or [],
    }


# ---------------------------------------------------------------------------
# POST /admin/team/invites
# ---------------------------------------------------------------------------


class CreateInviteRequest(BaseModel):
    full_name: str
    email: EmailStr
    facility_id: uuid.UUID


@router.post("/team/invites", status_code=status.HTTP_201_CREATED)
async def create_invite(body: CreateInviteRequest, current_user: AdminUser):
    """
    Create a manager invite for the given email + facility.
    state_machines.md: invite starts as 'pending'.
    """
    # Guard: email must not already be an active user
    existing_user = (
        service_client.table("users")
        .select("id")
        .eq("email", body.email)
        .eq("is_active", True)
        .maybe_single()
        .execute()
    )
    if existing_user.data:
        raise api_error(ErrorCode.INVITE_EMAIL_CONFLICT, 409, "Email already belongs to active user.")

    # Guard: facility must belong to caller's company
    fac = (
        service_client.table("facilities")
        .select("id")
        .eq("id", str(body.facility_id))
        .eq("company_id", str(current_user.company_id))
        .maybe_single()
        .execute()
    )
    if not fac.data:
        raise api_error(ErrorCode.FACILITY_SCOPE_VIOLATION, 403, "Facility not in caller's company.")

    token = _generate_invite_token()
    expires_at = _expires_iso()

    result = (
        service_client.table("manager_invites")
        .insert({
            "company_id": str(current_user.company_id),
            "facility_id": str(body.facility_id),
            "invited_by_user_id": str(current_user.id),
            "full_name": body.full_name,
            "email": body.email,
            "status": "pending",
            "invite_token": token,
            "expires_at": expires_at,
        })
        .execute()
    )
    if not result.data:
        raise api_error(ErrorCode.INTERNAL_ERROR, 500, "Unexpected server-side failure.")

    invite = result.data[0]

    # Realtime: invite_created → company:{id}:team
    await publish(
        f"company:{current_user.company_id}:team",
        build_envelope(
            event_type="invite_created",
            facility_id=str(body.facility_id),
            company_id=str(current_user.company_id),
            actor={"kind": "user", "id": str(current_user.id)},
            payload={
                "invite_id": invite["id"],
                "email": body.email,
                "full_name": body.full_name,
                "facility_id": str(body.facility_id),
                "expires_at": expires_at,
            },
        ),
    )

    return {
        "invite_id": invite["id"],
        "status": "pending",
        "expires_at": expires_at,
    }


# ---------------------------------------------------------------------------
# POST /admin/team/invites/{invite_id}/resend
# ---------------------------------------------------------------------------


@router.post("/team/invites/{invite_id}/resend", status_code=status.HTTP_200_OK)
async def resend_invite(invite_id: uuid.UUID, current_user: AdminUser):
    """
    Rotate the invite token + expiry (works on pending or expired invites).
    state_machines.md: expired → pending (resend creates/rotates token + expiry).
    """
    inv_result = (
        service_client.table("manager_invites")
        .select("id, company_id, status, email, facility_id")
        .eq("id", str(invite_id))
        .maybe_single()
        .execute()
    )
    invite = inv_result.data
    if not invite:
        raise api_error(ErrorCode.INVITE_NOT_FOUND, 404, "Invite not found.")

    if invite["company_id"] != str(current_user.company_id):
        raise api_error(ErrorCode.COMPANY_SCOPE_VIOLATION, 403, "Resource belongs to different company.")

    if invite["status"] == "accepted":
        raise api_error(ErrorCode.INVITE_ALREADY_ACCEPTED, 409, "Cannot resend an accepted invite.")

    if invite["status"] == "revoked":
        raise api_error(ErrorCode.INVITE_NOT_FOUND, 404, "Cannot resend a revoked invite.")

    new_token = _generate_invite_token()
    new_expires = _expires_iso()
    resent_at = _now_iso()

    service_client.table("manager_invites").update({
        "invite_token": new_token,
        "expires_at": new_expires,
        "status": "pending",  # expired → pending transition
    }).eq("id", str(invite_id)).execute()

    # Realtime: invite_resent → company:{id}:team
    await publish(
        f"company:{current_user.company_id}:team",
        build_envelope(
            event_type="invite_resent",
            facility_id=invite.get("facility_id"),
            company_id=str(current_user.company_id),
            actor={"kind": "user", "id": str(current_user.id)},
            payload={
                "invite_id": str(invite_id),
                "email": invite["email"],
                "new_expires_at": new_expires,
                "resent_at": resent_at,
            },
        ),
    )

    return {"invite_id": str(invite_id), "resent_at": resent_at}


# ---------------------------------------------------------------------------
# POST /admin/team/invites/{token}/accept
# ---------------------------------------------------------------------------


class AcceptInviteRequest(BaseModel):
    password: str | None = None
    google_oauth_token: str | None = None


@router.post("/team/invites/{token}/accept", status_code=status.HTTP_201_CREATED)
async def accept_invite(token: str, body: AcceptInviteRequest):
    """
    Redeem an invite token to create a manager user.
    state_machines.md: pending → accepted.
    Auth: none (bootstrap endpoint — invite token is the credential).
    """
    # Look up invite by token
    inv_result = (
        service_client.table("manager_invites")
        .select("id, company_id, facility_id, full_name, email, status, expires_at")
        .eq("invite_token", token)
        .maybe_single()
        .execute()
    )
    invite = inv_result.data
    if not invite:
        raise api_error(ErrorCode.INVITE_NOT_FOUND, 404, "Invite not found.")

    if invite["status"] == "accepted":
        raise api_error(ErrorCode.INVITE_ALREADY_ACCEPTED, 409, "Invite already accepted.")

    if invite["status"] in ("revoked", "expired"):
        raise api_error(ErrorCode.INVITE_EXPIRED, 410, "Invite expired or revoked.")

    # Check expiry
    expires_at = datetime.fromisoformat(invite["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        # Auto-expire
        service_client.table("manager_invites").update({"status": "expired"}).eq(
            "id", invite["id"]
        ).execute()
        raise api_error(ErrorCode.INVITE_EXPIRED, 410, "Invite past expires_at.")

    email = invite["email"]
    full_name = invite["full_name"]
    company_id = invite["company_id"]
    facility_id = invite["facility_id"]

    # Create auth.users via Supabase admin API
    try:
        if body.password:
            auth_result = service_client.auth.admin.create_user({
                "email": email,
                "password": body.password,
                "user_metadata": {"full_name": full_name},
                "email_confirm": True,
            })
        elif body.google_oauth_token:
            # Exchange google token — sign in to get UID
            g_result = service_client.auth.admin.create_user({
                "email": email,
                "user_metadata": {"full_name": full_name},
                "email_confirm": True,
            })
            auth_result = g_result
        else:
            raise api_error(ErrorCode.INTERNAL_ERROR, 422, "Provide password or google_oauth_token.")
    except api_error.__class__:
        raise
    except Exception as e:
        err_str = str(e).lower()
        if "already registered" in err_str or "already exists" in err_str:
            raise api_error(ErrorCode.INVITE_EMAIL_CONFLICT, 409, "Email already belongs to active user.")
        raise api_error(ErrorCode.UPSTREAM_UNAVAILABLE, 503, "Auth provider error.", {"detail": str(e)})

    auth_uid = auth_result.user.id

    # Insert public.users row as manager
    service_client.table("users").insert({
        "id": auth_uid,
        "company_id": company_id,
        "facility_id": facility_id,
        "role": "manager",
        "full_name": full_name,
        "email": email,
        "oauth_provider": "google" if body.google_oauth_token else "email",
        "is_active": True,
    }).execute()

    # Mark invite accepted
    service_client.table("manager_invites").update({
        "status": "accepted",
        "accepted_at": _now_iso(),
    }).eq("id", invite["id"]).execute()

    # Realtime: invite_accepted → company:{id}:team
    await publish(
        f"company:{company_id}:team",
        build_envelope(
            event_type="invite_accepted",
            facility_id=facility_id,
            company_id=company_id,
            actor={"kind": "user", "id": str(auth_uid)},
            payload={
                "invite_id": invite["id"],
                "user_id": str(auth_uid),
                "email": email,
                "facility_id": facility_id,
            },
        ),
    )

    return {
        "user_id": str(auth_uid),
        "role": "manager",
        "facility_id": facility_id,
    }


# ---------------------------------------------------------------------------
# PATCH /admin/team/{user_id}/revoke
# ---------------------------------------------------------------------------


class RevokeManagerRequest(BaseModel):
    reason: str | None = None


@router.patch("/team/{user_id}/revoke", status_code=status.HTTP_200_OK)
async def revoke_manager(user_id: uuid.UUID, body: RevokeManagerRequest, current_user: AdminUser):
    """
    Deactivate a manager's account.
    state_machines.md Invariant: manager_revoke_self_disallowed.
    """
    if user_id == current_user.id:
        raise api_error(
            ErrorCode.MANAGER_REVOKE_SELF_DISALLOWED, 422,
            "Admin cannot revoke their own account via this endpoint."
        )

    # Fetch target user — must be in same company
    target_result = (
        service_client.table("users")
        .select("id, company_id, role, facility_id")
        .eq("id", str(user_id))
        .maybe_single()
        .execute()
    )
    target = target_result.data
    if not target:
        raise api_error(ErrorCode.COMPANY_SCOPE_VIOLATION, 403, "User not found in caller's company.")

    if target["company_id"] != str(current_user.company_id):
        raise api_error(ErrorCode.COMPANY_SCOPE_VIOLATION, 403, "Resource belongs to different company.")

    service_client.table("users").update({"is_active": False}).eq("id", str(user_id)).execute()

    # Realtime: manager_revoked → company:{id}:team
    await publish(
        f"company:{current_user.company_id}:team",
        build_envelope(
            event_type="manager_revoked",
            facility_id=target.get("facility_id"),
            company_id=str(current_user.company_id),
            actor={"kind": "user", "id": str(current_user.id)},
            payload={
                "user_id": str(user_id),
                "reason": body.reason,
            },
        ),
    )

    return {"user_id": str(user_id), "is_active": False}
