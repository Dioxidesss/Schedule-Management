import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

// ─── Shared SVG Logo (exact paths from HTML reference) ────────────────────────
const IsomerSVG: React.FC<{ className?: string }> = ({ className = 'h-full w-full' }) => (
    <svg className={className} fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 80 L50 50 L40 40 Z" fill="#0055AA" />
        <path d="M10 80 L40 40 L50 15 Z" fill="#0077EE" />
        <path d="M50 50 L90 20 L60 60 Z" fill="#0055AA" />
        <path d="M90 20 L60 60 L50 85 Z" fill="#0077EE" />
        <path d="M40 40 L60 60 L50 50 Z" fill="#00CCFF" />
        <path d="M10 80 L50 50 L50 15 Z" fill="url(#lpGrad1)" opacity="0.8" />
        <path d="M90 20 L50 50 L50 85 Z" fill="url(#lpGrad2)" opacity="0.8" />
        <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="lpGrad1" x1="10" x2="50" y1="80" y2="15">
                <stop stopColor="#00E5FF" />
                <stop offset="1" stopColor="#003366" />
            </linearGradient>
            <linearGradient gradientUnits="userSpaceOnUse" id="lpGrad2" x1="90" x2="50" y1="20" y2="85">
                <stop stopColor="#00E5FF" />
                <stop offset="1" stopColor="#003366" />
            </linearGradient>
        </defs>
    </svg>
);

// ─── Header ───────────────────────────────────────────────────────────────────
const LandingHeader: React.FC = () => (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-white/10 bg-background-dark/95 backdrop-blur-md px-6 py-4 lg:px-20">
        <div className="flex items-center gap-4 text-white">
            <div className="h-10 w-10">
                <IsomerSVG />
            </div>
            <h2 className="text-white text-xl font-display font-bold leading-tight tracking-[-0.015em]">
                Isomer
            </h2>
        </div>
        <Link
            to="/auth"
            className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary text-background-dark px-6 py-2.5 text-sm font-display font-bold hover:bg-white transition-colors duration-200"
        >
            <span className="truncate">Get Started Free</span>
        </Link>
    </header>
);

