const prisma = require('../lib/prisma');
const { successResponse, errorResponse } = require('../utils/responseHelper');

async function getGuruIdByUserId(userId) {
  const g = await prisma.guru.findUnique({ where: { userId } });
  return g ? g.id : null;
}

async function getSiswaIdByUserId(userId) {
  const s = await prisma.siswa.findUnique({ where: { userId } });
  return s ? s.id : null;
}

function bobotFromPengaturan(items, key, def) {
  const it = items.find((p) => p.key === key);
  if (!it) return def;
  const n = parseFloat(it.value);
  return Number.isFinite(n) ? n : def;
}

async function getBobot() {
  const items = await prisma.pengaturan.findMany({
    where: { key: { in: ['bobot_tugas', 'bobot_uts', 'bobot_uas'] } },
  });
  return {
    bobotTugas: bobotFromPengaturan(items, 'bobot_tugas', 40),
    bobotUTS: bobotFromPengaturan(items, 'bobot_uts', 30),
    bobotUAS: bobotFromPengaturan(items, 'bobot_uas', 30),
  };
}

function hitungNilaiAkhir({ nilaiTugas, nilaiUTS, nilaiUAS }, bobot) {
  const t = bobot.bobotTugas / 100;
  const u = bobot.bobotUTS / 100;
  const a = bobot.bobotUAS / 100;
  // Skema fleksibel: kalau salah satu komponen null, hanya hitung yang ada
  let total = 0;
  let totalBobot = 0;
  if (nilaiTugas != null) {
    total += nilaiTugas * t;
    totalBobot += t;
  }
  if (nilaiUTS != null) {
    total += nilaiUTS * u;
    totalBobot += u;
  }
  if (nilaiUAS != null) {
    total += nilaiUAS * a;
    totalBobot += a;
  }
  if (totalBobot === 0) return null;
  // Spek: jika UAS null → return (T*0.4 + UTS*0.3) tanpa normalisasi
  if (nilaiUAS == null) {
    return Number(((nilaiTugas || 0) * t + (nilaiUTS || 0) * u).toFixed(2));
  }
  return Number(total.toFixed(2));
}

async function listByKelas(req, res, next) {
  try {
    const { kelasId } = req.params;
    const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });
    if (!kelas) return errorResponse(res, 'Kelas tidak ditemukan', 404);

    if (req.user.role === 'GURU') {
      const guruId = await getGuruIdByUserId(req.user.id);
      if (kelas.guruId !== guruId) {
        return errorResponse(res, 'Anda tidak mengajar di kelas ini', 403);
      }
    }

    const items = await prisma.nilai.findMany({
      where: { kelasId },
      include: {
        siswa: {
          select: {
            id: true,
            nisn: true,
            user: { select: { id: true, name: true } },
          },
        },
        mataPelajaran: { select: { id: true, nama: true, kode: true } },
      },
      orderBy: [{ siswaId: 'asc' }, { mataPelajaranId: 'asc' }],
    });
    return successResponse(res, 'Daftar nilai kelas', items);
  } catch (err) {
    return next(err);
  }
}

async function listBySiswa(req, res, next) {
  try {
    const { siswaId } = req.params;
    if (req.user.role === 'SISWA') {
      const my = await getSiswaIdByUserId(req.user.id);
      if (my !== siswaId) return errorResponse(res, 'Akses ditolak', 403);
    }
    const items = await prisma.nilai.findMany({
      where: { siswaId },
      include: {
        mataPelajaran: { select: { id: true, nama: true, kode: true, icon: true } },
        kelas: { select: { id: true, nama: true, kode: true } },
      },
      orderBy: [{ tahunAjaran: 'desc' }, { semester: 'desc' }],
    });
    return successResponse(res, 'Daftar nilai siswa', items);
  } catch (err) {
    return next(err);
  }
}

