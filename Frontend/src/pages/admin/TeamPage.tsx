import React, { useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import SideNav from '../../components/layout/SideNav';
import { useTeam } from '../../hooks/useTeam';
import { useDevices } from '../../hooks/useDevices';
import type { Manager, Invite } from '../../types/team';
import type { Device } from '../../types/device';

// ─── Avatar helper ────────────────────────────────────────────────────────────
const AVATAR_COLORS: Record<string, string> = {
    SC: 'bg-primary/20 text-primary border-primary/20',
    DK: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20',
    JW: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
    AL: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
    EP: 'bg-pink-500/20 text-pink-400 border-pink-500/20',
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getAvatarClass(initials: string): string {
    return AVATAR_COLORS[initials] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/20';
}

// ─── Invite Manager Modal ─────────────────────────────────────────────────────
interface InviteForm {
    full_name: string;
    email: string;
    facility: string;
}

const FACILITIES = [
    'West Coast Distribution Center',
    'Texas Logistics Hub',
    'New Jersey Port Facility',
    'Chicago Central Depot',
    'Miami Cold Storage',
    'Seattle Fulfillment',
];

const InviteManagerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [form, setForm] = useState<InviteForm>({ full_name: '', email: '', facility: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="absolute inset-0 bg-background-dark/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-[#1B2A47] border border-primary/30 rounded-xl shadow-2xl shadow-primary/10 overflow-hidden">
                {/* Header */}
                <div className="px-8 py-6 border-b border-surface-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white tracking-tight">Invite New Manager</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-text-secondary hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider">Full Name</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">person</span>
                            <input
                                name="full_name"
                                type="text"
                                value={form.full_name}
                                onChange={handleChange}
                                placeholder="Enter full name"
                                className="w-full bg-surface-dark border border-surface-border rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider">Email Address</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">mail</span>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="name@isomer.ai"
                                className="w-full bg-surface-dark border border-surface-border rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Facility */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider">Assigned Facility</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">warehouse</span>
                            <select
                                name="facility"
                                value={form.facility}
                                onChange={handleChange}
                                className="w-full bg-surface-dark border border-surface-border rounded-lg pl-10 pr-10 py-3 text-white appearance-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
                            >
                                <option value="" disabled>Select a facility...</option>
                                {FACILITIES.map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-[24px] pointer-events-none">arrow_drop_down</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-surface-dark/50 border-t border-surface-border flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg border border-surface-border text-text-secondary hover:text-white hover:bg-surface-border/50 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-background-dark font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">send</span>
                        Send Invitation
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Register Device Modal ─────────────────────────────────────────────────────
const RegisterDeviceModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
        <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-md" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-[#1B2A47] rounded-xl border border-primary/30 shadow-[0_0_20px_rgba(0,229,255,0.3)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-surface-border flex justify-between items-center bg-[#15203a]">
                <h3 className="text-white text-xl font-bold">Register New Device</h3>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close modal"
                    className="text-text-secondary hover:text-white hover:bg-surface-border transition-all duration-200 p-2 rounded-full group"
                >
                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">close</span>
                </button>
            </div>

            {/* Body */}
            <div className="p-8 flex flex-col items-center gap-8">
                {/* Pairing Code */}
                <div className="flex flex-col items-center gap-2 w-full">
                    <p className="text-primary text-sm font-medium uppercase tracking-widest">6-digit Pairing Code</p>
                    <div
                        className="text-6xl md:text-7xl font-bold text-white tracking-widest font-mono"
                        style={{ textShadow: '0 0 10px rgba(0,229,255,0.5)' }}
                    >
                        882-941
                    </div>
                </div>

                {/* Spinner + waiting */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative size-10">
                        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                        <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                    </div>
                    <p className="text-text-secondary text-sm animate-pulse">... Waiting for connection...</p>
                </div>

                {/* Instructions */}
                <div className="w-full bg-[#131e36] rounded-lg p-5 border border-surface-border">
                    <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">info</span>
                        Pairing Instructions
                    </h4>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                            <div>
                                <p className="text-white text-sm font-bold">Open Isomer App</p>
                                <p className="text-text-secondary text-xs mt-0.5 leading-relaxed">Launch the Isomer Kiosk application on the tablet you wish to register.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                            <div>
                                <p className="text-white text-sm font-bold">Enter Code</p>
                                <p className="text-text-secondary text-xs mt-0.5 leading-relaxed">Input the code shown above when prompted.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-surface-border bg-[#15203a] flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    disabled
                    className="px-6 py-2 bg-primary/20 text-primary/50 font-bold text-sm rounded-lg border border-primary/20 cursor-not-allowed flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[18px]">link_off</span>
                    Confirm Pairing
                </button>
            </div>
        </div>
    </div>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
    icon: string;
    bgIcon?: string;
    label: string;
    value: number | string;
    iconColorClass?: string;
    iconBgClass?: string;
}

const AdminStatCard: React.FC<StatCardProps> = ({
    icon, bgIcon, label, value,
    iconColorClass = 'text-primary',
    iconBgClass = 'bg-primary/10',
}) => (
    <div className="bg-surface-dark border border-surface-border p-5 rounded-xl flex items-center gap-4 relative overflow-hidden group">
        {bgIcon && (
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className={`material-symbols-outlined text-[80px] ${iconColorClass}`}>{bgIcon}</span>
            </div>
        )}
        <div className={`size-12 rounded-full ${iconBgClass} flex items-center justify-center ${iconColorClass} shrink-0 z-10`}>
            <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="z-10">
            <p className="text-text-secondary text-sm font-medium uppercase tracking-wider">{label}</p>
            <p className="text-white text-3xl font-bold mt-1">{value}</p>
        </div>
    </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: 'active' | 'invited' | 'online' | 'offline' }> = ({ status }) => {
    const cfg = {
        active: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500 animate-pulse', label: 'Active' },
        invited: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500', label: 'Invited' },
        online: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500 animate-pulse', label: 'Online' },
        offline: { cls: 'bg-red-500/10 text-status-offline border-red-500/20', dot: 'bg-red-500', label: 'Offline' },
    }[status];

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wide ${cfg.cls}`}>
            <span className={`size-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

// ─── Table Search + Actions bar ───────────────────────────────────────────────
const TableToolbar: React.FC<{ placeholder: string; showIcons?: boolean }> = ({ placeholder, showIcons }) => (
    <div className="p-4 border-b border-surface-border flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">search</span>
                <input
                    type="search"
                    placeholder={placeholder}
                    className="w-full bg-background-dark border border-surface-border rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                />
            </div>
            <button
                type="button"
                className="px-4 py-2 bg-background-dark border border-surface-border rounded-lg text-text-secondary text-sm font-medium hover:text-white flex items-center gap-2 hover:border-primary/50 transition-colors"
            >
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                Filters
            </button>
        </div>
        {showIcons && (
            <div className="flex gap-2">
                <button type="button" className="p-2 text-text-secondary hover:text-white hover:bg-surface-border rounded-lg transition-colors" title="Export CSV">
                    <span className="material-symbols-outlined">download</span>
                </button>
                <button type="button" className="p-2 text-text-secondary hover:text-white hover:bg-surface-border rounded-lg transition-colors" title="Settings">
                    <span className="material-symbols-outlined">settings</span>
                </button>
            </div>
        )}
    </div>
);

// Table pagination footer
const TablePager: React.FC<{ showing: number; total: number; unit: string }> = ({ showing, total, unit }) => (
    <div className="px-6 py-3 border-t border-surface-border flex items-center justify-between bg-[#0d1630]/50">
        <p className="text-xs text-text-secondary">
            Showing <span className="font-medium text-white">1-{showing}</span> of <span className="font-medium text-white">{total}</span> {unit}
        </p>
        <div className="flex gap-2">
            <button disabled type="button" className="size-8 flex items-center justify-center rounded-lg border border-surface-border text-text-secondary disabled:opacity-50">
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button type="button" className="size-8 flex items-center justify-center rounded-lg bg-primary text-background-dark font-bold text-sm" aria-current="page">1</button>
            <button type="button" className="size-8 flex items-center justify-center rounded-lg border border-surface-border text-text-secondary hover:bg-surface-border transition-colors">2</button>
            <button type="button" className="size-8 flex items-center justify-center rounded-lg border border-surface-border text-text-secondary hover:bg-surface-border transition-colors">3</button>
            <button type="button" aria-label="Next page" className="size-8 flex items-center justify-center rounded-lg border border-surface-border text-text-secondary hover:bg-surface-border transition-colors">
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
        </div>
    </div>
);

// ─── Managers Table ───────────────────────────────────────────────────────────
const ManagersTable: React.FC<{ managers: Manager[]; invites: Invite[]; onInvite: () => void }> = ({
    managers, invites, onInvite,
}) => (
    <>
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div className="flex flex-col gap-2 max-w-2xl">
                <h1 className="text-white text-3xl md:text-4xl font-bold tracking-tight font-display">Team Management</h1>
                <p className="text-text-secondary text-base">
                    Full control over facility managers, access permissions, and invites across your logistics network.
                </p>
            </div>
            <button
                type="button"
                onClick={onInvite}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-background-dark font-bold text-sm px-5 py-2.5 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 shrink-0"
            >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Invite Manager
            </button>
        </header>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <AdminStatCard icon="badge" bgIcon="badge" label="Total Managers" value={24} />
            <AdminStatCard icon="check_circle" bgIcon="check_circle" label="Active Accounts" value={21} iconColorClass="text-emerald-500" iconBgClass="bg-emerald-500/10" />
            <AdminStatCard icon="mark_email_unread" bgIcon="mark_email_unread" label="Pending Invites" value={invites.length} iconColorClass="text-amber-500" iconBgClass="bg-amber-500/10" />
        </div>

        {/* Table */}
        <div className="bg-surface-dark border border-surface-border rounded-xl overflow-hidden shadow-sm">
            <TableToolbar placeholder="Search by name, email or facility..." showIcons />

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#0d1630] border-b border-surface-border">
                            {['Manager', 'Email', 'Assigned Facility', 'Status', 'Actions'].map((h, i) => (
                                <th key={h} className={`px-6 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider ${i === 4 ? 'text-right' : ''} ${i === 0 ? 'w-1/4' : ''}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                        {managers.map((m) => {
                            const initials = getInitials(m.full_name);
                            return (
                                <tr key={m.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs border ${getAvatarClass(initials)}`}>
                                                {initials}
                                            </div>
                                            <span className="text-sm font-medium text-white">{m.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-text-secondary font-mono text-xs">{m.email}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-text-secondary">{m.facility_name}</td>
                                    <td className="px-6 py-3 whitespace-nowrap"><StatusBadge status="active" /></td>
                                    <td className="px-6 py-3 whitespace-nowrap text-right">
                                        <button type="button" className="text-xs font-bold text-danger/80 hover:text-danger hover:underline transition-colors uppercase tracking-wide">
                                            Revoke Access
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {invites.map((inv) => {
                            const initials = getInitials(inv.full_name);
                            return (
                                <tr key={inv.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs border ${getAvatarClass(initials)}`}>
                                                {initials}
                                            </div>
                                            <span className="text-sm font-medium text-white">{inv.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-text-secondary font-mono text-xs">{inv.email}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-text-secondary">{inv.facility_name}</td>
                                    <td className="px-6 py-3 whitespace-nowrap"><StatusBadge status="invited" /></td>
                                    <td className="px-6 py-3 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-4">
                                            <button type="button" className="text-xs font-bold text-text-secondary hover:text-primary hover:underline transition-colors uppercase tracking-wide">Resend</button>
                                            <button type="button" className="text-xs font-bold text-danger/80 hover:text-danger hover:underline transition-colors uppercase tracking-wide">Revoke</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <TablePager showing={managers.length + invites.length} total={24} unit="managers" />
        </div>
    </>
);

// ─── Device Kiosks Table ──────────────────────────────────────────────────────
const DEVICE_ICON: Record<string, string> = {
    gatekeeper: 'tablet_mac',
    loading_dock: 'desktop_windows',
};

const ROLE_LABEL: Record<string, string> = {
    gatekeeper: 'Gatekeeper',
    loading_dock: 'Loading Dock',
};

const DevicesTable: React.FC<{ devices: Device[]; onRegister: () => void }> = ({ devices, onRegister }) => {
    const online = devices.filter((d) => d.status === 'online').length;
    const offline = devices.filter((d) => d.status === 'offline').length;

    return (
        <>
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div className="flex flex-col gap-2 max-w-2xl">
                    <h1 className="text-white text-3xl md:text-4xl font-bold tracking-tight font-display">Device Kiosks</h1>
                    <p className="text-text-secondary text-base">Monitor the status and connectivity of facility kiosks.</p>
                </div>
                <button
                    type="button"
                    onClick={onRegister}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-background-dark font-bold text-sm px-5 py-2.5 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Register Device
                </button>
            </header>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <AdminStatCard icon="devices" label="Total Devices" value={42} />
                <AdminStatCard icon="wifi" label="Online Now" value={online + 37} iconColorClass="text-status-online" iconBgClass="bg-status-online/10" />
                <AdminStatCard icon="wifi_off" label="Offline" value={offline + 3} iconColorClass="text-status-offline" iconBgClass="bg-status-offline/10" />
            </div>

            {/* Table */}
            <div className="bg-surface-dark border border-surface-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-surface-border flex gap-3">
                    <div className="relative flex-1 max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">search</span>
                        <input
                            type="search"
                            placeholder="Search device ID or location..."
                            className="w-full bg-background-dark border border-surface-border rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <button type="button" className="px-4 py-2 bg-background-dark border border-surface-border rounded-lg text-text-secondary text-sm font-medium hover:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">filter_list</span>
                        Status: All
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#0f172a] border-b border-surface-border">
                                {['Device ID / Model', 'Location', 'Role', 'Last Heartbeat', 'Status'].map((h, i) => (
                                    <th key={h} className={`px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {devices.map((device) => (
                                <tr key={device.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded bg-surface-dark border border-surface-border flex items-center justify-center text-text-secondary shrink-0">
                                                <span className="material-symbols-outlined">{DEVICE_ICON[device.role] ?? 'tablet_mac'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-white font-mono">{device.id}</span>
                                                <span className="text-xs text-text-secondary">{device.model}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{device.location}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                            {ROLE_LABEL[device.role] ?? device.role}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${device.status === 'offline' ? 'text-danger' : 'text-text-secondary'}`}>
                                        {device.status === 'offline' ? '3 hours ago' : '2 mins ago'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <StatusBadge status={device.status as 'online' | 'offline'} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <TablePager showing={devices.length} total={42} unit="devices" />
            </div>
        </>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
type Tab = 'team' | 'devices';

const TeamPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('team');
    const [isInviteOpen, setInviteOpen] = useState(false);
    const [isRegisterOpen, setRegisterOpen] = useState(false);

    const { managers, invites, loading: teamLoading, error: teamError, refetch } = useTeam();
    const { devices, loading: devicesLoading, error: devicesError } = useDevices();

    const loading = teamLoading || devicesLoading;
    const error = teamError ?? devicesError;

    if (loading) {
        return (
            <AppShell sidebar={<SideNav />}>
                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-4 text-text-secondary">
                        <div className="size-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        <p className="text-sm">Loading team data...</p>
                    </div>
                </div>
            </AppShell>
        );
    }

    if (error) {
        return (
            <AppShell sidebar={<SideNav />}>
                <div className="flex items-center justify-center h-full">
                    <p className="text-danger text-sm">Failed to load data: {error}</p>
                </div>
            </AppShell>
        );
    }

    return (
        <>
            <AppShell sidebar={<SideNav />}>
                <div className="w-full max-w-7xl mx-auto px-8 py-10 overflow-y-auto">
                    {/* Tab switcher */}
                    <nav className="flex items-center gap-1 mb-8 p-1 bg-surface-dark border border-surface-border rounded-xl w-fit">
                        <button
                            type="button"
                            onClick={() => setActiveTab('team')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'team' ? 'bg-primary text-background-dark shadow-md' : 'text-text-secondary hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">badge</span>
                            Team Management
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('devices')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'devices' ? 'bg-primary text-background-dark shadow-md' : 'text-text-secondary hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">devices</span>
                            Device Kiosks
                        </button>
                    </nav>

                    {activeTab === 'team' ? (
                        <ManagersTable
                            managers={managers}
                            invites={invites}
                            onInvite={() => setInviteOpen(true)}
                        />
                    ) : (
                        <DevicesTable
                            devices={devices}
                            onRegister={() => setRegisterOpen(true)}
                        />
                    )}
                </div>
            </AppShell>

            {isInviteOpen && <InviteManagerModal onClose={() => { setInviteOpen(false); refetch(); }} />}
            {isRegisterOpen && <RegisterDeviceModal onClose={() => setRegisterOpen(false)} />}
        </>
    );
};

export default TeamPage;
