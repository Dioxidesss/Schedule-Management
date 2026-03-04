import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import IsomerLogo from '../../components/ui/IsomerLogo';
import GradientText from '../../components/ui/GradientText';
import { useAuthContext } from '../../context/AuthContext';

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
    {
        icon: 'auto_fix_high',
        title: 'AI Schedule Optimizer',
        desc: 'Machine learning models predict unload durations and auto-assign dock doors to minimize idle time and prevent yard bottlenecks.',
        accent: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/20',
    },
    {
        icon: 'sensors',
        title: 'Real-Time Visibility',
        desc: 'Live Supabase channels push yard queue, door status, and ETA updates to every manager dashboard instantly — no polling.',
        accent: 'text-neon-cyan',
        bg: 'bg-neon-cyan/10',
        border: 'border-neon-cyan/20',
    },
    {
        icon: 'tablet_mac',
        title: 'Kiosk-First Devices',
        desc: 'Gatehouse iPads and dock-door tablets pair in seconds. Truck check-in, unload timers, and door assignments — all touchscreen native.',
        accent: 'text-royal-blue',
        bg: 'bg-royal-blue/10',
        border: 'border-royal-blue/20',
    },
    {
        icon: 'local_shipping',
        title: 'Carrier Self-Service',
        desc: 'Carriers arrive, scan their PO or plate, and are instantly directed to their assigned dock. Zero radio calls, zero paper.',
        accent: 'text-neon-green',
        bg: 'bg-neon-green/10',
        border: 'border-neon-green/20',
    },
    {
        icon: 'receipt_long',
        title: 'Usage-Based Billing',
        desc: 'Pay per truck processed. Free tier, Premium, and Enterprise plans with transparent MYR billing and downloadable invoices.',
        accent: 'text-high-yellow',
        bg: 'bg-high-yellow/10',
        border: 'border-high-yellow/20',
    },
    {
        icon: 'group',
        title: 'Multi-Facility Teams',
        desc: 'One admin account manages multiple facilities. Invite facility managers, assign locations, and revoke access instantly.',
        accent: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/20',
    },
];

const STATS = [
    { value: '42%', label: 'Reduction in dock idle time' },
    { value: '< 2 min', label: 'Average truck check-in time' },
    { value: '99.9%', label: 'Realtime uptime SLA' },
];

