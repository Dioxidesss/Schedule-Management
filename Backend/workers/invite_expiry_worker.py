"""
Phase 10 — Invite Expiry Worker
================================
Sweeps pending invites past their `expires_at` and marks them 'expired'.

Designed to run as a Render Cron job (e.g. daily at midnight).
Command: python -m workers.invite_expiry_worker

ai_logic.md: INVITE EXPIRY
  Condition: status = 'pending' AND expires_at < now()
  Action: update status → 'expired'
"""

import asyncio
import logging
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv

load_dotenv()

from app.core.supabase import service_client  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [invite_expiry_worker] %(levelname)s %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("invite_expiry_worker")


# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------


async def run_expiry_sweep(dry_run: bool = False) -> int:
    """
    Fetch all pending invites past expires_at and mark them expired.
    Returns the count of invites expired.
    """
    now_iso = datetime.now(timezone.utc).isoformat()

    # Fetch candidates
    result = (
        service_client.table("manager_invites")
        .select("id, email, company_id, expires_at")
        .eq("status", "pending")
        .lt("expires_at", now_iso)
        .execute()
    )
    expired_invites = result.data or []

    if not expired_invites:
        log.info("No pending invites to expire.")
        return 0

    log.info("Found %d invite(s) to expire.", len(expired_invites))

    for inv in expired_invites:
        log.info("Expiring invite=%s  email=%s  expired_at=%s", inv["id"], inv["email"], inv["expires_at"])

    if not dry_run:
        expired_ids = [inv["id"] for inv in expired_invites]
        service_client.table("manager_invites").update({"status": "expired"}).in_(
            "id", expired_ids
        ).execute()
        log.info("Marked %d invite(s) as expired.", len(expired_invites))
    else:
        log.info("[dry_run] Would expire %d invite(s).", len(expired_invites))

    return len(expired_invites)


# ---------------------------------------------------------------------------
# Entry point — called by Render cron:  python -m workers.invite_expiry_worker
# ---------------------------------------------------------------------------


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    if dry:
        log.info("DRY RUN mode — no DB writes.")
    exit_code = 0
    try:
        count = asyncio.run(run_expiry_sweep(dry_run=dry))
        log.info("Done. Invites expired: %d", count)
    except Exception as exc:
        log.exception("Invite expiry worker crashed: %s", exc)
        exit_code = 1
    sys.exit(exit_code)
