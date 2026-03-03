import React from 'react';

interface IsomerLogoProps {
    size?: number; // width/height in px, default 40
}

const IsomerLogo: React.FC<IsomerLogoProps> = ({ size = 40 }) => (
    <svg
        width={size}
        height={Math.round(size * 0.6)}
        viewBox="0 0 40 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]"
        aria-label="Isomer logo"
        role="img"
    >
        <path d="M0 24L20 12L24 0L4 12L0 24Z" fill="#0055AA" />
        <path d="M20 12L40 0L16 12L20 12Z" fill="#00E5FF" />
        <path d="M20 12L24 0L28 12L20 12Z" fill="#0099DD" />
        <path d="M4 12L20 12L16 24L4 12Z" fill="#0077CC" />
    </svg>
);

export default IsomerLogo;
