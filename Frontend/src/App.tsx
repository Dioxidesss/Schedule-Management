import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Fullscreen pages (no AppShell)
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const PairPage = lazy(() => import('./pages/kiosk/PairPage'));
const GatehousePage = lazy(() => import('./pages/kiosk/GatehousePage'));
const DockPage = lazy(() => import('./pages/kiosk/DockPage'));

// AppShell pages
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));
const BillingPage = lazy(() => import('./pages/admin/BillingPage'));
const TeamPage = lazy(() => import('./pages/admin/TeamPage'));

const PageLoader: React.FC = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-background-dark">
    <div className="flex items-center gap-3 text-primary">
      <span className="material-symbols-outlined animate-spin">refresh</span>
      <span className="text-sm font-mono uppercase tracking-widest">Loading...</span>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/auth" replace />} />

          {/* Auth */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Kiosk routes (fullscreen, no nav) */}
          <Route path="/kiosk/pair" element={<PairPage />} />
          <Route path="/kiosk/gatehouse" element={<GatehousePage />} />
          <Route path="/kiosk/dock/:doorId" element={<DockPage />} />

          {/* Manager dashboard routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />

          {/* Admin routes */}
          <Route path="/admin/billing" element={<BillingPage />} />
          <Route path="/admin/team" element={<TeamPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
