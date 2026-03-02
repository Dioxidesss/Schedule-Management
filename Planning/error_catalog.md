# Error Catalog

## Envelope (all errors)
```json
{
  "code": "string_machine_code",
  "message": "human readable summary",
  "request_id": "uuid-or-trace-id",
  "details": {}
}
```

## Auth & Session
- `invalid_credentials` (401): Email/password mismatch.
- `google_token_invalid` (401): Google ID token verification failed.
- `session_expired` (401): Access token expired or revoked.
- `forbidden_role` (403): Caller role not permitted.

## Tenancy / Scope
- `company_scope_violation` (403): Resource belongs to different company.
- `facility_scope_violation` (403): Manager attempted out-of-facility access.
- `device_scope_violation` (403): Device token used against another facility/device.

## Appointments
- `appointment_not_found` (404): Appointment ID not found in caller scope.
- `appointment_po_conflict` (409): Duplicate PO in same facility + scheduled_start window.
- `invalid_time_window` (422): scheduled_end <= scheduled_start.
- `invalid_actual_range` (422): actual_end < actual_start or actual_end provided without actual_start.
- `invalid_status_transition` (409): Disallowed status transition.
- `door_assignment_conflict` (409): Door occupied or incompatible with requested assignment.
- `completed_requires_training_timestamps` (422): Completed status without scheduled_start, scheduled_end, actual_start, actual_end.

## Queue / Routing
- `no_eligible_door_available` (409): No active door can receive queued truck.
- `queue_assignment_stale` (409): Optimistic lock/version mismatch while assigning from yard queue.
- `overrun_state_derived_only` (422): Client attempted to set overrun as persisted status.

## Gatehouse / Dock Kiosk
- `checkin_match_not_found` (404): No appointment match for PO/identifier in facility/day window.
- `checkin_match_ambiguous` (409): Multiple candidate matches; manual selection required.
- `dock_device_not_assigned_to_door` (403): Loading dock device lacks a valid door binding.
- `start_unload_invalid_state` (409): Appointment not in assignable state.
- `complete_unload_invalid_state` (409): Appointment not unloading.

## Device Pairing / Heartbeat
- `pairing_code_invalid` (404): Code not found.
- `pairing_code_expired` (410): Code exists but expired.
- `pairing_code_used` (409): Code already consumed.
- `pairing_role_door_mismatch` (422): gatehouse with door or loading_dock without door.
- `heartbeat_stale_timestamp` (422): observed_at too far in past/future.
- `device_token_revoked` (401): Device token invalidated by unpair/signout.

## Team Management / Invites
- `invite_not_found` (404): Invite ID/token not found.
- `invite_expired` (410): Invite past expires_at.
- `invite_already_accepted` (409): Invite consumed previously.
- `invite_email_conflict` (409): Email already belongs to active user.
- `manager_revoke_self_disallowed` (422): Admin attempted to revoke own account via manager endpoint.

## Billing / Plans
- `plan_code_invalid` (422): Plan not in {free,premium}.
- `plan_change_not_allowed` (409): Subscription state prevents transition.
- `payment_provider_invalid` (422): Provider not in {visa, mastercard, fpx}.
- `payment_method_not_found` (404): Method ID not in company scope.
- `payment_tokenization_required` (422): Raw PAN/CVC provided instead of tokenized values.

## Idempotency / Concurrency
- `idempotency_key_replay_conflict` (409): Same key with different payload hash.
- `concurrent_update_detected` (409): Version lock failed; retry required.
- `duplicate_completion_event` (200/409): Completion already processed (idempotent no-op or conflict by policy).

## Platform / Limits
- `rate_limit_exceeded` (429): Caller exceeded API quota.
- `payload_too_large` (413): Request body exceeds limits.
- `internal_error` (500): Unexpected server-side failure.
- `upstream_unavailable` (503): Dependency outage (e.g., auth provider/payment processor).
