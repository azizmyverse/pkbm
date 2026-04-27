const prisma = require('../lib/prisma');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');
const notifService = require('../services/notifikasiService');
const { sendTugasDinilaiEmail } = require('../services/emailService');

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

async function listTugas(req, res, next) {
  try {
    const { kelasId, isAktif } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const where = {};
    if (kelasId) where.kelasId = kelasId;
    if (typeof isAktif !== 'undefined') where.isAktif = isAktif === 'true';

    if (req.user.role === 'GURU') {
      const guruId = await getGuruIdByUserId(req.user.id);
      where.guruId = guruId || '__none__';
    } else if (req.user.role === 'SISWA') {
      const siswaId = await getSiswaIdByUserId(req.user.id);
      where.kelas = siswaId
        ? { kelasAnggota: { some: { siswaId } } }
        : { kelasAnggota: { some: { siswaId: '__none__' } } };
    }

    const [items, total] = await Promise.all([
      prisma.tugas.findMany({
        where,
        include: {
          kelas: { select: { id: true, nama: true, kode: true } },
          _count: { select: { pengumpulan: true } },
        },
        orderBy: { deadline: 'asc' },
        skip,
        take: limit,
      }),
      prisma.tugas.count({ where }),
    ]);

    let withStatus = items;
    if (req.user.role === 'SISWA') {
      const siswaId = await getSiswaIdByUserId(req.user.id);
      const tugasIds = items.map((t) => t.id);
      const subs = await prisma.pengumpulan.findMany({
        where: { tugasId: { in: tugasIds }, siswaId: siswaId || '__none__' },
        select: { tugasId: true, submittedAt: true, nilaiAkhir: true, gradedAt: true },
      });
      const map = Object.fromEntries(subs.map((s) => [s.tugasId, s]));
      withStatus = items.map((t) => ({
        ...t,
        myPengumpulan: map[t.id] || null,
      }));
    }

    return paginatedResponse(res, 'Daftar tugas', withStatus, page, limit, total);
  } catch (err) {
    return next(err);
  }
}

