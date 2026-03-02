"""
Shared database query helpers for facility-scoped reads.
"""

from datetime import datetime, timezone
from typing import Any

from app.core.supabase import service_client


# ---------------------------------------------------------------------------
# is_overrun derivation (state_machines.md: derived, never persisted)
# ---------------------------------------------------------------------------


def derive_is_overrun(row: dict) -> bool:
    """
    Compute is_overrun server-side:
      now() > scheduled_end AND actual_end IS NULL
    """
    if row.get("actual_end") is not None:
        return False
    scheduled_end_raw = row.get("scheduled_end")
    if not scheduled_end_raw:
        return False
    # Parse ISO string from Supabase
    if isinstance(scheduled_end_raw, str):
        scheduled_end = datetime.fromisoformat(
            scheduled_end_raw.replace("Z", "+00:00")
        )
    else:
        scheduled_end = scheduled_end_raw
    return datetime.now(timezone.utc) > scheduled_end


def enrich_appointment(row: dict) -> dict:
    """Add derived is_overrun field to an appointment row dict."""
    row["is_overrun"] = derive_is_overrun(row)
    return row


# ---------------------------------------------------------------------------
# Feature flags (ai_logic.md: plan='free' disables AI features)
# ---------------------------------------------------------------------------


def get_plan_feature_flags(company_id: str) -> dict[str, bool]:
    """
    Derive FeatureFlags from the company's active subscription plan.
    Returns all flags False on free plan; all True on premium.
    """
    result = (
        service_client.table("subscriptions")
        .select("plan_id, plans(code)")
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    plan_code = "free"  # safe default
    if result.data:
        # Supabase returns joined table as nested dict: plans: {code: ...}
        plans_join = result.data[0].get("plans")
        if plans_join and isinstance(plans_join, dict):
            plan_code = plans_join.get("code", "free")

    is_premium = plan_code == "premium"
    return {
        "ai_autopilot": is_premium,
        "auto_reshuffle": is_premium,
        "advanced_analytics": is_premium,
    }


# ---------------------------------------------------------------------------
# Door occupancy computation
# ---------------------------------------------------------------------------


def compute_door_statuses(facility_id: str, appointments: list[dict]) -> list[dict]:
    """
    Fetch all doors for the facility and join with active appointments
    to derive is_occupied and current_appointment_id.

    'Active' = status in (assigned, unloading) — i.e., door currently in use.
    """
    doors_result = (
        service_client.table("doors")
        .select("id, door_code, label, is_active")
        .eq("facility_id", facility_id)
        .execute()
    )

    # Build door → appointment lookup from the already-fetched appointments
    door_to_appt: dict[str, str] = {}
    for appt in appointments:
        if appt.get("door_id") and appt.get("status") in ("assigned", "unloading"):
            door_to_appt[appt["door_id"]] = appt["id"]

    result = []
    for door in (doors_result.data or []):
        door_id = door["id"]
        current_appt_id = door_to_appt.get(door_id)
        result.append(
            {
                "door_id": door_id,
                "door_code": door["door_code"],
                "is_active": door["is_active"],
                "is_occupied": current_appt_id is not None,
                "current_appointment_id": current_appt_id,
            }
        )
    return result
