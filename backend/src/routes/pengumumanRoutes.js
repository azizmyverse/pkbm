const express = require('express');
const ctrl = require('../controllers/pengumumanController');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', ctrl.listPengumuman);
router.post('/', authorize('ADMIN', 'GURU'), ctrl.createPengumuman);
router.get('/:id', ctrl.getPengumuman);
router.put('/:id', authorize('ADMIN', 'GURU'), ctrl.updatePengumuman);
router.put('/:id/publish', authorize('ADMIN', 'GURU'), ctrl.togglePublish);
router.delete('/:id', authorize('ADMIN'), ctrl.deletePengumuman);

module.exports = router;
