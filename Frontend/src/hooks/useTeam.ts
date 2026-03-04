import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Manager, Invite } from '../types/team';
import { MOCK_MANAGERS, MOCK_INVITES } from '../mocks/team';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

interface UseTeamReturn {
    managers: Manager[];
    invites: Invite[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Returns all team managers and pending invites.
 *
 * DEV: Set VITE_USE_MOCKS=true in .env.local to return mock data instantly.
 * PROD: Remove or set VITE_USE_MOCKS=false to fetch from Supabase.
 *
 * Tables: public.managers, public.invites
 */
export function useTeam(): UseTeamReturn {
    const [managers, setManagers] = useState<Manager[]>(USE_MOCKS ? MOCK_MANAGERS : []);
    const [invites, setInvites] = useState<Invite[]>(USE_MOCKS ? MOCK_INVITES : []);
    const [loading, setLoading] = useState(!USE_MOCKS);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        // ── MOCK MODE ─────────────────────────────────────────────────────────
        if (USE_MOCKS) return;

        // ── SUPABASE MODE ─────────────────────────────────────────────────────
        setLoading(true);
        setError(null);

        const [managersRes, invitesRes] = await Promise.all([
            supabase.from('managers').select('*').order('full_name', { ascending: true }),
            supabase.from('invites').select('*').eq('status', 'pending').order('full_name', { ascending: true }),
        ]);

        if (managersRes.error) { setError(managersRes.error.message); setLoading(false); return; }
        if (invitesRes.error) { setError(invitesRes.error.message); setLoading(false); return; }

        setManagers((managersRes.data as Manager[]) ?? []);
        setInvites((invitesRes.data as Invite[]) ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { void fetchAll(); }, [fetchAll]);

    return { managers, invites, loading, error, refetch: () => void fetchAll() };
}
