/**
 * ProctorEngine - Real-Time AI & Behavioral Integrity Monitoring
 * Configured with user-specified penalty tiers:
 * - Look Away: <2s = 0 pts | 2-7s = 5 pts | 7-15s = 15 pts | >15s = 30 pts
 * - Audio Limit Breach: 15 pts
 * - Copy, Paste, Save, Fullscreen Exit, Tab Switch, Print: 10 pts
 */
class ProctorEngine {
  constructor(options = {}) {
    this.threshold = options.threshold || 60;
    this.onRiskUpdate = options.onRiskUpdate || (() => {});
    this.onEventDetected = options.onEventDetected || (() => {});
    this.onThresholdExceeded = options.onThresholdExceeded || (() => {});
    this.onFullscreenExit = options.onFullscreenExit || (() => {});

    this.riskScore = 0;
    this.events = [];
    this.isMonitoring = false;
    this.terminated = false;

    // Media & Models
    this.videoElement = null;
    this.faceCanvas = null;
    this.stream = null;
    this.blazeModel = null;
    this.faceDetectionActive = false;

    // Web Audio
    this.audioContext = null;
    this.analyser = null;
    this.audioInterval = null;

    // Look Away / Gaze Duration Tracking
    this.lookAwayStartTime = null;
    this.lookAwayTiersTriggered = {
      tier1: false, // 2-7s (+5)
      tier2: false, // 7-15s (+10 -> total 15)
      tier3: false  // >15s (+15 -> total 30)
    };

    // Debounce timers to avoid accidental multi-firing in quick succession
    this.lastViolations = {
      audio: 0,
      tab: 0,
      multiface: 0,
      fullscreen: 0,
      copy: 0,
      paste: 0,
      save: 0,
      print: 0
    };

    // Bind event listeners
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleWindowBlur = this.handleWindowBlur.bind(this);
    this.handleCopy = this.handleCopy.bind(this);
    this.handlePaste = this.handlePaste.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleFullscreenChange = this.handleFullscreenChange.bind(this);
  }

  // Pre-load BlazeFace model early
  async loadModel() {
    if (this.blazeModel) return this.blazeModel;
    if (window.blazeface) {
      try {
        this.blazeModel = await window.blazeface.load();
        console.log('✅ BlazeFace model successfully initialized.');
        return this.blazeModel;
      } catch (e) {
        console.warn('BlazeFace model failed to load, using vision fallback', e);
      }
    }
    return null;
  }

