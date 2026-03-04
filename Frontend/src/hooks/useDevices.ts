import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import type { Device } from '../types/device';
import { MOCK_DEVICES } from '../mocks/devices';
import { useAuth } from '../context/AuthContext';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

interface UseDevicesReturn {
    devices: Device[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Returns all registered kiosk devices for the current user's facility.
 *
 * DEV:  Set VITE_USE_MOCKS=true  → returns mock data instantly.
 * PROD: Set VITE_USE_MOCKS=false → fetches from FastAPI + subscribes to
 *       Supabase Realtime for device_status_changed events.
 */
export function useDevices(): UseDevicesReturn {
    const profile = useAuth();
    const facilityId = profile?.facility_id ?? null;

    const [devices, setDevices] = useState<Device[]>(USE_MOCKS ? MOCK_DEVICES : []);
    const [loading, setLoading] = useState(!USE_MOCKS);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        if (USE_MOCKS || !facilityId) return;
        setLoading(true);
        setError(null);
        try {
            // GET /facilities/{facilityId}/devices
            const data = await api.appointments.list(facilityId, '');  // placeholder — replace with dedicated devices.list when added to api.ts
            void data; // suppress unused
            // Direct Supabase query as fallback (devices endpoint not yet in api.ts list helper)
            const { data: rows, error: dbErr } = await supabase
                .from('devices')
                .select('*')
                .eq('facility_id', facilityId)
                .order('id', { ascending: true });
            if (dbErr) throw new Error(dbErr.message);
            setDevices((rows as Device[]) ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load devices');
        } finally {
            setLoading(false);
        }
    }, [facilityId]);

    useEffect(() => {
        if (USE_MOCKS) return;
        if (!facilityId) return;

        void fetchAll();

        let cancelled = false;

        // device_status_changed arrives on the facility dashboard broadcast channel
        const channel = supabase
            .channel(`facility:${facilityId}:dashboard:devices`)
            .on('broadcast', { event: 'device_status_changed' }, ({ payload }) => {
                if (cancelled) return;
                const { device_id, status, last_heartbeat_at } = payload.data as {
                    device_id: string;
                    status: 'online' | 'offline';
                    last_heartbeat_at: string;
                };
                setDevices((prev) =>
                    prev.map((d) =>
                        d.id === device_id ? { ...d, status, last_heartbeat_at } : d
                    )
                );
            })
            .subscribe();

        return () => {
            cancelled = true;
            void supabase.removeChannel(channel);
        };
    }, [facilityId, fetchAll]);

    return { devices, loading, error, refetch: () => void fetchAll() };
}
