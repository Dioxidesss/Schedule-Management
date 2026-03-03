import React, { useState } from 'react';
import IsomerLogo from '../../components/ui/IsomerLogo';

type AuthTab = 'login' | 'signup';

const AuthPage: React.FC = () => {
    const [tab, setTab] = useState<AuthTab>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-background-dark font-display selection:bg-primary/30 overflow-hidden relative">
            {/* Background ambient glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-royal-blue/10 blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md px-4">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8 gap-3">
                    <IsomerLogo size={48} />
                    <h1 className="text-white text-2xl font-black tracking-tighter">ISOMER</h1>
                    <p className="text-slate-400 text-sm">AI-Powered Dock Scheduling</p>
                </div>

                {/* Card */}
                <div className="bg-surface-dark border border-surface-border rounded-2xl shadow-modal overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-surface-border">
                        {(['login', 'signup'] as AuthTab[]).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTab(t)}
                                className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${tab === t
                                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {t === 'login' ? 'Sign In' : 'Create Account'}
                            </button>
                        ))}
                    </div>

                    <div className="p-8 flex flex-col gap-5">
                        {tab === 'signup' && (
                            <div className="flex flex-col gap-2">
                                <label htmlFor="full_name" className="text-slate-300 text-sm font-medium">Full Name</label>
                                <input
                                    id="full_name"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Alex Chen"
                                    autoComplete="name"
                                    className="w-full h-12 rounded-lg bg-background-dark border border-surface-border text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none px-4 transition-all"
                                />
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label htmlFor="auth_email" className="text-slate-300 text-sm font-medium">Email</label>
                            <input
                                id="auth_email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                autoComplete="email"
                                className="w-full h-12 rounded-lg bg-background-dark border border-surface-border text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none px-4 transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="auth_password" className="text-slate-300 text-sm font-medium">Password</label>
                            <input
                                id="auth_password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                                className="w-full h-12 rounded-lg bg-background-dark border border-surface-border text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none px-4 transition-all"
                            />
                        </div>

                        <button
                            type="button"
                            className="w-full h-12 bg-primary text-background-dark font-bold rounded-lg shadow-glow hover:bg-[#60f0ff] transition-all mt-2 uppercase tracking-wider"
                        >
                            {tab === 'login' ? 'Sign In' : 'Create Account'}
                        </button>

                        <div className="flex items-center gap-3 text-slate-500 text-xs">
                            <div className="flex-1 h-px bg-white/10" />
                            OR
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        <button
                            type="button"
                            className="w-full h-12 border border-surface-border text-slate-300 hover:text-white hover:border-primary/50 rounded-lg font-medium transition-all flex items-center justify-center gap-3"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
