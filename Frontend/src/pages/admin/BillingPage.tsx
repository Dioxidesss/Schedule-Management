import React from 'react';
import AppShell from '../../components/layout/AppShell';
import SideNav from '../../components/layout/SideNav';
import Table, { type TableColumn } from '../../components/ui/Table';
import { MOCK_SUBSCRIPTION, MOCK_INVOICES } from '../../mocks/billing';
import type { Invoice } from '../../types/billing';

const INVOICE_COLUMNS: TableColumn<Invoice>[] = [
    {
        key: 'id',
        header: 'Invoice ID',
        render: (inv) => (
            <span className="font-mono text-xs text-white group-hover:text-primary transition-colors">
                {inv.id}
            </span>
        ),
    },
    {
        key: 'date',
        header: 'Date',
        render: (inv) => <span className="text-sm text-text-secondary">{inv.date}</span>,
    },
    {
        key: 'amount',
        header: 'Amount (RM)',
        render: (inv) => <span className="text-sm text-white font-medium">{inv.amount_myr}</span>,
    },
    {
        key: 'status',
        header: 'Status',
        render: (inv) => (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wide">
                <span className="material-symbols-outlined text-[12px]" aria-hidden="true">check_circle</span>
                {inv.status}
            </div>
        ),
    },
    {
        key: 'method',
        header: 'Payment Method',
        render: (inv) => (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
                <div className="w-8 h-5 bg-white/5 rounded border border-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">credit_card</span>
                </div>
                <span className="text-xs">{inv.payment_method}</span>
            </div>
        ),
    },
    {
        key: 'action',
        header: 'Action',
        headerClassName: 'text-right',
        render: () => (
            <div className="flex justify-end">
                <button
                    type="button"
                    title="Download Invoice"
                    aria-label="Download invoice"
                    className="text-text-secondary hover:text-primary transition-colors p-2 rounded hover:bg-primary/10"
                >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
                </button>
            </div>
        ),
    },
];

const BillingPage: React.FC = () => (
    <AppShell sidebar={<SideNav />}>
        <div className="w-full max-w-6xl mx-auto p-8 space-y-8">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight font-display">Billing &amp; Subscription</h1>
                    <p className="text-text-secondary mt-2 text-sm">Manage your subscription plan, billing details, and invoices.</p>
                </div>
                <button
                    type="button"
                    className="flex items-center justify-center gap-2 bg-slate-navy border border-white/10 hover:border-primary text-text-secondary hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">credit_card</span>
                    Manage Payment Method
                </button>
            </div>

            {/* Current plan card */}
            <div className="bg-slate-navy rounded-xl border border-white/10 p-8 shadow-xl relative overflow-hidden group hover:border-primary/30 transition-colors duration-500">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700" aria-hidden="true" />
                <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-16 items-start lg:items-center">
                    <div className="flex-1 space-y-6">
                        <div>
                            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">Current Subscription</p>
                            <div className="flex items-center gap-4 flex-wrap">
                                <h2 className="text-4xl md:text-5xl font-bold text-white font-display tracking-tight capitalize">
                                    {MOCK_SUBSCRIPTION.plan_code}
                                </h2>
                                {MOCK_SUBSCRIPTION.is_active && (
                                    <span className="px-2.5 py-0.5 bg-green-500/10 text-green-400 text-xs font-bold rounded border border-green-500/20 flex items-center gap-1.5 uppercase tracking-wide">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                                        Active
                                    </span>
                                )}
                            </div>
                            <p className="text-text-secondary text-sm mt-3 max-w-md leading-relaxed">
                                Includes unlimited users, priority support, advanced analytics, and custom integrations.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                            <div>
                                <p className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">calendar_month</span>
                                    Next Billing Date
                                </p>
                                <p className="text-lg font-mono text-white">Nov 1, 2023</p>
                            </div>
                            <div>
                                <p className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">attach_money</span>
                                    Estimated Amount
                                </p>
                                <p className="text-lg font-mono text-white">RM 11,800.00</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col gap-4">
                        <button
                            type="button"
                            className="w-full lg:w-auto bg-primary text-background-dark hover:bg-white font-bold text-base px-6 py-3 rounded-lg flex items-center justify-center gap-2 group/btn shadow-glow transition-all"
                        >
                            Upgrade Plan
                            <span className="material-symbols-outlined text-[20px] group-hover/btn:translate-x-1 transition-transform" aria-hidden="true">rocket_launch</span>
                        </button>
                        <p className="text-center text-xs text-text-secondary">
                            Looking for custom solutions?{' '}
                            <a href="#" className="text-primary hover:text-white transition-colors">Contact Sales</a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Invoice table */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
                    <span className="material-symbols-outlined text-primary" aria-hidden="true">history</span>
                    Billing History
                </h3>
                <div className="bg-slate-navy rounded-xl border border-white/10 overflow-hidden shadow-xl">
                    <Table
                        columns={INVOICE_COLUMNS}
                        rows={MOCK_INVOICES}
                        keyExtractor={(inv) => inv.id}
                    />
                    <div className="p-4 border-t border-white/5 bg-background-dark/30 flex items-center justify-between text-xs text-text-secondary">
                        <span>Showing last {MOCK_INVOICES.length} invoices</span>
                        <button type="button" className="text-primary hover:text-white transition-colors font-medium hover:underline">
                            View All History
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </AppShell>
);

export default BillingPage;
