# ProctorShield VeriExam Core v4.2 (React & Layered Backend Architecture)

We have rebuilt the AI-proctored examination platform using **React 18**, **Tailwind CSS**, and a **layered Express backend** (Controllers, Services, Repositories). The platform implements the exact **Stitch pure academic light theme** selected by the user, and strictly enforces the customized proctoring penalty rules, fullscreen lockdown, and auto-termination.

---

## 1. Calibrated Proctoring Rules Implemented

| Violation Category | Detection Method | Calibrated Point Penalty |
| :--- | :--- | :--- |
| **Gaze Deviation / Look Away (<2s)** | BlazeFace eye-to-nose vectoring | **0 pts** (Grace glance allowed) |
| **Gaze Deviation / Look Away (2–7s)** | BlazeFace eye-to-nose vectoring | **5 pts** (Tier 1 glance penalty) |
| **Gaze Deviation / Look Away (7–15s)** | BlazeFace eye-to-nose vectoring | **15 pts** (Tier 2 moderate penalty) |
| **Gaze Deviation / Look Away (>15s)** | BlazeFace eye-to-nose vectoring | **30 pts** (Tier 3 severe penalty) |
| **Acoustic Spike / Audio Limit Exceeded** | Web Audio API Real-time Analyzer | **15 pts** (when ambient sound &gt; 55%) |
| **Clipboard Copy (`Ctrl+C` / event)** | Browser Trap (`keydown` + `copy`) | **10 pts** |
| **Clipboard Paste (`Ctrl+V` / event)** | Browser Trap (`keydown` + `paste`) | **10 pts** |
| **Save Webpage (`Ctrl+S`)** | Keyboard trap (`keydown`) | **10 pts** |
| **Print Document (`Ctrl+P`)** | Keyboard trap (`keydown`) | **10 pts** |
| **Tab Switch / Focus Lost** | `visibilitychange` + `window.onblur` | **10 pts** |
| **Fullscreen Exit Breach** | `fullscreenchange` event trap | **10 pts** + Warning Modal |
| **Auto-Termination Threshold** | Point Accumulator Engine | **&ge; 60 pts** (Immediate lock & submission) |

---

## 2. Layered Architecture

```
New Proctored system/
├── data/
│   ├── questions.json                  # 5-question academic bank with explanations
│   └── seed-attempts.json              # Benchmark cohort records
├── server/
│   ├── repositories/
│   │   └── attemptRepository.js        # File-based persistence & in-memory cache
│   ├── services/
│   │   └── gradingService.js           # Auto-grader, similarity index, & threshold check
│   ├── controllers/
│   │   └── examController.js           # REST API request/response orchestration
│   ├── routes/
│   │   └── examRoutes.js               # Express Router (/api/exam, /api/attempts, etc.)
│   └── index.js                        # Express server entrypoint (Port 3000)
├── src/
│   ├── components/
│   │   ├── Navbar.jsx                  # Header with timer, kiosk pill, role switcher
│   │   ├── CandidatePrecheck.jsx       # Diagnostic calibration & fullscreen launch
│   │   ├── QuestionCard.jsx            # Q1-Q5 pills, radio options, stepper navigation
│   │   ├── ProctorHUD.jsx              # BlazeFace live canvas, VU meter, risk gauge
│   │   ├── JudgeTestBench.jsx          # One-click buttons with exact point values
│   │   ├── FullscreenWarningModal.jsx  # Lockdown recovery modal
│   │   ├── TerminationModal.jsx        # Disciplinary threshold auto-termination modal
│   │   ├── EvaluationReport.jsx        # Detailed candidate score & incident chronology
│   │   └── FacultyConsole.jsx          # Faculty audit table, search, & forensic modal
│   ├── hooks/
│   │   └── useProctorEngine.js         # BlazeFace, Web Audio API, point tiers, traps
│   ├── App.jsx                         # Main client controller
│   ├── index.css                       # Tailwind styling & custom scrollbars
│   └── main.jsx                        # React root mount
├── vite.config.js                      # Dev server with Express /api proxy
├── tailwind.config.js                  # Tailwind theme & fonts configuration
└── package.json                        # Scripts: `npm run dev` (API + Vite)
```

---

## 3. End-to-End Verification & Evidence

### Step 1: Active Examination View (Academic Light Theme)
Candidates enter mandated kiosk fullscreen upon clicking **"Launch Exam & Enter Fullscreen"**. The question card, camera proctor HUD, and simulation bench are rendered in the clean `#f8fafc` academic theme.

![Active Exam Interface](file:///C:/Users/godya/.gemini/antigravity-ide/brain/94c6cc27-6a81-49da-955c-145d2eab152f/react_active_exam_1789064066369.png)

---

### Step 2: Auto-Termination on Threshold Breach (60 Points)
When the student accumulates $\ge 60\text{ pts}$ through any combination of violations (look away duration tiers, acoustic spikes, copy/paste, fullscreen escape), the test session terminates immediately:

![Auto-Termination Modal](file:///C:/Users/godya/.gemini/antigravity-ide/brain/94c6cc27-6a81-49da-955c-145d2eab152f/react_termination_modal_1789064318865.png)

---

### Step 3: Forensic Evaluation Report
Candidate receives an automated academic breakdown with correct answers, explanations, risk score gauge, similarity index, and full chronological incident log:

![Candidate Forensic Report](file:///C:/Users/godya/.gemini/antigravity-ide/brain/94c6cc27-6a81-49da-955c-145d2eab152f/react_evaluation_report_1789064407530.png)

---

### Step 4: Faculty Console & Audit Trail
Faculty can inspect all cohort submissions, search candidates, filter by status, and click **"Audit Trail"** to inspect exact timestamps and infraction categories:

![Faculty Audit Trail Modal](file:///C:/Users/godya/.gemini/antigravity-ide/brain/94c6cc27-6a81-49da-955c-145d2eab152f/react_faculty_audit_1789064482579.png)

---

## 4. Running the Application Locally

To run both the backend Express API and the Vite React frontend with a single command:

```powershell
npm run dev
```

- **Candidate Exam & Faculty App**: [http://localhost:5173/](http://localhost:5173/)
- **Backend API**: [http://localhost:3000/api/exam](http://localhost:3000/api/exam)
