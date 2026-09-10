const repository = require('../repositories/attemptRepository');
const gradingService = require('../services/gradingService');

class ExamController {
  getQuestions(req, res) {
    try {
      const questions = repository.getQuestions();
      // Mask correct answers for student client
      const safeQuestions = questions.map(({ correctIndex, explanation, ...rest }) => rest);
      res.json({
        success: true,
        examTitle: 'CS402: Distributed Systems Final Examination',
        durationMinutes: 45,
        totalQuestions: safeQuestions.length,
        questions: safeQuestions
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  submitAttempt(req, res) {
    try {
      const savedAttempt = gradingService.gradeAttempt(req.body);
      res.json({
        success: true,
        attempt: savedAttempt
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  getAllAttempts(req, res) {
    try {
      const attempts = repository.getAllAttempts();
      res.json({
        success: true,
        totalAttempts: attempts.length,
        attempts
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  getAttemptById(req, res) {
    try {
      const attempt = repository.getAttemptById(req.params.id);
      if (!attempt) {
        return res.status(404).json({ success: false, message: 'Attempt not found' });
      }
      res.json({
        success: true,
        attempt
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  resetDemo(req, res) {
    try {
      repository.resetAttempts();
      res.json({
        success: true,
        message: 'Demo attempts reset to pristine benchmark seeds',
        attempts: repository.getAllAttempts()
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ExamController();
