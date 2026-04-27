const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const kelasRoutes = require('./kelasRoutes');
const materiRoutes = require('./materiRoutes');
const tugasRoutes = require('./tugasRoutes');
const presensiRoutes = require('./presensiRoutes');
const nilaiRoutes = require('./nilaiRoutes');
const pengumumanRoutes = require('./pengumumanRoutes');
const forumRoutes = require('./forumRoutes');
const notifikasiRoutes = require('./notifikasiRoutes');
const pengaturanRoutes = require('./pengaturanRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'OK',
    data: { service: 'pkbm-mugi-sae-backend', uptime: process.uptime() },
  });
});

router.use('/auth', authRoutes);
router.use('/users', verifyToken, userRoutes);
router.use('/kelas', verifyToken, kelasRoutes);
router.use('/materi', verifyToken, materiRoutes);
router.use('/tugas', verifyToken, tugasRoutes);
router.use('/presensi', verifyToken, presensiRoutes);
router.use('/nilai', verifyToken, nilaiRoutes);
router.use('/pengumuman', verifyToken, pengumumanRoutes);
router.use('/forum', verifyToken, forumRoutes);
router.use('/notifikasi', verifyToken, notifikasiRoutes);
router.use('/pengaturan', verifyToken, pengaturanRoutes);
router.use('/dashboard', verifyToken, dashboardRoutes);

module.exports = router;
