import React from 'react';

const Dashboard = () => {
    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display selection:bg-primary/30">
            <header className="flex items-center justify-between border-b border-white/10 bg-background-dark/80 backdrop-blur-md px-6 py-3 z-50">
                {/* Header Content Placehoder */}
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 text-primary group cursor-pointer">
                        <h2 className="text-white text-xl font-black leading-tight tracking-tighter">ISOMER</h2>
                    </div>
                </div>

            </header>
            <main className="flex flex-1 overflow-hidden">
                <aside className="w-72 flex flex-col border-r border-white/10 bg-background-dark/40">
                    <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">The Queue</h3>
                        </div>
                    </div>
                </aside>
                <section className="flex-1 flex flex-col bg-background-dark overflow-hidden relative">
                    {/* Gantt Chart Area */}
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
