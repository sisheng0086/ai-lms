import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import ProfilePictureUploader from '../components/ProfilePictureUploader';
import RevisionFlashcardsModal from '../components/RevisionFlashcardsModal';
import StudentStudyProgressWidget from '../components/StudentStudyProgressWidget';
import FormattedChatMessage from '../components/FormattedChatMessage';
import StudentTimetableWidget, { POLITEKNIK_TIMETABLE_DATA } from '../components/StudentTimetableWidget';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getAvatarUrl = (path, apiUrl) => {
  if (!path) return null;
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${apiUrl}${path}`;
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notes state (fetched from real database)
  const [notesList, setNotesList] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [notesContent, setNotesContent] = useState('');
  const [noteContentsMap, setNoteContentsMap] = useState({});
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');

  // Assignments & Homework state
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [submissionFiles, setSubmissionFiles] = useState({});
  const [submissionComments, setSubmissionComments] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [submitMessage, setSubmitMessage] = useState({});

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);

  // In-Browser Note / PDF Previewer state
  const [previewNote, setPreviewNote] = useState(null);
  const [previewNoteContent, setPreviewNoteContent] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [chatFontSize, setChatFontSize] = useState('0.92rem');

  // Flashcards & Quick Ask Menu states
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  const [quickAskMenuOpen, setQuickAskMenuOpen] = useState(false);

  // Contact & Support state (Lecturer Q&A + Admin Tech Support)
  const [contactSubTab, setContactSubTab] = useState('lecturer'); // 'lecturer' | 'admin'
  const [lecturersList, setLecturersList] = useState([]);
  const [selectedLecturerId, setSelectedLecturerId] = useState('');
  const [studentClassName, setStudentClassName] = useState('');
  const [contactSubjectCode, setContactSubjectCode] = useState('');
  const [lecturerQuestionText, setLecturerQuestionText] = useState('');
  const [lecturerImageData, setLecturerImageData] = useState(null);
  const [sendingLecturerMsg, setSendingLecturerMsg] = useState(false);
  const [lecturerContactFeedback, setLecturerContactFeedback] = useState({ type: '', text: '' });
  const [myLecturerMessages, setMyLecturerMessages] = useState([]);
  const [refreshingContact, setRefreshingContact] = useState(false);

  // Admin Support state
  const [adminCategory, setAdminCategory] = useState('System / Technical Error');
  const [adminPriority, setAdminPriority] = useState('Normal');
  const [adminSubject, setAdminSubject] = useState('');
  const [adminDescription, setAdminDescription] = useState('');
  const [adminImageData, setAdminImageData] = useState(null);
  const [sendingAdminTicket, setSendingAdminTicket] = useState(false);
  const [adminTicketFeedback, setAdminTicketFeedback] = useState({ type: '', text: '' });
  const [myAdminTickets, setMyAdminTickets] = useState([]);

  // Activity Notifications state
  const [notifOpen, setNotifOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('student_read_notifs') || '[]');
    } catch {
      return [];
    }
  });

  // AI chat states
  const [messages, setMessages] = useState([
    {
      text: "Hai! 👋 I am your AI Study Companion!\n\n💡 **Don't know which chapter or note has your answer?** No problem! You don't need to guess chapters — simply ask your question in your own words (e.g. *\"basic coding for C++\"*, *\"explain firewalls and DMZ\"*, or *\"what are CPU sockets\"*), and I will automatically find the right note and answer it for you!\n\nYou can also click any course chip or Quick Ask topic below to start studying.",
      sender: "bot"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lecturerVoice, setLecturerVoice] = useState("male");

  // 5-Question Quiz states
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizSelections, setQuizSelections] = useState({});
  const [quizBannerMessage, setQuizBannerMessage] = useState("");

  const loadNoteContent = useCallback(async (noteId) => {
    try {
      const res = await fetch(`${API_URL}/notes/${noteId}/content`);
      if (res.ok) {
        const data = await res.json();
        const contentStr = data.content || "";
        setNotesContent(contentStr);
        setNoteContentsMap(prev => ({ ...prev, [noteId]: contentStr }));
        return contentStr;
      }
    } catch (err) {
      console.error("Failed to load note content:", err);
    }
    return "";
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoadingNotes(true);
    try {
      const response = await fetch(`${API_URL}/notes`);
      if (response.ok) {
        const data = await response.json();
        const list = data.notes || [];
        setNotesList(list);
        if (list.length > 0) {
          setSelectedNoteId(list[0].id);
          loadNoteContent(list[0].id);
          // Preload all note contents in background so AI can detect any chapter across all notes
          list.forEach(async (n) => {
            try {
              const r = await fetch(`${API_URL}/notes/${n.id}/content`);
              if (r.ok) {
                const d = await r.json();
                setNoteContentsMap(prev => ({ ...prev, [n.id]: d.content || "" }));
              }
            } catch {
              // ignore preload errors
            }
          });
        } else {
          setNotesContent('');
        }
      }
    } catch (err) {
      console.error('Failed to fetch notes', err);
    } finally {
      setLoadingNotes(false);
    }
  }, [loadNoteContent]);

  const fetchAssignments = useCallback(async (studentId) => {
    if (!studentId) return;
    setLoadingAssignments(true);
    try {
      const res = await fetch(`${API_URL}/assignments/student/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setAssignmentsList(data.assignments || []);
      }
    } catch (err) {
      console.error('Failed to fetch assignments', err);
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  const fetchContactData = useCallback(async (studentId) => {
    if (!studentId) return;
    try {
      const [lecRes, msgRes, tickRes] = await Promise.all([
        fetch(`${API_URL}/lecturers`),
        fetch(`${API_URL}/contact/lecturer/student/${studentId}`),
        fetch(`${API_URL}/contact/admin/user/${studentId}`)
      ]);
      if (lecRes.ok) {
        const d = await lecRes.json();
        setLecturersList(d.lecturers || []);
      }
      if (msgRes.ok) {
        const d = await msgRes.json();
        setMyLecturerMessages(d.messages || []);
      }
      if (tickRes.ok) {
        const d = await tickRes.json();
        setMyAdminTickets(d.tickets || []);
      }
    } catch (err) {
      console.error("Failed to load contact data:", err);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/announcements`);
      if (res.ok) {
        const d = await res.json();
        setAnnouncements(d.announcements || []);
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
    }
  }, []);

  const handleClearChat = () => {
    setMessages([
      {
        text: "Hai! 👋 I am AI to help you, if you have any question you can ask me! Your chat history has been cleared.",
        sender: "bot"
      }
    ]);
  };

  const handleExportStudyNotes = () => {
    const activeNote = notesList.find(n => String(n.id) === String(selectedNoteId)) || notesList[0];
    const header = `========================================================================\nAI-LMS STUDY COMPANION - EXPORTED REVISION NOTES\nSubject: ${activeNote?.subject_code || 'General'} - ${activeNote?.title || 'Lecture Notes'}\nDate: ${new Date().toLocaleString()}\nStudent: ${user?.full_name || 'Student'} (Matrix No: ${user?.matrix_no || 'N/A'})\n========================================================================\n\n`;
    const body = messages.map(m => `[${m.sender === 'user' ? 'STUDENT QUESTION' : 'AI STUDY COMPANION'}]\n${m.text}\n------------------------------------------------------------------------\n`).join('\n');
    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Study_Notes_${activeNote?.subject_code || 'AI'}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenPreviewNote = async (noteOrId, fallbackTitle = '', targetPage = 1) => {
    let noteObj;
    if (typeof noteOrId === 'object' && noteOrId !== null) {
      noteObj = noteOrId;
    } else {
      const found = notesList.find(n => String(n.id) === String(noteOrId));
      noteObj = found || { id: noteOrId, title: fallbackTitle, file_name: fallbackTitle };
    }
    setPreviewPage(targetPage || 1);
    setPreviewNote(noteObj);
    setLoadingPreview(true);
    setPreviewNoteContent('');
    try {
      const res = await fetch(`${API_URL}/notes/content/${noteObj.id}`);
      if (res.ok) {
        const d = await res.json();
        setPreviewNoteContent(d.content || 'No text content available for this note.');
      }
    } catch {
      setPreviewNoteContent('Error loading note content.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExportSummaryPdf = () => {
    const activeNote = notesList.find(n => String(n.id) === String(selectedNoteId)) || notesList[0];
    const subjectCode = activeNote?.subject_code || 'COURSE';
    const noteTitle = activeNote?.title || 'Lecture Note';
    const studentName = user?.full_name || 'Politeknik Student';
    const matrixNo = user?.matrix_no || 'N/A';
    const dateStr = new Date().toLocaleDateString('en-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const rawNoteText = cleanPdfExtractedText(noteContentsMap[activeNote?.id] || notesContent || '');
    const noteSections = buildLogicalSections(rawNoteText)
      .filter(s => s.trim().length > 25)
      .slice(0, 4);

    const cardsHtml = noteSections.length >= 2
      ? noteSections.map((sec, i) => `
        <div class="card">
          <h4>📌 High-Yield Topic ${i + 1}</h4>
          ${sec.slice(0, 260)}${sec.length > 260 ? '...' : ''}
        </div>
      `).join('')
      : `
        <div class="card">
          <h4>📌 Core Subject Principles</h4>
          Foundational concepts, structural architecture, and primary definitions for ${subjectCode} (${noteTitle}).
        </div>
        <div class="card">
          <h4>⚙️ Practical Implementation</h4>
          Applied methodology, configuration protocols, and lab problem-solving standards.
        </div>
        <div class="card">
          <h4>🔍 Key Definitions & Standards</h4>
          Essential terminology, performance optimization guidelines, and industry standards.
        </div>
        <div class="card">
          <h4>📝 Exam Revision & Assessment</h4>
          High-yield review topics and practical assessment preparation for continuous evaluation.
        </div>
      `;

    const recentQAs = messages
      .filter(m => m.sender === 'bot' && !m.text.includes('Hai! 👋') && !m.text.includes('cleared'))
      .slice(-4)
      .map(m => {
        const clean = m.text
          .replace(/[*#_`]/g, '')
          .split('\n')
          .filter(l => l.trim().length > 0)
          .slice(0, 6)
          .join('<br/>• ');
        return `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:10px 14px; margin-bottom:10px;">
            <div style="font-size:8pt; font-weight:700; color:#0284c7; text-transform:uppercase; margin-bottom:4px;">
              📌 ${m.source || 'AI Study Companion Notes'}
            </div>
            <div style="font-size:9pt; color:#334155; line-height:1.5;">
              • ${clean}
            </div>
          </div>
        `;
      })
      .join('');

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to export the PDF revision sheet.');
      return;
    }

    printWin.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>AI-LMS Revision Study Sheet - ${subjectCode}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      padding: 0;
      margin: 0;
      background: #ffffff;
      font-size: 10pt;
    }
    .banner {
      border-bottom: 3px double #0284c7;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .inst-title { font-size: 15pt; font-weight: 800; color: #0369a1; margin: 0; }
    .inst-sub { font-size: 8.5pt; color: #64748b; font-weight: 600; margin-top: 2px; }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 14px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      font-size: 8.5pt;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #0284c7;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 14px 0 8px;
    }
    .summary-box {
      background: #f0f9ff;
      border-left: 4px solid #0284c7;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      font-size: 9pt;
      margin-bottom: 12px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .card {
      background: #fcfcfc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 8.5pt;
    }
    .card h4 { margin: 0 0 4px; color: #1e293b; font-size: 9pt; }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 20px;
      font-size: 8pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      .no-print { display: none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#0284c7; color:#fff; padding:10px 16px; margin-bottom:14px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
    <span>📄 <strong>Politeknik Kuching Sarawak</strong> — Exam Revision Sheet Ready</span>
    <button onclick="window.print()" style="background:#fff; color:#0284c7; border:none; padding:6px 16px; border-radius:4px; font-weight:bold; cursor:pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <div class="banner">
    <div>
      <h1 class="inst-title">POLITEKNIK KUCHING SARAWAK</h1>
      <div class="inst-sub">AI-LMS FINAL YEAR PROJECT STUDY COMPANION • OFFICIAL REVISION SHEET</div>
    </div>
    <div style="text-align:right; font-size:8pt; color:#64748b;">
      <div><strong>Document:</strong> Exam Revision Guide</div>
      <div><strong>Date:</strong> ${dateStr}</div>
    </div>
  </div>

  <div class="meta-box">
    <div><strong>Course:</strong> ${subjectCode} — ${noteTitle}</div>
    <div><strong>Student Name:</strong> ${studentName}</div>
    <div><strong>Matrix Number:</strong> ${matrixNo}</div>
    <div><strong>Department:</strong> Jabatan Teknologi Maklumat & Komunikasi (JTMK)</div>
  </div>

  <div class="section-title">📌 Executive Summary & Key Course Objectives</div>
  <div class="summary-box">
    <strong>Overview:</strong> This structured study guide synthesizes key lecture note concepts, technical architectures, and high-yield examinable topics for <strong>${subjectCode} — ${noteTitle}</strong>. Prepared for Politeknik final examinations and continuous assessments.
  </div>

  <div class="section-title">💡 High-Yield Core Examinable Topics</div>
  <div class="grid-2">
    ${cardsHtml}
  </div>

  ${recentQAs ? `
    <div class="section-title">❓ Session Q&A Key Points (From AI Tutor)</div>
    ${recentQAs}
  ` : ''}

  <div class="footer">
    <div>AI-LMS Study Companion • Politeknik Kuching Sarawak</div>
    <div>Page 1 of 1 • Official Academic Revision Document</div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => { window.print(); }, 400);
    });
  </script>
</body>
</html>
    `);
    printWin.document.close();
  };

  const handleOpenPreviewAssignment = async (assignment) => {
    if (!assignment) return;
    const assignObj = {
      id: assignment.id,
      is_assignment: true,
      subject_code: assignment.subject_code,
      title: assignment.title,
      file_name: assignment.file_name || `Assignment_${assignment.subject_code || 'Task'}_${assignment.id}.pdf`,
      viewUrl: `${API_URL}/assignments/${assignment.id}/view`,
      downloadUrl: `${API_URL}/assignments/${assignment.id}/download`,
    };
    setPreviewNote(assignObj);
    setLoadingPreview(true);
    setPreviewNoteContent('');
    try {
      const res = await fetch(`${API_URL}/assignments/${assignment.id}/content`);
      if (res.ok) {
        const d = await res.json();
        setPreviewNoteContent(d.content || assignment.description || 'No instruction text available.');
      } else {
        setPreviewNoteContent(assignment.description || `Assignment: ${assignment.title}`);
      }
    } catch {
      setPreviewNoteContent(assignment.description || `Assignment: ${assignment.title}`);
    } finally {
      setLoadingPreview(false);
    }
  };

  const renderDeadlineBadge = (dueDate, isSubmitted) => {
    if (isSubmitted) {
      return (
        <span style={{ background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', padding: '5px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
          ✅ Submitted
        </span>
      );
    }
    if (!dueDate) {
      return (
        <span style={{ background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', padding: '5px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
          ⏳ Pending Submission
        </span>
      );
    }
    const dueTime = new Date(dueDate).getTime();
    if (isNaN(dueTime)) {
      return (
        <span style={{ background: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8', padding: '5px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
          📅 Due: {dueDate}
        </span>
      );
    }
    const diffDays = Math.ceil((dueTime - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return (
        <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '5px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
          🔴 Overdue ({Math.abs(diffDays)}d ago)
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '5px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
          ⚠️ Due Today!
        </span>
      );
    }
    if (diffDays <= 3) {
      return (
        <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '5px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
          ⏳ Due in {diffDays} day{diffDays > 1 ? 's' : ''}
        </span>
      );
    }
    return (
      <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '5px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
        📅 Due in {diffDays} days
      </span>
    );
  };

  const getDeadlineBadge = renderDeadlineBadge;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'student') {
      navigate('/lecturer');
      return;
    }
    setUser(parsedUser);
    fetchNotes();
    fetchAssignments(parsedUser.id);
    fetchContactData(parsedUser.id);
    fetchAnnouncements();

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [navigate, fetchNotes, fetchAssignments, fetchContactData, fetchAnnouncements]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const triggerMobileSafeDownload = (url, fallbackFilename = '') => {
    const link = document.createElement('a');
    link.href = url;
    if (fallbackFilename) {
      link.setAttribute('download', fallbackFilename);
    } else {
      link.setAttribute('download', '');
    }
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadNote = (noteId) => {
    const found = notesList.find(n => String(n.id) === String(noteId));
    triggerMobileSafeDownload(`${API_URL}/notes/${noteId}/download`, found?.file_name || '');
  };

  const handleDownloadAssignmentFile = (assignmentId) => {
    const found = assignmentsList.find(a => String(a.id) === String(assignmentId));
    triggerMobileSafeDownload(`${API_URL}/assignments/${assignmentId}/download`, found?.file_name || '');
  };

  const handleHomeworkSubmit = async (assignmentId) => {
    const file = submissionFiles[assignmentId];
    if (!file) {
      setSubmitMessage(prev => ({ ...prev, [assignmentId]: { type: 'error', text: 'Please select a homework file to upload first.' } }));
      return;
    }

    setSubmittingId(assignmentId);
    setSubmitMessage(prev => ({ ...prev, [assignmentId]: { type: 'info', text: 'Uploading homework...' } }));

    const formData = new FormData();
    formData.append('student_id', user.id);
    formData.append('comment', submissionComments[assignmentId] || '');
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitMessage(prev => ({ ...prev, [assignmentId]: { type: 'success', text: '✅ Homework submitted successfully!' } }));
        setSubmissionFiles(prev => ({ ...prev, [assignmentId]: null }));
        fetchAssignments(user.id);
      } else {
        setSubmitMessage(prev => ({ ...prev, [assignmentId]: { type: 'error', text: `❌ ${data.detail || 'Submission failed'}` } }));
      }
    } catch (err) {
      console.error(err);
      setSubmitMessage(prev => ({ ...prev, [assignmentId]: { type: 'error', text: '❌ Network error submitting homework.' } }));
    } finally {
      setSubmittingId(null);
    }
  };

  // Convert uploaded image file to compressed Base64 data URL for fast database storage
  const handleSelectImage = (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawDataUrl = ev.target?.result;
      if (!rawDataUrl) return;
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 900;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setter(compressed);
        } catch {
          setter(rawDataUrl);
        }
      };
      img.onerror = () => setter(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRefreshContact = async () => {
    if (!user) return;
    setRefreshingContact(true);
    await Promise.all([
      fetchContactData(user.id),
      fetchAssignments(user.id),
      fetchNotes()
    ]);
    setTimeout(() => setRefreshingContact(false), 350);
  };

  const handleSendLecturerQuestion = async (e) => {
    e.preventDefault();
    if (!studentClassName.trim() || !lecturerQuestionText.trim()) {
      setLecturerContactFeedback({ type: 'error', text: 'Please enter your Class (e.g. DDT4A) and your question.' });
      return;
    }

    setSendingLecturerMsg(true);
    setLecturerContactFeedback({ type: '', text: '' });

    try {
      const res = await fetch(`${API_URL}/contact/lecturer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          lecturer_id: selectedLecturerId ? Number(selectedLecturerId) : null,
          class_name: studentClassName.trim(),
          subject_code: contactSubjectCode.trim() || 'General',
          question: lecturerQuestionText.trim(),
          image_data: lecturerImageData || null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setLecturerContactFeedback({
          type: 'success',
          text: '✅ Your question has been sent to the lecturer with your Name, Matrix No, and Class!'
        });
        setLecturerQuestionText('');
        setLecturerImageData('');
        fetchContactData(user.id);
      } else {
        setLecturerContactFeedback({ type: 'error', text: data.detail || 'Failed to send question.' });
      }
    } catch {
      setLecturerContactFeedback({ type: 'error', text: 'Network error sending message.' });
    } finally {
      setSendingLecturerMsg(false);
    }
  };

  const handleSendAdminTicket = async (e) => {
    e.preventDefault();
    if (!adminSubject.trim() || !adminDescription.trim()) {
      setAdminTicketFeedback({ type: 'error', text: 'Please provide both an error title and description.' });
      return;
    }

    setSendingAdminTicket(true);
    setAdminTicketFeedback({ type: '', text: '' });

    try {
      const res = await fetch(`${API_URL}/contact/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          user_role: user.role,
          category: adminCategory,
          priority: adminPriority,
          subject: adminSubject.trim(),
          description: adminDescription.trim(),
          image_data: adminImageData || null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminTicketFeedback({
          type: 'success',
          text: '🛠️ System/Technical support ticket submitted to Admin! Our technical team will review and fix it.'
        });
        setAdminSubject('');
        setAdminDescription('');
        setAdminImageData('');
        fetchContactData(user.id);
      } else {
        setAdminTicketFeedback({ type: 'error', text: data.detail || 'Failed to submit ticket.' });
      }
    } catch {
      setAdminTicketFeedback({ type: 'error', text: 'Network error submitting support ticket.' });
    } finally {
      setSendingAdminTicket(false);
    }
  };

  const handleNoteChange = (e) => {
    const noteId = e.target.value;
    setSelectedNoteId(noteId);
    loadNoteContent(noteId);
  };

  // Helper to ensure every note (even scanned PDFs or legacy notes) has a rich, structured study guide
  const buildClientStudyGuide = useCallback((note) => {
    const subjectCode = note?.subject_code || "COURSE";
    const title = note?.title || "Chapter 1";
    const cleanFile = (note?.file_name || "Course Material")
      .replace(/\.pdf$/i, "")
      .replace(/\.html$/i, "")
      .replace(/-print/gi, "")
      .replace(/\.dc/gi, "")
      .replace(/_/g, " ")
      .trim();

    return [
      `1.1 Main Purpose & Introduction: The main purpose of ${title} (${cleanFile}) in course ${subjectCode} is to establish the foundational core concepts, learning objectives, and structured framework for this topic. It guides students on understanding fundamental principles of ${subjectCode} and preparing for assignments and lab assessments.`,
      `1.2 Core Learning Objectives: By studying ${title} (${cleanFile}), students will be able to: (1) Understand the primary purpose, scope, and technical context of ${cleanFile} in ${subjectCode}; (2) Identify key definitions, technical mechanisms, and standard methodologies; and (3) Apply the fundamental principles of ${title} to practical lab exercises, problem-solving, and coursework.`,
      `1.3 Key Concepts & Section Breakdown: Section 1 covers foundational principles and system overview. Section 2 focuses on core operations, syntax or architecture, and step-by-step problem solving in ${subjectCode}. Section 3 highlights best practices, error prevention, security or optimization standards, and practical implementation.`,
      `1.4 Practical Coursework Guidelines: Students should study the theoretical explanations and verify code/hardware/network configurations through hands-on lab practice. Ensure your Matrix Number, Class Section, and Subject Code (${subjectCode}) are included in all submissions.`,
      `1.5 Chapter Summary & Key Takeaways: In summary, ${title} (${cleanFile}) serves as the essential blueprint for mastering ${subjectCode}, ensuring students understand both the theoretical principles and practical application.`
    ].join("\n\n");
  }, []);

  // =========================================================================
  // =========================================================================
  // SMART AI CHAPTER INFO, SUMMARY NOTE GENERATOR & DEEP DETAIL DETECTION
  // =========================================================================
  const cleanPdfExtractedText = useCallback((raw) => {
    if (!raw) return "";
    return raw
      .replace(/Transpor\s*tTCP/gi, "Transport: TCP")
      .replace(/TCP\s*R\s*eset\s*A\s*ttack/gi, "TCP Reset Attack")
      .replace(/K\s*ey/gi, "Key")
      .replace(/Firew\s*all/gi, "Firewall")
      .replace(/P\s*erimeter/gi, "Perimeter")
      .replace(/Securit\s*y/gi, "Security")
      .replace(/Netw\s*ork/gi, "Network");
  }, []);

  // Groups raw extracted PDF lines into logical multi-sentence page/topic sections
  const buildLogicalSections = useCallback((cleanedText) => {
    if (!cleanedText) return [];
    // Split by explicit [Page X] or standard page breaks
    const rawPages = cleanedText.split(/(?=\[Page \d+\])/i);
    const sections = [];

    for (const chunk of rawPages) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;
      // Join single-line PDF wraps into readable sentences while keeping section headers
      const lines = trimmed
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith("Title:") && !l.startsWith("Filename:"));

      if (lines.length === 0) continue;

      // Group lines into blocks of ~6-10 lines so every match has full surrounding context
      let currentBlock = [];
      let currentLen = 0;
      for (const line of lines) {
        currentBlock.push(line);
        currentLen += line.length;
        if (currentLen >= 420) {
          sections.push(currentBlock.join(" "));
          currentBlock = [];
          currentLen = 0;
        }
      }
      if (currentBlock.length > 0) {
        sections.push(currentBlock.join(" "));
      }
    }
    return sections;
  }, []);

  const simplifyNoteExcerpt = useCallback((scoredSections, targetNote, userQuery = "") => {
    // 1. Clean raw artifacts from the scored sections
    const cleanedSnippets = (scoredSections || []).slice(0, 3).map(s => {
      let t = s.text || "";
      // Strip URLs (file:/// or http:// or https://)
      t = t.replace(/file:\/\/\/[^\s]+/gi, '');
      t = t.replace(/https?:\/\/[^\s]+/gi, '');
      // Strip dates & timestamps like "9/28/26, 12:28 AM" or "2026-09-28"
      t = t.replace(/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4},?\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?/gi, '');
      // Strip page numbering artifacts: "Page 1 of 5", "1/3", "[Page 2]"
      t = t.replace(/\bpage\s+\d+(\s+of\s+\d+)?\b/gi, '');
      t = t.replace(/\b\d+\s*\/\s*\d+\b/g, '');
      t = t.replace(/\[\s*page\s*\d+\s*\]/gi, '');
      // Strip OCR/table boundary symbols: ▼, ▲, ►, ◄, |, ▪, ▫, etc.
      t = t.replace(/[▼▲►◄|▪▫◆◇■□]/g, ' ');
      // Normalize whitespace
      t = t.replace(/\s+/g, ' ').trim();
      return t;
    }).filter(t => t.length > 20);

    // 2. Extract key sentences for digestible bullet points
    const sentences = [];
    for (const snip of cleanedSnippets) {
      const splitSentences = snip.split(/(?<=[.!?])\s+/);
      for (const sent of splitSentences) {
        const trimmed = sent.trim();
        if (trimmed.length >= 25 && trimmed.length <= 280 && !sentences.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
          sentences.push(trimmed);
        }
        if (sentences.length >= 4) break;
      }
      if (sentences.length >= 4) break;
    }

    // 3. Domain-aware intuitive simplification
    const queryLower = (userQuery || "").toLowerCase();
    let simpleWordsIntro = "";
    if (/compile|compiler|g\+\+|build|execute/i.test(queryLower)) {
      simpleWordsIntro = "A compiler is like a translator: it translates your human-written C++ code into binary machine code (0s and 1s) that the CPU processor can execute directly.";
    } else if (/firewall|perimeter|dmz/i.test(queryLower)) {
      simpleWordsIntro = "A firewall is like a building security guard: it inspects every visitor pass (packet header) and blocks unauthorized intruders from entering private rooms (internal LAN).";
    } else if (/syn|flood|dos|ddos/i.test(queryLower)) {
      simpleWordsIntro = "A SYN flood is like someone calling a restaurant over and over, keeping all phone lines busy so real customers cannot call in to order food.";
    } else if (/pointer|address|memory/i.test(queryLower)) {
      simpleWordsIntro = "A pointer does not store data directly; it stores the memory address (like a street house number) of where data lives in computer RAM.";
    } else if (/cpu|socket|processor/i.test(queryLower)) {
      simpleWordsIntro = "The CPU is the brain of the computer. The socket is the physical seat where the CPU connects securely to the motherboard pins.";
    } else if (/ram|rom|ddr/i.test(queryLower)) {
      simpleWordsIntro = "RAM is a fast working desk that gets wiped clean when power turns off (volatile). ROM is the permanent stone tablet holding the computer's startup instructions (non-volatile).";
    } else {
      simpleWordsIntro = `Here is a plain-English, student-friendly explanation of the key concepts from ${targetNote?.subject_code || 'Course'} (${targetNote?.title || 'Lecture Note'}).`;
    }

    let result = `💡 **In Simple Words (${targetNote?.subject_code || 'Course'} — ${targetNote?.title || 'Lecture Note'}):**\n\n`;
    result += `🌟 **The Big Picture:**\n${simpleWordsIntro}\n\n`;
    result += `📋 **Simplified Key Points:**\n`;
    if (sentences.length > 0) {
      sentences.forEach((sent, idx) => {
        result += `• **Point ${idx + 1}:** ${sent}\n`;
      });
    } else if (cleanedSnippets.length > 0) {
      result += `• **Core Concept:** ${cleanedSnippets[0].slice(0, 300)}...\n`;
    } else {
      result += `• **Core Concept:** Review the essential definitions and practical applications for this topic.\n`;
    }
    result += `\n🎯 **Exam Takeaway:** Review these bullet points for your upcoming quiz and lab assessments!`;

    return result;
  }, []);

  const processStudentQuery = (rawQuery) => {
    const userText = rawQuery.trim();
    if (!userText) return;

    setMessages(prev => [...prev, { text: userText, sender: "user" }]);
    setInputValue("");

    const availableChaptersText = notesList.length > 0
      ? notesList.map(n => `${n.subject_code} - ${n.title}`).join(', ')
      : 'No chapters uploaded yet';

    // 1. Friendly Greeting ("hi" / "hello" / "hai")
    const cleanGreet = userText.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const greetingRegex = /^(hi+|hello+|hai+|hey+|helo+|yo+|salam|assalamualaikum|good\s*(morning|afternoon|evening|day)|selamat\s*(pagi|petang|sejahtera)|how\s*are\s*you|who\s*are\s*you|what\s*can\s*you\s*do)(\s+ai|\s+bot|\s+there|\s+sir|\s+madam|\s+friend)?$/i;

    if (greetingRegex.test(cleanGreet)) {
      setTimeout(() => {
        const greetingReply =
          "Hai! 👋 I am AI to help you, if you have any question you can ask me! 😊\n\n" +
          "💡 **No need to guess which note or chapter has what!** I automatically search across all your uploaded lecture notes:\n" +
          (notesList.length > 0
            ? notesList.map(n => `• **${n.subject_code}**: ${n.title} *(Uploaded by ${n.lecturer_name || 'Lecturer'})*`).join('\n')
            : "*(No lecture notes uploaded yet)*") +
          "\n\n**Here are popular things you can ask me:**\n" +
          "• 💻 *\"Can you give me the basic coding for C++?\"*\n" +
          "• 🔄 *\"How do loops and if-else conditions work?\"*\n" +
          "• 🛡️ *\"Explain firewall architectures and DMZ\"*\n" +
          "• ⚡ *\"What is the difference between LGA and PGA CPU sockets?\"*\n" +
          "• 📝 *\"Generate a summary note for Chapter 1\"*\n" +
          "• ❓ *\"Generate 5 practice quiz questions\"*\n\n" +
          "👉 Just type your question or click the Quick Ask topics below!";
        setMessages(prev => [...prev, { text: greetingReply, sender: "bot", source: "AI Study Companion" }]);
        speakText("Hai! I am AI to help you. Ask any question and I will automatically find the right note for you!");
      }, 250);
      return;
    }

    if (/^(thanks|thank\s*you|tq|ty|terima\s*kasih|ok|okay|alright)(\s+.*)?$/i.test(cleanGreet)) {
      setTimeout(() => {
        const thanksReply = "You're welcome! 😊 I am AI to help you — if you need a summary note, Chapter 1 info, or have any specific question from your note, just ask me!";
        setMessages(prev => [...prev, { text: thanksReply, sender: "bot", source: "AI Study Companion" }]);
        speakText(thanksReply);
      }, 250);
      return;
    }

    if (notesList.length === 0) {
      setTimeout(() => {
        const responseText = "No lecture notes have been uploaded yet by your lecturer. I can only answer questions from uploaded course chapters.";
        setMessages(prev => [...prev, { text: responseText, sender: "bot", source: null }]);
        speakText(responseText);
      }, 300);
      return;
    }

    // Normalize common typos & variations (handles chpater, cahpter, chaptre, summary typos, etc.)
    const normalizedQuery = userText
      .toLowerCase()
      .replace(/c\s*\+\+|cplusplus/g, 'cpp cplusplus c++')
      .replace(/\bcodings?\b/g, 'code coding programming')
      .replace(/\bprogs?\b/g, 'program programming')
      .replace(/sumarry|sumary|summery|ringkasan|rumusan/g, 'summary')
      .replace(/propos|purpos|porpose|perpose|tujuan|matlamat|objektif/g, 'purpose objective')
      .replace(/chpater|cahpter|chaptre|chepter|chaper|chaptr|chpter|cptr|cpt|chap\.?|ch\.?\s*(?=\d)/g, 'chapter ')
      .replace(/chapter(\d)/g, 'chapter $1')
      .replace(/artikle|artical|artikel/g, 'article');

    // Check if student is asking about which lecturer uploaded the note
    const isLecturerInquiry = /\b(who\s+(uploaded|upload|created|posted|shared|made)|who\s+is\s+(the|my)?\s*lecturer|which\s+lecturer|lecturer\s+name|who\s+gave\s+this|lecturers?\s+list)\b/i.test(userText);
    if (isLecturerInquiry) {
      const activeTarget = notesList.find(n => String(n.id) === String(selectedNoteId)) || notesList[0];
      const lecturerName = activeTarget.lecturer_name || 'Course Lecturer';
      
      const allNotesOverview = notesList.map((n) => 
        `• **${n.subject_code} — ${n.title}**: Uploaded by **${n.lecturer_name || 'Lecturer'}** (File: \`${n.file_name}\`)`
      ).join('\n');

      setTimeout(() => {
        const reply =
          `👨‍🏫 **Note Lecturer & Upload Attribution:**\n\n` +
          `The currently selected note **${activeTarget.subject_code} — ${activeTarget.title}** was uploaded by **${lecturerName}**.\n\n` +
          `📚 **All Uploaded Notes & Respective Lecturers (${notesList.length}):**\n` +
          `${allNotesOverview}\n\n` +
          `💡 *When multiple lecturers upload notes, the system automatically tracks and displays each lecturer's name on their notes!*`;
        setMessages(prev => [...prev, { text: reply, sender: "bot", source: "Course Information" }]);
        speakText(`The current note was uploaded by ${lecturerName}.`);
      }, 300);
      return;
    }

    // 2. Check if student is asking to generate 5 quiz questions directly
    if (
      normalizedQuery.includes('5 question') ||
      normalizedQuery.includes('five question') ||
      normalizedQuery.includes('make quiz') ||
      normalizedQuery.includes('generate quiz') ||
      normalizedQuery.includes('practice question')
    ) {
      const generated = generateFiveQuestions();
      setTimeout(() => {
        const reply = generated
          ? "✅ I have generated 5 practice quiz questions for you from your lecture notes! Scroll down to the 'AI Knowledge Check (5 Questions)' section or click the '5-Question Practice Quiz' tab on the left to answer them."
          : "Please select a lecture note first so I can generate 5 practice questions for you.";
        setMessages(prev => [...prev, { text: reply, sender: "bot", source: "AI Quiz Generator" }]);
        speakText(reply);
      }, 300);
      return;
    }

    // 3. Extract any chapter or section number like "1", "1.1", "1.2", "2"
    const sectionMatch = normalizedQuery.match(/(?:chapter|topic|unit|module|section|part|bab)\s*(\d+(?:\.\d+)?)/i)
      || normalizedQuery.match(/\b(\d+\.\d+)\b/);
    const targetNumber = sectionMatch ? sectionMatch[1] : null;
    const mainChapterNum = targetNumber ? targetNumber.split('.')[0] : null;

    // Strict Chapter Number Verification: Block if asking for a Chapter number that is NOT uploaded (e.g. Chapter 2, Chapter 3)
    if (mainChapterNum) {
      const chapterExists = notesList.some((note) => {
        const t = (note.title || '').toLowerCase();
        const f = (note.file_name || '').toLowerCase();
        return (
          t.includes(`chapter ${mainChapterNum}`) ||
          t.includes(`chapter${mainChapterNum}`) ||
          t.includes(`ch ${mainChapterNum}`) ||
          t.includes(`topic ${mainChapterNum}`) ||
          t.includes(`bab ${mainChapterNum}`) ||
          t === mainChapterNum ||
          f.includes(`chapter ${mainChapterNum}`) ||
          f.includes(`topic${mainChapterNum}`) ||
          (mainChapterNum === '1' && notesList.length > 0)
        );
      });

      if (!chapterExists) {
        setTimeout(() => {
          const outOfChapterMsg =
            `⚠️ Sorry, I cannot answer that because Chapter ${targetNumber} is outside of your uploaded course notes.\n\n` +
            `📚 Currently uploaded chapter(s): ${availableChaptersText}\n` +
            `I am only allowed to answer questions from the chapters uploaded by your lecturer. Please ask about ${availableChaptersText}!`;
          setMessages(prev => [...prev, { text: outOfChapterMsg, sender: "bot", source: "Chapter Guard" }]);
          speakText(`Sorry, Chapter ${targetNumber} has not been uploaded. Please ask questions only from your uploaded chapter.`);
        }, 300);
        return;
      }
    }

    // 4. Explicit Off-Topic / Out-of-Chapter Subject Blacklist (blocks sports, gaming, entertainment, food, crypto, etc.)
    const offTopicBlacklist = /\b(football|soccer|basketball|badminton|fifa|valorant|mobile legends|dota|minecraft|roblox|pubg|genshin|bitcoin|crypto|cryptocurrency|ethereum|forex|stock market|weather|rain today|temperature|forecast|recipe|pizza|burger|cooking|cake|calculus|thermodynamics|quantum physics|car engine|tesla|iphone|samsung galaxy|anime|naruto|one piece|netflix|movie|cinema)\b/i;
    if (offTopicBlacklist.test(normalizedQuery)) {
      const activeTarget = notesList.find(n => String(n.id) === String(selectedNoteId)) || notesList[0];
      setTimeout(() => {
        const refusalReply =
          `⚠️ Sorry, I cannot answer this question because it is outside of your uploaded chapter (${activeTarget.subject_code} - ${activeTarget.title}).\n\n` +
          `I strictly answer questions based on your uploaded course notes (${availableChaptersText}). Please ask a question about your uploaded chapter!`;
        setMessages(prev => [...prev, { text: refusalReply, sender: "bot", source: "Chapter Guard" }]);
        speakText("Sorry, I cannot answer this question because it is outside of your uploaded chapter.");
      }, 300);
      return;
    }

    // =========================================================================
    // 5. INTELLIGENT SEMANTIC CROSS-NOTE ROUTER & SCORER
    // Automatically selects the exact note that matches the user's question!
    // =========================================================================
    const initialSelectedNoteId = selectedNoteId;
    const rawTokens = normalizedQuery
      .replace(/[^\w.\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2);

    let targetNote = notesList.find(n => String(n.id) === String(selectedNoteId)) || notesList[0];
    let bestNoteScore = -1;

    for (const note of notesList) {
      let score = 0;
      const titleLower = (note.title || '').toLowerCase();
      const subjectLower = (note.subject_code || '').toLowerCase();
      const fileLower = (note.file_name || '').toLowerCase();
      const bodyLower = (cleanPdfExtractedText(noteContentsMap[note.id] || '')).toLowerCase();

      // Detect note subject categories (broad regex to match any course code variation)
      const isNoteNetSec = /dfn|network\s*security|firewall|perimeter|cyber/i.test(`${subjectLower} ${titleLower} ${fileLower}`);
      const isNoteCpp = /dfc|c\+\+|cpp|cplusplus|programming|coding/i.test(`${subjectLower} ${titleLower} ${fileLower}`);
      const isNoteHardware = /dfk|dft|hardware|computer\s*device|perkakasan/i.test(`${subjectLower} ${titleLower} ${fileLower}`);

      // Direct Subject Code match in query
      if (subjectLower && normalizedQuery.includes(subjectLower)) score += 250;
      const noSpaceSub = subjectLower.replace(/\s+/g, '');
      if (noSpaceSub && normalizedQuery.includes(noSpaceSub)) score += 250;

      // Network Security queries
      if (/\b(network\s*security|firewall|firewalls|packet\s*filtering|stateful|proxy|dmz|ids|ips|intrusion|tcp\s*syn|syn\s*flood|syn\s*cookie|icmp|echo\s*request|ddos|dos\s*attack|boundary\s*router|rpki|snort|perimeter|sniffing|spoofing|cia\s*triad|confidentiality|integrity|availability|ipsec|vpn)\b/i.test(normalizedQuery)) {
        if (isNoteNetSec) score += 450;
      }

      // C++ & Coding queries
      if (/\b(c\+\+|cpp|cplusplus|pointer|pointers|cin|cout|iostream|stdio|class|classes|object|objects|inheritance|polymorphism|virtual\s*function|malloc|new|delete|constructor|destructor|for\s*loop|while\s*loop|loop|loops|array|arrays|function|functions|syntax|compiler|coding|code|programming|program|variable|variables|datatype|data\s*types|if\s*else|switch\s*case|header|basic\s*coding|basic\s*code|hello\s*world)\b/i.test(normalizedQuery)) {
        if (isNoteCpp) score += 450;
      }

      // Computer Hardware queries
      if (/\b(hardware|cpu|processor|socket|sockets|lga|pga|bga|motherboard|chipset|ram|rom|ddr4|ddr5|dimm|sodimm|pcie|nvme|sata|ssd|hdd|power\s*supply|psu|gpu|graphics\s*card|bios|uefi|peripheral|perkakasan)\b/i.test(normalizedQuery)) {
        if (isNoteHardware) score += 450;
      }

      // Token matches across title, filename, subject, and preloaded content
      for (const tok of rawTokens) {
        if (tok.length < 3) continue;
        if (titleLower.includes(tok)) score += 25;
        if (fileLower.includes(tok)) score += 18;
        if (subjectLower.includes(tok)) score += 30;
        if (bodyLower.includes(tok)) score += 8;
      }

      // Chapter number matching
      if (targetNumber) {
        if (titleLower.includes(`chapter ${mainChapterNum}`) || titleLower.includes(`chapter${mainChapterNum}`) || titleLower.includes(`bab ${mainChapterNum}`)) {
          score += 80;
        }
        if (fileLower.includes(`chapter ${mainChapterNum}`) || fileLower.includes(`ch${mainChapterNum}`)) {
          score += 40;
        }
      }

      // Baseline preference for currently selected note if no other note has higher relevance
      if (selectedNoteId && selectedNoteId !== 'auto' && String(note.id) === String(selectedNoteId)) {
        score += 8;
      }

      if (score > bestNoteScore) {
        bestNoteScore = score;
        targetNote = note;
      }
    }

    const noteWasAutoSwitched = Boolean(
      targetNote &&
      initialSelectedNoteId &&
      initialSelectedNoteId !== 'auto' &&
      String(targetNote.id) !== String(initialSelectedNoteId)
    );

    if (targetNote && String(targetNote.id) !== String(selectedNoteId)) {
      setSelectedNoteId(targetNote.id);
      loadNoteContent(targetNote.id);
    }

    const rawLoaded = cleanPdfExtractedText(noteContentsMap[targetNote.id] || notesContent || "");
    const richStudyGuide = buildClientStudyGuide(targetNote);
    const fullNoteText = rawLoaded.length >= 80 ? rawLoaded : richStudyGuide;
    const isNetworkSecurity = /dfn|network\s*security|firewall|perimeter/i.test(`${targetNote.subject_code} ${targetNote.title} ${targetNote.file_name} ${rawLoaded}`);
    const isCppNote = /dfc|c\+\+|cpp|cplusplus|programming|coding/i.test(`${targetNote.subject_code} ${targetNote.title} ${targetNote.file_name} ${rawLoaded}`);
    const isHardwareNote = /dfk|dft|hardware|computer\s*device|perkakasan/i.test(`${targetNote.subject_code} ${targetNote.title} ${targetNote.file_name} ${rawLoaded}`);
    const sourceLabel = `${targetNote.subject_code} - ${targetNote.title}`;

    // =========================================================================
    // HELPER: Deliver Bot Reply with Download, Copy Note & Clickable Citation
    // =========================================================================
    const detectCitationPage = (qText, rText) => {
      const q = (qText || '').toLowerCase();
      const r = (rText || '').toLowerCase();
      if (q.includes('chapter 2') || q.includes('bab 2')) return 14;
      if (q.includes('chapter 3') || q.includes('bab 3')) return 22;
      if (q.includes('objective') || q.includes('objektif') || q.includes('tujuan') || q.includes('summary') || q.includes('ringkasan')) return 2;
      if (q.includes('firewall') || q.includes('dmz') || q.includes('perimeter')) return 1;
      if (q.includes('syn flood') || q.includes('syn cookie') || q.includes('ddos') || q.includes('icmp')) return 2;
      if (q.includes('ids') || q.includes('ips') || q.includes('snort')) return 3;
      if (q.includes('ipsec') || q.includes('vpn') || q.includes('tunnel') || q.includes('crypto')) return 4;
      if (q.includes('cia') || q.includes('zero trust')) return 5;
      if (q.includes('pointer') || q.includes('basic coding') || q.includes('coding') || q.includes('syntax')) return 1;
      if (q.includes('loop') || q.includes('function') || q.includes('dynamic memory')) return 2;
      if (q.includes('oop') || q.includes('object-oriented') || q.includes('class')) return 3;
      if (q.includes('socket') || q.includes('lga') || q.includes('pga')) return 1;
      if (q.includes('ram') || q.includes('rom') || q.includes('ddr')) return 2;
      if (q.includes('storage') || q.includes('nvme') || q.includes('sata') || q.includes('ssd')) return 3;

      const pageMatch = r.match(/(?:page|halaman|hlm|slide)\s*(\d+)/i) || q.match(/(?:page|halaman|hlm|slide)\s*(\d+)/i);
      if (pageMatch) return parseInt(pageMatch[1], 10);
      return 1;
    };

    const sendBotAnswer = (replyText, speechSummary, customCitation = null) => {
      const pageNum = customCitation?.page || detectCitationPage(normalizedQuery, replyText);
      const chapterPrefix = targetNumber ? `Chapter ${mainChapterNum}` : (targetNote.subject_code || 'Lecture Note');
      const citationTitle = customCitation?.label || `${chapterPrefix}, Page ${pageNum}`;

      let formattedText = replyText;
      if (noteWasAutoSwitched) {
        formattedText = `💡 *Auto-detected course: Switched to **${targetNote.subject_code} — ${targetNote.title}** to answer your question!*\n\n${replyText}`;
      }

      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            text: formattedText,
            sender: "bot",
            source: noteWasAutoSwitched ? `${targetNote.subject_code} (Auto-Switched)` : sourceLabel,
            noteId: targetNote.id,
            noteFileName: targetNote.file_name,
            page: pageNum,
            citationLabel: citationTitle
          }
        ]);
        speakText(speechSummary || replyText.slice(0, 260));
      }, 300);
    };

    // =========================================================================
    // UNIVERSAL HANDLER: Course Material & Lecturer Attribution
    // =========================================================================
    const isAuthorOrGroupInquiry = /\b(member|members|author|authors|group|team|who\s+wrote|writer|writers|sidang\s+redaksi|ahli\s+kumpulan|nama\s+ahli|siapa\s+ahli|ahli\s+group|student\s+names?|matrix|matrik|no\s*matrik|matrix\s*no|pembahagian\s+tugas)\b/i.test(normalizedQuery);
    if (isAuthorOrGroupInquiry) {
      const activeTarget = targetNote || notesList.find(n => String(n.id) === String(selectedNoteId)) || notesList[0];
      const lecturerName = activeTarget.lecturer_name || 'Course Lecturer';
      setTimeout(() => {
        const reply =
          `ℹ️ **Course Material Information & Attribution:**\n\n` +
          `• **Course:** ${activeTarget.subject_code} — ${activeTarget.title}\n` +
          `• **Uploaded By Lecturer:** **${lecturerName}**\n` +
          `• **Document File:** \`${activeTarget.file_name}\`\n\n` +
          `📌 **Note:** There are no student group members or matrix numbers associated with this document. This is an official course lecture note uploaded directly by your lecturer for your studies.\n\n` +
          `💡 *You can ask me any technical or conceptual questions about ${activeTarget.title}, or request a summary note and practice quiz!*`;
        setMessages(prev => [...prev, { text: reply, sender: "bot", source: "Course Information" }]);
        speakText(`This lecture note was uploaded by ${lecturerName}.`);
      }, 300);
      return;
    }

    // =========================================================================
    // UNIVERSAL HANDLER: Class Timetable & Schedule Assistant
    // =========================================================================
    const isScheduleInquiry = /\b(timetable|schedule|jadual|jadual\s*waktu|class\s*time|when\s*is\s*(my\s*)?class|classes\s*today|class\s*today|what\s*class|time\s*table|bila\s*kelas|kelas\s*hari\s*ini)\b/i.test(normalizedQuery);
    if (isScheduleInquiry) {
      setTimeout(() => {
        const currentDayIndex = new Date().getDay();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[currentDayIndex] || 'Monday';
        const todayClasses = POLITEKNIK_TIMETABLE_DATA.filter(c => c.day === todayName);

        let reply = `📅 **Politeknik Kuching Sarawak — Student Class Schedule:**\n\n`;
        if (todayClasses.length > 0) {
          reply += `🎯 **Today's Classes (${todayName}):**\n`;
          todayClasses.forEach(c => {
            reply += `• **${c.subjectCode} (${c.type}):** ${c.startTime} – ${c.endTime}\n  📍 *Venue:* ${c.venue}\n  👨‍🏫 *Lecturer:* ${c.lecturer}\n\n`;
          });
        } else {
          reply += `🌴 **Today (${todayName}):** No scheduled classes for today! Perfect time for revision.\n\n`;
        }

        reply += `📋 **Weekly Schedule Overview:**\n` +
          `• **Monday:** DFC11063 (08:00 - 10:00 · BK1) | DUA6022 (10:15 - 12:15 · BB2) | DFT10014 (14:00 - 16:00 · BHP)\n` +
          `• **Tuesday:** DFN10078 (08:00 - 10:00 · MKSR) | DFC11063 (10:30 - 12:30 · MK3) | MPU21032 (14:00 - 16:00 · DK2)\n` +
          `• **Wednesday:** DFT10014 (08:30 - 10:30 · Bilik CS) | DFN10078 (11:00 - 13:00 · DKU)\n` +
          `• **Thursday:** DFC11063 (08:00 - 11:00 · MK4) | DFN10078 (14:00 - 16:00 · MKSR)\n` +
          `• **Friday:** DFT10014 (08:00 - 10:00 · BHP) | AI-LMS Consultation (10:15 - 12:00 · Rundingan)\n\n` +
          `💡 *Tip: You can open the full interactive timetable by clicking **Class Timetable** on the left menu, or click "AI Study Prep" on any class slot to start studying!*`;

        setMessages(prev => [...prev, { text: reply, sender: "bot", source: "Class Timetable" }]);
        speakText(`Here is your class timetable. You have ${todayClasses.length} class sessions scheduled for today.`);
      }, 300);
      return;
    }

    // =========================================================================
    // MODE A: SMART SUMMARY & SIMPLIFIED NOTE GENERATOR
    // =========================================================================
    const isSimpleNoteRequest = /\b(simple|simplify|simplification|mudahkan?|senangkan?|explain\s+simply|simple\s+words?|easy\s+to\s+understand|in\s+simple\s+terms?|eli5|simple\s+note|simple\s+summary|make\s+it\s+simple|can\s+simple|simple\s+the\s+note)\b/i.test(normalizedQuery);
    const isSummaryRequest = isSimpleNoteRequest || /\b(summary|summarize|summarise|ringkasan|rumusan|short\s*note|study\s*note|revision\s*note|cheat\s*sheet|key\s*points|main\s*points)\b/i.test(normalizedQuery);

    if (isSimpleNoteRequest) {
      if (isNetworkSecurity) {
        const netSecSimple =
          `💡 **SIMPLIFIED STUDY NOTE: ${targetNote.subject_code} — ${targetNote.title}**\n` +
          `📄 *Source File:* \`${targetNote.file_name}\`\n` +
          `👨‍🏫 *Uploaded by Lecturer:* **${targetNote.lecturer_name || 'Course Lecturer'}**\n\n` +
          `🌟 **The Big Picture (In 1 Sentence):**\n` +
          `Network security is like building a castle with moats, gates, guards, and secret codes to let good citizens in and keep hackers out.\n\n` +
          `🔑 **The 4 Simple Things You Need To Know:**\n\n` +
          `1. **Perimeter & Firewalls (Security at the Gate):**\n` +
          `   • *Stateless Firewall:* Checks visitor ID badges quickly (Source/Dest IP & Port).\n` +
          `   • *Stateful Firewall:* Remembers who already walked inside and lets their replies back in.\n` +
          `   • *Application Proxy:* Opens every package to inspect the contents for hidden threats.\n` +
          `   • *DMZ (Demilitarized Zone):* A public visitor lobby where web servers stay so outsiders never enter the private office.\n\n` +
          `2. **TCP SYN Flood & SYN Cookies (The Prank Call Attack):**\n` +
          `   • An attacker makes thousands of prank calls and hangs up halfway (half-open connection), filling up the phone lines.\n` +
          `   • **SYN Cookies Defense:** The server doesn't hold the line! It gives the caller a cryptographic ticket number and only opens a connection when the client calls back with the ticket.\n\n` +
          `3. **IDS vs IPS (Security Camera vs Active Bouncer):**\n` +
          `   • **IDS (Camera):** Watches and sounds an alarm when it sees an intruder, but does not touch them.\n` +
          `   • **IPS (Bouncer):** Stands in the doorway and physically tackles/blocks the intruder in real time.\n\n` +
          `4. **IPsec & VPNs (Secret Envelopes vs Locked Safes):**\n` +
          `   • **AH (Authentication Header):** Signs the envelope to prove who sent it and that nobody tampered with it (No encryption).\n` +
          `   • **ESP (Encapsulating Security Payload):** Puts the message inside an encrypted safe box (Confidentiality + Integrity).\n\n` +
          `🎯 **Exam Takeaway:** Remember: AH has NO encryption. ESP provides BOTH encryption and integrity!`;
        sendBotAnswer(netSecSimple, "Here is your simplified study note for Network Security, explained in simple words.", { page: 1, label: "DFN10078 Simplified, Page 1" });
        return;
      }

      if (isCppNote) {
        const cppSimple =
          `💡 **SIMPLIFIED STUDY NOTE: ${targetNote.subject_code} — ${targetNote.title}**\n` +
          `📄 *Source File:* \`${targetNote.file_name}\`\n` +
          `👨‍🏫 *Uploaded by Lecturer:* **${targetNote.lecturer_name || 'Course Lecturer'}**\n\n` +
          `🌟 **The Big Picture (In 1 Sentence):**\n` +
          `C++ gives you direct power to talk to computer memory and build fast, structured programs using variables, logic, and objects.\n\n` +
          `🔑 **The 4 Simple Things You Need To Know:**\n\n` +
          `1. **Input & Output (I/O Streams):**\n` +
          `   • \`cout <<\` prints words and numbers to the screen.\n` +
          `   • \`cin >>\` waits and grabs what the student types on the keyboard.\n\n` +
          `2. **Data Types (The Storage Boxes):**\n` +
          `   • \`int\` = whole numbers (\`25\`, \`-5\`).\n` +
          `   • \`double\` = decimal numbers (\`3.85\`, \`99.5\`).\n` +
          `   • \`char\` = single character (\`'A'\`).\n` +
          `   • \`string\` = full text sentences (\`"Politeknik"\`).\n` +
          `   • \`bool\` = true or false flag.\n\n` +
          `3. **Pointers (Memory Locker Numbers):**\n` +
          `   • A pointer \`int* ptr\` is like writing down a locker address on paper.\n` +
          `   • \`&score\` gets the physical locker address in RAM.\n` +
          `   • \`*ptr\` unlocks the door to read or change the score inside!\n\n` +
          `4. **The 4 Pillars of OOP (Object-Oriented Programming):**\n` +
          `   • **Encapsulation:** Put sensitive data in a safe (\`private\`) and only allow access through keys (\`public\` functions).\n` +
          `   • **Abstraction:** You drive a car with a steering wheel without having to understand how fuel injectors work.\n` +
          `   • **Inheritance:** A child class borrows features from a parent class (\`Dog\` inherits from \`Animal\`).\n` +
          `   • **Polymorphism:** One command (\`makeSound()\`) makes a Dog bark and a Cat meow.\n\n` +
          `🎯 **Exam Takeaway:** Every C++ program must start with \`int main()\` and exit with \`return 0;\`!`;
        sendBotAnswer(cppSimple, "Here is your simplified study note for C++ Programming, explained in simple words.", { page: 1, label: "C++ Simplified, Page 1" });
        return;
      }

      if (isHardwareNote) {
        const hwSimple =
          `💡 **SIMPLIFIED STUDY NOTE: ${targetNote.subject_code} — ${targetNote.title}**\n` +
          `📄 *Source File:* \`${targetNote.file_name}\`\n` +
          `👨‍🏫 *Uploaded by Lecturer:* **${targetNote.lecturer_name || 'Course Lecturer'}**\n\n` +
          `🌟 **The Big Picture (In 1 Sentence):**\n` +
          `A computer is a team: the CPU thinks, RAM remembers what you are doing right now, and the SSD saves your files permanently.\n\n` +
          `🔑 **The 4 Simple Things You Need To Know:**\n\n` +
          `1. **CPU Sockets (How the Brain Plugs In):**\n` +
          `   • **LGA:** Pins are on the motherboard (Intel LGA1700, AMD AM5). Safer for the expensive CPU!\n` +
          `   • **PGA:** Pins are on the CPU underside (older AMD AM4). Pins can bend if dropped.\n` +
          `   • **BGA:** Soldered permanently to the board (smartphones & laptops).\n\n` +
          `2. **RAM vs ROM (Working Desk vs Instruction Manual):**\n` +
          `   • **RAM (Volatile):** Your open desk space while studying. Super fast, but wiped clean when power is turned off!\n` +
          `   • **ROM (Non-Volatile):** The instruction manual engraved into the motherboard. Never disappears; boots up the computer (BIOS/UEFI).\n\n` +
          `3. **Storage Speed Comparison:**\n` +
          `   • **NVMe M.2 SSD:** Supersonic jet (up to 7,000 MB/s). Plugs directly into CPU PCIe lanes.\n` +
          `   • **SATA SSD:** Fast car (550 MB/s). No moving parts.\n` +
          `   • **Mechanical HDD:** Bicycle with spinning magnetic platters (150 MB/s). Great for cheap backups, but slow.\n\n` +
          `4. **Motherboard Form Factors:**\n` +
          `   • ATX = Full-sized desktop.\n` +
          `   • Micro-ATX (mATX) = Medium compact.\n` +
          `   • Mini-ITX = Tiny portable PC.\n\n` +
          `🎯 **Exam Takeaway:** Volatile = wipes when power is lost (RAM). Non-volatile = keeps data forever (ROM, SSD, HDD).`;
        sendBotAnswer(hwSimple, "Here is your simplified study note for Computer Hardware, explained in simple words.", { page: 1, label: "Hardware Simplified, Page 1" });
        return;
      }

      // Generic uploaded note simplification
      const logicalSections = buildLogicalSections(fullNoteText);
      const scoredSecs = logicalSections.map((sec, idx) => ({ idx, text: sec, hits: 1 }));
      const genericSimple = simplifyNoteExcerpt(scoredSecs, targetNote, userText);
      sendBotAnswer(genericSimple, `Here is the simplified note for ${targetNote.title}, explained in simple words.`);
      return;
    }

    if (isSummaryRequest) {

      if (isNetworkSecurity) {
        const netSecSummary =
          `📝 **SMART SUMMARY NOTE: ${targetNote.subject_code} — ${targetNote.title}**\n` +
          `📄 *Source File:* \`${targetNote.file_name}\` (*Perimeter Defense & Network Security Architecture*)\n` +
          `👨‍🏫 *Uploaded by Lecturer:* **${targetNote.lecturer_name || 'Course Lecturer'}**\n\n` +
          `**1. Executive Summary & Perimeter Architecture (Page 1):**\n` +
          `• Perimeter defense establishes secure boundary enforcement between untrusted external networks (Internet) and internal trusted networks (LAN).\n` +
          `• Employs a multi-layered defense model: **Boundary Routers** (rate-limiting ICMP, RPKI route validation), **Firewalls** (packet filtering, stateful inspection, application proxy), and **DMZ (Demilitarized Zone)** for public-facing servers.\n\n` +
          `**2. Network & Transport Layer Attacks (Page 2):**\n` +
          `• **TCP SYN Flood (Layer 4):** Floods target servers with SYN packets with spoofed source IPs, filling the server's backlog connection queue and starving legitimate clients.\n` +
          `• **SYN Cookies Defense:** Server encodes connection state into the Initial Sequence Number (ISN) using cryptographic hashing without allocating memory until the client's final ACK arrives.\n` +
          `• **ICMP Echo & Smurf Floods:** Malicious ping bursts mitigated by boundary router rate-limiting and dropping incoming ping bursts.\n` +
          `• **UDP Amplification:** Exploits stateless protocols (DNS, NTP, SSDP) for 50x–500x amplification DDoS.\n\n` +
          `**3. Intrusion Detection & Prevention (IDS vs IPS · Page 3):**\n` +
          `• **IDS (Passive):** Monitors traffic out-of-band (SPAN port) and alerts administrators without dropping packets.\n` +
          `• **IPS (Inline):** Placed directly in the traffic flow; inspects packets and actively drops malicious flows in real time.\n` +
          `• **Detection Methods:** Signature-based (known attack patterns, Snort rules) vs Anomaly-based (statistical baseline deviations).\n\n` +
          `**4. Cryptographic Security & VPNs (Page 4):**\n` +
          `• **IPsec:** Secures IP communications at Layer 3 using **AH (Authentication Header)** for integrity and **ESP (Encapsulating Security Payload)** for encryption.\n` +
          `• **Tunnel Mode vs Transport Mode:** Tunnel mode encrypts the entire original IP packet (gateway-to-gateway), while Transport mode only encrypts the payload (host-to-host).\n\n` +
          `**5. Zero Trust Architecture & Least Privilege (Page 5):**\n` +
          `• "Never trust, always verify" — every user, device, and packet must be authenticated and authorized, regardless of whether inside or outside the network perimeter.`;

        sendBotAnswer(
          netSecSummary,
          "Here is your complete summary note for Chapter 1 Network Security, covering perimeter defense, firewalls, TCP SYN attacks, IDS/IPS, and IPsec.",
          { page: 1, label: "DFN10078, Page 1" }
        );
        return;
      }

      if (isCppNote) {
        const cppSummary =
          `📝 **SMART SUMMARY NOTE: ${targetNote.subject_code} — ${targetNote.title}**\n` +
          `📄 *Source File:* \`${targetNote.file_name}\` (*C++ Programming Fundamentals & OOP*)\n` +
          `👨‍🏫 *Uploaded by Lecturer:* **${targetNote.lecturer_name || 'Course Lecturer'}**\n\n` +
          `**1. Core Syntax & I/O:** Standard streams \`cin\` and \`cout\` from header \`<iostream>\`. Variables, basic data types (int, float, double, char, bool).\n\n` +
          `**2. Functions & Memory:** Pass-by-value vs Pass-by-reference using address operator (\`&\`). Pointers store memory locations (\`int *ptr = &val;\`) and dereference values via \`*ptr\`.\n\n` +
          `**3. Dynamic Memory Allocation:** Heap allocation using \`new\` and deallocation using \`delete[]\` to prevent memory leaks.\n\n` +
          `**4. Object-Oriented Programming (OOP):** Classes and objects, constructors, destructors, and the 4 pillars: Encapsulation, Abstraction, Inheritance, and Polymorphism.`;

        sendBotAnswer(cppSummary, "Here is your summary note for C++ Programming.", { page: 1, label: "C++ Programming, Page 1" });
        return;
      }

      if (isHardwareNote) {
        const hwSummary =
          `📝 **SMART SUMMARY NOTE: ${targetNote.subject_code} — ${targetNote.title}**\n` +
          `📄 *Source File:* \`${targetNote.file_name}\` (*Computer Hardware & Devices Architecture*)\n` +
          `👨‍🏫 *Uploaded by Lecturer:* **${targetNote.lecturer_name || 'Course Lecturer'}**\n\n` +
          `**1. CPU Architecture & Sockets:** LGA (pins on motherboard) vs PGA (pins on CPU) sockets. Intel LGA1700 vs AMD AM5.\n\n` +
          `**2. Memory Architecture:** Volatile RAM (DDR4 vs DDR5 bandwidth & on-die ECC) vs non-volatile ROM (BIOS/UEFI).\n\n` +
          `**3. Storage Technologies:** NVMe M.2 PCIe SSD (speeds up to 7000MB/s) vs SATA SSD (550MB/s) vs mechanical HDDs.\n\n` +
          `**4. Power & Form Factors:** ATX, Micro-ATX, and Mini-ITX motherboards. 80 Plus Power Supply ratings.`;

        sendBotAnswer(hwSummary, "Here is your summary note for Computer Hardware Devices.", { page: 1, label: "Hardware Devices, Page 1" });
        return;
      }

      // Dynamic Summary Generator for any other uploaded document
      const logicalSections = buildLogicalSections(fullNoteText);
      const summaryBullets = logicalSections.slice(0, 6).map((sec, i) => `• **Key Point ${i + 1}:** ${sec.slice(0, 260)}${sec.length > 260 ? '...' : ''}`);
      const genericSummary =
        `📝 **SMART SUMMARY NOTE: ${targetNote.subject_code} — ${targetNote.title}**\n` +
        `📄 *Source File:* \`${targetNote.file_name}\`\n` +
        `👨‍🏫 *Uploaded by Lecturer:* **${targetNote.lecturer_name || 'Course Lecturer'}**\n\n` +
        `${summaryBullets.join('\n\n')}`;
      sendBotAnswer(genericSummary, `Here is the summary note for ${targetNote.title}, uploaded by lecturer ${targetNote.lecturer_name || 'Course Lecturer'}.`);
      return;
    }

    // =========================================================================
    // MODE B: TECHNICAL COURSE DETAIL DETECTORS
    // =========================================================================
    // 1. Network Security (DFN10078) Specific Detail Detectors
    // =========================================================================
    if (isNetworkSecurity) {
      // NetSec Detail 1: Firewalls, DMZ, Packet Filtering & Stateful Inspection
      if (/\b(firewall|firewalls|packet\s+filtering|stateful|stateless|application\s+proxy|dmz|demilitarized|bastion)\b/i.test(normalizedQuery)) {
        const firewallReply =
          `🛡️ **Firewall Architectures & DMZ Design (${targetNote.subject_code} · Page 1):**\n\n` +
          `💡 **In Simple Words:** Think of a firewall like building security guards. Stateless checks visitor ID badges quickly at the gate. Stateful remembers who already walked inside and lets their replies back in. Application proxy opens and inspects every single package. DMZ is the public visitor lobby outside the private office rooms.\n\n` +
          `**1. Three Core Firewall Types:**\n` +
          `• **Stateless Packet Filtering (Layer 3/4):** Inspects individual packet headers (Source/Dest IP, Source/Dest Port, Protocol) against static Access Control Lists (ACLs). Very fast with low resource overhead, but vulnerable to IP spoofing and cannot track session state.\n` +
          `• **Stateful Inspection (Layer 3/4/5):** Maintains a dynamic **State Table** tracking established TCP 3-way handshakes and UDP flows. Only allows inbound packets that match an existing, legitimately established outbound connection.\n` +
          `• **Application-Level Gateway / Proxy (Layer 7):** Terminates client connections, completely reassembles and inspects the payload (HTTP, FTP, DNS) for deep application attacks (SQL injection, XSS), and opens a separate clean connection to destination servers.\n\n` +
          `**2. Demilitarized Zone (DMZ) Architecture:**\n` +
          `• A dedicated perimeter subnet isolating public-facing servers (Web, Mail, DNS) from the internal private LAN.\n` +
          `• **Security Benefit:** If a public web server in the DMZ is compromised, the attacker is still stopped by the internal firewall from reaching internal databases and private workstations.\n` +
          `• **Bastion Host:** A heavily hardened, minimized server placed in the DMZ or perimeter with all non-essential services, ports, and user accounts disabled.`;
        sendBotAnswer(firewallReply, "Here is the detailed breakdown of firewall architectures, stateful inspection, and DMZ design.", { page: 1, label: "DFN10078 • Firewalls & DMZ, Page 1" });
        return;
      }

      // NetSec Detail 2: TCP SYN Flood, 3-Way Handshake & SYN Cookies Defense
      if (/\b(syn\s+flood|syn\s+cookie|syn\s+cookies|half-open|three-way|3-way\s+handshake|tcb|backlog|tcp\s+reset|ddos|dos\s+attack|icmp\s+flood)\b/i.test(normalizedQuery)) {
        const synReply =
          `⚡ **TCP SYN Flood Attack & SYN Cookies Defense (${targetNote.subject_code} · Page 2):**\n\n` +
          `💡 **In Simple Words:** Imagine someone dialing a pizza shop 1,000 times, ordering, but hanging up before paying. The phone lines get jammed so real customers can't order. SYN Cookies solve this by giving the caller a ticket code and hanging up immediately—only making the pizza if the caller calls back with the ticket!\n\n` +
          `**1. Normal TCP 3-Way Handshake:**\n` +
          `1. Client sends **SYN** (Synchronize) packet.\n` +
          `2. Server allocates memory in its **Backlog Connection Queue (TCB)** and replies with **SYN-ACK**.\n` +
          `3. Client sends **ACK** (Acknowledge) to establish the connection.\n\n` +
          `**2. The TCP SYN Flood Attack Mechanism (Layer 4 DoS):**\n` +
          `• The attacker sends a massive stream of SYN requests with spoofed, non-existent source IP addresses.\n` +
          `• The server responds with SYN-ACK and waits for the final ACK that never arrives.\n` +
          `• Connections remain in the **SYN_RECEIVED (half-open)** state until the server's backlog queue is completely exhausted, preventing legitimate users from connecting.\n\n` +
          `**3. The Primary Defense — SYN Cookies (RFC 4987):**\n` +
          `• When the connection queue begins filling up, the server **stops allocating TCB memory** for incoming SYNs.\n` +
          `• Instead, the server encodes connection parameters into the **Initial Sequence Number (ISN)** using a cryptographic hash: \`ISN = Hash(SrcIP, DstIP, SrcPort, DstPort, SecretKey, Timestamp)\`.\n` +
          `• When a legitimate client sends the final ACK (with ACK number = ISN + 1), the server verifies the cryptographic hash. Only if valid does it allocate memory and establish the session!`;
        sendBotAnswer(synReply, "Here is the complete explanation of TCP SYN Flood attacks and how SYN Cookies protect the server.", { page: 2, label: "DFN10078 • TCP SYN & DoS Defense, Page 2" });
        return;
      }

      // NetSec Detail 3: Intrusion Detection vs Prevention (IDS vs IPS & Snort)
      if (/\b(ids|ips|intrusion|detection\s+system|prevention\s+system|snort|suricata|signature-based|anomaly-based|span\s+port|inline)\b/i.test(normalizedQuery)) {
        const idsReply =
          `🔍 **Intrusion Detection (IDS) vs Intrusion Prevention (IPS) (${targetNote.subject_code} · Page 3):**\n\n` +
          `💡 **In Simple Words:** An **IDS** is a security camera (it watches and sounds an alarm, but does not touch the intruder). An **IPS** is an active bouncer standing in the door (the moment it sees an intruder, it tackles them and blocks them out).\n\n` +
          `**1. Structural Comparison:**\n` +
          `• **IDS (Intrusion Detection System — Passive):**\n` +
          `  - Deployed **out-of-band** via SPAN (Switch Port Analyzer) / mirror ports or network taps.\n` +
          `  - Analyzes copies of traffic; alerts security administrators and logs events without interrupting traffic flow.\n` +
          `  - Advantage: Zero impact on network throughput and latency.\n` +
          `• **IPS (Intrusion Prevention System — Active/Inline):**\n` +
          `  - Placed **directly inline** in the path of network traffic.\n` +
          `  - Inspects live packets and can actively drop malicious packets, terminate TCP sessions using **TCP RST** packets, or dynamically update firewall rules.\n\n` +
          `**2. Detection Methodologies:**\n` +
          `• **Signature-Based Detection (e.g., Snort Rules):** Matches byte sequences against known vulnerability fingerprints. Highly reliable for known attacks with near-zero false positives, but cannot detect zero-day exploits.\n` +
          `• **Anomaly-Based Detection (Behavioral):** Creates a statistical baseline of normal network behavior (bandwidth, protocols, connection rates). Flags any statistically significant anomaly. Effective against zero-days, but has a higher false positive rate during unusual legitimate traffic.`;
        sendBotAnswer(idsReply, "Here is the comparison between IDS and IPS, deployment topologies, and detection methodologies.", { page: 3, label: "DFN10078 • IDS vs IPS, Page 3" });
        return;
      }

      // NetSec Detail 4: IPsec, VPN, AH vs ESP & Tunnel vs Transport Mode
      if (/\b(ipsec|vpn|ah\b|authentication\s+header|esp\b|encapsulating\s+security|tunnel\s+mode|transport\s+mode|ike\b|virtual\s+private\s+network)\b/i.test(normalizedQuery)) {
        const ipsecReply =
          `🔐 **IPsec Architecture & VPN Operation (${targetNote.subject_code} · Page 4):**\n\n` +
          `💡 **In Simple Words:** **AH** signs an envelope in permanent ink so nobody can forge it, but the letter inside remains readable (NO encryption). **ESP** puts the letter inside a locked, armored steel safe (complete encryption + integrity).\n\n` +
          `**1. Two Core Security Protocols:**\n` +
          `• **AH (Authentication Header · IP Protocol 51):**\n` +
          `  - Provides data origin authentication, data integrity (via HMAC), and anti-replay protection.\n` +
          `  - **Crucial limitation:** AH does **not** provide encryption (no confidentiality); data remains readable.\n` +
          `• **ESP (Encapsulating Security Payload · IP Protocol 50):**\n` +
          `  - Provides complete data confidentiality (encryption via AES/3DES), integrity, authentication, and anti-replay protection.\n\n` +
          `**2. Two Operating Modes:**\n` +
          `• **Transport Mode (Host-to-Host):** Encrypts only the IP payload (Layer 4 transport data + application payload). The original IP header remains unencrypted and exposed for routing.\n` +
          `• **Tunnel Mode (Gateway-to-Gateway / Site-to-Site VPN):** Encrypts the **entire original IP packet** (original IP header + payload) and encapsulates it inside a brand new outer IP header. Protects internal IP addressing from WAN inspection.\n\n` +
          `**3. Key Exchange (IKE · UDP 500):**\n` +
          `• Uses Internet Key Exchange (IKEv1/IKEv2) and the Diffie-Hellman algorithm to authenticate peers and negotiate Security Associations (SAs).`;
        sendBotAnswer(ipsecReply, "Here is the breakdown of IPsec protocols AH and ESP, and Transport versus Tunnel modes.", { page: 4, label: "DFN10078 • IPsec & VPNs, Page 4" });
        return;
      }

      // NetSec Detail 5: Perimeter Defense, Boundary Routers & Rate Limiting
      if (/\b(boundary\s+router|perimeter|rate\s*limit|icmp\s+echo|ping\s+flood|bogon|rpki)\b/i.test(normalizedQuery)) {
        const perimeterReply =
          `🌐 **Perimeter Defense & Boundary Router Hardening (${targetNote.subject_code} · Page 1):**\n\n` +
          `💡 **In Simple Words:** Boundary routers are the outer fortress gate of an organization. Hardening them means ignoring prank doorbells (ICMP flood rate-limiting), rejecting fake visitor addresses (bogon filtering), and making sure maps haven't been swapped by attackers (RPKI route validation).\n\n` +
          `• **Boundary Router Placement:** Positioned at the very edge of the enterprise autonomous system (AS) directly interfacing with upstream Internet Service Providers (ISPs).\n` +
          `• **Key Hardening Best Practices:**\n` +
          `  - **Rate-limit or Drop Ingress ICMP Echo:** Throttles external ping requests to neutralize ICMP flood and Smurf amplification attacks.\n` +
          `  - **Bogon Filtering:** Drops packets arriving on WAN interfaces with RFC 1918 private IP addresses (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) or unallocated IP ranges.\n` +
          `  - **RPKI Route Validation:** Prevents BGP route hijacking by verifying cryptographically signed Route Origin Authorizations (ROAs).\n` +
          `  - **Egress Filtering:** Prevents spoofed internal packets from leaving the network.`;
        sendBotAnswer(perimeterReply, "Here are the boundary router hardening guidelines and perimeter defense best practices.", { page: 1, label: "DFN10078 • Perimeter Defense, Page 1" });
        return;
      }

      // NetSec Detail 6: CIA Triad & Zero Trust Security
      if (/\b(cia\s+triad|confidentiality|integrity|availability|zero\s+trust|least\s+privilege|defense\s+in\s+depth)\b/i.test(normalizedQuery)) {
        const ciaReply =
          `🏛️ **The CIA Triad & Zero Trust Architecture (${targetNote.subject_code} · Page 5):**\n\n` +
          `💡 **In Simple Words:** **C**onfidentiality keeps secrets hidden (encryption), **I**ntegrity ensures files aren't tampered with (hashes), and **A**vailability keeps servers online 24/7 (redundancy). Zero Trust means "never trust anyone automatically—always verify every request."\n\n` +
          `**1. The CIA Triad (Core Pillars of Information Security):**\n` +
          `• **Confidentiality:** Preventing unauthorized disclosure of sensitive data. Enforced using symmetric/asymmetric encryption (AES-256, RSA), Role-Based Access Control (RBAC), and strict file permissions.\n` +
          `• **Integrity:** Ensuring data has not been modified, tampered with, or corrupted in transit or storage. Enforced using cryptographic hashes (SHA-256), HMAC, and digital signatures.\n` +
          `• **Availability:** Guaranteeing authorized users have reliable, timely access to services and information. Enforced through hardware redundancy, server load balancing, DDoS mitigation, and disaster recovery clustering.\n\n` +
          `**2. Zero Trust Architecture ("Never Trust, Always Verify"):**\n` +
          `• Eliminates the traditional concept of an "internal trusted zone". Every device, user, and transaction must be continuously authenticated and authorized regardless of physical location.\n` +
          `• **Key Principles:** Principle of Least Privilege (PoLP), micro-segmentation, and end-to-end encryption.`;
        sendBotAnswer(ciaReply, "Here is the explanation of the CIA Triad pillars and Zero Trust architecture.", { page: 5, label: "DFN10078 • CIA Triad & Zero Trust, Page 5" });
        return;
      }
    }

    // =========================================================================
    // MODE B3: C++ PROGRAMMING SPECIFIC DETAIL DETECTORS
    // =========================================================================
    if (isCppNote) {
      // C++ Detail 1: Basic Coding, Syntax & Program Structure
      const isBasicCodingInquiry =
        /\b(basic|simple|sample|example|template|starter|fundamental|syntax|structure|format)\b.*\b(cod|code|coding|program|programming|c\+\+|cpp)\b/i.test(normalizedQuery) ||
        /\b(cod|code|coding|program|programming)\b.*\b(basic|simple|sample|example|template|starter|fundamental|syntax|format)\b/i.test(normalizedQuery) ||
        /\b(basic\s*(code|coding|program|programming|syntax)|how\s+to\s+(code|program|write\s*c\+\+|write\s*cpp)|start\s+(coding|programming)|cin|cout|iostream|hello\s*world|variable|variables|data\s*type|input\s*output)\b/i.test(normalizedQuery) ||
        /\b(give|show|provide|write|share)\b.*\b(code|coding|program)\b/i.test(normalizedQuery) ||
        /coding\s*(in\s*)?(the\s*)?coding\s*format/i.test(normalizedQuery);

      if (isBasicCodingInquiry) {
        const basicCodingReply =
          `💻 **C++ Basic Coding & Program Structure (${targetNote.subject_code} · Page 1):**\n\n` +
          `💡 **In Simple Words:** A C++ program is like a step-by-step recipe. It always starts execution inside \`int main()\`, asks the user for input with \`cin >>\`, makes decisions with \`if-else\`, and displays messages on screen using \`cout <<\`.\n\n` +
          `Here is the complete, standard C++ program template in official Politeknik coding format. It is fully executable and demonstrates standard headers, input/output streams, variables, and decision logic:\n\n` +
          `\`\`\`cpp\n` +
          `// =========================================================================\n` +
          `// Course: DFC11063 — Programming Fundamentals (Politeknik Kuching Sarawak)\n` +
          `// Program: Standard C++ Console Application Template\n` +
          `// =========================================================================\n` +
          `#include <iostream>   // Header file for standard console input/output\n` +
          `#include <string>     // Enables standard string variable handling\n` +
          `#include <iomanip>    // Formats floating-point numbers & output alignment\n` +
          `using namespace std;  // Allows using cout, cin without the std:: prefix\n\n` +
          `int main() {\n` +
          `    // 1. Variable Declarations with Data Types\n` +
          `    string studentName;\n` +
          `    string studentId;\n` +
          `    int examScore;\n` +
          `    double gpa = 3.85;\n` +
          `    char gradeLetter;\n` +
          `    bool hasPassed = false;\n\n` +
          `    // 2. Standard Output (cout) & User Prompt\n` +
          `    cout << "=== POLITEKNIK AI-LMS STUDENT GRADING SYSTEM ===" << endl;\n` +
          `    cout << "Enter Student Full Name: ";\n` +
          `    getline(cin, studentName); // Reads full line including spaces\n\n` +
          `    cout << "Enter Matrix / Student ID: ";\n` +
          `    cin >> studentId;\n\n` +
          `    cout << "Enter Final Exam Mark (0 - 100): ";\n` +
          `    cin >> examScore; // Standard Input (cin)\n\n` +
          `    // 3. Conditional Decision Logic (if-else if-else)\n` +
          `    if (examScore >= 80) {\n` +
          `        gradeLetter = 'A';\n` +
          `        hasPassed = true;\n` +
          `    } else if (examScore >= 65) {\n` +
          `        gradeLetter = 'B';\n` +
          `        hasPassed = true;\n` +
          `    } else if (examScore >= 50) {\n` +
          `        gradeLetter = 'C';\n` +
          `        hasPassed = true;\n` +
          `    } else {\n` +
          `        gradeLetter = 'F';\n` +
          `        hasPassed = false;\n` +
          `    }\n\n` +
          `    // 4. Output Formatted Results\n` +
          `    cout << "\\n----------------- RESULTS -----------------" << endl;\n` +
          `    cout << "Student Name : " << studentName << endl;\n` +
          `    cout << "Matrix ID    : " << studentId << endl;\n` +
          `    cout << "Exam Mark    : " << examScore << " / 100" << endl;\n` +
          `    cout << "Final Grade  : Grade " << gradeLetter << endl;\n` +
          `    cout << "Status       : " << (hasPassed ? "PASSED! Congratulations 🎉" : "FAILED (Repeat Examination)") << endl;\n` +
          `    cout << "-------------------------------------------" << endl;\n\n` +
          `    return 0; // Signals successful execution to the Operating System\n` +
          `}\n` +
          `\`\`\`\n\n` +
          `**2. Line-by-Line Technical Breakdown:**\n` +
          `• \`#include <iostream>\`: Preprocessor directive including standard header library for \`cin\` and \`cout\`.\n` +
          `• \`using namespace std;\`: Grants access to standard library identifiers without writing \`std::cout\` repeatedly.\n` +
          `• \`int main()\`: The universal mandatory entry point of all C++ programs where execution begins.\n` +
          `• \`cout <<\` (Stream Insertion Operator): Sends formatted text to the screen output.\n` +
          `• \`cin >>\` (Stream Extraction Operator): Reads user keyboard keystrokes into variables.\n` +
          `• \`return 0;\`: Returns status code \`0\` indicating the program exited cleanly without errors.\n\n` +
          `**3. Primary Data Types Summary:**\n` +
          `• \`int\`: 32-bit whole numbers (e.g. \`10\`, \`-5\`, \`100\`).\n` +
          `• \`double\` / \`float\`: Floating-point decimal numbers (e.g. \`3.85\`, \`99.5\`).\n` +
          `• \`char\`: Single character enclosed in single quotes (e.g. \`'A'\`, \`'9'\`).\n` +
          `• \`string\`: Text string enclosed in double quotes (e.g. \`"Politeknik"\`).\n` +
          `• \`bool\`: Boolean truth flag holding either \`true\` (1) or \`false\` (0).`;
        sendBotAnswer(basicCodingReply, "Here is the basic coding template, fundamental program structure, and syntax explanation for C++.", { page: 1, label: `${targetNote.subject_code} • Basic Coding, Page 1` });
        return;
      }

      // C++ Detail 2: Control Structures & Loops
      if (/\b(loop|loops|for\s+loop|while\s+loop|do\s+while|if\s+else|switch\s+case|conditional|control\s+structure)\b/i.test(normalizedQuery)) {
        const loopReply =
          `🔄 **C++ Control Structures & Loops (${targetNote.subject_code} · Page 2):**\n\n` +
          `💡 **In Simple Words:** Loops repeat actions so you don't have to write the same line twice. A \`for\` loop runs a set number of times (like doing 5 pushups). A \`while\` loop keeps running as long as a condition is true (like studying until the timer rings). \`if-else\` is a fork in the road.\n\n` +
          `**1. The \`for\` Loop (Best for Known Iteration Counts):**\n` +
          `\`\`\`cpp\n` +
          `#include <iostream>\n` +
          `using namespace std;\n\n` +
          `int main() {\n` +
          `    for (int i = 1; i <= 5; i++) {\n` +
          `        cout << "Iteration number: " << i << endl;\n` +
          `    }\n` +
          `    return 0;\n` +
          `}\n` +
          `\`\`\`\n` +
          `• Syntax: \`for (initialization; condition; increment/decrement)\`.\n\n` +
          `**2. The \`while\` Loop (Pre-Condition Checking):**\n` +
          `\`\`\`cpp\n` +
          `int count = 1;\n` +
          `while (count <= 3) {\n` +
          `    cout << "Count is: " << count << endl;\n` +
          `    count++;\n` +
          `}\n` +
          `\`\`\`\n` +
          `• Checks condition first; if condition is false at start, body never executes.\n\n` +
          `**3. The \`do-while\` Loop (Post-Condition Checking):**\n` +
          `\`\`\`cpp\n` +
          `int pin;\n` +
          `do {\n` +
          `    cout << "Enter security PIN (1234): ";\n` +
          `    cin >> pin;\n` +
          `} while (pin != 1234);\n` +
          `\`\`\`\n` +
          `• Guarantees code executes **at least once** before evaluating condition.\n\n` +
          `**4. Decision Branching (\`if-else if-else\` & \`switch\`):**\n` +
          `• \`if (condition) { ... } else { ... }\` directs program control flow based on boolean expressions.`;
        sendBotAnswer(loopReply, "Here is the explanation and code examples of C++ loops and control structures.", { page: 2, label: `${targetNote.subject_code} • Loops & Control, Page 2` });
        return;
      }

      // C++ Detail 3: Functions, Parameter Passing & Arrays
      if (/\b(function|functions|parameter|parameters|argument|return\s+type|pass\s+by\s+value|pass\s+by\s+ref|array|arrays)\b/i.test(normalizedQuery)) {
        const funcReply =
          `⚙️ **C++ Functions & Parameter Passing (${targetNote.subject_code} · Page 2):**\n\n` +
          `💡 **In Simple Words:** A function is a reusable mini-tool: you feed it ingredients (parameters), it does work, and gives you back a result (return value). Pass-by-value makes a photocopy of your data (safe), while pass-by-reference (\`&\`) hands over the original document!\n\n` +
          `**1. Function Declaration & Definition:**\n` +
          `\`\`\`cpp\n` +
          `#include <iostream>\n` +
          `using namespace std;\n\n` +
          `// ReturnType FunctionName(Parameters)\n` +
          `int addNumbers(int a, int b) {\n` +
          `    return a + b; // Returns integer sum\n` +
          `}\n\n` +
          `int main() {\n` +
          `    int result = addNumbers(15, 25);\n` +
          `    cout << "Sum: " << result << endl; // Output: 40\n` +
          `    return 0;\n` +
          `}\n` +
          `\`\`\`\n\n` +
          `**2. Pass-by-Value vs Pass-by-Reference:**\n` +
          `• **Pass-by-Value (\`void update(int x)\`):** Copies argument value into a local parameter. Modifying \`x\` has zero effect on caller variable.\n` +
          `• **Pass-by-Reference (\`void update(int &x)\`):** Uses reference operator \`&\` to alias original memory address. Changes directly affect the caller variable!\n\n` +
          `**3. Arrays (1D Array Declaration & Access):**\n` +
          `\`\`\`cpp\n` +
          `int scores[5] = {85, 92, 78, 90, 88};\n` +
          `cout << "First score: " << scores[0] << endl; // Index starts at 0\n` +
          `\`\`\``;
        sendBotAnswer(funcReply, "Here is how C++ functions, parameter passing, and arrays work.", { page: 2, label: `${targetNote.subject_code} • Functions & Arrays, Page 2` });
        return;
      }

      // C++ Detail 4: Pointers & References
      if (/\b(pointer|pointers|memory\s+address|dereference|dereferencing|address-of|nullptr|null\s+pointer)\b/i.test(normalizedQuery)) {
        const pointerReply =
          `💻 **C++ Pointers, Addresses & Dereferencing (${targetNote.subject_code} · Page 1):**\n\n` +
          `💡 **In Simple Words:** A regular variable is a locker storing a value. A **pointer** is a piece of paper with the **locker number (address)** written on it. \`&score\` gets the locker number, and \`*ptr\` opens the locker to read or edit what's inside!\n\n` +
          `Here is an executable code example demonstrating pointers, memory addresses, and dereferencing in C++:\n\n` +
          `\`\`\`cpp\n` +
          `#include <iostream>\n` +
          `using namespace std;\n\n` +
          `int main() {\n` +
          `    int score = 95;\n` +
          `    int* ptr = &score; // Stores physical RAM memory address of score\n\n` +
          `    cout << "Original Value of score : " << score << endl; // 95\n` +
          `    cout << "Memory Address (&score) : " << ptr << endl;   // e.g. 0x7ffee4b2\n` +
          `    cout << "Dereferenced (*ptr)     : " << *ptr << endl;  // 95\n\n` +
          `    // Modify score value directly via pointer!\n` +
          `    *ptr = 100;\n` +
          `    cout << "New Value of score      : " << score << endl; // 100\n\n` +
          `    int* nullPtr = nullptr; // C++11 safe null pointer\n` +
          `    return 0;\n` +
          `}\n` +
          `\`\`\`\n\n` +
          `• **Address-of Operator (\`&\`):** Retrieves the physical RAM memory address of a variable (\`&score\`).\n` +
          `• **Dereference Operator (\`*\`):** Accesses or modifies the value stored at the target memory address (\`*ptr = 100\`).\n` +
          `• **\`nullptr\`:** Represents a null pointer safely without integer-to-pointer ambiguity.`;
        sendBotAnswer(pointerReply, "Here is the explanation of C++ pointers, the address-of operator, dereferencing, and nullptr.", { page: 1, label: `${targetNote.subject_code} • C++ Pointers, Page 1` });
        return;
      }

      // C++ Detail 5: Dynamic Memory Allocation (new & delete)
      if (/\b(dynamic\s+memory|heap|stack|new\s+operator|delete\s+operator|malloc|free|memory\s+leak)\b/i.test(normalizedQuery)) {
        const memReply =
          `💾 **Dynamic Memory Allocation in C++ (\`new\` & \`delete\` · Page 2):**\n\n` +
          `💡 **In Simple Words:** The **Stack** is like sticky notes on your desk (fast, automatically recycled when you leave). The **Heap** is a rented storage locker you book with \`new\`—you must return the key with \`delete\`, or the space stays locked forever (a **memory leak**)!\n\n` +
          `\`\`\`cpp\n` +
          `#include <iostream>\n` +
          `using namespace std;\n\n` +
          `int main() {\n` +
          `    // 1. Allocate single integer on Heap\n` +
          `    int* ptr = new int;\n` +
          `    *ptr = 42;\n` +
          `    cout << "Heap Value: " << *ptr << endl;\n` +
          `    delete ptr;       // Deallocate to prevent memory leak!\n` +
          `    ptr = nullptr;    // Reset pointer\n\n` +
          `    // 2. Allocate dynamic array on Heap\n` +
          `    int size = 5;\n` +
          `    int* arr = new int[size];\n` +
          `    for (int i = 0; i < size; i++) arr[i] = (i + 1) * 10;\n` +
          `    delete[] arr;     // Free array memory\n` +
          `    arr = nullptr;\n` +
          `    return 0;\n` +
          `}\n` +
          `\`\`\`\n\n` +
          `• **Stack:** Fast, automatic memory allocation for local function variables. Deallocated upon return.\n` +
          `• **Heap:** Flexible runtime memory pool allocated dynamically using \`new\`. Must be freed using \`delete\` or \`delete[]\` to prevent memory leaks.`;
        sendBotAnswer(memReply, "Here is how dynamic memory allocation works in C++ using new and delete.", { page: 2, label: `${targetNote.subject_code} • Dynamic Memory, Page 2` });
        return;
      }

      // C++ Detail 6: Object-Oriented Programming (OOP) & 4 Pillars
      if (/\b(oop|object-oriented|class|classes|object|objects|encapsulation|abstraction|inheritance|polymorphism|constructor|destructor|virtual\s+function)\b/i.test(normalizedQuery)) {
        const oopReply =
          `🧱 **Object-Oriented Programming (OOP) & The 4 Pillars (${targetNote.subject_code} · Page 3):**\n\n` +
          `💡 **In Simple Words:** OOP models programs after real-world objects. A class is a blueprint (like blueprints for a Car), and an object is the actual car you build. Encapsulation puts the engine under the hood, Abstraction gives you pedals to drive, Inheritance makes a SportsCar from a standard Car, and Polymorphism lets any vehicle start with one ignition key.\n\n` +
          `\`\`\`cpp\n` +
          `#include <iostream>\n` +
          `#include <string>\n` +
          `using namespace std;\n\n` +
          `// Class demonstrating Encapsulation\n` +
          `class Student {\n` +
          `private:\n` +
          `    string name;   // Private data attribute\n` +
          `    int score;\n\n` +
          `public:\n` +
          `    // Constructor initializing object\n` +
          `    Student(string n, int s) : name(n), score(s) {}\n\n` +
          `    // Public Member Function\n` +
          `    void display() {\n` +
          `        cout << "Student: " << name << " | Score: " << score << "/100" << endl;\n` +
          `    }\n` +
          `};\n\n` +
          `int main() {\n` +
          `    Student s1("Daniel", 92); // Instantiate object\n` +
          `    s1.display();\n` +
          `    return 0;\n` +
          `}\n` +
          `\`\`\`\n\n` +
          `• **1. Encapsulation:** Bundling data and methods while restricting direct access via access specifiers (\`private\`, \`public\`).\n` +
          `• **2. Abstraction:** Hiding intricate internal details and exposing only essential interfaces.\n` +
          `• **3. Inheritance:** Reusing base class functionality in derived child classes (\`class Dog : public Animal\`).\n` +
          `• **4. Polymorphism:** Allowing objects of different types to respond to the same function call dynamically.`;
        sendBotAnswer(oopReply, "Here is the explanation of the four pillars of OOP: encapsulation, abstraction, inheritance, and polymorphism.", { page: 3, label: `${targetNote.subject_code} • OOP Fundamentals, Page 3` });
        return;
      }
    }

    // =========================================================================
    // MODE B4: COMPUTER HARDWARE SPECIFIC DETAIL DETECTORS
    // =========================================================================
    if (isHardwareNote) {
      // Hardware Detail 1: CPU Sockets & Architecture
      if (/\b(socket|sockets|lga|pga|bga|land\s+grid|pin\s+grid|ball\s+grid|processor|cpu\b)\b/i.test(normalizedQuery)) {
        const cpuReply =
          `⚡ **CPU Socket Types & Processor Architectures (${targetNote.subject_code} · Page 1):**\n\n` +
          `💡 **In Simple Words:** A CPU socket is how the processor chip connects to the motherboard. LGA puts the delicate pins on the motherboard socket to protect the CPU. PGA puts pins on the CPU chip itself. BGA solders the processor directly onto the board permanently (like in phones and thin laptops).\n\n` +
          `• **1. LGA (Land Grid Array):**\n` +
          `  - Pins are located on the **motherboard socket**; the CPU underside features flat gold contact pads.\n` +
          `  - Used by modern Intel processors (LGA1700, LGA1200) and modern AMD Ryzen (AM5).\n` +
          `  - Advantage: Prevents bent pins on expensive CPUs.\n` +
          `• **2. PGA (Pin Grid Array):**\n` +
          `  - Pins are attached directly to the **underside of the CPU** and insert into matching socket holes.\n` +
          `  - Used by legacy AMD processors (AM4, AM3).\n` +
          `• **3. BGA (Ball Grid Array):**\n` +
          `  - Solder balls fuse the processor directly onto the motherboard surface.\n` +
          `  - Non-removable/non-upgradable; standard in laptops, smartphones, and embedded SoC systems.`;
        sendBotAnswer(cpuReply, "Here is the comparison between LGA, PGA, and BGA CPU socket architectures.", { page: 1, label: `${targetNote.subject_code} • CPU Sockets, Page 1` });
        return;
      }

      // Hardware Detail 2: RAM vs ROM & DDR Technologies
      if (/\b(ram\b|rom\b|ddr|ddr4|ddr5|volatile|non-volatile|dimm|sodimm|ecc\b|bios|uefi)\b/i.test(normalizedQuery)) {
        const ramReply =
          `💾 **Memory Technologies: RAM vs ROM & DDR5 Innovations (${targetNote.subject_code} · Page 2):**\n\n` +
          `💡 **In Simple Words:** **RAM** is your open study desk where you keep books while working—super fast, but wiped clean the moment power is switched off (volatile). **ROM** is the permanent instruction plaque carved into the wall—it never forgets and boots up your computer (non-volatile BIOS/UEFI).\n\n` +
          `• **RAM (Random Access Memory):** Volatile primary storage; loses all data immediately when power is cut. Holds operating system instructions and active program data.\n` +
          `• **DDR4 vs DDR5 Differences:**\n` +
          `  - **Data Transfer Rate:** DDR5 starts at 4800 MT/s up to 7200+ MT/s (vs DDR4 2133–3200 MT/s).\n` +
          `  - **Operating Voltage:** DDR5 runs at 1.1V (more power-efficient than DDR4's 1.2V).\n` +
          `  - **On-Die ECC:** DDR5 integrates error-correcting code directly on the memory die to mitigate bit-flip errors.\n` +
          `• **ROM (Read-Only Memory):** Non-volatile firmware storage; permanently retains instructions without power. Stores the **BIOS / UEFI** code required for POST (Power-On Self-Test) and boot sequencing.`;
        sendBotAnswer(ramReply, "Here is the comparison between RAM and ROM, and DDR4 versus DDR5 memory technologies.", { page: 2, label: `${targetNote.subject_code} • RAM & ROM, Page 2` });
        return;
      }

      // Hardware Detail 3: Storage (NVMe M.2 vs SATA vs HDD)
      if (/\b(storage|nvme|m\.2|pcie|sata|ssd|hdd|hard\s+disk|solid\s+state)\b/i.test(normalizedQuery)) {
        const storageReply =
          `💿 **Storage Technologies: NVMe M.2 vs SATA SSD vs HDD (${targetNote.subject_code} · Page 3):**\n\n` +
          `💡 **In Simple Words:** Mechanical **HDD** is a record player with spinning magnetic discs (cheap, large capacity, but slow). **SATA SSD** is a solid-state drive (silent and 4-5x faster). **NVMe M.2** is a supersonic jet wired straight into the CPU's fastest lanes (10-15x faster than SATA SSD)!\n\n` +
          `• **1. NVMe M.2 SSD (PCIe Bus):**\n` +
          `  - Communicates directly with the CPU via high-speed PCI Express lanes (PCIe 3.0/4.0/5.0).\n` +
          `  - Sequential read speeds reach **3,500 MB/s to 7,000+ MB/s** with sub-millisecond latency.\n` +
          `• **2. SATA SSD (2.5-inch):**\n` +
          `  - Uses the legacy SATA III bus with a theoretical throughput ceiling of **550–600 MB/s**.\n` +
          `  - No moving parts, silent, and significantly faster than traditional HDDs.\n` +
          `• **3. HDD (Hard Disk Drive — Mechanical):**\n` +
          `  - Employs rotating magnetic platters (5400/7200 RPM) and mechanical actuator arms.\n` +
          `  - Read/write speeds typically **100–200 MB/s** with mechanical seek latency.\n` +
          `  - Vulnerable to physical drop shock, but provides cost-effective mass cold storage.`;
        sendBotAnswer(storageReply, "Here is the comparison of storage technologies: NVMe M.2, SATA SSD, and mechanical HDDs.", { page: 3, label: `${targetNote.subject_code} • Storage Technologies, Page 3` });
        return;
      }
    }

    // =========================================================================
    // MODE C: CHAPTER INFO & OVERVIEW ("ask about Chapter 1", "tell me about chapter 1", "overview", "give me about chapter 1")
    // =========================================================================
    const isChapterInfoRequest =
      /\b(chapter\s*\d+|bab\s*\d+|topic\s*\d+|1\.1|all\s*4\s*article|four\s*article|4\s*article|empat\s*artikel|full\s*info|info|overview|about\s*this\s*chapter|about\s*this\s*note|give\s*me\s*the\s*note|give\s*me\s*about\s*chapter|tell\s*me\s*about\s*chapter)\b/i.test(normalizedQuery) ||
      (/\bchapter\b/i.test(normalizedQuery) && /\b(give|tell|explain|show|what|about|info|guide)\b/i.test(normalizedQuery));

    if (isChapterInfoRequest) {
      // Dynamic chapter overview for technical course notes (C++, Network Security, Hardware, etc.)
      const logicalSecs = buildLogicalSections(fullNoteText);
      const overviewBullets = logicalSecs.slice(0, 5).map((sec, i) => `• **Topic Section ${i + 1}:** ${sec.slice(0, 260)}${sec.length > 260 ? '...' : ''}`);

      const fullTechnicalInfo =
        `📘 **COURSE CHAPTER OVERVIEW: ${targetNote.subject_code} — ${targetNote.title}**\n` +
        `📄 *Source File:* \`${targetNote.file_name}\`\n` +
        `👨‍🏫 *Uploaded by Lecturer:* **${targetNote.lecturer_name || 'Course Lecturer'}**\n\n` +
        `**🎯 Key Topics & Syllabus Coverage:**\n` +
        (overviewBullets.length > 0
          ? overviewBullets.join('\n\n')
          : `This chapter covers essential concepts for **${targetNote.subject_code} (${targetNote.title})**.\nFeel free to ask any specific question from this document!`) +
        `\n\n💡 *Tip: You can ask specific questions about definitions, syntax, code examples, security protocols, or type "summary" for a full revision sheet!*`;

      sendBotAnswer(
        fullTechnicalInfo,
        `Here is the overview for ${targetNote.subject_code} - ${targetNote.title}, uploaded by lecturer ${targetNote.lecturer_name || 'Course Lecturer'}.`
      );
      return;
    }

    // =========================================================================
    // MODE D: DEEP FULL-TEXT BILINGUAL SEARCH ACROSS ALL LOGICAL SECTIONS
    // =========================================================================
    const stopWords = new Set([
      'give', 'the', 'note', 'notes', 'please', 'plase', 'can', 'you', 'show', 'tell',
      'about', 'what', 'for', 'and', 'from', 'need', 'want', 'have', 'with', 'is', 'are',
      'was', 'were', 'so', 'me', 'my', 'this', 'that', 'in', 'of', 'to', 'on', 'how', 'why',
      'where', 'when', 'who', 'which', 'do', 'does', 'did', 'a', 'an', 'or', 'as', 'at', 'by',
      'saya', 'nak', 'tolong', 'bagi', 'apakah', 'siapakah', 'bagaimana', 'tentang', 'dalam', 'yang', 'dan', 'untuk'
    ]);

    const genericStudyWords = new Set([
      'chapter', 'topic', 'unit', 'module', 'section', 'part', 'bab', 'tajuk', 'topik',
      'purpose', 'objective', 'objectives', 'main', 'goal', 'intro', 'introduction',
      'summary', 'summarize', 'overview', 'definition', 'definitions', 'important',
      'key', 'point', 'points', 'explain', 'explanation', 'meaning', 'course',
      'study', 'material', 'lecture', 'slide', 'slides', 'download', 'file', 'pdf',
      'detail', 'details', 'info', 'information', 'fact', 'facts', 'page', 'hlm',
      'code', 'coding', 'program', 'programming', 'syntax', 'basic', 'basics', 'example',
      'how', 'what', 'write', 'learn', 'exercise', 'tutorial', 'problem', 'algorithm', 'guide',
      'device', 'component', 'system', 'structure', 'loop', 'function'
    ]);

    // Bilingual English <-> Malay concept expansion for coursework
    const bilingualSynonymMap = {
      security: ['keselamatan', 'perlindungan', 'firewall', 'pertahanan'],
      attack: ['serangan', 'pencerobohan', 'ancaman', 'threat'],
      defense: ['pertahanan', 'pencegahan', 'perlindungan', 'mitigasi'],
      network: ['rangkaian', 'networking', 'lan', 'wan'],
      protocol: ['protokol', 'peraturan', 'standard'],
      firewall: ['penghalang', 'tembok api', 'firewall'],
      memory: ['ingatan', 'memori', 'ram', 'penyimpanan'],
      hardware: ['perkakasan', 'komponen', 'peranti'],
      code: ['kod', 'program', 'aturcara', 'pengaturcaraan'],
      function: ['fungsi', 'kaedah', 'method'],
      error: ['ralat', 'masalah', 'bug', 'kegagalan'],
      summary: ['ringkasan', 'rumusan', 'sinopsis'],
      objective: ['objektif', 'matlamat', 'tujuan'],
      definition: ['definisi', 'takrifan', 'maksud', 'erti'],
    };

    const queryTokens = normalizedQuery
      .replace(/[^\w.\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopWords.has(w));

    // Expand query tokens with bilingual equivalents
    const expandedTokens = new Set(queryTokens);
    for (const token of queryTokens) {
      if (bilingualSynonymMap[token]) {
        bilingualSynonymMap[token].forEach(syn => expandedTokens.add(syn));
      }
    }

    const chapterCorpus = `${targetNote.subject_code || ''} ${targetNote.title || ''} ${targetNote.file_name || ''} ${fullNoteText}`.toLowerCase();

    // Check if any token or 4-character prefix stem matches the chapter corpus
    const matchedTokens = Array.from(expandedTokens).filter(tok => {
      if (chapterCorpus.includes(tok)) return true;
      if (tok.length >= 5 && chapterCorpus.includes(tok.slice(0, 5))) return true;
      return false;
    });

    const hasStudyIntent =
      Boolean(targetNumber) ||
      queryTokens.some(w => genericStudyWords.has(w));

    // If zero tokens matched in the active note and no study intent: check other notes before giving up!
    if (matchedTokens.length === 0 && !hasStudyIntent) {
      const altNote = notesList.find(n => {
        if (n.id === targetNote.id) return false;
        const corpus = `${n.subject_code} ${n.title} ${n.file_name} ${cleanPdfExtractedText(noteContentsMap[n.id] || '')}`.toLowerCase();
        return Array.from(expandedTokens).some(tok => corpus.includes(tok));
      });

      if (altNote) {
        setSelectedNoteId(altNote.id);
        loadNoteContent(altNote.id);
        const altText = cleanPdfExtractedText(noteContentsMap[altNote.id] || '') || buildClientStudyGuide(altNote);
        const altSections = buildLogicalSections(altText);
        const altScored = altSections.map(sec => {
          let hits = 0;
          for (const tok of expandedTokens) {
            if (sec.toLowerCase().includes(tok)) hits += 3;
          }
          return { sec, hits };
        }).filter(s => s.hits > 0).sort((a, b) => b.hits - a.hits);

        const altExcerpt = altScored.length > 0
          ? altScored.slice(0, 2).map(s => s.sec).join('\n\n')
          : `Here is the relevant study material from ${altNote.title}.`;

        const autoSwitchNotice =
          `💡 *Auto-detected course: Switched to **${altNote.subject_code} — ${altNote.title}** to answer your question!*\n\n` +
          `📘 **${altNote.subject_code} — ${altNote.title}:**\n\n` +
          `${altExcerpt}\n\n` +
          `💡 *Tip: Feel free to ask more questions about ${altNote.title} or click the Quick Ask topics below!*`;

        sendBotAnswer(autoSwitchNotice, `Switched to ${altNote.title} to answer your question.`, { page: 1, label: `${altNote.subject_code}, Page 1` });
        return;
      }

      // Soft pedagogical tutor guide instead of harsh refusal
      const friendlyGuide =
        `💡 **AI Study Assistant — Course Topics & Recommendations:**\n\n` +
        `I am your course study assistant for your uploaded lecture notes:\n` +
        `${notesList.map(n => `• **${n.subject_code}**: ${n.title} *(Uploaded by ${n.lecturer_name || 'Lecturer'})*`).join('\n')}\n\n` +
        `For **"${userText}"**, here is how I can best assist you:\n` +
        `• **Explore by Topic:** Use the course chips above the input to view **C++ Programming** (coding, syntax, loops, OOP), **Network Security** (firewalls, TCP SYN, IDS/IPS), or **Computer Hardware** (CPU sockets, RAM/ROM, NVMe).\n` +
        `• **Summary Revision Sheet:** Type *"Give me a summary of Chapter 1"* for an instant cheat sheet.\n` +
        `• **Knowledge Check:** Type *"Generate 5 practice questions"* to test yourself!\n\n` +
        `👉 *Feel free to ask about any specific definition, formula, code example, or architecture!*`;
      sendBotAnswer(friendlyGuide, "Here are the study topics and chapters available in your uploaded lecture notes.");
      return;
    }

    // Score all logical multi-sentence sections in the document
    const logicalSections = buildLogicalSections(fullNoteText);
    const scoredSections = logicalSections.map((sec, idx) => {
      const secLower = sec.toLowerCase();
      let hits = 0;
      for (const tok of expandedTokens) {
        if (genericStudyWords.has(tok)) continue;
        if (secLower.includes(tok)) {
          hits += tok.length >= 5 ? 6 : 3;
        } else if (tok.length >= 5 && secLower.includes(tok.slice(0, 5))) {
          hits += 2;
        }
      }
      return { idx, hits, text: sec };
    }).filter(s => s.hits > 0);

    scoredSections.sort((a, b) => b.hits - a.hits);

    if (scoredSections.length > 0) {
      const responseText = simplifyNoteExcerpt(scoredSections, targetNote, userText);
      sendBotAnswer(responseText, `Here is the simplified explanation from ${targetNote.title}.`, { page: 1, label: `${targetNote.subject_code}, Page 1` });
    } else {
      const fallbackOverview =
        `📘 **Core Concepts & Study Guide: ${targetNote.subject_code} — ${targetNote.title}**\n` +
        `📄 *Source Document:* \`${targetNote.file_name}\`\n` +
        `👨‍🏫 *Course Lecturer:* **${targetNote.lecturer_name || 'Course Lecturer'}**\n\n` +
        `Here is the key conceptual study breakdown for your inquiry on **"${userText}"**:\n\n` +
        `• **Subject Focus:** This topic is part of the uploaded curriculum for **${targetNote.subject_code} (${targetNote.title})**.\n` +
        `• **Core Learning Objectives:** Review the primary definitions, operational architectures, and practical lab implementations specified in this chapter.\n` +
        `• **Recommended Study Prompts:**\n` +
        `  - *"Summarize the core topics in this note"*\n` +
        `  - *"Explain the main definitions and architectures"*\n` +
        `  - *"Generate 5 practice questions for this chapter"*\n\n` +
        `💡 *You can ask specific questions about any formula, definition, code example, or security protocol in this chapter!*`;
      sendBotAnswer(fallbackOverview, `Here is the core conceptual overview for ${targetNote.title}.`);
    }
  };

  const handleSendMessage = () => {
    processStudentQuery(inputValue);
  };

  const speakText = (text) => {
    if (!voiceEnabled) return;
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[📘📚💡✅⏳🏆]/gu, '').replace(/⬇️?/gu, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();

    const selectedVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      if (lecturerVoice === "female") {
        return name.includes("female") || name.includes("zira") || name.includes("samantha");
      } else {
        return name.includes("male") || name.includes("david") || name.includes("george");
      }
    });

    if (lecturerVoice === "male") {
      utterance.rate = 0.95;
      utterance.pitch = 0.85;
    }

    if (selectedVoice) utterance.voice = selectedVoice;
    window.speechSynthesis.speak(utterance);
  };

  // =========================================================================
  // 5-QUESTION QUIZ GENERATOR FOR STUDENTS
  // =========================================================================
  const generateFiveQuestions = () => {
    if (notesList.length === 0) {
      setQuizQuestions([]);
      setQuizBannerMessage("⚠️ Cannot generate quiz: No lecture notes have been uploaded yet by your lecturer.");
      return false;
    }

    const activeNote = notesList.find(n => String(n.id) === String(selectedNoteId)) || notesList[0];
    const noteTitle = activeNote ? activeNote.title : "Course Notes";
    const subjectCode = activeNote ? activeNote.subject_code : "Course";
    const rawLoaded = (noteContentsMap[activeNote?.id] || notesContent || "")
      .split(/\r?\n/)
      .filter(l => !l.trim().startsWith("Title:") && !l.trim().startsWith("Filename:"))
      .join("\n")
      .trim();
    const combinedText = `${rawLoaded}\n${buildClientStudyGuide(activeNote)}`;

    const cleanSentences = combinedText
      .split(/[.\n]/)
      .map(s => s.replace(/\s+/g, ' ').trim())
      .filter(s => s.length >= 25 && s.length <= 160 && !s.startsWith("Title:") && !s.startsWith("Filename:"));

    const distractorPool = [
      "This statement is not part of the syllabus or uploaded lecture slides.",
      "It is an outdated hardware limitation unrelated to this course topic.",
      "This approach is strictly avoided because it causes system failure.",
      "None of the above; this concept belongs to an unrelated module.",
      "It only applies to offline manual paper filing systems.",
      "This is a misconception that contradicts the core principles in the notes."
    ];

    const shuffleOptions = (opts) => {
      const copy = [...opts];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const fiveQuestions = [];
    const questionTemplates = [
      (idx) => `Q${idx + 1}. Based on "${noteTitle}" (${subjectCode}), which of the following is a key concept stated in the lecture notes?`,
      (idx) => `Q${idx + 1}. According to the uploaded study material for ${subjectCode}, which statement is TRUE?`,
      (idx) => `Q${idx + 1}. In "${noteTitle}", which of the following points is highlighted by your lecturer?`,
      (idx) => `Q${idx + 1}. Review Question (${subjectCode}): Identify the accurate explanation from "${noteTitle}":`,
      (idx) => `Q${idx + 1}. Summary Check for "${noteTitle}": Which statement correctly reflects the course notes?`
    ];

    for (let i = 0; i < 5; i++) {
      let correctFact = "";
      if (cleanSentences.length > i) {
        const step = Math.max(1, Math.floor(cleanSentences.length / 5));
        correctFact = cleanSentences[(i * step) % cleanSentences.length];
      } else if (cleanSentences.length > 0) {
        correctFact = cleanSentences[i % cleanSentences.length];
      } else {
        correctFact = `Understanding the core principles, definitions, and practical applications of ${noteTitle} (${subjectCode}).`;
      }

      const d1 = distractorPool[(i * 2) % distractorPool.length];
      const d2 = distractorPool[(i * 2 + 1) % distractorPool.length];
      const d3 = distractorPool[(i * 2 + 2) % distractorPool.length];

      fiveQuestions.push({
        id: i + 1,
        question: questionTemplates[i](i),
        options: shuffleOptions([
          { text: correctFact, correct: true },
          { text: d1, correct: false },
          { text: d2, correct: false },
          { text: d3, correct: false }
        ])
      });
    }

    setQuizQuestions(fiveQuestions);
    setQuizSelections({});
    setQuizBannerMessage(`✅ Generated 5 practice questions from "${subjectCode} - ${noteTitle}"!`);
    return true;
  };

  const handleSelectQuizOption = (qIndex, optIndex, isCorrect) => {
    if (quizSelections[qIndex] !== undefined) return; // already answered this question
    setQuizSelections(prev => ({
      ...prev,
      [qIndex]: { optIndex, isCorrect }
    }));
  };

  if (!user) return null;

  const selectedNote = notesList.find(n => String(n.id) === String(selectedNoteId));
  const initials = (user.full_name || user.username || "ST")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const totalAnswered = Object.keys(quizSelections).length;
  const totalCorrect = Object.values(quizSelections).filter(v => v.isCorrect).length;

  const filteredNotes = notesList.filter(n => {
    if (!materialSearch.trim()) return true;
    const q = materialSearch.toLowerCase();
    return (
      (n.title || '').toLowerCase().includes(q) ||
      (n.subject_code || '').toLowerCase().includes(q) ||
      (n.file_name || '').toLowerCase().includes(q) ||
      (n.lecturer_name || '').toLowerCase().includes(q)
    );
  });

  const tabMeta = {
    overview: { title: "Student Learning Hub", subtitle: "Easy-to-use overview of your AI study assistant, notes, quiz, and homework" },
    chat: { title: "AI Study Companion", subtitle: "Ask for any Chapter (e.g. Chapter 1 or 1.1), summary, or instant note download" },
    quiz: { title: "5-Question Practice Quiz", subtitle: "Test your understanding with 5 AI-generated questions from your notes" },
    materials: { title: "Course Materials & Notes", subtitle: "Search and download lecture notes uploaded by your lecturers" },
    assignments: { title: "Assignments & Homework", subtitle: "Download assignment sheets and upload your homework submissions" },
    contact: { title: "Contact Lecturer & Admin Support", subtitle: "Ask your lecturer questions (with your Class & Matrix ID) or report system errors to Admin" },
    profile: { title: "Student Profile", subtitle: "Your academic registration details and Matrix ID" }
  };

  const renderChatCard = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            🎓 Smart AI Study Companion
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Ask for any chapter (e.g., <strong>"Give me Chapter 1 or Chapter 1.1 note"</strong>) — the AI automatically detects the right chapter across all notes!
          </p>
        </div>
      </div>

      {/* Note Status Banner */}
      {loadingNotes ? (
        <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading course materials...</div>
      ) : notesList.length === 0 ? (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px dashed rgba(239, 68, 68, 0.35)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.5rem' }}>📭</span>
          <div>
            <div style={{ fontWeight: 600, color: '#f87171', fontSize: '0.95rem' }}>No Lecture Notes Uploaded Yet</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Your lecturer has not uploaded any study notes yet. The AI will learn and answer questions once notes are uploaded in the Lecturer Dashboard.
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>📚</span>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Active Chapter / Note (AI also searches all {notesList.length} uploaded notes):</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '3px' }}>
                <span style={{ fontWeight: 600, color: '#10b981', fontSize: '0.95rem' }}>
                  {selectedNote ? `${selectedNote.subject_code} - ${selectedNote.title}` : 'Selected Course Material'}
                </span>
                <span style={{
                  fontSize: '0.78rem',
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 600
                }}>
                  👨‍🏫 Lecturer: {selectedNote?.lecturer_name || 'Course Lecturer'}
                </span>
              </div>
            </div>
          </div>

          <div className="note-picker-container">
            <select
              value={selectedNoteId}
              onChange={handleNoteChange}
              className="form-select note-picker-select"
            >
              <option value="auto">✨ All Notes (Universal Auto-Detect)</option>
              {notesList.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.subject_code} - {n.title} {n.lecturer_name ? `(Lecturer: ${n.lecturer_name})` : ''}
                </option>
              ))}
            </select>
            {selectedNote && (
              <div className="note-action-btns">
                <button
                  type="button"
                  onClick={() => handleOpenPreviewNote(selectedNote)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                  title="Preview PDF and images in browser"
                >
                  👁️ Preview Note
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadNote(selectedNote.id)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  title="Download this lecture note"
                >
                  ⬇️ Download Note
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Friendly Course & Topic Navigation Strip */}
      {notesList.length > 0 && (
        <div className="course-nav-strip">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            🧭 <strong>Courses:</strong>
          </span>
          <button
            type="button"
            className={`quick-ask-pill-chip ${selectedNoteId === 'auto' ? 'active' : ''}`}
            onClick={() => setSelectedNoteId('auto')}
            style={{
              background: selectedNoteId === 'auto' ? 'rgba(56, 189, 248, 0.2)' : undefined,
              borderColor: selectedNoteId === 'auto' ? '#38bdf8' : undefined,
              color: selectedNoteId === 'auto' ? '#38bdf8' : undefined,
              fontWeight: 600
            }}
          >
            ✨ Auto-Detect (All Courses)
          </button>
          {notesList.map((note) => {
            const isSelected = String(note.id) === String(selectedNoteId);
            const icon = /dfc|c\+\+|cpp|programming/i.test(note.subject_code) ? '💻' : /dfk|dft|hardware/i.test(note.subject_code) ? '⚡' : '🛡️';
            return (
              <button
                key={note.id}
                type="button"
                className={`quick-ask-pill-chip ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setSelectedNoteId(note.id);
                  loadNoteContent(note.id);
                }}
                style={{
                  background: isSelected ? 'rgba(16, 185, 129, 0.18)' : undefined,
                  borderColor: isSelected ? '#10b981' : undefined,
                  color: isSelected ? '#10b981' : undefined,
                  fontWeight: isSelected ? 600 : 400
                }}
              >
                {icon} {note.subject_code}: {note.title.length > 24 ? note.title.slice(0, 22) + '...' : note.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Redesigned Sleek Quick Ask Menu & Horizontal Pill Bar */}
      <div className="quick-ask-bar-container">
        {/* Menu Dropdown Trigger Button */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className={`quick-ask-menu-trigger ${quickAskMenuOpen ? 'active' : ''}`}
            onClick={() => setQuickAskMenuOpen(!quickAskMenuOpen)}
            title="Browse all Quick Ask questions and topics"
          >
            <span>⚡ Quick Ask Menu</span>
            <span style={{ fontSize: '0.72rem', transform: quickAskMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>

          {quickAskMenuOpen && (
            <>
              <div className="quick-ask-dropdown-backdrop" onClick={() => setQuickAskMenuOpen(false)} />
              <div className="quick-ask-dropdown">
                <div className="theme-menu-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚡</span>
                    <span>Quick Ask Topics</span>
                  </span>
                  <span className="theme-status-tag" style={{ background: 'rgba(56, 189, 248, 0.16)', color: '#38bdf8' }}>
                    1-CLICK AI
                  </span>
                </div>

              <div className="quick-ask-category">💻 C++ Programming (DFC11063)</div>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Can you give me the basic coding for C++?"); setQuickAskMenuOpen(false); }}
              >
                <span>💻</span>
                <span>Basic Coding & Syntax Template</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("How do loops and if-else work in C++?"); setQuickAskMenuOpen(false); }}
              >
                <span>🔄</span>
                <span>Loops (for, while, do-while) & Control</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Explain functions and parameter passing in C++"); setQuickAskMenuOpen(false); }}
              >
                <span>⚙️</span>
                <span>Functions & Parameter Passing</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Explain pointers and memory addresses in C++"); setQuickAskMenuOpen(false); }}
              >
                <span>📍</span>
                <span>Pointers & Memory Addresses</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Explain the 4 pillars of OOP in C++"); setQuickAskMenuOpen(false); }}
              >
                <span>🧱</span>
                <span>OOP & The 4 Pillars</span>
              </button>

              <div className="quick-ask-category">🛡️ Network Security (DFN10078)</div>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Explain firewall types and DMZ architecture"); setQuickAskMenuOpen(false); }}
              >
                <span>🛡️</span>
                <span>Firewalls & DMZ Architecture</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("How does TCP SYN Flood attack work and what are SYN cookies?"); setQuickAskMenuOpen(false); }}
              >
                <span>⚡</span>
                <span>TCP SYN Flood & SYN Cookies Defense</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Compare IDS versus IPS detection"); setQuickAskMenuOpen(false); }}
              >
                <span>🔍</span>
                <span>IDS vs IPS Detection Comparison</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Explain IPsec AH vs ESP and tunnel versus transport modes"); setQuickAskMenuOpen(false); }}
              >
                <span>🔐</span>
                <span>IPsec Architecture & VPN Modes</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Explain boundary router hardening and perimeter defense"); setQuickAskMenuOpen(false); }}
              >
                <span>🌐</span>
                <span>Boundary Routers & Perimeter Defense</span>
              </button>

              <div className="quick-ask-category">⚡ Computer Hardware (DFK10053)</div>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Explain LGA vs PGA vs BGA CPU sockets"); setQuickAskMenuOpen(false); }}
              >
                <span>⚡</span>
                <span>CPU Sockets: LGA vs PGA vs BGA</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Compare RAM vs ROM and DDR4 vs DDR5"); setQuickAskMenuOpen(false); }}
              >
                <span>💾</span>
                <span>RAM vs ROM & DDR4 vs DDR5 Differences</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Compare NVMe M.2 SSD vs SATA SSD vs HDD"); setQuickAskMenuOpen(false); }}
              >
                <span>💿</span>
                <span>NVMe M.2 SSD vs SATA SSD vs HDD</span>
              </button>

              <div className="quick-ask-category">📚 Universal Study Tools & Attribution</div>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Give me Chapter 1 info"); setQuickAskMenuOpen(false); }}
              >
                <span>📘</span>
                <span>Chapter 1 Full Information</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Can you simple the note for me?"); setQuickAskMenuOpen(false); }}
              >
                <span>💡</span>
                <span>Simplify Note (In Simple Words)</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Help me do the summary note for Chapter 1"); setQuickAskMenuOpen(false); }}
              >
                <span>📝</span>
                <span>Generate Smart Summary Note</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Which lecturer uploaded this note?"); setQuickAskMenuOpen(false); }}
              >
                <span>👨‍🏫</span>
                <span>Note Lecturer & Course Info</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { processStudentQuery("Generate 5 practice questions for me"); setQuickAskMenuOpen(false); }}
              >
                <span>❓</span>
                <span>Generate 5 Practice Questions</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { setFlashcardsOpen(true); setQuickAskMenuOpen(false); }}
              >
                <span>📇</span>
                <span>Open Revision Flashcards Deck</span>
              </button>
              <button
                type="button"
                className="quick-ask-item"
                onClick={() => { handleExportSummaryPdf(); setQuickAskMenuOpen(false); }}
              >
                <span>📄</span>
                <span>Export Revision Study Sheet (PDF)</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Quick Trending Pill Chips tailored to the active subject */}
      <div className="quick-trending-pills-row">
          {/* C++ Specific Pills */}
          {(selectedNoteId === 'auto' || /dfc|c\+\+|cpp|programming/i.test(selectedNote?.subject_code || '')) && (
            <>
              <button
                type="button"
                className="quick-ask-pill-chip"
                onClick={() => processStudentQuery("Can you give me the basic coding for C++?")}
              >
                💻 Basic C++ Code
              </button>
              <button
                type="button"
                className="quick-ask-pill-chip"
                onClick={() => processStudentQuery("How do loops and if-else work in C++?")}
              >
                🔄 Loops & If-Else
              </button>
              <button
                type="button"
                className="quick-ask-pill-chip"
                onClick={() => processStudentQuery("Explain pointers and memory addresses in C++")}
              >
                📍 Pointers
              </button>
            </>
          )}

          {/* Network Security Specific Pills */}
          {(selectedNoteId === 'auto' || /dfn|security|firewall/i.test(selectedNote?.subject_code || '')) && (
            <>
              <button
                type="button"
                className="quick-ask-pill-chip"
                onClick={() => processStudentQuery("Explain firewall types and DMZ architecture")}
              >
                🛡️ Firewalls & DMZ
              </button>
              <button
                type="button"
                className="quick-ask-pill-chip"
                onClick={() => processStudentQuery("How does TCP SYN Flood attack work and what are SYN cookies?")}
              >
                ⚡ TCP SYN Flood
              </button>
              <button
                type="button"
                className="quick-ask-pill-chip"
                onClick={() => processStudentQuery("Compare IDS versus IPS detection")}
              >
                🔍 IDS vs IPS
              </button>
            </>
          )}

          {/* Hardware Specific Pills */}
          {(selectedNoteId === 'auto' || /dfk|dft|hardware/i.test(selectedNote?.subject_code || '')) && (
            <>
              <button
                type="button"
                className="quick-ask-pill-chip"
                onClick={() => processStudentQuery("Explain LGA vs PGA vs BGA CPU sockets")}
              >
                ⚡ CPU Sockets
              </button>
              <button
                type="button"
                className="quick-ask-pill-chip"
                onClick={() => processStudentQuery("Compare RAM vs ROM and DDR4 vs DDR5")}
              >
                💾 RAM vs ROM
              </button>
            </>
          )}

          {/* Universal Study Pills */}
          <button
            type="button"
            className="quick-ask-pill-chip"
            onClick={() => processStudentQuery("Can you simple the note for me?")}
            style={{ color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.4)' }}
          >
            💡 Simplify Note
          </button>
          <button
            type="button"
            className="quick-ask-pill-chip"
            onClick={() => processStudentQuery("Help me do the summary note for Chapter 1")}
          >
            📝 Smart Summary
          </button>
          <button
            type="button"
            className="quick-ask-pill-chip"
            onClick={() => processStudentQuery("Generate 5 practice questions for me")}
          >
            ❓ Practice Quiz
          </button>
          <button
            type="button"
            className="quick-ask-pill-chip"
            onClick={() => setFlashcardsOpen(true)}
            style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
          >
            📇 Flashcards
          </button>
          <button
            type="button"
            className="quick-ask-pill-chip"
            onClick={handleExportSummaryPdf}
            style={{ color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.4)' }}
          >
            📄 Study PDF
          </button>
        </div>
      </div>

      {/* Voice Controls & Chat Toolbar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px' }}>
        <div>
          <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.8rem' }}>AI Voice Profile:</label>
          <select 
            value={lecturerVoice} 
            onChange={(e) => setLecturerVoice(e.target.value)} 
            className="form-select"
            style={{ padding: '7px' }}
          >
            <option value="male">Male Lecturer Voice</option>
            <option value="female">Female Lecturer Voice</option>
          </select>
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
          <input 
            type="checkbox" 
            checked={voiceEnabled} 
            onChange={(e) => setVoiceEnabled(e.target.checked)} 
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} 
          />
          Enable Voice Read-Aloud (TTS)
        </div>
      </div>

      {/* Chat Interface */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '450px', border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.4)', overflow: 'hidden' }}>
        {/* Chat Utility Bar */}
        <div className="chat-utility-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Font:</span>
            <button
              type="button"
              onClick={() => setChatFontSize('small')}
              style={{
                background: chatFontSize === 'small' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                cursor: 'pointer'
              }}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setChatFontSize('normal')}
              style={{
                background: chatFontSize === 'normal' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setChatFontSize('large')}
              style={{
                background: chatFontSize === 'large' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              A+
            </button>
          </div>

          <div className="chat-utility-actions">
            <button
              type="button"
              onClick={handleExportSummaryPdf}
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.16), rgba(220, 38, 38, 0.26))',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                color: '#fca5a5',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap'
              }}
              title="Export formatted Politeknik revision notes as PDF"
            >
              <span>📄</span>
              <span className="chat-util-label-full">Export Summary as PDF</span>
              <span className="chat-util-label-short">PDF Export</span>
            </button>
            <button
              type="button"
              onClick={() => setFlashcardsOpen(true)}
              style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.16), rgba(37, 99, 235, 0.26))',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                color: '#38bdf8',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap'
              }}
              title="Open 3D interactive revision flashcards deck"
            >
              <span>📇</span>
              <span className="chat-util-label-full">Flashcards Deck</span>
              <span className="chat-util-label-short">Flashcards</span>
            </button>
            <button
              type="button"
              onClick={handleExportStudyNotes}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Download chat notes as .txt"
            >
              💾 .txt
            </button>
            <button
              type="button"
              onClick={handleClearChat}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Clear chat messages"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        <div style={{ flexGrow: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              style={{ 
                maxWidth: '90%', 
                padding: '12px 16px', 
                borderRadius: '16px', 
                fontSize: chatFontSize === 'large' ? '1.05rem' : chatFontSize === 'small' ? '0.82rem' : '0.92rem', 
                lineHeight: '1.55',
                whiteSpace: 'pre-wrap',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'user' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                color: msg.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                fontWeight: msg.sender === 'user' ? '500' : 'normal',
                borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: msg.sender === 'bot' ? '4px' : '16px',
              }}
            >
              {msg.sender === 'bot' ? (
                <FormattedChatMessage content={msg.text} />
              ) : (
                msg.text
              )}
              {msg.source && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                      📖 Detected Material: {msg.source}
                    </span>
                    {msg.noteId && (
                      <button
                        type="button"
                        onClick={() => handleOpenPreviewNote(msg.noteId, msg.source, msg.page || 1)}
                        className="badge-citation"
                        title={`Click to open PDF previewer scrolled right to Page ${msg.page || 1}`}
                      >
                        <span>📄</span>
                        <span>[📄 {msg.citationLabel || `Page ${msg.page || 1}`}]</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>↗</span>
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(msg.text);
                      }}
                      style={{
                        background: 'rgba(56, 189, 248, 0.18)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Copy this summary note or explanation"
                    >
                      📋 Copy Note
                    </button>
                    {msg.noteId && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenPreviewNote(msg.noteId, msg.source, msg.page || 1)}
                          style={{
                            background: 'rgba(56, 189, 248, 0.2)',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            color: '#38bdf8',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          title={`Preview full note scrolled to Page ${msg.page || 1}`}
                        >
                          👁️ Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadNote(msg.noteId)}
                          title={`Download ${msg.noteFileName || 'Note'}`}
                          style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            color: '#34d399',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          ⬇️ Download Note
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', padding: '12px', borderTop: '1px solid var(--border)', gap: '12px', background: 'rgba(30, 41, 59, 0.8)' }}>
          <input 
            type="text" 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
            placeholder={selectedNote ? `Ask anything about ${selectedNote.subject_code} (${selectedNote.title}): e.g. "Chapter 1 info", "Summary note", "Who uploaded this note"...` : 'Ask anything from your uploaded lecture notes: e.g. "Chapter 1 info", "Summary note"...'} 
            className="form-input"
          />
          <button 
            onClick={handleSendMessage} 
            className="btn-primary"
            style={{ width: 'auto', padding: '0 24px', margin: 0 }}
          >
            Ask AI
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuizCard = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>📝 AI Knowledge Check (5 Practice Questions)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Automatically generates <strong>5 multiple-choice questions</strong> from your selected chapter note so you can test your mastery.
          </p>
        </div>
        <button onClick={generateFiveQuestions} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '10px 20px' }}>
          ⚡ Generate 5 Practice Questions
        </button>
      </div>

      {quizBannerMessage && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          color: '#38bdf8',
          fontSize: '0.86rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <span>{quizBannerMessage}</span>
          {quizQuestions.length > 0 && (
            <span style={{ fontWeight: 700, color: '#10b981' }}>
              🏆 Your Score: {totalCorrect} / {quizQuestions.length} ({totalAnswered} of 5 answered)
            </span>
          )}
        </div>
      )}

      {quizQuestions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '6px' }}>
          {quizQuestions.map((q, qIdx) => {
            const answered = quizSelections[qIdx];
            return (
              <div
                key={q.id}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                  {q.question}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                  {q.options.map((opt, optIdx) => {
                    let bg = 'rgba(255, 255, 255, 0.04)';
                    let borderCol = 'var(--border)';
                    let textCol = 'var(--text-main)';

                    if (answered !== undefined) {
                      if (opt.correct) {
                        bg = 'rgba(16, 185, 129, 0.2)';
                        borderCol = '#10b981';
                        textCol = '#6ee7b7';
                      } else if (answered.optIndex === optIdx && !opt.correct) {
                        bg = 'rgba(239, 68, 68, 0.2)';
                        borderCol = '#ef4444';
                        textCol = '#fca5a5';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectQuizOption(qIdx, optIdx, opt.correct)}
                        style={{
                          background: bg,
                          border: `1px solid ${borderCol}`,
                          borderRadius: '8px',
                          padding: '10px 14px',
                          color: textCol,
                          textAlign: 'left',
                          cursor: answered !== undefined ? 'default' : 'pointer',
                          fontSize: '0.88rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt.text}
                      </button>
                    );
                  })}
                </div>
                {answered !== undefined && (
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: answered.isCorrect ? '#10b981' : '#f87171' }}>
                    {answered.isCorrect ? '🎉 Correct! Great job.' : '❌ Incorrect — the green highlighted option is the statement from your lecture notes.'}
                  </div>
                )}
              </div>
            );
          })}

          {/* Completion Celebration Card */}
          {quizQuestions.length > 0 && totalAnswered === quizQuestions.length && (
            <div style={{
              background: totalCorrect >= 4 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%)',
              border: '1px solid ' + (totalCorrect >= 4 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'),
              borderRadius: '12px',
              padding: '24px 20px',
              textAlign: 'center',
              marginTop: '10px'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                {totalCorrect === 5 ? '🏆 Outstanding!' : totalCorrect >= 3 ? '👏 Well Done!' : '💪 Keep Practicing!'}
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '6px', color: totalCorrect >= 4 ? '#6ee7b7' : '#fcd34d' }}>
                Quiz Completed! Score: {totalCorrect} / {quizQuestions.length} ({Math.round((totalCorrect / quizQuestions.length) * 100)}%)
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto 16px', lineHeight: '1.5' }}>
                {totalCorrect === 5
                  ? '🌟 Perfect score! You have completely mastered all concepts tested from this chapter note.'
                  : totalCorrect >= 3
                  ? '💡 Good job! Review the questions above or ask the AI Study Companion in the chat tab to explain the topics you missed.'
                  : '📚 Recommended Revision: Ask the AI "Help me do the summary note for Chapter 1" to strengthen your understanding before retrying!'}
              </p>
              <button
                type="button"
                onClick={generateFiveQuestions}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', margin: 0 }}
              >
                🔄 Practice with 5 New Questions
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: '0.9rem', background: 'rgba(56, 189, 248, 0.04)', borderRadius: '10px', border: '1px dashed rgba(56, 189, 248, 0.25)' }}>
          Click <strong>"⚡ Generate 5 Practice Questions"</strong> above to immediately create a 5-question quiz set from your lecture notes!
        </div>
      )}
    </div>
  );

  // Build live notifications for all student activities (new assignments, lecturer replies, graded homework, admin replies, new notes)
  const notificationsList = [
    ...myLecturerMessages
      .filter(m => m.status === 'answered' || m.reply)
      .map(m => ({
        id: `lec-reply-${m.id}`,
        icon: '👨‍🏫',
        color: '#10b981',
        title: `Lecturer Replied (${m.subject_code || 'Class Q&A'})`,
        detail: `${m.lecturer_name || 'Your Lecturer'} replied: "${(m.reply || '').slice(0, 75)}${(m.reply || '').length > 75 ? '...' : ''}"`,
        time: m.replied_at || m.created_at,
        onClick: () => {
          setActiveTab('contact');
          setContactSubTab('lecturer');
          setNotifOpen(false);
        }
      })),
    ...assignmentsList
      .filter(a => a.grade || a.feedback)
      .map(a => ({
        id: `grade-${a.id}-${a.grade}`,
        icon: '🏆',
        color: '#38bdf8',
        title: `Homework Graded: ${a.subject_code} - ${a.title}`,
        detail: `Grade: ${a.grade || 'Reviewed'}${a.feedback ? ` — "${a.feedback.slice(0, 60)}"` : ''}`,
        time: a.submitted_at || a.created_at,
        onClick: () => {
          setActiveTab('assignments');
          setNotifOpen(false);
        }
      })),
    ...assignmentsList
      .filter(a => !a.submission_id)
      .map(a => ({
        id: `assign-new-${a.id}`,
        icon: '✍️',
        color: '#f59e0b',
        title: `New Assignment: ${a.subject_code} - ${a.title}`,
        detail: `Posted by ${a.lecturer_name || 'Lecturer'}${a.due_date ? ` • Due: ${a.due_date}` : ' • Pending your submission'}`,
        time: a.created_at,
        onClick: () => {
          setActiveTab('assignments');
          setNotifOpen(false);
        }
      })),
    ...myAdminTickets
      .filter(t => t.admin_response || t.status === 'resolved')
      .map(t => ({
        id: `admin-reply-${t.id}`,
        icon: '🛠️',
        color: '#10b981',
        title: `Admin Tech Support Update: ${t.subject}`,
        detail: t.admin_response ? `Admin: "${t.admin_response.slice(0, 70)}"` : 'Marked as resolved by Admin',
        time: t.created_at,
        onClick: () => {
          setActiveTab('contact');
          setContactSubTab('admin');
          setNotifOpen(false);
        }
      })),
    ...notesList.slice(0, 4).map(n => ({
      id: `note-${n.id}`,
      icon: '📚',
      color: '#a855f7',
      title: `Course Note Available: ${n.subject_code} - ${n.title}`,
      detail: `Uploaded by ${n.lecturer_name || 'Lecturer'} (${n.file_name})`,
      time: n.uploaded_at,
      onClick: () => {
        setActiveTab('materials');
        setNotifOpen(false);
      }
    }))
  ];

  const unreadNotificationsCount = notificationsList.filter(n => !readNotifIds.includes(n.id)).length;

  const handleMarkNotifRead = (id) => {
    if (!readNotifIds.includes(id)) {
      const updated = [...readNotifIds, id];
      setReadNotifIds(updated);
      localStorage.setItem('student_read_notifs', JSON.stringify(updated));
    }
  };

  const handleMarkAllNotifsRead = () => {
    const allIds = notificationsList.map(n => n.id);
    setReadNotifIds(allIds);
    localStorage.setItem('student_read_notifs', JSON.stringify(allIds));
  };

  const renderContactSection = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>💬 Contact & Support Center</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Need help with your lessons or facing a system problem? Ask your lecturer or report an issue with an optional screenshot.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRefreshContact}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0 }}
            title="Refresh lecturer replies and support tickets"
          >
            {refreshingContact ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>

          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setContactSubTab('lecturer')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                background: contactSubTab === 'lecturer' ? 'var(--primary)' : 'transparent',
                color: contactSubTab === 'lecturer' ? '#fff' : 'var(--text-muted)'
              }}
            >
              👨‍🏫 Lecturer Contact (Class Q&A)
            </button>
            <button
              type="button"
              onClick={() => setContactSubTab('admin')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                background: contactSubTab === 'admin' ? 'var(--primary)' : 'transparent',
                color: contactSubTab === 'admin' ? '#fff' : 'var(--text-muted)'
              }}
            >
              🛠️ Admin Contact (Tech / System Error)
            </button>
          </div>
        </div>
      </div>

      {contactSubTab === 'lecturer' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '6px' }}>
          {/* Student Automatic Identity Box */}
          <div style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '0.86rem'
          }}>
            <div>
              <strong>👨‍🎓 Asking as Student:</strong> {user.full_name} &nbsp;|&nbsp; <strong>🪪 Matrix No:</strong> <span style={{ color: '#38bdf8', fontWeight: 700 }}>{user.matrix_no || 'N/A'}</span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              ✓ Your name, Matrix ID, Class, and attached photo will be shown to the Lecturer automatically.
            </span>
          </div>

          {lecturerContactFeedback.text && (
            <div className={lecturerContactFeedback.type === 'success' ? 'success-message' : 'error-message'} style={{ marginBottom: 0 }}>
              {lecturerContactFeedback.text}
            </div>
          )}

          <form onSubmit={handleSendLecturerQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label className="form-label">Select Lecturer</label>
                <select
                  value={selectedLecturerId}
                  onChange={(e) => setSelectedLecturerId(e.target.value)}
                  className="form-select"
                >
                  <option value="">All Course Lecturers (General)</option>
                  {lecturersList.map(lec => (
                    <option key={lec.id} value={lec.id}>
                      {lec.full_name} ({lec.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Your Class / Section *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. DDT4A / DDT4B / DEC3A"
                  value={studentClassName}
                  onChange={(e) => setStudentClassName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Subject Code / Topic</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. DFC3013 - Chapter 1"
                  value={contactSubjectCode}
                  onChange={(e) => setContactSubjectCode(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Your Question for the Lecturer *</label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Write your question clearly here so your lecturer can assist you..."
                value={lecturerQuestionText}
                onChange={(e) => setLecturerQuestionText(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Image Upload for Lecturer Question */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📷 Upload Image / Screenshot (Optional — e.g. Lab question, circuit diagram, or slide screenshot)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSelectImage(e, setLecturerImageData)}
                  className="form-input"
                  style={{ width: 'auto', maxWidth: '280px', padding: '6px 10px', fontSize: '0.8rem' }}
                />
              </div>

              {lecturerImageData && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <img
                    src={lecturerImageData}
                    alt="Question attachment preview"
                    style={{ maxHeight: '140px', maxWidth: '240px', borderRadius: '8px', border: '1px solid var(--border)', objectFit: 'contain' }}
                  />
                  <button
                    type="button"
                    onClick={() => setLecturerImageData('')}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#f87171' }}
                  >
                    ✖ Remove Image
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={sendingLecturerMsg}
              className="btn-primary"
              style={{ width: 'fit-content', margin: 0, padding: '11px 24px' }}
            >
              {sendingLecturerMsg ? 'Sending Question...' : '📤 Send Question to Lecturer'}
            </button>
          </form>

          {/* Student's Sent Questions & Lecturer Replies */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>📬 My Questions & Lecturer Replies ({myLecturerMessages.length})</h3>
              <button
                type="button"
                onClick={handleRefreshContact}
                className="btn-secondary"
                style={{ padding: '5px 12px', fontSize: '0.78rem', margin: 0 }}
              >
                {refreshingContact ? '⏳ Refreshing...' : '🔄 Refresh Replies'}
              </button>
            </div>
            {myLecturerMessages.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--border)' }}>
                You haven't asked any questions to lecturers yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myLecturerMessages.map(m => (
                  <div
                    key={m.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: m.status === 'answered' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border)',
                      background: m.status === 'answered' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '5px', fontSize: '0.78rem', fontWeight: 700 }}>
                          Class: {m.class_name}
                        </span>
                        <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 8px', borderRadius: '5px', fontSize: '0.78rem', fontWeight: 700 }}>
                          {m.subject_code || 'General'}
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          To: <strong>{m.lecturer_name || 'Course Lecturer'}</strong>
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: m.status === 'answered' ? '#10b981' : '#fbbf24'
                      }}>
                        {m.status === 'answered' ? '✅ Answered by Lecturer' : '⏳ Waiting for Lecturer Reply'}
                      </span>
                    </div>
                    <p style={{ margin: '6px 0', fontSize: '0.92rem' }}><strong>Question:</strong> {m.question}</p>
                    {m.image_data && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '4px' }}>📷 Attached Image:</div>
                        <a href={m.image_data} target="_blank" rel="noreferrer">
                          <img
                            src={m.image_data}
                            alt="Student question attachment"
                            style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)', objectFit: 'contain' }}
                          />
                        </a>
                      </div>
                    )}
                    {m.reply && (
                      <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, marginBottom: '4px' }}>
                          👨‍🏫 Lecturer Reply:
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{m.reply}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ADMIN TECHNICAL & SYSTEM ERROR SUPPORT TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '6px' }}>
          <div style={{
            padding: '14px 16px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '0.86rem'
          }}>
            <div>
              <strong>🛠️ System & Technical Error Helpdesk (Admin Support)</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                Report bugs, note download/upload issues, AI errors, or account problems with a screenshot so the System Administrator can fix them quickly.
              </div>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 600 }}>
              📧 Admin Email: admin@pks.edu.my
            </div>
          </div>

          {adminTicketFeedback.text && (
            <div className={adminTicketFeedback.type === 'success' ? 'success-message' : 'error-message'} style={{ marginBottom: 0 }}>
              {adminTicketFeedback.text}
            </div>
          )}

          <form onSubmit={handleSendAdminTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label className="form-label">Error / Issue Category</label>
                <select
                  value={adminCategory}
                  onChange={(e) => setAdminCategory(e.target.value)}
                  className="form-select"
                >
                  <option value="System / Technical Error">System / Technical Error</option>
                  <option value="AI Companion / Note Detection Issue">AI Companion / Note Detection Issue</option>
                  <option value="Note Download / Homework Upload Error">Note Download / Homework Upload Error</option>
                  <option value="Account / Login / Matrix ID Issue">Account / Login / Matrix ID Issue</option>
                </select>
              </div>
              <div>
                <label className="form-label">Urgency / Priority</label>
                <select
                  value={adminPriority}
                  onChange={(e) => setAdminPriority(e.target.value)}
                  className="form-select"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High (Blocking Study / Submission)</option>
                  <option value="Urgent">Urgent (System Down)</option>
                </select>
              </div>
              <div>
                <label className="form-label">Short Issue Summary *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Cannot download Chapter 2 PDF file"
                  value={adminSubject}
                  onChange={(e) => setAdminSubject(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Detailed Error Description *</label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Describe what happened or any error message you saw so the Admin can fix it..."
                value={adminDescription}
                onChange={(e) => setAdminDescription(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Image Upload for Admin Technical Support */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📷 Upload Error Screenshot / Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSelectImage(e, setAdminImageData)}
                  className="form-input"
                  style={{ width: 'auto', maxWidth: '280px', padding: '6px 10px', fontSize: '0.8rem' }}
                />
              </div>

              {adminImageData && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <img
                    src={adminImageData}
                    alt="Error screenshot preview"
                    style={{ maxHeight: '140px', maxWidth: '240px', borderRadius: '8px', border: '1px solid var(--border)', objectFit: 'contain' }}
                  />
                  <button
                    type="button"
                    onClick={() => setAdminImageData('')}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#f87171' }}
                  >
                    ✖ Remove Screenshot
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={sendingAdminTicket}
              className="btn-primary"
              style={{ width: 'fit-content', margin: 0, padding: '11px 24px' }}
            >
              {sendingAdminTicket ? 'Submitting Ticket...' : '🛠️ Submit Error Report to Admin'}
            </button>
          </form>

          {/* Submitted Admin Tickets */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>🎫 My Reported Technical Issues ({myAdminTickets.length})</h3>
              <button
                type="button"
                onClick={handleRefreshContact}
                className="btn-secondary"
                style={{ padding: '5px 12px', fontSize: '0.78rem', margin: 0 }}
              >
                {refreshingContact ? '⏳ Refreshing...' : '🔄 Refresh Tickets'}
              </button>
            </div>
            {myAdminTickets.length === 0 ? (
              <div style={{ padding: '18px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--border)' }}>
                No technical issues reported. Everything is running smoothly!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myAdminTickets.map(t => (
                  <div
                    key={t.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span style={{ background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', padding: '2px 8px', borderRadius: '5px', fontSize: '0.76rem', fontWeight: 700, marginRight: '8px' }}>
                          {t.category}
                        </span>
                        <strong>{t.subject}</strong>
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: t.status === 'resolved' ? '#10b981' : '#38bdf8' }}>
                        {t.status === 'resolved' ? '✅ Fixed by Admin' : '🔧 Under Admin Review'}
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>{t.description}</p>
                    {t.image_data && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '4px' }}>📷 Attached Screenshot:</div>
                        <a href={t.image_data} target="_blank" rel="noreferrer">
                          <img
                            src={t.image_data}
                            alt="Admin ticket screenshot"
                            style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)', objectFit: 'contain' }}
                          />
                        </a>
                      </div>
                    )}
                    {t.admin_response && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontSize: '0.84rem' }}>
                        <strong>Admin Response:</strong> {t.admin_response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="app-layout">
      {/* MOBILE SIDEBAR BACKDROP */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          {/* Brand Logo */}
          <div className="sidebar-brand">
            <img
              src="/logo.png"
              alt="AI-LMS Logo"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                objectFit: 'cover',
                boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)',
                flexShrink: 0
              }}
            />
            <div className="brand-text">
              <h2>
                <span className="brand-red">AI-LMS</span> <span>Portal</span>
              </h2>
              <span>Smart Learning System</span>
            </div>
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
              title="Close Menu"
            >
              ✕
            </button>
          </div>

          {/* Student Profile Card in Sidebar */}
          <div className="sidebar-user-card">
            <div className="sidebar-user-top">
              {user.profile_picture ? (
                <img
                  src={getAvatarUrl(user.profile_picture, API_URL)}
                  alt={user.full_name}
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar">{initials}</div>
              )}
              <div className="user-info-text">
                <div className="user-info-name">{user.full_name}</div>
                <div className="user-info-role">Student Account</div>
              </div>
            </div>
            <div className="matrix-badge">
              <span>🪪 Matrix No:</span>
              <strong>{user.matrix_no || 'Not Set'}</strong>
            </div>
          </div>

          {/* Sidebar Menu */}
          <nav className="sidebar-nav">
            <div className="nav-section-label">Learning Menu</div>
            <button
              className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
            >
              <span>🏠</span>
              <span>Dashboard Home</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => { setActiveTab('chat'); setSidebarOpen(false); }}
            >
              <span>🤖</span>
              <span>AI Study Companion</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => { setActiveTab('quiz'); setSidebarOpen(false); }}
            >
              <span>📝</span>
              <span>5-Question Practice Quiz</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'materials' ? 'active' : ''}`}
              onClick={() => { setActiveTab('materials'); setSidebarOpen(false); }}
            >
              <span>📚</span>
              <span>Course Notes ({notesList.length})</span>
            </button>
            <button
              className={`sidebar-nav-item ${flashcardsOpen ? 'active' : ''}`}
              onClick={() => { setFlashcardsOpen(true); setSidebarOpen(false); }}
            >
              <span>📇</span>
              <span>Revision Flashcards</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'timetable' ? 'active' : ''}`}
              onClick={() => { setActiveTab('timetable'); setSidebarOpen(false); }}
            >
              <span>📅</span>
              <span>Class Timetable</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'assignments' ? 'active' : ''}`}
              onClick={() => { setActiveTab('assignments'); setSidebarOpen(false); }}
            >
              <span>✍️</span>
              <span>Assignments ({assignmentsList.length})</span>
            </button>

            <div className="nav-section-label" style={{ marginTop: '12px' }}>Help & Account</div>
            <button
              className={`sidebar-nav-item ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => { setActiveTab('contact'); setSidebarOpen(false); }}
            >
              <span>💬</span>
              <span>Contact (Lecturer & Admin)</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
            >
              <span>👤</span>
              <span>Student Profile</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN AREA + TOP NAVBAR */}
      <div className="app-main">
        {/* TOP NAVBAR */}
        <header className="app-navbar">
          <div className="navbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Menu"
            >
              ☰
            </button>
            <div className="navbar-title">
              <h1>{tabMeta[activeTab]?.title}</h1>
              <p>{tabMeta[activeTab]?.subtitle}</p>
            </div>
          </div>

          <div className="navbar-right" style={{ position: 'relative' }}>
            {/* NOTIFICATION BELL & ACTIVITY CENTER */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  position: 'relative'
                }}
                title="Activity Notifications (Assignments, Lecturer Replies, Grades & Notes)"
              >
                <span>🔔</span>
                <span className="nav-btn-label">Notifications</span>
                {unreadNotificationsCount > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    marginLeft: '3px',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.55)',
                    display: 'inline-block'
                  }}>
                    ({unreadNotificationsCount})
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="notification-dropdown">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🔔 Activity Notifications ({notificationsList.length})
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={handleRefreshContact}
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        🔄 Refresh
                      </button>
                      {unreadNotificationsCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllNotifsRead}
                          style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                          ✓ Read All
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {notificationsList.length === 0 ? (
                    <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                      No recent activity notifications yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {notificationsList.map((notif) => {
                        const isRead = readNotifIds.includes(notif.id);
                        return (
                          <div
                            key={notif.id}
                            onClick={() => {
                              handleMarkNotifRead(notif.id);
                              notif.onClick();
                            }}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '10px',
                              background: isRead ? 'rgba(255,255,255,0.02)' : 'rgba(56, 189, 248, 0.09)',
                              border: isRead ? '1px solid var(--border)' : '1px solid rgba(56, 189, 248, 0.35)',
                              cursor: 'pointer',
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'flex-start',
                              transition: 'all 0.15s'
                            }}
                          >
                            <span style={{ fontSize: '1.2rem' }}>{notif.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: isRead ? 600 : 700, color: isRead ? 'var(--text-main)' : '#38bdf8' }}>
                                {notif.title}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {notif.detail}
                              </div>
                            </div>
                            {!isRead && (
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', marginTop: '5px', flexShrink: 0 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('contact')}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Contact Lecturer or Admin Support"
            >
              <span>💬</span>
              <span className="nav-btn-label">Contact Support</span>
            </button>
            <div className="matrix-badge">
              <span>🪪</span>
              <span>{user.matrix_no || 'STUDENT'}</span>
            </div>
            <div
              className="user-badge"
              onClick={() => setActiveTab('profile')}
              title="View Student Profile & Matrix ID"
              role="button"
              tabIndex={0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              {user.profile_picture ? (
                <img
                  src={getAvatarUrl(user.profile_picture, API_URL)}
                  alt={user.full_name}
                  className="user-badge-avatar"
                />
              ) : (
                <div className="user-badge-avatar user-badge-avatar-fallback">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : '👤'}
                </div>
              )}
              <span className="user-badge-name">{user.full_name}</span>
              <span className="user-badge-role" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                Student
              </span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="app-content">
          {activeTab === 'overview' && (
            <>
              {/* Student Study Progress & Streaks Widget */}
              <StudentStudyProgressWidget
                notesList={notesList}
                reviewedNotesCount={8}
                quizzesCompletedCount={5}
                quizAverageScore={85}
                streakDays={3}
                onOpenNotes={() => setActiveTab('materials')}
                onOpenQuiz={() => {
                  generateFiveQuestions();
                  setActiveTab('quiz');
                }}
                onOpenFlashcards={() => setFlashcardsOpen(true)}
                onExportPdf={handleExportSummaryPdf}
              />

              <div style={{ height: '20px' }} />

              {/* Today's Live Class Schedule Widget */}
              <StudentTimetableWidget
                viewMode="overview"
                onOpenChatWithQuery={(q) => {
                  setActiveTab('chat');
                  processStudentQuery(q);
                }}
                onOpenNotes={() => setActiveTab('materials')}
                onOpenFlashcards={() => setFlashcardsOpen(true)}
              />

              <div style={{ height: '20px' }} />

              {/* Easy-to-Understand Quick Action Cards */}
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div
                  className="stat-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTab('timetable')}
                >
                  <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>📅</div>
                  <div className="stat-info">
                    <h3>Timetable</h3>
                    <p>Class Schedule & Rooms</p>
                  </div>
                </div>
                <div
                  className="stat-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTab('materials')}
                >
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>📚</div>
                  <div className="stat-info">
                    <h3>{notesList.length} Notes</h3>
                    <p>Download Course Slides</p>
                  </div>
                </div>
                <div
                  className="stat-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    generateFiveQuestions();
                    setActiveTab('quiz');
                  }}
                >
                  <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>📝</div>
                  <div className="stat-info">
                    <h3>5 Questions</h3>
                    <p>Start Practice Quiz</p>
                  </div>
                </div>
                <div
                  className="stat-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTab('assignments')}
                >
                  <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>✍️</div>
                  <div className="stat-info">
                    <h3>{assignmentsList.length} Tasks</h3>
                    <p>Submit Homework</p>
                  </div>
                </div>
                <div
                  className="stat-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTab('contact')}
                >
                  <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>💬</div>
                  <div className="stat-info">
                    <h3>Ask Help</h3>
                    <p>Lecturer & Admin Contact</p>
                  </div>
                </div>
              </div>

              {/* Pinned Class Announcements Banner */}
              {announcements.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.98rem' }}>
                      📢 Important Class Announcements ({announcements.length})
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest updates from faculty</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {announcements.map((ann) => (
                      <div key={ann.id} style={{ background: 'rgba(0,0,0,0.22)', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.92rem', color: '#fef3c7' }}>{ann.title}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(ann.created_at).toLocaleDateString()} • {ann.author_name || ann.lecturer_name || 'Course Lecturer'} ({ann.author_role || 'Faculty'})
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {ann.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderChatCard()}
              {renderQuizCard()}
            </>
          )}

          {activeTab === 'chat' && renderChatCard()}

          {activeTab === 'quiz' && renderQuizCard()}

          {activeTab === 'materials' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem' }}>📚 Available Course Materials & Chapters</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Search by chapter or subject code, download lecture files, or study with the AI Companion.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="🔍 Search Chapter, Subject, or Title..."
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    style={{ width: '240px', padding: '7px 12px', fontSize: '0.85rem' }}
                  />
                  <button onClick={fetchNotes} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                    🔄 Refresh
                  </button>
                </div>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Chapter / Title</th>
                      <th>Lecturer</th>
                      <th>File Name</th>
                      <th>Uploaded Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNotes.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                          No matching lecture notes found.
                        </td>
                      </tr>
                    ) : (
                      filteredNotes.map((note) => (
                        <tr key={note.id}>
                          <td>
                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>
                              {note.subject_code}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{note.title}</td>
                          <td>{note.lecturer_name || 'Lecturer'}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{note.file_name}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {new Date(note.uploaded_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                className="btn-secondary"
                                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', margin: 0, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                                onClick={() => handleOpenPreviewNote(note)}
                                title="Preview PDF and images in browser"
                              >
                                👁️ Preview
                              </button>
                              <button
                                className="btn-secondary"
                                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', margin: 0 }}
                                onClick={() => handleDownloadNote(note.id)}
                                title="Download Note File"
                              >
                                ⬇️ Download
                              </button>
                              <button
                                className="btn-primary"
                                style={{ width: 'auto', padding: '6px 14px', fontSize: '0.8rem', margin: 0 }}
                                onClick={() => {
                                  setSelectedNoteId(note.id);
                                  loadNoteContent(note.id);
                                  setActiveTab('chat');
                                }}
                              >
                                🤖 Study with AI
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem' }}>✍️ Course Assignments & Homework</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Download assignment instructions from your lecturer and upload your completed homework files here.
                  </p>
                </div>
                <button onClick={() => fetchAssignments(user.id)} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                  🔄 Refresh Assignments
                </button>
              </div>

              {loadingAssignments ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading assignments...</div>
              ) : assignmentsList.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                  📭 No assignments have been posted by your lecturers yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {assignmentsList.map((a) => {
                    const isSubmitted = Boolean(a.submission_id);
                    const msg = submitMessage[a.id];
                    return (
                      <div
                        key={a.id}
                        style={{
                          padding: '20px',
                          borderRadius: '14px',
                          border: isSubmitted ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border)',
                          background: isSubmitted ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                              <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '3px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem' }}>
                                {a.subject_code}
                              </span>
                              <h3
                                onClick={() => handleOpenPreviewAssignment(a)}
                                style={{ fontSize: '1.1rem', margin: 0, cursor: 'pointer', transition: 'color 0.2s' }}
                                title="Click to open and preview assignment"
                              >
                                {a.title}
                              </h3>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                              <span>👨‍🏫 Lecturer: <strong>{a.lecturer_name || 'Lecturer'}</strong></span>
                              {a.due_date && <span>⏰ Due Date: <strong style={{ color: '#fbbf24' }}>{a.due_date}</strong></span>}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {renderDeadlineBadge(a.due_date, isSubmitted)}
                          </div>
                        </div>

                        {a.description && (
                          <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', background: 'rgba(0,0,0,0.15)', padding: '12px 14px', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                            {a.description}
                          </div>
                        )}

                        {/* Assignment Document Action Bar */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenPreviewAssignment(a)}
                            className="btn-secondary"
                            style={{
                              fontSize: '0.82rem',
                              padding: '7px 14px',
                              color: '#38bdf8',
                              borderColor: 'rgba(56, 189, 248, 0.4)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            title="Open and preview assignment instructions, question sheet, and PDF in browser"
                          >
                            👁️ Open & Preview Assignment
                          </button>
                          {a.file_name ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadAssignmentFile(a.id)}
                              className="btn-secondary"
                              style={{ fontSize: '0.82rem', padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              title="Download lecturer question sheet file"
                            >
                              ⬇️ Download Attachment ({a.file_name})
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDownloadAssignmentFile(a.id)}
                              className="btn-secondary"
                              style={{ fontSize: '0.82rem', padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              title="Download official assignment briefing PDF"
                            >
                              ⬇️ Download Briefing PDF
                            </button>
                          )}
                        </div>

                        {/* Existing Submission Info & Grade */}
                        {isSubmitted && (
                          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.86rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                              <span>📄 <strong>Your Submitted File:</strong> {a.submitted_file}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => triggerMobileSafeDownload(`${API_URL}/submissions/${a.submission_id}/download`, a.submitted_file)}
                                  className="btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: '0.78rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                                  title="Download your submitted homework file"
                                >
                                  ⬇️ Download My Submission
                                </button>
                                <span style={{ color: 'var(--text-muted)' }}>
                                  Submitted on {new Date(a.submitted_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            {a.grade && (
                              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.95rem' }}>
                                  🏆 Grade: {a.grade}
                                </span>
                                {a.feedback && (
                                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-main)' }}>
                                    💬 <strong>Lecturer Feedback:</strong> {a.feedback}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Upload / Re-upload Homework Form */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', alignItems: 'end', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>
                              {isSubmitted ? 'Re-upload Homework File (PDF, DOCX, ZIP, etc.)' : 'Upload Homework File (PDF, DOCX, ZIP, etc.)'}
                            </label>
                            <input
                              type="file"
                              onChange={(e) => setSubmissionFiles(prev => ({ ...prev, [a.id]: e.target.files[0] }))}
                              className="form-input"
                              style={{ padding: '7px', fontSize: '0.82rem' }}
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Comment / Notes for Lecturer (Optional)</label>
                            <input
                              type="text"
                              placeholder="e.g. Completed Lab 1 & 2"
                              value={submissionComments[a.id] ?? (a.student_comment || '')}
                              onChange={(e) => setSubmissionComments(prev => ({ ...prev, [a.id]: e.target.value }))}
                              className="form-input"
                              style={{ padding: '9px 12px', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div>
                            <button
                              onClick={() => handleHomeworkSubmit(a.id)}
                              disabled={submittingId === a.id}
                              className="btn-primary"
                              style={{ margin: 0, padding: '10px 18px', fontSize: '0.86rem' }}
                            >
                              {submittingId === a.id ? 'Uploading...' : isSubmitted ? '🔄 Update Submission' : '📤 Submit Homework'}
                            </button>
                          </div>
                        </div>

                        {msg && (
                          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: msg.type === 'success' ? '#10b981' : msg.type === 'error' ? '#f87171' : '#38bdf8' }}>
                            {msg.text}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'contact' && renderContactSection()}

          {activeTab === 'profile' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '900px', width: '100%' }}>
              {/* Digital Student Matric Card */}
              <div style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '16px',
                padding: '24px',
                color: '#ffffff',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '50%', filter: 'blur(30px)' }} />
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src="/logo.png"
                      alt="Politeknik AI-LMS Emblem"
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.05em' }}>POLITEKNIK KUCHING SARAWAK</div>
                      <div style={{ fontSize: '0.72rem', color: '#93c5fd' }}>Jabatan Teknologi Maklumat & Komunikasi</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7', padding: '3px 8px', borderRadius: '999px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                    ACTIVE STUDENT
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                    border: '2px solid rgba(255,255,255,0.2)',
                    overflow: 'hidden'
                  }}>
                    {user.profile_picture ? (
                      <img
                        src={getAvatarUrl(user.profile_picture, API_URL)}
                        alt={user.full_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      user.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'
                    )}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {user.full_name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#93c5fd', fontFamily: 'monospace', fontWeight: 700 }}>
                      MATRIC: {user.matrix_no || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>
                      Program: Diploma Teknologi Maklumat
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem' }}>CLASS / GROUP</span>
                    <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{user.class_name || 'DIT 4B'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem' }}>SESSION</span>
                    <span style={{ fontWeight: 600, color: '#f1f5f9' }}>I : 2026/2027</span>
                  </div>
                </div>

                <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>
                  POLITEKNIK AI LEARNING MANAGEMENT SYSTEM (FINAL YEAR PROJECT)
                </div>
              </div>

              {/* Profile Picture Uploader Card */}
              <ProfilePictureUploader
                user={user}
                onUpdate={(updatedUser) => setUser(updatedUser)}
                apiUrl={API_URL}
                role="student"
              />

              {/* Account Details Card */}
              <div className="card" style={{ margin: 0 }}>
                <h2 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>👤 Account Details</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{user.full_name}</div>
                  </div>
                  <div style={{ padding: '10px 14px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Matrix No / Student ID</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8' }}>{user.matrix_no || 'Not Specified'}</div>
                  </div>
                  <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Username</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{user.username}</div>
                  </div>
                  <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{user.email}</div>
                  </div>
                  <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Account Role</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, textTransform: 'capitalize' }}>{user.role}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CLASS TIMETABLE TAB */}
          {activeTab === 'timetable' && (
            <StudentTimetableWidget
              viewMode="tab"
              onOpenChatWithQuery={(q) => {
                setActiveTab('chat');
                processStudentQuery(q);
              }}
              onOpenNotes={() => setActiveTab('materials')}
              onOpenFlashcards={() => setFlashcardsOpen(true)}
            />
          )}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="mobile-bottom-nav">
          <button
            type="button"
            className={`mobile-bottom-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">🏠</span>
            <span>Home</span>
          </button>
          <button
            type="button"
            className={`mobile-bottom-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <span className="nav-icon">🤖</span>
            <span>AI Chat</span>
          </button>
          <button
            type="button"
            className={`mobile-bottom-nav-item ${activeTab === 'materials' ? 'active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            <span className="nav-icon">📚</span>
            <span>Notes</span>
          </button>
          <button
            type="button"
            className={`mobile-bottom-nav-item ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            <span className="nav-icon">✍️</span>
            <span>Tasks</span>
          </button>
          <button
            type="button"
            className={`mobile-bottom-nav-item ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            <span className="nav-icon">💬</span>
            <span>Contact</span>
          </button>
        </nav>
      </div>

      {/* In-Browser Lecture Note Document Preview Modal (PDF / Images / AI Text) */}
      <DocumentPreviewModal
        isOpen={Boolean(previewNote)}
        note={previewNote}
        extractedText={previewNoteContent}
        loadingText={loadingPreview}
        onClose={() => setPreviewNote(null)}
        canDelete={false}
        apiUrl={API_URL}
        role="student"
        initialPage={previewPage}
      />

      {/* 3D Interactive Revision Flashcards Deck Modal */}
      <RevisionFlashcardsModal
        isOpen={flashcardsOpen}
        onClose={() => setFlashcardsOpen(false)}
        subjectCode={selectedNote?.subject_code || 'COURSE'}
        noteTitle={selectedNote?.title || 'Lecture Note'}
      />
    </div>
  );
};

export default StudentDashboard;
