import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Subscription, Invoice } from '../types/billing';
import { MOCK_SUBSCRIPTION, MOCK_INVOICES } from '../mocks/billing';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

interface UseBillingReturn {
    subscription: Subscription | null;
    invoices: Invoice[];
    loading: boolean;
    error: string | null;
}

/**
 * Returns the tenant's active subscription and invoice history.
 *
 * DEV:  Set VITE_USE_MOCKS=true  → returns mock data instantly.
 * PROD: Set VITE_USE_MOCKS=false → calls GET /admin/billing/subscription + invoices.
 */
export function useBilling(): UseBillingReturn {
    const [subscription, setSubscription] = useState<Subscription | null>(
        USE_MOCKS ? MOCK_SUBSCRIPTION : null
    );
    const [invoices, setInvoices] = useState<Invoice[]>(USE_MOCKS ? MOCK_INVOICES : []);
    const [loading, setLoading] = useState(!USE_MOCKS);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (USE_MOCKS) return;

        let cancelled = false;

        const fetchAll = async () => {
            setLoading(true);
            setError(null);
            try {
                const [sub, invs] = await Promise.all([
                    api.billing.getSubscription(),
                    api.billing.getPaymentMethods(),
                ]);
                if (!cancelled) {
                    setSubscription(sub as unknown as Subscription);
                    setInvoices(invs as unknown as Invoice[]);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load billing');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void fetchAll();
        return () => { cancelled = true; };
    }, []);

    return { subscription, invoices, loading, error };
}
