import React from 'react';

interface StatCardProps {
    icon: string; // Material Symbol name
    label: string;
    value: string | number;
    iconColorClass?: string; // e.g. 'text-primary', 'text-status-online'
    iconBgClass?: string;   // e.g. 'bg-primary/10'
}

const StatCard: React.FC<StatCardProps> = ({
    icon,
    label,
    value,
    iconColorClass = 'text-primary',
    iconBgClass = 'bg-primary/10',
}) => (
    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border p-5 rounded-xl flex items-center gap-4">
        <div
            className={`size-12 rounded-full ${iconBgClass} flex items-center justify-center ${iconColorClass}`}
        >
            <span className="material-symbols-outlined" aria-hidden="true">
                {icon}
            </span>
        </div>
        <div>
            <p className="text-slate-500 dark:text-text-secondary text-sm">{label}</p>
            <p className="text-slate-900 dark:text-white text-2xl font-bold">{value}</p>
        </div>
    </div>
);

export default StatCard;
