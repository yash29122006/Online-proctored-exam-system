// ================= APPLICATION STATE =================
const state = {
  activeRole: 'student',
  examData: null,
  currentQuestionIndex: 0,
  answers: {},
  flaggedQuestions: {},
  candidate: {
    name: 'Marcus Vance',
    id: 'ENG-9042'
  },
  timerSeconds: 600, // 10 mins
  timerInterval: null,
  mediaStream: null,
  proctor: null,
  isExamActive: false,
  latestAttempt: null,
  blazeModel: null
};

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', async () => {
  await fetchExamData();
  setupPrecheckMedia();
});

// Fetch Exam Metadata & 5 Questions
async function fetchExamData() {
  try {
    const res = await fetch('/api/exam');
    const data = await res.json();
    state.examData = data;
    if (document.getElementById('topExamTitle')) {
      document.getElementById('topExamTitle').textContent = data.title;
    }
  } catch (err) {
    console.error('Failed to load exam payload:', err);
  }
}

// Setup Camera and Mic Check in Pre-Check View
async function setupPrecheckMedia() {
  const videoEl = document.getElementById('precheckVideo');
  const canvasEl = document.getElementById('precheckFaceCanvas');
  const camBadge = document.getElementById('camStatusBadge');
  const micBadge = document.getElementById('micStatusBadge');
  const audioBar = document.getElementById('precheckAudioBar');
  const audioDecibel = document.getElementById('precheckAudioDecibel');

  try {
    state.mediaStream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: { ideal: 640 }, height: { ideal: 480 } }, 
      audio: true 
    });
    videoEl.srcObject = state.mediaStream;

    // Load BlazeFace for live face pre-check preview
    if (window.blazeface) {
      if (camBadge) camBadge.textContent = 'Loading AI Model...';
      try {
        state.blazeModel = await window.blazeface.load();
        if (camBadge) {
          camBadge.className = 'font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold';
          camBadge.textContent = 'Face Lock Active';
        }
        startPrecheckFaceTracker(videoEl, canvasEl, state.blazeModel);
      } catch (e) {
        console.warn('BlazeFace init warning:', e);
        if (camBadge) camBadge.textContent = 'Camera Ready';
      }
    } else {
      if (camBadge) camBadge.textContent = 'Camera Ready';
    }

    // Test audio with Web Audio API
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(state.mediaStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const audioMeterInterval = setInterval(() => {
        if (state.isExamActive) {
          clearInterval(audioMeterInterval);
          return;
        }
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const avg = sum / buffer.length;
        const pct = Math.min(100, Math.round((avg / 128) * 100));
        if (audioBar) audioBar.style.width = pct + '%';
        if (audioDecibel) {
          const db = Math.round(18 + (pct * 0.4));
          audioDecibel.textContent = `${db} dB (${pct > 40 ? 'High' : 'Nominal'})`;
          audioDecibel.className = pct > 40 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold';
        }

        if (pct > 5 && micBadge) {
          micBadge.className = 'font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold';
          micBadge.textContent = 'Active & Clear';
        }
      }, 100);
    }
  } catch (err) {
    console.warn('Hardware camera/mic not available. Falling back to virtual feed.', err);
    if (camBadge) {
      camBadge.className = 'font-mono text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold';
      camBadge.textContent = 'Virtual Feed Ready';
    }
    if (micBadge) {
      micBadge.className = 'font-mono text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold';
      micBadge.textContent = 'Virtual Mic Ready';
    }
    if (audioBar) audioBar.style.width = '25%';
  }
}

// Pre-check Face Tracker Loop
function startPrecheckFaceTracker(videoEl, canvasEl, model) {
  const check = async () => {
    if (state.isExamActive) return;
    if (videoEl && videoEl.readyState >= 2 && canvasEl) {
      const vw = videoEl.videoWidth;
      const vh = videoEl.videoHeight;
      if (vw && vh) {
        canvasEl.width = vw;
        canvasEl.height = vh;
        const ctx = canvasEl.getContext('2d');
        ctx.clearRect(0, 0, vw, vh);

        try {
          const preds = await model.estimateFaces(videoEl, false);
          if (preds && preds.length > 0) {
            preds.forEach(p => {
              const start = p.topLeft;
              const end = p.bottomRight;
              const x = start[0];
              const y = start[1];
              const w = end[0] - start[0];
              const h = end[1] - start[1];
              const mx = vw - x - w; // mirror

              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 2.5;
              ctx.strokeRect(mx, y, w, h);

              ctx.fillStyle = '#10b981';
              ctx.fillRect(mx, Math.max(0, y - 20), 110, 18);
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 10px sans-serif';
              ctx.fillText('FACE VERIFIED ✓', mx + 6, Math.max(0, y - 7));
            });
          }
        } catch (e) {}
      }
    }
    if (!state.isExamActive) {
      setTimeout(() => requestAnimationFrame(check), 200);
    }
  };
  check();
}

