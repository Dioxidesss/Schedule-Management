import type { Manager, Invite } from '../types/team';

export const MOCK_MANAGERS: Manager[] = [
    {
        id: 'usr-001',
        full_name: 'Alex Chen',
        email: 'alex.chen@isomer.com',
        facility_name: 'West Coast DC',
        facility_id: 'fac-001',
        is_active: true,
        joined_at: '2023-06-15T09:00:00',
    },
    {
        id: 'usr-002',
        full_name: 'John Doe',
        email: 'john.doe@isomer.com',
        facility_name: 'Texas Hub',
        facility_id: 'fac-002',
        is_active: true,
        joined_at: '2023-07-20T09:00:00',
    },
    {
        id: 'usr-003',
        full_name: 'Sarah Kim',
        email: 'sarah.kim@isomer.com',
        facility_name: 'NJ Port',
        facility_id: 'fac-003',
        is_active: true,
        joined_at: '2023-08-01T09:00:00',
    },
];

export const MOCK_INVITES: Invite[] = [
    {
        id: 'inv-001',
        full_name: 'Marcus Lee',
        email: 'marcus.lee@company.com',
        facility_id: 'fac-002',
        facility_name: 'Texas Hub',
        status: 'pending',
        expires_at: '2026-03-10T23:59:59',
    },
];
