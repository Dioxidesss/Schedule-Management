import type { Subscription, Invoice, PaymentMethod } from '../types/billing';

export const MOCK_SUBSCRIPTION: Subscription = {
    plan_code: 'enterprise',
    base_price_myr_sen: 1180000, // RM 11,800.00
    per_truck_rate_myr_sen: 0,
    current_period_start: '2026-10-01T00:00:00',
    current_period_end: '2026-11-01T00:00:00',
    trucks_this_cycle: 8420,
    is_active: true,
};

export const MOCK_INVOICES: Invoice[] = [
    {
        id: 'INV-2023-009',
        date: 'Oct 1, 2023',
        amount_myr: 'RM 11,800.00',
        status: 'paid',
        payment_method: 'Visa ending in 4242',
    },
    {
        id: 'INV-2023-008',
        date: 'Sep 1, 2023',
        amount_myr: 'RM 11,800.00',
        status: 'paid',
        payment_method: 'Visa ending in 4242',
    },
    {
        id: 'INV-2023-007',
        date: 'Aug 1, 2023',
        amount_myr: 'RM 11,800.00',
        status: 'paid',
        payment_method: 'Visa ending in 4242',
    },
    {
        id: 'INV-2023-006',
        date: 'Jul 1, 2023',
        amount_myr: 'RM 10,150.00',
        status: 'paid',
        payment_method: 'Visa ending in 4242',
    },
];

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
    {
        id: 'pm-001',
        provider: 'visa',
        card_last4: '4242',
        is_default: true,
    },
];
