const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

const ROOT = path.resolve(__dirname, '..', '..');

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

async function siswaTerdaftarDiKelas(siswaId, kelasId) {
  if (!siswaId) return false;
  const a = await prisma.kelasAnggota.findUnique({
    where: { kelasId_siswaId: { kelasId, siswaId } },
  });
  return !!a;
}

async function listMateri(req, res, next) {
  try {
    const { kelasId, tipe, isPublished } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const where = {};
    if (kelasId) where.kelasId = kelasId;
    if (tipe) where.tipe = tipe;
    if (typeof isPublished !== 'undefined') where.isPublished = isPublished === 'true';

    if (req.user.role === 'SISWA') {
      where.isPublished = true;
      const siswaId = await getSiswaIdByUserId(req.user.id);
      where.kelas = siswaId
        ? { kelasAnggota: { some: { siswaId } } }
        : { kelasAnggota: { some: { siswaId: '__none__' } } };
    } else if (req.user.role === 'GURU') {
      const guruId = await getGuruIdByUserId(req.user.id);
      where.kelas = { guruId: guruId || '__none__' };
    }

    const [items, total] = await Promise.all([
      prisma.materi.findMany({
        where,
        include: {
          kelas: { select: { id: true, nama: true, kode: true } },
          guru: {
            select: { id: true, user: { select: { id: true, name: true } } },
          },
        },
        orderBy: [{ urutan: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.materi.count({ where }),
    ]);
    return paginatedResponse(res, 'Daftar materi', items, page, limit, total);
  } catch (err) {
    return next(err);
  }
}

async function getMateri(req, res, next) {
  try {
    const materi = await prisma.materi.findUnique({
      where: { id: req.params.id },
      include: {
        kelas: { select: { id: true, nama: true, kode: true, guruId: true } },
        guru: { select: { id: true, user: { select: { id: true, name: true } } } },
      },
    });
    if (!materi) return errorResponse(res, 'Materi tidak ditemukan', 404);

    if (req.user.role === 'SISWA') {
      if (!materi.isPublished) {
        return errorResponse(res, 'Materi belum dipublikasikan', 403);
      }
      const siswaId = await getSiswaIdByUserId(req.user.id);
      const ok = await siswaTerdaftarDiKelas(siswaId, materi.kelasId);
      if (!ok) return errorResponse(res, 'Anda tidak terdaftar di kelas ini', 403);
    }

    return successResponse(res, 'Detail materi', materi);
  } catch (err) {
    return next(err);
  }
}

async function createMateri(req, res, next) {
  try {
    const {
      judul,
      deskripsi,
      konten,
      tipe,
      linkUrl,
      thumbnail,
      kelasId,
      urutan,
      isPublished,
      durasiMenit,
    } = req.body || {};
    if (!judul || !tipe || !kelasId) {
      return errorResponse(res, 'judul, tipe, dan kelasId wajib diisi', 400);
    }

    const guruId = await getGuruIdByUserId(req.user.id);
    if (!guruId) return errorResponse(res, 'Profil guru tidak ditemukan', 403);

    const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });
    if (!kelas) return errorResponse(res, 'Kelas tidak ditemukan', 404);
    if (kelas.guruId !== guruId) {
      return errorResponse(res, 'Anda tidak mengajar di kelas ini', 403);
    }

    const fileUrl = req.file ? `/uploads/materi/${req.file.filename}` : null;
    const created = await prisma.materi.create({
      data: {
        judul,
        deskripsi: deskripsi || null,
        konten: konten || null,
        tipe,
        fileUrl,
        linkUrl: linkUrl || null,
        thumbnail: thumbnail || null,
        kelasId,
        guruId,
        urutan: urutan != null ? Number(urutan) : 0,
        isPublished: isPublished === true || isPublished === 'true',
        durasiMenit: durasiMenit != null ? Number(durasiMenit) : null,
      },
    });
    return successResponse(res, 'Materi berhasil dibuat', created, 201);
  } catch (err) {
    return next(err);
  }
}

async function updateMateri(req, res, next) {
  try {
    const { id } = req.params;
    const materi = await prisma.materi.findUnique({ where: { id } });
    if (!materi) return errorResponse(res, 'Materi tidak ditemukan', 404);

    const guruId = await getGuruIdByUserId(req.user.id);
    if (materi.guruId !== guruId) {
      return errorResponse(res, 'Anda hanya bisa mengubah materi sendiri', 403);
    }

    const allowed = [
      'judul',
      'deskripsi',
      'konten',
      'tipe',
      'linkUrl',
      'thumbnail',
      'urutan',
      'isPublished',
      'durasiMenit',
    ];
    const data = {};
    for (const k of allowed) {
      if (typeof req.body?.[k] !== 'undefined') data[k] = req.body[k];
    }
    if (typeof data.urutan !== 'undefined') data.urutan = Number(data.urutan);
    if (typeof data.durasiMenit !== 'undefined' && data.durasiMenit !== null) {
      data.durasiMenit = Number(data.durasiMenit);
    }
    if (typeof data.isPublished === 'string') {
      data.isPublished = data.isPublished === 'true';
    }

    const updated = await prisma.materi.update({ where: { id }, data });
    return successResponse(res, 'Materi berhasil diperbarui', updated);
  } catch (err) {
    return next(err);
  }
}

async function togglePublish(req, res, next) {
  try {
    const { id } = req.params;
    const materi = await prisma.materi.findUnique({ where: { id } });
    if (!materi) return errorResponse(res, 'Materi tidak ditemukan', 404);

    const guruId = await getGuruIdByUserId(req.user.id);
    if (materi.guruId !== guruId) {
      return errorResponse(res, 'Anda hanya bisa mengubah materi sendiri', 403);
    }

    const updated = await prisma.materi.update({
      where: { id },
      data: { isPublished: !materi.isPublished },
    });
    return successResponse(
      res,
      `Materi berhasil ${updated.isPublished ? 'dipublikasikan' : 'di-unpublish'}`,
      updated,
    );
  } catch (err) {
    return next(err);
  }
}

async function updateUrutan(req, res, next) {
  try {
    const { id } = req.params;
    const { urutan } = req.body || {};
    if (urutan == null) return errorResponse(res, 'urutan wajib diisi', 400);

    const materi = await prisma.materi.findUnique({ where: { id } });
    if (!materi) return errorResponse(res, 'Materi tidak ditemukan', 404);
    const guruId = await getGuruIdByUserId(req.user.id);
    if (materi.guruId !== guruId) {
      return errorResponse(res, 'Anda hanya bisa mengubah materi sendiri', 403);
    }
    const updated = await prisma.materi.update({
      where: { id },
      data: { urutan: Number(urutan) },
    });
    return successResponse(res, 'Urutan materi diperbarui', updated);
  } catch (err) {
    return next(err);
  }
}

async function deleteMateri(req, res, next) {
  try {
    const { id } = req.params;
    const materi = await prisma.materi.findUnique({ where: { id } });
    if (!materi) return errorResponse(res, 'Materi tidak ditemukan', 404);

    if (req.user.role === 'GURU') {
      const guruId = await getGuruIdByUserId(req.user.id);
      if (materi.guruId !== guruId) {
        return errorResponse(res, 'Anda hanya bisa menghapus materi sendiri', 403);
      }
    }

    if (materi.fileUrl && materi.fileUrl.startsWith('/uploads/')) {
      const abs = path.join(ROOT, materi.fileUrl.replace(/^\//, ''));
      fs.promises.unlink(abs).catch(() => {});
    }

    await prisma.materi.delete({ where: { id } });
    return successResponse(res, 'Materi berhasil dihapus');
  } catch (err) {
    return next(err);
  }
}

async function trackProgress(req, res, next) {
  try {
    const { id } = req.params;
    const { selesai } = req.body || {};
    const siswaId = await getSiswaIdByUserId(req.user.id);
    if (!siswaId) return errorResponse(res, 'Profil siswa tidak ditemukan', 403);

    const materi = await prisma.materi.findUnique({ where: { id } });
    if (!materi) return errorResponse(res, 'Materi tidak ditemukan', 404);
    const ok = await siswaTerdaftarDiKelas(siswaId, materi.kelasId);
    if (!ok) return errorResponse(res, 'Anda tidak terdaftar di kelas ini', 403);

    const result = await prisma.materiProgress.upsert({
      where: { materiId_siswaId: { materiId: id, siswaId } },
      update: {
        selesai: typeof selesai === 'boolean' ? selesai : undefined,
        lastAccess: new Date(),
      },
      create: {
        materiId: id,
        siswaId,
        selesai: !!selesai,
      },
    });
    return successResponse(res, 'Progress materi diperbarui', result);
  } catch (err) {
    return next(err);
  }
}

async function progressPerKelas(req, res, next) {
  try {
    const { kelasId } = req.params;
    const siswaId = await getSiswaIdByUserId(req.user.id);
    if (!siswaId) return errorResponse(res, 'Profil siswa tidak ditemukan', 403);

    const ok = await siswaTerdaftarDiKelas(siswaId, kelasId);
    if (!ok) return errorResponse(res, 'Anda tidak terdaftar di kelas ini', 403);

    const materis = await prisma.materi.findMany({
      where: { kelasId, isPublished: true },
      orderBy: { urutan: 'asc' },
      include: {
        progress: {
          where: { siswaId },
          select: { selesai: true, lastAccess: true },
        },
      },
    });

    const data = materis.map((m) => ({
      id: m.id,
      judul: m.judul,
      tipe: m.tipe,
      urutan: m.urutan,
      selesai: m.progress[0]?.selesai || false,
      lastAccess: m.progress[0]?.lastAccess || null,
    }));
    const total = data.length;
    const done = data.filter((d) => d.selesai).length;
    return successResponse(res, 'Progress materi per kelas', {
      total,
      selesai: done,
      persentase: total > 0 ? Math.round((done / total) * 100) : 0,
      items: data,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listMateri,
  getMateri,
  createMateri,
  updateMateri,
  togglePublish,
  updateUrutan,
  deleteMateri,
  trackProgress,
  progressPerKelas,
};
