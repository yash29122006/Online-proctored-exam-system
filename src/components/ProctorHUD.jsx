import React, { useEffect } from 'react';
import { Camera, Volume2, ShieldAlert, Activity, Eye, Move } from 'lucide-react';

export default function ProctorHUD({
  mediaStream,
  videoRef,
  canvasRef,
  faceStatus,
  audioLevel,
  isAudioExceeded,
  movementLevel = 0,
  isMovementExcessive = false,
  lookAwayDuration,
  riskScore,
  events = []
}) {
  // Ensure video stream is attached and playing whenever component mounts or mediaStream changes
  useEffect(() => {
    if (videoRef?.current && mediaStream) {
      const video = videoRef.current;
      if (video.srcObject !== mediaStream) {
        video.srcObject = mediaStream;
      }
      video.play().catch(err => {
        console.warn('Video playback notice:', err);
      });
    }
  }, [videoRef, mediaStream]);

  // Risk progress percentage (0 - 60 max)
  const riskPercent = Math.min(100, Math.round((riskScore / 60) * 100));

  // Determine risk level styling
  let riskColorClass = 'bg-emerald-500';
  let riskBgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (riskScore >= 45) {
    riskColorClass = 'bg-red-600';
    riskBgClass = 'bg-red-50 text-red-700 border-red-200';
  } else if (riskScore >= 20) {
    riskColorClass = 'bg-amber-500';
    riskBgClass = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  // Face status badge
  let faceBadge = { text: 'GAZE FOCUSED', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
  if (faceStatus === 'LOOK_AWAY') {
    faceBadge = { text: `LOOK AWAY (${lookAwayDuration}s)`, bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse' };
  } else if (faceStatus === 'NO_FACE') {
    faceBadge = { text: 'NO FACE DETECTED', bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500 animate-pulse' };
  } else if (faceStatus === 'MULTI_FACE') {
    faceBadge = { text: 'MULTIPLE FACES', bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500 animate-pulse' };
  }

  return (
    <div className="space-y-6">
      {/* Camera Feed & BlazeFace Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Camera className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">AI Ocular & Motion Proctor</span>
          </div>
          <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border flex items-center space-x-1.5 ${faceBadge.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${faceBadge.dot}`}></span>
            <span>{faceBadge.text}</span>
          </div>
        </div>

        {/* Video & Canvas Overlay */}
        <div className="relative aspect-4/3 bg-slate-900 rounded-xl overflow-hidden border border-slate-200">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none"
          />

          {/* Look away active counter banner */}
          {lookAwayDuration > 0 && (
            <div className="absolute top-2 left-2 right-2 bg-amber-500/90 backdrop-blur-xs text-white px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 animate-pulse" />
                <span>GAZE DEVIATION:</span>
              </div>
              <span>{lookAwayDuration.toFixed(1)}s</span>
            </div>
          )}

          {/* Micro HUD watermark */}
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
            VISION-TRACKER • 30 FPS
          </div>
        </div>

        {/* Real-time Movement & Kinetic Energy Meter */}
        <div className="mt-3.5 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center space-x-1 text-slate-600">
              <Move className="w-3.5 h-3.5" />
              <span className="font-semibold text-[11px]">BODY KINETICS / MOVEMENT:</span>
            </div>
            <span className={`font-mono text-[11px] font-bold ${isMovementExcessive ? 'text-amber-600' : 'text-slate-600'}`}>
              {movementLevel}% {isMovementExcessive ? '(RESTLESS SHIFT)' : '(STABLE)'}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                movementLevel > 65 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${movementLevel}%` }}
            />
          </div>
        </div>

        {/* Audio VU Meter */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center space-x-1 text-slate-600">
              <Volume2 className="w-3.5 h-3.5" />
              <span className="font-semibold text-[11px]">ACOUSTIC CEILING:</span>
            </div>
            <span className={`font-mono text-[11px] font-bold ${isAudioExceeded ? 'text-red-600' : 'text-slate-600'}`}>
              {audioLevel}% {isAudioExceeded ? '(LIMIT BREACH)' : ''}
            </span>
          </div>

          {/* 12-segment bar */}
          <div className="grid grid-cols-12 gap-1 h-2">
            {Array.from({ length: 12 }).map((_, i) => {
              const segmentThreshold = (i + 1) * (100 / 12);
              const isLit = audioLevel >= segmentThreshold - 5;
              let segmentColor = 'bg-emerald-400';
              if (i >= 8) segmentColor = 'bg-red-500';
              else if (i >= 6) segmentColor = 'bg-amber-400';

              return (
                <div
                  key={i}
                  className={`rounded-xs transition-all duration-75 ${
                    isLit ? segmentColor : 'bg-slate-100'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Risk Point Accumulator Gauge */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Cumulative Risk Gauge</span>
          </div>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${riskBgClass}`}>
            {riskScore} / 60 PTS
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${riskColorClass}`}
            style={{ width: `${riskPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center mt-2 text-[11px] font-mono text-slate-400">
          <span>0 (CLEAN)</span>
          <span className="text-red-500 font-bold">60 (AUTO-TERMINATION)</span>
        </div>
      </div>

      {/* Live Incident Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Live Audit Events</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">{events.length} detected</span>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-2 pr-1 text-xs">
          {events.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-xs italic">
              No anomalies recorded. Integrity state is optimal.
            </p>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-2"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-800 text-[11px]">{evt.type}</span>
                    <span className="font-mono text-[10px] text-slate-400">({evt.time})</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">{evt.description}</p>
                </div>
                <span className="font-mono font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                  +{evt.points}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
