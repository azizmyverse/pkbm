import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const STEPS = ['email', 'otp', 'password'];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);

  const requestOtp = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      toast.error('Email wajib diisi');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success('Kode OTP dikirim ke email anda (jika terdaftar)');
      setStep('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal mengirim OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    const ch = val.replace(/[^0-9]/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[idx] = ch;
      return next;
    });
    if (ch && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };
  const handleOtpPaste = (e) => {
    const text = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const arr = ['', '', '', '', '', ''];
    for (let i = 0; i < text.length; i += 1) arr[i] = text[i];
    setOtp(arr);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const submitOtp = (e) => {
    e?.preventDefault();
    if (otp.some((c) => !c)) {
      toast.error('Masukkan 6 digit kode OTP');
      return;
    }
    setStep('password');
  };

  const submitNewPassword = async (e) => {
    e?.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Kata sandi minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.join(''),
        newPassword,
      });
      toast.success('Kata sandi berhasil diubah, silakan masuk');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal mengubah kata sandi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <Link
          to="/login"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke login
        </Link>

        <div className="mb-6 flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                  STEPS.indexOf(step) >= i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 ? (
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    STEPS.indexOf(step) > i ? 'bg-primary' : 'bg-muted',
                  )}
                />
              ) : null}
            </div>
          ))}
        </div>

        {step === 'email' ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <h1 className="font-heading text-xl font-bold">Lupa kata sandi</h1>
              <p className="text-sm text-muted-foreground">
                Masukkan email akun anda. Kami akan mengirim kode OTP 6 digit.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  placeholder="nama@pkbm.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Kirim kode OTP
            </Button>
          </form>
        ) : null}

        {step === 'otp' ? (
          <form onSubmit={submitOtp} className="space-y-4">
            <div className="space-y-1.5">
              <h1 className="font-heading text-xl font-bold">Verifikasi OTP</h1>
              <p className="text-sm text-muted-foreground">
                Kami mengirim 6 digit kode ke{' '}
                <span className="font-medium text-foreground">{email}</span>.
              </p>
            </div>
            <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="h-12 w-12 rounded-md border border-input bg-background text-center font-heading text-lg font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ))}
            </div>
            <Button type="submit" className="w-full">
              <ShieldCheck className="h-4 w-4" /> Lanjutkan
            </Button>
            <button
              type="button"
              onClick={requestOtp}
              className="w-full text-xs text-primary hover:underline"
            >
              Kirim ulang OTP
            </button>
          </form>
        ) : null}

        {step === 'password' ? (
          <form onSubmit={submitNewPassword} className="space-y-4">
            <div className="space-y-1.5">
              <h1 className="font-heading text-xl font-bold">Kata sandi baru</h1>
              <p className="text-sm text-muted-foreground">
                Buat kata sandi baru yang aman, minimal 6 karakter.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np">Kata sandi baru</Label>
              <div className="relative">
                <Input
                  id="np"
                  type={show ? 'text' : 'password'}
                  className="pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setShow((v) => !v)}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp">Konfirmasi kata sandi</Label>
              <Input
                id="cp"
                type={show ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Simpan kata sandi
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
