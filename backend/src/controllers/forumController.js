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

async function ensureKelasAccess(req, kelasId) {
  if (req.user.role === 'ADMIN') return true;
  if (req.user.role === 'GURU') {
    const guruId = await getGuruIdByUserId(req.user.id);
    const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });
    return kelas && kelas.guruId === guruId;
  }
  if (req.user.role === 'SISWA') {
    const siswaId = await getSiswaIdByUserId(req.user.id);
    if (!siswaId) return false;
    const a = await prisma.kelasAnggota.findUnique({
      where: { kelasId_siswaId: { kelasId, siswaId } },
    });
    return !!a;
  }
  return false;
}

async function listByKelas(req, res, next) {
  try {
    const { kelasId } = req.params;
    const ok = await ensureKelasAccess(req, kelasId);
    if (!ok) return errorResponse(res, 'Anda tidak memiliki akses ke kelas ini', 403);

    const items = await prisma.forum.findMany({
      where: { kelasId },
      include: {
        author: { select: { id: true, name: true, role: true, avatar: true } },
        _count: { select: { replies: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
    return successResponse(res, 'Daftar thread forum', items);
  } catch (err) {
    return next(err);
  }
}

async function getThread(req, res, next) {
  try {
    const { id } = req.params;
    const thread = await prisma.forum.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, role: true, avatar: true } },
        kelas: { select: { id: true, nama: true, kode: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true, role: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!thread) return errorResponse(res, 'Thread tidak ditemukan', 404);

    const ok = await ensureKelasAccess(req, thread.kelasId);
    if (!ok) return errorResponse(res, 'Akses ditolak', 403);

    await prisma.forum
      .update({ where: { id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});
    return successResponse(res, 'Detail thread', thread);
  } catch (err) {
    return next(err);
  }
}

async function createThread(req, res, next) {
  try {
    const { kelasId } = req.params;
    const { judul, konten } = req.body || {};
    if (!judul || !konten) return errorResponse(res, 'judul dan konten wajib diisi', 400);

    const ok = await ensureKelasAccess(req, kelasId);
    if (!ok) return errorResponse(res, 'Akses ditolak', 403);

    const created = await prisma.forum.create({
      data: { judul, konten, kelasId, authorId: req.user.id },
    });
    return successResponse(res, 'Thread berhasil dibuat', created, 201);
  } catch (err) {
    return next(err);
  }
}

async function updateThread(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.forum.findUnique({ where: { id } });
    if (!exist) return errorResponse(res, 'Thread tidak ditemukan', 404);

    if (exist.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Anda hanya bisa mengubah thread sendiri', 403);
    }
    const data = {};
    if (typeof req.body?.judul !== 'undefined') data.judul = req.body.judul;
    if (typeof req.body?.konten !== 'undefined') data.konten = req.body.konten;
    const updated = await prisma.forum.update({ where: { id }, data });
    return successResponse(res, 'Thread berhasil diperbarui', updated);
  } catch (err) {
    return next(err);
  }
}

async function deleteThread(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.forum.findUnique({ where: { id } });
    if (!exist) return errorResponse(res, 'Thread tidak ditemukan', 404);
    await prisma.forum.delete({ where: { id } });
    return successResponse(res, 'Thread berhasil dihapus');
  } catch (err) {
    return next(err);
  }
}

async function togglePin(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.forum.findUnique({ where: { id } });
    if (!exist) return errorResponse(res, 'Thread tidak ditemukan', 404);
    const updated = await prisma.forum.update({
      where: { id },
      data: { isPinned: !exist.isPinned },
    });
    return successResponse(
      res,
      `Thread berhasil ${updated.isPinned ? 'di-pin' : 'di-unpin'}`,
      updated,
    );
  } catch (err) {
    return next(err);
  }
}

async function createReply(req, res, next) {
  try {
    const { id } = req.params;
    const { konten } = req.body || {};
    if (!konten) return errorResponse(res, 'konten wajib diisi', 400);

    const thread = await prisma.forum.findUnique({ where: { id } });
    if (!thread) return errorResponse(res, 'Thread tidak ditemukan', 404);
    const ok = await ensureKelasAccess(req, thread.kelasId);
    if (!ok) return errorResponse(res, 'Akses ditolak', 403);

    const reply = await prisma.forumReply.create({
      data: { forumId: id, authorId: req.user.id, konten },
    });
    return successResponse(res, 'Reply berhasil dibuat', reply, 201);
  } catch (err) {
    return next(err);
  }
}

async function updateReply(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.forumReply.findUnique({ where: { id } });
    if (!exist) return errorResponse(res, 'Reply tidak ditemukan', 404);
    if (exist.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Anda hanya bisa mengubah reply sendiri', 403);
    }
    const data = {};
    if (typeof req.body?.konten !== 'undefined') data.konten = req.body.konten;
    const updated = await prisma.forumReply.update({ where: { id }, data });
    return successResponse(res, 'Reply berhasil diperbarui', updated);
  } catch (err) {
    return next(err);
  }
}

async function deleteReply(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.forumReply.findUnique({ where: { id } });
    if (!exist) return errorResponse(res, 'Reply tidak ditemukan', 404);
    await prisma.forumReply.delete({ where: { id } });
    return successResponse(res, 'Reply berhasil dihapus');
  } catch (err) {
    return next(err);
  }
}

async function markBestAnswer(req, res, next) {
  try {
    const { id } = req.params;
    const reply = await prisma.forumReply.findUnique({
      where: { id },
      include: { forum: { select: { id: true, kelasId: true } } },
    });
    if (!reply) return errorResponse(res, 'Reply tidak ditemukan', 404);

    const guruId = await getGuruIdByUserId(req.user.id);
    const kelas = await prisma.kelas.findUnique({ where: { id: reply.forum.kelasId } });
    if (!kelas || kelas.guruId !== guruId) {
      return errorResponse(res, 'Anda tidak mengajar kelas thread ini', 403);
    }

    // Reset best-answer lain di thread yang sama
    await prisma.$transaction([
      prisma.forumReply.updateMany({
        where: { forumId: reply.forumId },
        data: { isBestAnswer: false },
      }),
      prisma.forumReply.update({
        where: { id },
        data: { isBestAnswer: true },
      }),
    ]);
    return successResponse(res, 'Reply ditandai sebagai best answer');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listByKelas,
  getThread,
  createThread,
  updateThread,
  deleteThread,
  togglePin,
  createReply,
  updateReply,
  deleteReply,
  markBestAnswer,
};
