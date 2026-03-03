export type UserRole = 'admin' | 'manager';

export interface User {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    role: UserRole;
    company_id: string;
    facility_id: string;
    gmail_connected_email?: string;
}

export interface Session {
    user: User;
    access_token: string;
    refresh_token: string;
}
