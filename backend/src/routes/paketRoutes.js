const express = require('express');
const router = express.Router();
const ctl = require('../controllers/paketController');

router.get('/', ctl.listPaket);
router.get('/:id', ctl.getPaket);

module.exports = router;
