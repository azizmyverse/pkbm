import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
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

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const EMPTY = {
  nama: '',
  kode: '',
  paketId: '',
  guruId: '',
  tahunAjaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
  semester: 1,
  jadwal: [],
};

export default function ModalKelas({
  open,
  onOpenChange,
  initial,
  onSaved,
  paketList = [],
  guruList = [],
  mapelList = [],
}) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          ...EMPTY,
          ...initial,
          jadwal: Array.isArray(initial.jadwal) ? initial.jadwal : [],
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, initial]);

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const addJadwal = () =>
    setForm((s) => ({
      ...s,
      jadwal: [...s.jadwal, { hari: 'Senin', jamMulai: '07:00', jamSelesai: '08:30', mapel: '' }],
    }));
  const removeJadwal = (idx) =>
    setForm((s) => ({ ...s, jadwal: s.jadwal.filter((_, i) => i !== idx) }));
  const updateJadwal = (idx, k, v) =>
    setForm((s) => ({
      ...s,
      jadwal: s.jadwal.map((row, i) => (i === idx ? { ...row, [k]: v } : row)),
    }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.kode.trim() || !form.paketId || !form.guruId) {
      toast.error('Nama, kode, paket, dan guru wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        nama: form.nama.trim(),
        kode: form.kode.trim(),
        paketId: form.paketId,
        guruId: form.guruId,
        tahunAjaran: form.tahunAjaran,
        semester: Number(form.semester),
        jadwal: form.jadwal,
      };
      if (isEdit) {
        await api.put(`/kelas/${form.id}`, payload);
        toast.success('Kelas diperbarui');
      } else {
        await api.post('/kelas', payload);
        toast.success('Kelas dibuat');
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan kelas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Kelas' : 'Buat Kelas Baru'}</DialogTitle>
          <DialogDescription>
            Atur paket, guru pengajar, tahun ajaran, dan jadwal mingguan kelas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nama">Nama kelas</Label>
            <Input id="nama" value={form.nama} onChange={(e) => update('nama', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kode">Kode</Label>
            <Input id="kode" value={form.kode} onChange={(e) => update('kode', e.target.value)} required />
          </div>
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
            <Label>Guru pengajar</Label>
            <Select value={form.guruId} onValueChange={(v) => update('guruId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih guru" />
              </SelectTrigger>
              <SelectContent>
                {guruList.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    Belum ada guru
                  </SelectItem>
                ) : (
                  guruList.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.user?.name || g.name || '-'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tahunAjaran">Tahun ajaran</Label>
            <Input
              id="tahunAjaran"
              value={form.tahunAjaran}
              onChange={(e) => update('tahunAjaran', e.target.value)}
              placeholder="2024/2025"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Semester</Label>
            <Select value={String(form.semester)} onValueChange={(v) => update('semester', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Semester 1 (Ganjil)</SelectItem>
                <SelectItem value="2">Semester 2 (Genap)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label>Jadwal mingguan</Label>
              <Button type="button" variant="outline" size="sm" onClick={addJadwal}>
                <Plus className="h-4 w-4" /> Tambah baris
              </Button>
            </div>
            <div className="space-y-2">
              {form.jadwal.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                  Belum ada jadwal — kelas tetap bisa disimpan tanpa jadwal.
                </p>
              ) : null}
              {form.jadwal.map((row, idx) => (
                <div key={idx} className="grid gap-2 rounded-md border border-border p-2 sm:grid-cols-12">
                  <div className="sm:col-span-3">
                    <Select value={row.hari} onValueChange={(v) => updateJadwal(idx, 'hari', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HARI.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="time"
                      value={row.jamMulai}
                      onChange={(e) => updateJadwal(idx, 'jamMulai', e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="time"
                      value={row.jamSelesai}
                      onChange={(e) => updateJadwal(idx, 'jamSelesai', e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <Select
                      value={row.mapel || ''}
                      onValueChange={(v) => updateJadwal(idx, 'mapel', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Mata pelajaran" />
                      </SelectTrigger>
                      <SelectContent>
                        {mapelList.length === 0 ? (
                          <SelectItem value="__none__" disabled>
                            Tidak ada mapel
                          </SelectItem>
                        ) : (
                          mapelList.map((m) => (
                            <SelectItem key={m.id} value={m.nama}>
                              {m.nama}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-end sm:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeJadwal(idx)}
                      aria-label="Hapus baris"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
