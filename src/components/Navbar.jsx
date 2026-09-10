import React from 'react';
import { ShieldCheck, Lock, Clock, User, Award, RefreshCw } from 'lucide-react';

export default function Navbar({
  currentRole,
  onSwitchRole,
  timeLeft,
  examActive,
  onResetDemo
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 tracking-tight text-lg">ProctorShield</span>
              <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">
                VeriExam Core v4.2
              </span>
            </div>
            <p className="text-xs text-slate-500">Autonomous Edge Integrity Engine</p>
          </div>
        </div>

        {/* Center Indicators */}
        <div className="hidden md:flex items-center space-x-6">
          {examActive && (
            <>
              {/* Lockdown Pill */}
              <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <Lock className="w-3.5 h-3.5" />
                <span>KIOSK LOCKDOWN ACTIVE</span>
              </div>

              {/* Time Remaining */}
              <div className="flex items-center space-x-2 bg-slate-100 text-slate-700 px-3.5 py-1 rounded-lg border border-slate-200 font-mono text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500">REMAINING:</span>
                <span className="font-bold text-slate-900 text-sm">{formatTime(timeLeft)}</span>
              </div>
            </>
          )}

          {/* Candidate Badge */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-xs">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-slate-800">Marcus Vance</span>
            <span className="text-slate-400">|</span>
            <span className="font-mono text-slate-600 text-[11px]">ENG-9042</span>
          </div>
        </div>

        {/* Right Actions & Role Switcher */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onResetDemo}
            title="Reset demo seed data to clean benchmark state"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition border border-transparent hover:border-slate-200 text-xs flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => onSwitchRole('STUDENT')}
              className={`px-3 py-1.5 rounded-lg transition ${
                currentRole === 'STUDENT'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Candidate
            </button>
            <button
              onClick={() => onSwitchRole('FACULTY')}
              className={`px-3 py-1.5 rounded-lg transition ${
                currentRole === 'FACULTY'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty Review
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
