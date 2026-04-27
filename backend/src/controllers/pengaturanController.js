const prisma = require('../lib/prisma');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const PUBLIC_KEYS = [
  'nama_pkbm',
  'alamat',
  'telepon',
  'email',
  'tahun_ajaran',
  'semester_aktif',
  'logo_url',
  'min_kehadiran',
];

async function listPengaturan(req, res, next) {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { key: { in: PUBLIC_KEYS } };
    const items = await prisma.pengaturan.findMany({
      where,
      orderBy: { key: 'asc' },
    });
    return successResponse(res, 'Daftar pengaturan', items);
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { key } = req.params;
    if (req.user.role !== 'ADMIN' && !PUBLIC_KEYS.includes(key)) {
      return errorResponse(res, 'Akses ditolak', 403);
    }
    const item = await prisma.pengaturan.findUnique({ where: { key } });
    if (!item) return errorResponse(res, 'Pengaturan tidak ditemukan', 404);
    return successResponse(res, 'Detail pengaturan', item);
  } catch (err) {
    return next(err);
  }
}

async function bulkUpdate(req, res, next) {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 'Body harus array {key, value}[]', 400);
    }

    const results = [];
    for (const it of items) {
      if (!it || !it.key) continue;
      const r = await prisma.pengaturan.upsert({
        where: { key: it.key },
        update: { value: String(it.value), keterangan: it.keterangan ?? undefined },
        create: {
          key: it.key,
          value: String(it.value ?? ''),
          keterangan: it.keterangan || null,
        },
      });
      results.push(r);
    }
    return successResponse(res, 'Pengaturan diperbarui', results);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listPengaturan, getOne, bulkUpdate };
