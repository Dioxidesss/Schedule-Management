import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Appointment } from '../types/appointment';
import { MOCK_APPOINTMENTS, MOCK_YARD_QUEUE } from '../mocks/appointments';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

interface UseAppointmentsReturn {
    appointments: Appointment[];
    yardQueue: Appointment[];
    loading: boolean;
    error: string | null;
}

/**
 * Returns today's dock appointments and yard queue.
 *
 * DEV: Set VITE_USE_MOCKS=true in .env.local to return mock data instantly.
 * PROD: Remove or set VITE_USE_MOCKS=false to fetch from Supabase with realtime.
 *
 * Table: public.appointments
 */
export function useAppointments(): UseAppointmentsReturn {
    const [appointments, setAppointments] = useState<Appointment[]>(
        USE_MOCKS ? MOCK_APPOINTMENTS : []
    );
    const [loading, setLoading] = useState(!USE_MOCKS);
    const [error, setError] = useState<string | null>(null);

    const appointmentsRef = useRef<Appointment[]>([]);
    appointmentsRef.current = appointments;

    useEffect(() => {
        // ── MOCK MODE ─────────────────────────────────────────────────────────
        if (USE_MOCKS) return;

        // ── SUPABASE MODE ─────────────────────────────────────────────────────
        let cancelled = false;

        const fetchAll = async () => {
            setLoading(true);
            setError(null);

            const today = new Date().toISOString().slice(0, 10);
            const { data, error: fetchError } = await supabase
                .from('appointments')
                .select('*')
                .gte('scheduled_start', `${today}T00:00:00`)
                .lte('scheduled_start', `${today}T23:59:59`)
                .order('scheduled_start', { ascending: true });

            if (cancelled) return;

            if (fetchError) {
                setError(fetchError.message);
                setLoading(false);
                return;
            }

            setAppointments((data as Appointment[]) ?? []);
            setLoading(false);
        };

        void fetchAll();

        const channel = supabase
            .channel('appointments_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'appointments' },
                (payload) => {
                    if (cancelled) return;
                    const changed = payload.new as Appointment;
                    const removed = payload.old as Pick<Appointment, 'id'>;

                    setAppointments((prev) => {
                        if (payload.eventType === 'INSERT') return [...prev, changed];
                        if (payload.eventType === 'UPDATE') return prev.map((a) => (a.id === changed.id ? changed : a));
                        if (payload.eventType === 'DELETE') return prev.filter((a) => a.id !== removed.id);
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

    const yardQueue = USE_MOCKS
        ? MOCK_YARD_QUEUE
        : appointments.filter((a) => a.status === 'yard_queue' && !a.door_id);

    return { appointments, yardQueue, loading, error };
}
