import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const user = localStorage.getItem('sniper_user');

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
