"""
AI / automation helpers — ai_logic.md behaviours implemented here.

Phase 3: Schedule end prediction (duration estimation).
Later phases will add overrun detection, fluid routing, etc.
"""

from datetime import datetime, timedelta, timezone
from statistics import median

from app.core.supabase import service_client


def estimate_scheduled_end(
    facility_id: str,
    carrier_name: str,
    load_type: str,
    scheduled_start: datetime,
) -> datetime:
    """
    Estimate scheduled_end when omitted on appointment creation.

    ai_logic.md: SCHEDULE END PREDICTION
    - Input: facility, carrier_name, load_type, historical durations (actual_end - actual_start)
    - Logic: median duration from completed appointments matching carrier/load_type
    - Fallback: facility default of 2 hours if fewer than 3 historical samples

    Returns: datetime (UTC)
    """
    # Fetch completed appointments with actual timestamps for same lane
    result = (
        service_client.table("appointments")
        .select("actual_start, actual_end")
        .eq("facility_id", facility_id)
        .eq("carrier_name", carrier_name)
        .eq("load_type", load_type)
        .eq("status", "completed")
        .not_.is_("actual_start", "null")
        .not_.is_("actual_end", "null")
        .limit(50)
        .execute()
    )

    samples = result.data or []

    if len(samples) >= 3:
        durations: list[float] = []
        for row in samples:
            try:
                start = datetime.fromisoformat(row["actual_start"].replace("Z", "+00:00"))
                end = datetime.fromisoformat(row["actual_end"].replace("Z", "+00:00"))
                delta = (end - start).total_seconds()
                if delta > 0:
                    durations.append(delta)
            except (ValueError, TypeError, KeyError):
                continue

        if len(durations) >= 3:
            median_seconds = median(durations)
            return scheduled_start + timedelta(seconds=median_seconds)

    # Fallback: 2 hours
    return scheduled_start + timedelta(hours=2)
