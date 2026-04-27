const prisma = require('../lib/prisma');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const HARI_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

async function getGuruIdByUserId(userId) {
  const g = await prisma.guru.findUnique({ where: { userId } });
  return g ? g.id : null;
}

async function getSiswaByUserId(userId) {
  return prisma.siswa.findUnique({
    where: { userId },
    include: { paket: true },
  });
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

async function adminDashboard(req, res, next) {
  try {
    const [totalSiswa, totalGuru, totalKelas, paketCounts] = await Promise.all([
      prisma.siswa.count({ where: { status: 'AKTIF' } }),
      prisma.guru.count({ where: { user: { isActive: true } } }),
      prisma.kelas.count({ where: { isAktif: true } }),
      prisma.siswa.groupBy({
        by: ['paketId'],
        _count: { _all: true },
        where: { status: 'AKTIF' },
      }),
    ]);

    const paketList = await prisma.paket.findMany();
    const distribusiPaket = paketList.map((p) => {
      const found = paketCounts.find((x) => x.paketId === p.id);
      return { paket: p.nama, level: p.level, count: found ? found._count._all : 0 };
    });

    // Trend pendaftaran 6 bulan terakhir
    const now = new Date();
    const trendPendaftaran = [];
    for (let i = 5; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await prisma.siswa.count({
        where: { createdAt: { gte: start, lt: end } },
      });
      trendPendaftaran.push({
        bulan: start.toLocaleString('id-ID', { month: 'short', year: 'numeric' }),
        jumlah: count,
      });
    }

    // Kehadiran minggu ini per kelas (Senin-Sabtu sekarang)
    const day = now.getDay();
    const startWeek = new Date(now);
    startWeek.setDate(now.getDate() - ((day + 6) % 7)); // Senin
    startWeek.setHours(0, 0, 0, 0);

    const kelasAktif = await prisma.kelas.findMany({ where: { isAktif: true } });
    const kehadiranMingguIni = [];
    for (const k of kelasAktif) {
      const grouped = await prisma.presensi.groupBy({
        by: ['status'],
        where: {
          kelasId: k.id,
          tanggal: { gte: startWeek, lte: endOfDay(now) },
        },
        _count: { _all: true },
      });
      const total = grouped.reduce((s, g) => s + g._count._all, 0);
      const hadir = grouped.find((g) => g.status === 'HADIR')?._count._all || 0;
      kehadiranMingguIni.push({
        kelas: k.nama,
        kelasId: k.id,
        total,
        hadir,
        persentase: total > 0 ? Math.round((hadir / total) * 100) : 0,
      });
    }

    const tugasBelumDinilai = await prisma.pengumpulan.count({
      where: { nilaiAkhir: null },
    });

    // Recent activity sederhana: gabungan pendaftaran siswa + pengumpulan terbaru
    const [siswaTerbaru, submitTerbaru] = await Promise.all([
      prisma.siswa.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: { select: { id: true, name: true } },
          paket: { select: { level: true, nama: true } },
        },
      }),
      prisma.pengumpulan.findMany({
        orderBy: { submittedAt: 'desc' },
        take: 5,
        include: {
          siswa: { include: { user: { select: { id: true, name: true } } } },
          tugas: { select: { id: true, judul: true } },
        },
      }),
    ]);

    const recentActivity = [
      ...siswaTerbaru.map((s) => ({
        type: 'PENDAFTARAN',
        at: s.createdAt,
        text: `${s.user.name} mendaftar ${s.paket.nama}`,
      })),
      ...submitTerbaru.map((p) => ({
        type: 'PENGUMPULAN',
        at: p.submittedAt,
        text: `${p.siswa.user.name} mengumpulkan tugas "${p.tugas.judul}"`,
      })),
    ]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 10);

    return successResponse(res, 'Dashboard admin', {
      totalSiswa,
      totalGuru,
      totalKelas,
      distribusiPaket,
      trendPendaftaran,
      kehadiranMingguIni,
      tugasBelumDinilai,
      recentActivity,
    });
  } catch (err) {
    return next(err);
  }
}

