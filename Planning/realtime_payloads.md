# Realtime Payload Contracts

## Envelope (all events)
```json
{
  "type": "event_name",
  "version": 1,
  "event_id": "uuid",
  "occurred_at": "2026-01-01T10:00:00Z",
  "facility_id": "uuid-or-null",
  "company_id": "uuid-or-null",
  "actor": {
    "kind": "user|device|worker",
    "id": "uuid-or-worker-name"
  },
  "idempotency_key": "optional-string",
  "payload": {}
}
```

## Channel: facility:{facility_id}:dashboard

### appointment_created
```json
{
  "payload": {
    "appointment": {
      "id": "uuid",
      "po_number": "PO-8821",
      "status": "scheduled",
      "scheduled_start": "ISO8601",
      "scheduled_end": "ISO8601",
      "door_id": null
    }
  }
}
```

### appointment_updated
```json
{
  "payload": {
    "appointment_id": "uuid",
    "changes": {
      "status": "assigned",
      "door_id": "uuid"
    }
  }
}
```

### truck_checked_in
```json
{
  "payload": {
    "appointment_id": "uuid",
    "po_number": "PO-8821",
    "checked_in_at": "ISO8601",
    "queue_position": 3
  }
}
```

### yard_queue_updated
```json
{
  "payload": {
    "queue": [
      { "appointment_id": "uuid", "queue_position": 1 },
      { "appointment_id": "uuid", "queue_position": 2 }
    ]
  }
}
```

### appointment_overrun
```json
{
  "payload": {
    "appointment_id": "uuid",
    "scheduled_end": "ISO8601",
    "now": "ISO8601",
    "minutes_overrun": 17
  }
}
```

### door_status_changed
```json
{
  "payload": {
    "door_id": "uuid",
    "state": "occupied|available|blocked",
    "appointment_id": "uuid-or-null"
  }
}
```

### device_status_changed
```json
{
  "payload": {
    "device_id": "uuid",
    "status": "online|offline",
    "last_heartbeat_at": "ISO8601"
  }
}
```

---

## Channel: facility:{facility_id}:queue

### queue_joined
```json
{
  "payload": {
    "appointment_id": "uuid",
    "queue_position": 4
  }
}
```

### queue_reordered
```json
{
  "payload": {
    "reason": "assignment|cancellation|manual_reorder",
    "order": ["appointment_uuid_1", "appointment_uuid_2"]
  }
}
```

### queue_assigned_to_door
```json
{
  "payload": {
    "appointment_id": "uuid",
    "door_id": "uuid"
  }
}
```

### queue_removed
```json
{
  "payload": {
    "appointment_id": "uuid",
    "reason": "assigned|cancelled|no_show"
  }
}
```

---

## Channel: facility:{facility_id}:doors

### door_assignment_changed
```json
{
  "payload": {
    "door_id": "uuid",
    "from_appointment_id": "uuid-or-null",
    "to_appointment_id": "uuid-or-null"
  }
}
```

### door_released
```json
{
  "payload": {
    "door_id": "uuid",
    "released_by_appointment_id": "uuid",
    "released_at": "ISO8601"
  }
}
```

### door_blocked
```json
{
  "payload": {
    "door_id": "uuid",
    "blocked": true,
    "reason": "maintenance|safety"
  }
}
```

---

## Channel: device:{device_id}

### pairing_confirmed
```json
{
  "payload": {
    "device_id": "uuid",
    "facility_id": "uuid",
    "role": "gatehouse|loading_dock",
    "door_id": "uuid-or-null"
  }
}
```

### door_assignment_changed
```json
{
  "payload": {
    "appointment_id": "uuid",
    "door_id": "uuid",
    "action": "report_to_door|begin_unload"
  }
}
```

### new_task_assigned
```json
{
  "payload": {
    "task_id": "uuid",
    "appointment_id": "uuid",
    "task_type": "checkin|unload_start|unload_complete"
  }
}
```

### force_signout
```json
{
  "payload": {
    "reason": "unpaired|token_revoked|security_rotation"
  }
}
```

### config_updated
```json
{
  "payload": {
    "device_name": "K-WC-001",
    "is_locked_to_facility": true,
    "door_id": "uuid-or-null"
  }
}
```

---

## Delivery & Ordering Rules
- At-least-once delivery; clients must dedupe by `event_id`.
- Ordering is guaranteed only per channel partition.
- `version` increments on breaking payload changes.
- Clients should ignore unknown fields for forward compatibility.
- Reconnect flow: client fetches REST snapshot first, then resumes realtime stream.
