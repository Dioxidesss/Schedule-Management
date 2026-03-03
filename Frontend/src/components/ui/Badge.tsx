import React from 'react';

type BadgeVariant =
    | 'online'
    | 'offline'
    | 'primary'
    | 'warning'
    | 'danger'
    | 'success'
    | 'scheduled'
    | 'gatekeeper'
    | 'loading_dock';

interface BadgeProps {
    label: string;
    variant: BadgeVariant;
    dot?: boolean;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
    online:
        'bg-emerald-500/10 text-status-online border border-emerald-500/20',
    offline:
        'bg-red-500/10 text-status-offline border border-red-500/20',
    primary:
        'bg-primary/10 text-primary border border-primary/20',
    warning:
        'bg-waiting/20 text-waiting border border-waiting/20',
    danger:
        'bg-delayed/20 text-delayed border border-delayed/20',
    success:
        'bg-green-500/10 text-green-400 border border-green-500/20',
    scheduled:
        'bg-slate-500/20 text-slate-400 border border-slate-500/20',
    gatekeeper:
        'bg-primary/10 text-primary border border-primary/20',
    loading_dock:
        'bg-primary/10 text-primary border border-primary/20',
};

const DOT_CLASSES: Record<BadgeVariant, string> = {
    online: 'bg-status-online',
    offline: 'bg-status-offline',
    primary: 'bg-primary',
    warning: 'bg-waiting',
    danger: 'bg-delayed',
    success: 'bg-green-400',
    scheduled: 'bg-slate-400',
    gatekeeper: 'bg-primary',
    loading_dock: 'bg-primary',
};

const Badge: React.FC<BadgeProps> = ({ label, variant, dot = false }) => (
    <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${VARIANT_CLASSES[variant]}`}
    >
        {dot && (
            <span
                className={`size-1.5 rounded-full ${DOT_CLASSES[variant]}`}
                aria-hidden="true"
            />
        )}
        {label}
    </span>
);

export default Badge;
