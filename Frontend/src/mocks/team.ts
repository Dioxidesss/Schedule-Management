import type { Manager, Invite } from '../types/team';

export const MOCK_MANAGERS: Manager[] = [
    {
        id: 'usr-001',
        full_name: 'Sarah Chen',
        email: 'sarah.c@isomer.ai',
        facility_name: 'West Coast Distribution Center',
        facility_id: 'fac-001',
        is_active: true,
        joined_at: '2023-06-15T09:00:00',
    },
    {
        id: 'usr-002',
        full_name: 'Marcus Rodriguez',
        email: 'marcus.r@isomer.ai',
        facility_name: 'Texas Logistics Hub',
        facility_id: 'fac-002',
        is_active: true,
        joined_at: '2023-07-20T09:00:00',
    },
    {
        id: 'usr-003',
        full_name: 'David Kim',
        email: 'david.k@isomer.ai',
        facility_name: 'New Jersey Port Facility',
        facility_id: 'fac-003',
        is_active: true,
        joined_at: '2023-08-01T09:00:00',
    },
    {
        id: 'usr-004',
        full_name: 'James Wilson',
        email: 'james.w@isomer.ai',
        facility_name: 'Miami Cold Storage',
        facility_id: 'fac-005',
        is_active: true,
        joined_at: '2023-09-10T09:00:00',
    },
];

export const MOCK_INVITES: Invite[] = [
    {
        id: 'inv-001',
        full_name: 'Elena Popov',
        email: 'elena.p@isomer.ai',
        facility_id: 'fac-004',
        facility_name: 'Chicago Central Depot',
        status: 'pending',
        expires_at: '2026-03-10T23:59:59',
    },
    {
        id: 'inv-002',
        full_name: 'Anita Lewis',
        email: 'anita.l@isomer.ai',
        facility_id: 'fac-006',
        facility_name: 'Seattle Fulfillment',
        status: 'pending',
        expires_at: '2026-03-12T23:59:59',
    },
];
