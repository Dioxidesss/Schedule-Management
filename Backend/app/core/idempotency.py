"""
Phase 12 — DB-backed Idempotency
==================================
Replaces the in-process _idempotency_cache dict with a proper DB-backed
idempotency_keys table. Prevents duplicate mutations when clients replay
requests on transient network failures.

error_catalog.md:  IDEMPOTENCY_KEY_REPLAY_CONFLICT (409)

Usage:
    from app.core.idempotency import check_idempotency, store_idempotency

    cached = await check_idempotency(key)
    if cached is not None:
        return cached

    result = ...  # perform the mutation
    await store_idempotency(key, result)
    return result

The table schema (add to Supabase migrations):
  CREATE TABLE IF NOT EXISTS idempotency_keys (
      key         text PRIMARY KEY,
      response    jsonb NOT NULL,
      created_at  timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX idx_idempotency_keys_created_at ON idempotency_keys(created_at);
  -- Optional: pg_cron sweep to purge keys older than 24h
"""

import json
import logging
from typing import Any

from app.core.supabase import service_client

log = logging.getLogger("idempotency")

# Keys expire after 24 hours (enforced by the sweep in db_idempotency_cleanup)
_TABLE = "idempotency_keys"


def check_idempotency(key: str) -> dict | None:
    """
    Look up an existing idempotency key in the DB.
    Returns the previously stored response dict if found, else None.
    """
    try:
        result = (
            service_client.table(_TABLE)
            .select("response")
            .eq("key", key)
            .maybe_single()
            .execute()
        )
        if result.data:
            raw = result.data.get("response")
            # Supabase returns jsonb as dict already
            return raw if isinstance(raw, dict) else json.loads(raw)
    except Exception as exc:
        # Non-fatal: degraded to no idempotency rather than blocking the request
        log.warning("Idempotency check failed (degraded): %s", exc)
    return None


def store_idempotency(key: str, response: dict[str, Any]) -> None:
    """
    Persist the idempotency key → response mapping.
    Uses INSERT ... ON CONFLICT DO NOTHING so concurrent replays are safe.
    Non-fatal: write failure will not surface to the caller.
    """
    try:
        service_client.table(_TABLE).upsert(
            {"key": key, "response": response},
            on_conflict="key",
            ignore_duplicates=True,
        ).execute()
    except Exception as exc:
        log.warning("Idempotency store failed (non-fatal): %s", exc)
