import React, { useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';

const ProfilePage: React.FC = () => {
    const [fullName, setFullName] = useState('Alex Chen');
    const [phone, setPhone] = useState('+60 12-345 6789');
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');

    return (
        <AppShell>
            <div className="p-8 max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2 font-display">Profile &amp; Settings</h1>
                <p className="text-text-secondary text-sm mb-8">Manage your personal details and security settings.</p>

                <div className="flex flex-col gap-6">
                    {/* Personal Details */}
                    <Card className="p-6">
                        <h2 className="text-white font-bold mb-5 text-lg">Personal Details</h2>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="profile_name" className="text-sm font-medium text-slate-300">Full Name</label>
                                <input
                                    id="profile_name"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="h-11 rounded-lg bg-background-dark border border-surface-border text-white px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="profile_email" className="text-sm font-medium text-slate-300">Email</label>
                                <input
                                    id="profile_email"
                                    type="email"
                                    defaultValue="alex.chen@isomer.com"
                                    disabled
                                    className="h-11 rounded-lg bg-background-dark border border-surface-border text-slate-500 px-4 cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-500">Email is managed by Supabase Auth and cannot be changed here.</p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="profile_phone" className="text-sm font-medium text-slate-300">Phone</label>
                                <input
                                    id="profile_phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="h-11 rounded-lg bg-background-dark border border-surface-border text-white px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                />
                            </div>
                            <button
                                type="button"
                                className="self-start px-6 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-lg shadow-glow hover:bg-[#60f0ff] transition-all"
                            >
                                Save Changes
                            </button>
                        </div>
                    </Card>

                    {/* Change Password */}
                    <Card className="p-6">
                        <h2 className="text-white font-bold mb-5 text-lg">Change Password</h2>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="current_pw" className="text-sm font-medium text-slate-300">Current Password</label>
                                <input
                                    id="current_pw"
                                    type="password"
                                    value={currentPw}
                                    onChange={(e) => setCurrentPw(e.target.value)}
                                    autoComplete="current-password"
                                    className="h-11 rounded-lg bg-background-dark border border-surface-border text-white px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="new_pw" className="text-sm font-medium text-slate-300">New Password</label>
                                <input
                                    id="new_pw"
                                    type="password"
                                    value={newPw}
                                    onChange={(e) => setNewPw(e.target.value)}
                                    autoComplete="new-password"
                                    className="h-11 rounded-lg bg-background-dark border border-surface-border text-white px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                />
                            </div>
                            <button
                                type="button"
                                className="self-start px-6 py-2.5 bg-surface-dark border border-surface-border text-slate-300 hover:text-white hover:border-primary/50 text-sm font-bold rounded-lg transition-all"
                            >
                                Update Password
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </AppShell>
    );
};

export default ProfilePage;
