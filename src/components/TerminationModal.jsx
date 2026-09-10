import React from 'react';
import { AlertOctagon, ShieldAlert, ArrowRight } from 'lucide-react';

export default function TerminationModal({ riskScore, onViewReport }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-red-200 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-5">
          <AlertOctagon className="w-10 h-10 animate-bounce" />
        </div>

        <span className="text-xs font-mono font-bold uppercase tracking-wider bg-red-50 text-red-700 px-3 py-1 rounded-full border border-red-200">
          EXAMINATION AUTO-TERMINATED
        </span>

        <h2 className="text-2xl font-bold text-slate-900 mt-4 tracking-tight">
          Integrity Threshold Exceeded
        </h2>

        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          The autonomous proctoring system detected repeated or severe integrity violations.
          Your cumulative risk points reached <strong className="text-red-600 font-mono">{riskScore} pts</strong> (ceiling is 60 pts).
          Your test session has been locked and automatically submitted for disciplinary faculty audit.
        </p>

        <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500 font-semibold">CUMULATIVE RISK POINTS:</span>
            <span className="font-mono font-bold text-red-600">{riskScore} / 60</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="bg-red-600 h-full w-full"></div>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Status: <span className="text-red-600 font-semibold uppercase">DISQUALIFIED / FLAG_EVALUATION</span>
          </div>
        </div>

        <button
          onClick={onViewReport}
          className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-slate-900/20"
        >
          <span>Review Official Forensic Report</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
