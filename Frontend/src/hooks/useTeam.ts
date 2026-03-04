import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
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
 * DEV:  Set VITE_USE_MOCKS=true  → returns mock data instantly.
 * PROD: Set VITE_USE_MOCKS=false → calls GET /admin/team.
 */
export function useTeam(): UseTeamReturn {
    const [managers, setManagers] = useState<Manager[]>(USE_MOCKS ? MOCK_MANAGERS : []);
    const [invites, setInvites] = useState<Invite[]>(USE_MOCKS ? MOCK_INVITES : []);
    const [loading, setLoading] = useState(!USE_MOCKS);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        if (USE_MOCKS) return;
        setLoading(true);
        setError(null);
        try {
            const rows = await api.team.listManagers();
            // Backend returns managers + invites mixed; split by status field presence
            const mgrs = rows.filter(
                (r) => !('invite_token' in r)
            ) as unknown as Manager[];
            const invs = rows.filter(
                (r) => 'invite_token' in r
            ) as unknown as Invite[];
            setManagers(mgrs);
            setInvites(invs);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load team');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchAll();
    }, [fetchAll]);

    return {
        managers,
        invites,
        loading,
        error,
        refetch: () => void fetchAll(),
    };
}