const HOW_IT_WORKS = [
    {
        step: '01',
        icon: 'tablet_mac',
        title: 'Pair Kiosk Devices',
        desc: 'Generate a 6-digit pairing code from the admin console. Tap it on any iPad or tablet at your gatehouse or dock doors.',
    },
    {
        step: '02',
        icon: 'calendar_month',
        title: 'Schedule Appointments',
        desc: 'Your team books inbound trucks with PO number, carrier, and time slot. AI predicts unload duration and pre-assigns a door.',
    },
    {
        step: '03',
        icon: 'done_all',
        title: 'Run on Autopilot',
        desc: 'Carriers self-check-in at the gatehouse. Dock workers start and complete unloads. Managers watch the live dashboard.',
    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const LandingNav: React.FC = () => (
    <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-background-dark/70 backdrop-blur-xl border-b border-white/5"
        aria-label="Landing navigation"
    >
        <div className="flex items-center gap-3">
            <IsomerLogo size={36} />
            <span className="text-white text-lg font-black tracking-tighter font-display">
                ISOMER
            </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
            <Link
                to="/auth"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2"
            >
                Sign In
            </Link>
            <Link
                to="/auth"
                className="px-5 py-2 bg-primary text-background-dark text-sm font-bold rounded-lg shadow-glow hover:bg-[#60f0ff] transition-all"
            >
                Get Started Free
            </Link>
        </div>
    </nav>
);

const HeroSection: React.FC = () => (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden pt-16">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-royal-blue/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-primary/5 rounded-full blur-[100px]" />
        </div>
        {/* Tech grid */}
        <div className="absolute inset-0 tech-grid-bg opacity-30 pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center gap-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-bold text-primary uppercase tracking-widest animate-fade-in">
                <span className="size-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                AI-Powered Dock Scheduling — Now in Malaysia
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none font-display">
                Docks that{' '}
                <GradientText from="#00e5ff" to="#4169e1" className="font-black">
                    run themselves.
                </GradientText>
            </h1>

            {/* Sub */}
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mt-2">
                Isomer connects your gatehouse kiosks, dock-door tablets, and facility managers
                into one real-time scheduling intelligence layer — eliminating idle trucks,
                paper logs, and radio chatter.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                <Link
                    to="/auth"
                    className="px-8 py-4 bg-primary text-background-dark text-base font-bold rounded-xl shadow-glow hover:bg-[#60f0ff] hover:shadow-[0_0_40px_rgba(0,229,255,0.5)] transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">rocket_launch</span>
                    Start Free — No Card Needed
                </Link>
                <a
                    href="#how-it-works"
                    className="px-8 py-4 border border-white/15 text-slate-300 hover:text-white hover:border-white/30 text-base font-medium rounded-xl transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">play_circle</span>
                    See How It Works
                </a>
            </div>

            {/* Dashboard preview */}
            <div className="relative w-full max-w-4xl mt-10 rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(0,229,255,0.15)] bg-surface">
                {/* Fake top bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-background-dark border-b border-white/10">
                    <div className="size-3 rounded-full bg-delayed/60" />
                    <div className="size-3 rounded-full bg-high-yellow/60" />
                    <div className="size-3 rounded-full bg-neon-green/60" />
                    <span className="ml-4 text-xs text-slate-500 font-mono">isomer.app/dashboard</span>
                </div>
                {/* Mock dashboard content */}
                <div className="bg-background-dark px-6 py-5 grid grid-cols-3 gap-4 h-56">
                    {/* Queue */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">The Queue</p>
                        {['Apex Trans PO-5512', 'FedEx PO-7723', 'DHL PO-3310'].map((item) => (
                            <div key={item} className="p-2 rounded-lg bg-surface border border-white/5 text-[10px] text-slate-300">{item}</div>
                        ))}
                    </div>
                    {/* Gantt */}
                    <div className="col-span-2 relative">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Live Schedule</p>
                        <div className="space-y-2">
                            {[
                                { door: 'DOOR 1', color: 'bg-unloading', w: '60%', label: 'ACTIVE' },
                                { door: 'DOOR 2', color: 'bg-delayed', w: '40%', label: 'DELAYED' },
                                { door: 'DOOR 3', color: 'bg-scheduled', w: '75%', label: 'READY' },
                                { door: 'DOOR 4', color: 'bg-unloading', w: '30%', label: 'ACTIVE' },
                            ].map((d) => (
                                <div key={d.door} className="flex items-center gap-2">
                                    <span className="text-[9px] text-slate-400 w-12 shrink-0">{d.door}</span>
                                    <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden">
                                        <div className={`h-full ${d.color} opacity-70 rounded`} style={{ width: d.w }} />
                                    </div>
                                    <span className={`text-[9px] font-bold w-12 ${d.color === 'bg-unloading' ? 'text-unloading' : d.color === 'bg-delayed' ? 'text-delayed' : 'text-slate-500'}`}>{d.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Glow overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background-dark to-transparent pointer-events-none" aria-hidden="true" />
            </div>
        </div>
    </section>
);

const StatsSection: React.FC = () => (
    <section className="py-16 px-6 border-y border-white/5 bg-surface-dark/40" aria-label="Key statistics">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {STATS.map((s) => (
                <div key={s.label} className="flex flex-col gap-2">
                    <GradientText
                        from="#00e5ff"
                        to="#ffffff"
                        className="text-4xl md:text-5xl font-black font-display"
                    >
                        {s.value}
                    </GradientText>
                    <p className="text-slate-400 text-sm">{s.label}</p>
                </div>
            ))}
        </div>
    </section>
);

const FeaturesSection: React.FC = () => (
    <section id="features" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 tech-grid-bg opacity-20 pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <p className="text-primary text-xs font-bold uppercase tracking-widest mb-4">Platform Features</p>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight font-display">
                    Everything your facility needs,{' '}
                    <GradientText from="#00e5ff" to="#4169e1" className="font-black">
                        nothing it doesn't.
                    </GradientText>
                </h2>
                <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
                    Isomer replaces whiteboards, walkie-talkies, and spreadsheet scheduling with
                    a closed-loop platform that learns from every truck that passes through.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {FEATURES.map((f) => (
                    <div
                        key={f.title}
                        className={`p-6 rounded-2xl border ${f.border} bg-surface-dark/60 hover:bg-surface-dark transition-colors group`}
                    >
                        <div className={`size-12 rounded-xl ${f.bg} flex items-center justify-center ${f.accent} mb-4 group-hover:scale-110 transition-transform`}>
                            <span className="material-symbols-outlined text-2xl" aria-hidden="true">{f.icon}</span>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const HowItWorksSection: React.FC = () => (
    <section id="how-it-works" className="py-24 px-6 bg-surface-dark/30 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
                <p className="text-primary text-xs font-bold uppercase tracking-widest mb-4">Simple Setup</p>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight font-display">
                    Live in{' '}
                    <GradientText from="#00e5ff" to="#4169e1" className="font-black">
                        under an hour.
                    </GradientText>
                </h2>
                <p className="text-slate-400 mt-4 max-w-xl mx-auto">
                    No hardware installs, no floor sensors, no IT department. Three steps from sign-up to fully operational.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Connector line (desktop) */}
                <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden="true" />

                {HOW_IT_WORKS.map((step) => (
                    <div key={step.step} className="flex flex-col items-center text-center gap-4 relative">
                        <div className="size-24 rounded-2xl bg-background-dark border border-primary/20 flex flex-col items-center justify-center gap-1 shadow-glow relative z-10">
                            <span className="material-symbols-outlined text-3xl text-primary" aria-hidden="true">{step.icon}</span>
                            <span className="text-[10px] font-black text-primary/60 font-mono">{step.step}</span>
                        </div>
                        <h3 className="text-white font-bold text-lg">{step.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const PricingSection: React.FC = () => (
    <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
                <p className="text-primary text-xs font-bold uppercase tracking-widest mb-4">Transparent Pricing</p>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight font-display">
                    Start free,{' '}
                    <GradientText from="#00e5ff" to="#4169e1" className="font-black">
                        scale on demand.
                    </GradientText>
                </h2>
                <p className="text-slate-400 mt-4 max-w-xl mx-auto">
                    Pay only for trucks processed. No seat licenses, no annual lock-in.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Free */}
                <div className="p-6 rounded-2xl bg-surface-dark border border-white/10 flex flex-col gap-4">
                    <div>
                        <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Free</p>
                        <p className="text-4xl font-black text-white font-mono">RM 0</p>
                        <p className="text-slate-500 text-xs mt-1">Forever free up to 50 trucks/month</p>
                    </div>
                    <ul className="flex flex-col gap-2 text-sm text-slate-300">
                        {['1 facility', '2 kiosk devices', 'Basic dashboard', 'Email support'].map((f) => (
                            <li key={f} className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">check</span>
                                {f}
                            </li>
                        ))}
                    </ul>
                    <Link to="/auth" className="mt-auto w-full py-3 text-center border border-white/20 text-slate-300 hover:text-white hover:border-primary/50 rounded-lg text-sm font-bold transition-all">
                        Get Started Free
                    </Link>
                </div>

                {/* Premium — highlighted */}
                <div className="relative p-6 rounded-2xl bg-surface-dark border border-primary/40 shadow-glow flex flex-col gap-4">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-background-dark text-[10px] font-black uppercase rounded-full tracking-widest">
                        Most Popular
                    </div>
                    <div>
                        <p className="text-primary text-xs uppercase font-bold tracking-widest mb-1">Premium</p>
                        <p className="text-4xl font-black text-white font-mono">RM 2.50</p>
                        <p className="text-slate-500 text-xs mt-1">per truck processed</p>
                    </div>
                    <ul className="flex flex-col gap-2 text-sm text-slate-300">
                        {['Unlimited facilities', 'Unlimited kiosks', 'AI schedule optimizer', 'Realtime dashboard', 'Priority support', 'Invoice history'].map((f) => (
                            <li key={f} className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">check</span>
                                {f}
                            </li>
                        ))}
                    </ul>
                    <Link to="/auth" className="mt-auto w-full py-3 text-center bg-primary text-background-dark font-bold rounded-lg text-sm hover:bg-[#60f0ff] transition-all shadow-glow">
                        Start Premium
                    </Link>
                </div>

                {/* Enterprise */}
                <div className="p-6 rounded-2xl bg-surface-dark border border-white/10 flex flex-col gap-4">
                    <div>
                        <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Enterprise</p>
                        <p className="text-4xl font-black text-white font-mono">Custom</p>
                        <p className="text-slate-500 text-xs mt-1">Volume pricing from RM 11,800/mo</p>
                    </div>
                    <ul className="flex flex-col gap-2 text-sm text-slate-300">
                        {['Custom integrations', 'SLA guarantees', 'Dedicated support', 'On-site training', 'Data export API', 'Custom billing'].map((f) => (
                            <li key={f} className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">check</span>
                                {f}
                            </li>
                        ))}
                    </ul>
                    <a href="mailto:enterprise@isomer.app" className="mt-auto w-full py-3 text-center border border-white/20 text-slate-300 hover:text-white hover:border-primary/50 rounded-lg text-sm font-bold transition-all">
                        Contact Sales
                    </a>
                </div>
            </div>
        </div>
    </section>
);

const CtaBanner: React.FC = () => (
    <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center flex flex-col items-center gap-8">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight font-display leading-tight">
                Your trucks are waiting.{' '}
                <GradientText from="#00e5ff" to="#4169e1" className="font-black">
                    Your docks don't have to.
                </GradientText>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl">
                Join logistics operations across Malaysia that have cut dock idle time by 42%.
                Set up takes less than an hour.
            </p>
            <Link
                to="/auth"
                className="px-10 py-5 bg-primary text-background-dark text-lg font-black rounded-2xl shadow-[0_0_40px_rgba(0,229,255,0.4)] hover:shadow-[0_0_60px_rgba(0,229,255,0.6)] hover:bg-[#60f0ff] transition-all flex items-center gap-3"
            >
                <span className="material-symbols-outlined text-2xl" aria-hidden="true">rocket_launch</span>
                Get Started Free Today
            </Link>
            <p className="text-slate-500 text-xs">No credit card. No setup fee. Cancel anytime.</p>
        </div>
    </section>
);

const LandingFooter: React.FC = () => (
    <footer className="border-t border-white/5 px-6 py-10 bg-background-dark">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <IsomerLogo size={28} />
                <span className="text-slate-400 text-sm font-medium">Isomer © 2026</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-500">
                <a href="#features" className="hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                <Link to="/auth" className="hover:text-white transition-colors">Sign In</Link>
                <Link to="/kiosk/pair" className="hover:text-white transition-colors">Kiosk Pair</Link>
                <a href="mailto:enterprise@isomer.app" className="hover:text-white transition-colors">Contact</a>
            </div>
        </div>
    </footer>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
    const { session, loading } = useAuthContext();
    const navigate = useNavigate();

    // If the user is already signed in, redirect to dashboard
    useEffect(() => {
        if (!loading && session) {
            navigate('/dashboard', { replace: true });
        }
    }, [session, loading, navigate]);

    // While loading session, show nothing (avoids flash)
    if (loading) return null;

    return (
        <div className="min-h-screen bg-background-dark text-slate-100 font-sans overflow-x-hidden">
            <LandingNav />
            <HeroSection />
            <StatsSection />
            <FeaturesSection />
            <HowItWorksSection />
            <PricingSection />
            <CtaBanner />
            <LandingFooter />
        </div>
    );
};

export default LandingPage;
