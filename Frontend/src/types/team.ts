export type InviteStatus = 'pending' | 'accepted' | 'expired';

export interface Manager {
    id: string;
    full_name: string;
    email: string;
    facility_name: string;
    facility_id: string;
    is_active: boolean;
    joined_at: string; // ISO 8601
}

export interface Invite {
    id: string;
    full_name: string;
    email: string;
    facility_id: string;
    facility_name: string;
    status: InviteStatus;
    expires_at: string; // ISO 8601
}
