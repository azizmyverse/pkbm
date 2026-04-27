const express = require('express');
const ctrl = require('../controllers/nilaiController');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/kelas/:kelasId', authorize('ADMIN', 'GURU'), ctrl.listByKelas);
router.get('/siswa/:siswaId', authorize('ADMIN', 'GURU', 'SISWA'), ctrl.listBySiswa);
router.put('/update', authorize('GURU'), ctrl.upsertNilai);
router.post('/bulk', authorize('GURU'), ctrl.bulkInput);
router.get('/rapor/:siswaId', authorize('ADMIN', 'GURU', 'SISWA'), ctrl.rapor);

module.exports = router;