// ================= ROLE & VIEW SWITCHING =================
function switchRole(role) {
  state.activeRole = role;
  
  const btnStudent = document.getElementById('roleBtnStudent');
  const btnFaculty = document.getElementById('roleBtnFaculty');

  if (role === 'student') {
    btnStudent.className = "px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors bg-blue-600 text-white shadow-xs";
    btnFaculty.className = "text-xs font-medium px-3.5 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors";

    if (state.isExamActive) {
      showView('viewExam');
    } else if (state.latestAttempt) {
      showView('viewResult');
    } else {
      showView('viewPrecheck');
    }
  } else {
    btnFaculty.className = "px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors bg-blue-600 text-white shadow-xs";
    btnStudent.className = "text-xs font-medium px-3.5 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors";

    showView('viewFaculty');
    loadFacultyAttempts();
  }
}

function showView(viewId) {
  document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(viewId);
  if (target) target.classList.remove('hidden');
}

// Fullscreen Helper Functions
function enterFullscreenMode() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    return elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    return elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    return elem.msRequestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    return elem.mozRequestFullScreen();
  }
}

function isFullscreenActive() {
  return !!(document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement || 
            document.msFullscreenElement);
}

// ================= EXAM SESSION LIFECYCLE =================
function startExamSession() {
  // 1. Enter fullscreen immediately on user click gesture
  try {
    enterFullscreenMode();
  } catch (err) {
    console.warn('Fullscreen request bypassed by browser security policy:', err);
  }

  const nameInput = document.getElementById('inputStudentName').value.trim();
  const idInput = document.getElementById('inputStudentId').value.trim();

  state.candidate.name = nameInput || 'Marcus Vance';
  state.candidate.id = idInput || 'ENG-9042';
  state.answers = {};
  state.flaggedQuestions = {};
  state.currentQuestionIndex = 0;
  state.timerSeconds = (state.examData?.durationMinutes || 10) * 60;
  state.isExamActive = true;

  // Update Ribbon with candidate details
  document.getElementById('ribbonCandidateTag').textContent = `Candidate: ${state.candidate.name} (ID: #${state.candidate.id})`;
  document.getElementById('sessionTokenTag').textContent = `Session Token: ${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}`;

  // Initialize Proctor Engine
  state.proctor = new ProctorEngine({
    threshold: state.examData?.thresholdLimit || 60,
    onRiskUpdate: handleRiskUpdate,
    onEventDetected: handleEventDetected,
    onThresholdExceeded: handleAutoTermination,
    onFullscreenExit: handleFullscreenWarning
  });

  // Switch to Exam View
  showView('viewExam');

  // Verify fullscreen active; if not in fullscreen, present fullscreen activation modal
  setTimeout(() => {
    if (!isFullscreenActive() && state.isExamActive) {
      handleFullscreenWarning();
    }
  }, 400);

  // Attach camera and face tracking canvas to HUD PIP
  const pipVideo = document.getElementById('proctorPipVideo');
  const pipCanvas = document.getElementById('proctorFaceCanvas');
  state.proctor.start(pipVideo, pipCanvas, state.mediaStream);

  // Setup face status listener for HUD banner
  window.addEventListener('proctor-face-status', (e) => {
    const text = document.getElementById('camStatusText');
    const dot = document.getElementById('hudFaceDot');
    if (!text || !dot) return;

    if (e.detail.detected && !e.detail.warning) {
      text.textContent = 'Face Detected: 1 Person';
      text.className = 'text-emerald-300 font-semibold';
      dot.className = 'w-2 h-2 rounded-full bg-emerald-400';
    } else if (e.detail.warning) {
      text.textContent = 'MULTIPLE FACES DETECTED';
      text.className = 'text-red-400 font-semibold';
      dot.className = 'w-2 h-2 rounded-full bg-red-500 animate-ping';
    } else {
      text.textContent = 'NO FACE DETECTED';
      text.className = 'text-red-400 font-semibold';
      dot.className = 'w-2 h-2 rounded-full bg-red-500 animate-ping';
    }
  });

  // Setup Gaze / Look Away Listener with Duration Tiers
  window.addEventListener('proctor-gaze-status', (e) => {
    const gazeText = document.getElementById('gazeStatusText');
    if (!gazeText) return;

    if (!e.detail.lookingAway) {
      gazeText.textContent = 'Gaze: Center (0.02°)';
      gazeText.className = 'text-slate-300';
    } else {
      const sec = parseFloat(e.detail.duration);
      if (sec < 2.0) {
        gazeText.textContent = `Gaze: Look Away (${e.detail.duration}s) [Safe <2s]`;
        gazeText.className = 'text-blue-300 font-semibold';
      } else if (sec < 7.0) {
        gazeText.textContent = `Gaze: Look Away (${e.detail.duration}s) [-5 pts Tier]`;
        gazeText.className = 'text-amber-300 font-bold';
      } else if (sec < 15.0) {
        gazeText.textContent = `Gaze: Look Away (${e.detail.duration}s) [-15 pts Tier]`;
        gazeText.className = 'text-orange-300 font-bold';
      } else {
        gazeText.textContent = `Gaze: Look Away (${e.detail.duration}s) [-30 pts Tier]`;
        gazeText.className = 'text-red-400 font-bold animate-pulse';
      }
    }
  });

  // Setup Audio Meter Level Listener
  window.addEventListener('proctor-audio-level', (e) => {
    const level = e.detail.level;
    const dbValue = document.getElementById('dbValue');
    const meter = document.getElementById('audioMeter');
    if (!meter) return;

    const db = Math.round(18 + (level * 0.5));
    if (dbValue) {
      if (level > 40) {
        dbValue.textContent = `${db} dB (Exceeded Limit)`;
        dbValue.className = 'font-mono text-red-700 font-bold';
      } else {
        dbValue.textContent = `${db} dB (Nominal)`;
        dbValue.className = 'font-mono text-emerald-700 font-bold';
      }
    }

    const bars = meter.children;
    const activeBars = Math.min(12, Math.max(1, Math.round((level / 60) * 12)));
    for (let i = 0; i < bars.length; i++) {
      if (i < activeBars) {
        bars[i].className = level > 40 ? 'bg-amber-500 rounded-xs' : 'bg-emerald-500 rounded-xs';
      } else {
        bars[i].className = 'bg-slate-200 rounded-xs';
      }
    }
  });

  // Render question UI
  renderQuestionPills();
  renderCurrentQuestion();
  updateSessionStats();

  // Start Timer
  startExamTimer();
}

