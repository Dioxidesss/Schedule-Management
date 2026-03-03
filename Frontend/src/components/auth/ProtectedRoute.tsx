import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { session, loading } = useAuthContext();

    // While the session is being resolved from storage, show a full-screen
    // spinner — this prevents a flash redirect to /auth for authenticated users.
    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background-dark">
                <div className="flex items-center gap-3 text-primary">
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                    <span className="text-sm font-mono uppercase tracking-widest">
                        Authenticating...
                    </span>
                </div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
