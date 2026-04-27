const prisma = require('../lib/prisma');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { sendOTPEmail } = require('../services/emailService');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
  path: '/',
};

function tokenPayloadFromUser(user) {
  return { id: user.id, role: user.role, email: user.email };
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return errorResponse(res, 'Email dan kata sandi wajib diisi', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse(res, 'Email atau kata sandi salah', 401);
    }
    if (!user.isActive) {
      return errorResponse(res, 'Akun dinonaktifkan, hubungi administrator', 403);
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      return errorResponse(res, 'Email atau kata sandi salah', 401);
    }

    const accessToken = generateAccessToken(tokenPayloadFromUser(user));
    const refreshToken = generateRefreshToken({ id: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
    return successResponse(res, 'Login berhasil', {
      user: publicUser(user),
      accessToken,
    });
  } catch (err) {
    return next(err);
  }
}

async function refreshToken(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (!token) {
      return errorResponse(res, 'Refresh token tidak ditemukan', 401);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (_err) {
      return errorResponse(res, 'Refresh token tidak valid atau kadaluarsa', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.refreshToken !== token || !user.isActive) {
      return errorResponse(res, 'Refresh token tidak cocok', 401);
    }

    const accessToken = generateAccessToken(tokenPayloadFromUser(user));
    return successResponse(res, 'Token diperbarui', { accessToken });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        await prisma.user.update({
          where: { id: decoded.id },
          data: { refreshToken: null },
        });
      } catch (_err) {
        // token invalid, abaikan
      }
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { ...REFRESH_COOKIE_OPTIONS, maxAge: undefined });
    return successResponse(res, 'Logout berhasil');
  } catch (err) {
    return next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return errorResponse(res, 'Email wajib diisi', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 menit
      await prisma.user.update({
        where: { id: user.id },
        data: { resetOTP: otp, resetOTPExpiry: expiry },
      });
      try {
        await sendOTPEmail(user.email, user.name, otp);
      } catch (_err) {
        // Jangan reveal kegagalan email
      }
    }

    return successResponse(
      res,
      'Jika email terdaftar, kode OTP akan dikirim ke email tersebut',
    );
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) {
      return errorResponse(res, 'Email, OTP, dan kata sandi baru wajib diisi', 400);
    }
    if (newPassword.length < 8) {
      return errorResponse(res, 'Kata sandi minimal 8 karakter', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetOTP || !user.resetOTPExpiry) {
      return errorResponse(res, 'OTP tidak valid', 400);
    }
    if (user.resetOTP !== otp) {
      return errorResponse(res, 'OTP tidak valid', 400);
    }
    if (user.resetOTPExpiry < new Date()) {
      return errorResponse(res, 'OTP sudah kadaluarsa', 400);
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetOTP: null, resetOTPExpiry: null },
    });

    return successResponse(res, 'Kata sandi berhasil direset, silakan login');
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        guru: {
          select: { id: true, nip: true, spesialisasi: true },
        },
        siswa: {
          select: {
            id: true,
            nisn: true,
            tahunMasuk: true,
            status: true,
            paket: { select: { id: true, level: true, nama: true } },
          },
        },
      },
    });
    if (!user) return errorResponse(res, 'User tidak ditemukan', 404);
    return successResponse(res, 'Profil pengguna', user);
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, refreshToken, logout, forgotPassword, resetPassword, me };
