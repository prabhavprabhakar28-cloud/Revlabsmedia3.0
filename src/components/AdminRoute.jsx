import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldX } from 'lucide-react';

/**
 * AdminRoute — wraps routes that require role === 'admin'.
 * Shows a 403 page for authenticated non-admin users.
 * Redirects to /login for unauthenticated users.
 */
export default function AdminRoute({ children }) {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-white/40" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  }

  // Authenticated but profile not loaded or not an admin
  if (!profile || !isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
        <ShieldX className="w-16 h-16 text-red-500/60" />
        <h1 className="text-3xl font-sans font-light">Access Denied</h1>
        <p className="text-white/50 font-sans text-center max-w-sm px-6">
          {profile ? "You don't have permission to view this page." : "Your profile could not be verified. Please try logging in again."}
        </p>
        <div className="flex gap-4">
          <a href="/dashboard" className="px-6 py-3 border border-white/20 text-white rounded-full font-sans font-semibold hover:bg-white/10 transition-colors">
            Go to Dashboard
          </a>
          {!profile && (
            <button onClick={() => useAuth().logout()} className="px-6 py-3 bg-white text-black rounded-full font-sans font-semibold hover:bg-white/90 transition-colors">
              Logout
            </button>
          )}
        </div>
      </div>
    );
  }

  return children;
}
