const express = require('express');
const ctrl = require('../controllers/dashboardController');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/admin', authorize('ADMIN'), ctrl.adminDashboard);
router.get('/guru', authorize('GURU'), ctrl.guruDashboard);
router.get('/siswa', authorize('SISWA'), ctrl.siswaDashboard);

module.exports = router;