async function getTugas(req, res, next) {
  try {
    const tugas = await prisma.tugas.findUnique({
      where: { id: req.params.id },
      include: {
        kelas: { select: { id: true, nama: true, kode: true, guruId: true } },
        guru: { select: { id: true, user: { select: { id: true, name: true } } } },
      },
    });
    if (!tugas) return errorResponse(res, 'Tugas tidak ditemukan', 404);

    if (req.user.role === 'GURU' || req.user.role === 'ADMIN') {
      const pengumpulan = await prisma.pengumpulan.findMany({
        where: { tugasId: tugas.id },
        include: {
          siswa: {
            select: {
              id: true,
              nisn: true,
              user: { select: { id: true, name: true, email: true, avatar: true } },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });
      return successResponse(res, 'Detail tugas', { ...tugas, pengumpulan });
    }

    if (req.user.role === 'SISWA') {
      const siswaId = await getSiswaIdByUserId(req.user.id);
      const ok = await siswaTerdaftarDiKelas(siswaId, tugas.kelasId);
      if (!ok) return errorResponse(res, 'Anda tidak terdaftar di kelas ini', 403);
      const myPengumpulan = await prisma.pengumpulan.findUnique({
        where: { tugasId_siswaId: { tugasId: tugas.id, siswaId } },
      });
      return successResponse(res, 'Detail tugas', { ...tugas, myPengumpulan });
    }
    return successResponse(res, 'Detail tugas', tugas);
  } catch (err) {
    return next(err);
  }
}

async function createTugas(req, res, next) {
  try {
    const { judul, deskripsi, kelasId, deadline, nilaiMaksimum, isAktif, fileUrl } =
      req.body || {};
    if (!judul || !deskripsi || !kelasId || !deadline) {
      return errorResponse(res, 'judul, deskripsi, kelasId, deadline wajib diisi', 400);
    }
    const guruId = await getGuruIdByUserId(req.user.id);
    if (!guruId) return errorResponse(res, 'Profil guru tidak ditemukan', 403);

    const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });
    if (!kelas) return errorResponse(res, 'Kelas tidak ditemukan', 404);
    if (kelas.guruId !== guruId) {
      return errorResponse(res, 'Anda tidak mengajar di kelas ini', 403);
    }

    const created = await prisma.tugas.create({
      data: {
        judul,
        deskripsi,
        kelasId,
        guruId,
        deadline: new Date(deadline),
        nilaiMaksimum: nilaiMaksimum != null ? Number(nilaiMaksimum) : 100,
        isAktif: typeof isAktif === 'boolean' ? isAktif : true,
        fileUrl: fileUrl || null,
      },
    });

    // Notifikasi ke semua anggota kelas
    const anggota = await prisma.kelasAnggota.findMany({
      where: { kelasId },
      include: { siswa: { select: { userId: true } } },
    });
    const userIds = anggota.map((a) => a.siswa.userId);
    if (userIds.length > 0) {
      await notifService.createNotifBulk(
        userIds,
        'Tugas Baru',
        `Tugas baru "${judul}" telah dipublikasikan.`,
        'TUGAS',
        `/siswa/tugas/${created.id}`,
      );
    }

    return successResponse(res, 'Tugas berhasil dibuat', created, 201);
  } catch (err) {
    return next(err);
  }
}

async function updateTugas(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.tugas.findUnique({ where: { id } });
    if (!exist) return errorResponse(res, 'Tugas tidak ditemukan', 404);

    const guruId = await getGuruIdByUserId(req.user.id);
    if (exist.guruId !== guruId) {
      return errorResponse(res, 'Anda hanya bisa mengubah tugas sendiri', 403);
    }

    const data = {};
    const allowed = ['judul', 'deskripsi', 'deadline', 'nilaiMaksimum', 'isAktif', 'fileUrl'];
    for (const k of allowed) {
      if (typeof req.body?.[k] !== 'undefined') data[k] = req.body[k];
    }
    if (typeof data.deadline !== 'undefined') data.deadline = new Date(data.deadline);
    if (typeof data.nilaiMaksimum !== 'undefined') data.nilaiMaksimum = Number(data.nilaiMaksimum);
    if (typeof data.isAktif === 'string') data.isAktif = data.isAktif === 'true';

    const updated = await prisma.tugas.update({ where: { id }, data });
    return successResponse(res, 'Tugas berhasil diperbarui', updated);
  } catch (err) {
    return next(err);
  }
}

async function deleteTugas(req, res, next) {
  try {
    const { id } = req.params;
    const exist = await prisma.tugas.findUnique({ where: { id } });
    if (!exist) return errorResponse(res, 'Tugas tidak ditemukan', 404);

    if (req.user.role === 'GURU') {
      const guruId = await getGuruIdByUserId(req.user.id);
      if (exist.guruId !== guruId) {
        return errorResponse(res, 'Anda hanya bisa menghapus tugas sendiri', 403);
      }
    }
    await prisma.tugas.delete({ where: { id } });
    return successResponse(res, 'Tugas berhasil dihapus');
  } catch (err) {
    return next(err);
  }
}

async function kumpulkanTugas(req, res, next) {
  try {
    const { id } = req.params;
    const { catatan, linkUrl } = req.body || {};

    const tugas = await prisma.tugas.findUnique({
      where: { id },
      include: { guru: { select: { userId: true } }, kelas: { select: { id: true, nama: true } } },
    });
    if (!tugas) return errorResponse(res, 'Tugas tidak ditemukan', 404);
    if (!tugas.isAktif) return errorResponse(res, 'Tugas tidak aktif', 400);
    if (new Date() > new Date(tugas.deadline)) {
      return errorResponse(res, 'Deadline tugas sudah lewat', 400);
    }

    const siswaId = await getSiswaIdByUserId(req.user.id);
    if (!siswaId) return errorResponse(res, 'Profil siswa tidak ditemukan', 403);

    const ok = await siswaTerdaftarDiKelas(siswaId, tugas.kelasId);
    if (!ok) return errorResponse(res, 'Anda tidak terdaftar di kelas ini', 403);

    const fileUrl = req.file ? `/uploads/tugas/${req.file.filename}` : null;
    if (!fileUrl && !linkUrl) {
      return errorResponse(res, 'File atau linkUrl wajib disertakan', 400);
    }

    const result = await prisma.pengumpulan.upsert({
      where: { tugasId_siswaId: { tugasId: id, siswaId } },
      update: {
        fileUrl: fileUrl || undefined,
        linkUrl: linkUrl || undefined,
        catatan: catatan || null,
        submittedAt: new Date(),
        nilaiAkhir: null,
        feedback: null,
        gradedAt: null,
      },
      create: {
        tugasId: id,
        siswaId,
        fileUrl,
        linkUrl: linkUrl || null,
        catatan: catatan || null,
      },
    });

    // Notifikasi ke guru
    await notifService.createNotif(
      tugas.guru.userId,
      'Pengumpulan Tugas Baru',
      `${req.user.email} mengumpulkan tugas "${tugas.judul}"`,
      'TUGAS',
      `/guru/tugas/${tugas.id}`,
    );

    return successResponse(res, 'Tugas berhasil dikumpulkan', result, 201);
  } catch (err) {
    return next(err);
  }
}

