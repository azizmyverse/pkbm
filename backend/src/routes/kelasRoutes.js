const express = require('express');
const ctrl = require('../controllers/kelasController');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', ctrl.listKelas);
router.post('/', authorize('ADMIN'), ctrl.createKelas);
router.get('/:id', ctrl.getKelas);
router.put('/:id', authorize('ADMIN'), ctrl.updateKelas);
router.delete('/:id', authorize('ADMIN'), ctrl.deleteKelas);

router.get('/:id/anggota', authorize('ADMIN', 'GURU'), ctrl.listAnggota);
router.post('/:id/anggota', authorize('ADMIN'), ctrl.addAnggota);
router.delete('/:id/anggota/:siswaId', authorize('ADMIN'), ctrl.removeAnggota);

module.exports = router;
