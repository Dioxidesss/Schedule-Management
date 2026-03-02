Channel: facility:{facility_id}:dashboard
  - Publishers: manager APIs, gatehouse kiosks, dock worker kiosks, server-side AI engine
  - Subscribers: manager dashboards for that facility, admin global ops view
  - Events: appointment_created, appointment_updated, truck_checked_in, yard_queue_updated, appointment_overrun, door_status_changed, device_status_changed

Channel: facility:{facility_id}:queue
  - Publishers: gatehouse check-in API, fluid routing worker
  - Subscribers: manager queue widget, gatehouse kiosk
  - Events: queue_joined, queue_reordered, queue_assigned_to_door, queue_removed

Channel: facility:{facility_id}:doors
  - Publishers: dock worker complete API, routing engine, admin/manual assignment API
  - Subscribers: manager gantt/timeline, gatehouse kiosk, dock kiosks in facility
  - Events: door_assignment_changed, door_released, door_blocked

Channel: device:{device_id}
  - Publishers: routing engine, admin device-control API
  - Subscribers: that specific kiosk tablet
  - Events: pairing_confirmed, door_assignment_changed, new_task_assigned, force_signout, config_updated

Channel: device:{device_id}:heartbeat
  - Publishers: kiosk device heartbeat client
  - Subscribers: backend presence worker
  - Events: heartbeat_ping

Channel: company:{company_id}:team
  - Publishers: admin invite/revoke APIs
  - Subscribers: admin team-management screens
  - Events: invite_created, invite_resent, invite_accepted, manager_revoked

Channel: company:{company_id}:billing
  - Publishers: billing APIs, usage metering worker
  - Subscribers: admin billing/subscription screens
  - Events: subscription_updated, payment_method_updated, usage_counter_changed, invoice_ready

Channel: company:{company_id}:alerts
  - Publishers: overrun detector, device offline worker, routing engine
  - Subscribers: admin users, facility managers in same company
  - Events: critical_overrun, kiosk_offline, routing_degraded

Presence Key: facility:{facility_id}:managers
  - Writers: manager dashboards on connect/disconnect
  - Readers: same facility dashboards
  - Data: user_id, name, last_seen_at

Presence Key: facility:{facility_id}:devices
  - Writers: kiosk heartbeat service
  - Readers: manager/admin dashboards
  - Data: device_id, role, door_id, status, last_heartbeat_at
