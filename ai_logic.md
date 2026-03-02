> Platform runtime assumptions: Supabase provides Auth + Postgres + Realtime; Vercel serves web frontend/API edges; Render runs cron/long-lived workers.

OVERRUN DETECTION:
- Trigger: server-side cron every 60 seconds
- Condition: now() > scheduled_end AND actual_end IS NULL AND status IN ('assigned','unloading','yard_queue')
- Action: mark appointment as overrun in computed response model, emit appointment_overrun realtime event, show red state on manager dashboard
- DB impact: no schema status mutation required if overrun is derived; optional event/audit row can be written

SCHEDULE END PREDICTION (AT CREATE):
- Trigger: POST /facilities/{facility_id}/appointments when scheduled_end is omitted
- Input: facility, carrier_name, load_type, historical durations using scheduled/actual timestamps
- Logic: estimate duration percentile by lane/carrier/load_type; fallback to facility default service time
- Action: persist scheduled_end and return provisional SLA window

YARD QUEUE ENTRY:
- Trigger: gatehouse check-in with no available/assigned door
- Condition: appointment matched by PO and door_id IS NULL or currently occupied
- Action: set status='yard_queue', set checked_in_at, publish yard_queue_updated event
- Ordering: queue rank = checked_in_at ASC (oldest first)

DOOR ASSIGNMENT (FLUID ROUTING):
- Trigger: appointment completed OR appointment becomes overrun OR door becomes free
- Input: yard_queue appointments ordered by checked_in_at, active doors, load compatibility hints
- Logic: pick next eligible appointment for earliest free door; prefer appointments already late
- Action: update appointments.door_id, status='assigned', emit door_assignment_changed to gatehouse + specific dock device channel

GATEHOUSE MATCHING:
- Trigger: POST /gatehouse/check-in
- Input: PO number first (anchor identifier), fallback license plate for fuzzy assist
- Logic: exact PO match for facility and active day window; reject cross-facility match
- Action: update checked_in_at; return either assigned door or queue wait state

DOCK TIMER START:
- Trigger: dock worker taps START UNLOAD
- Condition: appointment status in ('assigned','yard_queue') and device role='loading_dock'
- Action: set actual_start, status='unloading', lock active work item to that door/device

DOCK TIMER COMPLETE:
- Trigger: dock worker taps COMPLETE UNLOAD
- Condition: status='unloading' and actual_start IS NOT NULL
- Action: set actual_end, status='completed', emit door_status_changed(available), invoke fluid routing
- Training data guarantee: completed rows must include scheduled_start, scheduled_end, actual_start, actual_end

DEVICE PAIRING TTL ENFORCEMENT:
- Trigger: POST /devices/pair
- Condition: pairing code exists, used_at IS NULL, now() <= expires_at
- Action: consume code atomically (set used_at), issue long-lived device_token, bind device to facility and role
- Failure paths: expired_code, already_used, invalid_code

DEVICE OFFLINE DETECTION:
- Trigger: cron every 60 seconds
- Condition: last_heartbeat_at < now() - interval '2 minutes'
- Action: set devices.status='offline', emit device_status_changed for dashboard

PLAN FEATURE GATING:
- Trigger: dashboard load and AI actions
- Input: subscriptions + plans
- Logic: if plan='free', disable AI autopilot actions (prediction, auto-reshuffle) and expose manual flows only
- Action: return feature_flags in API responses

TRUCK USAGE METERING:
- Trigger: appointment transitions to completed within current billing period
- Condition: first completion count for appointment in cycle
- Action: increment subscriptions.trucks_this_cycle by 1
- Guard: idempotency key = appointment_id + billing_cycle

INVITE LIFECYCLE:
- Trigger: admin creates/resends invite + nightly expiry sweep
- Logic: pending invites past expires_at -> status='expired'; resend rotates token and extends expiry
- Action: keep team-management UI in sync with pending/expired/accepted counts
