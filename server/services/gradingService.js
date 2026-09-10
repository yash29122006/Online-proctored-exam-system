const repository = require('../repositories/attemptRepository');

class GradingService {
  gradeAttempt(submissionData) {
    const {
      studentName,
      studentId,
      answers = {},
      events = [],
      riskScore = 0,
      status = 'COMPLETED',
      timeElapsedSeconds = 0
    } = submissionData;

    const questions = repository.getQuestions();
    let score = 0;

    const gradedQuestions = questions.map(q => {
      const studentAnswerIndex = answers[q.id];
      const isCorrect = studentAnswerIndex !== undefined && studentAnswerIndex === q.correctIndex;
      if (isCorrect) score += 1;
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        studentAnswer: studentAnswerIndex !== undefined ? q.options[studentAnswerIndex] : 'Unanswered',
        correctAnswer: q.options[q.correctIndex],
        isCorrect,
        explanation: q.explanation
      };
    });

    // Compute estimated similarity / plagiarism based on clipboard and anomalies
    const clipboardEvents = events.filter(e => e.category === 'Clipboard' || e.type.includes('Paste') || e.type.includes('Copy'));
    let plagiarismScore = Math.min(95, Math.round(5 + (clipboardEvents.length * 28) + (riskScore > 40 ? 25 : 0)));
    if (events.length === 0 && riskScore === 0) {
      plagiarismScore = Math.floor(Math.random() * 4) + 1;
    }

    const now = new Date();
    const attemptId = 'att-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);

    const isTerminated = status === 'TERMINATED' || Number(riskScore) >= 60;

    const attempt = {
      id: attemptId,
      studentName: studentName || 'Marcus Vance',
      studentId: studentId || 'ENG-9042',
      examTitle: 'CS402: Distributed Systems Final',
      timestamp: now.toISOString(),
      formattedTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      score,
      totalQuestions: questions.length,
      riskScore: Number(riskScore),
      status: isTerminated ? 'TERMINATED' : 'COMPLETED',
      plagiarismScore,
      timeElapsedSeconds,
      events,
      gradedQuestions
    };

    return repository.saveAttempt(attempt);
  }
}

module.exports = new GradingService();