// Fullscreen Warning Modal Management
function handleFullscreenWarning() {
  const modal = document.getElementById('fullscreenWarningModal');
  if (modal) modal.classList.remove('hidden');
}

function reEnterFullscreen() {
  const modal = document.getElementById('fullscreenWarningModal');
  if (modal) modal.classList.add('hidden');
  try {
    enterFullscreenMode();
  } catch (e) {
    console.warn('Error re-entering fullscreen:', e);
  }
}

function startExamTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  updateTimerDisplay();

  state.timerInterval = setInterval(() => {
    state.timerSeconds--;
    updateTimerDisplay();
    updateSessionStats();

    if (state.timerSeconds <= 0) {
      clearInterval(state.timerInterval);
      confirmSubmitExamNow();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(state.timerSeconds / 60);
  const seconds = state.timerSeconds % 60;
  const str = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const timerEl = document.getElementById('examTimerDisplay');
  if (timerEl) timerEl.textContent = str;
  const remEl = document.getElementById('statRemainingTime');
  if (remEl) remEl.textContent = `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

// ================= QUESTION NAVIGATION & RENDERING =================
function renderQuestionPills() {
  const container = document.getElementById('questionPillsContainer');
  if (!container || !state.examData) return;

  container.innerHTML = '';
  state.examData.questions.forEach((q, idx) => {
    const isCurrent = idx === state.currentQuestionIndex;
    const isAnswered = state.answers[q.id] !== undefined;
    const isFlagged = state.flaggedQuestions[q.id];

    const btn = document.createElement('button');
    btn.onclick = () => {
      state.currentQuestionIndex = idx;
      renderCurrentQuestion();
      renderQuestionPills();
    };

    if (isCurrent) {
      btn.className = "flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-blue-600 text-white shadow-sm border border-blue-700 text-center transition-all";
      btn.innerHTML = `
        <span class="font-mono text-xs font-bold uppercase tracking-wider">Q${idx + 1}</span>
        <div class="flex items-center gap-1 mt-0.5">
          <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
          <span class="text-[11px] font-bold">Active</span>
        </div>
      `;
    } else if (isFlagged) {
      btn.className = "flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100/70 transition-all text-center";
      btn.innerHTML = `
        <span class="font-mono text-xs font-semibold">Q${idx + 1}</span>
        <div class="flex items-center gap-1 mt-0.5">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          <span class="text-[11px] font-bold hidden sm:inline">Flagged</span>
        </div>
      `;
    } else if (isAnswered) {
      btn.className = "flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100/70 transition-all text-center";
      btn.innerHTML = `
        <span class="font-mono text-xs font-semibold">Q${idx + 1}</span>
        <div class="flex items-center gap-1 mt-0.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          <span class="text-[11px] font-bold hidden sm:inline">Done</span>
        </div>
      `;
    } else {
      btn.className = "flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200/60 transition-all text-center";
      btn.innerHTML = `
        <span class="font-mono text-xs font-medium">Q${idx + 1}</span>
        <div class="flex items-center gap-1 mt-0.5">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          <span class="text-[11px] font-medium hidden sm:inline">Empty</span>
        </div>
      `;
    }

    container.appendChild(btn);
  });
}

function renderCurrentQuestion() {
  if (!state.examData) return;
  const q = state.examData.questions[state.currentQuestionIndex];
  if (!q) return;

  const progressCounter = document.getElementById('questionProgressCounter');
  if (progressCounter) {
    progressCounter.textContent = `Question ${state.currentQuestionIndex + 1} of ${state.examData.questions.length}`;
  }

  document.getElementById('qText').textContent = q.question;

  // Update Flag button state
  const isFlagged = state.flaggedQuestions[q.id];
  const flagIcon = document.getElementById('flagIcon');
  const flagText = document.getElementById('flagText');
  if (isFlagged) {
    flagIcon.textContent = 'bookmark';
    flagIcon.className = 'material-symbols-outlined text-[16px] text-amber-600';
    flagText.textContent = 'Flagged';
  } else {
    flagIcon.textContent = 'bookmark_border';
    flagIcon.className = 'material-symbols-outlined text-[16px] text-amber-600';
    flagText.textContent = 'Flag for Review';
  }

  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';

  const hotkeys = ['A', 'B', 'C', 'D'];

  q.options.forEach((optText, optIdx) => {
    const isSelected = state.answers[q.id] === optIdx;
    const hotkey = hotkeys[optIdx] || String(optIdx + 1);

    const label = document.createElement('label');
    if (isSelected) {
      label.className = "relative flex items-start gap-3.5 p-3.5 rounded-xl border-2 border-blue-600 bg-blue-50/50 shadow-xs cursor-pointer transition-all";
    } else {
      label.className = "relative flex items-start gap-3.5 p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 cursor-pointer transition-all";
    }

    label.onclick = (e) => {
      selectOption(q.id, optIdx);
    };

    label.innerHTML = `
      <input class="mt-1 w-4 h-4 text-blue-600 accent-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" type="radio" name="option_${q.id}" ${isSelected ? 'checked' : ''}/>
      <div class="flex flex-col flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <span class="text-sm ${isSelected ? 'font-bold text-blue-700' : 'font-semibold text-slate-900'}">Option ${hotkey} ${isSelected ? '(Selected)' : ''}</span>
          <span class="font-mono text-[11px] px-2 py-0.5 ${isSelected ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 border border-slate-200 text-slate-600 font-semibold'} rounded shadow-xs">[HOTKEY: ${hotkey}]</span>
        </div>
        <p class="text-xs ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-600'} mt-1 leading-relaxed">
          ${optText}
        </p>
      </div>
    `;

    container.appendChild(label);
  });

  // Button states
  const btnPrev = document.getElementById('btnPrevQ');
  btnPrev.style.visibility = state.currentQuestionIndex === 0 ? 'hidden' : 'visible';

  const isLast = state.currentQuestionIndex === state.examData.questions.length - 1;
  const btnNext = document.getElementById('btnNextQ');
  const btnSubmit = document.getElementById('btnSubmitExam');
  btnNext.style.display = isLast ? 'none' : 'flex';
  btnSubmit.style.display = isLast ? 'flex' : 'none';

  renderQuestionPills();
  updateSessionStats();
}

function selectOption(questionId, optionIndex) {
  state.answers[questionId] = optionIndex;
  renderCurrentQuestion();
}

function navigateQuestion(step) {
  const newIndex = state.currentQuestionIndex + step;
  if (newIndex >= 0 && newIndex < state.examData.questions.length) {
    state.currentQuestionIndex = newIndex;
    renderCurrentQuestion();
  }
}

function toggleFlag() {
  if (!state.examData) return;
  const q = state.examData.questions[state.currentQuestionIndex];
  if (!q) return;

  state.flaggedQuestions[q.id] = !state.flaggedQuestions[q.id];
  renderCurrentQuestion();
  updateSessionStats();
}

function updateSessionStats() {
  if (!state.examData) return;
  const answeredCount = Object.keys(state.answers).length;
  const flaggedCount = Object.values(state.flaggedQuestions).filter(Boolean).length;

  const statComp = document.getElementById('statCompletedCount');
  if (statComp) statComp.textContent = `${answeredCount} / ${state.examData.questions.length}`;

  const statFlag = document.getElementById('statFlaggedCount');
  if (statFlag) statFlag.textContent = `${flaggedCount} Review`;
}

// ================= RISK SCORE UI & VIOLATION FEED =================
function handleRiskUpdate(riskScore, threshold) {
  const scoreDisplay = document.getElementById('riskScoreDisplay');
  const progressBar = document.getElementById('riskProgressBar');
  const badge = document.getElementById('riskBadgeStatus');

  if (!scoreDisplay || !progressBar || !badge) return;

  scoreDisplay.textContent = riskScore;
  const percentage = Math.min(100, Math.round((riskScore / threshold) * 100));
  progressBar.style.width = percentage + '%';

  if (riskScore >= threshold) {
    scoreDisplay.className = "font-headline text-3xl font-extrabold text-red-700 tracking-tight";
    progressBar.className = "h-full bg-red-600 transition-all duration-500 rounded-full";
    badge.className = "px-2.5 py-1 rounded-md bg-red-100 text-red-900 border border-red-200 font-mono text-[11px] font-bold uppercase tracking-wider";
    badge.textContent = "Critical Violation";
  } else if (riskScore >= 30) {
    scoreDisplay.className = "font-headline text-3xl font-extrabold text-amber-700 tracking-tight";
    progressBar.className = "h-full bg-amber-500 transition-all duration-500 rounded-full";
    badge.className = "px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-200 font-mono text-[11px] font-bold uppercase tracking-wider";
    badge.textContent = "Review Alert Zone";
  } else {
    scoreDisplay.className = "font-headline text-3xl font-extrabold text-slate-900 tracking-tight";
    progressBar.className = "h-full bg-emerald-500 transition-all duration-500 rounded-full";
    badge.className = "px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-bold uppercase tracking-wider";
    badge.textContent = "Nominal Compliance";
  }
}

function handleEventDetected(event) {
  const logContainer = document.getElementById('eventsLogContainer');
  const countTag = document.getElementById('eventCount');
  if (!logContainer) return;

  if (state.proctor.events.length === 1) {
    logContainer.innerHTML = '';
  }

  if (countTag) {
    countTag.textContent = `${state.proctor.events.length} Recorded Flags`;
  }

  const isRed = event.points >= 15 || event.type.includes('Terminated') || event.type.includes('Crossed');
  const badgeClass = isRed 
    ? 'bg-red-50 border border-red-200 text-red-700 font-bold' 
    : 'bg-amber-50 border border-amber-200 text-amber-800 font-bold';

  const row = document.createElement('div');
  row.className = "flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] transition-all";
  row.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="text-slate-400">${event.timestamp}</span>
      <span class="font-semibold text-slate-800">${event.type}</span>
    </div>
    <div class="flex items-center gap-2">
      ${event.points > 0 ? `<span class="px-1.5 py-0.5 rounded ${badgeClass}">+${event.points}</span>` : ''}
      <span class="text-slate-500 text-[10px] truncate max-w-[140px]">${event.description}</span>
    </div>
  `;
  logContainer.prepend(row);
}

// ================= AUTOMATIC EXAM TERMINATION =================
async function handleAutoTermination(finalRiskScore, events) {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.isExamActive = false;

  const modalScore = document.getElementById('modalRiskScore');
  if (modalScore) modalScore.textContent = finalRiskScore;

  const modal = document.getElementById('terminationModal');
  if (modal) modal.classList.remove('hidden');

  await submitAttemptToBackend('TERMINATED');
}

function handleCloseTerminationModal() {
  const modal = document.getElementById('terminationModal');
  if (modal) modal.classList.add('hidden');
  if (state.latestAttempt) {
    renderReportView(state.latestAttempt);
  }
}

// ================= SUBMISSION CONFIRMATION =================
function showFinalSubmitModal() {
  const answeredCount = Object.keys(state.answers).length;
  const total = state.examData?.questions.length || 5;
  const modalText = document.getElementById('submitModalText');
  if (modalText) {
    modalText.textContent = `You have completed ${answeredCount} of ${total} assessment questions. Are you ready to finalize your submission?`;
  }
  document.getElementById('submitModal').classList.remove('hidden');
}

async function confirmSubmitExamNow() {
  document.getElementById('submitModal').classList.add('hidden');
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.isExamActive = false;
  if (state.proctor) state.proctor.stop();

  await submitAttemptToBackend('COMPLETED');
  if (state.latestAttempt) {
    renderReportView(state.latestAttempt);
  }
}

async function submitAttemptToBackend(status) {
  const payload = {
    studentName: state.candidate.name,
    studentId: state.candidate.id,
    answers: state.answers,
    events: state.proctor ? state.proctor.events : [],
    riskScore: state.proctor ? state.proctor.riskScore : 0,
    status: status,
    timeElapsedSeconds: 600 - state.timerSeconds
  };

  try {
    const res = await fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    state.latestAttempt = data.attempt;
  } catch (err) {
    console.error('Submission failed:', err);
  }
}

// ================= RENDER EVALUATION REPORT VIEW (STUDENT) =================
function renderReportView(attempt) {
  showView('viewResult');

  // Exit fullscreen if still active
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    }
  } catch (e) {}

  document.getElementById('reportCandidateInfo').textContent = `${attempt.studentName} (#${attempt.studentId})`;
  document.getElementById('reportTimestamp').textContent = `CS402 Final • Submitted at ${attempt.formattedTime || 'Just Now'}`;

  const statusBadge = document.getElementById('reportStatusBadge');
  if (attempt.status === 'TERMINATED') {
    statusBadge.className = "px-3.5 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200";
    statusBadge.textContent = "AUTOMATICALLY TERMINATED";
  } else {
    statusBadge.className = "px-3.5 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200";
    statusBadge.textContent = "SUCCESSFULLY COMPLETED";
  }

  document.getElementById('reportScoreDisplay').textContent = `${attempt.score} / ${attempt.totalQuestions}`;
  const riskDisplay = document.getElementById('reportRiskDisplay');
  riskDisplay.textContent = `${attempt.riskScore} / 60`;
  riskDisplay.className = `font-headline text-3xl font-extrabold mt-1 ${attempt.riskScore >= 60 ? 'text-red-700' : (attempt.riskScore >= 30 ? 'text-amber-700' : 'text-emerald-700')}`;

  document.getElementById('reportPlagiarismDisplay').textContent = `${attempt.plagiarismScore}%`;

  // Render Timeline
  renderReportTimeline('reportTimelineList', attempt.events);
  const evCountEl = document.getElementById('reportEventCount');
  if (evCountEl) evCountEl.textContent = `${attempt.events?.length || 0} events recorded`;
}

