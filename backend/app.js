const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

const apiRouter = require('./src/routes');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

// Trust proxy (untuk rate-limit di belakang reverse proxy / docker)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS — hanya allow FRONTEND_URL (dengan credentials)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);

// Body parser
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiter global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan, coba lagi nanti',
    data: null,
  },
});
app.use('/api/', globalLimiter);

// Static uploads
const UPLOAD_PATH = path.resolve(process.env.UPLOAD_PATH || './uploads');
app.use('/uploads', express.static(UPLOAD_PATH));

// API routes
app.use('/api/v1', apiRouter);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route tidak ditemukan: ${req.method} ${req.originalUrl}`,
    data: null,
  });
});

// Global error handler — terakhir
app.use(errorHandler);

module.exports = app;
