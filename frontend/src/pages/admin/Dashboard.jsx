import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  School,
  ClipboardList,
  UserPlus,
  CalendarDays,
  Megaphone,
  ChartLine,
  CircleAlert,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import StatCard from '@/components/shared/StatCard';
import SkeletonCard from '@/components/shared/SkeletonCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelatif, PAKET_LABEL } from '@/lib/utils';

const PAKET_COLORS = {
  PAKET_A: '#22c55e',
  PAKET_B: '#3b82f6',
  PAKET_C: '#a855f7',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        setData(res.data?.data || null);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Gagal memuat dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} rows={2} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <SkeletonCard rows={6} />
          <SkeletonCard rows={6} />
          <SkeletonCard rows={6} />
        </div>
      </div>
    );
  }

  const distribusiPaket =
    data?.distribusiPaket?.map((d) => ({
      name: PAKET_LABEL[d.paket] || d.paket,
      value: d.count,
      key: d.paket,
    })) || [];

  const trend = data?.trendPendaftaran || [];
  const kehadiran = data?.kehadiranMingguIni || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Selamat datang kembali 👋</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan aktivitas PKBM MUGI SAE hari ini.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/admin/pengguna">
              <UserPlus className="h-4 w-4" /> Tambah Pengguna
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/kelas">
              <School className="h-4 w-4" /> Buat Kelas
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/pengumuman">
              <Megaphone className="h-4 w-4" /> Pengumuman
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Siswa"
          value={data?.totalSiswa ?? 0}
          icon={Users}
          color="indigo"
          description="Siswa aktif"
        />
        <StatCard
          title="Guru Aktif"
          value={data?.totalGuru ?? 0}
          icon={GraduationCap}
          color="violet"
          description="Pengajar aktif"
        />
        <StatCard
          title="Kelas Berjalan"
          value={data?.totalKelas ?? 0}
          icon={School}
          color="sky"
          description="Kelas aktif"
        />
        <StatCard
          title="Tugas Belum Dinilai"
          value={data?.tugasBelumDinilai ?? 0}
          icon={ClipboardList}
          color="amber"
          description="Pengumpulan menunggu"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Distribusi Paket</CardTitle>
          </CardHeader>
          <CardContent>
            {distribusiPaket.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada data siswa
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={distribusiPaket}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {distribusiPaket.map((d) => (
                      <Cell key={d.key} fill={PAKET_COLORS[d.key] || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={32} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tren Pendaftaran 6 Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trend} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="bulan" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="jumlah"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Kehadiran Minggu Ini per Kelas</CardTitle>
          </CardHeader>
          <CardContent>
            {kehadiran.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada data presensi minggu ini
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={kehadiran} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="kelas"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    angle={-12}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="persentase" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.recentActivity?.length ? (
              data.recentActivity.map((a, i) => (
                <ActivityItem key={i} item={a} />
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Belum ada aktivitas
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActivityItem({ item }) {
  const TYPE_ICON = {
    pendaftaran: UserPlus,
    pengumpulan: ClipboardList,
    pengumuman: Megaphone,
    nilai: ChartLine,
    presensi: CalendarDays,
  };
  const Icon = TYPE_ICON[item.tipe] || CircleAlert;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.judul || item.label || '—'}</p>
        {item.detail ? (
          <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
        ) : null}
        <p className="text-[11px] text-muted-foreground">{formatRelatif(item.waktu || item.createdAt)}</p>
      </div>
    </div>
  );
}
