const prisma = require('../lib/prisma');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');
const { sendWelcomeEmail } = require('../services/emailService');

const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  phone: true,
  address: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100;
  return { page, limit, skip: (page - 1) * limit };
}

async function listUsers(req, res, next) {
  try {
    const { role, search, isActive } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {};
    if (role) where.role = role;
    if (typeof isActive !== 'undefined') where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_PUBLIC_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(res, 'Daftar pengguna', items, page, limit, total);
  } catch (err) {
    return next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        ...USER_PUBLIC_SELECT,
        guru: { select: { id: true, nip: true, spesialisasi: true } },
        siswa: {
          select: {
            id: true,
            nisn: true,
            tahunMasuk: true,
            status: true,
            paketId: true,
            paket: { select: { id: true, level: true, nama: true } },
          },
        },
      },
    });
    if (!user) return errorResponse(res, 'Pengguna tidak ditemukan', 404);
    return successResponse(res, 'Detail pengguna', user);
  } catch (err) {
    return next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      address,
      // Guru
      nip,
      spesialisasi,
      // Siswa
      nisn,
      paketId,
      tahunMasuk,
      status,
    } = req.body || {};

    if (!name || !email || !password || !role) {
      return errorResponse(res, 'name, email, password, dan role wajib diisi', 400);
    }
    if (!['ADMIN', 'GURU', 'SISWA'].includes(role)) {
      return errorResponse(res, 'Role tidak valid', 400);
    }
    if (password.length < 8) {
      return errorResponse(res, 'Kata sandi minimal 8 karakter', 400);
    }
    if (role === 'SISWA' && (!paketId || !tahunMasuk)) {
      return errorResponse(res, 'paketId dan tahunMasuk wajib untuk siswa', 400);
    }

    const hashed = await hashPassword(password);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashed,
          role,
          phone: phone || null,
          address: address || null,
        },
        select: USER_PUBLIC_SELECT,
      });

      if (role === 'GURU') {
        await tx.guru.create({
          data: {
            userId: user.id,
            nip: nip || null,
            spesialisasi: spesialisasi || null,
          },
        });
      } else if (role === 'SISWA') {
        await tx.siswa.create({
          data: {
            userId: user.id,
            nisn: nisn || null,
            paketId,
            tahunMasuk: Number(tahunMasuk),
            status: status || 'AKTIF',
          },
        });
      }

      return user;
    });

    try {
      await sendWelcomeEmail(created.email, created.name, created.role);
    } catch (_err) {
      // jangan gagalkan create
    }

    return successResponse(res, 'Pengguna berhasil dibuat', created, 201);
  } catch (err) {
    return next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, phone, address, role, isActive } = req.body || {};

    const exist = await prisma.user.findUnique({ where: { id } });
    if (!exist) return errorResponse(res, 'Pengguna tidak ditemukan', 404);

    const data = {};
    if (typeof name !== 'undefined') data.name = name;
    if (typeof email !== 'undefined') data.email = email;
    if (typeof phone !== 'undefined') data.phone = phone;
    if (typeof address !== 'undefined') data.address = address;
    if (typeof role !== 'undefined') data.role = role;
    if (typeof isActive !== 'undefined') data.isActive = !!isActive;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: USER_PUBLIC_SELECT,
    });
    return successResponse(res, 'Pengguna berhasil diperbarui', updated);
  } catch (err) {
    return next(err);
  }
}

async function toggleActive(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.user.findUnique({ where: { id } });
    if (!exist) return errorResponse(res, 'Pengguna tidak ditemukan', 404);
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !exist.isActive },
      select: USER_PUBLIC_SELECT,
    });
    return successResponse(
      res,
      `Akun berhasil ${updated.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      updated,
    );
  } catch (err) {
    return next(err);
  }
}

async function softDelete(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.user.findUnique({ where: { id } });
    if (!exist) return errorResponse(res, 'Pengguna tidak ditemukan', 404);
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false, refreshToken: null },
      select: USER_PUBLIC_SELECT,
    });
    return successResponse(res, 'Pengguna berhasil dinonaktifkan', updated);
  } catch (err) {
    return next(err);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const { name, phone, address } = req.body || {};
    const data = {};
    if (typeof name !== 'undefined') data.name = name;
    if (typeof phone !== 'undefined') data.phone = phone;
    if (typeof address !== 'undefined') data.address = address;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: USER_PUBLIC_SELECT,
    });
    return successResponse(res, 'Profil berhasil diperbarui', updated);
  } catch (err) {
    return next(err);
  }
}

async function uploadMyAvatar(req, res, next) {
  try {
    if (!req.file) return errorResponse(res, 'File avatar wajib diunggah', 400);
    const relPath = `/uploads/avatars/${req.file.filename}`;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: relPath },
      select: USER_PUBLIC_SELECT,
    });
    return successResponse(res, 'Avatar berhasil diunggah', updated);
  } catch (err) {
    return next(err);
  }
}

async function changeMyPassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return errorResponse(res, 'Kata sandi lama dan baru wajib diisi', 400);
    }
    if (newPassword.length < 8) {
      return errorResponse(res, 'Kata sandi baru minimal 8 karakter', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return errorResponse(res, 'Pengguna tidak ditemukan', 404);

    const ok = await comparePassword(oldPassword, user.password);
    if (!ok) return errorResponse(res, 'Kata sandi lama tidak cocok', 400);

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, refreshToken: null },
    });
    return successResponse(res, 'Kata sandi berhasil diubah, silakan login ulang');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  toggleActive,
  softDelete,
  updateMyProfile,
  uploadMyAvatar,
  changeMyPassword,
};
