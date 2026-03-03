export type DeviceRole = 'gatekeeper' | 'loading_dock';

export type DeviceStatus = 'online' | 'offline';

export interface Device {
    id: string;
    name: string;
    model: string;
    role: DeviceRole;
    location: string;
    door_id?: string;
    status: DeviceStatus;
    last_heartbeat_at: string; // ISO 8601
}

export interface PairingCodeRequest {
    device_name: string;
    role: DeviceRole;
    door_id?: string;
    is_locked_to_facility: boolean;
}

export interface PairingCodeResponse {
    pairing_code: string;
    expires_at: string;
}
