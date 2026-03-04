import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';

const DIGIT_COUNT = 6;

type PairState = 'input' | 'loading' | 'success' | 'error';

const PairPage: React.FC = () => {
    const navigate = useNavigate();
    const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(''));
    const [pairState, setPairState] = useState<PairState>('input');
    const [errorMsg, setErrorMsg] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        const char = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[index] = char;
        setDigits(next);
        if (char && index < DIGIT_COUNT - 1) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
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
    const code = digits.join('');

    const handlePair = async () => {
        if (!isFilled || pairState === 'loading') return;
        setPairState('loading');
        setErrorMsg('');

        try {
            const res = await api.devices.pair({
                code,
                device_model: navigator.userAgent.slice(0, 80),
                device_name: `Kiosk-${code}`,
            });

            // Persist pairing data for kiosk pages
            localStorage.setItem('isomer_device_token', res.device_token);
            localStorage.setItem('isomer_device_id', res.device_id);
            localStorage.setItem('isomer_facility_id', res.facility_id);
            localStorage.setItem('isomer_device_role', res.role);
            if (res.door_id) localStorage.setItem('isomer_door_id', res.door_id);

            setPairState('success');

            // Navigate to the appropriate kiosk page after a brief moment
            setTimeout(() => {
                if (res.role === 'loading_dock' && res.door_id) {
                    navigate(`/kiosk/dock/${res.door_id}`);
                } else {
                    navigate('/kiosk/gatehouse');
                }
            }, 1200);
        } catch (err) {
            setPairState('error');
            if (err instanceof ApiError) {
                setErrorMsg(
                    err.status === 404 ? 'Pairing code not found. Check the code and try again.'
                        : err.status === 409 ? 'This code has already been used.'
                            : err.status === 410 ? 'Pairing code expired. Generate a new one from the admin panel.'
                                : err.message
                );
            } else {
                setErrorMsg('Connection error. Make sure the device is online.');
            }
        }
    };

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
                            <defs>
                                <linearGradient id="g1" x1="10" x2="50" y1="80" y2="15" gradientUnits="userSpaceOnUse"><stop stopColor="#00E5FF" /><stop offset="1" stopColor="#003366" /></linearGradient>
                                <linearGradient id="g2" x1="90" x2="50" y1="20" y2="85" gradientUnits="userSpaceOnUse"><stop stopColor="#00E5FF" /><stop offset="1" stopColor="#003366" /></linearGradient>
                            </defs>
                            <path d="M10 80 L50 50 L50 15 Z" fill="url(#g1)" opacity="0.8" />
                            <path d="M90 20 L50 50 L50 85 Z" fill="url(#g2)" opacity="0.8" />
                            <path d="M40 40 L60 60 L50 50 Z" fill="#00CCFF" />
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
                                disabled={pairState === 'loading' || pairState === 'success'}
                                aria-label={`Digit ${i + 1}`}
                                className="w-full aspect-[3/4] bg-background-dark border-2 border-primary text-center text-4xl md:text-6xl font-display font-black text-white rounded-lg focus:outline-none focus:bg-primary/10 transition-all duration-200 placeholder-slate-700 disabled:opacity-50"
                                placeholder="0"
                            />
                        ))}
                    </div>

                    {/* Status indicator */}
                    <div className="flex items-center gap-3 mt-8 bg-surface-dark px-4 py-2 rounded-full border border-slate-700/50">
                        {pairState === 'loading' ? (
                            <span className="size-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                        ) : pairState === 'success' ? (
                            <span className="material-symbols-outlined text-gate-primary text-sm" aria-hidden="true">check_circle</span>
                        ) : (
                            <span className="relative flex h-3 w-3" aria-hidden="true">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                            </span>
                        )}
                        <span className="text-slate-400 text-sm font-mono uppercase tracking-wider">
                            {pairState === 'loading' && 'Pairing...'}
                            {pairState === 'success' && 'Paired! Redirecting...'}
                            {pairState === 'error' && 'Pairing failed'}
                            {pairState === 'input' && (isFilled ? 'Ready to pair...' : 'Waiting for input...')}
                        </span>
                    </div>

                    {/* Error message */}
                    {pairState === 'error' && errorMsg && (
                        <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl px-6 py-3 max-w-sm">{errorMsg}</p>
                    )}

                    {/* Pair button */}
                    {isFilled && pairState !== 'success' && (
                        <button type="button" onClick={() => void handlePair()}
                            disabled={pairState === 'loading'}
                            className="px-12 py-4 bg-primary text-background-dark font-bold uppercase tracking-widest rounded-xl shadow-glow hover:bg-[#60f0ff] transition-all text-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {pairState === 'loading' ? 'Pairing...' : pairState === 'error' ? 'Try Again' : 'Pair Device'}
                        </button>
                    )}
                </div>
            </div>

            {/* Device info footer */}
            <div className="absolute bottom-8 left-8 text-xs font-mono text-slate-600" aria-hidden="true">
                <div>DEVICE_ID: K-8829-X</div><div>MAC: 00:1B:44:11:3A:B7</div>
            </div>
            <div className="absolute bottom-8 right-8 text-xs font-mono text-slate-600 text-right" aria-hidden="true">
                <div>SYS_STATUS: ONLINE</div><div>NET_LATENCY: 12ms</div>
            </div>
        </div>
    );
};

export default PairPage;
