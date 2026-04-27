const express = require('express');
const router = express.Router();
const ctl = require('../controllers/mataPelajaranController');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/', ctl.listMataPelajaran);
router.get('/:id', ctl.getMataPelajaran);
router.post('/', authorize('ADMIN'), ctl.createMataPelajaran);
router.put('/:id', authorize('ADMIN'), ctl.updateMataPelajaran);
router.delete('/:id', authorize('ADMIN'), ctl.deleteMataPelajaran);

module.exports = router;
