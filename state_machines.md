# State Machines

## 1) Appointment State Machine

### States
- `scheduled`
- `yard_queue`
- `assigned`
- `unloading`
- `completed`
- `cancelled`
- `no_show`

### Derived (not persisted)
- `overrun` = `now() > scheduled_end AND actual_end IS NULL`

### Legal Transitions
- `scheduled -> assigned` (manager/admin manual assignment or routing engine)
- `scheduled -> yard_queue` (gatehouse check-in and no available door)
- `scheduled -> cancelled` (manager/admin)
- `scheduled -> no_show` (manager/admin/automation)
- `yard_queue -> assigned` (routing engine or manager)
- `yard_queue -> cancelled` (manager/admin)
- `assigned -> unloading` (dock worker START)
- `assigned -> yard_queue` (door unassigned/reallocation)
- `assigned -> cancelled` (manager/admin)
- `unloading -> completed` (dock worker COMPLETE)
- `unloading -> assigned` (exception recovery/manual correction)
- `completed` is terminal
- `cancelled` is terminal
- `no_show` is terminal

### Invariants
- `scheduled_end > scheduled_start`
- `actual_end` requires `actual_start`
- `completed` requires all four timestamps: `scheduled_start`, `scheduled_end`, `actual_start`, `actual_end`
- `door_id` may be null at creation and reassigned post check-in

---

## 2) Device State Machine

### Device Role Invariants
- `gatehouse`: `door_id = NULL`
- `loading_dock`: `door_id != NULL`

### Connectivity States
- `offline`
- `online`

### Pairing Lifecycle
- `unpaired` (no valid device token)
- `paired` (token active)
- `revoked` (token invalidated)

### Legal Transitions
- `unpaired -> paired` (valid 6-digit code consumed within TTL)
- `paired -> revoked` (admin unpair/security action)
- `paired -> online` (heartbeat)
- `online -> offline` (heartbeat timeout worker)
- `offline -> online` (new heartbeat)
- `revoked -> paired` (fresh pairing flow only)

### Pairing Code States
- `issued` (`used_at IS NULL` and `now <= expires_at`)
- `used` (`used_at IS NOT NULL`)
- `expired` (`now > expires_at` and `used_at IS NULL`)

---

## 3) Manager Invite State Machine

### States
- `pending`
- `accepted`
- `expired`
- `revoked`

### Legal Transitions
- `pending -> accepted` (invite token redeemed)
- `pending -> expired` (expiry sweep)
- `pending -> revoked` (admin action)
- `expired -> pending` (resend creates/rotates new token + expiry)

### Invariants
- Accepted invite creates manager user tied to exactly one facility
- Non-pending invites cannot be accepted

---

## 4) Subscription / Plan State Machine

### Plan Values
- `free`
- `premium`

### Legal Transitions
- `free -> premium` (admin plan upgrade)
- `premium -> free` (admin downgrade)

### Invariants
- `plans` catalog restricted to `free` and `premium`
- `premium`: `base_price_myr_sen = 40000`, `per_truck_rate_myr_sen = 100`
- `free`: AI autopilot features disabled by feature flags
- `trucks_this_cycle >= 0`

---

## 5) Payment Method Defaulting

### States
- `active_default`
- `active_non_default`

### Legal Transitions
- `active_non_default -> active_default` (set default endpoint)
- `active_default -> active_non_default` (another method promoted)

### Invariants
- Exactly one default payment method per company (enforced by service transaction)
- PCI-sensitive values must be tokenized before API submission
