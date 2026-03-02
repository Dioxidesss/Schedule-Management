Phase 1: Supabase Auth integration + tenancy bootstrap
- Configure Supabase Auth providers (email + Google OAuth) and redirect URLs for Vercel domains
- Implement auth callback/session exchange wiring (or thin wrappers) rather than custom auth backend
- Create profile bootstrap path to map auth.users -> public.users with company/facility role assignments
- Wire users/company/facility role scoping middleware + RLS verification

Phase 2: Facility ops read model
- Build manager dashboard aggregate endpoint
- Build appointments list/detail endpoint with filters
- Build device list endpoint (status + heartbeat)

Phase 3: Appointments CRUD
- Implement create/update appointment APIs
- Support PO anchor, carrier, load_type, provisional door assignment
- Add validation for scheduled windows and facility scope

Phase 4: Kiosk pairing & device auth
- Implement create pairing code endpoint (10-min TTL)
- Implement kiosk /devices/pair consume flow + token issuance
- Implement heartbeat ingestion and offline detection worker

Phase 5: Gatehouse check-in flow
- Implement PO-based matching endpoint
- Add yard_queue transition logic when no door available
- Publish queue/check-in realtime events

Phase 6: Dock worker execution flow
- Implement start-unload and complete-unload endpoints
- Persist actual_start/actual_end for completed records
- Emit door release and completion events

Phase 7: Realtime topology
- Stand up facility/company/device channels
- Emit all state transitions from APIs/workers
- Subscribe manager, gatehouse, and dock clients

Phase 8: Overrun detection engine (Render worker)
- Add Render cron worker (60s) for derived overrun checks
- Push overrun alerts and highlight affected appointments via Supabase Realtime
- Feed overrun output to routing prioritizer

Phase 9: Fluid routing algorithm
- Implement door reassignment worker triggered by completion/overrun
- Assign oldest waiting yard_queue truck to newly free eligible door
- Broadcast assignment updates to gatehouse + dock device channel

Phase 10: Team management
- Implement invite create/resend/accept/revoke endpoints
- Add invite expiry worker and status transitions
- Broadcast team events for admin console tables

Phase 11: Billing & plan enforcement
- Implement subscription read/change-plan endpoints
- Implement payment method create/update/default endpoints
- Enforce free vs premium AI feature flags at runtime

Phase 12: Usage metering & hardening
- Increment trucks_this_cycle on first completion per appointment/cycle
- Add idempotency + concurrency guards around queue/routing paths
- Add audit logs/observability for critical operational events
- Add Vercel/Render operational runbooks (env vars, secret rotation, worker health checks)
