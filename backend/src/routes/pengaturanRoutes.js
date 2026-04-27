const express = require('express');
const ctrl = require('../controllers/pengaturanController');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', ctrl.listPengaturan);
router.put('/', authorize('ADMIN'), ctrl.bulkUpdate);
router.get('/:key', ctrl.getOne);

module.exports = router;
