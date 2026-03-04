import React, { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthContext, type UserProfile } from './AuthContext';

interface AuthProviderProps {
    children: React.ReactNode;
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role, company_id, facility_id')
        .eq('id', userId)
        .single();

    if (error || !data) return null;

    return {
        id: data.id as string,
        full_name: data.full_name as string | null,
        email: data.email as string,
        role: data.role as 'admin' | 'manager',
        company_id: data.company_id as string,
        facility_id: data.facility_id as string | null,
    };
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(async ({ data }) => {
            const s = data.session;
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) {
                const p = await fetchProfile(s.user.id);
                setProfile(p);
            }
            setLoading(false);
        });

        // 2. Subscribe to auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            if (newSession?.user) {
                const p = await fetchProfile(newSession.user.id);
                setProfile(p);
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ session, user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