function getBobotFromPengaturan(pengaturan, key, defaultVal) {
  const item = pengaturan.find((p) => p.key === key);
  if (!item) return defaultVal;
  const n = parseFloat(item.value);
  return Number.isFinite(n) ? n : defaultVal;
}

async function inputNilai(req, res, next) {
  try {
    const { id, siswaId } = req.params;
    const { nilai, feedback } = req.body || {};
    if (nilai == null) return errorResponse(res, 'nilai wajib diisi', 400);

    const tugas = await prisma.tugas.findUnique({
      where: { id },
      include: { kelas: { select: { id: true, paketId: true, tahunAjaran: true, semester: true } } },
    });
    if (!tugas) return errorResponse(res, 'Tugas tidak ditemukan', 404);

    const guruId = await getGuruIdByUserId(req.user.id);
    if (tugas.guruId !== guruId) {
      return errorResponse(res, 'Anda hanya bisa menilai tugas sendiri', 403);
    }

    const nilaiNum = Number(nilai);
    if (!Number.isFinite(nilaiNum) || nilaiNum < 0 || nilaiNum > tugas.nilaiMaksimum) {
      return errorResponse(
        res,
        `Nilai harus antara 0 dan ${tugas.nilaiMaksimum}`,
        400,
      );
    }

    const pengumpulan = await prisma.pengumpulan.update({
      where: { tugasId_siswaId: { tugasId: id, siswaId } },
      data: {
        nilaiAkhir: nilaiNum,
        feedback: feedback || null,
        gradedAt: new Date(),
      },
      include: {
        siswa: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    // Notifikasi siswa
    await notifService.createNotif(
      pengumpulan.siswa.user.id,
      'Tugas Anda Telah Dinilai',
      `Tugas "${tugas.judul}" telah dinilai dengan nilai ${nilaiNum}.`,
      'NILAI',
      `/siswa/tugas/${tugas.id}`,
    );
    sendTugasDinilaiEmail(
      pengumpulan.siswa.user.email,
      pengumpulan.siswa.user.name,
      tugas.judul,
      nilaiNum,
    ).catch(() => {});

    return successResponse(res, 'Nilai berhasil diinput', pengumpulan);
  } catch (err) {
    return next(err);
  }
}

async function listPengumpulan(req, res, next) {
  try {
    const { id } = req.params;
    const tugas = await prisma.tugas.findUnique({ where: { id } });
    if (!tugas) return errorResponse(res, 'Tugas tidak ditemukan', 404);

    if (req.user.role === 'GURU') {
      const guruId = await getGuruIdByUserId(req.user.id);
      if (tugas.guruId !== guruId) {
        return errorResponse(res, 'Anda tidak mengajar tugas ini', 403);
      }
    }
    const items = await prisma.pengumpulan.findMany({
      where: { tugasId: id },
      include: {
        siswa: {
          select: {
            id: true,
            nisn: true,
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
    return successResponse(res, 'Daftar pengumpulan', items);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listTugas,
  getTugas,
  createTugas,
  updateTugas,
  deleteTugas,
  kumpulkanTugas,
  inputNilai,
  listPengumpulan,
  getBobotFromPengaturan,
};
