const prisma = require('../lib/prisma');
const { successResponse, errorResponse } = require('../utils/responseHelper');

async function listPaket(_req, res, next) {
  try {
    const data = await prisma.paket.findMany({
      orderBy: { level: 'asc' },
      include: { _count: { select: { mataPelajaran: true, siswa: true, kelas: true } } },
    });
    return successResponse(res, 'Daftar paket', data);
  } catch (err) {
    return next(err);
  }
}

async function getPaket(req, res, next) {
  try {
    const { id } = req.params;
    const data = await prisma.paket.findUnique({
      where: { id },
      include: { mataPelajaran: { orderBy: { nama: 'asc' } } },
    });
    if (!data) return errorResponse(res, 'Paket tidak ditemukan', 404);
    return successResponse(res, 'Detail paket', data);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listPaket, getPaket };
