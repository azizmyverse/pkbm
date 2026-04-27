/* eslint-disable no-console, no-unused-vars */
const multer = require('multer');
const { Prisma } = require('@prisma/client');

function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[ErrorHandler]', err);
  }

  // Prisma known request error
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Data sudah ada (duplikat)',
        data: null,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
        data: null,
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Relasi tidak ditemukan',
        data: null,
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Kesalahan database',
      data: null,
    });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Validasi data gagal',
      data: null,
    });
  }

  // JWT
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token kadaluarsa',
      data: null,
    });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid',
      data: null,
    });
  }

  // Multer
  if (err instanceof multer.MulterError) {
    let msg = 'Upload file gagal';
    if (err.code === 'LIMIT_FILE_SIZE') msg = 'Ukuran file melebihi batas maksimum';
    if (err.code === 'LIMIT_UNEXPECTED_FILE') msg = 'Field file tidak diharapkan';
    return res.status(400).json({ success: false, message: msg, data: null });
  }
  if (err.message === 'Tipe file tidak diizinkan') {
    return res.status(400).json({ success: false, message: err.message, data: null });
  }

  // JSON parse error
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Body JSON tidak valid',
      data: null,
    });
  }

  // Custom thrown error dengan statusCode
  if (err.statusCode && Number.isInteger(err.statusCode)) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Terjadi kesalahan',
      data: null,
    });
  }

  // Default
  const payload = {
    success: false,
    message: 'Terjadi kesalahan server',
    data: null,
  };
  if (process.env.NODE_ENV !== 'production') {
    payload.error = err.message;
    payload.stack = err.stack;
  }
  return res.status(500).json(payload);
}

module.exports = errorHandler;
