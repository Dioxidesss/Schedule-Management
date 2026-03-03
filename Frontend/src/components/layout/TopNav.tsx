import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import IsomerLogo from '../ui/IsomerLogo';
import Modal from '../ui/Modal';
import { useAuthContext } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface NewAppointmentFormData {
    po_number: string;
    carrier_name: string;
    date: string;
    time: string;
    load_type: 'palletized' | 'floor-loaded';
}

const INITIAL_FORM: NewAppointmentFormData = {
    po_number: '',
    carrier_name: '',
    date: '',
    time: '',
    load_type: 'palletized',
};

const NAV_LINKS = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Schedule', href: '/dashboard' },
    { label: 'Reports', href: '/dashboard' },
];

const TopNav: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [form, setForm] = useState<NewAppointmentFormData>(INITIAL_FORM);

    // Derive display name and initials from Supabase user metadata
    const fullName: string =
        (user?.user_metadata?.['full_name'] as string | undefined) ??
        user?.email?.split('@')[0] ??
        'User';
    const role: string =
        (user?.app_metadata?.['role'] as string | undefined) ?? 'Manager';
    const initials = fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const handleSignOut = async () => {
        setIsDropdownOpen(false);
        await supabase.auth.signOut();
        navigate('/auth', { replace: true });
    };

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <>
            <header className="flex items-center justify-between border-b border-white/10 bg-background-dark/80 backdrop-blur-md px-6 py-3 z-50 flex-shrink-0">
                {/* Left: Logo + Nav */}
                <div className="flex items-center gap-8">
                    <Link to="/dashboard" className="flex items-center gap-3 text-primary group">
                        <IsomerLogo size={40} />
                        <h2 className="text-white text-xl font-black leading-tight tracking-tighter font-display">
                            ISOMER
                        </h2>
                    </Link>
                    <div className="h-6 w-px bg-white/10" aria-hidden="true" />
                    <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href + link.label}
                                to={link.href}
                                className={`text-sm font-medium transition-colors ${location.pathname === link.href
                                        ? 'text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Right: Actions + Profile */}
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 hover:border-primary rounded-lg transition-all shadow-[0_0_10px_rgba(0,229,255,0.1)]"
                    >
                        <span className="material-symbols-outlined text-sm font-bold" aria-hidden="true">add</span>
                        <span className="text-xs font-bold uppercase tracking-wide">New Appointment</span>
                    </button>

                    {/* System Live */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-unloading/10 border border-unloading/20">
                        <div className="size-2 rounded-full bg-unloading animate-pulse" aria-hidden="true" />
                        <span className="text-[10px] font-bold text-unloading uppercase tracking-widest">System Live</span>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative ml-2">
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen((v) => !v)}
                            aria-expanded={isDropdownOpen}
                            aria-haspopup="menu"
                            className="flex items-center gap-3 pl-4 border-l border-white/10"
                        >
                            <div className="text-right hidden lg:block">
                                <p className="text-xs font-bold text-white">{fullName}</p>
                                <p className="text-[10px] text-slate-400 capitalize">{role}</p>
                            </div>
                            <div className="size-9 rounded-full bg-primary/20 border border-primary/40 overflow-hidden shadow-[0_0_10px_rgba(0,229,255,0.2)] hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all flex items-center justify-center text-primary font-bold text-sm">
                                {initials}
                            </div>
                        </button>

                        {isDropdownOpen && (
                            <div
                                role="menu"
                                className="absolute right-0 mt-2 w-48 bg-surface-dark border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in"
                            >
                                <Link
                                    to="/dashboard/profile"
                                    role="menuitem"
                                    className="flex items-center gap-3 p-3 hover:bg-white/5 text-sm text-slate-300 hover:text-white transition-colors"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <span className="material-symbols-outlined text-lg" aria-hidden="true">person</span>
                                    Profile &amp; Settings
                                </Link>
                                <Link
                                    to="/admin/team"
                                    role="menuitem"
                                    className="flex items-center gap-3 p-3 hover:bg-white/5 text-sm text-slate-300 hover:text-white transition-colors"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <span className="material-symbols-outlined text-lg" aria-hidden="true">admin_panel_settings</span>
                                    Admin Console
                                </Link>
                                <div className="border-t border-white/5" />
                                <button
                                    type="button"
                                    role="menuitem"
                                    className="flex w-full items-center gap-3 p-3 hover:bg-delayed/10 text-sm text-slate-400 hover:text-delayed transition-colors"
                                    onClick={handleSignOut}
                                >
                                    <span className="material-symbols-outlined text-lg" aria-hidden="true">logout</span>
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* New Appointment Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setForm(INITIAL_FORM); }}
                title="New Appointment"
            >
                <div className="flex flex-col gap-2">
                    <label htmlFor="po_number" className="text-slate-300 text-sm font-medium tracking-wide">
                        PO Number
                    </label>
                    <div className="relative group">
                        <input
                            id="po_number"
                            name="po_number"
                            type="text"
                            value={form.po_number}
                            onChange={handleFormChange}
                            placeholder="Enter PO Number (e.g. 844392)"
                            className="w-full h-12 rounded-lg bg-background-dark border border-surface-border text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all px-4 pl-11 text-base font-medium"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl pointer-events-none group-focus-within:text-primary transition-colors" aria-hidden="true">inventory_2</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="carrier_name_select" className="text-slate-300 text-sm font-medium tracking-wide">
                        Carrier Name
                    </label>
                    <div className="relative group">
                        <select
                            id="carrier_name_select"
                            name="carrier_name"
                            value={form.carrier_name}
                            onChange={handleFormChange}
                            className="w-full h-12 rounded-lg bg-background-dark border border-surface-border text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all px-4 pl-11 appearance-none cursor-pointer font-medium"
                        >
                            <option value="" disabled>Select Carrier</option>
                            <option value="fedex">FedEx Freight</option>
                            <option value="dhl">DHL Supply Chain</option>
                            <option value="xpo">XPO Logistics</option>
                            <option value="ups">UPS Freight</option>
                        </select>
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl pointer-events-none" aria-hidden="true">local_shipping</span>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" aria-hidden="true">expand_more</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-slate-300 text-sm font-medium tracking-wide">Scheduled Time</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                            <input
                                id="appt_date"
                                name="date"
                                type="date"
                                value={form.date}
                                onChange={handleFormChange}
                                className="w-full h-12 rounded-lg bg-background-dark border border-surface-border text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all px-4 pl-11 [color-scheme:dark] font-medium"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl pointer-events-none" aria-hidden="true">calendar_today</span>
                        </div>
                        <div className="relative group">
                            <input
                                id="appt_time"
                                name="time"
                                type="time"
                                value={form.time}
                                onChange={handleFormChange}
                                className="w-full h-12 rounded-lg bg-background-dark border border-surface-border text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all px-4 pl-11 [color-scheme:dark] font-medium"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl pointer-events-none" aria-hidden="true">schedule</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <span className="text-slate-300 text-sm font-medium tracking-wide">Load Type</span>
                    <div className="flex w-full p-1 bg-background-dark rounded-xl border border-surface-border">
                        {(['palletized', 'floor-loaded'] as const).map((type) => (
                            <label key={type} className="flex-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="load_type"
                                    value={type}
                                    checked={form.load_type === type}
                                    onChange={handleFormChange}
                                    className="sr-only peer"
                                />
                                <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all text-slate-400 peer-checked:bg-surface-highlight peer-checked:text-primary peer-checked:border peer-checked:border-primary/30 font-semibold text-sm capitalize">
                                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                                        {type === 'palletized' ? 'layers' : 'grid_view'}
                                    </span>
                                    {type === 'palletized' ? 'Palletized' : 'Floor-loaded'}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-border/50">
                    <button
                        type="button"
                        onClick={() => { setIsModalOpen(false); setForm(INITIAL_FORM); }}
                        className="px-6 py-3 rounded-lg text-slate-400 text-sm font-medium hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="px-8 py-3 rounded-lg bg-primary text-background-dark text-sm font-bold shadow-glow hover:bg-[#60f0ff] transition-all flex items-center gap-2 active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add_circle</span>
                        Create Appointment
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default TopNav;
