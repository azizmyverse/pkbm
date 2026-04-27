import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { user, login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      const dest =
        user.role === 'ADMIN' ? '/admin' : user.role === 'GURU' ? '/guru' : '/siswa';
      navigate(dest, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Email dan kata sandi wajib diisi');
      return;
    }
    try {
      const u = await login(email.trim(), password);
      toast.success(`Selamat datang, ${u?.name || ''}`);
      const dest =
        u.role === 'ADMIN' ? '/admin' : u.role === 'GURU' ? '/guru' : '/siswa';
      navigate(dest, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'Gagal masuk. Periksa email & kata sandi.';
      toast.error(msg);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-10 text-white lg:flex">
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div className="leading-tight">
            <p className="font-heading text-lg font-bold">PKBM MUGI SAE</p>
            <p className="text-xs text-white/70">Pusat Kegiatan Belajar Masyarakat</p>
          </div>
        </div>

        <div className="relative max-w-md space-y-4">
          <h1 className="font-heading text-4xl font-bold leading-tight">
            Belajar tanpa batas, untuk semua usia.
          </h1>
          <p className="text-white/85">
            Portal pembelajaran digital untuk Paket A, B, dan C — kelola materi, tugas,
            presensi, dan nilai dalam satu tempat yang ramah dan modern.
          </p>
          <ul className="grid grid-cols-2 gap-3 pt-4 text-sm">
            {['Manajemen Kelas', 'Tugas & Penilaian', 'Forum Diskusi', 'Rapor Digital'].map(
              (f) => (
                <li
                  key={f}
                  className="rounded-lg bg-white/10 px-3 py-2 backdrop-blur"
                >
                  ✓ {f}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="relative text-xs text-white/60">
          © {new Date().getFullYear()} PKBM MUGI SAE
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5 text-center lg:text-left">
            <h2 className="font-heading text-2xl font-bold">Masuk ke akun anda</h2>
            <p className="text-sm text-muted-foreground">
              Gunakan email dan kata sandi yang diberikan oleh admin.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@pkbm.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Kata sandi</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Butuh akun? Hubungi admin PKBM MUGI SAE.
          </p>
        </div>
      </div>
    </div>
  );
}
