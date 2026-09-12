# AI-Powered Online Proctored Examination System

An AI-powered online examination platform developed as a hackathon prototype for **AETHRA VERSE – Vibe Coding Hackathon**, organized by the **AI AETHRA Club**.

The system combines an online examination interface with real-time monitoring, browser activity detection, plagiarism/similarity checking, and an integrity tracking mechanism to help identify suspicious activity during online examinations.

---
## 🎥 Video Demo

A complete demonstration of the AI-Powered Online Proctored Examination System, including the student examination flow, camera and audio monitoring, integrity tracking, copy detection, threshold-based automatic termination, and faculty-side activity monitoring.

](https://github.com/yash29122006/Online-proctored-exam-system/issues/1#issue-5432504161)

## 🚀 Live Demo

https://online-proctored-exam-system.vercel.app/

## 💻 GitHub Repository

https://github.com/yash29122006/Online-proctored-exam-system

---

## 📌 About the Project

Online examinations provide flexibility and accessibility, but maintaining examination integrity can be challenging.

This project demonstrates a lightweight AI-assisted proctoring solution that monitors multiple signals during an examination, records suspicious events with timestamps, and calculates an integrity/risk score.

If the student's accumulated risk score crosses a predefined threshold, the examination can be automatically terminated.

After the examination, the student can view their result and integrity information, while faculty can view student attempts, detected events, timestamps, and plagiarism/similarity information.

> **Note:** This project is a hackathon/demo prototype and is not intended to replace enterprise-grade proctoring systems.

---

# ✨ Key Features

## 🎓 Student Examination

- Student authentication
- Online examination interface
- Five-question examination flow
- Countdown timer
- Question navigation
- Answer submission
- Automatic submission when the timer expires
- Post-examination result

---

## 📷 AI Camera Monitoring

The system uses camera-based monitoring during the examination to detect suspicious visual activity.

Depending on the implemented detection pipeline, the system can monitor events such as:

- Face not detected
- Multiple faces detected
- Looking away/suspicious head movement
- Other supported camera-based events

Detected events are recorded along with their timestamps and corresponding risk points.

The system uses sustained detection/debouncing rather than treating every individual camera frame as a separate violation.

---

## 🎙️ Audio Monitoring

Audio monitoring is performed during the examination to identify suspicious audio activity.

Possible monitored events include:

- Unexpected speech
- Multiple voices
- Sustained voice activity
- Other supported audio anomalies

Audio events contribute to the integrity tracking system when the configured detection conditions are satisfied.

---

## 🖥️ Browser & Anti-Copy Monitoring

The system monitors browser-level activity that may indicate an attempt to copy or access external information.

Supported checks include:

- Copy attempts
- Paste attempts
- Cut attempts
- Tab switching
- Window blur
- Fullscreen exit
- Print attempts
- Save attempts
- Developer-tools keyboard shortcuts
- Right-click/context-menu restrictions where supported

Each detected event is timestamped and stored for later viewing by faculty.

---

# 📊 Integrity Tracking System

One of the main features of the project is the **point-based integrity tracking mechanism**.

Every detected event can contribute a predefined number of points to the student's risk score.

Example:

| Event | Points |
|---|---:|
| Looking Away | +5 / +10 |
| Face Not Detected | +10 |
| Multiple Faces | +15 |
| Unexpected Speech | +30 |
| Tab Switch | +10 |
| Copy Attempt | +15 |
| Paste Attempt | +15 |
| Fullscreen Exit | +10 |
| Developer Tools Attempt | +25 |

The values can be configured according to the requirements of the examination.

---

# ⚠️ Threshold-Based Exam Termination

The system continuously evaluates the student's accumulated risk score.

For example:

```text
Copy Attempt        +15
Tab Switch           +10
Face Not Detected    +10
Unexpected Speech    +30
-------------------------
Total                 65
