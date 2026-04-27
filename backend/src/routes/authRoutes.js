const express = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login, coba lagi nanti',
    data: null,
  },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, ctrl.login);
router.post('/refresh-token', ctrl.refreshToken);
router.post('/logout', ctrl.logout);
router.post('/forgot-password', otpLimiter, ctrl.forgotPassword);
router.post('/reset-password', otpLimiter, ctrl.resetPassword);
router.get('/me', verifyToken, ctrl.me);

module.exports = router;
