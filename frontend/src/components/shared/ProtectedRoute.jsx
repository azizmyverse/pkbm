import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedRoute({ children, roles }) {
  const { user, accessToken } = useAuthStore();
  const location = useLocation();

  if (!user || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    const fallback =
      user.role === 'ADMIN' ? '/admin' : user.role === 'GURU' ? '/guru' : '/siswa';
    return <Navigate to={fallback} replace />;
  }
  return children;
}
