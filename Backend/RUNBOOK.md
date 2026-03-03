# Isomer Backend — Operational Runbook

> **Scope**: Render (Backend) + Supabase · Updated: Phase 12

---

## 1. Environment Variables

### Web Service (`isomer-api`)

| Variable | Description | Where to get |
|---|---|---|
| `SUPABASE_URL` | Project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Public anon key (for client-side use) | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — full DB bypass | Supabase Dashboard → Settings → API |
| `SUPABASE_JWT_SECRET` | **Secret** — for server-side JWT verify | Supabase Dashboard → Settings → Auth |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | e.g. `https://your-vercel-app.vercel.app` |

### Cron Workers

| Worker | Variables Required |
|---|---|
| `isomer-overrun-detector` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` |
| `isomer-invite-expiry` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

---

## 2. Secret Rotation

### Supabase JWT Secret

1. In Supabase Dashboard → Settings → Auth → JWT Settings, rotate the secret.
2. Update `SUPABASE_JWT_SECRET` on **all Render services** (web + both crons) simultaneously.
3. Trigger a manual redeploy of each service.
4. All active device tokens will be immediately invalidated — users must re-pair kiosk devices.

### Supabase Service Role Key

1. In Supabase Dashboard → Settings → API, roll the service role key.
2. Update `SUPABASE_SERVICE_ROLE_KEY` on all Render services.
3. Trigger manual redeployment.
4. No active sessions are affected.

---

## 3. Worker Health Checks

### Overrun Detector (`isomer-overrun-detector`)

- **Schedule**: Every 60 seconds (`*/1 * * * *`)
- **Check**: Render cron dashboard → last run status + exit code
- **Dry-run test**: `python -m workers.overrun_worker --dry-run`
- **Logs**: Render log search `[overrun_worker]` — look for `Detected X overrunning`

### Invite Expiry (`isomer-invite-expiry`)

- **Schedule**: Daily midnight UTC (`0 0 * * *`)
- **Dry-run test**: `python -m workers.invite_expiry_worker --dry-run`
- **Logs**: Look for `Marked X invite(s) as expired`

---

## 4. DB Migrations Required

The following tables must be created in Supabase before deploying:

```sql
-- Idempotency keys (Phase 12)
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key         text PRIMARY KEY,
    response    jsonb NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_idempotency_keys_created_at ON idempotency_keys(created_at);

-- Audit logs (Phase 12)
CREATE TABLE IF NOT EXISTS audit_logs (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    uuid REFERENCES companies(id) ON DELETE SET NULL,
    facility_id   uuid REFERENCES facilities(id) ON DELETE SET NULL,
    actor_kind    text NOT NULL CHECK (actor_kind IN ('user', 'device', 'worker')),
    actor_id      text NOT NULL,
    event_type    text NOT NULL,
    resource_id   text,
    resource_type text,
    metadata      jsonb,
    occurred_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_company_event ON audit_logs(company_id, event_type, occurred_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_kind, actor_id, occurred_at DESC);

-- Optional: auto-purge idempotency keys after 24h via pg_cron
-- SELECT cron.schedule('purge-idempotency', '0 * * * *',
--   $$DELETE FROM idempotency_keys WHERE created_at < now() - interval '24 hours'$$);
```

---

## 5. Observability

### Log Drain

All workers use structured log format:
```
%(asctime)s [worker_name] %(levelname)s %(message)s
```

Connect Render's log drain to Datadog / Papertrail by setting **Log Stream** in the Render service settings.

### Audit Events

Critical events logged to both `audit_logs` table and application stdout under the `audit` logger:

| Event | Trigger |
|---|---|
| `appointment_completed` | `POST /dock-worker/complete-unload` |
| `plan_changed` | `POST /admin/billing/subscription/change-plan` |
| `invite_accepted` | `POST /admin/team/invites/{token}/accept` |
| `manager_revoked` | `PATCH /admin/team/{user_id}/revoke` |

### Health Check Endpoint

`GET /health` → returns `{"status": "ok"}` — used by Render's health check.

---

## 6. Vercel Frontend Integration

Ensure `NEXT_PUBLIC_API_BASE_URL` (or equivalent) is set to the Render web service URL.  
CORS is configured via `ALLOWED_ORIGINS` on the backend. Add Vercel preview deployment URLs if needed.

---

## 7. Common Issues

| Symptom | Cause | Fix |
|---|---|---|
| 401 on all requests after secret rotation | Old `SUPABASE_JWT_SECRET` cached | Redeploy all Render services |
| Routing engine not firing | `assign_next_from_queue` non-fatal swallowed | Check Render logs for `Routing failed` |
| trucks_this_cycle not incrementing | Subscription row missing | Ensure `subscriptions` row exists for company |
| Invite tokens not expiring | Expiry cron not running | Check Render cron dashboard for exit code |
