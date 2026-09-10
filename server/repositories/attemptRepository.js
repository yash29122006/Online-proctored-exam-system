const fs = require('fs');
const path = require('path');

const questionsPath = path.join(__dirname, '../../data/questions.json');
const seedAttemptsPath = path.join(__dirname, '../../data/seed-attempts.json');

class AttemptRepository {
  constructor() {
    this.questions = [];
    this.attempts = [];
    this.loadData();
  }

  loadData() {
    try {
      this.questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    } catch (e) {
      console.error('Failed to load questions.json', e);
      this.questions = [];
    }
    this.resetAttempts();
  }

  resetAttempts() {
    try {
      this.attempts = JSON.parse(fs.readFileSync(seedAttemptsPath, 'utf8'));
    } catch (e) {
      this.attempts = [];
    }
  }

  getQuestions() {
    return this.questions;
  }

  getAllAttempts() {
    return this.attempts;
  }

  getAttemptById(id) {
    return this.attempts.find(a => a.id === id);
  }

  saveAttempt(attempt) {
    this.attempts.unshift(attempt);
    return attempt;
  }
}

module.exports = new AttemptRepository();
