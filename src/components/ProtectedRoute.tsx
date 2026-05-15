import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireCR?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false, 
  requireCR = false 
}) => {
  const { user, profile, loading, isApproved, isAdmin, isCR } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile?.status === 'pending') {
    if (location.pathname !== '/pending') {
      return <Navigate to="/pending" replace />;
    }
  }

  if (profile?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-300">Your account has been rejected. Please contact an admin if you think this is a mistake.</p>
        </div>
      </div>
    );
  }

  if (isApproved && location.pathname === '/pending') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireCR && !isCR) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
