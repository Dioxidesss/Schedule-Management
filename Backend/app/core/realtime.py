"""
Supabase Realtime publisher — broadcast API client.

All events use the envelope shape defined in realtime_payloads.md:
  { type, version, event_id, occurred_at, facility_id, company_id, actor, payload }

Publishing is fire-and-forget: failures are logged but never propagate to the caller.
This matches the at-least-once delivery model (clients dedupe by event_id).
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Literal

import httpx

from app.core.config import settings

# Supabase Realtime broadcast endpoint (REST API — no WS needed server-side)
_BROADCAST_URL_TEMPLATE = "{supabase_url}/functions/v1/realtime-broadcast"

ActorKind = Literal["user", "device", "worker"]


# ---------------------------------------------------------------------------
# Envelope builder
# ---------------------------------------------------------------------------


def build_envelope(
    event_type: str,
    payload: dict,
    *,
    facility_id: str | None = None,
    company_id: str | None = None,
    actor_kind: ActorKind = "worker",
    actor_id: str = "api-server",
) -> dict:
    """
    Build a realtime_payloads.md-compliant event envelope.
    Returns a dict ready to send as the broadcast message body.
    """
    return {
        "type": event_type,
        "version": 1,
        "event_id": str(uuid.uuid4()),
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "facility_id": facility_id,
        "company_id": company_id,
        "actor": {
            "kind": actor_kind,
            "id": actor_id,
        },
        "payload": payload,
    }


# ---------------------------------------------------------------------------
# Publisher
# ---------------------------------------------------------------------------


async def publish(channel: str, event_name: str, envelope: dict) -> None:
    """
    Broadcast an event to a Supabase Realtime channel.
    Uses the Supabase REST broadcast endpoint with service role key auth.
    Fire-and-forget: exceptions are swallowed so a publish failure never
    rolls back or delays the HTTP response to the kiosk.
    """
    # Supabase Realtime REST broadcast endpoint
    # POST /realtime/v1/api/broadcast
    url = f"{settings.SUPABASE_URL}/realtime/v1/api/broadcast"
    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "messages": [
            {
                "topic": channel,
                "event": event_name,
                "payload": envelope,
            }
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(url, json=body, headers=headers)
            # 200–299 is success; non-2xx is non-fatal
            if resp.status_code >= 300:
                print(f"[realtime] publish non-2xx {resp.status_code} on {channel}:{event_name}")
    except Exception as exc:
        # Never raise — a publish failure must not break the main response
        print(f"[realtime] publish error on {channel}:{event_name}: {exc}")


# ---------------------------------------------------------------------------
# Queue position helper
# ---------------------------------------------------------------------------


async def get_queue_position(facility_id: str, appointment_id: str) -> int:
    """
    Return the 1-based position of appointment_id in the yard_queue,
    ordered by checked_in_at ascending. Returns 0 if not found.
    """
    from app.core.supabase import service_client

    res = (
        service_client.table("appointments")
        .select("id")
        .eq("facility_id", facility_id)
        .eq("status", "yard_queue")
        .order("checked_in_at", desc=False)
        .execute()
    )
    rows = res.data or []
    ids = [r["id"] for r in rows]
    try:
        return ids.index(appointment_id) + 1
    except ValueError:
        return 0


async def get_queue_snapshot(facility_id: str) -> list[dict]:
    """Return the full ordered yard_queue as [{ appointment_id, queue_position }]."""
    from app.core.supabase import service_client

    res = (
        service_client.table("appointments")
        .select("id")
        .eq("facility_id", facility_id)
        .eq("status", "yard_queue")
        .order("checked_in_at", desc=False)
        .execute()
    )
    return [
        {"appointment_id": r["id"], "queue_position": i + 1}
        for i, r in enumerate(res.data or [])
    ]