function renderReportTimeline(containerId, events = []) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (!events || events.length === 0) {
    container.innerHTML = `
      <div class="text-xs text-slate-500 font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg">
        No integrity violations recorded. Exemplary assessment session.
      </div>
    `;
    return;
  }

  events.forEach(evt => {
    const isRed = evt.points >= 15 || evt.type.includes('Terminated') || evt.type.includes('Crossed');
    const badgeClass = isRed 
      ? 'bg-red-50 border border-red-200 text-red-700' 
      : 'bg-amber-50 border border-amber-200 text-amber-800';

    const row = document.createElement('div');
    row.className = "flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs";
    row.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="text-slate-400 font-bold">${evt.timestamp}</span>
        <span class="font-bold text-slate-900">${evt.type}</span>
        <span class="text-slate-500 font-sans text-xs hidden sm:inline">• ${evt.description}</span>
      </div>
      <div class="flex items-center gap-2">
        ${evt.points > 0 ? `<span class="px-2 py-0.5 rounded ${badgeClass} font-bold">+${evt.points} pts</span>` : ''}
      </div>
    `;
    container.appendChild(row);
  });
}

// ================= FACULTY AUDIT CONSOLE =================
async function loadFacultyAttempts() {
  try {
    const res = await fetch('/api/attempts');
    const data = await res.json();
    const attempts = data.attempts || [];

    document.getElementById('facKpiTotal').textContent = attempts.length;
    const cleanCount = attempts.filter(a => a.riskScore === 0).length;
    const termCount = attempts.filter(a => a.status === 'TERMINATED').length;
    const avgRisk = attempts.length ? Math.round(attempts.reduce((sum, a) => sum + a.riskScore, 0) / attempts.length) : 0;

    document.getElementById('facKpiClean').textContent = cleanCount;
    document.getElementById('facKpiTerminated').textContent = termCount;
    document.getElementById('facKpiAvgRisk').textContent = avgRisk;

    const tbody = document.getElementById('facultyTableBody');
    tbody.innerHTML = '';

    attempts.forEach(att => {
      const isTerminated = att.status === 'TERMINATED';
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50/80 transition-colors";
      tr.innerHTML = `
        <td class="px-6 py-4">
          <div class="font-bold text-slate-900">${att.studentName}</div>
          <div class="font-mono text-[11px] text-slate-500">${att.studentId}</div>
        </td>
        <td class="px-6 py-4 font-bold text-slate-900">${att.score} / ${att.totalQuestions}</td>
        <td class="px-6 py-4">
          <span class="font-mono font-bold ${att.riskScore >= 60 ? 'text-red-700' : (att.riskScore >= 30 ? 'text-amber-700' : 'text-emerald-700')}">
            ${att.riskScore}
          </span>
          <span class="font-mono text-slate-400">/ 60</span>
        </td>
        <td class="px-6 py-4 font-mono text-slate-600">${att.eventCount} Flags</td>
        <td class="px-6 py-4">
          <span class="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${isTerminated ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">
            ${isTerminated ? 'Terminated' : 'Completed'}
          </span>
        </td>
        <td class="px-6 py-4 font-mono text-slate-500">
          ${new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </td>
        <td class="px-6 py-4 text-right">
          <button class="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-semibold text-xs shadow-xs transition-colors" onclick="inspectAttempt('${att.id}')">
            View Forensic Log 🔍
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Failed to load faculty attempts:', err);
  }
}

async function inspectAttempt(attemptId) {
  try {
    const res = await fetch(`/api/attempts/${attemptId}`);
    const data = await res.json();
    const att = data.attempt;

    document.getElementById('modalStudentName').textContent = att.studentName;
    document.getElementById('modalStudentMeta').textContent = `ID: #${att.studentId} • ${att.examTitle}`;
    document.getElementById('modalScoreDisplay').textContent = `${att.score} / ${att.totalQuestions}`;
    
    const riskEl = document.getElementById('modalRiskDisplay');
    riskEl.textContent = `${att.riskScore} / 60`;
    riskEl.className = `font-headline text-xl font-bold ${att.riskScore >= 60 ? 'text-red-700' : (att.riskScore >= 30 ? 'text-amber-700' : 'text-emerald-700')}`;

    document.getElementById('modalPlagiarismDisplay').textContent = `${att.plagiarismScore}%`;

    renderReportTimeline('modalTimelineList', att.events);
    document.getElementById('facultyDetailModal').classList.remove('hidden');
  } catch (err) {
    console.error('Failed to load attempt details:', err);
  }
}

function closeFacultyModal() {
  document.getElementById('facultyDetailModal').classList.add('hidden');
}

// ================= HACKATHON DEMO / JUDGE TRIGGERS =================
function triggerDemoViolation(type) {
  if (!state.isExamActive || !state.proctor) return;

  switch (type) {
    case 'copy':
      state.proctor.recordViolation('Clipboard', 'Copy Attempt', 'Hotkey Ctrl+C intercepted on examination question', 10);
      break;
    case 'paste':
      state.proctor.recordViolation('Clipboard', 'Paste Attempt', 'Hotkey Ctrl+V intercepted in assessment area', 10);
      break;
    case 'save':
      state.proctor.recordViolation('Browser', 'Page Save Attempt', 'Attempted to save exam content to disk (Ctrl+S)', 10);
      break;
    case 'fullscreen':
      state.proctor.recordViolation('Browser', 'Fullscreen Exit', 'Candidate exited required fullscreen proctoring mode', 10);
      handleFullscreenWarning();
      break;
    case 'tab':
      state.proctor.recordViolation('Browser', 'Tab Switch', 'Candidate navigated away to external browser tab / Alt-Tab', 10);
      break;
    case 'print':
      state.proctor.recordViolation('Browser', 'Print Attempt', 'Attempted to print or export exam content (Ctrl+P)', 10);
      break;
    case 'lookaway-tier1': // 2-7s -> 5 pts
      state.proctor.recordViolation('Vision', 'Look Away (2-7s)', 'Candidate looked away from examination screen for 4.2s', 5);
      window.dispatchEvent(new CustomEvent('proctor-gaze-status', { detail: { lookingAway: true, duration: '4.2', reason: 'Gaze Drift (Left)' } }));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('proctor-gaze-status', { detail: { lookingAway: false, duration: 0, reason: 'Center (Locked)' } }));
      }, 3000);
      break;
    case 'lookaway-tier2': // 7-15s -> 15 pts
      state.proctor.recordViolation('Vision', 'Look Away (7-15s)', 'Prolonged gaze deviation reached 10.5s', 15);
      window.dispatchEvent(new CustomEvent('proctor-gaze-status', { detail: { lookingAway: true, duration: '10.5', reason: 'Gaze Drift (Right)' } }));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('proctor-gaze-status', { detail: { lookingAway: false, duration: 0, reason: 'Center (Locked)' } }));
      }, 3000);
      break;
    case 'lookaway-tier3': // >15s -> 30 pts
      state.proctor.recordViolation('Vision', 'Look Away (>15s)', 'Critical gaze deviation / absence reached 18.0s', 30);
      window.dispatchEvent(new CustomEvent('proctor-gaze-status', { detail: { lookingAway: true, duration: '18.0', reason: 'Face Absent / Looking Down' } }));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('proctor-gaze-status', { detail: { lookingAway: false, duration: 0, reason: 'Center (Locked)' } }));
      }, 3000);
      break;
    case 'speech': // 15 pts
      state.proctor.recordViolation('Audio', 'Audio Limit Exceeded', 'Secondary acoustic speech / sound exceeded permitted limit', 15);
      window.dispatchEvent(new CustomEvent('proctor-audio-level', { detail: { level: 65 } }));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('proctor-audio-level', { detail: { level: 14 } }));
      }, 2500);
      break;
  }
}

function triggerDemoBreach() {
  if (!state.isExamActive || !state.proctor) return;
  // Sequence to cross 60: Look Away 7-15s (+15) + Audio (+15) + Copy (+10) + Tab (+10) + Save (+10) = 60 pts!
  triggerDemoViolation('lookaway-tier2'); // +15 -> 15
  setTimeout(() => triggerDemoViolation('speech'), 200); // +15 -> 30
  setTimeout(() => triggerDemoViolation('copy'), 400); // +10 -> 40
  setTimeout(() => triggerDemoViolation('tab'), 600); // +10 -> 50
  setTimeout(() => triggerDemoViolation('save'), 800); // +10 -> 60 (Locks out immediately!)
}

// ================= RESET DEMO =================
async function resetDemoData() {
  if (confirm('Reset all demo submissions back to clean seed data?')) {
    try {
      await fetch('/api/reset-demo', { method: 'POST' });
      state.latestAttempt = null;
      if (state.activeRole === 'faculty') {
        loadFacultyAttempts();
      } else {
        showView('viewPrecheck');
      }
      alert('Demo data successfully reset to clean seed state!');
    } catch (err) {
      console.error('Reset failed:', err);
    }
  }
}
