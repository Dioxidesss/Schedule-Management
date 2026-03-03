import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
    label: string;
    href: string;
    icon: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Team Management', href: '/admin/team', icon: 'group' },
    { label: 'Billing & Subscription', href: '/admin/billing', icon: 'receipt_long' },
];

const SideNav: React.FC = () => {
    const location = useLocation();

    return (
        <aside className="w-60 flex-shrink-0 hidden md:flex flex-col border-r border-white/10 bg-background-dark/40 h-full">
            <nav className="flex flex-col gap-1 p-4" aria-label="Admin navigation">
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                                }`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

export default SideNav;
