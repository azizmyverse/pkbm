const express = require('express');
const ctrl = require('../controllers/presensiController');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', authorize('ADMIN'), ctrl.listAll);
router.get('/kelas/:kelasId', authorize('ADMIN', 'GURU'), ctrl.listByKelas);
router.get('/siswa/:siswaId', authorize('ADMIN', 'GURU', 'SISWA'), ctrl.listBySiswa);
router.get('/rekap/kelas/:kelasId', authorize('ADMIN', 'GURU'), ctrl.rekapKelas);

router.post('/kelas/:kelasId', authorize('GURU'), ctrl.inputBulk);
router.put('/:id', authorize('GURU'), ctrl.updateOne);
router.post('/lock/:kelasId', authorize('GURU'), ctrl.lockTanggal);

module.exports = router;
