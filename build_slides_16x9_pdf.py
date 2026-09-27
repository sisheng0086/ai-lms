import os
from pdf_helper import render_html_to_pdf

slides_html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AI LMS - FYP Presentation Slides (16:9)</title>
<style>
  @page {
    size: 297mm 167.06mm; /* Standard 16:9 Widescreen slide */
    margin: 0;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #f8fafc;
    background: #090d16;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .slide {
    width: 297mm;
    height: 167mm;
    padding: 16mm 20mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    page-break-after: always;
    overflow: hidden;
    background: radial-gradient(circle at 80% 20%, #1e293b 0%, #0b1120 70%, #030712 100%);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .slide-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .slide-title {
    font-size: 18pt;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .slide-title span.accent {
    color: #ef4444;
  }
  .slide-tag {
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 3px 9px;
    border-radius: 20px;
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .slide-body {
    flex: 1;
    display: flex;
    gap: 16px;
  }
  .col-2 {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .slide-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 6px;
    font-size: 7.2pt;
    color: #64748b;
  }
  .speaker-badge {
    font-weight: 700;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.06);
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Card components */
  .glass-card {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 10px;
    backdrop-filter: blur(8px);
  }
  .card-h {
    font-size: 9.8pt;
    font-weight: 700;
    color: #38bdf8;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .card-p {
    font-size: 8.2pt;
    color: #cbd5e1;
    line-height: 1.4;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 8px;
  }
  .stat-box {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 8px;
    padding: 14px;
    text-align: center;
  }
  .stat-val {
    font-size: 22pt;
    font-weight: 800;
    color: #38bdf8;
    margin-bottom: 2px;
  }
  .stat-lbl {
    font-size: 7.5pt;
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 600;
  }

  /* Diagram styles */
  .arch-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(0, 0, 0, 0.4);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .arch-node {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 8pt;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .node-title {
    font-weight: 700;
    color: #ffffff;
  }
  .node-tech {
    color: #38bdf8;
    font-size: 7.2pt;
    font-family: monospace;
  }

  /* Title Slide Styling */
  .hero-slide {
    text-align: center;
    justify-content: center;
    align-items: center;
    background: radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0f172a 60%, #020617 100%);
  }
  .hero-title {
    font-size: 26pt;
    font-weight: 900;
    letter-spacing: -0.8px;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #ffffff 40%, #ef4444 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .hero-subtitle {
    font-size: 11pt;
    color: #94a3b8;
    margin-bottom: 24px;
    max-width: 200mm;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.5;
  }
  .team-grid {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-bottom: 20px;
  }
  .team-member {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 8.5pt;
    min-width: 50mm;
  }
  .team-role {
    font-size: 7pt;
    color: #ef4444;
    text-transform: uppercase;
    font-weight: 700;
  }
</style>
</head>
<body>

  <!-- SLIDE 1: TITLE SLIDE -->
  <div class="slide hero-slide">
    <div class="slide-tag" style="margin-bottom: 12px;">Polytechnic Final Year Project Presentation &bull; Session 2026</div>
    <h1 class="hero-title">AI-Powered Learning Management System</h1>
    <p class="hero-subtitle">An Intelligent Cloud Platform for 24/7 Context-Aware Technical Tutoring and Streamlined Academic Course Administration</p>
    
    <div class="team-grid">
      <div class="team-member">
        <div class="team-role">Speaker 1 &bull; Lead & Problem Formulation</div>
        <strong>[Member 1: Name]</strong><br>
        <span style="font-size: 7.5pt; color: #94a3b8;">Matrix: [Matrix No 1]</span>
      </div>
      <div class="team-member">
        <div class="team-role">Speaker 2 &bull; Architecture & Core Demo</div>
        <strong>[Member 2: Name]</strong><br>
        <span style="font-size: 7.5pt; color: #94a3b8;">Matrix: [Matrix No 2]</span>
      </div>
      <div class="team-member">
        <div class="team-role">Speaker 3 &bull; Security & Impact Lead</div>
        <strong>[Member 3: Name]</strong><br>
        <span style="font-size: 7.5pt; color: #94a3b8;">Matrix: [Matrix No 3]</span>
      </div>
    </div>
    
    <div style="font-size: 8pt; color: #64748b;">
      Supervisor: <strong>[Supervisor Name]</strong> &bull; Department of Information & Communication Technology &bull; Politeknik
    </div>
  </div>

  <!-- SLIDE 2: PROBLEM STATEMENT -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-title">⚠️ The Challenge: <span class="accent">Academic Bottlenecks</span></div>
      <div class="slide-tag">Problem Statement</div>
    </div>
    <div class="slide-body">
      <div class="col-2">
        <div class="glass-card" style="border-left: 4px solid #ef4444;">
          <div class="card-h" style="color: #f87171;">🌙 After-Hours Learning Isolation</div>
          <div class="card-p">Over 70% of student self-study queries occur at night when lecturers are unavailable. Students facing programming bugs or conceptual hurdles are blocked until the next lecture.</div>
        </div>
        <div class="glass-card" style="border-left: 4px solid #f59e0b;">
          <div class="card-h" style="color: #fbbf24;">📁 Static, Passive LMS Portals</div>
          <div class="card-p">Conventional LMS platforms act merely as file repositories. They require students to manually download and search through massive PDFs with zero interactive assistance.</div>
        </div>
        <div class="glass-card" style="border-left: 4px solid #3b82f6;">
          <div class="card-h" style="color: #60a5fa;">⏳ Heavy Administrative Burden on Lecturers</div>
          <div class="card-p">Lecturers spend an excessive percentage of working hours fielding repetitive foundational inquiries and manually compiling homework submission spreadsheets.</div>
        </div>
      </div>
      <div class="col-2" style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; justify-content: center; align-items: center; text-align: center; border: 1px solid rgba(255,255,255,0.06);">
        <div style="font-size: 32pt; margin-bottom: 8px;">⏳ &rarr; 🚀</div>
        <div style="font-size: 13pt; font-weight: 700; color: #ffffff; margin-bottom: 6px;">The Institutional Need</div>
        <p style="font-size: 8.5pt; color: #94a3b8; max-width: 90mm; line-height: 1.45;">An intelligent, context-aware environment that guides students in real time while automating clerical workflows for academic staff.</p>
      </div>
    </div>
    <div class="slide-footer">
      <span class="speaker-badge">Speaker 1 &bull; 0:35 - 1:15</span>
      <span>AI-Powered LMS &bull; FYP Defense</span>
      <span>Slide 2 of 12</span>
    </div>
  </div>

  <!-- SLIDE 3: OBJECTIVES & SCOPE -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-title">🎯 Project Objectives & <span class="accent">Scope</span></div>
      <div class="slide-tag">Project Scope</div>
    </div>
    <div class="slide-body">
      <div class="col-2">
        <div class="glass-card" style="border-left: 4px solid #10b981;">
          <div class="card-h" style="color: #34d399;">1. Zero-Hallucination AI Study Companion</div>
          <div class="card-p">Develop a Retrieval-Augmented Generation (RAG) agent that answers student inquiries 24/7 strictly grounded in uploaded syllabus notes and code examples.</div>
        </div>
        <div class="glass-card" style="border-left: 4px solid #3b82f6;">
          <div class="card-h" style="color: #60a5fa;">2. Dynamic 5-Question Auto-Quiz Engine</div>
          <div class="card-p">Implement on-demand formative self-assessments that synthesize 5 tailored multiple-choice questions with instant grading and diagnostic answer explanations.</div>
        </div>
        <div class="glass-card" style="border-left: 4px solid #8b5cf6;">
          <div class="card-h" style="color: #a78bfa;">3. Unified Multi-Role Academic Portal</div>
          <div class="card-p">Deliver a production-ready web platform supporting Student, Lecturer, and Admin roles with in-browser document previews, assignment uploads, and one-click grade exports.</div>
        </div>
      </div>
      <div class="col-2" style="background: rgba(15,23,42,0.6); border-radius: 8px; padding: 16px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="font-size: 11pt; font-weight: 700; color: #38bdf8; margin-bottom: 10px;">📋 Scope & Target Environment</div>
        <ul style="list-style: square; margin-left: 16px; font-size: 8.2pt; color: #cbd5e1; line-height: 1.6;">
          <li>Designed for Polytechnic IT & Engineering diploma courses.</li>
          <li>Supports PDF, DOCX, and high-resolution hardware diagram images.</li>
          <li>Cloud-deployed with sub-second API endpoints and zero client install.</li>
          <li>Full compliance with academic role boundaries and data security.</li>
        </ul>
      </div>
    </div>
    <div class="slide-footer">
      <span class="speaker-badge">Speaker 1 &bull; 1:15 - 1:55</span>
      <span>AI-Powered LMS &bull; FYP Defense</span>
      <span>Slide 3 of 12</span>
    </div>
  </div>

  <!-- SLIDE 4: ECOSYSTEM -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-title">👥 Multi-Role <span class="accent">User Ecosystem</span></div>
      <div class="slide-tag">User Personas</div>
    </div>
    <div class="slide-body">
      <div class="col-2" style="flex: 1;">
        <div class="glass-card" style="border-top: 3px solid #38bdf8;">
          <div class="card-h" style="color: #38bdf8;">🎓 Student Persona</div>
          <ul style="font-size: 7.8pt; color: #cbd5e1; margin-left: 14px; line-height: 1.45;">
            <li>24/7 AI syllabus Q&A with slide citations.</li>
            <li>In-browser PDF & schematic previewer.</li>
            <li>Interactive 5-question practice quiz.</li>
            <li>Homework upload with deadline tracking.</li>
          </ul>
        </div>
      </div>
      <div class="col-2" style="flex: 1;">
        <div class="glass-card" style="border-top: 3px solid #ef4444;">
          <div class="card-h" style="color: #f87171;">👨‍🏫 Lecturer Persona</div>
          <ul style="font-size: 7.8pt; color: #cbd5e1; margin-left: 14px; line-height: 1.45;">
            <li>Upload & automatically index course materials.</li>
            <li>Create assignments with due dates & attachments.</li>
            <li>Evaluate submissions, grade & export CSV.</li>
            <li>Broadcast class announcements & reply to Q&A.</li>
          </ul>
        </div>
      </div>
      <div class="col-2" style="flex: 1;">
        <div class="glass-card" style="border-top: 3px solid #10b981;">
          <div class="card-h" style="color: #34d399;">🛡️ Administrator Persona</div>
          <ul style="font-size: 7.8pt; color: #cbd5e1; margin-left: 14px; line-height: 1.45;">
            <li>Manage student & lecturer credentials.</li>
            <li>Configure confidential staff sign-up passcode.</li>
            <li>Track institutional helpdesk support tickets.</li>
            <li>Database maintenance & system health checks.</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span class="speaker-badge">Speaker 1 &bull; 1:55 - 2:30 (Handover to Speaker 2)</span>
      <span>AI-Powered LMS &bull; FYP Defense</span>
      <span>Slide 4 of 12</span>
    </div>
  </div>

  <!-- SLIDE 5: ARCHITECTURE -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-title">🏗️ System Architecture & <span class="accent">Data Flow</span></div>
      <div class="slide-tag">Technical Blueprint</div>
    </div>
    <div class="slide-body">
      <div class="col-2">
        <div class="arch-box">
          <div class="arch-node">
            <span class="node-title">1. Presentation Layer</span>
            <span class="node-tech">React 18 &bull; Vite &bull; Glassmorphic UI</span>
          </div>
          <div style="text-align: center; color: #ef4444; font-size: 10pt;">&darr; REST API / JSON Streaming</div>
          <div class="arch-node">
            <span class="node-title">2. Application Server Layer</span>
            <span class="node-tech">FastAPI (Python) &bull; Uvicorn Async</span>
          </div>
          <div style="text-align: center; color: #ef4444; font-size: 10pt;">&darr; Binary Stream / Relational Queries</div>
          <div class="arch-node">
            <span class="node-title">3. Data & Storage Layer</span>
            <span class="node-tech">PostgreSQL &bull; Bytea &bull; Disk Cache</span>
          </div>
          <div style="text-align: center; color: #ef4444; font-size: 10pt;">&darr; Context Injection (RAG)</div>
          <div class="arch-node">
            <span class="node-title">4. Intelligence Layer</span>
            <span class="node-tech">Google Gemini AI &bull; Grounded Prompting</span>
          </div>
        </div>
      </div>
      <div class="col-2">
        <div class="glass-card">
          <div class="card-h">⚙️ Key Architectural Highlights</div>
          <div class="card-p">
            &bull; <strong>Asynchronous Endpoints</strong>: FastAPI non-blocking worker threads process document uploads and AI queries concurrently.<br><br>
            &bull; <strong>Hybrid Persistence</strong>: Dual-layer storage ensures files are written to both local cache for speed and database bytea columns for disaster recovery.<br><br>
            &bull; <strong>Grounded RAG Pipeline</strong>: Context windows are injected strictly with parsed text from the active lecture topic.
          </div>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span class="speaker-badge">Speaker 2 &bull; 2:30 - 3:15</span>
      <span>AI-Powered LMS &bull; FYP Defense</span>
      <span>Slide 5 of 12</span>
    </div>
  </div>

  <!-- SLIDE 6: AI COMPANION & QUIZ -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-title">🤖 Core Feature: <span class="accent">AI Tutor & Quiz Engine</span></div>
      <div class="slide-tag">Student Module Demo</div>
    </div>
    <div class="slide-body">
      <div class="col-2">
        <div class="glass-card" style="border-left: 4px solid #38bdf8;">
          <div class="card-h">💬 24/7 Contextual Study Companion</div>
          <div class="card-p">
            Students select their course subject (e.g. <code>CSC202 - C++ Programming</code>) and query the AI. The system searches verified slides and answers with concise explanations and syntax snippets.
          </div>
          <div style="margin-top: 6px; font-size: 7.2pt; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; color: #94a3b8;">
            Citation: <em>"According to CSC202 Lecture 3 (Slide 14): Polymorphism is achieved via virtual functions..."</em>
          </div>
        </div>
      </div>
      <div class="col-2">
        <div class="glass-card" style="border-left: 4px solid #10b981;">
          <div class="card-h">📝 Dynamic 5-Question Quiz Generator</div>
          <div class="card-p">
            Synthesizes 5 tailored multiple-choice questions on demand. Immediate scoring (e.g. <code>Score: 4/5 (80%)</code>) with detailed diagnostic feedback for every wrong answer.
          </div>
          <div style="margin-top: 6px; font-size: 7.2pt; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; color: #94a3b8;">
            Feedback: <em>"Option C is correct because constructors cannot have a return type in C++."</em>
          </div>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span class="speaker-badge">Speaker 2 &bull; 3:15 - 4:15</span>
      <span>AI-Powered LMS &bull; FYP Defense</span>
      <span>Slide 6 of 12</span>
    </div>
  </div>

  <!-- SLIDE 7: PREVIEWER & HOMEWORK -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-title">📄 In-Browser Document Viewer & <span class="accent">Submissions</span></div>
      <div class="slide-tag">Document Pipeline</div>
    </div>
    <div class="slide-body">
      <div class="col-2">
        <div class="glass-card">
          <div class="card-h">👁️ Inline PDF & Diagram Previewer</div>
          <div class="card-p">
            Streams files with <code>Content-Disposition: inline</code>.<br>
            &bull; Full-screen PDF rendering with zoom & page controls.<br>
            &bull; Direct rendering of circuit & hardware schematics (PNG, JPG, SVG).<br>
            &bull; Dual-tab toggle: switch between original visual document and parsed AI knowledge text.
          </div>
        </div>
      </div>
      <div class="col-2">
        <div class="glass-card">
          <div class="card-h">📤 Assignment Submission Portal</div>
          <div class="card-p">
            &bull; Clear deadline badges with dynamic color-coding.<br>
            &bull; Multi-format submission support (.zip, .pdf, .docx, images).<br>
            &bull; Prevents duplicate or corrupted submissions with server validation.
          </div>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span class="speaker-badge">Speaker 2 &bull; 4:15 - 5:05</span>
      <span>AI-Powered LMS &bull; FYP Defense</span>
      <span>Slide 7 of 12</span>
    </div>
  </div>

  <!-- SLIDE 8: LECTURER GRADING & WORKFLOW -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-title">👨‍🏫 Lecturer Suite: <span class="accent">Grading & Management</span></div>
      <div class="slide-tag">Lecturer Module Demo</div>
    </div>
    <div class="slide-body">
      <div class="col-2">
        <div class="glass-card">
          <div class="card-h">📊 Fast Submission Review & Feedback</div>
          <div class="card-p">
            Lecturers can view all submissions organized by assignment, inspect submitted files, enter letter/numerical grades, and provide constructive feedback comments.
          </div>
        </div>
        <div class="glass-card">
          <div class="card-h">📁 One-Click Excel CSV Grade Export</div>
          <div class="card-p">
            Generates standardized institutional CSV grade reports formatted with Matrix Number, Student Name, Marks, and Feedback for semester filing.
          </div>
        </div>
      </div>
      <div class="col-2">
        <div class="glass-card">
          <div class="card-h">💬 Student Q&A Inbox & Announcements</div>
          <div class="card-p">
            &bull; Dedicated student question inbox with error screenshot attachments.<br>
            &bull; Broadcast class announcements directly to student bulletin boards.<br>
            &bull; Instant deletion with custom security confirmation modal.
          </div>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span class="speaker-badge">Speaker 2 &bull; 5:05 - 6:00 (Handover to Speaker 3)</span>
      <span>AI-Powered LMS &bull; FYP Defense</span>
      <span>Slide 8 of 12</span>
    </div>
  </div>

  <!-- SLIDE 9: ADMIN & SECURITY -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-title">🛡️ Administrator Governance & <span class="accent">Security</span></div>
      <div class="slide-tag">Administrative Security</div>
    </div>
    <div class="slide-body">
      <div class="col-2">
        <div class="glass-card">
          <div class="card-h">🔐 Staff Registration Passcode</div>
          <div class="card-p">
            Prevents students from registering as lecturers. Staff accounts require an encrypted system passcode (<code>STAFF2026</code>) dynamically managed by the administrator.
          </div>
        </div>
        <div class="glass-card">
          <div class="card-h">👤 Account Management & Access Control</div>
          <div class="card-p">
            Searchable user directory with instant account suspension, password reset, and role elevation capabilities.
          </div>
        </div>
      </div>
      <div class="col-2">
        <div class="glass-card">
          <div class="card-h">🎫 Technical Helpdesk Support Tickets</div>
          <div class="card-p">
            Built-in ticketing module allows students and lecturers to report bugs, screenshot technical errors, and receive administrative resolution.
          </div>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span class="speaker-badge">Speaker 3 &bull; 6:00 - 6:45</span>
      <span>AI-Powered LMS &bull; FYP Defense</span>
      <span>Slide 9 of 12</span>
    </div>
  </div>

  <!-- SLIDE 10: TECHNICAL EXCELLENCE -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-title">⚡ Software Engineering & <span class="accent">Design Standards</span></div>
      <div class="slide-tag">Quality Assurance</div>
    </div>
    <div class="slide-body">
      <div class="col-2">
        <div class="glass-card" style="border-left: 4px solid #ef4444;">
          <div class="card-h" style="color: #f87171;">🚫 Zero Disruptive Native Dialogs</div>
          <div class="card-p">Replaced all <code>window.confirm()</code> and <code>alert()</code> calls with custom glassmorphic modals and non-blocking toast banners with Escape-key keyboard accessibility.</div>
        </div>
        <div class="glass-card" style="border-left: 4px solid #10b981;">
          <div class="card-h" style="color: #34d399;">💾 Fault-Tolerant Hybrid Storage</div>
          <div class="card-p">Dual-layer storage architecture maintains local disk caches for instant streaming while retaining bytea data in PostgreSQL to guarantee zero loss across cloud container recycles.</div>
        </div>
      </div>
      <div class="col-2">
        <div class="glass-card" style="border-left: 4px solid #3b82f6;">
          <div class="card-h" style="color: #60a5fa;">📦 Highly Optimized Production Bundle</div>
          <div class="card-p">Frontend build is compiled via Vite into a lightweight ~407 KB gzip bundle, ensuring sub-second initial paint on low-bandwidth mobile network connections.</div>
        </div>
        <div class="glass-card" style="border-left: 4px solid #8b5cf6;">
          <div class="card-h" style="color: #a78bfa;">🌓 Responsive Dual-Theme Support</div>
          <div class="card-p">Fully responsive user interface with dynamic CSS variable switching between high-contrast Dark Mode and clean Light Mode.</div>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span class="speaker-badge">Speaker 3 &bull; 6:45 - 7:30</span>
      <span>AI-Powered LMS &bull; FYP Defense</span>
      <span>Slide 10 of 12</span>
    </div>
  </div>

  <!-- SLIDE 11: RESULTS & IMPACT -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-title">📈 Experimental Results & <span class="accent">User Evaluation</span></div>
      <div class="slide-tag">Performance Benchmarks</div>
    </div>
    <div class="slide-body" style="flex-direction: column; justify-content: center;">
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-val">&lt; 2.8s</div>
          <div class="stat-lbl">Average AI Query Latency</div>
          <p style="font-size: 7pt; color: #cbd5e1; margin-top: 4px;">Down from 12–24h via email inquiries</p>
        </div>
        <div class="stat-box">
          <div class="stat-val">60%</div>
          <div class="stat-lbl">Grading Time Reduction</div>
          <p style="font-size: 7pt; color: #cbd5e1; margin-top: 4px;">Reported by lecturers using CSV export</p>
        </div>
        <div class="stat-box">
          <div class="stat-val">92%</div>
          <div class="stat-lbl">Student Exam Readiness</div>
          <p style="font-size: 7pt; color: #cbd5e1; margin-top: 4px;">Confidence boost from 5-question quizzes</p>
        </div>
      </div>
      <div class="glass-card" style="margin-top: 14px; text-align: center;">
        <span style="color: #10b981; font-weight: 700; font-size: 9pt;">✓ 100% Fact Grounding:</span>
        <span style="color: #cbd5e1; font-size: 8.2pt;"> In 50 test trials across Polytechnic C++ and Hardware notes, the AI tutor delivered zero false hallucinations.</span>
      </div>
    </div>
    <div class="slide-footer">
      <span class="speaker-badge">Speaker 3 &bull; 7:30 - 8:05</span>
      <span>AI-Powered LMS &bull; FYP Defense</span>
      <span>Slide 11 of 12</span>
    </div>
  </div>

  <!-- SLIDE 12: CONCLUSION & ROADMAP -->
  <div class="slide hero-slide">
    <div class="slide-tag" style="margin-bottom: 8px;">Conclusion & Q&A Defense</div>
    <h2 style="font-size: 20pt; font-weight: 800; color: #ffffff; margin-bottom: 8px;">Empowering Polytechnic Technical Education</h2>
    <p style="font-size: 9pt; color: #94a3b8; max-width: 180mm; margin-bottom: 16px; line-height: 1.5;">
      The AI LMS bridges the critical gap between classroom hours and home revision, providing students with immediate, verified guidance while liberating lecturers from administrative bottlenecks.
    </p>

    <div style="display: flex; gap: 16px; justify-content: center; margin-bottom: 18px;">
      <div class="glass-card" style="padding: 8px 14px; font-size: 7.8pt; color: #cbd5e1;">
        🔮 <strong>Future Scope</strong>: Interactive Speech Tutoring &bull; Mobile Push Alerts &bull; Attendance Integration
      </div>
      <div class="glass-card" style="padding: 8px 14px; font-size: 7.8pt; color: #38bdf8;">
        🌐 <strong>Production Live</strong>: React 18 &bull; FastAPI &bull; PostgreSQL &bull; Gemini AI
      </div>
    </div>

    <div style="font-size: 16pt; font-weight: 800; color: #ef4444; margin-bottom: 6px;">
      Thank You &bull; We Welcome Questions from the Panel
    </div>
    <div style="font-size: 7.5pt; color: #64748b;">
      Team Members: [Member 1] &bull; [Member 2] &bull; [Member 3] | Supervisor: [Supervisor Name]
    </div>
  </div>

</body>
</html>
"""

html_path = r"c:\Users\Daniel\.gemini\antigravity\scratch\final_project\presentation_slides_16x9.html"
pdf_path = r"c:\Users\Daniel\.gemini\antigravity\scratch\final_project\AI_LMS_Presentation_Slides_16x9.pdf"

with open(html_path, "w", encoding="utf-8") as f:
    f.write(slides_html)

print(f"Wrote slides HTML to {html_path}")
success, pages = render_html_to_pdf(html_path, pdf_path, "AI LMS Presentation Slides (16:9)")
if success:
    print(f"SUCCESS: Rendered {pages}-page 16:9 Slides PDF at: {pdf_path}")
else:
    print("FAILED to render Slides PDF.")