async function guruDashboard(req, res, next) {
  try {
    const guruId = await getGuruIdByUserId(req.user.id);
    if (!guruId) return errorResponse(res, 'Profil guru tidak ditemukan', 403);

    const kelasSayaRaw = await prisma.kelas.findMany({
      where: { guruId, isAktif: true },
      include: {
        _count: { select: { kelasAnggota: true, materi: true, tugas: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const kelasSaya = kelasSayaRaw.map((k) => ({
      id: k.id,
      nama: k.nama,
      kode: k.kode,
      jumlahSiswa: k._count.kelasAnggota,
      materiCount: k._count.materi,
      tugasCount: k._count.tugas,
      jadwal: k.jadwal,
    }));

    const tugasBelumDinilai = await prisma.tugas.findMany({
      where: {
        guruId,
        pengumpulan: { some: { nilaiAkhir: null } },
      },
      include: {
        kelas: { select: { id: true, nama: true } },
        _count: {
          select: {
            pengumpulan: true,
          },
        },
      },
    });

    // Jadwal hari ini
    const now = new Date();
    const hariIni = HARI_INDO[now.getDay()];
    const jadwalHariIni = [];
    for (const k of kelasSayaRaw) {
      const jad = Array.isArray(k.jadwal) ? k.jadwal : [];
      for (const j of jad) {
        if (j && j.hari === hariIni) {
          jadwalHariIni.push({ kelasId: k.id, kelas: k.nama, ...j });
        }
      }
    }

    const kelasIds = kelasSayaRaw.map((k) => k.id);
    const [totalSiswaDidik, materiDiupload, tugasAktif, avgNilai] = await Promise.all([
      prisma.kelasAnggota.count({ where: { kelasId: { in: kelasIds } } }),
      prisma.materi.count({ where: { guruId } }),
      prisma.tugas.count({ where: { guruId, isAktif: true } }),
      prisma.nilai.aggregate({
        where: { kelasId: { in: kelasIds } },
        _avg: { nilaiAkhir: true },
      }),
    ]);

    const notifikasiTerbaru = await prisma.notifikasi.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return successResponse(res, 'Dashboard guru', {
      kelasSaya,
      tugasBelumDinilai,
      jadwalHariIni,
      statsRingkasan: {
        totalSiswaDidik,
        materiDiupload,
        tugasAktif,
        rataRataNilai:
          avgNilai._avg.nilaiAkhir != null
            ? Number(avgNilai._avg.nilaiAkhir.toFixed(2))
            : 0,
      },
      notifikasiTerbaru,
    });
  } catch (err) {
    return next(err);
  }
}

async function siswaDashboard(req, res, next) {
  try {
    const siswa = await getSiswaByUserId(req.user.id);
    if (!siswa) return errorResponse(res, 'Profil siswa tidak ditemukan', 403);

    const kelasIds = (
      await prisma.kelasAnggota.findMany({
        where: { siswaId: siswa.id },
        select: { kelasId: true },
      })
    ).map((k) => k.kelasId);

    const kelasRaw = await prisma.kelas.findMany({
      where: { id: { in: kelasIds }, isAktif: true },
      include: {
        guru: {
          select: { id: true, user: { select: { id: true, name: true } } },
        },
      },
    });

    const kelasSaya = [];
    for (const k of kelasRaw) {
      const totalMateri = await prisma.materi.count({
        where: { kelasId: k.id, isPublished: true },
      });
      const doneMateri = await prisma.materiProgress.count({
        where: { siswaId: siswa.id, selesai: true, materi: { kelasId: k.id } },
      });
      kelasSaya.push({
        id: k.id,
        nama: k.nama,
        kode: k.kode,
        guru: k.guru?.user?.name || null,
        totalMateri,
        materiSelesai: doneMateri,
        progressPersen: totalMateri > 0 ? Math.round((doneMateri / totalMateri) * 100) : 0,
        jadwal: k.jadwal,
      });
    }

    const now = new Date();
    const sevenDays = new Date();
    sevenDays.setDate(now.getDate() + 7);
    const tugasMendekatiDeadline = await prisma.tugas.findMany({
      where: {
        kelasId: { in: kelasIds },
        isAktif: true,
        deadline: { gte: now, lte: sevenDays },
      },
      include: {
        kelas: { select: { id: true, nama: true } },
        pengumpulan: {
          where: { siswaId: siswa.id },
          select: { id: true, nilaiAkhir: true, submittedAt: true },
        },
      },
      orderBy: { deadline: 'asc' },
    });

    // Streak belajar: hari berturut-turut akses materi (lastAccess)
    const accesses = await prisma.materiProgress.findMany({
      where: { siswaId: siswa.id },
      select: { lastAccess: true },
      orderBy: { lastAccess: 'desc' },
    });
    let streakBelajar = 0;
    if (accesses.length > 0) {
      const days = new Set(
        accesses.map((a) => startOfDay(a.lastAccess).toISOString().slice(0, 10)),
      );
      let cursor = startOfDay(now);
      while (days.has(cursor.toISOString().slice(0, 10))) {
        streakBelajar += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    const nilaiTerbaru = await prisma.pengumpulan.findMany({
      where: { siswaId: siswa.id, nilaiAkhir: { not: null } },
      orderBy: { gradedAt: 'desc' },
      take: 5,
      include: { tugas: { select: { id: true, judul: true } } },
    });

    const hariIni = HARI_INDO[now.getDay()];
    const jadwalHariIni = [];
    for (const k of kelasRaw) {
      const jad = Array.isArray(k.jadwal) ? k.jadwal : [];
      for (const j of jad) {
        if (j && j.hari === hariIni) {
          jadwalHariIni.push({ kelasId: k.id, kelas: k.nama, ...j });
        }
      }
    }

    return successResponse(res, 'Dashboard siswa', {
      kelasSaya,
      tugasMendekatiDeadline,
      progressBelajar: kelasSaya.map((k) => ({
        kelasId: k.id,
        nama: k.nama,
        progressPersen: k.progressPersen,
      })),
      streakBelajar,
      nilaiTerbaru,
      jadwalHariIni,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { adminDashboard, guruDashboard, siswaDashboard };
