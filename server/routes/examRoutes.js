const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

router.get('/exam', examController.getQuestions.bind(examController));
router.get('/attempts', examController.getAllAttempts.bind(examController));
router.get('/attempts/:id', examController.getAttemptById.bind(examController));
router.post('/attempts', examController.submitAttempt.bind(examController));
router.post('/reset-demo', examController.resetDemo.bind(examController));

module.exports = router;
