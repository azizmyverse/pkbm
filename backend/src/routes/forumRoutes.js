const express = require('express');
const ctrl = require('../controllers/forumController');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/kelas/:kelasId', ctrl.listByKelas);
router.post('/kelas/:kelasId', ctrl.createThread);

// Reply routes — taruh sebelum '/:id' supaya tidak bentrok
router.post('/:id/reply', ctrl.createReply);
router.put('/reply/:id', ctrl.updateReply);
router.delete('/reply/:id', authorize('ADMIN', 'GURU'), ctrl.deleteReply);
router.put('/reply/:id/best-answer', authorize('GURU'), ctrl.markBestAnswer);

router.get('/:id', ctrl.getThread);
router.put('/:id', ctrl.updateThread);
router.delete('/:id', authorize('ADMIN', 'GURU'), ctrl.deleteThread);
router.put('/:id/pin', authorize('ADMIN', 'GURU'), ctrl.togglePin);

module.exports = router;
