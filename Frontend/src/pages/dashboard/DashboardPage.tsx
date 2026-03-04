import React, { useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAppointments } from '../../hooks/useAppointments';
import type { Appointment } from '../../types/appointment';



const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// Door configuration exactly as per dashboard_1 HTML reference
const DOORS: Array<{
    id: string;
    label: string;
    statusLabel: string;
    statusClass: string;
    bars: Array<{ left: string; width: string; carrier: string; detail: string; statusClass: string; barClass: string }>;
}> = [
        {
            id: 'door-1', label: 'DOOR 1', statusLabel: 'ACTIVE', statusClass: 'text-unloading',
            bars: [
                { left: '0px', width: '160px', carrier: 'Apex Trans', detail: 'UNLOADING', statusClass: 'text-unloading', barClass: 'bg-unloading/30 border-unloading shadow-lg shadow-unloading/10' },
                { left: '300px', width: '256px', carrier: 'FedEx Express', detail: 'WAITING', statusClass: 'text-waiting', barClass: 'bg-waiting/20 border-waiting' },
            ],
        },
        {
            id: 'door-2', label: 'DOOR 2', statusLabel: 'DELAYED', statusClass: 'text-delayed',
            bars: [
                { left: '80px', width: '200px', carrier: 'UPS Freight', detail: '+18m DELAY', statusClass: 'text-delayed', barClass: 'bg-delayed/20 border-delayed shadow-lg shadow-delayed/10' },
            ],
        },
        {
            id: 'door-3', label: 'DOOR 3', statusLabel: 'READY', statusClass: 'text-slate-500',
            bars: [
                { left: '400px', width: '180px', carrier: 'DHL Express', detail: 'SCHEDULED 14:00', statusClass: 'text-slate-400', barClass: 'bg-scheduled/20 border-scheduled grayscale hover:grayscale-0 transition-all' },
            ],
        },
        {
            id: 'door-4', label: 'DOOR 4', statusLabel: 'ACTIVE', statusClass: 'text-unloading',
            bars: [
                { left: '40px', width: '220px', carrier: 'Ryder Trans', detail: 'UNLOADING 70%', statusClass: 'text-unloading', barClass: 'bg-unloading/30 border-unloading' },
            ],
        },
        {
            id: 'door-5', label: 'DOOR 5', statusLabel: 'READY', statusClass: 'text-slate-500',
            bars: [],
        },
    ];

// ─── New Appointment Modal ────────────────────────────────────────────────────
interface ApptForm {
    po_number: string;
    carrier_name: string;
    date: string;
    time: string;
    load_type: 'palletized' | 'floor-loaded';
}

const BLANK_FORM: ApptForm = {
    po_number: '', carrier_name: '', date: '', time: '', load_type: 'palletized',
};

const NewAppointmentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [form, setForm] = useState<ApptForm>(BLANK_FORM);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05091a]/70 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-[520px] bg-[#0f1c3f] border border-[#233565] rounded-2xl shadow-modal flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-[#233565] bg-background-dark/50">
                    <h1 className="text-2xl font-bold text-white tracking-tight font-display">New Appointment</h1>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col gap-6">
                    {/* PO Number */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-300 text-sm font-medium leading-none tracking-wide">PO Number</label>
                        <div className="relative group">
                            <input
                                name="po_number"
                                type="text"
                                value={form.po_number}
                                onChange={handleChange}
                                placeholder="Enter PO Number (e.g. 844392)"
                                className="w-full h-12 rounded-lg bg-background-dark border border-[#233565] text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all px-4 pl-11 text-base font-medium"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl pointer-events-none group-focus-within:text-primary transition-colors">inventory_2</span>
                        </div>
                    </div>

                    {/* Carrier */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-300 text-sm font-medium leading-none tracking-wide">Carrier Name</label>
                        <div className="relative group">
                            <select
                                name="carrier_name"
                                value={form.carrier_name}
                                onChange={handleChange}
                                className="w-full h-12 rounded-lg bg-background-dark border border-[#233565] text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all px-4 pl-11 appearance-none cursor-pointer font-medium"
                            >
                                <option value="" disabled>Select Carrier</option>
                                <option value="fedex">FedEx Freight</option>
                                <option value="dhl">DHL Supply Chain</option>
                                <option value="xpo">XPO Logistics</option>
                                <option value="ups">UPS Freight</option>
                            </select>
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl pointer-events-none group-focus-within:text-primary transition-colors">local_shipping</span>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    {/* Scheduled Time */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-300 text-sm font-medium leading-none tracking-wide">Scheduled Time</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                                <input
                                    name="date"
                                    type="date"
                                    value={form.date}
                                    onChange={handleChange}
                                    className="w-full h-12 rounded-lg bg-background-dark border border-[#233565] text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all px-4 pl-11 [color-scheme:dark] font-medium"
                                />
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl pointer-events-none group-focus-within:text-primary transition-colors">calendar_today</span>
                            </div>
                            <div className="relative group">
                                <input
                                    name="time"
                                    type="time"
                                    value={form.time}
                                    onChange={handleChange}
                                    className="w-full h-12 rounded-lg bg-background-dark border border-[#233565] text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all px-4 pl-11 [color-scheme:dark] font-medium"
                                />
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl pointer-events-none group-focus-within:text-primary transition-colors">schedule</span>
                            </div>
                        </div>
                    </div>

                    {/* Load Type */}
                    <div className="flex flex-col gap-3 pt-2">
                        <span className="text-slate-300 text-sm font-medium leading-none tracking-wide">Load Type</span>
                        <div className="flex w-full p-1 bg-background-dark rounded-xl border border-[#233565]">
                            {(['palletized', 'floor-loaded'] as const).map((type) => (
                                <label key={type} className="flex-1 relative cursor-pointer">
                                    <input
                                        type="radio"
                                        name="load_type"
                                        value={type}
                                        checked={form.load_type === type}
                                        onChange={handleChange}
                                        className="peer sr-only"
                                    />
                                    <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-300 text-slate-400 peer-checked:bg-surface-highlight peer-checked:text-primary peer-checked:shadow-[0_0_15px_-5px_rgba(0,229,255,0.3)] peer-checked:border peer-checked:border-primary/30 font-semibold text-sm">
                                        <span className="material-symbols-outlined text-[18px]">
                                            {type === 'palletized' ? 'layers' : 'grid_view'}
                                        </span>
                                        {type === 'palletized' ? 'Palletized' : 'Floor-loaded'}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-2 pb-8 flex items-center justify-end gap-3 bg-background-dark/30 border-t border-[#233565]/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-lg text-slate-400 text-sm font-medium hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="px-8 py-3 rounded-lg bg-primary text-background-dark text-sm font-bold shadow-glow hover:bg-[#60f0ff] hover:shadow-[0_0_30px_-5px_rgba(0,229,255,0.7)] transition-all flex items-center gap-2 active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        Create Appointment
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Queue Sidebar ────────────────────────────────────────────────────────────
const QueueSidebar: React.FC<{ onNewAppt: () => void; yardQueue: Appointment[] }> = ({ onNewAppt, yardQueue }) => (
    <aside className="w-72 flex flex-col border-r border-white/10 bg-background-dark/40 flex-shrink-0">
        <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">The Queue</h3>
                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">12 Loads</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-4 font-medium uppercase tracking-tighter">
                AI-Predicted Docking Logic Active
            </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {yardQueue.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-8 italic">No trucks in queue.</p>
            )}
            {yardQueue.map((appt) => (
                <div
                    key={appt.id}
                    className="p-3 bg-surface/40 hover:bg-surface border border-white/5 rounded-lg transition-all cursor-move group"
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-slate-200">{appt.carrier_name}</span>
                        <span className="text-[10px] font-mono text-primary">{appt.po_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-500 text-xs">schedule</span>
                        <span className="text-[10px] text-slate-400 italic">Est. {appt.estimated_duration_min}m unloading</span>
                    </div>
                </div>
            ))}
        </div>

        <div className="p-4 bg-background-dark/80">
            <button
                type="button"
                onClick={onNewAppt}
                className="w-full h-10 border border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5 rounded-lg text-xs font-bold text-slate-400 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined text-sm">add</span>
                Manual Entry
            </button>
        </div>
    </aside>
);

// ─── Gantt Chart ──────────────────────────────────────────────────────────────
const GanttSection: React.FC<{ onNewAppt: () => void }> = ({ onNewAppt }) => (
    <section className="flex-1 flex flex-col bg-background-dark overflow-hidden relative">
        {/* Time axis */}
        <div className="h-12 border-b border-white/10 flex items-center pl-24 pr-4 bg-background-dark/50 flex-shrink-0">
            <div className="flex-1 grid grid-cols-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                {HOURS.map((h) => (
                    <div
                        key={h}
                        className={h === '10:00' ? 'text-primary border-x border-primary/20 bg-primary/5 py-3' : ''}
                    >
                        {h}{h === '10:00' ? ' (Now)' : ''}
                    </div>
                ))}
            </div>
        </div>

        {/* Door rows + Gantt bars */}
        <div className="flex-1 overflow-auto relative gantt-grid">
            {/* "Now" indicator line at 20% into the grid (representing 10:00) */}
            <div className="absolute left-[calc(6rem+20%)] top-0 bottom-0 w-px bg-primary z-10" aria-hidden="true">
                <div className="absolute -top-1 -left-1 size-2 bg-primary rounded-full shadow-[0_0_8px_#00e5ff]" />
            </div>

            <div className="flex flex-col min-h-full">
                {DOORS.map((door) => (
                    <div key={door.id} className="flex h-24 border-b border-white/5 items-center hover:bg-white/5 transition-colors">
                        <div className="w-24 shrink-0 px-4 text-center border-r border-white/5">
                            <span className="block text-xs font-bold text-slate-300">{door.label}</span>
                            <span className={`text-[10px] font-bold uppercase ${door.statusClass}`}>{door.statusLabel}</span>
                        </div>
                        <div className="flex-1 relative h-full">
                            {door.bars.map((bar, i) => (
                                <div
                                    key={i}
                                    className={`absolute top-4 h-16 border-l-4 rounded-r-lg p-2 overflow-hidden cursor-pointer ${bar.barClass}`}
                                    style={{ left: bar.left, width: bar.width }}
                                >
                                    <p className="text-[10px] font-bold text-white leading-none">{bar.carrier}</p>
                                    <p className={`text-[8px] font-mono mt-1 uppercase ${bar.statusClass}`}>{bar.detail}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Optimize FAB */}
        <button
            type="button"
            onClick={onNewAppt}
            className="absolute bottom-6 right-6 flex items-center gap-3 px-6 h-14 bg-primary text-background-dark rounded-full shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:shadow-[0_0_45px_rgba(0,229,255,0.6)] transition-all font-bold uppercase tracking-widest text-xs"
        >
            <span className="material-symbols-outlined font-bold">auto_fix_high</span>
            Optimize Schedule
        </button>
    </section>
);

// ─── Live Insights Sidebar ────────────────────────────────────────────────────
const InsightsSidebar: React.FC = () => (
    <aside className="w-80 flex flex-col border-l border-white/10 bg-background-dark/40 flex-shrink-0">
        <div className="p-4 border-b border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Insights</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* AI Alert */}
            <div className="p-4 bg-delayed/10 border border-delayed/30 rounded-xl relative overflow-hidden group">
                <div className="flex items-center gap-2 mb-2 text-delayed">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">AI ALERT</p>
                </div>
                <p className="text-xs text-white font-medium">
                    Door 4 Unload Overrun: Pallet count mismatch detected. Requires manager override.
                </p>
                <button type="button" className="mt-3 text-[10px] font-bold text-delayed uppercase underline tracking-tighter hover:text-white transition-colors">
                    Inspect Bay
                </button>
            </div>

            {/* Yard Actions */}
            <div className="p-4 bg-surface/60 border border-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-primary">
                    <span className="material-symbols-outlined text-sm">local_shipping</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">YARD ACTIONS</p>
                </div>
                <div className="flex justify-between items-center mb-3">
                    <p className="text-xs text-slate-300 font-bold">Arrived Early (2)</p>
                    <span className="px-1.5 py-0.5 bg-waiting/20 text-waiting text-[9px] font-bold rounded">HOLDING</span>
                </div>
                <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">PO-1109 (Amazon)</span>
                        <span className="text-slate-500 font-mono">15m wait</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">PO-4432 (Northstar)</span>
                        <span className="text-slate-500 font-mono">5m wait</span>
                    </div>
                </div>
                <button
                    type="button"
                    className="w-full h-8 bg-primary/20 text-primary border border-primary/40 hover:bg-primary hover:text-background-dark text-[10px] font-bold uppercase tracking-widest rounded transition-all shadow-[0_0_10px_rgba(0,229,255,0.1)]"
                >
                    Auto-Assign Door
                </button>
            </div>

            {/* Efficiency Metrics */}
            <div className="p-4 bg-surface/60 border border-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-3 text-unloading">
                    <span className="material-symbols-outlined text-sm">bar_chart</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">Efficiency Metrics</p>
                </div>
                <div className="space-y-3">
                    {[
                        { label: 'DOCK UTILIZATION', value: 92, color: 'bg-unloading', glow: 'rgba(57,255,20,0.5)' },
                        { label: 'ON-TIME ARRIVAL RATE', value: 78, color: 'bg-primary', glow: 'rgba(0,229,255,0.5)' },
                    ].map((m) => (
                        <div key={m.label}>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-bold">
                                <span>{m.label}</span>
                                <span>{m.value}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${m.color} rounded-full`}
                                    style={{ width: `${m.value}%`, boxShadow: `0 0 8px ${m.glow}` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Latency footer */}
        <div className="p-4 bg-background-dark/80 border-t border-white/10">
            <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Latency</p>
                <p className="text-[10px] font-mono text-unloading">42ms</p>
            </div>
        </div>
    </aside>
);

// ─── Dashboard Footer ─────────────────────────────────────────────────────────
const DashboardFooter: React.FC = () => (
    <footer className="h-8 bg-background-dark border-t border-white/10 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">v2.4.0-Stable</span>
            <div className="h-3 w-px bg-white/10" aria-hidden="true" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Doors: 4/5</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">wifi</span>
            <span className="material-symbols-outlined text-sm" aria-hidden="true">dns</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Local Node: US-EAST-1</span>
        </div>
    </footer>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { yardQueue } = useAppointments();

    return (
        <AppShell>
            {/* Override AppShell's flex-1 overflow-y-auto main by taking full height ourselves */}
            <div className="flex h-full w-full flex-col overflow-hidden -m-0">

                <main className="flex flex-1 overflow-hidden">
                    <QueueSidebar onNewAppt={() => setIsModalOpen(true)} yardQueue={yardQueue} />
                    <GanttSection onNewAppt={() => setIsModalOpen(true)} />
                    <InsightsSidebar />
                </main>

                <DashboardFooter />
            </div>

            {isModalOpen && <NewAppointmentModal onClose={() => setIsModalOpen(false)} />}
        </AppShell>
    );
};

export default DashboardPage;
