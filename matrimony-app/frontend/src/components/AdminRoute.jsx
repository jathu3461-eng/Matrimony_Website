import { Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Guards every /admin/* route. Only an authenticated admin gets through;
// everyone else is bounced straight to the public admin login page.
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9]">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-pink-100 border-t-burgundy-600 animate-spin" />
          <ShieldCheck
            className="absolute inset-0 m-auto w-5 h-5 text-burgundy-700"
            aria-hidden="true"
          />
        </div>
        <p className="mt-4 text-sm font-semibold text-burgundy-700">Verifying admin session…</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
