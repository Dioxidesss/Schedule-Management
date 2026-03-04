import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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
 * DEV: Set VITE_USE_MOCKS=true in .env.local to return mock data instantly.
 * PROD: Remove or set VITE_USE_MOCKS=false to fetch from Supabase.
 *
 * Tables: public.subscriptions, public.invoices
 */
export function useBilling(): UseBillingReturn {
    const [subscription, setSubscription] = useState<Subscription | null>(
        USE_MOCKS ? MOCK_SUBSCRIPTION : null
    );
    const [invoices, setInvoices] = useState<Invoice[]>(USE_MOCKS ? MOCK_INVOICES : []);
    const [loading, setLoading] = useState(!USE_MOCKS);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // ── MOCK MODE ─────────────────────────────────────────────────────────
        if (USE_MOCKS) return;

        // ── SUPABASE MODE ─────────────────────────────────────────────────────
        let cancelled = false;

        const fetchAll = async () => {
            setLoading(true);
            setError(null);

            const [subRes, invRes] = await Promise.all([
                supabase.from('subscriptions').select('*').eq('is_active', true).limit(1).maybeSingle(),
                supabase.from('invoices').select('*').order('date', { ascending: false }).limit(10),
            ]);

            if (cancelled) return;

            if (subRes.error) { setError(subRes.error.message); setLoading(false); return; }
            if (invRes.error) { setError(invRes.error.message); setLoading(false); return; }

            setSubscription((subRes.data as Subscription | null) ?? null);
            setInvoices((invRes.data as Invoice[]) ?? []);
            setLoading(false);
        };

        void fetchAll();
        return () => { cancelled = true; };
    }, []);

    return { subscription, invoices, loading, error };
}
