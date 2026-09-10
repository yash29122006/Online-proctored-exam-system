import React, { useState } from 'react';
import { Terminal, ChevronUp, ChevronDown, Move } from 'lucide-react';

export default function JudgeTestBench({ onTrigger }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mt-8 bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
            Hackathon Judge & Evaluator Real-Time Simulation Bench
          </span>
          <span className="text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
            DEMO SHORTCUTS
          </span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="pt-4">
          <p className="text-xs text-slate-400 mb-3">
            Click any button below to immediately inject real proctoring violations and verify edge calculations, point deductions, and auto-termination:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {/* Look away tiers */}
            <button
              id="btn-trigger-lookaway-5"
              onClick={() => onTrigger('LOOK_AWAY_5')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition hover:border-amber-500/50 group"
            >
              <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-400">Look Away (2-7s)</div>
              <div className="text-[10px] font-mono text-amber-400 mt-1 font-bold">+5 Points</div>
            </button>

            <button
              id="btn-trigger-lookaway-15"
              onClick={() => onTrigger('LOOK_AWAY_15')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition hover:border-amber-500/50 group"
            >
              <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-400">Look Away (7-15s)</div>
              <div className="text-[10px] font-mono text-amber-400 mt-1 font-bold">+15 Points</div>
            </button>

            <button
              id="btn-trigger-lookaway-30"
              onClick={() => onTrigger('LOOK_AWAY_30')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition hover:border-red-500/50 group"
            >
              <div className="text-[11px] font-bold text-slate-200 group-hover:text-red-400">Look Away (&gt;15s)</div>
              <div className="text-[10px] font-mono text-red-400 mt-1 font-bold">+30 Points</div>
            </button>

            {/* Audio Limit */}
            <button
              id="btn-trigger-audio-15"
              onClick={() => onTrigger('AUDIO_15')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition hover:border-amber-500/50 group"
            >
              <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-400">Audio Limit Breach</div>
              <div className="text-[10px] font-mono text-amber-400 mt-1 font-bold">+15 Points</div>
            </button>

            {/* Movement */}
            <button
              id="btn-trigger-movement-10"
              onClick={() => onTrigger('MOVEMENT_10')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition hover:border-amber-500/50 group"
            >
              <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-400">Restless Shift / Motion</div>
              <div className="text-[10px] font-mono text-amber-400 mt-1 font-bold">+10 Points</div>
            </button>

            {/* Copy */}
            <button
              id="btn-trigger-copy-10"
              onClick={() => onTrigger('CLIPBOARD_COPY_10')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition hover:border-blue-500/50 group"
            >
              <div className="text-[11px] font-bold text-slate-200 group-hover:text-blue-400">Copy (Ctrl+C)</div>
              <div className="text-[10px] font-mono text-blue-400 mt-1 font-bold">+10 Points</div>
            </button>

            {/* Paste */}
            <button
              id="btn-trigger-paste-10"
              onClick={() => onTrigger('CLIPBOARD_PASTE_10')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition hover:border-blue-500/50 group"
            >
              <div className="text-[11px] font-bold text-slate-200 group-hover:text-blue-400">Paste (Ctrl+V)</div>
              <div className="text-[10px] font-mono text-blue-400 mt-1 font-bold">+10 Points</div>
            </button>

            {/* Save */}
            <button
              id="btn-trigger-save-10"
              onClick={() => onTrigger('SAVE_10')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition hover:border-blue-500/50 group"
            >
              <div className="text-[11px] font-bold text-slate-200 group-hover:text-blue-400">Save Page (Ctrl+S)</div>
              <div className="text-[10px] font-mono text-blue-400 mt-1 font-bold">+10 Points</div>
            </button>

            {/* Print */}
            <button
              id="btn-trigger-print-10"
              onClick={() => onTrigger('PRINT_10')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition hover:border-blue-500/50 group"
            >
              <div className="text-[11px] font-bold text-slate-200 group-hover:text-blue-400">Print Doc (Ctrl+P)</div>
              <div className="text-[10px] font-mono text-blue-400 mt-1 font-bold">+10 Points</div>
            </button>

            {/* Tab Switch */}
            <button
              id="btn-trigger-tab-10"
              onClick={() => onTrigger('TAB_SWITCH_10')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition hover:border-blue-500/50 group"
            >
              <div className="text-[11px] font-bold text-slate-200 group-hover:text-blue-400">Tab Switch / Blur</div>
              <div className="text-[10px] font-mono text-blue-400 mt-1 font-bold">+10 Points</div>
            </button>

            {/* Exit Fullscreen */}
            <button
              id="btn-trigger-fullscreen-10"
              onClick={() => onTrigger('FULLSCREEN_EXIT_10')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition hover:border-red-500/50 group"
            >
              <div className="text-[11px] font-bold text-slate-200 group-hover:text-red-400">Exit Fullscreen</div>
              <div className="text-[10px] font-mono text-red-400 mt-1 font-bold">+10 Points</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
