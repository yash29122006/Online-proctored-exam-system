import React from 'react';
import { Check, ChevronLeft, ChevronRight, Send, AlertCircle } from 'lucide-react';

export default function QuestionCard({
  questions = [],
  currentIndex = 0,
  answers = {},
  onSelectOption,
  onPrev,
  onNext,
  onSubmit
}) {
  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        Loading examination questions...
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const selectedOptionIndex = answers[currentQ.id];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Question Stepper Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60">
        {/* Navigation Pills */}
        <div className="flex items-center space-x-2">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => onSelectOption && null} // view only or step
                className={`w-8 h-8 rounded-lg font-mono text-xs font-semibold flex items-center justify-center transition ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isAnswered
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Status Tag */}
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-500 font-mono">
            QUESTION {currentIndex + 1} OF {questions.length}
          </span>
          <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
            1.0 POINT
          </span>
        </div>
      </div>

      {/* Main Question Content */}
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <span className="text-xs font-mono font-semibold text-blue-600 uppercase tracking-wide">
            {currentQ.category || 'Core Systems Architecture'}
          </span>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mt-2 leading-relaxed">
            {currentQ.question}
          </h2>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {currentQ.options.map((option, optIdx) => {
            const isSelected = selectedOptionIndex === optIdx;
            const letter = String.fromCharCode(65 + optIdx);

            return (
              <label
                key={optIdx}
                onClick={() => onSelectOption(currentQ.id, optIdx)}
                className={`flex items-center p-4 rounded-xl border-2 transition cursor-pointer select-none group ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {/* Radio Indicator */}
                <div
                  className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center mr-4 transition ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-slate-200'
                  }`}
                >
                  {letter}
                </div>

                {/* Option text */}
                <span
                  className={`text-sm flex-1 font-medium ${
                    isSelected ? 'text-blue-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  {option}
                </span>

                {isSelected && (
                  <Check className="w-5 h-5 text-blue-600 ml-2" />
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
            currentIndex === 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-700 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Question</span>
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={onSubmit}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-2 transition shadow-sm shadow-emerald-500/20"
          >
            <span>Finish & Submit Exam</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={onNext}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm shadow-blue-500/20"
          >
            <span>Next Question</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
