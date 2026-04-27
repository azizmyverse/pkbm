const express = require('express');
const ctrl = require('../controllers/tugasController');
const { authorize } = require('../middlewares/roleMiddleware');
const { uploadTugas } = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.get('/', ctrl.listTugas);
router.post('/', authorize('GURU'), ctrl.createTugas);
router.get('/:id', ctrl.getTugas);
router.put('/:id', authorize('GURU'), ctrl.updateTugas);
router.delete('/:id', authorize('GURU', 'ADMIN'), ctrl.deleteTugas);

router.post('/:id/kumpulkan', authorize('SISWA'), uploadTugas, ctrl.kumpulkanTugas);
router.put('/:id/nilai/:siswaId', authorize('GURU'), ctrl.inputNilai);
router.get('/:id/pengumpulan', authorize('GURU', 'ADMIN'), ctrl.listPengumpulan);

module.exports = router;
