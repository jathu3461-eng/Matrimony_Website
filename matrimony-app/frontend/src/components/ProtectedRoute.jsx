import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center py-24 text-burgundy-700">Loading…</div>;
  if (!user) return <Navigate to={role === 'admin' ? '/admin' : '/login'} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
