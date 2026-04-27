import { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SkeletonTable from '@/components/shared/SkeletonTable';

const TAHUN_AJARAN_DEFAULT = (() => {
  const y = new Date().getFullYear();
  return [`${y - 1}/${y}`, `${y}/${y + 1}`];
})();

export default function Laporan() {
  const [tab, setTab] = useState('nilai');
  const [kelasList, setKelasList] = useState([]);
  const [kelasId, setKelasId] = useState('');
  const [tahunAjaran, setTahunAjaran] = useState(TAHUN_AJARAN_DEFAULT[1]);
  const [semester, setSemester] = useState('1');
  const [nilaiData, setNilaiData] = useState([]);
  const [kehadiranData, setKehadiranData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get('/kelas', { params: { limit: 100 } })
      .then((res) => {
        const list = res.data?.data || [];
        setKelasList(list);
        if (list[0]?.id) setKelasId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const fetchData = async () => {
    if (!kelasId) {
      toast.error('Pilih kelas terlebih dahulu');
      return;
    }
    setLoading(true);
    try {
      if (tab === 'nilai') {
        const res = await api.get(`/nilai/kelas/${kelasId}`, {
          params: { tahunAjaran, semester: Number(semester) },
        });
        setNilaiData(res.data?.data || []);
      } else {
        const res = await api.get(`/presensi/rekap/kelas/${kelasId}`, {
          params: { tahunAjaran, semester: Number(semester) },
        });
        setKehadiranData(res.data?.data || []);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (kelasId) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, kelasId, tahunAjaran, semester]);

  const kelasNama = useMemo(
    () => kelasList.find((k) => k.id === kelasId)?.nama || '-',
    [kelasList, kelasId],
  );

  const buildNilaiRows = () => {
    const rows = [];
    nilaiData.forEach((d) => {
      const nama = d.siswa?.user?.name || d.siswa?.name || '-';
      const nisn = d.siswa?.nisn || '-';
      (d.nilai || [d]).forEach((n) => {
        rows.push([
          nama,
          nisn,
          n.mataPelajaran?.nama || '-',
          n.nilaiTugas ?? '-',
          n.nilaiUTS ?? '-',
          n.nilaiUAS ?? '-',
          n.nilaiAkhir ?? '-',
        ]);
      });
    });
    return rows;
  };

  const buildKehadiranRows = () => {
    return kehadiranData.map((r) => [
      r.siswa?.user?.name || r.siswa?.name || '-',
      r.siswa?.nisn || '-',
      r.hadir ?? 0,
      r.izin ?? 0,
      r.sakit ?? 0,
      r.alpha ?? 0,
      `${(r.persentaseHadir ?? 0).toFixed(1)}%`,
    ]);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(`Laporan ${tab === 'nilai' ? 'Nilai' : 'Kehadiran'} — ${kelasNama}`, 14, 14);
    doc.setFontSize(10);
    doc.text(`Tahun Ajaran ${tahunAjaran} • Semester ${semester}`, 14, 21);

    if (tab === 'nilai') {
      autoTable(doc, {
        startY: 28,
        head: [['Nama', 'NISN', 'Mata Pelajaran', 'Tugas', 'UTS', 'UAS', 'Nilai Akhir']],
        body: buildNilaiRows(),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229] },
      });
    } else {
      autoTable(doc, {
        startY: 28,
        head: [['Nama', 'NISN', 'Hadir', 'Izin', 'Sakit', 'Alpha', '% Hadir']],
        body: buildKehadiranRows(),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229] },
      });
    }

    doc.save(`laporan-${tab}-${kelasNama}-${tahunAjaran.replace('/', '-')}-sem${semester}.pdf`);
    toast.success('PDF berhasil diunduh');
  };

  const exportExcel = () => {
    const rows = tab === 'nilai' ? buildNilaiRows() : buildKehadiranRows();
    const header =
      tab === 'nilai'
        ? ['Nama', 'NISN', 'Mata Pelajaran', 'Tugas', 'UTS', 'UAS', 'Nilai Akhir']
        : ['Nama', 'NISN', 'Hadir', 'Izin', 'Sakit', 'Alpha', '% Hadir'];
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tab === 'nilai' ? 'Nilai' : 'Kehadiran');
    XLSX.writeFile(
      wb,
      `laporan-${tab}-${kelasNama}-${tahunAjaran.replace('/', '-')}-sem${semester}.xlsx`,
    );
    toast.success('Excel berhasil diunduh');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Laporan</h1>
        <p className="text-sm text-muted-foreground">
          Rekap nilai dan kehadiran per kelas, dengan opsi unduh PDF dan Excel.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-5 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Kelas</Label>
            <Select value={kelasId} onValueChange={setKelasId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {kelasList.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    Belum ada kelas
                  </SelectItem>
                ) : (
                  kelasList.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tahun ajaran</Label>
            <Select value={tahunAjaran} onValueChange={setTahunAjaran}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAHUN_AJARAN_DEFAULT.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Semester</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Semester 1</SelectItem>
                <SelectItem value="2">Semester 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={exportExcel}>
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button onClick={exportPdf}>
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="nilai">Nilai</TabsTrigger>
          <TabsTrigger value="kehadiran">Kehadiran</TabsTrigger>
        </TabsList>

        <TabsContent value="nilai">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rekap Nilai — {kelasNama}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonTable rows={6} cols={7} />
              ) : nilaiData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada data nilai untuk filter ini.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>NISN</TableHead>
                        <TableHead>Mata Pelajaran</TableHead>
                        <TableHead className="text-right">Tugas</TableHead>
                        <TableHead className="text-right">UTS</TableHead>
                        <TableHead className="text-right">UAS</TableHead>
                        <TableHead className="text-right">Nilai Akhir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buildNilaiRows().map((row, i) => (
                        <TableRow key={i}>
                          {row.map((c, j) => (
                            <TableCell key={j} className={j >= 3 ? 'text-right' : ''}>
                              {c}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kehadiran">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rekap Kehadiran — {kelasNama}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonTable rows={6} cols={7} />
              ) : kehadiranData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada data kehadiran untuk filter ini.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>NISN</TableHead>
                        <TableHead className="text-right">Hadir</TableHead>
                        <TableHead className="text-right">Izin</TableHead>
                        <TableHead className="text-right">Sakit</TableHead>
                        <TableHead className="text-right">Alpha</TableHead>
                        <TableHead className="text-right">% Hadir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buildKehadiranRows().map((row, i) => (
                        <TableRow key={i}>
                          {row.map((c, j) => (
                            <TableCell key={j} className={j >= 2 ? 'text-right' : ''}>
                              {c}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Download className="h-3.5 w-3.5" />
        Tip: gunakan filter di atas, lalu klik Excel/PDF untuk mengunduh.
      </p>
    </div>
  );
}
