const prisma = require('../lib/prisma');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require('../utils/responseHelper');

function parsePagination(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
  return { page, limit, skip: (page - 1) * limit };
}

async function listMataPelajaran(req, res, next) {
  try {
    const { paketId, search } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {};
    if (paketId) where.paketId = paketId;
    if (search) {
      where.OR = [
        { nama: { contains: String(search), mode: 'insensitive' } },
        { kode: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.mataPelajaran.findMany({
        where,
        include: { paket: { select: { id: true, nama: true, level: true } } },
        orderBy: [{ paketId: 'asc' }, { nama: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.mataPelajaran.count({ where }),
    ]);

    return paginatedResponse(res, 'Daftar mata pelajaran', items, page, limit, total);
  } catch (err) {
    return next(err);
  }
}

async function getMataPelajaran(req, res, next) {
  try {
    const { id } = req.params;
    const data = await prisma.mataPelajaran.findUnique({
      where: { id },
      include: { paket: { select: { id: true, nama: true, level: true } } },
    });
    if (!data) return errorResponse(res, 'Mata pelajaran tidak ditemukan', 404);
    return successResponse(res, 'Detail mata pelajaran', data);
  } catch (err) {
    return next(err);
  }
}

async function createMataPelajaran(req, res, next) {
  try {
    const { nama, kode, deskripsi, icon, paketId } = req.body || {};
    if (!nama || !kode || !paketId) {
      return errorResponse(res, 'nama, kode, dan paketId wajib diisi', 400);
    }
    const created = await prisma.mataPelajaran.create({
      data: {
        nama,
        kode,
        deskripsi: deskripsi || '',
        icon: icon || '📚',
        paketId,
      },
      include: { paket: { select: { id: true, nama: true, level: true } } },
    });
    return successResponse(res, 'Mata pelajaran dibuat', created, 201);
  } catch (err) {
    return next(err);
  }
}

async function updateMataPelajaran(req, res, next) {
  try {
    const { id } = req.params;
    const { nama, kode, deskripsi, icon, paketId } = req.body || {};

    const existing = await prisma.mataPelajaran.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, 'Mata pelajaran tidak ditemukan', 404);

    const data = {};
    if (typeof nama !== 'undefined') data.nama = nama;
    if (typeof kode !== 'undefined') data.kode = kode;
    if (typeof deskripsi !== 'undefined') data.deskripsi = deskripsi;
    if (typeof icon !== 'undefined') data.icon = icon;
    if (typeof paketId !== 'undefined') data.paketId = paketId;

    const updated = await prisma.mataPelajaran.update({
      where: { id },
      data,
      include: { paket: { select: { id: true, nama: true, level: true } } },
    });
    return successResponse(res, 'Mata pelajaran diperbarui', updated);
  } catch (err) {
    return next(err);
  }
}

async function deleteMataPelajaran(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.mataPelajaran.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, 'Mata pelajaran tidak ditemukan', 404);

    await prisma.mataPelajaran.delete({ where: { id } });
    return successResponse(res, 'Mata pelajaran dihapus', { id });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listMataPelajaran,
  getMataPelajaran,
  createMataPelajaran,
  updateMataPelajaran,
  deleteMataPelajaran,
};
