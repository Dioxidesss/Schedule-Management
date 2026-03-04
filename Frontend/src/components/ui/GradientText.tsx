import React from 'react';

interface GradientTextProps {
    children: React.ReactNode;
    className?: string;
    /** CSS gradient direction, default: 'to right' */
    direction?: string;
    /** From color stop, default: '#00e5ff' */
    from?: string;
    /** To color stop, default: '#4169e1' */
    to?: string;
}

/**
 * Renders text with a CSS linear-gradient fill.
 * All standard text sizing / font-weight classes are passed via className.
 */
const GradientText: React.FC<GradientTextProps> = ({
    children,
    className = '',
    direction = 'to right',
    from = '#00e5ff',
    to = '#4169e1',
}) => (
    <span
        className={`inline-block bg-clip-text text-transparent ${className}`}
        style={{
            backgroundImage: `linear-gradient(${direction}, ${from}, ${to})`,
        }}
    >
        {children}
    </span>
);

export default GradientText;