  // Start proctoring
  async start(videoEl, canvasEl, existingStream = null) {
    this.isMonitoring = true;
    this.videoElement = videoEl;
    this.faceCanvas = canvasEl;
    this.terminated = false;

    // Reset look away timers
    this.lookAwayStartTime = null;
    this.lookAwayTiersTriggered = { tier1: false, tier2: false, tier3: false };

    // Attach media stream
    if (existingStream) {
      this.stream = existingStream;
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.play().catch(() => {});
      }
    } else {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (this.videoElement) {
          this.videoElement.srcObject = this.stream;
          this.videoElement.play().catch(() => {});
        }
      } catch (err) {
        console.warn('Camera/Mic permission unavailable. Running simulation fallback.', err);
      }
    }

    // Load BlazeFace Model & start face loop
    await this.loadModel();
    this.startFaceTrackingLoop();

    // Start Web Audio analysis
    this.initAudioMonitoring();

    // Attach window & document security traps
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('blur', this.handleWindowBlur);
    document.addEventListener('copy', this.handleCopy);
    document.addEventListener('paste', this.handlePaste);
    document.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('keydown', this.handleKeyDown, true);
    
    // Multi-browser fullscreen events
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange);
  }

  // Stop proctoring
  stop() {
    this.isMonitoring = false;
    this.faceDetectionActive = false;
    if (this.audioInterval) clearInterval(this.audioInterval);

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch(e) {}
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleWindowBlur);
    document.removeEventListener('copy', this.handleCopy);
    document.removeEventListener('paste', this.handlePaste);
    document.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('keydown', this.handleKeyDown, true);
    
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);
  }

  // ================= 1. AI FACE TRACKING & LOOK AWAY DETECTION =================
  async startFaceTrackingLoop() {
    this.faceDetectionActive = true;

    const detectFrame = async () => {
      if (!this.isMonitoring || this.terminated) return;

      if (this.videoElement && this.videoElement.readyState >= 2) {
        const vw = this.videoElement.videoWidth;
        const vh = this.videoElement.videoHeight;

        if (this.faceCanvas && vw && vh) {
          if (this.faceCanvas.width !== vw || this.faceCanvas.height !== vh) {
            this.faceCanvas.width = vw;
            this.faceCanvas.height = vh;
          }
          const ctx = this.faceCanvas.getContext('2d');
          ctx.clearRect(0, 0, vw, vh);

          // If BlazeFace model is loaded
          if (this.blazeModel) {
            try {
              const predictions = await this.blazeModel.estimateFaces(this.videoElement, false);
              this.processFacePredictions(predictions, ctx, vw, vh);
            } catch (err) {
              console.warn('Face estimation error:', err);
            }
          }
        }
      }

      // Schedule next check (~150ms for smooth real-time tracking)
      if (this.faceDetectionActive) {
        setTimeout(() => requestAnimationFrame(detectFrame), 150);
      }
    };

    detectFrame();
  }

  // Process face landmarks and calculate Look Away duration & tiers
  processFacePredictions(predictions, ctx, vw, vh) {
    const now = Date.now();

    // Check Multi-Face first
    if (predictions && predictions.length > 1) {
      predictions.forEach((pred, i) => {
        this.drawFaceBox(ctx, pred, '#ef4444', `PERSON ${i+1}`);
      });

      window.dispatchEvent(new CustomEvent('proctor-face-status', { 
        detail: { detected: true, count: predictions.length, warning: true, text: 'MULTIPLE FACES DETECTED' } 
      }));

      if (now - this.lastViolations.multiface > 5000) {
        this.lastViolations.multiface = now;
        this.recordViolation(
          'Vision',
          'Multiple Faces Detected',
          `${predictions.length} faces visible in camera feed`,
          10
        );
      }
      return;
    }

    // Evaluate Look Away condition
    const gazeEval = this.evaluateGazeAndPresence(predictions);

    if (gazeEval.lookingAway) {
      // Look away started or continuing
      if (!this.lookAwayStartTime) {
        this.lookAwayStartTime = now;
        this.lookAwayTiersTriggered = { tier1: false, tier2: false, tier3: false };
      }

      const durationSec = (now - this.lookAwayStartTime) / 1000;

      // Draw red alert box
      if (predictions && predictions.length === 1) {
        this.drawFaceBox(ctx, predictions[0], '#ef4444', `LOOK AWAY: ${durationSec.toFixed(1)}s`);
      } else {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(15, 15, vw - 30, vh - 30);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`LOOK AWAY / ABSENT: ${durationSec.toFixed(1)}s`, 25, 38);
      }

      // Dispatch real-time gaze status to UI
      window.dispatchEvent(new CustomEvent('proctor-gaze-status', { 
        detail: { 
          lookingAway: true, 
          duration: durationSec.toFixed(1),
          reason: gazeEval.reason 
        } 
      }));

      // ================= LOOK AWAY DURATION TIERS =================
      // Tier 1: 2 to 7 sec -> 5 points deduct
      if (durationSec >= 2.0 && !this.lookAwayTiersTriggered.tier1) {
        this.lookAwayTiersTriggered.tier1 = true;
        this.recordViolation(
          'Vision',
          'Look Away (2-7s)',
          `Candidate looked away from screen for ${durationSec.toFixed(1)}s (Tier 1: 5 pts)`,
          5
        );
      }

      // Tier 2: 7 to 15 sec -> 15 points deduct (added +10 to reach 15 pts total)
      if (durationSec >= 7.0 && !this.lookAwayTiersTriggered.tier2) {
        this.lookAwayTiersTriggered.tier2 = true;
        this.recordViolation(
          'Vision',
          'Look Away (7-15s)',
          `Prolonged gaze deviation reached ${durationSec.toFixed(1)}s (Tier 2: 15 pts total)`,
          10
        );
      }

      // Tier 3: > 15 sec -> 30 points deduct (added +15 to reach 30 pts total)
      if (durationSec >= 15.0 && !this.lookAwayTiersTriggered.tier3) {
        this.lookAwayTiersTriggered.tier3 = true;
        this.recordViolation(
          'Vision',
          'Look Away (>15s)',
          `Critical gaze deviation exceeded 15s (${durationSec.toFixed(1)}s) (Tier 3: 30 pts total)`,
          15
        );
      }

    } else {
      // Gaze is looking straight at the screen!
      if (this.lookAwayStartTime) {
        this.lookAwayStartTime = null;
        this.lookAwayTiersTriggered = { tier1: false, tier2: false, tier3: false };
      }

      // Draw normal green locked face box
      if (predictions && predictions.length === 1) {
        this.drawFaceBox(ctx, predictions[0], '#10b981', 'GAZE LOCKED ✓');
      }

      window.dispatchEvent(new CustomEvent('proctor-gaze-status', { 
        detail: { 
          lookingAway: false, 
          duration: 0,
          reason: 'Center (Locked)' 
        } 
      }));

      window.dispatchEvent(new CustomEvent('proctor-face-status', { 
        detail: { detected: true, count: 1, text: 'AI Face Lock Active' } 
      }));
    }
  }

  // Geometric Gaze Calculation from Facial Landmarks
  evaluateGazeAndPresence(predictions) {
    // If face completely absent from camera
    if (!predictions || predictions.length === 0) {
      return { lookingAway: true, reason: 'Face Missing / Turned Away' };
    }

    const face = predictions[0];
    if (!face.landmarks || face.landmarks.length < 3) {
      return { lookingAway: false, reason: 'Center' };
    }

    const rightEye = face.landmarks[0];
    const leftEye = face.landmarks[1];
    const nose = face.landmarks[2];

    const eyeDist = Math.hypot(leftEye[0] - rightEye[0], leftEye[1] - rightEye[1]);
    if (eyeDist < 18) {
      return { lookingAway: true, reason: 'Face Out of Range / Profile' };
    }

    // Horizontal yaw (looking left vs right)
    const eyeMidX = (leftEye[0] + rightEye[0]) / 2;
    const yawRatio = (nose[0] - eyeMidX) / eyeDist;

    // Vertical pitch (looking down at notes/phone vs looking up)
    const eyeMidY = (leftEye[1] + rightEye[1]) / 2;
    const pitchRatio = (nose[1] - eyeMidY) / eyeDist;

    // Thresholds: Frontal gaze maintains yaw between -0.25 and +0.25
    if (Math.abs(yawRatio) > 0.26) {
      return { 
        lookingAway: true, 
        reason: yawRatio > 0 ? 'Looking Away (Right)' : 'Looking Away (Left)' 
      };
    }

    // Pitch: looking too far down (e.g. at mobile phone) or too high
    if (pitchRatio > 0.70 || pitchRatio < 0.10) {
      return { 
        lookingAway: true, 
        reason: pitchRatio > 0.70 ? 'Looking Down' : 'Looking Up' 
      };
    }

    return { lookingAway: false, reason: 'Center' };
  }

  // Draw cybernetic bounding box overlay
  drawFaceBox(ctx, prediction, color, label) {
    const start = prediction.topLeft;
    const end = prediction.bottomRight;
    const size = [end[0] - start[0], end[1] - start[1]];

    const x = start[0];
    const y = start[1];
    const w = size[0];
    const h = size[1];

    // Mirror calculation because video is flipped scaleX(-1)
    const mirroredX = ctx.canvas.width - x - w;

    // Bounding Box
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(mirroredX, y, w, h);

    // Corner Crosshairs
    const cLen = 14;
    ctx.lineWidth = 4;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(mirroredX, y + cLen);
    ctx.lineTo(mirroredX, y);
    ctx.lineTo(mirroredX + cLen, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(mirroredX + w - cLen, y);
    ctx.lineTo(mirroredX + w, y);
    ctx.lineTo(mirroredX + w, y + cLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(mirroredX, y + h - cLen);
    ctx.lineTo(mirroredX, y + h);
    ctx.lineTo(mirroredX + cLen, y + h);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(mirroredX + w - cLen, y + h);
    ctx.lineTo(mirroredX + w, y + h);
    ctx.lineTo(mirroredX + w, y + h - cLen);
    ctx.stroke();

    // Face Landmarks (eyes, nose, mouth)
    if (prediction.landmarks) {
      ctx.fillStyle = color;
      prediction.landmarks.forEach(pt => {
        const mx = ctx.canvas.width - pt[0];
        ctx.beginPath();
        ctx.arc(mx, pt[1], 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Status Label Tag
    ctx.fillStyle = color;
    ctx.fillRect(mirroredX, Math.max(0, y - 22), 140, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(label, mirroredX + 6, Math.max(0, y - 8));
  }

  // ================= 2. WEB AUDIO ACOUSTIC MONITORING (15 PTS) =================
  initAudioMonitoring() {
    try {
      if (!this.stream) return;
      const audioTracks = this.stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      this.audioInterval = setInterval(() => {
        if (!this.isMonitoring || this.terminated) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const average = sum / bufferLength;

        // Visualizer level callback
        window.dispatchEvent(new CustomEvent('proctor-audio-level', { detail: { level: average } }));

        // Detect audio exceeding limit -> deduct 15 points
        const now = Date.now();
        if (average > 40 && now - this.lastViolations.audio > 5000) {
          this.lastViolations.audio = now;
          this.recordViolation(
            'Audio',
            'Audio Level Exceeded',
            `Acoustic energy exceeded permitted limit (${Math.round(average)} RMS)`,
            15
          );
        }
      }, 150);
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  // ================= 3. ANTI-CHEAT SECURITY TRAPS (10 PTS EACH) =================

  // Fullscreen Exit -> 10 pts
  handleFullscreenChange() {
    if (!this.isMonitoring || this.terminated) return;
    const isFs = document.fullscreenElement || 
                 document.webkitFullscreenElement || 
                 document.mozFullScreenElement || 
                 document.msFullscreenElement;
    if (!isFs) {
      const now = Date.now();
      if (now - this.lastViolations.fullscreen > 2000) {
        this.lastViolations.fullscreen = now;
        this.recordViolation(
          'Browser',
          'Fullscreen Exit',
          'Candidate exited required fullscreen proctoring mode',
          10
        );
        this.onFullscreenExit();
      }
    }
  }

  // Tab Switch (Visibility API) -> 10 pts
  handleVisibilityChange() {
    if (!this.isMonitoring || this.terminated) return;
    if (document.hidden) {
      const now = Date.now();
      if (now - this.lastViolations.tab > 2000) {
        this.lastViolations.tab = now;
        this.recordViolation(
          'Browser',
          'Tab Switch',
          'Navigated away to another browser tab / window minimized',
          10
        );
      }
    }
  }

  // Window Focus Lost / Alt-Tab -> 10 pts
  handleWindowBlur() {
    if (!this.isMonitoring || this.terminated) return;
    const now = Date.now();
    if (now - this.lastViolations.tab > 2000) {
      this.lastViolations.tab = now;
      this.recordViolation(
        'Browser',
        'Window Focus Lost',
        'Cursor or focus moved outside proctored exam window',
        10
      );
    }
  }

  // Clipboard: Copy -> 10 pts
  handleCopy(e) {
    if (!this.isMonitoring || this.terminated) return;
    e.preventDefault();
    const now = Date.now();
    if (now - this.lastViolations.copy > 1500) {
      this.lastViolations.copy = now;
      this.recordViolation(
        'Clipboard',
        'Copy Attempt',
        'Unauthorized copy command intercepted on exam content',
        10
      );
    }
  }

  // Clipboard: Paste -> 10 pts
  handlePaste(e) {
    if (!this.isMonitoring || this.terminated) return;
    e.preventDefault();
    const now = Date.now();
    if (now - this.lastViolations.paste > 1500) {
      this.lastViolations.paste = now;
      this.recordViolation(
        'Clipboard',
        'Paste Attempt',
        'Unauthorized paste operation intercepted',
        10
      );
    }
  }

  // Context Menu
  handleContextMenu(e) {
    if (!this.isMonitoring || this.terminated) return;
    e.preventDefault();
    this.showToast('Security Alert', 'Right-click context menu is restricted during exam', 0);
  }

  // Keyboard Shortcuts: Save (Ctrl+S), Print (Ctrl+P / PrintScreen) -> 10 pts each
  handleKeyDown(e) {
    if (!this.isMonitoring || this.terminated) return;
    const key = e.key.toLowerCase();
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const now = Date.now();

    // Save Page: Ctrl+S / Cmd+S -> 10 pts
    if (isCtrlOrCmd && key === 's') {
      e.preventDefault();
      if (now - this.lastViolations.save > 2000) {
        this.lastViolations.save = now;
        this.recordViolation(
          'Browser',
          'Page Save Attempt',
          'Attempted to save exam content to disk (Ctrl+S)',
          10
        );
      }
      return;
    }

    // Print Page: Ctrl+P / Cmd+P -> 10 pts
    if (isCtrlOrCmd && key === 'p') {
      e.preventDefault();
      if (now - this.lastViolations.print > 2000) {
        this.lastViolations.print = now;
        this.recordViolation(
          'Browser',
          'Print Attempt',
          'Attempted to print or export exam content (Ctrl+P)',
          10
        );
      }
      return;
    }

    // Copy / Paste via keyboard
    if (isCtrlOrCmd && key === 'c') {
      this.handleCopy(e);
      return;
    }
    if (isCtrlOrCmd && key === 'v') {
      this.handlePaste(e);
      return;
    }

    // Screenshot Key: PrintScreen -> 10 pts
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      this.recordViolation(
        'System',
        'PrintScreen Attempt',
        'PrintScreen key press intercepted by proctoring engine',
        10
      );
      return;
    }

    // Developer Tools: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U -> 10 pts
    if (
      e.key === 'F12' || 
      (isCtrlOrCmd && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) ||
      (isCtrlOrCmd && key === 'u')
    ) {
      e.preventDefault();
      this.recordViolation(
        'Security',
        'DevTools Inspection',
        'Attempted to access browser developer tools / inspect source',
        10
      );
    }
  }

  // ================= 4. VIOLATION RECORDING & THRESHOLD CHECK =================
  recordViolation(category, type, description, points = 0) {
    if (this.terminated) return;

    const now = new Date();
    const timestampStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    this.riskScore += points;

    const event = {
      id: 'evt-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: timestampStr,
      category,
      type,
      description,
      points,
      cumulativeRisk: this.riskScore
    };

    this.events.push(event);

    // Trigger toast notification
    this.showToast(`Violation Detected: ${type}`, description, points);

    // Call UI callbacks
    this.onEventDetected(event);
    this.onRiskUpdate(this.riskScore, this.threshold);

    // Check automatic exam termination threshold (>= 60)
    if (this.riskScore >= this.threshold && !this.terminated) {
      this.triggerTermination();
    }
  }

  // Automatic Exam Termination
  triggerTermination() {
    this.terminated = true;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const breachEvent = {
      id: 'evt-term-breach',
      timestamp: timeStr,
      category: 'System',
      type: 'Threshold Crossed',
      description: `Integrity risk score (${this.riskScore}) crossed threshold limit (${this.threshold})`,
      points: 0,
      cumulativeRisk: this.riskScore
    };
    const termEvent = {
      id: 'evt-term-auto',
      timestamp: timeStr,
      category: 'System',
      type: 'Exam Terminated',
      description: 'Session automatically terminated by AI Proctoring Engine',
      points: 0,
      cumulativeRisk: this.riskScore
    };

    this.events.push(breachEvent);
    this.events.push(termEvent);

    this.onEventDetected(breachEvent);
    this.onEventDetected(termEvent);

    this.onThresholdExceeded(this.riskScore, this.events);
  }

  // Toast Notification Display
  showToast(title, desc, points = 0) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `
      <div>
        <div class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <span class="text-red-600 font-bold">⚠️</span> ${title}
        </div>
        <div class="text-[11px] text-slate-500 mt-0.5">${desc}</div>
      </div>
      ${points > 0 ? `<div class="font-mono text-xs px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 font-bold whitespace-nowrap">+${points} pts</div>` : ''}
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  // Reset
  reset() {
    this.riskScore = 0;
    this.events = [];
    this.terminated = false;
    this.lookAwayStartTime = null;
    this.lookAwayTiersTriggered = { tier1: false, tier2: false, tier3: false };
    this.onRiskUpdate(0, this.threshold);
  }
}

window.ProctorEngine = ProctorEngine;