// ─── Hero Section ─────────────────────────────────────────────────────────────
const HeroSection: React.FC = () => (
    <section className="relative px-6 py-16 lg:px-20 lg:py-24 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4" />

        <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                {/* Left: Copy */}
                <div className="flex flex-col gap-6">
                    {/* Live badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 w-fit">
                        <span className="block h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-medium text-primary uppercase tracking-wider">
                            Live Unload Docks Only
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 className="font-display text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                        <span className="text-primary">The End of Static Scheduling.</span>{' '}
                        <div>Move Freight, Not Spreadsheets.</div>
                    </h1>

                    {/* Description */}
                    <p className="max-w-xl text-lg text-slate-400">
                        Isomer is an <b>Adaptive Dock Orchestration</b> platform. By translating
                        unstructured vendor emails and real-time gate data into an optimized flow,
                        Isomer eliminates the &quot;Static Slot&quot; fallacy—giving your facility a
                        living, breathing schedule that adapts to the chaos of the road in real-time.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Link
                            to="/auth"
                            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-bold text-background-dark hover:bg-white transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)]"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            to="/kiosk/pair"
                            className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-primary/40 bg-background-dark/80 backdrop-blur-md px-8 text-base font-bold text-white hover:text-primary hover:border-primary hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] transition-all duration-300"
                        >
                            <span className="material-symbols-outlined mr-2 text-xl text-primary">
                                settings_applications
                            </span>
                            Kiosk Setup
                        </Link>
                    </div>
                </div>

                {/* Right: Animated truck-status panel */}
                <div className="relative w-full aspect-video lg:aspect-square lg:h-auto rounded-xl border border-slate-800 bg-surface-darker shadow-2xl overflow-hidden group">
                    {/* Scrolling flow lines */}
                    <div className="absolute inset-0 overflow-hidden opacity-20">
                        <div className="absolute top-[20%] left-[-100%] w-[200%] h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-flow" />
                        <div
                            className="absolute top-[50%] left-[-100%] w-[200%] h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-flow"
                            style={{ animationDelay: '1.5s' }}
                        />
                        <div
                            className="absolute top-[80%] left-[-100%] w-[200%] h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-flow"
                            style={{ animationDelay: '0.8s' }}
                        />
                    </div>

                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] duration-[1500ms]" />

                    {/* Content overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {/* Background image */}
                        <div
                            className="w-full h-full bg-cover bg-center opacity-40 mix-blend-overlay"
                            style={{
                                backgroundImage:
                                    "url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop')",
                            }}
                        />
                        {/* Gradient fade */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent" />

                        {/* Truck status rows */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-2">
                                    <div className="h-2 w-24 bg-primary rounded-full" />
                                    <div className="h-2 w-12 bg-slate-600 rounded-full" />
                                </div>
                                <span className="text-primary font-mono text-sm flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm animate-pulse">bolt</span>
                                    98% Efficient
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="h-12 w-full bg-slate-800/80 backdrop-blur rounded border border-slate-700 flex items-center px-4 justify-between animate-float">
                                    <span className="text-xs text-slate-400">Truck #8922</span>
                                    <div className="h-2 w-32 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                    <span className="text-xs text-white font-mono">On Time</span>
                                </div>
                                <div className="h-12 w-full bg-slate-800/80 backdrop-blur rounded border border-slate-700 flex items-center px-4 justify-between animate-float-delayed">
                                    <span className="text-xs text-slate-400">Truck #1104</span>
                                    <div className="h-2 w-24 bg-primary rounded-full shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
                                    <span className="text-xs text-white font-mono">Rescheduled</span>
                                </div>
                                <div className="h-12 w-full bg-slate-800/80 backdrop-blur rounded border border-slate-700 flex items-center px-4 justify-between animate-float">
                                    <span className="text-xs text-slate-400">Truck #4421</span>
                                    <div className="h-2 w-40 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                    <span className="text-xs text-white font-mono">Unloading</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

// ─── Old Way vs Isomer ────────────────────────────────────────────────────────
const ShiftToAutonomySection: React.FC = () => (
    <section className="bg-[#050914] px-6 py-20 lg:px-20">
        <div className="mx-auto max-w-7xl">
            <div className="mb-12">
                <h2 className="font-display text-3xl font-bold text-white mb-4">
                    The Shift to Autonomy
                </h2>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="max-w-2xl">
                        <h3 className="text-4xl lg:text-5xl font-display font-black text-white mb-4">
                            Old Way vs. Isomer
                        </h3>
                        <p className="text-slate-400 text-lg">
                            Stop relying on static spreadsheets and manual emails. Switch to dynamic AI
                            that adapts in real-time.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="text-primary font-bold border-b border-primary pb-1 hover:text-white hover:border-white transition-colors"
                    >
                        Compare Features →
                    </button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* The Old Way */}
                <div className="rounded-xl border border-red-900/30 bg-red-950/10 p-8 transition-colors hover:bg-red-950/20 group">
                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-500 group-hover:text-red-400 group-hover:bg-red-500/20">
                        <span className="material-symbols-outlined text-3xl">cancel</span>
                    </div>
                    <h4 className="mb-2 text-xl font-bold text-white font-display">The Old Way: Chaos</h4>
                    <p className="text-slate-400">
                        Manual spreadsheets, missed emails, and average 2 hours idle time per truck
                        due to rigid scheduling.
                    </p>
                    <ul className="mt-6 space-y-3 text-sm text-slate-500">
                        <li className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500 text-lg">close</span>
                            High Detention Fees
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500 text-lg">close</span>
                            Phone Tag &amp; Emails
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500 text-lg">close</span>
                            Reactive Problem Solving
                        </li>
                    </ul>
                </div>

                {/* Isomer */}
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-[120px] text-primary animate-pulse">
                            auto_mode
                        </span>
                    </div>
                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-background-dark font-bold shadow-[0_0_15px_rgba(0,229,255,0.4)]">
                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                    </div>
                    <h4 className="mb-2 text-xl font-bold text-white font-display">Isomer: Precision</h4>
                    <p className="text-primary/80">
                        Dynamic rescheduling, zero-touch coordination, and optimized turn times via
                        AI prediction.
                    </p>
                    <ul className="mt-6 space-y-3 text-sm text-slate-300">
                        <li className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-lg">check</span>
                            Zero Detention Fees
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-lg">check</span>
                            Automated Negotiations
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-lg">check</span>
                            Proactive Schedule Optimization
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </section>
);

// ─── How It Works ─────────────────────────────────────────────────────────────
const HowItWorksSection: React.FC = () => {
    const steps = [
        {
            icon: 'mark_email_read',
            title: '1. Parse the Email',
            desc: 'Automatically extracts intent, time constraints, and load details from unstructured carrier emails.',
        },
        {
            icon: 'query_builder',
            title: '2. Predict the Time',
            desc: 'Uses historical warehouse data to predict exact unload durations based on SKU complexity and volume.',
        },
        {
            icon: 'schedule',
            title: '3. Task to Time Translation',
            desc: 'Replaces static 1-hour blocks with predictive ones (e.g., allocating exactly 85 mins for Vendor X).',
        },
        {
            icon: 'alt_route',
            title: '4. Dynamic Reshuffling',
            desc: 'Instantly reshuffles the dock schedule when trucks arrive early, late, or not at all to maximize throughput.',
        },
    ];

    return (
        <section className="bg-background-dark px-6 py-20 lg:px-20 relative">
            <div className="mx-auto max-w-7xl">
                <div className="mb-12 max-w-3xl">
                    <h2 className="font-display text-4xl font-bold text-white mb-4">How It Works</h2>
                    <p className="text-slate-400 text-lg">
                        Our AI engine handles the entire lifecycle of a shipment appointment without
                        human intervention.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-4">
                    {steps.map((step) => (
                        <div
                            key={step.title}
                            className="group relative rounded-2xl border border-slate-800 bg-surface-dark p-6 hover:border-primary/50 transition-colors"
                        >
                            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-white group-hover:bg-primary group-hover:text-background-dark transition-all duration-300">
                                <span className="material-symbols-outlined text-2xl">{step.icon}</span>
                            </div>
                            <h3 className="mb-3 text-lg font-bold text-white font-display">{step.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ─── ROI Calculator ───────────────────────────────────────────────────────────
const ROISection: React.FC = () => (
    <section className="bg-surface-darker px-6 py-24 lg:px-20 border-y border-slate-800">
        <div className="mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Left: Description + sliders (static visual) */}
                <div>
                    <div className="inline-block rounded bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary mb-6">
                        Return on Investment
                    </div>
                    <h2 className="font-display text-4xl lg:text-5xl font-black text-white mb-6">
                        Calculate Your Savings
                    </h2>
                    <p className="text-slate-300 text-lg mb-8">
                        Detention fees bleed your margins. With an average cost of{' '}
                        <span className="text-white font-bold">RM50-RM100 per hour</span> per truck,
                        inefficiency is expensive. Isomer delivers 10x ROI in the first quarter.
                    </p>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-slate-400">Weekly Truck Volume</label>
                                <span className="text-white font-bold font-mono">250 Trucks</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[40%] rounded-full" />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-slate-400">
                                    Current Average Wait Time
                                </label>
                                <span className="text-white font-bold font-mono">2.5 Hours</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 w-[65%] rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Savings card */}
                <div className="relative rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8 shadow-2xl">
                    <div className="absolute -top-4 -right-4 h-24 w-24 bg-primary/20 rounded-full blur-2xl" />
                    <div className="text-center space-y-2 mb-8 border-b border-slate-700 pb-8">
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">
                            Potential Monthly Savings
                        </p>
                        <div className="text-6xl lg:text-7xl font-display font-black text-white tracking-tighter">
                            RM42,500
                        </div>
                        <p className="text-primary text-sm font-bold flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-sm">trending_up</span>
                            Based on RM75/hr detention fee avg
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background-dark rounded-lg p-4 text-center">
                            <div className="text-slate-400 text-xs uppercase mb-1">Annual Savings</div>
                            <div className="text-white font-bold text-xl">RM510,000</div>
                        </div>
                        <div className="bg-background-dark rounded-lg p-4 text-center border border-primary/20">
                            <div className="text-primary text-xs uppercase mb-1">Hours Saved</div>
                            <div className="text-white font-bold text-xl">540 hrs/mo</div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="mt-8 w-full rounded-lg bg-white py-3 text-background-dark font-bold hover:bg-slate-200 transition-colors"
                    >
                        Get Full ROI Report
                    </button>
                </div>
            </div>
        </div>
    </section>
);

// ─── Pricing ──────────────────────────────────────────────────────────────────
const PricingSection: React.FC = () => (
    <section className="bg-background-dark px-6 py-24 lg:px-20">
        <div className="mx-auto max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="font-display text-4xl font-bold text-white mb-4">Simple Pricing</h2>
                <p className="text-lg text-slate-400">
                    Start for free. Scale with precision. Pay only for the value we deliver.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
                {/* Free */}
                <div className="flex flex-col rounded-2xl border border-slate-700 bg-surface-dark p-8 shadow-lg hover:border-slate-500 transition-all">
                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-white font-display">Free</h3>
                        <p className="text-sm text-slate-400 mt-2">For single warehouse operations</p>
                    </div>
                    <div className="mb-6 flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">RM 0</span>
                        <span className="text-slate-500">/ Forever</span>
                    </div>
                    <ul className="mb-8 flex-1 space-y-4 text-sm text-slate-300">
                        {[
                            'Manual Scheduling',
                            'Unlimited Trucks',
                            '1 Manager Dashboard',
                            '1 Kiosk Login',
                            'Standard Delay Alerts',
                        ].map((f) => (
                            <li key={f} className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary text-lg">check</span>
                                {f}
                            </li>
                        ))}
                    </ul>
                    <Link
                        to="/auth"
                        className="w-full rounded-lg border border-slate-600 bg-transparent py-3 text-sm font-bold text-white hover:bg-slate-800 hover:border-slate-500 transition-colors text-center"
                    >
                        Start Free
                    </Link>
                </div>

                {/* Premium */}
                <div className="relative flex flex-col rounded-2xl border border-primary bg-surface-dark p-8 shadow-[0_0_30px_rgba(0,229,255,0.15)] transform lg:-translate-y-4">
                    <div className="absolute -top-10 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-6 py-2 text-sm font-bold text-background-dark uppercase tracking-wide shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                        Launch Offer: 1st Month Base Fee Waived
                    </div>
                    <div className="mb-4 pt-2">
                        <h3 className="text-xl font-bold text-white font-display">Premium</h3>
                        <p className="text-sm text-slate-400 mt-2">
                            For growing logistics hubs &amp; multi-facility networks
                        </p>
                    </div>
                    <div className="mb-6 flex flex-col gap-1">
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">RM 400</span>
                            <span className="text-slate-500">/ mo</span>
                        </div>
                        <div className="text-sm text-slate-400">+ RM 1/Truck</div>
                    </div>
                    <ul className="mb-8 flex-1 space-y-4 text-white">
                        {[
                            'Full AI Autopilot',
                            'Advanced Analytics',
                            'Auto-Reshuffling',
                            'Gmail Parsing',
                            'Unlimited Kiosks',
                            'ERP/SAP Integrations',
                        ].map((f) => (
                            <li key={f} className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary text-lg">check</span>
                                {f}
                            </li>
                        ))}
                    </ul>
                    <Link
                        to="/auth"
                        className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-background-dark hover:bg-white transition-colors text-center"
                    >
                        Get Premium
                    </Link>
                </div>
            </div>
        </div>
    </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────────
const LandingFooter: React.FC = () => (
    <footer className="border-t border-slate-800 bg-background-dark px-6 py-12 lg:px-20">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-white">
                <div className="size-6">
                    <IsomerSVG />
                </div>
                <span className="font-display font-bold text-lg">Isomer</span>
            </div>
            <div className="text-slate-500 text-sm">
                © 2026 Isomer Logistics AI. All rights reserved.
            </div>
            <div className="flex gap-6">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">Twitter</a>
            </div>
        </div>
    </footer>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
    const { session, loading } = useAuthContext();
    const navigate = useNavigate();

    // Redirect signed-in users directly to the dashboard
    useEffect(() => {
        if (!loading && session) {
            navigate('/dashboard', { replace: true });
        }
    }, [session, loading, navigate]);

    // Don't flash the marketing page while the auth session is resolving
    if (loading) return null;

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-dark text-slate-100 font-body antialiased">
            <LandingHeader />
            <main className="flex-grow">
                <HeroSection />
                <ShiftToAutonomySection />
                <HowItWorksSection />
                <ROISection />
                <PricingSection />
            </main>
            <LandingFooter />
        </div>
    );
};

export default LandingPage;
