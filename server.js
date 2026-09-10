const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load static questions and seed attempts
const questionsPath = path.join(__dirname, 'data', 'questions.json');
const seedAttemptsPath = path.join(__dirname, 'data', 'seed-attempts.json');

let questions = [];
try {
  questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
} catch (e) {
  console.error('Failed to load questions.json', e);
}

let attempts = [];
function resetAttempts() {
  try {
    attempts = JSON.parse(fs.readFileSync(seedAttemptsPath, 'utf8'));
  } catch (e) {
    attempts = [];
  }
}
resetAttempts();

// 1. Get Exam Questions (Client view without answer leak)
app.get('/api/exam', (req, res) => {
  const sanitizedQuestions = questions.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options
  }));
  res.json({
    title: 'CS402: Advanced AI & Systems Architecture Exam',
    durationMinutes: 10,
    thresholdLimit: 60,
    totalQuestions: questions.length,
    questions: sanitizedQuestions
  });
});

// 2. Submit Attempt (Normal or Terminated)
app.post('/api/attempts', (req, res) => {
  const {
    studentName,
    studentId,
    answers = {},
    events = [],
    riskScore = 0,
    status = 'COMPLETED',
    timeElapsedSeconds = 0
  } = req.body;

  // Grade answers
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

  // Calculate plagiarism / similarity indicator based on clipboard/events
  const clipboardEvents = events.filter(e => e.category === 'Clipboard' || e.type.includes('Paste') || e.type.includes('Copy'));
  let plagiarismScore = Math.min(95, Math.round(5 + (clipboardEvents.length * 28) + (riskScore > 40 ? 25 : 0)));
  if (events.length === 0 && riskScore === 0) {
    plagiarismScore = Math.floor(Math.random() * 4) + 1; // 1-4% nominal
  }

  const now = new Date();
  const attemptId = 'att-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);

  const attempt = {
    id: attemptId,
    studentName: studentName || 'Demo Candidate',
    studentId: studentId || 'STU-' + Math.floor(1000 + Math.random() * 9000),
    examTitle: 'CS402: Advanced AI & Systems Architecture Exam',
    timestamp: now.toISOString(),
    formattedTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    score,
    totalQuestions: questions.length,
    riskScore: Number(riskScore),
    status: status === 'TERMINATED' || riskScore >= 60 ? 'TERMINATED' : 'COMPLETED',
    plagiarismScore,
    timeElapsedSeconds,
    events,
    gradedQuestions
  };

  attempts.unshift(attempt); // newest first
  res.status(201).json({ success: true, attempt });
});

// 3. Faculty: List All Attempts
app.get('/api/attempts', (req, res) => {
  const summaryList = attempts.map(a => ({
    id: a.id,
    studentName: a.studentName,
    studentId: a.studentId,
    score: a.score,
    totalQuestions: a.totalQuestions,
    riskScore: a.riskScore,
    status: a.status,
    eventCount: a.events ? a.events.length : 0,
    timestamp: a.timestamp || a.startTime || new Date().toISOString(),
    plagiarismScore: a.plagiarismScore || 0
  }));
  res.json({ attempts: summaryList });
});

// 4. Faculty: View Single Attempt Details & Timeline
app.get('/api/attempts/:id', (req, res) => {
  const attempt = attempts.find(a => a.id === req.params.id);
  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }
  res.json({ attempt });
});

// 5. Reset Demo Data
app.post('/api/reset-demo', (req, res) => {
  resetAttempts();
  res.json({ success: true, message: 'Demo attempts reset to clean seed state.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`================================================`);
  console.log(`🚀 AI Proctoring Hackathon Demo Server Running!`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`================================================`);
});
