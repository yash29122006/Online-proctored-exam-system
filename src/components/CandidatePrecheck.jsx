import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, ShieldAlert, CheckCircle2, Maximize2, ArrowRight, Lock } from 'lucide-react';

export default function CandidatePrecheck({ mediaStream, onStartExam, examInfo }) {
  const [micVolume, setMicVolume] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const videoRef = useRef(null);

  // Bind the shared master mediaStream to the pre-check video
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(e => console.warn('Precheck video play error:', e));
    }
  }, [mediaStream]);

  // Audio meter on precheck
  useEffect(() => {
    if (!mediaStream || mediaStream.getAudioTracks().length === 0) return;

    let audioCtx = null;
    let interval = null;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(mediaStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const timeData = new Uint8Array(analyser.fftSize);

      interval = setInterval(() => {
        analyser.getByteTimeDomainData(timeData);
        let sum = 0;
        let peak = 0;
        for (let i = 0; i < timeData.length; i++) {
          const norm = (timeData[i] - 128) / 128;
          sum += norm * norm;
          const abs = Math.abs(norm);
          if (abs > peak) peak = abs;
        }
        const rms = Math.sqrt(sum / timeData.length);
        setMicVolume(Math.min(100, Math.round(rms * 480 + peak * 30)));
      }, 100);
    } catch (e) {
      console.warn('Precheck audio meter notice:', e);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close().catch(() => {});
    };
  }, [mediaStream]);

  const handleLaunch = () => {
    if (!acknowledged) return;
    onStartExam();
  };

  const hasVideoTrack = mediaStream && mediaStream.getVideoTracks().length > 0;
  const hasAudioTrack = mediaStream && mediaStream.getAudioTracks().length > 0;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Candidate System Calibration & Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              CS402: Distributed Systems Final Examination
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Department of Computer Science & Engineering • Academic Term Spring 2026
            </p>
          </div>
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <span className="text-xs text-slate-500 font-mono">EXAM CODE: CS402-F26</span>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 mt-1">
              5 Questions • 45 Minutes
            </span>
          </div>
        </div>

        {/* Video & Diagnostics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
          {/* Camera Feed */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="relative w-full aspect-4/3 bg-slate-900 rounded-xl overflow-hidden shadow-inner border-2 border-slate-200">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono px-2.5 py-1 rounded-md flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${hasVideoTrack ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span>{hasVideoTrack ? 'CAMERA SENSOR: ONLINE' : 'INITIALIZING SENSOR...'}</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-xs text-white text-xs px-3 py-2 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mic className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] font-mono">MIC SENSITIVITY:</span>
                </div>
                <div className="w-28 bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-400 h-full transition-all duration-100"
                    style={{ width: `${micVolume}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Ensure your face is centered, well-illuminated, and eyes are directly facing the screen.
            </p>
          </div>

          {/* Diagnostic Checks & Integrity Policy */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <span>Pre-Flight Integrity Safeguards</span>
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className={`w-4 h-4 ${hasVideoTrack ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="font-semibold text-slate-800">Biometric Facial & Gaze Landmark Calibration</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {hasVideoTrack ? 'READY' : 'CONNECTING'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className={`w-4 h-4 ${hasAudioTrack ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="font-semibold text-slate-800">Acoustic Audio Ceiling (Real-time Decibel Guard)</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {hasAudioTrack ? 'CALIBRATED' : 'CONNECTING'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-800">Browser Kiosk Fullscreen & Anti-Escape Traps</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">ENFORCED</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-800">Clipboard, Copy/Paste & Save/Print Blockers</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">LOCKED</span>
                </div>
              </div>
            </div>

            {/* Threshold Rules Summary */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
              <div className="font-bold text-blue-900 mb-1 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Strict Violation Threshold Policy:</span>
              </div>
              <ul className="text-blue-800 space-y-1 pl-4 list-disc text-[11px]">
                <li><strong>Look Away:</strong> &lt;2s: 0 pts | 2-7s: 5 pts | 7-15s: 15 pts | &gt;15s: 30 pts</li>
                <li><strong>Acoustic Limit:</strong> 15 pts when ambient sound exceeds threshold</li>
                <li><strong>Movement / Body Shifts:</strong> 10 pts on sustained restless kinetic displacement</li>
                <li><strong>Prohibited Actions:</strong> Copy, Paste, Save (Ctrl+S), Print, Tab Switch, Fullscreen Exit: 10 pts each</li>
                <li><strong>Auto-Termination:</strong> Reaching <strong>60 cumulative points</strong> terminates your exam immediately</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Checkbox and Launch */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-start space-x-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              I acknowledge the Academic Honor Code and agree to enter mandated fullscreen kiosk lockdown.
              I understand that exceeding 60 risk points results in immediate termination.
            </span>
          </label>

          <button
            id="start-exam-btn"
            onClick={handleLaunch}
            disabled={!acknowledged}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition shadow-sm ${
              acknowledged
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Maximize2 className="w-4 h-4" />
            <span>Launch Exam & Enter Fullscreen</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
