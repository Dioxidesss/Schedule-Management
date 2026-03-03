import React, { useState, useRef } from 'react';

const DIGIT_COUNT = 6;

const PairPage: React.FC = () => {
    const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        const char = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[index] = char;
        setDigits(next);
        if (char && index < DIGIT_COUNT - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGIT_COUNT);
        const next = [...digits];
        pasted.split('').forEach((c, i) => { next[i] = c; });
        setDigits(next);
        inputRefs.current[Math.min(pasted.length, DIGIT_COUNT - 1)]?.focus();
    };

    const isFilled = digits.every((d) => d.length === 1);

    return (
        <div className="h-screen w-screen bg-background-dark text-slate-100 font-body overflow-hidden antialiased flex flex-col items-center justify-center relative">
            {/* Tech grid background */}
            <div className="absolute inset-0 tech-grid-bg bg-[size:40px_40px] pointer-events-none" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background-dark/50 to-background-dark pointer-events-none" aria-hidden="true" />

            <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-4">
                {/* Logo */}
                <div className="mb-16 flex flex-col items-center gap-4">
                    <div className="h-24 w-24 text-primary drop-shadow-[0_0_15px_rgba(0,229,255,0.4)]">
                        <svg className="h-full w-full" fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M10 80 L50 50 L40 40 Z" fill="#0055AA" />
                            <path d="M10 80 L40 40 L50 15 Z" fill="#0077EE" />
                            <path d="M50 50 L90 20 L60 60 Z" fill="#0055AA" />
                            <path d="M90 20 L60 60 L50 85 Z" fill="#0077EE" />
                            <path d="M40 40 L60 60 L50 50 Z" fill="#00CCFF" />
                            <defs>
                                <linearGradient id="g1" x1="10" x2="50" y1="80" y2="15" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#00E5FF" /><stop offset="1" stopColor="#003366" />
                                </linearGradient>
                                <linearGradient id="g2" x1="90" x2="50" y1="20" y2="85" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#00E5FF" /><stop offset="1" stopColor="#003366" />
                                </linearGradient>
                            </defs>
                            <path d="M10 80 L50 50 L50 15 Z" fill="url(#g1)" opacity="0.8" />
                            <path d="M90 20 L50 50 L50 85 Z" fill="url(#g2)" opacity="0.8" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-display font-bold tracking-widest text-white uppercase">Isomer Kiosk</h1>
                </div>

                <div className="w-full flex flex-col items-center gap-8">
                    <div className="text-center space-y-2">
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">Enter 6-Digit Facility Pairing Code</h2>
                        <p className="text-primary/70 font-mono text-sm tracking-widest uppercase">Secure Connection Protocol v2.4</p>
                    </div>

                    {/* PIN Inputs */}
                    <div className="grid grid-cols-6 gap-3 md:gap-6 mt-4 w-full max-w-2xl" role="group" aria-label="6-digit pairing code">
                        {digits.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => { inputRefs.current[i] = el; }}
                                id={`pin-digit-${i}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                onPaste={handlePaste}
                                aria-label={`Digit ${i + 1}`}
                                className="w-full aspect-[3/4] bg-background-dark border-2 border-primary text-center text-4xl md:text-6xl font-display font-black text-white rounded-lg glow-border focus:outline-none focus:bg-primary/10 transition-all duration-200 placeholder-slate-700"
                                placeholder="0"
                            />
                        ))}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3 mt-8 bg-surface-dark px-4 py-2 rounded-full border border-slate-700/50">
                        <span className="relative flex h-3 w-3" aria-hidden="true">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                        </span>
                        <span className="text-slate-400 text-sm font-mono uppercase tracking-wider">
                            {isFilled ? 'Ready to pair...' : 'Waiting for input...'}
                        </span>
                    </div>

                    {isFilled && (
                        <button
                            type="button"
                            className="px-12 py-4 bg-primary text-background-dark font-bold uppercase tracking-widest rounded-xl shadow-glow hover:bg-[#60f0ff] transition-all text-lg mt-2"
                        >
                            Pair Device
                        </button>
                    )}
                </div>
            </div>

            {/* Device info footer */}
            <div className="absolute bottom-8 left-8 text-xs font-mono text-slate-600" aria-hidden="true">
                <div>DEVICE_ID: K-8829-X</div>
                <div>MAC: 00:1B:44:11:3A:B7</div>
            </div>
            <div className="absolute bottom-8 right-8 text-xs font-mono text-slate-600 text-right" aria-hidden="true">
                <div>SYS_STATUS: ONLINE</div>
                <div>NET_LATENCY: 12ms</div>
            </div>
        </div>
    );
};

export default PairPage;
