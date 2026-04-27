const express = require('express');
const ctrl = require('../controllers/notifikasiController');

const router = express.Router();

router.get('/', ctrl.listMine);
router.get('/unread-count', ctrl.unreadCount);
router.put('/read-all', ctrl.markAllRead);
router.put('/:id/read', ctrl.markRead);
router.delete('/:id', ctrl.removeOne);

module.exports = router;
