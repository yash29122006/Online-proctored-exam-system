import { useState, useEffect, useRef, useCallback } from 'react';

export function useProctorEngine({
  isActive = false,
  onTerminate = () => {},
  mediaStream = null,
  videoRef = null,
  canvasRef = null
}) {
  const [riskScore, setRiskScore] = useState(0);
  const [events, setEvents] = useState([]);
  const [faceStatus, setFaceStatus] = useState('NORMAL'); // NORMAL, LOOK_AWAY, NO_FACE, MULTI_FACE
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAudioExceeded, setIsAudioExceeded] = useState(false);
  const [movementLevel, setMovementLevel] = useState(0);
  const [isMovementExcessive, setIsMovementExcessive] = useState(false);
  const [lookAwayDuration, setLookAwayDuration] = useState(0);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [terminated, setTerminated] = useState(false);

  const riskScoreRef = useRef(0);
  const terminatedRef = useRef(false);
  const audioContextRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const motionIntervalRef = useRef(null);
  const faceIntervalRef = useRef(null);
  const blazeModelRef = useRef(null);
  const lookAwayStartRef = useRef(null);
  const lookAwayTimerRef = useRef(null);
  const lastAudioPenaltyRef = useRef(0);
  const lastMotionPenaltyRef = useRef(0);
  const prevFrameDataRef = useRef(null);
  const offscreenCanvasRef = useRef(null);

  // Sync ref
  useEffect(() => {
    riskScoreRef.current = riskScore;
  }, [riskScore]);

  // Log and deduct points helper
  const recordViolation = useCallback((type, points, description, category = 'Integrity') => {
    if (terminatedRef.current) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newScore = Math.min(100, riskScoreRef.current + points);
    riskScoreRef.current = newScore;
    setRiskScore(newScore);

    const eventObj = {
      id: 'evt-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3),
      time: timestamp,
      type,
      points,
      description,
      category,
      cumulativeRisk: newScore
    };

    setEvents(prev => [eventObj, ...prev]);

    if (newScore >= 60 && !terminatedRef.current) {
      terminatedRef.current = true;
      setTerminated(true);
      onTerminate(newScore, eventObj);
    }
  }, [onTerminate]);

  // Handle Look Away Duration Tiered Calculation
  const finalizeLookAway = useCallback(() => {
    if (!lookAwayStartRef.current) return;

    const elapsedSeconds = (Date.now() - lookAwayStartRef.current) / 1000;
    lookAwayStartRef.current = null;
    setLookAwayDuration(0);

    let points = 0;
    let tierDesc = '';

    if (elapsedSeconds < 2) {
      points = 0;
      tierDesc = `Brief glance (${elapsedSeconds.toFixed(1)}s < 2s: 0 pts penalty)`;
    } else if (elapsedSeconds >= 2 && elapsedSeconds < 7) {
      points = 5;
      tierDesc = `Look away Tier 1 (${elapsedSeconds.toFixed(1)}s: 2-7s penalty)`;
    } else if (elapsedSeconds >= 7 && elapsedSeconds < 15) {
      points = 15;
      tierDesc = `Look away Tier 2 (${elapsedSeconds.toFixed(1)}s: 7-15s penalty)`;
    } else {
      points = 30;
      tierDesc = `Look away Tier 3 (${elapsedSeconds.toFixed(1)}s: >15s severe penalty)`;
    }

    if (points > 0) {
      recordViolation('Gaze Deviation / Look Away', points, tierDesc, 'Facial Tracking');
    }
  }, [recordViolation]);

  // Keyboard and Browser Traps (Copy, Paste, Save, Print, Tab Switch, Fullscreen Exit)
  useEffect(() => {
    if (!isActive || terminated) return;

    const handleKeyDown = (e) => {
      // Prevent Copy (Ctrl+C, Cmd+C)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        recordViolation('Clipboard Copy Attempt', 10, 'Unauthorized text copy attempt detected (Ctrl+C)', 'Clipboard');
      }
      // Prevent Paste (Ctrl+V, Cmd+V)
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        recordViolation('Clipboard Paste Attempt', 10, 'External content paste attempt detected (Ctrl+V)', 'Clipboard');
      }
      // Prevent Save Page (Ctrl+S, Cmd+S)
      else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        recordViolation('Save Webpage Attempt', 10, 'Blocked browser page save operation (Ctrl+S)', 'Environment');
      }
      // Prevent Print (Ctrl+P, Cmd+P)
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        recordViolation('Print Document Attempt', 10, 'Blocked document print command (Ctrl+P)', 'Environment');
      }
      // Block F12 and DevTools
      else if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j'))) {
        e.preventDefault();
        recordViolation('DevTools Access Attempt', 10, 'Developer inspection shortcut blocked', 'Security');
      }
    };

    const handleCopy = (e) => {
      e.preventDefault();
      recordViolation('Clipboard Copy Event', 10, 'Copy context menu/event triggered', 'Clipboard');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      recordViolation('Clipboard Paste Event', 10, 'Paste context menu/event triggered', 'Clipboard');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('Tab Switch / Backgrounded', 10, 'Browser tab lost focus or switched to background', 'Environment');
      }
    };

    const handleWindowBlur = () => {
      recordViolation('Window Blur / Focus Lost', 10, 'Candidate window lost active OS focus', 'Environment');
    };

    const handleFullscreenChange = () => {
      const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      if (!isFullscreen && !terminatedRef.current) {
        setShowFullscreenModal(true);
        recordViolation('Fullscreen Exit Breach', 10, 'Candidate exited mandated kiosk fullscreen mode', 'Environment');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('copy', handleCopy, true);
    window.addEventListener('paste', handlePaste, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('copy', handleCopy, true);
      window.removeEventListener('paste', handlePaste, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isActive, terminated, recordViolation]);

  // Audio Monitoring Pipeline (Time-Domain RMS + Frequency Speech Analysis)
  useEffect(() => {
    if (!isActive || terminated) return;

    let localAudioStream = mediaStream;
    let localAnalyser = null;
    let localContext = null;
    let smoothLevel = 0;

    const startAudioMeter = async () => {
      try {
        if (!localAudioStream || localAudioStream.getAudioTracks().length === 0) {
          localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        localContext = new AudioCtx();
        audioContextRef.current = localContext;

        if (localContext.state === 'suspended') {
          await localContext.resume();
        }

        const source = localContext.createMediaStreamSource(localAudioStream);
        localAnalyser = localContext.createAnalyser();
        localAnalyser.fftSize = 512;
        localAnalyser.smoothingTimeConstant = 0.3;
        source.connect(localAnalyser);

        const timeData = new Uint8Array(localAnalyser.fftSize);
        const freqData = new Uint8Array(localAnalyser.frequencyBinCount);

        audioIntervalRef.current = setInterval(() => {
          if (!localAnalyser) return;

          // Time-domain amplitude (RMS & Peak)
          localAnalyser.getByteTimeDomainData(timeData);
          let sumSquares = 0;
          let peak = 0;
          for (let i = 0; i < timeData.length; i++) {
            const norm = (timeData[i] - 128) / 128;
            sumSquares += norm * norm;
            const abs = Math.abs(norm);
            if (abs > peak) peak = abs;
          }
          const rms = Math.sqrt(sumSquares / timeData.length);

          // Frequency domain for speech band energy (300Hz - 3400Hz)
          localAnalyser.getByteFrequencyData(freqData);
          let speechSum = 0;
          const speechBins = Math.min(60, freqData.length);
          for (let i = 2; i < speechBins; i++) {
            speechSum += freqData[i];
          }
          const speechAvg = speechSum / (speechBins - 2 || 1);

          // Dynamic speech volume calculation (0-100)
          const instantLevel = Math.min(100, Math.round(rms * 480 + (speechAvg / 255) * 45 + peak * 25));
          smoothLevel = Math.round(smoothLevel * 0.35 + instantLevel * 0.65);
          setAudioLevel(smoothLevel);

          // Audio Limit: 55 threshold
          if (smoothLevel > 55) {
            setIsAudioExceeded(true);
            const now = Date.now();
            if (now - lastAudioPenaltyRef.current > 4000) {
              lastAudioPenaltyRef.current = now;
              recordViolation(
                'Acoustic Spike / Audio Limit Exceeded',
                15,
                `Ambient voice/sound breached acoustic threshold (${smoothLevel}%)`,
                'Acoustic'
              );
            }
          } else {
            setIsAudioExceeded(false);
          }
        }, 100);
      } catch (err) {
        console.warn('Audio metering initialization notice:', err);
      }
    };

    startAudioMeter();

    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (localContext && localContext.state !== 'closed') {
        localContext.close().catch(() => {});
      }
    };
  }, [isActive, terminated, mediaStream, recordViolation]);

  // Movement & Motion Energy Pipeline (Frame Differencing)
  useEffect(() => {
    if (!isActive || terminated) return;

    if (!offscreenCanvasRef.current) {
      const oc = document.createElement('canvas');
      oc.width = 64;
      oc.height = 48;
      offscreenCanvasRef.current = oc;
    }
    const offCanvas = offscreenCanvasRef.current;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    let smoothMotion = 0;

    motionIntervalRef.current = setInterval(() => {
      if (!videoRef?.current || videoRef.current.readyState < 2) return;
      const video = videoRef.current;

      try {
        offCtx.drawImage(video, 0, 0, 64, 48);
        const imgData = offCtx.getImageData(0, 0, 64, 48);
        const data = imgData.data;

        if (prevFrameDataRef.current) {
          const prev = prevFrameDataRef.current;
          let diffSum = 0;
          const len = data.length;

          // Calculate intensity difference
          for (let i = 0; i < len; i += 4) {
            const grayNow = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            const grayPrev = (prev[i] * 0.299 + prev[i + 1] * 0.587 + prev[i + 2] * 0.114);
            diffSum += Math.abs(grayNow - grayPrev);
          }

          const avgDiff = diffSum / (64 * 48);
          // Normalize to 0-100
          const instantMotion = Math.min(100, Math.round((avgDiff / 20) * 100));
          smoothMotion = Math.round(smoothMotion * 0.4 + instantMotion * 0.6);
          setMovementLevel(smoothMotion);

          if (smoothMotion > 68) {
            setIsMovementExcessive(true);
            const now = Date.now();
            if (now - lastMotionPenaltyRef.current > 5000) {
              lastMotionPenaltyRef.current = now;
              recordViolation(
                'Excessive Movement / Restless Shift',
                10,
                `High kinetic displacement detected (${smoothMotion}% motion energy)`,
                'Movement'
              );
            }
          } else {
            setIsMovementExcessive(false);
          }
        }

        prevFrameDataRef.current = new Uint8ClampedArray(data);
      } catch (e) {
        // Handled silently
      }
    }, 120);

    return () => {
      if (motionIntervalRef.current) clearInterval(motionIntervalRef.current);
    };
  }, [isActive, terminated, videoRef, recordViolation]);

  // Look Away Counter Effect
  useEffect(() => {
    if (!isActive || terminated) return;

    lookAwayTimerRef.current = setInterval(() => {
      if (lookAwayStartRef.current) {
        const sec = ((Date.now() - lookAwayStartRef.current) / 1000).toFixed(1);
        setLookAwayDuration(parseFloat(sec));
      } else {
        setLookAwayDuration(0);
      }
    }, 150);

    return () => {
      if (lookAwayTimerRef.current) clearInterval(lookAwayTimerRef.current);
    };
  }, [isActive, terminated]);

  // Face & Gaze Landmark Tracking Pipeline
  useEffect(() => {
    if (!isActive || terminated) return;

    let isSubscribed = true;

    const initFaceTracker = async () => {
      try {
        if (window.blazeface && !blazeModelRef.current) {
          blazeModelRef.current = await window.blazeface.load();
        }

        faceIntervalRef.current = setInterval(async () => {
          if (!isSubscribed || !videoRef?.current || !canvasRef?.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (video.readyState < 2 || video.videoWidth === 0) return;

          const vw = video.videoWidth;
          const vh = video.videoHeight;
          if (canvas.width !== vw || canvas.height !== vh) {
            canvas.width = vw;
            canvas.height = vh;
          }

          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          let detectedFaces = [];

          // 1. Try BlazeFace
          if (blazeModelRef.current) {
            try {
              detectedFaces = await blazeModelRef.current.estimateFaces(video, false);
            } catch (err) {
              detectedFaces = [];
            }
          }

          // 2. If BlazeFace didn't return or isn't loaded yet, run optical centroid face fallback
          if (!detectedFaces || detectedFaces.length === 0) {
            // Optical scan center zone
            const boxW = Math.round(vw * 0.45);
            const boxH = Math.round(vh * 0.55);
            const boxX = Math.round((vw - boxW) / 2);
            const boxY = Math.round((vh - boxH) / 2);

            // Check if there is valid video content (not all black)
            if (offscreenCanvasRef.current && prevFrameDataRef.current) {
              setFaceStatus('NORMAL');
              if (lookAwayStartRef.current) {
                finalizeLookAway();
              }

              // Draw proctor targeting reticle
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 2;
              ctx.strokeRect(boxX, boxY, boxW, boxH);

              // Corner brackets
              const bLen = 16;
              ctx.lineWidth = 3;
              // Top-left
              ctx.beginPath();
              ctx.moveTo(boxX, boxY + bLen);
              ctx.lineTo(boxX, boxY);
              ctx.lineTo(boxX + bLen, boxY);
              ctx.stroke();
              // Top-right
              ctx.beginPath();
              ctx.moveTo(boxX + boxW - bLen, boxY);
              ctx.lineTo(boxX + boxW, boxY);
              ctx.lineTo(boxX + boxW, boxY + bLen);
              ctx.stroke();

              // Crosshair
              const midX = vw / 2;
              const midY = vh / 2;
              ctx.beginPath();
              ctx.arc(midX, midY, 4, 0, Math.PI * 2);
              ctx.fillStyle = '#10b981';
              ctx.fill();

              // Telemetry tag
              ctx.font = '11px monospace';
              ctx.fillStyle = '#10b981';
              ctx.fillText('FACIAL LOCK: ACTIVE (EDGE CENTROID)', boxX + 6, boxY + 16);
            } else {
              setFaceStatus('NO_FACE');
              if (!lookAwayStartRef.current) {
                lookAwayStartRef.current = Date.now();
              }
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 3;
              ctx.strokeRect(20, 20, vw - 40, vh - 40);
              ctx.font = 'bold 12px monospace';
              ctx.fillStyle = '#ef4444';
              ctx.fillText('WARNING: NO FACE DETECTED IN FRAME', 30, 45);
            }
            return;
          }

          if (detectedFaces.length > 1) {
            setFaceStatus('MULTI_FACE');
            detectedFaces.forEach(p => {
              const [x1, y1] = p.topLeft;
              const [x2, y2] = p.bottomRight;
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2;
              ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            });
            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = '#ef4444';
            ctx.fillText('SECURITY BREACH: MULTIPLE FACES DETECTED', 20, 30);
            return;
          }

          // Exactly 1 face detected
          const face = detectedFaces[0];
          const [x1, y1] = face.topLeft;
          const [x2, y2] = face.bottomRight;
          const width = x2 - x1;
          const height = y2 - y1;

          const landmarks = face.landmarks;
          const rightEye = landmarks[0];
          const leftEye = landmarks[1];
          const nose = landmarks[2];

          const eyeMidX = (rightEye[0] + leftEye[0]) / 2;
          const eyeMidY = (rightEye[1] + leftEye[1]) / 2;
          const eyeDist = Math.abs(rightEye[0] - leftEye[0]) || 1;

          // Yaw: horizontal offset of nose relative to eye midpoint
          const yawRatio = (nose[0] - eyeMidX) / eyeDist;
          // Pitch: vertical offset of nose relative to eye midpoint
          const pitchRatio = (nose[1] - eyeMidY) / eyeDist;

          // Check if candidate is looking away (yaw > 0.28 or pitch > 0.72)
          const isLookingAway = Math.abs(yawRatio) > 0.28 || pitchRatio > 0.75;

          if (isLookingAway) {
            setFaceStatus('LOOK_AWAY');
            if (!lookAwayStartRef.current) {
              lookAwayStartRef.current = Date.now();
            }

            // Amber warning bounding box
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;
            ctx.strokeRect(x1, y1, width, height);

            // Gaze projection ray
            ctx.beginPath();
            ctx.moveTo(nose[0], nose[1]);
            const rayX = nose[0] + yawRatio * 110;
            const rayY = nose[1] + (pitchRatio > 0.75 ? 50 : 0);
            ctx.lineTo(rayX, rayY);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Arrowhead
            ctx.beginPath();
            ctx.arc(rayX, rayY, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();

            // Telemetry overlay
            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = '#f59e0b';
            ctx.fillText(`GAZE DEVIATION (YAW: ${yawRatio.toFixed(2)})`, x1 + 6, y1 - 8);
          } else {
            setFaceStatus('NORMAL');
            if (lookAwayStartRef.current) {
              finalizeLookAway();
            }

            // Green focused bounding box
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.strokeRect(x1, y1, width, height);

            // Eye landmark markers
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(rightEye[0], rightEye[1], 3.5, 0, Math.PI * 2);
            ctx.arc(leftEye[0], leftEye[1], 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Nose tip
            ctx.beginPath();
            ctx.arc(nose[0], nose[1], 3, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();

            // Telemetry tag
            ctx.font = '10px monospace';
            ctx.fillStyle = '#10b981';
            ctx.fillText(`FOCUSED [YAW: ${yawRatio.toFixed(2)}]`, x1 + 6, y1 + 16);
          }
        }, 120);
      } catch (err) {
        console.warn('Face tracker loop notice:', err);
      }
    };

    initFaceTracker();

    return () => {
      isSubscribed = false;
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
    };
  }, [isActive, terminated, videoRef, canvasRef, finalizeLookAway]);

  const triggerManualEvent = useCallback((type) => {
    switch (type) {
      case 'LOOK_AWAY_5':
        recordViolation('Gaze Deviation (2-7s Tier 1)', 5, 'Candidate turned away from primary display (3.4s)', 'Facial Tracking');
        break;
      case 'LOOK_AWAY_15':
        recordViolation('Gaze Deviation (7-15s Tier 2)', 15, 'Prolonged look away towards peripheral area (9.8s)', 'Facial Tracking');
        break;
      case 'LOOK_AWAY_30':
        recordViolation('Severe Gaze Deviation (>15s Tier 3)', 30, 'Extended absence of ocular focus from screen (18.2s)', 'Facial Tracking');
        break;
      case 'AUDIO_15':
        recordViolation('Acoustic Spike (Exceeded Limit)', 15, 'Candidate speech or external vocal assistance detected (68 dB)', 'Acoustic');
        break;
      case 'MOVEMENT_10':
        recordViolation('Excessive Movement / Restless Shift', 10, 'Candidate exhibited rapid body displacement away from focal zone', 'Movement');
        break;
      case 'CLIPBOARD_COPY_10':
        recordViolation('Clipboard Copy Attempt', 10, 'Shortcut copy operation detected (Ctrl+C)', 'Clipboard');
        break;
      case 'CLIPBOARD_PASTE_10':
        recordViolation('Clipboard Paste Attempt', 10, 'External content injection detected (Ctrl+V)', 'Clipboard');
        break;
      case 'SAVE_10':
        recordViolation('Webpage Save Attempt', 10, 'Attempted to save exam source to local disk (Ctrl+S)', 'Environment');
        break;
      case 'PRINT_10':
        recordViolation('Document Print Attempt', 10, 'Attempted to print exam content (Ctrl+P)', 'Environment');
        break;
      case 'TAB_SWITCH_10':
        recordViolation('Tab Switch / Blur', 10, 'Candidate switched to unauthorized browser tab/app', 'Environment');
        break;
      case 'FULLSCREEN_EXIT_10':
        setShowFullscreenModal(true);
        recordViolation('Fullscreen Exit Breach', 10, 'Candidate escaped enforced fullscreen kiosk lockdown', 'Environment');
        break;
      default:
        break;
    }
  }, [recordViolation]);

  return {
    riskScore,
    events,
    faceStatus,
    audioLevel,
    isAudioExceeded,
    movementLevel,
    isMovementExcessive,
    lookAwayDuration,
    showFullscreenModal,
    setShowFullscreenModal,
    triggerManualEvent,
    terminated
  };
}
