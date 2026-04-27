const express = require('express');
const ctrl = require('../controllers/materiController');
const { authorize } = require('../middlewares/roleMiddleware');
const { uploadMateri } = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.get('/', ctrl.listMateri);
router.post('/', authorize('GURU'), uploadMateri, ctrl.createMateri);

router.get('/progress/kelas/:kelasId', authorize('SISWA'), ctrl.progressPerKelas);

router.get('/:id', ctrl.getMateri);
router.put('/:id', authorize('GURU'), ctrl.updateMateri);
router.put('/:id/publish', authorize('GURU'), ctrl.togglePublish);
router.put('/:id/urutan', authorize('GURU'), ctrl.updateUrutan);
router.delete('/:id', authorize('GURU', 'ADMIN'), ctrl.deleteMateri);

router.post('/:id/progress', authorize('SISWA'), ctrl.trackProgress);

module.exports = router;
