const prisma = require('../lib/prisma');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100;
  return { page, limit, skip: (page - 1) * limit };
}

async function getGuruIdByUserId(userId) {
  const g = await prisma.guru.findUnique({ where: { userId } });
  return g ? g.id : null;
}

async function getSiswaIdByUserId(userId) {
  const s = await prisma.siswa.findUnique({ where: { userId } });
  return s ? s.id : null;
}

function parseTanggalRange(query) {
  const range = {};
  if (query.startDate) range.gte = new Date(query.startDate);
  if (query.endDate) {
    const end = new Date(query.endDate);
    end.setHours(23, 59, 59, 999);
    range.lte = end;
  }
  return Object.keys(range).length > 0 ? range : undefined;
}

async function listAll(req, res, next) {
  try {
    const { kelasId } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const tanggalRange = parseTanggalRange(req.query);

    const where = {};
    if (kelasId) where.kelasId = kelasId;
    if (tanggalRange) where.tanggal = tanggalRange;

    const [items, total] = await Promise.all([
      prisma.presensi.findMany({
        where,
        include: {
          kelas: { select: { id: true, nama: true, kode: true } },
          siswa: {
            select: {
              id: true,
              nisn: true,
              user: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.presensi.count({ where }),
    ]);
    return paginatedResponse(res, 'Daftar presensi', items, page, limit, total);
  } catch (err) {
    return next(err);
  }
}

async function listByKelas(req, res, next) {
  try {
    const { kelasId } = req.params;
    const tanggalRange = parseTanggalRange(req.query);

    const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });
    if (!kelas) return errorResponse(res, 'Kelas tidak ditemukan', 404);

    if (req.user.role === 'GURU') {
      const guruId = await getGuruIdByUserId(req.user.id);
      if (kelas.guruId !== guruId) {
        return errorResponse(res, 'Anda tidak mengajar di kelas ini', 403);
      }
    }

    const where = { kelasId };
    if (tanggalRange) where.tanggal = tanggalRange;

    const items = await prisma.presensi.findMany({
      where,
      include: {
        siswa: {
          select: {
            id: true,
            nisn: true,
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
      orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
    });
    return successResponse(res, 'Daftar presensi kelas', items);
  } catch (err) {
    return next(err);
  }
}

async function listBySiswa(req, res, next) {
  try {
    const { siswaId } = req.params;

    if (req.user.role === 'SISWA') {
      const mySiswaId = await getSiswaIdByUserId(req.user.id);
      if (mySiswaId !== siswaId) {
        return errorResponse(res, 'Anda hanya bisa melihat presensi sendiri', 403);
      }
    }
    const tanggalRange = parseTanggalRange(req.query);
    const where = { siswaId };
    if (tanggalRange) where.tanggal = tanggalRange;

    const items = await prisma.presensi.findMany({
      where,
      include: { kelas: { select: { id: true, nama: true, kode: true } } },
      orderBy: { tanggal: 'desc' },
    });
    return successResponse(res, 'Daftar presensi siswa', items);
  } catch (err) {
    return next(err);
  }
}

async function inputBulk(req, res, next) {
  try {
    const { kelasId } = req.params;
    const { tanggal, presensiList } = req.body || {};
    if (!tanggal || !Array.isArray(presensiList) || presensiList.length === 0) {
      return errorResponse(res, 'tanggal dan presensiList wajib diisi', 400);
    }

    const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });
    if (!kelas) return errorResponse(res, 'Kelas tidak ditemukan', 404);

    const guruId = await getGuruIdByUserId(req.user.id);
    if (kelas.guruId !== guruId) {
      return errorResponse(res, 'Anda tidak mengajar di kelas ini', 403);
    }

    const tgl = new Date(tanggal);
    tgl.setHours(0, 0, 0, 0);

    // Cek lock
    const locked = await prisma.presensi.findFirst({
      where: { kelasId, tanggal: tgl, isLocked: true },
    });
    if (locked) {
      return errorResponse(res, 'Presensi tanggal ini sudah dikunci', 400);
    }

    const results = [];
    for (const item of presensiList) {
      if (!item.siswaId || !item.status) continue;
      const r = await prisma.presensi.upsert({
        where: {
          kelasId_siswaId_tanggal: {
            kelasId,
            siswaId: item.siswaId,
            tanggal: tgl,
          },
        },
        update: { status: item.status, keterangan: item.keterangan || null },
        create: {
          kelasId,
          siswaId: item.siswaId,
          tanggal: tgl,
          status: item.status,
          keterangan: item.keterangan || null,
        },
      });
      results.push(r);
    }
    return successResponse(res, 'Presensi berhasil disimpan', { count: results.length });
  } catch (err) {
    return next(err);
  }
}

async function updateOne(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.presensi.findUnique({
      where: { id },
      include: { kelas: { select: { guruId: true } } },
    });
    if (!exist) return errorResponse(res, 'Presensi tidak ditemukan', 404);
    if (exist.isLocked) return errorResponse(res, 'Presensi sudah dikunci', 400);

    const guruId = await getGuruIdByUserId(req.user.id);
    if (exist.kelas.guruId !== guruId) {
      return errorResponse(res, 'Anda tidak mengajar di kelas ini', 403);
    }

    const data = {};
    if (typeof req.body?.status !== 'undefined') data.status = req.body.status;
    if (typeof req.body?.keterangan !== 'undefined') data.keterangan = req.body.keterangan;

    const updated = await prisma.presensi.update({ where: { id }, data });
    return successResponse(res, 'Presensi diperbarui', updated);
  } catch (err) {
    return next(err);
  }
}

async function lockTanggal(req, res, next) {
  try {
    const { kelasId } = req.params;
    const { tanggal } = req.body || {};
    if (!tanggal) return errorResponse(res, 'tanggal wajib diisi', 400);

    const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });
    if (!kelas) return errorResponse(res, 'Kelas tidak ditemukan', 404);

    const guruId = await getGuruIdByUserId(req.user.id);
    if (kelas.guruId !== guruId) {
      return errorResponse(res, 'Anda tidak mengajar di kelas ini', 403);
    }
    const tgl = new Date(tanggal);
    tgl.setHours(0, 0, 0, 0);
    const result = await prisma.presensi.updateMany({
      where: { kelasId, tanggal: tgl },
      data: { isLocked: true },
    });
    return successResponse(res, 'Presensi tanggal tersebut dikunci', { count: result.count });
  } catch (err) {
    return next(err);
  }
}

async function rekapKelas(req, res, next) {
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
    const tanggalRange = parseTanggalRange(req.query);
    const where = { kelasId };
    if (tanggalRange) where.tanggal = tanggalRange;

    const grouped = await prisma.presensi.groupBy({
      by: ['siswaId', 'status'],
      where,
      _count: { _all: true },
    });

    const siswaList = await prisma.kelasAnggota.findMany({
      where: { kelasId },
      include: {
        siswa: {
          select: {
            id: true,
            nisn: true,
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    const map = {};
    for (const g of grouped) {
      if (!map[g.siswaId]) map[g.siswaId] = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0 };
      map[g.siswaId][g.status] = g._count._all;
    }

    const data = siswaList.map((a) => {
      const counts = map[a.siswaId] || { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0 };
      const total = counts.HADIR + counts.IZIN + counts.SAKIT + counts.ALPHA;
      return {
        siswa: a.siswa,
        ...counts,
        total,
        persentaseHadir: total > 0 ? Math.round((counts.HADIR / total) * 100) : 0,
      };
    });
    return successResponse(res, 'Rekap kehadiran kelas', data);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listAll,
  listByKelas,
  listBySiswa,
  inputBulk,
  updateOne,
  lockTanggal,
  rekapKelas,
};
