import React, { useState } from 'react';
import { api, ApiError, type CheckInResponse } from '../../lib/api';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

type SearchStatus = 'idle' | 'found' | 'not_found';

interface MatchResult {
    vendor: string;
    scheduledTime: string;
    dock: string;
    status: 'ON TIME' | 'LATE' | 'EARLY';
    appointmentId?: string;
    assignedDoorId?: string | null;
}

// Mock lookup for DEV (VITE_USE_MOCKS=true) — not shown to production users
const MOCK_LOOKUP: Record<string, MatchResult> = {
    'PO-8821': { vendor: 'Samsung Logistics', scheduledTime: '14:00', dock: 'North', status: 'ON TIME' },
    'PO-4432': { vendor: 'Northstar Freight', scheduledTime: '09:30', dock: 'South', status: 'LATE' },
    'PO-1109': { vendor: 'Amazon Relay', scheduledTime: '09:00', dock: 'East', status: 'EARLY' },
};

const GatehousePage: React.FC = () => {
    const [query, setQuery] = useState('');
    const [searchStatus, setSearchStatus] = useState<SearchStatus>('found');
    const [match, setMatch] = useState<MatchResult | null>(MOCK_LOOKUP['PO-8821']);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [checkedIn, setCheckedIn] = useState(false);

    // ── Search handler ────────────────────────────────────────────────────────
    const handleSearch = (value: string) => {
        setQuery(value);
        setSubmitError(null);
        setCheckedIn(false);
        if (!value.trim()) { setSearchStatus('idle'); setMatch(null); return; }

        if (USE_MOCKS) {
            const found = MOCK_LOOKUP[value.trim().toUpperCase()];
            setSearchStatus(found ? 'found' : 'not_found');
            setMatch(found ?? null);
        }
        // In PROD mode, search-on-type isn't used — the user taps "Check-In Truck"
    };

    // ── Check-in handler ──────────────────────────────────────────────────────
    const handleCheckIn = async () => {
        if (submitting) return;
        setSubmitting(true);
        setSubmitError(null);

        if (USE_MOCKS) {
            // Simulate a brief delay
            await new Promise((r) => setTimeout(r, 600));
            setCheckedIn(true);
            setSubmitting(false);
            return;
        }

        // PROD: call the backend
        const facilityId = localStorage.getItem('isomer_facility_id') ?? '';
        try {
            const res: CheckInResponse = await api.kiosk.checkIn({
                facility_id: facilityId,
                identifier: query.trim(),
                checked_in_at: new Date().toISOString(),
            });

            if (res.match_status === 'matched') {
                setSearchStatus('found');
                setMatch({
                    vendor: query,           // carrier name not returned — show PO as fallback
                    scheduledTime: '—',
                    dock: res.assigned_door_id ?? 'Queue',
                    status: 'ON TIME',
                    appointmentId: res.appointment_id,
                    assignedDoorId: res.assigned_door_id,
                });
                setCheckedIn(true);
            } else {
                setSearchStatus('not_found');
                setMatch(null);
            }
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 404) {
                    setSearchStatus('not_found');
                    setMatch(null);
                } else {
                    setSubmitError(err.message);
                }
            } else {
                setSubmitError('Unexpected error. Try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050a18] font-display flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background glow orbs */}
            <div className="fixed inset-0 -z-10" aria-hidden="true">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gate-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gate-accent/5 blur-[100px]" />
            </div>

            {/* Kiosk card */}
            <main
                className="w-full max-w-md h-[850px] max-h-screen rounded-2xl flex flex-col relative overflow-hidden shadow-2xl"
                style={{
                    background: 'rgba(19, 31, 62, 0.7)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(6, 249, 6, 0.15)',
                }}
            >
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-5 border-b border-gate-primary/20 bg-surface-dark/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="size-8 text-gate-primary flex items-center justify-center bg-gate-primary/10 rounded-lg">
                            <span className="material-symbols-outlined text-2xl" aria-hidden="true">local_shipping</span>
                        </div>
                        <div>
                            <h2 className="text-white text-lg font-bold leading-none tracking-tight">ISOMER</h2>
                            <span className="text-gate-accent text-xs font-medium tracking-widest uppercase">Gatekeeper</span>
                        </div>
                    </div>
                    <button type="button" aria-label="Settings" className="flex items-center justify-center size-10 rounded-lg hover:bg-white/5 transition-colors text-slate-300">
                        <span className="material-symbols-outlined" aria-hidden="true">settings</span>
                    </button>
                </header>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-8 pb-28">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-2">Truck Arrival</h1>
                        <p className="text-slate-400 text-sm">Scan documents or enter details manually</p>
                    </div>

                    {/* Search input */}
                    <div className="w-full">
                        <label htmlFor="vehicle_search" className="block text-gate-accent text-xs font-bold uppercase tracking-wider mb-2 ml-1">Identify Vehicle</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gate-primary">
                                <span className="material-symbols-outlined text-2xl" aria-hidden="true">search</span>
                            </div>
                            <input
                                id="vehicle_search"
                                type="text"
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Enter PO Number or License Plate"
                                className="block w-full rounded-xl border-2 border-gate-primary/30 bg-surface-dark py-4 pl-12 pr-12 text-white placeholder:text-slate-500 focus:border-gate-primary focus:ring-0 focus:outline-none text-lg font-medium transition-all shadow-[0_0_20px_rgba(6,249,6,0.05)] focus:shadow-[0_0_20px_rgba(6,249,6,0.15)]"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <button type="button" aria-label="Scan QR code" className="p-2 text-slate-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined" aria-hidden="true">qr_code_scanner</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Idle */}
                    {searchStatus === 'idle' && (
                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                            <span className="material-symbols-outlined text-5xl text-slate-600">local_shipping</span>
                            <p className="text-slate-500 text-sm">Enter a PO number or plate to verify the truck</p>
                        </div>
                    )}

                    {/* Not found */}
                    {searchStatus === 'not_found' && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-400 text-2xl mt-0.5" aria-hidden="true">gpp_bad</span>
                            <div>
                                <p className="text-red-400 font-bold text-sm uppercase tracking-wide">No Match Found</p>
                                <p className="text-slate-400 text-xs mt-1">No scheduled appointment matches <span className="text-white font-mono">{query}</span>.</p>
                            </div>
                        </div>
                    )}

                    {/* Match found */}
                    {searchStatus === 'found' && match && (
                        <div className="bg-surface-dark rounded-xl border border-white/10 overflow-hidden shadow-lg relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gate-primary via-gate-accent to-gate-primary opacity-50" aria-hidden="true" />
                            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-gate-accent text-sm" aria-hidden="true">verified</span>
                                    <span className="text-xs font-bold text-gate-accent uppercase tracking-widest">
                                        {checkedIn ? 'Checked In ✓' : 'Match Found'}
                                    </span>
                                </div>
                                <div className={`px-2 py-0.5 rounded border text-xs font-bold ${match.status === 'ON TIME' ? 'bg-gate-primary/20 border-gate-primary/30 text-gate-primary'
                                        : match.status === 'LATE' ? 'bg-red-500/20 border-red-500/30 text-red-400'
                                            : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                    }`}>{match.status}</div>
                            </div>
                            <div className="p-5 grid gap-4 relative">
                                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} aria-hidden="true" />
                                <div className="relative z-10">
                                    <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Vendor</p>
                                    <p className="text-white text-xl font-medium flex items-center gap-2">
                                        {match.vendor}
                                        <span className="material-symbols-outlined text-base text-slate-500" aria-hidden="true">domain</span>
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 relative z-10">
                                    <div className="bg-background-dark/50 p-3 rounded-lg border border-white/5">
                                        <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Scheduled Time</p>
                                        <p className="text-white text-2xl font-bold tracking-tight">{match.scheduledTime}</p>
                                    </div>
                                    <div className="bg-background-dark/50 p-3 rounded-lg border border-white/5">
                                        <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Assigned Dock</p>
                                        <p className="text-white text-2xl font-bold tracking-tight">{match.dock}</p>
                                    </div>
                                </div>
                                <div className="relative z-10 pt-2 border-t border-dashed border-white/10 flex items-center justify-end">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-slate-700" /><div className="w-2 h-2 rounded-full bg-slate-700" />
                                        <div className="w-2 h-2 rounded-full bg-gate-primary animate-pulse" /><div className="w-2 h-2 rounded-full bg-slate-700" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* API error notice */}
                    {submitError && (
                        <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{submitError}</p>
                    )}
                </div>

                {/* Footer CTA */}
                <footer className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#050a18] via-background-dark/90 to-transparent backdrop-blur-sm shrink-0">
                    {checkedIn ? (
                        <button type="button" onClick={() => { setQuery(''); setSearchStatus('idle'); setMatch(null); setCheckedIn(false); }}
                            className="w-full h-16 bg-white/10 hover:bg-white/20 text-white text-lg font-bold tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-2xl" aria-hidden="true">refresh</span>
                            New Truck
                        </button>
                    ) : (
                        <button type="button" onClick={() => void handleCheckIn()}
                            disabled={searchStatus !== 'found' || submitting}
                            className="w-full h-16 bg-gate-primary hover:bg-gate-primary/90 text-background-dark text-lg font-bold tracking-wider uppercase rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 group disabled:opacity-40 disabled:cursor-not-allowed"
                            style={searchStatus === 'found' ? { boxShadow: '0 0 20px rgba(6,249,6,0.4)' } : {}}>
                            {submitting
                                ? <span className="size-5 rounded-full border-2 border-background-dark/30 border-t-background-dark animate-spin" />
                                : <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform" aria-hidden="true">login</span>}
                            {submitting ? 'Checking In...' : 'Check-In Truck'}
                        </button>
                    )}
                </footer>
            </main>
        </div>
    );
};

export default GatehousePage;
