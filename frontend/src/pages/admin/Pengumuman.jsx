import { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Eye, Loader2, Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { formatTanggal } from '@/lib/utils';

const TARGETS = [
  { value: 'ALL', label: 'Semua' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'GURU', label: 'Guru' },
  { value: 'SISWA', label: 'Siswa' },
  { value: 'PAKET_A', label: 'Paket A' },
  { value: 'PAKET_B', label: 'Paket B' },
  { value: 'PAKET_C', label: 'Paket C' },
];

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['link', 'blockquote'],
    ['clean'],
  ],
};

const EMPTY = { judul: '', konten: '', target: 'ALL', isPublished: false };

export default function Pengumuman() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTarget, setFilterTarget] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pengumuman', { params: { limit: 100 } });
      setItems(res.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal memuat pengumuman');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (filterTarget !== 'ALL' && p.target !== filterTarget) return false;
      if (filterStatus === 'PUBLISHED' && !p.isPublished) return false;
      if (filterStatus === 'DRAFT' && p.isPublished) return false;
      return true;
    });
  }, [items, filterTarget, filterStatus]);

  const togglePublish = async (p) => {
    try {
      await api.put(`/pengumuman/${p.id}/publish`);
      setItems((arr) =>
        arr.map((it) =>
          it.id === p.id
            ? {
                ...it,
                isPublished: !it.isPublished,
                publishedAt: !it.isPublished ? new Date().toISOString() : it.publishedAt,
              }
            : it,
        ),
      );
      toast.success(p.isPublished ? 'Pengumuman ditarik' : 'Pengumuman dipublikasikan');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const openAdd = () => setEditForm({ ...EMPTY });
  const openEdit = (p) =>
    setEditForm({
      id: p.id,
      judul: p.judul || '',
      konten: p.konten || '',
      target: p.target || 'ALL',
      isPublished: !!p.isPublished,
    });

  const submitForm = async (e) => {
    e.preventDefault();
    if (!editForm.judul.trim() || !editForm.konten.trim()) {
      toast.error('Judul dan konten wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        judul: editForm.judul.trim(),
        konten: editForm.konten,
        target: editForm.target,
        isPublished: editForm.isPublished,
      };
      if (editForm.id) {
        await api.put(`/pengumuman/${editForm.id}`, payload);
        toast.success('Pengumuman diperbarui');
      } else {
        await api.post('/pengumuman', payload);
        toast.success('Pengumuman dibuat');
      }
      setEditForm(null);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan pengumuman');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/pengumuman/${deleteTarget.id}`);
      toast.success('Pengumuman dihapus');
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus pengumuman');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Pengumuman</h1>
          <p className="text-sm text-muted-foreground">
            Buat pengumuman dan tentukan target penerima.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Buat Pengumuman
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Target</Label>
          <Select value={filterTarget} onValueChange={setFilterTarget}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua target</SelectItem>
              {TARGETS.filter((t) => t.value !== 'ALL').map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua status</SelectItem>
              <SelectItem value="PUBLISHED">Dipublikasikan</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="space-y-2 py-5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            <Megaphone className="mx-auto mb-2 h-8 w-8 opacity-60" />
            Belum ada pengumuman yang cocok dengan filter.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((p) => (
            <Card key={p.id}>
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{TARGETS.find((t) => t.value === p.target)?.label || p.target}</Badge>
                  <Badge variant={p.isPublished ? 'success' : 'secondary'}>
                    {p.isPublished ? 'Dipublikasikan' : 'Draft'}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatTanggal(p.publishedAt || p.createdAt)}
                  </span>
                </div>
                <CardTitle className="line-clamp-2">{p.judul}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className="prose prose-sm dark:prose-invert line-clamp-3 text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: p.konten || '' }}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={p.isPublished}
                      onCheckedChange={() => togglePublish(p)}
                    />
                    {p.isPublished ? 'Tayang' : 'Draft'}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setPreviewItem(p)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(p)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editForm} onOpenChange={(o) => !o && setEditForm(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editForm?.id ? 'Edit Pengumuman' : 'Buat Pengumuman'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-judul">Judul</Label>
              <Input
                id="p-judul"
                value={editForm?.judul || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, judul: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Target</Label>
                <Select
                  value={editForm?.target || 'ALL'}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, target: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGETS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!editForm?.isPublished}
                    onCheckedChange={(v) => setEditForm((f) => ({ ...f, isPublished: v }))}
                  />
                  <Label className="cursor-pointer">Publikasikan langsung</Label>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Konten</Label>
              <ReactQuill
                theme="snow"
                modules={QUILL_MODULES}
                value={editForm?.konten || ''}
                onChange={(v) => setEditForm((f) => ({ ...f, konten: v }))}
              />
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

      <Dialog open={!!previewItem} onOpenChange={(o) => !o && setPreviewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.judul}</DialogTitle>
          </DialogHeader>
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: previewItem?.konten || '' }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengumuman?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengumuman &quot;{deleteTarget?.judul}&quot; akan dihapus permanen.
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
