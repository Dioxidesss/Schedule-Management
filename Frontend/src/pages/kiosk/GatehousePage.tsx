import React, { useState } from 'react';

type SearchStatus = 'idle' | 'found' | 'not_found';

const GatehousePage: React.FC = () => {
    const [query, setQuery] = useState('');
    const status: SearchStatus = 'found'; // Show match by default for demo

    return (
        <div className="min-h-screen bg-background-dark dark:text-slate-100 font-display flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background glow orbs */}
            <div className="fixed inset-0 -z-10 bg-[#050a18]" aria-hidden="true">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gate-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gate-accent/5 blur-[100px]" />
            </div>

            <main className="w-full max-w-md h-[850px] max-h-screen glass-panel rounded-2xl flex flex-col relative overflow-hidden shadow-2xl">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-5 border-b border-gate-primary/20 bg-surface-dark/50">
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

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-2">Truck Arrival</h1>
                        <p className="text-slate-400 text-sm">Scan documents or enter details manually</p>
                    </div>

                    {/* Search input */}
                    <div className="w-full">
                        <label htmlFor="vehicle_search" className="block text-gate-accent text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                            Identify Vehicle
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gate-primary">
                                <span className="material-symbols-outlined text-2xl" aria-hidden="true">search</span>
                            </div>
                            <input
                                id="vehicle_search"
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Enter PO Number or License Plate"
                                className="block w-full rounded-xl border-2 border-gate-primary/30 bg-surface-dark py-4 pl-12 pr-12 text-white placeholder:text-slate-500 focus:border-gate-primary focus:ring-0 focus:outline-none text-lg font-medium transition-all"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <button type="button" aria-label="Scan QR code" className="p-2 text-slate-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined" aria-hidden="true">qr_code_scanner</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Match card (shown when status === 'found') */}
                    {status === 'found' && (
                        <div className="bg-surface-dark rounded-xl border border-white/10 overflow-hidden shadow-lg relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gate-primary via-gate-accent to-gate-primary opacity-50" aria-hidden="true" />
                            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-gate-accent text-sm" aria-hidden="true">verified</span>
                                    <span className="text-xs font-bold text-gate-accent uppercase tracking-widest">Match Found</span>
                                </div>
                                <div className="px-2 py-0.5 rounded bg-gate-primary/20 border border-gate-primary/30 text-gate-primary text-xs font-bold">
                                    ON TIME
                                </div>
                            </div>
                            <div className="p-5 grid gap-4">
                                <div>
                                    <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Vendor</p>
                                    <p className="text-white text-xl font-medium flex items-center gap-2">
                                        Samsung Logistics
                                        <span className="material-symbols-outlined text-base text-slate-500" aria-hidden="true">domain</span>
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-background-dark/50 p-3 rounded-lg border border-white/5">
                                        <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Scheduled Time</p>
                                        <p className="text-white text-2xl font-bold tracking-tight">14:00</p>
                                    </div>
                                    <div className="bg-background-dark/50 p-3 rounded-lg border border-white/5">
                                        <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Assigned Dock</p>
                                        <p className="text-white text-2xl font-bold tracking-tight">North</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer CTA */}
                <footer className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background-dark via-background-dark to-transparent backdrop-blur-sm">
                    <button
                        type="button"
                        className="w-full h-16 bg-gate-primary hover:bg-gate-primary/80 text-background-dark text-lg font-bold tracking-wider uppercase rounded-xl shadow-[0_0_20px_rgba(6,249,6,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group neon-glow"
                    >
                        <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform" aria-hidden="true">login</span>
                        Check-In Truck
                    </button>
                </footer>
            </main>
        </div>
    );
};

export default GatehousePage;
