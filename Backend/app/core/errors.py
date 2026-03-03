import uuid
from enum import Enum
from typing import Any

from fastapi import HTTPException


class ErrorCode(str, Enum):
    # Auth & Session
    INVALID_CREDENTIALS = "invalid_credentials"
    GOOGLE_TOKEN_INVALID = "google_token_invalid"
    SESSION_EXPIRED = "session_expired"
    FORBIDDEN_ROLE = "forbidden_role"

    # Tenancy / Scope
    COMPANY_SCOPE_VIOLATION = "company_scope_violation"
    FACILITY_SCOPE_VIOLATION = "facility_scope_violation"
    DEVICE_SCOPE_VIOLATION = "device_scope_violation"

    # Appointments
    APPOINTMENT_NOT_FOUND = "appointment_not_found"
    APPOINTMENT_PO_CONFLICT = "appointment_po_conflict"
    INVALID_TIME_WINDOW = "invalid_time_window"
    INVALID_ACTUAL_RANGE = "invalid_actual_range"
    INVALID_STATUS_TRANSITION = "invalid_status_transition"
    DOOR_ASSIGNMENT_CONFLICT = "door_assignment_conflict"
    COMPLETED_REQUIRES_TRAINING_TIMESTAMPS = "completed_requires_training_timestamps"

    # Queue / Routing
    NO_ELIGIBLE_DOOR_AVAILABLE = "no_eligible_door_available"
    QUEUE_ASSIGNMENT_STALE = "queue_assignment_stale"
    OVERRUN_STATE_DERIVED_ONLY = "overrun_state_derived_only"

    # Gatehouse / Dock Kiosk
    CHECKIN_MATCH_NOT_FOUND = "checkin_match_not_found"
    CHECKIN_MATCH_AMBIGUOUS = "checkin_match_ambiguous"
    DOCK_DEVICE_NOT_ASSIGNED_TO_DOOR = "dock_device_not_assigned_to_door"
    START_UNLOAD_INVALID_STATE = "start_unload_invalid_state"
    COMPLETE_UNLOAD_INVALID_STATE = "complete_unload_invalid_state"

    # Device Pairing / Heartbeat
    PAIRING_CODE_INVALID = "pairing_code_invalid"
    PAIRING_CODE_EXPIRED = "pairing_code_expired"
    PAIRING_CODE_USED = "pairing_code_used"
    PAIRING_ROLE_DOOR_MISMATCH = "pairing_role_door_mismatch"
    HEARTBEAT_STALE_TIMESTAMP = "heartbeat_stale_timestamp"
    DEVICE_TOKEN_INVALID = "device_token_invalid"
    DEVICE_TOKEN_REVOKED = "device_token_revoked"

    # Team Management / Invites
    INVITE_NOT_FOUND = "invite_not_found"
    INVITE_EXPIRED = "invite_expired"
    INVITE_ALREADY_ACCEPTED = "invite_already_accepted"
    INVITE_EMAIL_CONFLICT = "invite_email_conflict"
    MANAGER_REVOKE_SELF_DISALLOWED = "manager_revoke_self_disallowed"

    # Billing / Plans
    PLAN_CODE_INVALID = "plan_code_invalid"
    PLAN_CHANGE_NOT_ALLOWED = "plan_change_not_allowed"
    PAYMENT_PROVIDER_INVALID = "payment_provider_invalid"
    PAYMENT_METHOD_NOT_FOUND = "payment_method_not_found"
    PAYMENT_TOKENIZATION_REQUIRED = "payment_tokenization_required"

    # Idempotency / Concurrency
    IDEMPOTENCY_KEY_REPLAY_CONFLICT = "idempotency_key_replay_conflict"
    CONCURRENT_UPDATE_DETECTED = "concurrent_update_detected"
    DUPLICATE_COMPLETION_EVENT = "duplicate_completion_event"

    # Platform / Limits
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    PAYLOAD_TOO_LARGE = "payload_too_large"
    INTERNAL_ERROR = "internal_error"
    UPSTREAM_UNAVAILABLE = "upstream_unavailable"


class APIError(HTTPException):
    """
    Structured API error that renders the error_catalog.md envelope:
      { "code", "message", "request_id", "details" }
    """

    def __init__(
        self,
        status_code: int,
        code: ErrorCode,
        message: str,
        details: dict[str, Any] | None = None,
        request_id: str | None = None,
    ):
        self.error_code = code
        self.error_message = message
        self.error_details = details or {}
        self.request_id = request_id or str(uuid.uuid4())
        super().__init__(
            status_code=status_code,
            detail={
                "code": code.value,
                "message": message,
                "request_id": self.request_id,
                "details": self.error_details,
            },
        )


def api_error(
    code: ErrorCode,
    status: int,
    message: str,
    details: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> APIError:
    """Factory for raising catalog-compliant errors."""
    return APIError(
        status_code=status,
        code=code,
        message=message,
        details=details,
        request_id=request_id,
    )
