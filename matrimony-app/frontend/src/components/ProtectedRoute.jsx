import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9]">
        <div className="w-12 h-12 rounded-full border-4 border-pink-100 border-t-burgundy-600 animate-spin" />
        <p className="mt-4 text-sm font-semibold text-burgundy-700">Loading…</p>
      </div>
    );
  }

  if (!user) return <Navigate to={role === 'admin' ? '/admin' : '/login'} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
