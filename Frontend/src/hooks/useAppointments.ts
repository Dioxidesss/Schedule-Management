import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import type { Appointment } from '../types/appointment';
import { MOCK_APPOINTMENTS, MOCK_YARD_QUEUE } from '../mocks/appointments';
import { useAuth } from '../context/AuthContext';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

interface UseAppointmentsReturn {
    appointments: Appointment[];
    yardQueue: Appointment[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Returns today's dock appointments and yard queue.
 *
 * DEV:  Set VITE_USE_MOCKS=true  → returns mock data instantly.
 * PROD: Set VITE_USE_MOCKS=false → fetches from FastAPI + subscribes to
 *       Supabase Realtime channel `facility:{id}:dashboard`.
 */
export function useAppointments(): UseAppointmentsReturn {
    const profile = useAuth();
    const facilityId = profile?.facility_id ?? null;

    const [appointments, setAppointments] = useState<Appointment[]>(
        USE_MOCKS ? MOCK_APPOINTMENTS : []
    );
    const [loading, setLoading] = useState(!USE_MOCKS);
    const [error, setError] = useState<string | null>(null);

    const appointmentsRef = useRef<Appointment[]>([]);
    appointmentsRef.current = appointments;

    const fetchAll = useCallback(async () => {
        if (USE_MOCKS || !facilityId) return;
        setLoading(true);
        setError(null);
        try {
            const today = new Date().toISOString().slice(0, 10);
            const data = await api.appointments.list(facilityId, today);
            setAppointments(data as unknown as Appointment[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load appointments');
        } finally {
            setLoading(false);
        }
    }, [facilityId]);

    useEffect(() => {
        // ── MOCK MODE ─────────────────────────────────────────────────────────
        if (USE_MOCKS) return;
        if (!facilityId) return;

        void fetchAll();

        // ── Supabase Realtime ─────────────────────────────────────────────────
        // Subscribes to the facility dashboard channel for live Gantt updates.
        let cancelled = false;

        const channel = supabase
            .channel(`facility:${facilityId}:dashboard`)
            .on('broadcast', { event: 'appointment_created' }, ({ payload }) => {
                if (cancelled) return;
                const appt = payload.data?.appointment as Appointment | undefined;
                if (appt) setAppointments((prev) => [...prev, appt]);
            })
            .on('broadcast', { event: 'appointment_updated' }, ({ payload }) => {
                if (cancelled) return;
                const { appointment_id, changes } = payload.data as {
                    appointment_id: string;
                    changes: Partial<Appointment>;
                };
                setAppointments((prev) =>
                    prev.map((a) => (a.id === appointment_id ? { ...a, ...changes } : a))
                );
            })
            .on('broadcast', { event: 'yard_queue_updated' }, () => {
                // Re-fetch the full list to get updated queue positions
                if (!cancelled) void fetchAll();
            })
            .subscribe();

        return () => {
            cancelled = true;
            void supabase.removeChannel(channel);
        };
    }, [facilityId, fetchAll]);

    const yardQueue = USE_MOCKS
        ? MOCK_YARD_QUEUE
        : appointments.filter((a) => a.status === 'yard_queue' && !a.door_id);

    return {
        appointments,
        yardQueue,
        loading,
        error,
        refetch: () => void fetchAll(),
    };
}
