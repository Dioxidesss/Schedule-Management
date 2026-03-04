import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public pages
import AuthPage from './pages/auth/AuthPage';
const LandingPage = lazy(() => import('./pages/public/LandingPage'));

// Kiosk pages — fullscreen, no auth required (device token auth is separate)
const PairPage = lazy(() => import('./pages/kiosk/PairPage'));
const GatehousePage = lazy(() => import('./pages/kiosk/GatehousePage'));
const DockPage = lazy(() => import('./pages/kiosk/DockPage'));

// Authenticated manager/admin pages
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
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Landing page — self-redirects to /dashboard if signed in */}
            <Route path="/" element={<LandingPage />} />

            {/* Public auth page */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Kiosk routes — publicly accessible, device tokens are handled separately */}
            <Route path="/kiosk/pair" element={<PairPage />} />
            <Route path="/kiosk/gatehouse" element={<GatehousePage />} />
            <Route path="/kiosk/dock/:doorId" element={<DockPage />} />

            {/* Protected manager routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Protected admin routes */}
            <Route
              path="/admin/billing"
              element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/team"
              element={
                <ProtectedRoute>
                  <TeamPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all: unknown routes go to auth */}
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
