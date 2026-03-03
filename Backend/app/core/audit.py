"""
Phase 12 — Audit Log Helper
=============================
Structured audit logging for critical operational events.

build_sequence.md: Add audit logs/observability for critical operational events.

Events audited (non-exhaustive):
  - appointment_completed    (kiosk complete-unload)
  - appointment_checked_in   (gatehouse)
  - door_assigned            (routing engine)
  - invite_accepted          (team management)
  - manager_revoked          (team management)
  - plan_changed             (billing)
  - payment_method_added     (billing)
  - device_paired            (devices)
  - device_unpaired          (devices)

Audit entries are written to the `audit_logs` table (service role) and also
emitted to application logs at INFO level for Render log drain integration.

DB table schema (add to Supabase migrations):
  CREATE TABLE IF NOT EXISTS audit_logs (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id   uuid REFERENCES companies(id) ON DELETE SET NULL,
      facility_id  uuid REFERENCES facilities(id) ON DELETE SET NULL,
      actor_kind   text NOT NULL CHECK (actor_kind IN ('user', 'device', 'worker')),
      actor_id     text NOT NULL,
      event_type   text NOT NULL,
      resource_id  text,
      resource_type text,
      metadata     jsonb,
      occurred_at  timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX idx_audit_logs_company_event ON audit_logs(company_id, event_type, occurred_at DESC);
  CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_kind, actor_id, occurred_at DESC);
"""

import logging
from typing import Any

from app.core.supabase import service_client

log = logging.getLogger("audit")
_TABLE = "audit_logs"


def audit(
    event_type: str,
    actor_kind: str,
    actor_id: str,
    *,
    company_id: str | None = None,
    facility_id: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    """
    Write a structured audit log entry.

    Non-fatal: any DB write failure is logged but never raises to the caller.
    The structured log line is always emitted for log drain / Render search.

    Parameters
    ----------
    event_type    : e.g. 'appointment_completed', 'plan_changed'
    actor_kind    : 'user' | 'device' | 'worker'
    actor_id      : user UUID, device UUID, or worker name string
    company_id    : company scoping
    facility_id   : facility scoping (optional)
    resource_type : e.g. 'appointment', 'invite', 'subscription'
    resource_id   : UUID or identifier of the primary resource affected
    metadata      : additional key/value context
    """
    # Always emit a structured INFO log line (Render log drain / grep)
    log.info(
        "AUDIT event=%s actor=%s/%s company=%s facility=%s resource=%s/%s meta=%s",
        event_type,
        actor_kind,
        actor_id,
        company_id or "-",
        facility_id or "-",
        resource_type or "-",
        resource_id or "-",
        metadata or {},
    )

    # Write to DB (best-effort)
    try:
        service_client.table(_TABLE).insert({
            "company_id": company_id,
            "facility_id": facility_id,
            "actor_kind": actor_kind,
            "actor_id": actor_id,
            "event_type": event_type,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "metadata": metadata or {},
        }).execute()
    except Exception as exc:
        log.error("Audit DB write failed (non-fatal): %s", exc)
