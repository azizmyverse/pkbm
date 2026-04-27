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

async function listKelas(req, res, next) {
  try {
    const { paketId, tahunAjaran, semester } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {};
    if (paketId) where.paketId = paketId;
    if (tahunAjaran) where.tahunAjaran = tahunAjaran;
    if (semester) where.semester = Number(semester);

    if (req.user.role === 'GURU') {
      const guruId = await getGuruIdByUserId(req.user.id);
      where.guruId = guruId || '__none__';
    } else if (req.user.role === 'SISWA') {
      const siswaId = await getSiswaIdByUserId(req.user.id);
      where.kelasAnggota = siswaId
        ? { some: { siswaId } }
        : { some: { siswaId: '__none__' } };
    }

    const [items, total] = await Promise.all([
      prisma.kelas.findMany({
        where,
        include: {
          paket: { select: { id: true, level: true, nama: true } },
          guru: {
            select: {
              id: true,
              user: { select: { id: true, name: true, email: true, avatar: true } },
            },
          },
          _count: { select: { kelasAnggota: true, materi: true, tugas: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.kelas.count({ where }),
    ]);

    return paginatedResponse(res, 'Daftar kelas', items, page, limit, total);
  } catch (err) {
    return next(err);
  }
}

async function getKelas(req, res, next) {
  try {
    const kelas = await prisma.kelas.findUnique({
      where: { id: req.params.id },
      include: {
        paket: { select: { id: true, level: true, nama: true } },
        guru: {
          select: {
            id: true,
            nip: true,
            spesialisasi: true,
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        kelasAnggota: {
          include: {
            siswa: {
              select: {
                id: true,
                nisn: true,
                user: { select: { id: true, name: true, email: true, avatar: true } },
              },
            },
          },
        },
        _count: { select: { materi: true, tugas: true, kelasAnggota: true } },
      },
    });
    if (!kelas) return errorResponse(res, 'Kelas tidak ditemukan', 404);

    if (req.user.role === 'SISWA') {
      const siswaId = await getSiswaIdByUserId(req.user.id);
      const isAnggota = kelas.kelasAnggota.some((a) => a.siswaId === siswaId);
      if (!isAnggota) return errorResponse(res, 'Anda tidak terdaftar di kelas ini', 403);
    }
    if (req.user.role === 'GURU') {
      const guruId = await getGuruIdByUserId(req.user.id);
      if (kelas.guruId !== guruId) {
        return errorResponse(res, 'Anda tidak mengajar di kelas ini', 403);
      }
    }

    return successResponse(res, 'Detail kelas', kelas);
  } catch (err) {
    return next(err);
  }
}

async function createKelas(req, res, next) {
  try {
    const { nama, kode, paketId, guruId, tahunAjaran, semester, jadwal, isAktif } =
      req.body || {};
    if (!nama || !kode || !paketId || !guruId || !tahunAjaran || !semester) {
      return errorResponse(
        res,
        'nama, kode, paketId, guruId, tahunAjaran, semester wajib diisi',
        400,
      );
    }
    const created = await prisma.kelas.create({
      data: {
        nama,
        kode,
        paketId,
        guruId,
        tahunAjaran,
        semester: Number(semester),
        isAktif: typeof isAktif === 'boolean' ? isAktif : true,
        jadwal: jadwal || [],
      },
    });
    return successResponse(res, 'Kelas berhasil dibuat', created, 201);
  } catch (err) {
    return next(err);
  }
}

async function updateKelas(req, res, next) {
  try {
    const { id } = req.params;
    const { nama, kode, paketId, guruId, tahunAjaran, semester, jadwal, isAktif } =
      req.body || {};

    const exist = await prisma.kelas.findUnique({ where: { id } });
    if (!exist) return errorResponse(res, 'Kelas tidak ditemukan', 404);

    const data = {};
    if (typeof nama !== 'undefined') data.nama = nama;
    if (typeof kode !== 'undefined') data.kode = kode;
    if (typeof paketId !== 'undefined') data.paketId = paketId;
    if (typeof guruId !== 'undefined') data.guruId = guruId;
    if (typeof tahunAjaran !== 'undefined') data.tahunAjaran = tahunAjaran;
    if (typeof semester !== 'undefined') data.semester = Number(semester);
    if (typeof jadwal !== 'undefined') data.jadwal = jadwal;
    if (typeof isAktif !== 'undefined') data.isAktif = !!isAktif;

    const updated = await prisma.kelas.update({ where: { id }, data });
    return successResponse(res, 'Kelas berhasil diperbarui', updated);
  } catch (err) {
    return next(err);
  }
}

async function deleteKelas(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.kelas.findUnique({
      where: { id },
      include: { _count: { select: { materi: true, tugas: true } } },
    });
    if (!exist) return errorResponse(res, 'Kelas tidak ditemukan', 404);
    if (exist._count.materi > 0 || exist._count.tugas > 0) {
      return errorResponse(
        res,
        'Kelas memiliki materi/tugas, tidak dapat dihapus',
        400,
      );
    }
    await prisma.kelas.delete({ where: { id } });
    return successResponse(res, 'Kelas berhasil dihapus');
  } catch (err) {
    return next(err);
  }
}

async function addAnggota(req, res, next) {
  try {
    const { id } = req.params;
    const { siswaIds } = req.body || {};
    if (!Array.isArray(siswaIds) || siswaIds.length === 0) {
      return errorResponse(res, 'siswaIds wajib berupa array berisi id siswa', 400);
    }
    const kelas = await prisma.kelas.findUnique({ where: { id } });
    if (!kelas) return errorResponse(res, 'Kelas tidak ditemukan', 404);

    const data = siswaIds.map((siswaId) => ({ kelasId: id, siswaId }));
    const result = await prisma.kelasAnggota.createMany({
      data,
      skipDuplicates: true,
    });
    return successResponse(res, 'Anggota berhasil ditambahkan', { count: result.count });
  } catch (err) {
    return next(err);
  }
}

async function removeAnggota(req, res, next) {
  try {
    const { id, siswaId } = req.params;
    await prisma.kelasAnggota.delete({
      where: { kelasId_siswaId: { kelasId: id, siswaId } },
    });
    return successResponse(res, 'Anggota berhasil dihapus');
  } catch (err) {
    return next(err);
  }
}

async function listAnggota(req, res, next) {
  try {
    const { id } = req.params;
    const kelas = await prisma.kelas.findUnique({ where: { id } });
    if (!kelas) return errorResponse(res, 'Kelas tidak ditemukan', 404);

    if (req.user.role === 'GURU') {
      const guruId = await getGuruIdByUserId(req.user.id);
      if (kelas.guruId !== guruId) {
        return errorResponse(res, 'Anda tidak mengajar di kelas ini', 403);
      }
    }

    const items = await prisma.kelasAnggota.findMany({
      where: { kelasId: id },
      include: {
        siswa: {
          select: {
            id: true,
            nisn: true,
            tahunMasuk: true,
            status: true,
            user: { select: { id: true, name: true, email: true, avatar: true } },
            paket: { select: { id: true, level: true, nama: true } },
          },
        },
      },
      orderBy: { tanggalGabung: 'asc' },
    });
    return successResponse(res, 'Daftar anggota kelas', items);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listKelas,
  getKelas,
  createKelas,
  updateKelas,
  deleteKelas,
  addAnggota,
  removeAnggota,
  listAnggota,
};
