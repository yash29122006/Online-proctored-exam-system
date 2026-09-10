import React from 'react';
import { Award, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, FileText, ArrowRight, RotateCcw } from 'lucide-react';

export default function EvaluationReport({ attempt, onGoToFaculty, onRetake }) {
  if (!attempt) return null;

  const isTerminated = attempt.status === 'TERMINATED' || attempt.riskScore >= 60;
  const scorePercent = Math.round((attempt.score / (attempt.totalQuestions || 5)) * 100);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Report Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
              <span>Automated Forensic Examination Report</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {attempt.examTitle || 'CS402: Distributed Systems Final'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Candidate: <strong className="text-slate-800">{attempt.studentName}</strong> ({attempt.studentId}) • Session ID: <span className="font-mono text-xs">{attempt.id}</span>
            </p>
          </div>

          <div>
            {isTerminated ? (
              <div className="inline-flex items-center space-x-2 bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-200 font-bold text-sm">
                <XCircle className="w-5 h-5 text-red-600" />
                <span>TERMINATED & DISQUALIFIED</span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>VALIDATED & SUBMITTED</span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          {/* Academic Score */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold block">ACADEMIC SCORE</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {attempt.score} <span className="text-sm text-slate-400 font-normal">/ {attempt.totalQuestions || 5}</span>
            </div>
            <span className="text-xs font-mono font-semibold text-blue-600 mt-1 block">
              {scorePercent}% Accuracy
            </span>
          </div>

          {/* Risk Points */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold block">INTEGRITY RISK</span>
            <div className={`text-2xl font-bold mt-1 font-mono ${isTerminated ? 'text-red-600' : 'text-slate-900'}`}>
              {attempt.riskScore} <span className="text-sm text-slate-400 font-normal font-sans">/ 60 pts</span>
            </div>
            <span className={`text-xs font-semibold mt-1 block ${isTerminated ? 'text-red-600' : 'text-emerald-600'}`}>
              {isTerminated ? 'Threshold Exceeded' : 'Within Bounds'}
            </span>
          </div>

          {/* Similarity / Plagiarism */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold block">SIMILARITY INDEX</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {attempt.plagiarismScore || 3}%
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              {attempt.plagiarismScore > 25 ? 'Clipboard Collusion Alert' : 'Normal Academic Range'}
            </span>
          </div>

          {/* Time Elapsed */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold block">DURATION</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {Math.floor((attempt.timeElapsedSeconds || 120) / 60)}m {((attempt.timeElapsedSeconds || 120) % 60)}s
            </div>
            <span className="text-xs text-slate-500 mt-1 block font-mono">
              {attempt.formattedTime || 'Just now'}
            </span>
          </div>
        </div>
      </div>

      {/* Graded Question Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>Question Assessment & Explanations</span>
        </h2>

        <div className="space-y-6">
          {(attempt.gradedQuestions || []).map((gq, idx) => (
            <div
              key={gq.id || idx}
              className={`p-6 rounded-2xl border-2 transition ${
                gq.isCorrect ? 'border-emerald-100 bg-emerald-50/20' : 'border-red-100 bg-red-50/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs font-mono font-bold text-slate-500">QUESTION {idx + 1}</span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border font-mono ${
                    gq.isCorrect
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {gq.isCorrect ? '+1.0 PT (CORRECT)' : '0.0 PT (INCORRECT)'}
                </span>
              </div>

              <h3 className="text-base font-semibold text-slate-900 mt-2">{gq.question}</h3>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-medium">CANDIDATE RESPONSE:</span>
                  <span className={`font-semibold mt-1 block ${gq.isCorrect ? 'text-emerald-700' : 'text-red-600'}`}>
                    {gq.studentAnswer}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-medium">CANONICAL ANSWER:</span>
                  <span className="font-semibold text-slate-900 mt-1 block">
                    {gq.correctAnswer}
                  </span>
                </div>
              </div>

              {gq.explanation && (
                <p className="mt-3 text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                  <strong>Academic Explanation:</strong> {gq.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Incident Log */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-blue-600" />
          <span>Proctoring Incident Chronology</span>
        </h2>

        {(!attempt.events || attempt.events.length === 0) ? (
          <p className="text-sm text-slate-500 italic">No violations detected during this examination session.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono">
                  <th className="pb-3 font-semibold">TIMESTAMP</th>
                  <th className="pb-3 font-semibold">CATEGORY</th>
                  <th className="pb-3 font-semibold">VIOLATION TYPE</th>
                  <th className="pb-3 font-semibold">POINTS</th>
                  <th className="pb-3 font-semibold">CUMULATIVE</th>
                  <th className="pb-3 font-semibold">DESCRIPTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempt.events.map((evt, idx) => (
                  <tr key={evt.id || idx} className="hover:bg-slate-50/70">
                    <td className="py-3 font-mono text-slate-500">{evt.time}</td>
                    <td className="py-3 font-semibold text-slate-700">{evt.category || 'Integrity'}</td>
                    <td className="py-3 font-bold text-slate-900">{evt.type}</td>
                    <td className="py-3 font-mono font-bold text-red-600">+{evt.points}</td>
                    <td className="py-3 font-mono font-semibold text-slate-700">{evt.cumulativeRisk} pts</td>
                    <td className="py-3 text-slate-600 max-w-xs truncate">{evt.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onRetake}
          className="px-6 py-3 rounded-xl border border-slate-200 hover:bg-white bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-2 transition shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retake Demonstration</span>
        </button>

        <button
          onClick={onGoToFaculty}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-2 transition shadow-md shadow-blue-600/20"
        >
          <span>Open Faculty Review Console</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
