import React from 'react';
import AppShell from '../../components/layout/AppShell';
import SideNav from '../../components/layout/SideNav';
import StatCard from '../../components/ui/StatCard';
import Table, { type TableColumn } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import { MOCK_DEVICES } from '../../mocks/devices';
import type { Device, DeviceRole } from '../../types/device';

const ROLE_LABELS: Record<DeviceRole, string> = {
    gatekeeper: 'Gatekeeper',
    loading_dock: 'Loading Dock',
};

const DEVICE_COLUMNS: TableColumn<Device>[] = [
    {
        key: 'id',
        header: 'Device ID / Model',
        render: (d) => (
            <div className="flex items-center gap-3">
                <div className="size-10 rounded bg-surface-dark border border-surface-border flex items-center justify-center text-text-secondary shrink-0">
                    <span className="material-symbols-outlined" aria-hidden="true">tablet_mac</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-white font-mono">{d.id}</span>
                    <span className="text-xs text-text-secondary">{d.model}</span>
                </div>
            </div>
        ),
    },
    {
        key: 'location',
        header: 'Location',
        render: (d) => <span className="text-sm text-text-secondary">{d.location}</span>,
    },
    {
        key: 'role',
        header: 'Role',
        render: (d) => <Badge label={ROLE_LABELS[d.role]} variant={d.role} />,
    },
    {
        key: 'heartbeat',
        header: 'Last Heartbeat',
        render: (d) => (
            <span className={`text-sm ${d.status === 'offline' ? 'text-danger font-medium' : 'text-text-secondary'}`}>
                {d.status === 'offline' ? '3 hours ago' : '2 mins ago'}
            </span>
        ),
    },
    {
        key: 'status',
        header: 'Status',
        headerClassName: 'text-right',
        render: (d) => (
            <div className="flex justify-end">
                <Badge label={d.status === 'online' ? 'Online' : 'Offline'} variant={d.status} dot />
            </div>
        ),
    },
];

const TeamPage: React.FC = () => {
    const onlineCount = MOCK_DEVICES.filter((d) => d.status === 'online').length;
    const offlineCount = MOCK_DEVICES.filter((d) => d.status === 'offline').length;

    return (
        <AppShell sidebar={<SideNav />}>
            <div className="w-full p-8 md:p-12 overflow-y-auto">
                {/* Page header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                    <div className="flex flex-col gap-2 max-w-2xl">
                        <h1 className="text-white text-3xl md:text-4xl font-bold tracking-tight font-display">Device Kiosks</h1>
                        <p className="text-text-secondary text-base">Monitor the status and connectivity of facility kiosks.</p>
                    </div>
                </header>

                {/* Stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <StatCard icon="devices" label="Total Devices" value={MOCK_DEVICES.length} />
                    <StatCard
                        icon="wifi"
                        label="Online Now"
                        value={onlineCount}
                        iconColorClass="text-status-online"
                        iconBgClass="bg-status-online/10"
                    />
                    <StatCard
                        icon="wifi_off"
                        label="Offline"
                        value={offlineCount}
                        iconColorClass="text-status-offline"
                        iconBgClass="bg-status-offline/10"
                    />
                </div>

                {/* Device Table */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 dark:border-surface-border flex gap-3">
                        <div className="relative flex-1 max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-text-secondary text-[20px]" aria-hidden="true">search</span>
                            <input
                                id="device_search"
                                type="search"
                                placeholder="Search device ID or location..."
                                aria-label="Search devices"
                                className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-surface-border rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <button
                            type="button"
                            className="px-4 py-2 bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-surface-border rounded-lg text-slate-600 dark:text-text-secondary text-sm font-medium hover:text-slate-900 dark:hover:text-white flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">filter_list</span>
                            Status: All
                        </button>
                    </div>

                    <Table
                        columns={DEVICE_COLUMNS}
                        rows={MOCK_DEVICES}
                        keyExtractor={(d) => d.id}
                    />

                    <div className="px-6 py-4 border-t border-slate-200 dark:border-surface-border flex items-center justify-between">
                        <p className="text-sm text-slate-500 dark:text-text-secondary">
                            Showing <span className="font-medium text-white">1–{MOCK_DEVICES.length}</span> of{' '}
                            <span className="font-medium text-white">42</span> devices
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled
                                aria-label="Previous page"
                                className="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-surface-border text-slate-500 dark:text-text-secondary disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">chevron_left</span>
                            </button>
                            <button type="button" className="size-8 flex items-center justify-center rounded-lg bg-primary text-background-dark font-bold text-sm" aria-current="page">1</button>
                            <button type="button" className="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-surface-border text-slate-500 dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-surface-border transition-colors">2</button>
                            <button type="button" aria-label="Next page" className="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-surface-border text-slate-500 dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-surface-border transition-colors">
                                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};

export default TeamPage;
