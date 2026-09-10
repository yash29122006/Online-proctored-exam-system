import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, AlertTriangle, CheckCircle2, XCircle, Eye, RefreshCw, User, Calendar, Award, Clock, ArrowLeft } from 'lucide-react';

export default function FacultyConsole({ onBackToStudent, onResetDemo }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/attempts');
      const data = await res.json();
      if (data.success) {
        setAttempts(data.attempts);
      }
    } catch (err) {
      console.error('Failed to load attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const handleReset = async () => {
    try {
      await onResetDemo();
      fetchAttempts();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter logic
  const filteredAttempts = attempts.filter((att) => {
    const matchesSearch =
      (att.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (att.studentId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'TERMINATED' && (att.status === 'TERMINATED' || att.riskScore >= 60)) ||
      (statusFilter === 'COMPLETED' && att.status === 'COMPLETED' && att.riskScore < 60);

    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalSubmissions = attempts.length;
  const terminatedCount = attempts.filter(a => a.status === 'TERMINATED' || a.riskScore >= 60).length;
  const avgRisk = totalSubmissions > 0
    ? Math.round(attempts.reduce((acc, a) => acc + (a.riskScore || 0), 0) / totalSubmissions)
    : 0;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Departmental Proctoring & Academic Integrity Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Faculty Audit Console
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Examination cohort review, live incident verification, and forensic telemetry logs.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-2 transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Benchmark Cohort</span>
            </button>
            <button
              onClick={onBackToStudent}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-2 transition shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Candidate Exam</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold block">TOTAL EXAM SUBMISSIONS</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalSubmissions}</div>
            <span className="text-xs text-slate-500 mt-1 block">Active CS402 Cohort</span>
          </div>

          <div className="p-4 rounded-2xl bg-red-50/50 border border-red-200">
            <span className="text-xs text-red-600 font-semibold block">TERMINATED / DISQUALIFIED</span>
            <div className="text-2xl font-bold text-red-700 mt-1">{terminatedCount}</div>
            <span className="text-xs text-red-600/80 mt-1 block">&ge; 60 Cumulative Risk Points</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold block">COHORT MEAN RISK POINTS</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{avgRisk} <span className="text-sm font-normal text-slate-500">/ 60 pts</span></div>
            <span className="text-xs text-slate-500 mt-1 block">Autonomous Edge Inference</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 self-stretch sm:self-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['ALL', 'COMPLETED', 'TERMINATED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === status
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'ALL' ? 'All Records' : status === 'COMPLETED' ? 'Validated' : 'Terminated'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Attempts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-mono">
                <th className="py-3.5 px-6 font-semibold">CANDIDATE</th>
                <th className="py-3.5 px-4 font-semibold">TIMESTAMP</th>
                <th className="py-3.5 px-4 font-semibold">SCORE</th>
                <th className="py-3.5 px-4 font-semibold">RISK POINTS</th>
                <th className="py-3.5 px-4 font-semibold">SIMILARITY</th>
                <th className="py-3.5 px-4 font-semibold">INTEGRITY STATUS</th>
                <th className="py-3.5 px-6 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs italic">
                    No examination records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((attempt) => {
                  const isTerm = attempt.status === 'TERMINATED' || attempt.riskScore >= 60;
                  return (
                    <tr key={attempt.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{attempt.studentName}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{attempt.studentId}</div>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-500">
                        {attempt.formattedTime || attempt.timestamp?.slice(11, 19) || '10:45 AM'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900">{attempt.score} / {attempt.totalQuestions || 5}</span>
                        <span className="text-slate-400 text-[11px] block">
                          {Math.round(((attempt.score || 0) / (attempt.totalQuestions || 5)) * 100)}%
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-mono font-bold ${isTerm ? 'text-red-600' : 'text-slate-800'}`}>
                          {attempt.riskScore} / 60
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-600">
                        {attempt.plagiarismScore || 4}%
                      </td>
                      <td className="py-4 px-4">
                        {isTerm ? (
                          <span className="inline-flex items-center space-x-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-200 font-bold text-[11px]">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>TERMINATED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>VALIDATED</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedAttempt(attempt)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center space-x-1.5 transition shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Audit Trail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Audit Trail Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 uppercase">
                  Candidate Disciplinary Audit File
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedAttempt.studentName} ({selectedAttempt.studentId})
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Attempt ID: {selectedAttempt.id} • Session Timestamp: {selectedAttempt.formattedTime || '10:45 AM'}
                </p>
              </div>

              <button
                onClick={() => setSelectedAttempt(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition text-sm font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-500 block">SCORE</span>
                  <span className="text-lg font-bold text-slate-900">{selectedAttempt.score} / {selectedAttempt.totalQuestions || 5}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-500 block">RISK POINTS</span>
                  <span className={`text-lg font-bold font-mono ${selectedAttempt.riskScore >= 60 ? 'text-red-600' : 'text-slate-900'}`}>
                    {selectedAttempt.riskScore} / 60
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-500 block">STATUS</span>
                  <span className={`text-xs font-bold uppercase block mt-1 ${selectedAttempt.riskScore >= 60 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {selectedAttempt.status}
                  </span>
                </div>
              </div>

              {/* Event Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Recorded Telemetry Incidents ({selectedAttempt.events?.length || 0})</span>
                </h4>

                {(!selectedAttempt.events || selectedAttempt.events.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center bg-slate-50 rounded-xl border border-slate-200">
                    No infractions recorded. Clean session.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {selectedAttempt.events.map((evt, idx) => (
                      <div
                        key={evt.id || idx}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{evt.type}</span>
                            <span className="text-[10px] font-mono text-slate-400">({evt.time})</span>
                            <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                              {evt.category || 'Integrity'}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-1">{evt.description}</p>
                        </div>
                        <span className="font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs shrink-0">
                          +{evt.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
              >
                Close Audit File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
