/**
 * Typed API service layer — forwards Supabase JWT to the FastAPI backend.
 *
 * All functions check VITE_BACKEND_URL (falls back to http://localhost:8000).
 * Usage:  import { api } from '../lib/api';
 *         const appt = await api.appointments.create(facilityId, body);
 */

import { supabase } from './supabase';

const BASE_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:8000';

// ── Error type ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly errorCode: string,
        message: string,
        public readonly detail?: unknown,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// ── Core fetch helper ─────────────────────────────────────────────────────────

async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
    /**
     * When true, attach the Supabase user JWT.
     * When false (kiosk endpoints), attach the device token from localStorage instead.
     */
    authMode: 'user' | 'device' | 'none' = 'user',
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> | undefined),
    };

    if (authMode === 'user') {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) headers['Authorization'] = `Bearer ${token}`;
    } else if (authMode === 'device') {
        const token = localStorage.getItem('isomer_device_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (!res.ok) {
        let errorCode = 'UNKNOWN_ERROR';
        let message = `Request failed: ${res.status}`;
        let detail: unknown;
        try {
            const body = (await res.json()) as { error_code?: string; message?: string; detail?: unknown };
            errorCode = body.error_code ?? errorCode;
            message = body.message ?? message;
            detail = body.detail;
        } catch {
            // non-JSON error body — keep defaults
        }
        throw new ApiError(res.status, errorCode, message, detail);
    }

    return res.json() as Promise<T>;
}

// ── Appointments ──────────────────────────────────────────────────────────────

export interface CreateAppointmentBody {
    po_number: string;
    carrier_name: string;
    scheduled_start: string; // ISO 8601
    scheduled_end?: string;
    load_type: 'palletized' | 'floor_loaded';
}

export interface UpdateAppointmentBody {
    status?: string;
    door_id?: string;
    scheduled_start?: string;
    scheduled_end?: string;
    carrier_name?: string;
    load_type?: string;
}

export interface AppointmentResponse {
    appointment_id: string;
    status: string;
    provisional_door_id: string | null;
}

const appointments = {
    list: (facilityId: string, date: string) =>
        apiFetch<Record<string, unknown>[]>(
            `/facilities/${facilityId}/appointments?date=${date}`
        ),

    create: (facilityId: string, body: CreateAppointmentBody) =>
        apiFetch<AppointmentResponse>(
            `/facilities/${facilityId}/appointments`,
            { method: 'POST', body: JSON.stringify(body) }
        ),

    get: (appointmentId: string) =>
        apiFetch<Record<string, unknown>>(`/appointments/${appointmentId}`),

    update: (appointmentId: string, body: UpdateAppointmentBody) =>
        apiFetch<Record<string, unknown>>(
            `/appointments/${appointmentId}`,
            { method: 'PATCH', body: JSON.stringify(body) }
        ),
};

// ── Devices ───────────────────────────────────────────────────────────────────

export interface GeneratePairingCodeBody {
    device_name: string;
    role: 'gatehouse' | 'loading_dock';
    door_id?: string;
    is_locked_to_facility?: boolean;
}

export interface PairingCodeResponse {
    pairing_code: string;
    expires_at: string;
}

export interface PairDeviceBody {
    code: string;
    device_model: string;
    device_name: string;
}

export interface PairDeviceResponse {
    device_id: string;
    facility_id: string;
    role: string;
    door_id: string | null;
    device_token: string;
}

const devices = {
    generatePairingCode: (facilityId: string, body: GeneratePairingCodeBody) =>
        apiFetch<PairingCodeResponse>(
            `/facilities/${facilityId}/devices/pairing-codes`,
            { method: 'POST', body: JSON.stringify(body) }
        ),

    pair: (body: PairDeviceBody) =>
        apiFetch<PairDeviceResponse>(
            '/devices/pair',
            { method: 'POST', body: JSON.stringify(body) },
            'none'
        ),

    heartbeat: (deviceId: string, status: 'online' | 'offline' = 'online') =>
        apiFetch<{ success: boolean }>(
            `/devices/${deviceId}/heartbeat`,
            {
                method: 'POST',
                body: JSON.stringify({ status, observed_at: new Date().toISOString() }),
            },
            'device'
        ),
};

// ── Team ──────────────────────────────────────────────────────────────────────

export interface InviteManagerBody {
    full_name: string;
    email: string;
    facility_id: string;
}

const team = {
    listManagers: () =>
        apiFetch<Record<string, unknown>[]>('/admin/team'),

    invite: (body: InviteManagerBody) =>
        apiFetch<{ invite_id: string; status: string; expires_at: string }>(
            '/admin/team/invites',
            { method: 'POST', body: JSON.stringify(body) }
        ),

    resendInvite: (inviteId: string) =>
        apiFetch<{ invite_id: string; resent_at: string }>(
            `/admin/team/invites/${inviteId}/resend`,
            { method: 'POST' }
        ),

    revokeManager: (userId: string) =>
        apiFetch<{ user_id: string; is_active: boolean }>(
            `/admin/team/${userId}/revoke`,
            { method: 'PATCH', body: JSON.stringify({}) }
        ),
};

// ── Billing ───────────────────────────────────────────────────────────────────

const billing = {
    getSubscription: () =>
        apiFetch<Record<string, unknown>>('/admin/billing/subscription'),

    getPaymentMethods: () =>
        apiFetch<Record<string, unknown>[]>('/admin/billing/payment-methods'),
};

// ── Kiosk ─────────────────────────────────────────────────────────────────────

export interface CheckInBody {
    facility_id: string;
    identifier: string;
    checked_in_at: string; // ISO 8601
}

export interface CheckInResponse {
    appointment_id: string;
    match_status: 'matched' | 'not_found';
    assigned_door_id: string | null;
}

export interface StartUnloadBody {
    appointment_id: string;
    actual_start: string;
}

export interface CompleteUnloadBody {
    appointment_id: string;
    actual_end: string;
}

const kiosk = {
    checkIn: (body: CheckInBody) =>
        apiFetch<CheckInResponse>(
            '/gatehouse/check-in',
            { method: 'POST', body: JSON.stringify(body) },
            'device'
        ),

    startUnload: (body: StartUnloadBody) =>
        apiFetch<{ appointment_id: string; status: string }>(
            '/dock-worker/start-unload',
            { method: 'POST', body: JSON.stringify(body) },
            'device'
        ),

    completeUnload: (body: CompleteUnloadBody) =>
        apiFetch<{ appointment_id: string; status: string }>(
            '/dock-worker/complete-unload',
            { method: 'POST', body: JSON.stringify(body) },
            'device'
        ),
};

// ── Named exports ─────────────────────────────────────────────────────────────

export const api = { appointments, devices, team, billing, kiosk };
