const prisma = require('../lib/prisma');

async function createNotif(userId, judul, pesan, tipe, link = null) {
  return prisma.notifikasi.create({
    data: { userId, judul, pesan, tipe, link },
  });
}

async function createNotifBulk(userIds, judul, pesan, tipe, link = null) {
  if (!Array.isArray(userIds) || userIds.length === 0) return { count: 0 };
  const data = userIds.map((userId) => ({ userId, judul, pesan, tipe, link }));
  return prisma.notifikasi.createMany({ data });
}

async function markAsRead(notifId, userId) {
  // Pastikan hanya pemilik yang bisa update
  const notif = await prisma.notifikasi.findFirst({
    where: { id: notifId, userId },
  });
  if (!notif) {
    const err = new Error('Notifikasi tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
  return prisma.notifikasi.update({
    where: { id: notifId },
    data: { isRead: true, readAt: new Date() },
  });
}

async function markAllAsRead(userId) {
  return prisma.notifikasi.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

async function getUnreadCount(userId) {
  return prisma.notifikasi.count({ where: { userId, isRead: false } });
}

module.exports = {
  createNotif,
  createNotifBulk,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
