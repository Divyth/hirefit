import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Spinner';

export function ProtectedRoute() {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
