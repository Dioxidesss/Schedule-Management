POST /auth/signup
  - Auth: none
  - Body: full_name, email, password
  - Returns: user_id, company_id, role, access_token, refresh_token
  - Side effect: creates auth.users + users row with oauth_provider='email'

POST /auth/login
  - Auth: none
  - Body: email, password
  - Returns: user_id, role, company_id, facility_id, access_token, refresh_token
  - Side effect: updates last_sign_in metadata

POST /auth/oauth/google
  - Auth: none
  - Body: google_id_token
  - Returns: user_id, role, company_id, facility_id, access_token, refresh_token
  - Side effect: upserts users row with oauth_provider='google', oauth_token

POST /auth/logout
  - Auth: authenticated (admin|manager)
  - Body: refresh_token
  - Returns: success=true
  - Side effect: revokes refresh token/session

GET /me
  - Auth: authenticated (admin|manager)
  - Returns: profile (full_name, email, phone, role, company_id, facility_id, gmail_connected_email)

PATCH /me
  - Auth: authenticated (admin|manager)
  - Body: full_name?, phone?
  - Returns: updated profile
  - Side effect: updates users table

POST /me/password
  - Auth: authenticated (admin|manager)
  - Body: current_password, new_password
  - Returns: success=true
  - Side effect: updates auth credential hash

POST /integrations/gmail/connect
  - Auth: authenticated (admin|manager)
  - Body: oauth_token, connected_email
  - Returns: gmail_connected_email, status='connected'
  - Side effect: stores oauth_token + gmail_connected_email on users

POST /facilities/{facility_id}/appointments
  - Auth: manager (facility-scoped) or admin
  - Body: po_number, carrier_name, scheduled_start, scheduled_end?, load_type
  - Returns: appointment_id, status='scheduled', provisional_door_id
  - Side effect: inserts into appointments; if scheduled_end omitted, triggers AI duration prediction

GET /facilities/{facility_id}/appointments
  - Auth: manager (same facility) or admin (same company)
  - Query: date, status?, po_number?
  - Returns: list of appointments (scheduled/actual timestamps, door_id, queue position)

GET /appointments/{appointment_id}
  - Auth: manager/admin in same company and facility scope
  - Returns: full appointment detail

PATCH /appointments/{appointment_id}
  - Auth: manager (facility-scoped) or admin
  - Body: scheduled_start?, scheduled_end?, door_id?, status?, carrier_name?, load_type?
  - Returns: updated appointment
  - Side effect: supports reassignment and yard_queue transitions

POST /gatehouse/check-in
  - Auth: device token (gatehouse role)
  - Body: facility_id, identifier (po_number or license_plate), checked_in_at
  - Returns: appointment_id, match_status, assigned_door_id?
  - Side effect: sets checked_in_at; moves status to yard_queue when no door assigned

POST /dock-worker/start-unload
  - Auth: device token (loading_dock role)
  - Body: appointment_id, actual_start
  - Returns: appointment_id, status='unloading'
  - Side effect: sets actual_start and dock_device_id

POST /dock-worker/complete-unload
  - Auth: device token (loading_dock role)
  - Body: appointment_id, actual_end
  - Returns: appointment_id, status='completed'
  - Side effect: sets actual_end and publishes routing event for next yard_queue truck

GET /facilities/{facility_id}/dashboard
  - Auth: manager (facility-scoped) or admin
  - Returns: today appointments, yard_queue list, door occupancy, overrun flags, device heartbeat summary
  - Real-time: yes, Supabase channel facility:{facility_id}:dashboard

GET /facilities/{facility_id}/devices
  - Auth: manager (facility-scoped) or admin
  - Returns: devices (role, status, model, door_id, last_heartbeat_at)

POST /facilities/{facility_id}/devices/pairing-codes
  - Auth: admin or manager (facility-scoped)
  - Body: device_name, role, door_id?, is_locked_to_facility=true
  - Returns: pairing_code, expires_at
  - Side effect: creates device_pairing_codes row (10 min TTL, single-use)

POST /devices/pair
  - Auth: none (kiosk bootstrap)
  - Body: code, device_model, device_name
  - Returns: device_id, facility_id, role, door_id, device_token
  - Side effect: consumes pairing code (used_at), creates/updates device record, issues long-lived token

POST /devices/{device_id}/heartbeat
  - Auth: device token
  - Body: status='online', observed_at
  - Returns: success=true
  - Side effect: updates devices.last_heartbeat_at and status

POST /devices/{device_id}/unpair
  - Auth: admin (company-scoped)
  - Body: admin_pin
  - Returns: success=true
  - Side effect: revokes device_token, sets status='offline'

GET /admin/team
  - Auth: admin
  - Query: search?, facility_id?, status?
  - Returns: managers list with profile + facility + status

POST /admin/team/invites
  - Auth: admin
  - Body: full_name, email, facility_id
  - Returns: invite_id, status='pending', expires_at
  - Side effect: inserts manager_invites and triggers invitation dispatch

POST /admin/team/invites/{invite_id}/resend
  - Auth: admin
  - Body: none
  - Returns: invite_id, resent_at
  - Side effect: rotates token/expiry or re-sends pending invite

POST /admin/team/invites/{token}/accept
  - Auth: none
  - Body: password or google_oauth_token
  - Returns: user_id, role='manager', facility_id
  - Side effect: marks invite accepted and creates manager user

PATCH /admin/team/{user_id}/revoke
  - Auth: admin
  - Body: reason?
  - Returns: user_id, is_active=false
  - Side effect: deactivates manager access

GET /admin/billing/subscription
  - Auth: admin
  - Returns: plan_code, base_price_myr_sen, per_truck_rate_myr_sen, current_period_start, current_period_end, trucks_this_cycle

POST /admin/billing/subscription/change-plan
  - Auth: admin
  - Body: plan_code ('free'|'premium')
  - Returns: updated subscription summary
  - Side effect: updates subscriptions.plan_id and feature flags source

GET /admin/billing/payment-methods
  - Auth: admin
  - Returns: masked payment methods, default method id

POST /admin/billing/payment-methods
  - Auth: admin
  - Body: provider ('visa'|'mastercard'|'fpx'), card_holder_name, card_number_tokenized, expiry_month, expiry_year, cvc_tokenized
  - Returns: payment_method_id, provider, card_last4
  - Side effect: upserts default payment method metadata

PATCH /admin/billing/payment-methods/{payment_method_id}/default
  - Auth: admin
  - Body: none
  - Returns: success=true
  - Side effect: flips default method atomically