async function upsertNilai(req, res, next) {
  try {
    const {
      siswaId,
      mataPelajaranId,
      kelasId,
      nilaiTugas,
      nilaiUTS,
      nilaiUAS,
      semester,
      tahunAjaran,
    } = req.body || {};

    if (!siswaId || !mataPelajaranId || !kelasId || !semester || !tahunAjaran) {
      return errorResponse(
        res,
        'siswaId, mataPelajaranId, kelasId, semester, tahunAjaran wajib diisi',
        400,
      );
    }

    const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });
    if (!kelas) return errorResponse(res, 'Kelas tidak ditemukan', 404);
    const guruId = await getGuruIdByUserId(req.user.id);
    if (kelas.guruId !== guruId) {
      return errorResponse(res, 'Anda tidak mengajar di kelas ini', 403);
    }

    const bobot = await getBobot();
    const nT = nilaiTugas != null ? Number(nilaiTugas) : null;
    const nU = nilaiUTS != null ? Number(nilaiUTS) : null;
    const nA = nilaiUAS != null ? Number(nilaiUAS) : null;
    const nilaiAkhir = hitungNilaiAkhir({ nilaiTugas: nT, nilaiUTS: nU, nilaiUAS: nA }, bobot);

    const result = await prisma.nilai.upsert({
      where: {
        siswaId_mataPelajaranId_semester_tahunAjaran: {
          siswaId,
          mataPelajaranId,
          semester: Number(semester),
          tahunAjaran,
        },
      },
      update: {
        kelasId,
        nilaiTugas: nT,
        nilaiUTS: nU,
        nilaiUAS: nA,
        nilaiAkhir,
      },
      create: {
        siswaId,
        mataPelajaranId,
        kelasId,
        nilaiTugas: nT,
        nilaiUTS: nU,
        nilaiUAS: nA,
        nilaiAkhir,
        semester: Number(semester),
        tahunAjaran,
      },
    });
    return successResponse(res, 'Nilai berhasil disimpan', result);
  } catch (err) {
    return next(err);
  }
}

async function bulkInput(req, res, next) {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 'items wajib berupa array', 400);
    }
    const bobot = await getBobot();
    const guruId = await getGuruIdByUserId(req.user.id);

    const results = [];
    for (const item of items) {
      const {
        siswaId,
        mataPelajaranId,
        kelasId,
        nilaiTugas,
        nilaiUTS,
        nilaiUAS,
        semester,
        tahunAjaran,
      } = item;
      if (!siswaId || !mataPelajaranId || !kelasId || !semester || !tahunAjaran) continue;

      const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });
      if (!kelas || kelas.guruId !== guruId) continue;

      const nT = nilaiTugas != null ? Number(nilaiTugas) : null;
      const nU = nilaiUTS != null ? Number(nilaiUTS) : null;
      const nA = nilaiUAS != null ? Number(nilaiUAS) : null;
      const nilaiAkhir = hitungNilaiAkhir({ nilaiTugas: nT, nilaiUTS: nU, nilaiUAS: nA }, bobot);

      const r = await prisma.nilai.upsert({
        where: {
          siswaId_mataPelajaranId_semester_tahunAjaran: {
            siswaId,
            mataPelajaranId,
            semester: Number(semester),
            tahunAjaran,
          },
        },
        update: { kelasId, nilaiTugas: nT, nilaiUTS: nU, nilaiUAS: nA, nilaiAkhir },
        create: {
          siswaId,
          mataPelajaranId,
          kelasId,
          nilaiTugas: nT,
          nilaiUTS: nU,
          nilaiUAS: nA,
          nilaiAkhir,
          semester: Number(semester),
          tahunAjaran,
        },
      });
      results.push(r);
    }
    return successResponse(res, 'Input nilai bulk berhasil', { count: results.length });
  } catch (err) {
    return next(err);
  }
}

async function rapor(req, res, next) {
  try {
    const { siswaId } = req.params;
    if (req.user.role === 'SISWA') {
      const my = await getSiswaIdByUserId(req.user.id);
      if (my !== siswaId) return errorResponse(res, 'Akses ditolak', 403);
    }

    const { semester, tahunAjaran } = req.query;
    const where = { siswaId };
    if (semester) where.semester = Number(semester);
    if (tahunAjaran) where.tahunAjaran = tahunAjaran;

    const [siswa, items, bobot] = await Promise.all([
      prisma.siswa.findUnique({
        where: { id: siswaId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          paket: { select: { id: true, level: true, nama: true } },
        },
      }),
      prisma.nilai.findMany({
        where,
        include: {
          mataPelajaran: { select: { id: true, nama: true, kode: true, icon: true } },
          kelas: { select: { id: true, nama: true, kode: true } },
        },
        orderBy: [{ tahunAjaran: 'desc' }, { semester: 'desc' }],
      }),
      getBobot(),
    ]);
    if (!siswa) return errorResponse(res, 'Siswa tidak ditemukan', 404);

    const rataRata =
      items.length > 0
        ? Number(
            (
              items.reduce((s, n) => s + (n.nilaiAkhir || 0), 0) / items.length
            ).toFixed(2),
          )
        : 0;

    return successResponse(res, 'Data rapor', {
      siswa,
      bobot,
      filter: { semester: semester || null, tahunAjaran: tahunAjaran || null },
      items,
      rataRata,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listByKelas, listBySiswa, upsertNilai, bulkInput, rapor };
