"""
Phase 8 — Overrun Detection Worker
====================================
Designed to run as a Render Cron job every 60 seconds (one-shot execution).

ai_logic.md: OVERRUN DETECTION
  Condition: now() > scheduled_end AND actual_end IS NULL
             AND status IN ('assigned', 'unloading', 'yard_queue')
  Action:
    - Emit appointment_overrun → facility:{facility_id}:dashboard
    - Emit critical_overrun   → company:{company_id}:alerts  (if > 30 min late)
  DB impact: none — overrun is derived only, never persisted as status.
"""

import asyncio
import logging
import sys
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Bootstrap: load .env before any app imports so Settings resolves correctly.
# This is essential when running as a standalone worker (not under uvicorn).
# ---------------------------------------------------------------------------
from dotenv import load_dotenv

load_dotenv()

from app.core.realtime import build_envelope, publish  # noqa: E402
from app.core.supabase import service_client            # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [overrun_worker] %(levelname)s %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("overrun_worker")

# Appointments overrun by more than this many minutes trigger a critical_overrun
# alert on the company:alerts channel.
CRITICAL_THRESHOLD_MINUTES = 30


# ---------------------------------------------------------------------------
# DB query
# ---------------------------------------------------------------------------


def _fetch_overrun_appointments() -> list[dict]:
    """
    Return all appointments that are currently overrunning.

    state_machines.md: overrun = now() > scheduled_end AND actual_end IS NULL
    ai_logic.md adds:  status IN ('assigned', 'unloading', 'yard_queue')
    """
    now_iso = datetime.now(timezone.utc).isoformat()

    result = (
        service_client.table("appointments")
        .select(
            "id, company_id, facility_id, po_number, status, "
            "scheduled_start, scheduled_end, actual_start"
        )
        .in_("status", ["assigned", "unloading", "yard_queue"])
        .is_("actual_end", "null")
        .lt("scheduled_end", now_iso)  # scheduled_end < now → overrunning
        .order("scheduled_end", desc=False)
        .execute()
    )
    return result.data or []


# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------


async def run_overrun_check(dry_run: bool = False) -> int:
    """
    Fetch all overrunning appointments, emit realtime events, return count.

    Parameters
    ----------
    dry_run : bool
        When True, log detections but skip publish calls (for testing/CI).
    """
    now_utc = datetime.now(timezone.utc)
    now_iso = now_utc.isoformat()

    appointments = _fetch_overrun_appointments()

    if not appointments:
        log.info("No overrunning appointments detected.")
        return 0

    log.info("Detected %d overrunning appointment(s).", len(appointments))

    tasks = []
    for appt in appointments:
        appt_id = appt["id"]
        facility_id = appt["facility_id"]
        company_id = appt["company_id"]
        scheduled_end_raw: str = appt["scheduled_end"]

        # Parse scheduled_end with tz awareness
        scheduled_end = datetime.fromisoformat(
            scheduled_end_raw.replace("Z", "+00:00")
        )
        delta_seconds = (now_utc - scheduled_end).total_seconds()
        minutes_overrun = round(delta_seconds / 60, 1)

        log.info(
            "Overrun  appt=%s  facility=%s  minutes=%.1f  status=%s",
            appt_id, facility_id, minutes_overrun, appt["status"],
        )

        # ── appointment_overrun → facility:{id}:dashboard ─────────────────
        dashboard_channel = f"facility:{facility_id}:dashboard"
        overrun_payload = {
            "appointment_id": appt_id,
            "scheduled_end": scheduled_end_raw,
            "now": now_iso,
            "minutes_overrun": minutes_overrun,
        }
        overrun_envelope = build_envelope(
            event_type="appointment_overrun",
            facility_id=facility_id,
            company_id=company_id,
            actor={"kind": "worker", "id": "overrun_detector"},
            payload=overrun_payload,
        )

        if not dry_run:
            tasks.append(publish(dashboard_channel, overrun_envelope))
        else:
            log.info("[dry_run] Would publish appointment_overrun → %s", dashboard_channel)

        # ── critical_overrun → company:{id}:alerts  (threshold: 30 min) ──
        if minutes_overrun >= CRITICAL_THRESHOLD_MINUTES:
            alerts_channel = f"company:{company_id}:alerts"
            critical_payload = {
                "appointment_id": appt_id,
                "facility_id": facility_id,
                "scheduled_end": scheduled_end_raw,
                "now": now_iso,
                "minutes_overrun": minutes_overrun,
                "po_number": appt.get("po_number"),
            }
            critical_envelope = build_envelope(
                event_type="critical_overrun",
                facility_id=facility_id,
                company_id=company_id,
                actor={"kind": "worker", "id": "overrun_detector"},
                payload=critical_payload,
            )
            if not dry_run:
                tasks.append(publish(alerts_channel, critical_envelope))
            else:
                log.info("[dry_run] Would publish critical_overrun → %s", alerts_channel)

    if tasks:
        await asyncio.gather(*tasks)

    log.info("Overrun check complete. Published events for %d appointment(s).", len(appointments))
    return len(appointments)


# ---------------------------------------------------------------------------
# Entry point — called by Render cron:  python -m workers.overrun_worker
# ---------------------------------------------------------------------------


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    if dry:
        log.info("DRY RUN mode — no events will be published.")
    exit_code = 0
    try:
        count = asyncio.run(run_overrun_check(dry_run=dry))
        log.info("Done. Overrun appointments processed: %d", count)
    except Exception as exc:
        log.exception("Overrun worker crashed: %s", exc)
        exit_code = 1
    sys.exit(exit_code)
