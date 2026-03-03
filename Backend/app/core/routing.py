"""
Phase 9 — Fluid Routing Engine
================================
Extracted from kiosk.py complete_unload. This is the shared routing brain
that can be called from:
  1. kiosk.py  — triggered by dock COMPLETE UNLOAD (door just freed)
  2. overrun_worker.py — triggered when an overrun appointment indicates
                         a door that should be reassigned

ai_logic.md: DOOR ASSIGNMENT (FLUID ROUTING)
  Trigger: appointment completed OR overrun OR door becomes free
  Logic:   pick next eligible appointment for earliest free door;
           prefer appointments already late
  Action:  update appointments.door_id, status='assigned',
           emit door_assignment_changed to gatehouse + specific dock device channel

realtime_map.md channels published:
  - facility:{id}:dashboard   → appointment_updated, yard_queue_updated
  - facility:{id}:queue       → queue_assigned_to_door, queue_removed
  - facility:{id}:doors       → door_assignment_changed
  - device:{device_id}        → door_assignment_changed (dock tablet gets the task)
"""

import asyncio
import logging
from datetime import datetime, timezone

from app.core.realtime import build_envelope, get_queue_snapshot, publish
from app.core.supabase import service_client

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------


def _find_next_yard_queue(facility_id: str) -> dict | None:
    """
    Return the single oldest yard_queue appointment for this facility.

    Ordering: checked_in_at ASC (oldest first) — ai_logic.md: "prefer
    appointments already late".
    Late-biased secondary sort: scheduled_start ASC (most overdue first).
    """
    result = (
        service_client.table("appointments")
        .select("id, company_id, po_number, checked_in_at, scheduled_start")
        .eq("facility_id", facility_id)
        .eq("status", "yard_queue")
        .order("checked_in_at", desc=False)
        .order("scheduled_start", desc=False)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    return rows[0] if rows else None


def _find_free_door_for_facility(facility_id: str) -> str | None:
    """
    Find the first active door with no ongoing assigned/unloading appointment.
    Returns door_id str or None.
    """
    doors_res = (
        service_client.table("doors")
        .select("id")
        .eq("facility_id", facility_id)
        .eq("is_active", True)
        .execute()
    )
    all_ids = {d["id"] for d in (doors_res.data or [])}
    if not all_ids:
        return None

    occupied_res = (
        service_client.table("appointments")
        .select("door_id")
        .eq("facility_id", facility_id)
        .in_("status", ["assigned", "unloading"])
        .not_.is_("door_id", "null")
        .execute()
    )
    occupied = {r["door_id"] for r in (occupied_res.data or []) if r.get("door_id")}
    free = all_ids - occupied
    return next(iter(free)) if free else None


def _find_dock_device_for_door(door_id: str) -> str | None:
    """
    Find the loading_dock device assigned to the given door.
    Returns device_id str or None.
    """
    result = (
        service_client.table("devices")
        .select("id")
        .eq("door_id", door_id)
        .eq("role", "loading_dock")
        .maybe_single()
        .execute()
    )
    if result.data:
        return result.data["id"]
    return None


# ---------------------------------------------------------------------------
# Core routing function
# ---------------------------------------------------------------------------


async def assign_next_from_queue(
    facility_id: str,
    company_id: str,
    freed_door_id: str | None = None,
    actor_id: str = "routing-engine",
) -> str | None:
    """
    Attempt to assign the oldest yard_queue truck to a free door.

    Parameters
    ----------
    facility_id  : Facility to route within.
    company_id   : For event envelope.
    freed_door_id: If a specific door was just freed (completion/overrun),
                   prefer it. If None, discover any free door.
    actor_id     : For realtime actor field (e.g. 'routing-engine').

    Returns
    -------
    The assigned appointment_id str, or None if nothing to route.
    """
    # Choose door: prefer the freed door if provided
    target_door_id = freed_door_id or _find_free_door_for_facility(facility_id)
    if not target_door_id:
        log.debug("No free door available for facility %s — skipping routing.", facility_id)
        return None

    # Find oldest waiting truck
    next_appt = _find_next_yard_queue(facility_id)
    if not next_appt:
        log.debug("No yard_queue trucks for facility %s — skipping routing.", facility_id)
        return None

    next_appt_id = next_appt["id"]

    # DB write: transition yard_queue → assigned
    update_res = (
        service_client.table("appointments")
        .update({"status": "assigned", "door_id": target_door_id})
        .eq("id", next_appt_id)
        .eq("status", "yard_queue")  # Optimistic lock: only update if still queued
        .execute()
    )

    if not (update_res.data):
        # Race condition — another routing invocation or manual action beat us to it
        log.warning(
            "Routing race detected for appt=%s – another actor got there first.", next_appt_id
        )
        return None

    log.info(
        "Routing: assigned appt=%s  door=%s  (facility=%s)",
        next_appt_id, target_door_id, facility_id,
    )

    # ── Realtime events ────────────────────────────────────────────────────

    actor = {"kind": "worker", "id": actor_id}

    tasks = []

    # 1. appointment_updated → dashboard
    tasks.append(publish(
        f"facility:{facility_id}:dashboard",
        build_envelope(
            event_type="appointment_updated",
            facility_id=facility_id,
            company_id=company_id,
            actor=actor,
            payload={"appointment_id": next_appt_id, "changes": {"status": "assigned", "door_id": target_door_id}},
        ),
    ))

    # 2. queue_assigned_to_door → facility queue channel
    tasks.append(publish(
        f"facility:{facility_id}:queue",
        build_envelope(
            event_type="queue_assigned_to_door",
            facility_id=facility_id,
            company_id=company_id,
            actor=actor,
            payload={"appointment_id": next_appt_id, "door_id": target_door_id},
        ),
    ))

    # 3. queue_removed → facility queue channel
    tasks.append(publish(
        f"facility:{facility_id}:queue",
        build_envelope(
            event_type="queue_removed",
            facility_id=facility_id,
            company_id=company_id,
            actor=actor,
            payload={"appointment_id": next_appt_id, "reason": "assigned"},
        ),
    ))

    # 4. door_assignment_changed → facility doors channel
    tasks.append(publish(
        f"facility:{facility_id}:doors",
        build_envelope(
            event_type="door_assignment_changed",
            facility_id=facility_id,
            company_id=company_id,
            actor=actor,
            payload={
                "door_id": target_door_id,
                "from_appointment_id": freed_door_id and str(freed_door_id),
                "to_appointment_id": next_appt_id,
            },
        ),
    ))

    # 5. door_assignment_changed → device:{device_id} (dock tablet gets task)
    #    realtime_payloads.md: { appointment_id, door_id, action: "begin_unload" }
    dock_device_id = _find_dock_device_for_door(target_door_id)
    if dock_device_id:
        tasks.append(publish(
            f"device:{dock_device_id}",
            build_envelope(
                event_type="door_assignment_changed",
                facility_id=facility_id,
                company_id=company_id,
                actor=actor,
                payload={
                    "appointment_id": next_appt_id,
                    "door_id": target_door_id,
                    "action": "begin_unload",
                },
            ),
        ))

    # 6. yard_queue_updated → dashboard (updated snapshot)
    queue_snap = await get_queue_snapshot(facility_id)
    tasks.append(publish(
        f"facility:{facility_id}:dashboard",
        build_envelope(
            event_type="yard_queue_updated",
            facility_id=facility_id,
            company_id=company_id,
            actor=actor,
            payload={"queue": queue_snap},
        ),
    ))

    await asyncio.gather(*tasks)
    return next_appt_id
