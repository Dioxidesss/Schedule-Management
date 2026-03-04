import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Device } from '../types/device';
import { MOCK_DEVICES } from '../mocks/devices';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

interface UseDevicesReturn {
    devices: Device[];
    loading: boolean;
    error: string | null;
}

/**
 * Returns all registered kiosk devices.
 *
 * DEV: Set VITE_USE_MOCKS=true in .env.local to return mock data instantly.
 * PROD: Remove or set VITE_USE_MOCKS=false to fetch from Supabase with realtime.
 *
 * Table: public.devices
 */
export function useDevices(): UseDevicesReturn {
    const [devices, setDevices] = useState<Device[]>(USE_MOCKS ? MOCK_DEVICES : []);
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

            const { data, error: fetchError } = await supabase
                .from('devices')
                .select('*')
                .order('id', { ascending: true });

            if (cancelled) return;

            if (fetchError) {
                setError(fetchError.message);
                setLoading(false);
                return;
            }

            setDevices((data as Device[]) ?? []);
            setLoading(false);
        };

        void fetchAll();

        const channel = supabase
            .channel('devices_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'devices' },
                (payload) => {
                    if (cancelled) return;
                    const changed = payload.new as Device;
                    const removed = payload.old as Pick<Device, 'id'>;

                    setDevices((prev) => {
                        if (payload.eventType === 'INSERT') return [...prev, changed];
                        if (payload.eventType === 'UPDATE') return prev.map((d) => (d.id === changed.id ? changed : d));
                        if (payload.eventType === 'DELETE') return prev.filter((d) => d.id !== removed.id);
                        return prev;
                    });
                }
            )
            .subscribe();

        return () => {
            cancelled = true;
            void supabase.removeChannel(channel);
        };
    }, []);

    return { devices, loading, error };
}
