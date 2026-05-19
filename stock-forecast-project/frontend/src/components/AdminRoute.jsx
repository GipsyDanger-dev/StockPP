import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader, ShieldAlert } from 'lucide-react';

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
          <p className="text-[#45464D]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-[#191C1E] text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-[#45464D] text-sm mb-6">
            You do not have permission to access this page. This area is restricted to administrators only.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-black text-white py-3 px-6 rounded font-bold text-sm hover:bg-gray-800 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
