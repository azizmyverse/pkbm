const prisma = require('../lib/prisma');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const notifService = require('../services/notifikasiService');

async function listMine(req, res, next) {
  try {
    const items = await prisma.notifikasi.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return successResponse(res, 'Daftar notifikasi', items);
  } catch (err) {
    return next(err);
  }
}

async function unreadCount(req, res, next) {
  try {
    const count = await notifService.getUnreadCount(req.user.id);
    return successResponse(res, 'Jumlah notifikasi belum dibaca', { count });
  } catch (err) {
    return next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await notifService.markAsRead(id, req.user.id);
    return successResponse(res, 'Notifikasi ditandai dibaca', updated);
  } catch (err) {
    return next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    const r = await notifService.markAllAsRead(req.user.id);
    return successResponse(res, 'Semua notifikasi ditandai dibaca', { count: r.count });
  } catch (err) {
    return next(err);
  }
}

async function removeOne(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.notifikasi.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!exist) return errorResponse(res, 'Notifikasi tidak ditemukan', 404);
    await prisma.notifikasi.delete({ where: { id } });
    return successResponse(res, 'Notifikasi berhasil dihapus');
  } catch (err) {
    return next(err);
  }
}

module.exports = { listMine, unreadCount, markRead, markAllRead, removeOne };
