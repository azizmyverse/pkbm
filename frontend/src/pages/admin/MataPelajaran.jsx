import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PAKET_LABEL, paketColor } from '@/lib/utils';

const PAKET_DEFAULT = [
  { id: 'PAKET_A', level: 'PAKET_A', nama: 'Paket A (SD)', icon: '📗' },
  { id: 'PAKET_B', level: 'PAKET_B', nama: 'Paket B (SMP)', icon: '📘' },
  { id: 'PAKET_C', level: 'PAKET_C', nama: 'Paket C (SMA)', icon: '📕' },
];

const EMPTY = { nama: '', kode: '', icon: '📚', paketId: '' };

export default function MataPelajaran() {
  const [paketList, setPaketList] = useState(PAKET_DEFAULT);
  const [mapel, setMapel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState(null); // {nama, kode, icon, paketId, id?}
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, mRes] = await Promise.all([
        api.get('/paket').catch(() => ({ data: { data: [] } })),
        api.get('/mata-pelajaran', { params: { limit: 200 } }).catch(() => ({ data: { data: [] } })),
      ]);
      const paketData = pRes.data?.data;
      setPaketList(paketData && paketData.length > 0 ? paketData : PAKET_DEFAULT);
      setMapel(mRes.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal memuat mata pelajaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    paketList.forEach((p) => {
      map[p.id] = { paket: p, items: [] };
    });
    mapel.forEach((m) => {
      const key = m.paketId || m.paket?.id;
      if (key && map[key]) map[key].items.push(m);
      else if (m.paket?.level && map[m.paket.level]) map[m.paket.level].items.push(m);
    });
    return Object.values(map);
  }, [mapel, paketList]);

  const openAdd = (paketId) => setEditForm({ ...EMPTY, paketId });
  const openEdit = (m) =>
    setEditForm({
      id: m.id,
      nama: m.nama || '',
      kode: m.kode || '',
      icon: m.icon || '📚',
      paketId: m.paketId || m.paket?.id || '',
    });

  const submitForm = async (e) => {
    e.preventDefault();
    if (!editForm?.nama.trim() || !editForm?.kode.trim() || !editForm?.paketId) {
      toast.error('Nama, kode, dan paket wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nama: editForm.nama.trim(),
        kode: editForm.kode.trim(),
        icon: editForm.icon,
        paketId: editForm.paketId,
      };
      if (editForm.id) {
        await api.put(`/mata-pelajaran/${editForm.id}`, payload);
        toast.success('Mata pelajaran diperbarui');
      } else {
        await api.post('/mata-pelajaran', payload);
        toast.success('Mata pelajaran ditambahkan');
      }
      setEditForm(null);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan mata pelajaran');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/mata-pelajaran/${deleteTarget.id}`);
      toast.success('Mata pelajaran dihapus');
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus mata pelajaran');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Mata Pelajaran</h1>
        <p className="text-sm text-muted-foreground">
          Daftar mata pelajaran dikelompokkan per paket pendidikan.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="space-y-2 py-5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-2 sm:p-4">
            <Accordion type="multiple" defaultValue={paketList.map((p) => p.id)}>
              {grouped.map(({ paket, items }) => (
                <AccordionItem key={paket.id} value={paket.id}>
                  <AccordionTrigger className="px-2">
                    <div className="flex flex-1 items-center justify-between pr-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-base ${paketColor(
                            paket.level,
                          )}`}
                        >
                          {paket.icon || '📚'}
                        </span>
                        <div className="text-left">
                          <p className="font-medium">{paket.nama || PAKET_LABEL[paket.level]}</p>
                          <p className="text-xs text-muted-foreground">
                            {items.length} mata pelajaran
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2">
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                          Belum ada mata pelajaran untuk paket ini.
                        </p>
                      ) : (
                        items.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{m.icon || '📚'}</span>
                              <div>
                                <p className="text-sm font-medium">{m.nama}</p>
                                <p className="text-xs text-muted-foreground">Kode: {m.kode}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(m)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAdd(paket.id)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4" /> Tambah mapel ke {PAKET_LABEL[paket.level] || paket.nama}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editForm} onOpenChange={(o) => !o && setEditForm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {editForm?.id ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-nama">Nama</Label>
              <Input
                id="m-nama"
                value={editForm?.nama || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, nama: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="m-kode">Kode</Label>
                <Input
                  id="m-kode"
                  value={editForm?.kode || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, kode: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-icon">Ikon (emoji)</Label>
                <Input
                  id="m-icon"
                  value={editForm?.icon || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, icon: e.target.value }))}
                  maxLength={2}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Paket</Label>
              <Select
                value={editForm?.paketId || ''}
                onValueChange={(v) => setEditForm((f) => ({ ...f, paketId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih paket" />
                </SelectTrigger>
                <SelectContent>
                  {paketList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nama || PAKET_LABEL[p.level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditForm(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus mata pelajaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Mata pelajaran &quot;{deleteTarget?.nama}&quot; akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Ya, hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
