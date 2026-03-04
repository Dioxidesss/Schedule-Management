import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

type DockState = 'idle' | 'running' | 'completed';

const TARGET_MINUTES = 60;

function formatTime(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

const DockPage: React.FC = () => {
    const { doorId } = useParams<{ doorId: string }>();
    const displayDoor = doorId
        ? doorId.toUpperCase().replace('-', ' ')
        : 'DOOR 4';

    const [dockState, setDockState] = useState<DockState>('idle');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearTimer = useCallback(() => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const handleStart = () => {
        if (dockState === 'running') return;
        setDockState('running');
        setElapsedSeconds(0);
        clearTimer();
        intervalRef.current = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
    };

    const handleComplete = () => {
        clearTimer();
        setDockState('completed');
    };

    // Clean up on unmount
    useEffect(() => () => clearTimer(), [clearTimer]);

    const progressPct = Math.min(
        (elapsedSeconds / (TARGET_MINUTES * 60)) * 100,
        100
    );

    // Colour the timer based on progress
    const timerColor =
        dockState === 'completed'
            ? 'text-gate-primary'
            : progressPct >= 100
                ? 'text-red-400'
                : progressPct >= 80
                    ? 'text-amber-400'
                    : 'text-neon-cyan';

    const progressBarColor =
        progressPct >= 100
            ? 'bg-red-400'
            : progressPct >= 80
                ? 'bg-amber-400'
                : 'bg-neon-cyan';

    return (
        <div className="bg-background-dark font-display min-h-screen flex flex-col items-center justify-center text-slate-100 overflow-hidden relative">
            {/* Background ambient glow */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none" aria-hidden="true">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-cyan/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-royal-blue/10 rounded-full blur-[100px]" />
            </div>

            {/* Kiosk panel */}
            <div className="w-full max-w-md h-screen max-h-[900px] flex flex-col bg-background-dark border-x border-white/10 shadow-2xl relative">

                {/* Header */}
                <header className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#0d1633] shrink-0">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-neon-cyan mb-1">
                            <span className="material-symbols-outlined text-lg" aria-hidden="true">warehouse</span>
                            <span className="text-xs font-bold tracking-widest uppercase opacity-80">Isomer Dock</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white leading-none">
                            {displayDoor}{' '}
                            <span className="opacity-50 font-normal mx-2">|</span>{' '}
                            <span className="text-slate-200 font-medium">Samsung</span>
                        </h1>
                    </div>
                    <button
                        type="button"
                        aria-label="Notifications"
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5 text-white"
                    >
                        <span className="material-symbols-outlined text-2xl" aria-hidden="true">notifications</span>
                    </button>
                </header>

                {/* Timer area */}
                <main className="flex-1 flex flex-col px-6 py-8 gap-8 justify-center items-center relative overflow-hidden">
                    <div className="flex flex-col items-center justify-center w-full py-6 flex-1">
                        <div className="flex flex-col items-center justify-center gap-0">

                            {/* Completed banner */}
                            {dockState === 'completed' && (
                                <p className="text-gate-primary text-xs font-bold uppercase tracking-widest mb-4 animate-pulse">
                                    ✓ Unload Complete
                                </p>
                            )}

                            {/* Big timer */}
                            <div
                                className={`font-mono font-bold text-7xl sm:text-8xl tracking-tighter tabular-nums transition-colors duration-500 ${timerColor}`}
                                style={{ textShadow: dockState === 'running' ? '0 0 15px rgba(13,242,242,0.3)' : undefined }}
                                aria-live="polite"
                                aria-label="Elapsed time"
                            >
                                {formatTime(elapsedSeconds)}
                            </div>

                            {/* Target pill */}
                            <div className="mt-8 flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 border border-white/5">
                                <span className="material-symbols-outlined text-neon-cyan text-sm" aria-hidden="true">timer</span>
                                <p className="text-slate-300 text-sm font-medium tracking-wide uppercase">
                                    Target: <span className="text-white font-bold">{TARGET_MINUTES} Mins</span>
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div
                                className="w-full h-1.5 bg-white/10 rounded-full mt-12 overflow-hidden max-w-xs"
                                role="progressbar"
                                aria-valuenow={Math.round(progressPct)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label="Unloading progress"
                            >
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${dockState === 'idle' ? 'animate-pulse' : ''
                                        } ${progressBarColor}`}
                                    style={{ width: dockState === 'idle' ? '0%' : `${progressPct}%` }}
                                />
                            </div>

                            {/* State label */}
                            <p className="mt-4 text-xs text-slate-500 uppercase tracking-widest font-mono">
                                {dockState === 'idle' && 'Awaiting start'}
                                {dockState === 'running' && 'Unloading in progress...'}
                                {dockState === 'completed' && `Finished in ${formatTime(elapsedSeconds)}`}
                            </p>
                        </div>
                    </div>
                </main>

                {/* Action buttons */}
                <footer className="p-6 pt-2 bg-background-dark shrink-0">
                    <div className="grid grid-cols-2 gap-4 h-20">
                        <button
                            type="button"
                            onClick={handleStart}
                            disabled={dockState === 'running' || dockState === 'completed'}
                            className="relative overflow-hidden rounded-xl bg-neon-green hover:bg-[#4aff25] text-background-dark font-bold text-lg flex flex-col items-center justify-center shadow-glow-green active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined mb-1 text-2xl" aria-hidden="true">play_circle</span>
                            <span className="leading-none">START</span>
                            <span className="text-xs opacity-80 font-semibold mt-0.5">UNLOAD</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleComplete}
                            disabled={dockState !== 'running'}
                            className="relative overflow-hidden rounded-xl bg-royal-blue hover:bg-[#527af2] text-white font-bold text-lg flex flex-col items-center justify-center shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined mb-1 text-2xl" aria-hidden="true">check_circle</span>
                            <span className="leading-none">COMPLETE</span>
                            <span className="text-xs opacity-80 font-semibold mt-0.5">UNLOAD</span>
                        </button>
                    </div>

                    {/* Device footer */}
                    <div className="mt-6 flex justify-between items-center text-xs text-slate-500 font-mono">
                        <span>ID: 8829-XJ</span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
                            ONLINE
                        </span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default DockPage;
