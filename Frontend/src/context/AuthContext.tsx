import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthContextValue {
    session: Session | null;
    user: User | null;
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
