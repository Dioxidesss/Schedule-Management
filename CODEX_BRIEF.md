You are a senior database architect. I am giving you 
the complete frontend UI code and screens for a SaaS 
product called Isomer — an AI-powered warehouse dock 
scheduling system built on Supabase + Postgres. 

Your ONLY job is to reverse-engineer a complete, 
production-ready Postgres schema from this UI. 
Do NOT write application code. Do NOT add tables 
for features that have no corresponding UI screen.
Output only: CREATE TABLE statements with constraints,
then CREATE INDEX statements, then Supabase RLS 
policies. Add a one-line comment above each table 
explaining its read/write pattern.

────────────────────────────────
## SCREENS (feed HTML files in this order)
────────────────────────────────
SCREEN 1: Kiosk Boot — 6-digit facility pairing code entry
SCREEN 2: Manager Sign-Up / Login (email + Google OAuth)
SCREEN 3: Marketing Landing Page (pricing, feature list)
SCREEN 4: Landing Page with Device Registration modal
SCREEN 5: Manager Dashboard — Gantt + Queue + Live Insights
SCREEN 6: Manager Dashboard — Profile & Preferences
SCREEN 7: New Appointment Modal
SCREEN 8: Admin Console — Billing & Subscription
SCREEN 9: Admin Console — Manage Payment Details
SCREEN 10: Admin Console — Team Management list
SCREEN 11: Admin Console — Team Management (invite modal)
SCREEN 12: Admin Console — Register New Device (pairing modal)
SCREEN 13: Dock Worker Kiosk
SCREEN 14: Gatekeeper Kiosk

[ATTACH ALL HTML FILES HERE]

────────────────────────────────
## HARD RULES — Do not deviate from these
────────────────────────────────

HIERARCHY:
- companies own facilities. facilities own devices 
  and appointments.
- users belong to one company. managers are scoped 
  to exactly one facility. admins see all facilities 
  under their company.
- devices belong to one facility. role enum: 
  'gatehouse' or 'loading_dock'.

AUTH:
- Gmail OAuth is for user identity only. 
  Store oauth_provider ('email'|'google') and 
  oauth_token on users. No email sending or reading.
- Kiosk devices authenticate via short-lived 
  6-digit pairing code (10 min TTL, single-use).
  After pairing, devices use a long-lived device token.

APPOINTMENTS & ROUTING:
- Anchor identifier is PO number, not license plate.
- door_id on appointments is NULLABLE at creation. 
  It is provisional and may be reassigned post-check-in.
- yard_queue is a separate state: truck has physically 
  checked in at gatehouse but no door is assigned yet.
- Every completed appointment must store 
  scheduled_start, scheduled_end, actual_start, 
  actual_end. These four timestamps are the AI 
  training data moat.
- Overrun is a derived state: timer expired 
  (now > scheduled_end) but actual_end is still NULL.

PRICING:
- Exactly two plans: 'free' and 'premium'. 
  No middle tier exists.
- Free: all AI features locked via feature flags.
- Premium: base_price_myr = 40000 (stored in sen), 
  per_truck_rate_myr = 100 (stored in sen).
- subscriptions links companies to plans with 
  current_period_start, current_period_end, 
  trucks_this_cycle.

DEVICES:
- Gatehouse devices: door_id = NULL, 
  covers whole facility.
- Loading dock devices: door_id = FK to doors table, 
  fixed to one physical door.
- device_model stored as varchar (auto-detected).

DO NOT BUILD YET (Phase 2 only):
- ERP/SAP integration tables
- Vendor scorecard / analytics aggregation tables
- CSM or support ticket tables
