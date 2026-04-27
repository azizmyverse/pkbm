import { useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, Plus, Trash2, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import DataTable from '@/components/shared/DataTable';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROLE_LABEL, getInitials, paketColor } from '@/lib/utils';
import ModalTambahPengguna from '@/components/admin/ModalTambahPengguna';

const ROLE_BADGE_VARIANT = {
  ADMIN: 'default',
  GURU: 'info',
  SISWA: 'success',
};

export default function Pengguna() {
  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [paketFilter, setPaketFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [users, setUsers] = useState([]);
  const [paketList, setPaketList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (tab !== 'ALL') params.role = tab;
      if (search) params.search = search;
      if (paketFilter !== 'ALL') params.paketId = paketFilter;
      const res = await api.get('/users', { params });
      setUsers(res.data?.data || []);
      setMeta(res.data?.meta || { total: 0, page: 1, limit: 10 });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal memuat pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, paketFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    api
      .get('/pengaturan')
      .catch(() => null);
    api
      .get('/users', { params: { limit: 1 } })
      .catch(() => null);
    // Pisah: paket list — backend tidak ekspos dedicated endpoint /paket di scope tahap 2,
    // jadi kita ambil dari user pertama yang berperan SISWA (atau hardcode 3 paket).
  }, []);

  useEffect(() => {
    // Coba ambil paket dari /pengaturan jika ada, fallback ke 3 paket statis (sesuai enum)
    setPaketList([
      { id: 'PAKET_A', nama: 'Paket A (SD)', level: 'PAKET_A' },
      { id: 'PAKET_B', nama: 'Paket B (SMP)', level: 'PAKET_B' },
      { id: 'PAKET_C', nama: 'Paket C (SMA)', level: 'PAKET_C' },
    ]);
  }, []);

  const toggleActive = async (id, current) => {
    try {
      await api.put(`/users/${id}/toggle-active`);
      setUsers((arr) =>
        arr.map((u) => (u.id === id ? { ...u, isActive: !current } : u)),
      );
      toast.success(current ? 'Akun dinonaktifkan' : 'Akun diaktifkan');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success('Pengguna dinonaktifkan');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus pengguna');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Pengguna',
        cell: (u) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={u.avatar} alt={u.name} />
              <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{u.name}</p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Peran',
        cell: (u) => (
          <Badge variant={ROLE_BADGE_VARIANT[u.role] || 'secondary'}>{ROLE_LABEL[u.role]}</Badge>
        ),
      },
      {
        key: 'paket',
        header: 'Paket',
        cell: (u) => {
          const lvl = u.siswa?.paket?.level;
          if (!lvl) return <span className="text-muted-foreground">—</span>;
          return (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${paketColor(lvl)}`}>
              {lvl.replace('PAKET_', 'Paket ')}
            </span>
          );
        },
      },
      {
        key: 'isActive',
        header: 'Status',
        cell: (u) => (
          <div className="flex items-center gap-2">
            <Switch checked={u.isActive} onCheckedChange={() => toggleActive(u.id, u.isActive)} />
            <span className="text-xs text-muted-foreground">{u.isActive ? 'Aktif' : 'Nonaktif'}</span>
          </div>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'text-right',
        cell: (u) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Aksi">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <UserCog className="h-4 w-4" /> Edit (segera hadir)
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setDeleteTarget(u)}
              >
                <Trash2 className="h-4 w-4" /> Nonaktifkan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Manajemen Pengguna</h1>
          <p className="text-sm text-muted-foreground">
            Kelola akun admin, guru, dan siswa beserta status aktifnya.
          </p>
        </div>
        <Button onClick={() => setOpenModal(true)}>
          <Plus className="h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          setPage(1);
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="ALL">Semua</TabsTrigger>
            <TabsTrigger value="ADMIN">Admin</TabsTrigger>
            <TabsTrigger value="GURU">Guru</TabsTrigger>
            <TabsTrigger value="SISWA">Siswa</TabsTrigger>
          </TabsList>
          {tab === 'SISWA' ? (
            <Select value={paketFilter} onValueChange={setPaketFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua paket</SelectItem>
                {paketList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <TabsContent value={tab} className="mt-4">
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            onSearch={setSearch}
            searchPlaceholder="Cari nama atau email..."
            pagination={meta}
            onPageChange={setPage}
            emptyText="Belum ada pengguna"
          />
        </TabsContent>
      </Tabs>

      <ModalTambahPengguna
        open={openModal}
        onOpenChange={setOpenModal}
        onCreated={() => fetchUsers()}
        paketList={paketList}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span> akan
              dinonaktifkan dan tidak bisa masuk. Tindakan ini bisa dibatalkan dengan mengaktifkan
              kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Ya, nonaktifkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
