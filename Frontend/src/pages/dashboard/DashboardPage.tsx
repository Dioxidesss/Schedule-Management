import React from 'react';
import AppShell from '../../components/layout/AppShell';
import { MOCK_APPOINTMENTS, MOCK_YARD_QUEUE } from '../../mocks/appointments';
import type { Appointment } from '../../types/appointment';

const STATUS_COLORS: Record<string, string> = {
    unloading: 'border-unloading bg-unloading/30',
    waiting: 'border-waiting bg-waiting/20',
    delayed: 'border-delayed bg-delayed/20',
    scheduled: 'border-scheduled bg-scheduled/20 grayscale hover:grayscale-0',
    yard_queue: 'border-primary bg-primary/10',
};

const STATUS_TEXT: Record<string, string> = {
    unloading: 'text-unloading',
    waiting: 'text-waiting',
    delayed: 'text-delayed',
    scheduled: 'text-slate-400',
    yard_queue: 'text-primary',
};

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const DOORS = ['DOOR 1', 'DOOR 2', 'DOOR 3', 'DOOR 4', 'DOOR 5'];

const DOOR_STATUS: Record<string, { label: string; class: string }> = {
    'DOOR 1': { label: 'ACTIVE', class: 'text-unloading' },
    'DOOR 2': { label: 'DELAYED', class: 'text-delayed' },
    'DOOR 3': { label: 'READY', class: 'text-slate-500' },
    'DOOR 4': { label: 'ACTIVE', class: 'text-unloading' },
    'DOOR 5': { label: 'READY', class: 'text-slate-500' },
};

const QueueCard: React.FC<{ appt: Appointment }> = ({ appt }) => (
    <div className="p-3 bg-surface/40 hover:bg-surface border border-white/5 rounded-lg transition-all cursor-grab">
        <div className="flex justify-between items-start mb-1">
            <span className="text-xs font-bold text-slate-200">{appt.carrier_name}</span>
            <span className="text-[10px] font-mono text-primary">{appt.po_number}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-500 text-xs" aria-hidden="true">schedule</span>
            <span className="text-[10px] text-slate-400 italic">Est. {appt.estimated_duration_min}m unloading</span>
        </div>
    </div>
);

const DashboardPage: React.FC = () => (
    <AppShell>
        <div className="relative flex h-full w-full flex-col overflow-hidden">
            <main className="flex flex-1 overflow-hidden h-full">
                {/* Queue Sidebar */}
                <aside className="w-72 flex flex-col border-r border-white/10 bg-background-dark/40">
                    <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">The Queue</h3>
                            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">
                                {MOCK_YARD_QUEUE.length + MOCK_APPOINTMENTS.filter(a => a.status === 'yard_queue').length} Loads
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-4 font-medium uppercase tracking-tighter">AI-Predicted Docking Logic Active</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {MOCK_YARD_QUEUE.map((appt) => (
                            <QueueCard key={appt.id} appt={appt} />
                        ))}
                    </div>
                    <div className="p-4 bg-background-dark/80">
                        <button
                            type="button"
                            className="w-full h-10 border border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5 rounded-lg text-xs font-bold text-slate-400 hover:text-primary transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
                            Manual Entry
                        </button>
                    </div>
                </aside>

                {/* Gantt Chart */}
                <section className="flex-1 flex flex-col bg-background-dark overflow-hidden relative">
                    {/* Time axis */}
                    <div className="h-12 border-b border-white/10 flex items-center pl-24 pr-4 bg-background-dark/50">
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

                    {/* Door rows */}
                    <div className="flex-1 overflow-auto relative gantt-grid-bg">
                        {/* Now line */}
                        <div className="absolute left-[calc(6rem+20%)] top-0 bottom-0 w-px bg-primary z-10" aria-hidden="true">
                            <div className="absolute -top-1 -left-1 size-2 bg-primary rounded-full shadow-[0_0_8px_#00e5ff]" />
                        </div>

                        <div className="flex flex-col min-h-full">
                            {DOORS.map((door) => {
                                const appt = MOCK_APPOINTMENTS.find((a) => a.door_id === door.replace(' ', '-'));
                                const doorStatus = DOOR_STATUS[door];
                                return (
                                    <div key={door} className="flex h-24 border-b border-white/5 items-center hover:bg-white/5 transition-colors">
                                        <div className="w-24 shrink-0 px-4 text-center border-r border-white/5">
                                            <span className="block text-xs font-bold text-slate-300">{door}</span>
                                            <span className={`text-[10px] font-bold uppercase ${doorStatus.class}`}>{doorStatus.label}</span>
                                        </div>
                                        <div className="flex-1 relative h-full">
                                            {appt && (
                                                <div
                                                    className={`absolute left-0 top-4 h-16 w-40 border-l-4 rounded-r-lg p-2 overflow-hidden cursor-pointer shadow-lg ${STATUS_COLORS[appt.status]}`}
                                                >
                                                    <p className="text-[10px] font-bold text-white leading-none">{appt.carrier_name}</p>
                                                    <p className={`text-[8px] font-mono mt-1 uppercase ${STATUS_TEXT[appt.status]}`}>
                                                        {appt.status.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Optimize FAB */}
                    <button
                        type="button"
                        className="absolute bottom-6 right-6 flex items-center gap-3 px-6 h-14 bg-primary text-background-dark rounded-full shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:shadow-[0_0_45px_rgba(0,229,255,0.6)] transition-all font-bold uppercase tracking-widest text-xs"
                    >
                        <span className="material-symbols-outlined font-bold" aria-hidden="true">auto_fix_high</span>
                        Optimize Schedule
                    </button>
                </section>

                {/* Live Insights Sidebar */}
                <aside className="w-80 flex flex-col border-l border-white/10 bg-background-dark/40">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Insights</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* AI Alert */}
                        <div className="p-4 bg-delayed/10 border border-delayed/30 rounded-xl">
                            <div className="flex items-center gap-2 mb-2 text-delayed">
                                <span className="material-symbols-outlined text-sm" aria-hidden="true">warning</span>
                                <p className="text-[10px] font-black uppercase tracking-widest">AI ALERT</p>
                            </div>
                            <p className="text-xs text-white font-medium">Door 4 Unload Overrun: Pallet count mismatch detected. Requires manager override.</p>
                            <button type="button" className="mt-3 text-[10px] font-bold text-delayed uppercase underline tracking-tighter hover:text-white transition-colors">
                                Inspect Bay
                            </button>
                        </div>

                        {/* Efficiency Metrics */}
                        <div className="p-4 bg-surface/60 border border-white/10 rounded-xl">
                            <div className="flex items-center gap-2 mb-3 text-unloading">
                                <span className="material-symbols-outlined text-sm" aria-hidden="true">bar_chart</span>
                                <p className="text-[10px] font-black uppercase tracking-widest">Efficiency Metrics</p>
                            </div>
                            {[
                                { label: 'DOCK UTILIZATION', value: 92, color: 'bg-unloading', glow: 'rgba(57,255,20,0.5)' },
                                { label: 'ON-TIME ARRIVAL RATE', value: 78, color: 'bg-primary', glow: 'rgba(0,229,255,0.5)' },
                            ].map((m) => (
                                <div key={m.label} className="mb-3">
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-bold">
                                        <span>{m.label}</span><span>{m.value}%</span>
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
                    <div className="p-4 bg-background-dark/80 border-t border-white/10">
                        <div className="flex items-center justify-between px-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Latency</p>
                            <p className="text-[10px] font-mono text-unloading">42ms</p>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Footer */}
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
        </div>
    </AppShell>
);

export default DashboardPage;
