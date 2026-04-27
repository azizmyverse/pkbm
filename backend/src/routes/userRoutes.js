const express = require('express');
const ctrl = require('../controllers/userController');
const { authorize } = require('../middlewares/roleMiddleware');
const { uploadAvatar } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// "me" routes (semua role)
router.put('/me/profile', ctrl.updateMyProfile);
router.post('/me/avatar', uploadAvatar, ctrl.uploadMyAvatar);
router.put('/me/password', ctrl.changeMyPassword);

// Admin-only
router.get('/', authorize('ADMIN'), ctrl.listUsers);
router.post('/', authorize('ADMIN'), ctrl.createUser);
router.get('/:id', authorize('ADMIN'), ctrl.getUser);
router.put('/:id', authorize('ADMIN'), ctrl.updateUser);
router.put('/:id/toggle-active', authorize('ADMIN'), ctrl.toggleActive);
router.delete('/:id', authorize('ADMIN'), ctrl.softDelete);

module.exports = router;
