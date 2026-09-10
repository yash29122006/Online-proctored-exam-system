import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import CandidatePrecheck from './components/CandidatePrecheck';
import QuestionCard from './components/QuestionCard';
import ProctorHUD from './components/ProctorHUD';
import JudgeTestBench from './components/JudgeTestBench';
import TerminationModal from './components/TerminationModal';
import FullscreenWarningModal from './components/FullscreenWarningModal';
import EvaluationReport from './components/EvaluationReport';
import FacultyConsole from './components/FacultyConsole';
import { useProctorEngine } from './hooks/useProctorEngine';

export default function App() {
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' | 'FACULTY'
  const [studentView, setStudentView] = useState('PRECHECK'); // 'PRECHECK' | 'EXAM' | 'REPORT'
  const [examData, setExamData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const answersRef = useRef(answers);

  // Sync answersRef
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Shared master media stream initialization
  useEffect(() => {
    let activeStream = null;

    const initStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: true
        });
        activeStream = stream;
        setMediaStream(stream);
      } catch (err) {
        console.warn('Media hardware initial access notice:', err);
      }
    };

    initStream();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Fetch exam questions on load
  useEffect(() => {
    fetch('/api/exam')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setExamData(data);
        }
      })
      .catch(err => console.error('Failed to fetch exam questions:', err));
  }, []);

  // Submit attempt to backend
  const submitExamAttempt = useCallback(async (finalStatus = 'COMPLETED', overrideRiskScore = null) => {
    try {
      const risk = overrideRiskScore !== null ? overrideRiskScore : riskScore;
      const payload = {
        studentName: 'Marcus Vance',
        studentId: 'ENG-9042',
        answers: answersRef.current,
        events: events,
        riskScore: risk,
        status: finalStatus,
        timeElapsedSeconds: timeElapsed
      };

      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setActiveAttempt(data.attempt);
        // Safely exit fullscreen
        if (document.fullscreenElement) {
          try {
            await document.exitFullscreen();
          } catch (e) {}
        }
        return data.attempt;
      }
    } catch (err) {
      console.error('Error submitting exam:', err);
    }
  }, [timeElapsed]);

  // Handle auto-termination from proctor engine
  const handleAutoTerminate = useCallback(async (finalRiskScore) => {
    setShowTerminationModal(true);
    await submitExamAttempt('TERMINATED', finalRiskScore);
  }, [submitExamAttempt]);

  // Initialize proctoring engine with master mediaStream
  const {
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
  } = useProctorEngine({
    isActive: studentView === 'EXAM',
    onTerminate: handleAutoTerminate,
    mediaStream,
    videoRef,
    canvasRef
  });

  // Start exam and enter fullscreen
  const handleStartExam = async () => {
    // Request fullscreen synchronously on user gesture
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request bypassed:', err);
    }

    // Ensure mediaStream is alive
    if (!mediaStream) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true
        });
        setMediaStream(stream);
      } catch (e) {
        console.warn('Stream reload notice:', e);
      }
    }

    setStudentView('EXAM');
  };

  // Resume fullscreen from warning modal
  const handleResumeFullscreen = async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      }
    } catch (e) {}
    setShowFullscreenModal(false);
  };

  // Timer countdown during exam
  useEffect(() => {
    if (studentView !== 'EXAM' || terminated) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExamAttempt('COMPLETED');
          setStudentView('REPORT');
          return 0;
        }
        return prev - 1;
      });
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [studentView, terminated, submitExamAttempt]);

  // Handle normal exam submission
  const handleNormalSubmit = async () => {
    await submitExamAttempt('COMPLETED');
    setStudentView('REPORT');
  };

  // Switch to report from termination modal
  const handleViewReportFromTermination = () => {
    setShowTerminationModal(false);
    setStudentView('REPORT');
  };

  // Demo reset
  const handleResetDemo = async () => {
    try {
      await fetch('/api/reset-demo', { method: 'POST' });
      setAnswers({});
      setCurrentQuestionIndex(0);
      setTimeLeft(45 * 60);
      setTimeElapsed(0);
      setStudentView('PRECHECK');
      setActiveAttempt(null);
      setShowTerminationModal(false);
    } catch (err) {
      console.error('Demo reset error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentRole={role}
        onSwitchRole={(newRole) => setRole(newRole)}
        timeLeft={timeLeft}
        examActive={studentView === 'EXAM'}
        onResetDemo={handleResetDemo}
      />

      {/* Main Views */}
      <main className="flex-1">
        {role === 'FACULTY' ? (
          <FacultyConsole
            onBackToStudent={() => setRole('STUDENT')}
            onResetDemo={handleResetDemo}
          />
        ) : studentView === 'PRECHECK' ? (
          <CandidatePrecheck
            mediaStream={mediaStream}
            onStartExam={handleStartExam}
            examInfo={examData}
          />
        ) : studentView === 'EXAM' ? (
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Question Area (8 Cols) */}
              <div className="lg:col-span-8 space-y-6">
                <QuestionCard
                  questions={examData?.questions || []}
                  currentIndex={currentQuestionIndex}
                  answers={answers}
                  onSelectOption={(qId, optIdx) => {
                    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
                  }}
                  onPrev={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  onNext={() => setCurrentQuestionIndex(prev => Math.min((examData?.questions?.length || 1) - 1, prev + 1))}
                  onSubmit={handleNormalSubmit}
                />

                {/* Judge / Evaluator Test Bench */}
                <JudgeTestBench onTrigger={triggerManualEvent} />
              </div>

              {/* Proctor AI HUD (4 Cols) */}
              <div className="lg:col-span-4">
                <ProctorHUD
                  mediaStream={mediaStream}
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  faceStatus={faceStatus}
                  audioLevel={audioLevel}
                  isAudioExceeded={isAudioExceeded}
                  movementLevel={movementLevel}
                  isMovementExcessive={isMovementExcessive}
                  lookAwayDuration={lookAwayDuration}
                  riskScore={riskScore}
                  events={events}
                />
              </div>
            </div>
          </div>
        ) : (
          <EvaluationReport
            attempt={activeAttempt}
            onGoToFaculty={() => setRole('FACULTY')}
            onRetake={() => {
              setAnswers({});
              setCurrentQuestionIndex(0);
              setTimeLeft(45 * 60);
              setTimeElapsed(0);
              setStudentView('PRECHECK');
              setActiveAttempt(null);
            }}
          />
        )}
      </main>

      {/* Fullscreen Warning Modal */}
      {showFullscreenModal && (
        <FullscreenWarningModal onResumeFullscreen={handleResumeFullscreen} />
      )}

      {/* Auto-Termination Modal */}
      {showTerminationModal && (
        <TerminationModal
          riskScore={riskScore}
          onViewReport={handleViewReportFromTermination}
        />
      )}
    </div>
  );
}
