import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const KEYS = {
  nama_pkbm: '',
  alamat: '',
  telepon: '',
  email: '',
  logo_url: '',
  tahun_ajaran: '',
  semester_aktif: '1',
  min_kehadiran: '75',
  bobot_tugas: '40',
  bobot_uts: '30',
  bobot_uas: '30',
};

export default function Pengaturan() {
  const [values, setValues] = useState(KEYS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/pengaturan');
        const arr = res.data?.data || [];
        const next = { ...KEYS };
        arr.forEach((p) => {
          if (Object.prototype.hasOwnProperty.call(next, p.key)) {
            next[p.key] = p.value ?? '';
          }
        });
        setValues(next);
        setLogoPreview(next.logo_url || null);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Gagal memuat pengaturan');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const update = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  const onPickLogo = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast.error('Ukuran logo maksimum 2MB');
      return;
    }
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const totalBobot = useMemo(() => {
    return (
      Number(values.bobot_tugas || 0) +
      Number(values.bobot_uts || 0) +
      Number(values.bobot_uas || 0)
    );
  }, [values.bobot_tugas, values.bobot_uts, values.bobot_uas]);

  const submit = async (e) => {
    e.preventDefault();
    if (totalBobot !== 100) {
      toast.error(`Total bobot nilai harus 100% (saat ini ${totalBobot}%)`);
      return;
    }
    setSaving(true);
    try {
      let logoUrl = values.logo_url;
      if (logoFile) {
        const fd = new FormData();
        fd.append('avatar', logoFile);
        try {
          const up = await api.post('/users/me/avatar', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          logoUrl = up.data?.data?.avatar || logoUrl;
        } catch (_e) {
          toast('Logo tidak bisa diunggah lewat endpoint avatar; nilai logo_url tetap.', {
            icon: 'ℹ️',
          });
        }
      }

      const items = Object.entries({ ...values, logo_url: logoUrl }).map(
        ([key, value]) => ({ key, value: String(value ?? '') }),
      );
      await api.put('/pengaturan', { items });
      toast.success('Pengaturan disimpan');
      setLogoFile(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Pengaturan</h1>
          <p className="text-sm text-muted-foreground">
            Konfigurasi profil PKBM, akademik, dan bobot nilai.
          </p>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan semua
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi PKBM</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">Belum ada</span>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                <Upload className="h-4 w-4" /> Pilih file
                <input type="file" accept="image/*" className="hidden" onChange={onPickLogo} />
              </label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nama PKBM</Label>
            <Input
              value={values.nama_pkbm}
              onChange={(e) => update('nama_pkbm', e.target.value)}
              placeholder="PKBM MUGI SAE"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={values.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Telepon</Label>
            <Input value={values.telepon} onChange={(e) => update('telepon', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Logo URL</Label>
            <Input value={values.logo_url} onChange={(e) => update('logo_url', e.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Alamat</Label>
            <Textarea
              value={values.alamat}
              onChange={(e) => update('alamat', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Akademik</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Tahun ajaran</Label>
            <Input
              value={values.tahun_ajaran}
              onChange={(e) => update('tahun_ajaran', e.target.value)}
              placeholder="2024/2025"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Semester aktif</Label>
            <Select value={String(values.semester_aktif)} onValueChange={(v) => update('semester_aktif', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Semester 1 (Ganjil)</SelectItem>
                <SelectItem value="2">Semester 2 (Genap)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Minimum kehadiran (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={values.min_kehadiran}
              onChange={(e) => update('min_kehadiran', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bobot Nilai</CardTitle>
          <span
            className={
              totalBobot === 100
                ? 'rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
            }
          >
            Total: {totalBobot}%
          </span>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Tugas (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={values.bobot_tugas}
              onChange={(e) => update('bobot_tugas', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>UTS (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={values.bobot_uts}
              onChange={(e) => update('bobot_uts', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>UAS (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={values.bobot_uas}
              onChange={(e) => update('bobot_uas', e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground md:col-span-3">
            Total bobot harus tepat 100%. Sistem akan menolak penyimpanan jika belum sesuai.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
