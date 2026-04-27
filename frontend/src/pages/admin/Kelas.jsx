import { useEffect, useState } from 'react';
import { Pencil, Plus, School, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { paketColor, PAKET_LABEL } from '@/lib/utils';
import ModalKelas from '@/components/admin/ModalKelas';

export default function Kelas() {
  const [kelasList, setKelasList] = useState([]);
  const [paketList, setPaketList] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [kelasRes, paketRes, guruRes, mapelRes] = await Promise.all([
        api.get('/kelas', { params: { limit: 100 } }),
        api.get('/paket').catch(() => ({ data: { data: [] } })),
        api.get('/users', { params: { role: 'GURU', limit: 100 } }),
        api.get('/mata-pelajaran').catch(() => ({ data: { data: [] } })),
      ]);
      setKelasList(kelasRes.data?.data || []);
      const paketData = paketRes.data?.data || [];
      setPaketList(
        paketData.length > 0
          ? paketData
          : [
              { id: 'PAKET_A', nama: 'Paket A (SD)', level: 'PAKET_A' },
              { id: 'PAKET_B', nama: 'Paket B (SMP)', level: 'PAKET_B' },
              { id: 'PAKET_C', nama: 'Paket C (SMA)', level: 'PAKET_C' },
            ],
      );
      const guruRaw = guruRes.data?.data || [];
      setGuruList(
        guruRaw
          .filter((u) => u.guru?.id)
          .map((u) => ({ id: u.guru.id, user: { name: u.name }, name: u.name })),
      );
      setMapelList(mapelRes.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onEdit = (k) => {
    setEditTarget(k);
    setOpenModal(true);
  };
  const onAdd = () => {
    setEditTarget(null);
    setOpenModal(true);
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/kelas/${deleteTarget.id}`);
      toast.success('Kelas dihapus');
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus kelas');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Manajemen Kelas</h1>
          <p className="text-sm text-muted-foreground">
            Buat dan kelola kelas berdasarkan paket dan tahun ajaran.
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" /> Buat Kelas Baru
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : kelasList.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            <School className="mx-auto mb-2 h-8 w-8 opacity-60" />
            Belum ada kelas. Klik &quot;Buat Kelas Baru&quot; untuk memulai.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kelasList.map((k) => {
            const lvl = k.paket?.level;
            return (
              <Card key={k.id} className="overflow-hidden">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${paketColor(
                        lvl,
                      )}`}
                    >
                      {PAKET_LABEL[lvl] || k.paket?.nama || '—'}
                    </span>
                    <Badge variant={k.isActive === false ? 'secondary' : 'success'}>
                      {k.isActive === false ? 'Nonaktif' : 'Aktif'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{k.nama}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Kode: <span className="font-medium">{k.kode}</span> • {k.tahunAjaran} •
                    Sem. {k.semester}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Guru:</span>
                    <span className="font-medium">
                      {k.guru?.user?.name || k.guru?.name || '—'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Anggota: {k._count?.kelasAnggota ?? k.anggotaCount ?? 0}</span>
                    <span>Materi: {k._count?.materi ?? k.materiCount ?? 0}</span>
                    <span>Tugas: {k._count?.tugas ?? k.tugasCount ?? 0}</span>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => onEdit(k)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(k)}
                    >
                      <Trash2 className="h-4 w-4" /> Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ModalKelas
        open={openModal}
        onOpenChange={setOpenModal}
        initial={editTarget}
        onSaved={fetchAll}
        paketList={paketList}
        guruList={guruList}
        mapelList={mapelList}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kelas?</AlertDialogTitle>
            <AlertDialogDescription>
              Kelas &quot;{deleteTarget?.nama}&quot; akan dihapus. Kelas yang sudah memiliki materi
              atau tugas tidak akan bisa dihapus.
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
