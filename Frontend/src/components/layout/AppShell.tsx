import React from 'react';
import TopNav from './TopNav';

interface AppShellProps {
    children: React.ReactNode;
    /** Pass a SideNav component for admin pages; omit for full-width dashboard */
    sidebar?: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children, sidebar }) => (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background-dark text-slate-100 font-sans">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
            {sidebar}
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    </div>
);

export default AppShell;
