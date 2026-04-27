import { Navigate, Route, Routes } from 'react-router-dom';
import Login from '@/pages/auth/Login';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import AdminLayout from '@/components/shared/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import Pengguna from '@/pages/admin/Pengguna';
import Kelas from '@/pages/admin/Kelas';
import MataPelajaran from '@/pages/admin/MataPelajaran';
import Pengumuman from '@/pages/admin/Pengumuman';
import Laporan from '@/pages/admin/Laporan';
import Pengaturan from '@/pages/admin/Pengaturan';
import { useAuthStore } from '@/store/authStore';

function RootRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'GURU') return <Navigate to="/guru" replace />;
  return <Navigate to="/siswa" replace />;
}

function NotImplemented({ label }) {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-6 text-center">
      <div className="max-w-md space-y-2">
        <h1 className="font-heading text-2xl font-bold">Halaman {label} dalam pengembangan</h1>
        <p className="text-sm text-muted-foreground">
          Modul ini akan tersedia pada tahap berikutnya. Untuk saat ini gunakan akun ADMIN.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pengguna" element={<Pengguna />} />
        <Route path="kelas" element={<Kelas />} />
        <Route path="mata-pelajaran" element={<MataPelajaran />} />
        <Route path="pengumuman" element={<Pengumuman />} />
        <Route path="laporan" element={<Laporan />} />
        <Route path="pengaturan" element={<Pengaturan />} />
      </Route>

      <Route
        path="/guru/*"
        element={
          <ProtectedRoute roles={['GURU']}>
            <NotImplemented label="Guru" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/siswa/*"
        element={
          <ProtectedRoute roles={['SISWA']}>
            <NotImplemented label="Siswa" />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
