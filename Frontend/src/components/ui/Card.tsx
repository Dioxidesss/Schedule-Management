import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => (
    <div
        className={`bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border rounded-xl ${className}`}
    >
        {children}
    </div>
);

export default Card;
