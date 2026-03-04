import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

/** Profile data from the public.users table (joined after auth). */
export interface UserProfile {
    id: string;
    full_name: string | null;
    email: string;
    role: 'admin' | 'manager';
    company_id: string;
    facility_id: string | null;
}

export interface AuthContextValue {
    session: Session | null;
    user: User | null;
    /** Populated after users table JOIN completes. Null while loading or unauthenticated. */
    profile: UserProfile | null;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Hook to consume auth context. Throws if used outside <AuthProvider>.
 */
export function useAuthContext(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuthContext must be used inside <AuthProvider>');
    }
    return ctx;
}

/**
 * Convenience hook — returns just the profile.
 * Returns null if unauthenticated or still loading.
 */
export function useAuth(): UserProfile | null {
    return useAuthContext().profile;
}
