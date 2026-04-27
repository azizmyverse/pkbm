import { useEffect, useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

const EMPTY = {
  name: '',
  email: '',
  password: '',
  role: 'SISWA',
  phone: '',
  address: '',
  paketId: '',
  nisn: '',
  tahunMasuk: new Date().getFullYear(),
  nip: '',
  spesialisasi: '',
};

export default function ModalTambahPengguna({ open, onOpenChange, onCreated, paketList = [] }) {
  const [form, setForm] = useState(EMPTY);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY);
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  }, [open]);

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const onPickAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Ukuran avatar maksimum 5MB');
      return;
    }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error('Nama, email, dan kata sandi wajib diisi');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Kata sandi minimal 8 karakter');
      return;
    }
    if (form.role === 'SISWA' && !form.paketId) {
      toast.error('Pilih paket untuk siswa');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone || undefined,
        address: form.address || undefined,
      };
      if (form.role === 'SISWA') {
        payload.paketId = form.paketId;
        payload.nisn = form.nisn || undefined;
        payload.tahunMasuk = Number(form.tahunMasuk) || new Date().getFullYear();
      }
      if (form.role === 'GURU') {
        payload.nip = form.nip || undefined;
        payload.spesialisasi = form.spesialisasi || undefined;
      }
      const res = await api.post('/users', payload);
      const created = res.data?.data;

      if (avatarFile && created?.id) {
        // Avatar admin-side upload tidak diekspos di backend saat ini;
        // pengguna dapat mengunggah avatar setelah login.
      }

      toast.success('Pengguna berhasil dibuat');
      onOpenChange(false);
      onCreated?.(created);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal membuat pengguna');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          <DialogDescription>
            Buat akun untuk admin, guru, atau siswa. Sistem akan mengirim email selamat datang.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarPreview} alt="" />
              <AvatarFallback>{getInitials(form.name) || '?'}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickAvatar}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-4 w-4" /> Unggah avatar
              </Button>
              <p className="text-xs text-muted-foreground">PNG/JPG, maks 5MB.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Nama lengkap</Label>
            <Input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Kata sandi</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Peran</Label>
            <Select value={form.role} onValueChange={(v) => update('role', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="GURU">Guru</SelectItem>
                <SelectItem value="SISWA">Siswa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telepon</Label>
            <Input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Alamat</Label>
            <Input id="address" value={form.address} onChange={(e) => update('address', e.target.value)} />
          </div>

          {form.role === 'SISWA' ? (
            <>
              <div className="space-y-1.5">
                <Label>Paket</Label>
                <Select value={form.paketId} onValueChange={(v) => update('paketId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih paket" />
                  </SelectTrigger>
                  <SelectContent>
                    {paketList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama || p.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nisn">NISN</Label>
                <Input id="nisn" value={form.nisn} onChange={(e) => update('nisn', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tahunMasuk">Tahun Masuk</Label>
                <Input
                  id="tahunMasuk"
                  type="number"
                  value={form.tahunMasuk}
                  onChange={(e) => update('tahunMasuk', e.target.value)}
                />
              </div>
            </>
          ) : null}

          {form.role === 'GURU' ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="nip">NIP</Label>
                <Input id="nip" value={form.nip} onChange={(e) => update('nip', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="spesialisasi">Spesialisasi</Label>
                <Input
                  id="spesialisasi"
                  value={form.spesialisasi}
                  onChange={(e) => update('spesialisasi', e.target.value)}
                />
              </div>
            </>
          ) : null}

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
