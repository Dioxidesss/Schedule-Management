export type PlanCode = 'free' | 'premium' | 'enterprise';

export type InvoiceStatus = 'paid' | 'pending' | 'failed';

export interface Subscription {
    plan_code: PlanCode;
    base_price_myr_sen: number;
    per_truck_rate_myr_sen: number;
    current_period_start: string; // ISO 8601
    current_period_end: string;
    trucks_this_cycle: number;
    is_active: boolean;
}

export interface Invoice {
    id: string;
    date: string;         // e.g. "Oct 1, 2023"
    amount_myr: string;   // e.g. "RM 11,800.00" (display string)
    status: InvoiceStatus;
    payment_method: string; // e.g. "Visa ending in 4242"
}

export interface PaymentMethod {
    id: string;
    provider: 'visa' | 'mastercard' | 'fpx';
    card_last4: string;
    is_default: boolean;
}
