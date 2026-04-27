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

async function getSiswaPaketLevel(userId) {
  const s = await prisma.siswa.findUnique({
    where: { userId },
    include: { paket: true },
  });
  return s?.paket?.level || null;
}

async function listPengumuman(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const allowedTargets = ['ALL', req.user.role];

    if (req.user.role === 'SISWA') {
      const lvl = await getSiswaPaketLevel(req.user.id);
      if (lvl) allowedTargets.push(lvl); // PAKET_A | PAKET_B | PAKET_C
    }

    const where = {
      isPublished: true,
      target: { in: allowedTargets },
    };
    if (req.user.role === 'ADMIN') {
      // Admin lihat semua
      delete where.isPublished;
      delete where.target;
    }

    const [items, total] = await Promise.all([
      prisma.pengumuman.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, role: true, avatar: true } },
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.pengumuman.count({ where }),
    ]);
    return paginatedResponse(res, 'Daftar pengumuman', items, page, limit, total);
  } catch (err) {
    return next(err);
  }
}

async function getPengumuman(req, res, next) {
  try {
    const { id } = req.params;
    const pengumuman = await prisma.pengumuman.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, role: true, avatar: true } },
      },
    });
    if (!pengumuman) return errorResponse(res, 'Pengumuman tidak ditemukan', 404);

    if (req.user.role !== 'ADMIN' && !pengumuman.isPublished) {
      return errorResponse(res, 'Pengumuman belum dipublikasikan', 403);
    }

    await prisma.pengumuman
      .update({ where: { id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});
    return successResponse(res, 'Detail pengumuman', pengumuman);
  } catch (err) {
    return next(err);
  }
}

async function createPengumuman(req, res, next) {
  try {
    const { judul, konten, target, isPublished } = req.body || {};
    if (!judul || !konten) {
      return errorResponse(res, 'judul dan konten wajib diisi', 400);
    }
    const isPub = isPublished === true || isPublished === 'true';
    const created = await prisma.pengumuman.create({
      data: {
        judul,
        konten,
        target: target || 'ALL',
        authorId: req.user.id,
        isPublished: isPub,
        publishedAt: isPub ? new Date() : null,
      },
    });
    return successResponse(res, 'Pengumuman berhasil dibuat', created, 201);
  } catch (err) {
    return next(err);
  }
}

async function updatePengumuman(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.pengumuman.findUnique({ where: { id } });
    if (!exist) return errorResponse(res, 'Pengumuman tidak ditemukan', 404);

    if (req.user.role !== 'ADMIN' && exist.authorId !== req.user.id) {
      return errorResponse(res, 'Anda hanya bisa mengubah pengumuman sendiri', 403);
    }

    const data = {};
    const allowed = ['judul', 'konten', 'target'];
    for (const k of allowed) {
      if (typeof req.body?.[k] !== 'undefined') data[k] = req.body[k];
    }
    const updated = await prisma.pengumuman.update({ where: { id }, data });
    return successResponse(res, 'Pengumuman berhasil diperbarui', updated);
  } catch (err) {
    return next(err);
  }
}

async function togglePublish(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.pengumuman.findUnique({ where: { id } });
    if (!exist) return errorResponse(res, 'Pengumuman tidak ditemukan', 404);

    if (req.user.role !== 'ADMIN' && exist.authorId !== req.user.id) {
      return errorResponse(res, 'Akses ditolak', 403);
    }
    const newPub = !exist.isPublished;
    const updated = await prisma.pengumuman.update({
      where: { id },
      data: {
        isPublished: newPub,
        publishedAt: newPub ? new Date() : null,
      },
    });
    return successResponse(
      res,
      `Pengumuman berhasil ${newPub ? 'dipublikasikan' : 'di-unpublish'}`,
      updated,
    );
  } catch (err) {
    return next(err);
  }
}

async function deletePengumuman(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.pengumuman.findUnique({ where: { id } });
    if (!exist) return errorResponse(res, 'Pengumuman tidak ditemukan', 404);
    await prisma.pengumuman.delete({ where: { id } });
    return successResponse(res, 'Pengumuman berhasil dihapus');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listPengumuman,
  getPengumuman,
  createPengumuman,
  updatePengumuman,
  togglePublish,
  deletePengumuman,
};
