import React from 'react';
import { AlertTriangle, Maximize2 } from 'lucide-react';

export default function FullscreenWarningModal({ onResumeFullscreen }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-amber-200 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-10 h-10 animate-bounce" />
        </div>

        <span className="text-xs font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
          KIOSK SECURITY VIOLATION
        </span>

        <h2 className="text-xl font-bold text-slate-900 mt-4 tracking-tight">
          Fullscreen Kiosk Mode Exited
        </h2>

        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          You have exited the mandatory full-screen examination environment.
          An unauthorized exit event has been logged, and <strong className="text-red-600 font-mono">10 risk points</strong> have been deducted.
        </p>

        <p className="text-xs text-slate-500 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          You must re-enter full-screen mode immediately to continue your examination.
        </p>

        <button
          onClick={onResumeFullscreen}
          className="mt-6 w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-blue-600/20"
        >
          <Maximize2 className="w-4 h-4" />
          <span>Resume Fullscreen Lockdown</span>
        </button>
      </div>
    </div>
  );
}
