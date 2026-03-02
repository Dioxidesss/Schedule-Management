"""
Appointment state machine — encodes every legal transition from state_machines.md.
All status mutations MUST pass through validate_appointment_transition() before
any DB write. Violating transitions raise catalog-exact error codes.
"""

from app.core.errors import ErrorCode, api_error

# ---------------------------------------------------------------------------
# Legal transition map
# (from_status -> set of legal to_statuses)
# Source: state_machines.md §1 Appointment State Machine
# ---------------------------------------------------------------------------

APPOINTMENT_TRANSITIONS: dict[str, set[str]] = {
    "scheduled": {"assigned", "yard_queue", "cancelled", "no_show"},
    "yard_queue": {"assigned", "cancelled"},
    "assigned":   {"unloading", "yard_queue", "cancelled"},
    "unloading":  {"completed", "assigned"},
    # Terminal states — no outgoing transitions
    "completed":  set(),
    "cancelled":  set(),
    "no_show":    set(),
}

TERMINAL_STATUSES = {"completed", "cancelled", "no_show"}

# overrun is derived only — never a valid write target (state_machines.md + error_catalog.md)
DERIVED_ONLY_STATUSES = {"overrun"}


def validate_appointment_transition(from_status: str, to_status: str) -> None:
    """
    Assert that the requested status transition is legal.

    Raises:
        APIError 422 overrun_state_derived_only  — client attempted to persist overrun
        APIError 409 invalid_status_transition   — all other illegal moves
    """
    if to_status in DERIVED_ONLY_STATUSES:
        raise api_error(
            ErrorCode.OVERRUN_STATE_DERIVED_ONLY,
            422,
            "Client attempted to set overrun as persisted status.",
        )

    legal_targets = APPOINTMENT_TRANSITIONS.get(from_status, set())
    if to_status not in legal_targets:
        raise api_error(
            ErrorCode.INVALID_STATUS_TRANSITION,
            409,
            f"Disallowed status transition: {from_status} → {to_status}.",
            {"from_status": from_status, "to_status": to_status},
        )


def validate_completed_invariant(row: dict) -> None:
    """
    Before transitioning to 'completed', assert all four training timestamps exist.
    state_machines.md invariant: completed requires scheduled_start, scheduled_end,
    actual_start, actual_end.

    Raises:
        APIError 422 completed_requires_training_timestamps
    """
    required = ("scheduled_start", "scheduled_end", "actual_start", "actual_end")
    missing = [f for f in required if not row.get(f)]
    if missing:
        raise api_error(
            ErrorCode.COMPLETED_REQUIRES_TRAINING_TIMESTAMPS,
            422,
            "Completed status without scheduled_start, scheduled_end, actual_start, actual_end.",
            {"missing_fields": missing},
        )


def validate_time_window(scheduled_start: str, scheduled_end: str) -> None:
    """
    Assert scheduled_end > scheduled_start.
    Raises: APIError 422 invalid_time_window
    """
    from datetime import datetime

    def _parse(ts: str) -> datetime:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))

    if _parse(scheduled_end) <= _parse(scheduled_start):
        raise api_error(
            ErrorCode.INVALID_TIME_WINDOW,
            422,
            "scheduled_end <= scheduled_start.",
            {"scheduled_start": scheduled_start, "scheduled_end": scheduled_end},
        )
