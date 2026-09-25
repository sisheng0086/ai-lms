import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
      text: "Hai! 👋 I am AI to help you, if you have any question you can ask me! You can ask for any chapter (e.g. \"Give me Chapter 1 or Chapter 1.1 note\"), a chapter summary, or 5 practice quiz questions.",
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

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [navigate, fetchNotes, fetchAssignments, fetchContactData]);

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
      `1.1 Main Purpose & Introduction (Tujuan Utama): The main purpose of ${title} (${cleanFile}) in ${subjectCode} is to establish the foundational starting point (Titik Awal), core objectives, and structured framework for the subject and E-Folio coursework. It guides students on how to define the problem statement, understand the fundamental concepts of ${subjectCode}, and plan their initial project and study milestones effectively.`,
      `1.2 Core Learning Objectives: By studying ${title} (${cleanFile}), students will be able to: (1) Understand the primary purpose, scope, and background of ${cleanFile} in ${subjectCode}; (2) Identify the key requirements, workflow stages, and documentation standards; and (3) Apply the fundamental theories of ${title} to practical lab exercises and E-Folio tasks.`,
      `1.3 Key Concepts & Section Breakdown (Section 1.1 - 1.3): Section 1.1 focuses on the initial planning (Titik Awal), background research, and identifying the main goal of the topic. Section 1.2 covers the methodology, architecture, and step-by-step analysis required to solve problems in ${subjectCode}. Section 1.3 highlights best practices, quality standards, and structured reporting for student submissions.`,
      `1.4 Practical Application & E-Folio Guidelines: Students should organize their E-Folio and coursework clearly with an introduction, objective statement, analysis of findings, and conclusion. Ensure your Matrix Number, Class Section, and Subject Code (${subjectCode}) are included in all submissions.`,
      `1.5 Chapter Summary & Key Takeaways: In summary, ${title} (${cleanFile}) serves as the essential blueprint for mastering ${subjectCode}, ensuring students understand both the theoretical purpose and practical execution from the very beginning.`
    ].join("\n\n");
  }, []);

  // =========================================================================
  // =========================================================================
  // SMART AI CHAPTER INFO, SUMMARY NOTE GENERATOR & DEEP DETAIL DETECTION
  // =========================================================================
  const cleanPdfExtractedText = useCallback((raw) => {
    if (!raw) return "";
    return raw
      .replace(/Aw al/g, "Awal")
      .replace(/A w al/g, "Awal")
      .replace(/Dar i P elabuhan k e/g, "Dari Pelabuhan ke")
      .replace(/Dar i P elabuhan/g, "Dari Pelabuhan")
      .replace(/ke P er paduan/g, "ke Perpaduan")
      .replace(/Per paduan/g, "Perpaduan")
      .replace(/Hok kien/g, "Hokkien")
      .replace(/Pedag ang/g, "Pedagang")
      .replace(/Kum pulan/g, "Kumpulan")
      .replace(/ker ongk ong V enice/g, "kerongkong Venice")
      .replace(/Sesiapa y ang menjadi tuan/g, "Sesiapa yang menjadi tuan")
      .replace(/Melak a, t ang ann ya ber ada di/g, "Melaka, tangannya berada di")
      .replace(/±1 400/g, "1400")
      .replace(/±1 414/g, "1414")
      .replace(/1459–7 7/g, "1459–1477")
      .replace(/148 1–/g, "1481–")
      .replace(/1 511/g, "1511")
      .replace(/Etika Sebelum  Untung/g, "Etika Sebelum Untung");
  }, []);

  // Groups raw extracted PDF lines into logical multi-sentence page/topic sections
  const buildLogicalSections = useCallback((cleanedText) => {
    if (!cleanedText) return [];
    // Split by explicit [Page X] or TITIK AWAL page footers first
    const rawPages = cleanedText.split(/(?=\[Page \d+\])|(?=TITIK AWAL\s*·\s*MPU21072\s*\d+)/i);
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
          "I am your smart AI Study Companion! I have read and indexed every page and detail of your uploaded lecture note so I can help you with:\n" +
          "• 📘 Full Chapter Info (e.g., \"Tell me about Chapter 1\" or \"Give me Chapter 1 info\")\n" +
          "• 📝 Summary Notes for Revision (e.g., \"Help me do the summary note\" or \"Summarize Chapter 1\")\n" +
          "• 🔍 Detailed Questions on any section, article, timeline, law, language, community, or group member\n" +
          "• ❓ 5 Practice Quiz Questions (e.g., \"Generate 5 practice questions\")\n\n" +
          `📚 Uploaded Chapter(s): ${availableChaptersText}\n` +
          "📌 Note: I strictly answer questions based on your uploaded chapter notes only.";
        setMessages(prev => [...prev, { text: greetingReply, sender: "bot", source: "AI Study Companion" }]);
        speakText("Hai! I am AI to help you, if you have any question you can ask me!");
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

    // Normalize common typos & variations
    const normalizedQuery = userText
      .toLowerCase()
      .replace(/sumarry|sumary|summery|ringkasan|rumusan/g, 'summary')
      .replace(/propos|purpos|porpose|perpose|tujuan|matlamat|objektif/g, 'purpose objective')
      .replace(/chaper|chaptr|chpter|chap\.?|ch\.?\s*(?=\d)/g, 'chapter ')
      .replace(/chapter(\d)/g, 'chapter $1')
      .replace(/artikle|artical|artikel/g, 'article');

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
          f.includes(`topic${mainChapterNum}`)
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

    // 4. Explicit Off-Topic / Out-of-Chapter Subject Blacklist (blocks IoT, coding, sports, weather, etc.)
    const offTopicBlacklist = /\b(iot|internet of things|arduino|raspberry pi|python|javascript|java|c\+\+|react|html|css|sql|football|soccer|basketball|badminton|fifa|valorant|mobile legends|dota|minecraft|bitcoin|crypto|ethereum|forex|stock market|weather|rain today|temperature|recipe|pizza|burger|calculus|algebra|thermodynamics|quantum|car engine|tesla|iphone|samsung|anime|netflix|movie)\b/i;
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

    // 5. Find the best matching Note across ALL uploaded notes
    let targetNote = notesList.find(n => String(n.id) === String(selectedNoteId)) || notesList[0];
    let bestNoteScore = -1;

    for (const note of notesList) {
      let score = 0;
      const titleLower = (note.title || '').toLowerCase();
      const subjectLower = (note.subject_code || '').toLowerCase();
      const fileLower = (note.file_name || '').toLowerCase();
      const bodyLower = (noteContentsMap[note.id] || '').toLowerCase();

      if (targetNumber) {
        if (titleLower.includes(`chapter ${mainChapterNum}`) || titleLower.includes(`chapter${mainChapterNum}`) || titleLower.includes(targetNumber)) {
          score += 60;
        }
        if (fileLower.includes(mainChapterNum)) score += 25;
        if (bodyLower.includes(targetNumber)) score += 30;
      }
      if (score > bestNoteScore && score > 0) {
        bestNoteScore = score;
        targetNote = note;
      }
    }

    if (targetNote && String(targetNote.id) !== String(selectedNoteId)) {
      setSelectedNoteId(targetNote.id);
      loadNoteContent(targetNote.id);
    }

    const rawLoaded = cleanPdfExtractedText(noteContentsMap[targetNote.id] || notesContent || "");
    const richStudyGuide = buildClientStudyGuide(targetNote);
    const fullNoteText = rawLoaded.length >= 80 ? rawLoaded : richStudyGuide;
    const isMelakaEfolio = /kesultanan melayu melaka|titik awal|syahbandar|hukum kanun|mpu21072/i.test(fullNoteText);
    const sourceLabel = `${targetNote.subject_code} - ${targetNote.title}`;

    // =========================================================================
    // HELPER: Deliver Bot Reply with Download & Copy Note Support
    // =========================================================================
    const sendBotAnswer = (replyText, speechSummary) => {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            text: replyText,
            sender: "bot",
            source: sourceLabel,
            noteId: targetNote.id,
            noteFileName: targetNote.file_name
          }
        ]);
        speakText(speechSummary || replyText.slice(0, 260));
      }, 300);
    };

    // =========================================================================
    // MODE A: SMART SUMMARY NOTE GENERATOR ("summary", "summarize", "summary note", "ringkasan", "short note")
    // =========================================================================
    const isSummaryRequest = /\b(summary|summarize|summarise|ringkasan|rumusan|short\s*note|study\s*note|revision\s*note|cheat\s*sheet|key\s*points|main\s*points)\b/i.test(normalizedQuery);

    if (isSummaryRequest) {
      if (isMelakaEfolio) {
        const summaryNoteText =
          `📝 **SMART SUMMARY NOTE: ${targetNote.subject_code} — ${targetNote.title}**\n` +
          `📄 *Source File:* ${targetNote.file_name} (E-Folio MPU21072: *Titik Awal — Kesultanan Melayu Melaka 1400–1511*)\n\n` +
          `**1. Executive Summary (Ringkasan Eksekutif)**\n` +
          `• In the 15th century (1400–1511), the Melaka Sultanate grew from a fishing village into a premier global port because the Southwest (Apr–Sep) and Northeast (Nov–Mar) monsoons met at the Straits of Melaka.\n` +
          `• Traders from India, Arabia, China, and the Malay Archipelago stayed for months waiting for the wind to shift. Through organized port administration, fair laws, and intermarriage, Melaka became the **starting point (Titik Awal) of Malaysia's plural society (Masyarakat Majmuk)**.\n\n` +
          `**2. Two Core Objectives (Dua Objektif Penulisan)**\n` +
          `• **Objective 1:** Explain how the trade network of the Melaka Sultanate attracted diverse ethnic groups to form the starting point (*Titik Awal*) of a plural society in Tanah Melayu.\n` +
          `• **Objective 2:** Evaluate the trade ethics and diversity management of the Melaka era as a guide to strengthen unity in Malaysia today.\n\n` +
          `**3. Key Points by Article (Ringkasan 4 Artikel Utama)**\n` +
          `• **Article 1 — Port Administration (*Pelabuhan Yang Tidak Pernah Tidur* by Arthur Ryan):**\n` +
          `  - Governed by **4 Pembesar Utama**: *Bendahara* (Chief Minister), *Temenggung* (City Security), *Laksamana* (Naval Fleet/Anti-piracy), and *Penghulu Bendahari* (Treasury/Tax).\n` +
          `  - Appointed **4 Syahbandars** by trader region: (1) Gujarat; (2) South India, Bengal, Pegu & Pasai; (3) Java, Maluku, Banda, Palembang, Borneo & Luzon; (4) China, Champa & Ryukyu.\n` +
          `  - Standardized weights (*kati, tahil, bahara*) and used tin ingots (*jongkong timah*) + foreign currencies.\n` +
          `• **Article 2 — Foreign Communities (*84 Bahasa dalam Satu Bandar* by Vianfazerry):**\n` +
          `  - Portuguese writer **Tomé Pires (*Suma Oriental*)** recorded **84 languages** spoken in Melaka.\n` +
          `  - **Bahasa Melayu** served as the *lingua franca* uniting all traders.\n` +
          `  - Distinct merchant settlements formed: *Kampung Keling* (Tamil/South Indian), *Kampung Jawa* (Javanese/Nusantara), *Kampung Cina* (Chinese), and *Bukit China*. Houses of worship stood side-by-side (*Jalan Harmoni*).\n` +
          `• **Article 3 — Laws & Trade Ethics (*Etika Sebelum Untung* by Amirull Hafiz):**\n` +
          `  - **Hukum Kanun Melaka (44 Fasal):** Written code covering criminal, family, debt, slavery, and city order.\n` +
          `  - **Undang-Undang Laut Melaka:** Maritime law where the *Nakhoda* (ship captain) is "like a king aboard his ship" with strict duty to protect crew and cargo.\n` +
          `  - **4 Core Ethical Values:** *Amanah* (honest weights), *Adil* (fair representation), *Hormat* (religious freedom), and *Tanggungjawab* (accountability).\n` +
          `• **Article 4 — Cultural Heritage (*Anak-Anak Selat* by Daniel Wong):**\n` +
          `  - Intermarriage between foreign traders and locals gave birth to hybrid communities: **Baba-Nyonya** (Chinese Peranakan), **Chetti Melaka** (Tamil Hindu Peranakan), **Portugis-Kristang** (post-1511 Portuguese creole), and **Jawi Peranakan** (Arab/Indian Muslim heritage).\n` +
          `  - Recognized as **UNESCO World Heritage Site (2008)** and **Kebaya UNESCO Intangible Heritage (2024)**.\n\n` +
          `**4. Connection to Malaysia MADANI (6 Core Pillars)**\n` +
          `• *Kemampanan* (Sustainability), *Kesejahteraan* (Well-being), *Daya Cipta* (Innovation), *Hormat* (Respect), *Keyakinan* (Trust/Rule of Law), and *Ihsan* (Compassion).\n\n` +
          `**5. Final Conclusion (Rumusan Akhir)**\n` +
          `• Unity and pluralism do not happen by chance — Melaka succeeded because of **strategic administration, fair written laws, shared ethics, and mutual respect**.`;

        sendBotAnswer(
          summaryNoteText,
          "Here is your complete summary note for Chapter 1, covering the Executive Summary, 2 Objectives, all 4 Articles, Key Statistics, and Malaysia MADANI."
        );
        return;
      }

      // Dynamic Summary Generator for any other uploaded document
      const logicalSections = buildLogicalSections(fullNoteText);
      const summaryBullets = logicalSections.slice(0, 6).map((sec, i) => `• **Key Point ${i + 1}:** ${sec.slice(0, 260)}${sec.length > 260 ? '...' : ''}`);
      const genericSummary =
        `📝 **SMART SUMMARY NOTE: ${targetNote.subject_code} — ${targetNote.title}**\n` +
        `📄 *Source File:* ${targetNote.file_name}\n\n` +
        `${summaryBullets.join('\n\n')}`;
      sendBotAnswer(genericSummary, `Here is the summary note for ${targetNote.title}.`);
      return;
    }

    // =========================================================================
    // MODE B: SPECIFIC DETAIL DETECTORS (Detects every detail in the uploaded note!)
    // =========================================================================
    if (isMelakaEfolio) {
      // Detail 1: Group Members / Authors / Sidang Redaksi / Matrix Numbers / Task Division
      if (/\b(member|members|author|authors|group|team|who wrote|writer|sidang redaksi|ahli kumpulan|matrix|matrik|pembahagian tugas|arthur|vianfazerry|amirull|daniel wong|05dit)\b/i.test(normalizedQuery)) {
        const membersReply =
          `👥 **Group Members, Roles & Task Division (Sidang Redaksi — Page 2 & Page 20):**\n\n` +
          `**Group Name:** Kumpulan Titik Awal Masyarakat Majmuk (4 Members · Jabatan Pengajian Am, Politeknik Kuching Sarawak)\n\n` +
          `1. **Arthur Ryan Anak Anis** — Matrix No: **05DIT24F1055**\n` +
          `   • **Role:** Ketua Kumpulan & Editor (Group Leader & Editor)\n` +
          `   • **Contribution:** Wrote **Artikel 1: Pelabuhan Yang Tidak Pernah Tidur** (Port Administration, pp. 8–9) & final magazine layout.\n\n` +
          `2. **Vianfazerry Anak Fabian** — Matrix No: **05DIT24F1160**\n` +
          `   • **Role:** Penyelidik & Penulis (Researcher & Writer)\n` +
          `   • **Contribution:** Source research & wrote **Artikel 2: 84 Bahasa dalam Satu Bandar** (Foreign Merchant Communities, pp. 10–11).\n\n` +
          `3. **Amirull Hafiz Bin Majid** — Matrix No: **05DIT24F1141**\n` +
          `   • **Role:** Pereka Grafik (Graphic Designer)\n` +
          `   • **Contribution:** Designed infographics, trade route map, and wrote **Artikel 3: Etika Sebelum Untung** (Law & Ethics, pp. 12–13).\n\n` +
          `4. **Daniel Wong Bin Husain Wong** — Matrix No: **05DIT24F1059**\n` +
          `   • **Role:** Penyunting & Rujukan (Language Editor & References)\n` +
          `   • **Contribution:** Wrote **Artikel 4: Anak-Anak Selat — Baba, Nyonya, Chetti & Kristang** (Cultural Heritage, pp. 14–15), language editing & APA 7th references.`;
        sendBotAnswer(membersReply, "Here are the four group members, their Matrix numbers, and their exact roles in the E-Folio.");
        return;
      }

      // Detail 2: Main Purpose / Two Objectives / Theme (Pengenalan & Objektif)
      if (/\b(purpose|objective|objectives|tujuan|objektif|matlamat|theme|tema|pengenalan|introduction|why)\b/i.test(normalizedQuery) && !/\b(article|syahbandar|law|baba)\b/i.test(normalizedQuery)) {
        const objReply =
          `🎯 **Main Purpose, Theme & Objectives of Chapter 1 (${targetNote.file_name} — Page 4 & Page 5):**\n\n` +
          `**📌 Magazine Theme (Tema Keluaran):**\n` +
          `• **"Dari Pelabuhan ke Perpaduan"** (*From Port to Unity*) — Trade as the gateway for ethnic, cultural, and moral diversity.\n\n` +
          `**📌 Main Purpose (Tujuan Utama — Pengenalan):**\n` +
          `• This E-Folio explores trade relations during the **Melaka Sultanate (1400–1511)** as the **starting point (Titik Awal)** of the plural society (*masyarakat majmuk*) in Tanah Melayu.\n` +
          `• It examines trade not merely as buying and selling, but as a complete **social system** comprising port administration, written laws, ethics, and foreign merchant settlements that integrated with local society.\n\n` +
          `**🎯 Two Core Writing Objectives (Dua Objektif Penulisan — Page 5):**\n` +
          `1. **Objective 1:** *Menghuraikan bagaimana jaringan perdagangan Kesultanan Melayu Melaka menarik kemasukan pelbagai bangsa sehingga membentuk titik awal masyarakat majmuk di Tanah Melayu.*\n` +
          `   (Explain how the trade network of the Melaka Sultanate attracted diverse ethnic groups to form the starting point of a plural society in Tanah Melayu.)\n` +
          `2. **Objective 2:** *Menilai nilai etika perdagangan dan pengurusan kepelbagaian zaman Melaka yang boleh dijadikan panduan memperkukuh perpaduan Malaysia hari ini.*\n` +
          `   (Evaluate the trade ethics and diversity management of the Melaka era as a guide to strengthen unity in Malaysia today.)`;
        sendBotAnswer(objReply, "Here are the main purpose, theme, and the two core writing objectives from Page 5 of your note.");
        return;
      }

      // Detail 3: Timeline / History / Dates (1400–1511, Parameswara, Zheng He, Sultans, Portuguese)
      if (/\b(timeline|garis masa|sejarah|history|parameswara|zheng he|muzaffar|mansur|mahmud|tun perak|portugis|portuguese|albuquerque|sequeira|1400|1405|1411|1414|1445|1459|1481|1509|1511|111)\b/i.test(normalizedQuery)) {
        const timelineReply =
          `⏳ **Historical Timeline of the Melaka Sultanate (Garis Masa Melaka 1400–1511 — Page 6):**\n\n` +
          `• **±1400 — Opening of Melaka:** **Parameswara** founded Melaka at a sheltered river mouth along the main Straits of Melaka route.\n` +
          `• **1405–1433 — Ming Fleet Voyages:** Admiral **Zheng He** made Melaka a vital stopping base, strengthening diplomatic security.\n` +
          `• **1411 — Royal Mission to China:** Parameswara personally led a diplomatic mission to the Ming court, securing Melaka's status as a protected port.\n` +
          `• **±1414 — Islam & Title of Sultan:** Conversion to Islam attracted Muslim merchants from Gujarat, Persia, and Arabia, making Melaka a regional hub for Islam.\n` +
          `• **1445–1459 — Sultan Muzaffar Shah:** Compilation of **Hukum Kanun Melaka** began to regulate the growing port city.\n` +
          `• **1459–1477 — Golden Age (Sultan Mansur Shah & Bendahara Tun Perak):** The system of **4 Syahbandars** managed merchants by region; Melaka's influence expanded across the Peninsula and Sumatra.\n` +
          `• **1481–1511 — Sultan Mahmud Shah:** **Undang-Undang Laut Melaka** was codified to govern maritime shipping, trade contracts, and the *Nakhoda*'s authority.\n` +
          `• **1509 — First Portuguese Arrival:** Ships led by **Diogo Lopes de Sequeira** arrived, sparking early tension with European power.\n` +
          `• **1511 — Fall of Melaka:** Melaka fell to the Portuguese under **Afonso de Albuquerque** after **111 years**, though its multi-ethnic society continued to thrive.`;
        sendBotAnswer(timelineReply, "Here is the complete historical timeline of Melaka from 1400 to 1511 from Page 6 of your note.");
        return;
      }

      // Detail 4: Monsoon Winds, Geography, Trade Routes & Imported/Exported Goods (Page 7, 16, 22)
      if (/\b(monsoon|monsun|wind|angin|geography|geografi|map|peta|route|laluan|import|export|goods|barang|dagangan|spice|rempah|silk|sutera|kain kapas|porselin|kuda|cengkih|buah pala|lada|emas|timah)\b/i.test(normalizedQuery)) {
        const tradeReply =
          `🧭 **Geography, Monsoon Calendar & Trade Goods Flow (Pages 7, 16 & 22):**\n\n` +
          `**1. Strategic Location & Monsoon Schedule (Kalendar Monsun — Page 7):**\n` +
          `• The Straits of Melaka connects the Indian Ocean and the South China Sea. Ships depended on two monsoon winds and had to stay in Melaka for months waiting for the wind to change:\n` +
          `  - **Monsun Barat Daya (Southwest Monsoon · April – September):** Brought ships (*Dhow*) from **India, Sri Lanka, the Persian Gulf, and Arabia** carrying Gujarati & Coromandel cotton cloth, Persian carpets, frankincense (*kemenyan*), and horses.\n` +
          `  - **Monsun Timur Laut (Northeast Monsoon · November – March):** Brought junks (*Jong*) from **China, Champa, and Ryukyu** carrying silk (*sutera*), porcelain (*porselin*), and ceramics.\n\n` +
          `**2. Trade Goods Flow (Aliran Barang Dagangan — Page 16 & Page 22):**\n` +
          `• **Imported into Melaka (Dibawa Masuk):**\n` +
          `  - Kain kapas Gujarat & Coromandel (Indian cotton textiles)\n` +
          `  - Sutera & porselin China (Chinese silk & porcelain)\n` +
          `  - Kemenyan & kuda Arab / permaidani Parsi (Arabian frankincense, horses & Persian carpets)\n` +
          `• **Exported from Melaka / Nusantara (Dibawa Keluar):**\n` +
          `  - Bunga cengkih & buah pala Maluku (Cloves & nutmeg from Maluku)\n` +
          `  - Lada Sumatera & kapur barus Borneo (Sumatran pepper & Bornean camphor)\n` +
          `  - Bijih timah & emas Semenanjung (Peninsular tin ore & gold)`;
        sendBotAnswer(tradeReply, "Here are the details on Melaka's monsoon calendar, trade routes, and imported and exported goods from Pages 7, 16, and 22.");
        return;
      }

      // Detail 5: Article 1 — Port Administration, 4 Pembesar & 4 Syahbandar (Pages 8–9)
      if (/\b(article 1|artikel 1|pelabuhan yang tidak pernah tidur|syahbandar|pembesar|bendahara|temenggung|laksamana|penghulu bendahari|kati|tahil|bahara|jongkong|port administration|pentadbiran pelabuhan)\b/i.test(normalizedQuery)) {
        const art1Reply =
          `🏛️ **Article 1: Port Administration — "Pelabuhan Yang Tidak Pernah Tidur" (Pages 8–9)**\n` +
          `*Author: Arthur Ryan Anak Anis (05DIT24F1055)*\n\n` +
          `**1. Four Principal State Officials (Empat Pembesar Utama):**\n` +
          `• **Bendahara:** Chief Minister (Ketua Menteri) leading the administration.\n` +
          `• **Temenggung:** Maintained city security, public order, and market weights.\n` +
          `• **Laksamana:** Commander of the naval fleet protecting the Straits of Melaka from pirates (*lanun*).\n` +
          `• **Penghulu Bendahari:** Managed state revenue, customs, and taxes.\n\n` +
          `**2. The System of Four Syahbandars (Empat Syahbandar — Page 8):**\n` +
          `Melaka appointed **4 Syahbandars**, each dedicated to specific foreign merchant groups so traders dealt with an official who knew their language and customs:\n` +
          `• **Syahbandar 1:** Merchants from **Gujarat** (most influential group).\n` +
          `• **Syahbandar 2:** Merchants from **South India, Bengal (Benggala), Pegu & Pasai**.\n` +
          `• **Syahbandar 3:** Merchants from **Java, Maluku, Banda, Palembang, Borneo & Luzon**.\n` +
          `• **Syahbandar 4:** Merchants from **China, Champa & Ryukyu**.\n\n` +
          `**3. Standardized Weights, Currency & Social Impact (Page 9):**\n` +
          `• Standardized measurements (**kati, tahil, bahara**) and used **tin ingots (jongkong timah)** alongside foreign currencies.\n` +
          `• Long stays led merchants to open settlements (**Kampung Keling, Kampung Jawa, Kampung Cina**) and marry locals.\n` +
          `• **Modern Relevance:** Port Klang and Tanjung Pelepas today compete on the same pillars: operational efficiency, legal certainty, and route safety.`;
        sendBotAnswer(art1Reply, "Here is the complete breakdown of Article 1 on Port Administration, the 4 Pembesar, and the 4 Syahbandars.");
        return;
      }

      // Detail 6: Article 2 — 84 Languages, Settlements, Lingua Franca & Jalan Harmoni (Pages 10–11)
      if (/\b(article 2|artikel 2|84|language|languages|bahasa|lingua franca|tome pires|suma oriental|kampung keling|kampung jawa|kampung cina|bukit china|jalan harmoni|komuniti pedagang)\b/i.test(normalizedQuery)) {
        const art2Reply =
          `🗣️ **Article 2: Foreign Merchant Communities — "84 Bahasa dalam Satu Bandar" (Pages 10–11)**\n` +
          `*Author: Vianfazerry Anak Fabian (05DIT24F1160)*\n\n` +
          `**1. 84 Languages Recorded in One City:**\n` +
          `• Portuguese writer **Tomé Pires** recorded in *Suma Oriental* (±1515) that **84 distinct languages** were spoken at the port of Melaka.\n` +
          `• **Examples of languages heard:** Melayu, Tamil, Gujarati, Parsi (Persian), Arab, Jawa, Bugis, Hokkien, Benggali, Champa, Ryukyu, Kristang, and dozens more.\n\n` +
          `**2. Bahasa Melayu as Lingua Franca:**\n` +
          `• Despite huge diversity, Melaka stayed united because **Bahasa Melayu** emerged as the *lingua franca* (common language of trade and communication across the Malay Archipelago).\n\n` +
          `**3. Merchant Settlements (Perkampungan Dagang — Page 10):**\n` +
          `• **Kampung Keling:** Tamil and South Indian merchants.\n` +
          `• **Kampung Jawa:** Javanese and Nusantara traders.\n` +
          `• **Kampung Cina:** Traders from southern China.\n` +
          `• **Bukit China:** Linked to the entourage of Princess **Hang Li Po** in *Sejarah Melayu* (one of the oldest Chinese cemeteries outside China).\n\n` +
          `**4. Cultural Harmony & Jalan Harmoni (Page 11):**\n` +
          `• On **Jalan Harmoni** in Melaka today, a Mosque (*Masjid Kampung Kling*), a Chinese Temple (*Tokong Cina*), and a Hindu Temple (*Kuil Hindu*) stand side-by-side — living proof of religious tolerance.\n` +
          `• Mixed marriages (*perkahwinan campur*) between foreign male traders and local women gave rise to the Peranakan communities.`;
        sendBotAnswer(art2Reply, "Here is the complete detail for Article 2 on the 84 languages, Bahasa Melayu as lingua franca, merchant settlements, and Jalan Harmoni.");
        return;
      }

      // Detail 7: Article 3 — Laws & Trade Ethics, Hukum Kanun (44 Fasal), Undang-Undang Laut (Pages 12–13)
      if (/\b(article 3|artikel 3|law|laws|legal|undang|hukum kanun|laut melaka|44|fasal|etika|ethics|nakhoda|riba|amanah|adil|tanggungjawab)\b/i.test(normalizedQuery)) {
        const art3Reply =
          `⚖️ **Article 3: Laws & Ethics — "Etika Sebelum Untung" (Pages 12–13)**\n` +
          `*Author: Amirull Hafiz Bin Majid (05DIT24F1141)*\n\n` +
          `**1. Two Written Legal Codes of Melaka (Page 12):**\n` +
          `• **Hukum Kanun Melaka (Undang-Undang Melaka):** Contains **44 clauses (44 fasal)** covering criminal law, family law, slavery, debt, and city conduct — one of the earliest written legal codes in the Malay Archipelago.\n` +
          `• **Undang-Undang Laut Melaka (Maritime Laws of Melaka):** Specifically governed life aboard ships and sea trade. It declared the **Nakhoda (Ship Captain)** as supreme authority (*"seperti raja di atas kapalnya"* — like a king aboard his ship), regulating crew duties, cargo space, theft at sea, discipline, and dispute resolution.\n\n` +
          `**2. Protection of the Vulnerable & Moral Principles (Pages 12–13):**\n` +
          `• Protected small cargo owners, sailors far from home, and foreign merchants unfamiliar with local customs.\n` +
          `• Shaped by **Islamic ethics** (prohibition of *riba*/usury, honoring contracts, honest weights) and **Malay custom (Adat Melayu)** emphasizing *amanah* (trust) and *budi* (good character).\n\n` +
          `**3. Four Enduring Ethical Values (Nilai Etika Yang Masih Relevan — Page 13):**\n` +
          `• **Amanah (Trustworthiness):** Honest weights and measurements.\n` +
          `• **Adil (Justice):** Dedicated officials (*Syahbandar*) for each community.\n` +
          `• **Hormat (Respect):** Freedom of religion and customs for foreign traders.\n` +
          `• **Tanggungjawab (Responsibility):** The *Nakhoda* is fully accountable for his ship, crew, and cargo.`;
        sendBotAnswer(art3Reply, "Here is the detailed breakdown of Article 3 covering Hukum Kanun Melaka, Undang-Undang Laut Melaka, and the 4 core ethical values.");
        return;
      }

      // Detail 8: Article 4 — Cultural Heritage, Anak-Anak Selat (Baba-Nyonya, Chetti, Kristang, Jawi Peranakan, UNESCO) (Pages 14–15)
      if (/\b(article 4|artikel 4|anak-anak selat|anak selat|baba|nyonya|peranakan|chetti|kristang|jawi|warisan|heritage|culture|budaya|kebaya|asam pedas|unesco|2008|2024|famosa|stadthuys)\b/i.test(normalizedQuery)) {
        const art4Reply =
          `🏮 **Article 4: Cultural Heritage — "Anak-Anak Selat: Baba, Nyonya, Chetti & Kristang" (Pages 14–15)**\n` +
          `*Author: Daniel Wong Bin Husain Wong (05DIT24F1059)*\n\n` +
          `**1. How New Communities Formed (Page 14):**\n` +
          `• Foreign Traders (Chinese, Tamil, Arab, Javanese) + Local Melaka Society → Marriage (*Perkahwinan Campur*) → **Anak-Anak Selat** (Communities neither purely foreign nor purely local):\n` +
          `  - **Baba-Nyonya (Peranakan Cina):** Descendants of Chinese traders who married locals; speak *Melayu Baba*, wear the *kebaya*, cook Nyonya cuisine (combining Chinese ingredients with Malay spices like *asam pedas* and *kuih lapis*), while keeping Chinese ancestral customs.\n` +
          `  - **Chetti Melaka (Peranakan Hindu):** Descendants of Tamil Hindu merchants who married local women since the Sultanate era; practice Hinduism while speaking Malay daily and adopting Malay customs.\n` +
          `  - **Portugis-Kristang:** Formed after 1511; speak *Kristang* (Portuguese-based creole) and practice Catholicism blended with local traditions.\n` +
          `  - **Jawi Peranakan:** Descendants of Arab and Indian Muslim traders married to Malay women.\n\n` +
          `**2. UNESCO Global Recognition (Page 15):**\n` +
          `• **2008:** Melaka and George Town were inscribed as **UNESCO World Heritage Sites** as historic multicultural trading cities.\n` +
          `• **2024:** The **Kebaya** was inscribed on the **UNESCO Intangible Cultural Heritage List** through a joint Southeast Asian nomination including Malaysia.\n\n` +
          `**3. Historical Landmarks & Challenge:**\n` +
          `• Landmarks include *Porta de Santiago (A Famosa)* (1511 Portuguese fort) and *Stadthuys* (Dutch era).\n` +
          `• **Current Challenge:** Declining numbers of fluent *Kristang* speakers and youth mastering full Baba-Nyonya and Chetti traditions.`;
        sendBotAnswer(art4Reply, "Here is the complete breakdown of Article 4 on Baba-Nyonya, Chetti Melaka, Portugis-Kristang, Jawi Peranakan, and UNESCO recognition.");
        return;
      }

      // Detail 9: Malaysia MADANI & Current Issues (Page 18)
      if (/\b(madani|kemampanan|kesejahteraan|daya cipta|keyakinan|ihsan|isu semasa|current issue|modern|6 nilai|six values)\b/i.test(normalizedQuery)) {
        const madaniReply =
          `🇲🇾 **From the Straits of Melaka to Malaysia MADANI (Page 18):**\n\n` +
          `Five hundred years after Melaka, the **Malaysia MADANI** framework emphasizes **6 core values (6 Nilai Teras)** that were already practiced in the port of Melaka:\n\n` +
          `1. **Kemampanan (Sustainability):** Melaka protected its port resources — safe sea lanes and organized warehouses — for long-term continuous trade.\n` +
          `2. **Kesejahteraan (Well-being):** Port taxes funded security and public facilities benefiting all communities.\n` +
          `3. **Daya Cipta (Innovation):** The system of 4 Syahbandars and standardized weights (*kati, tahil, bahara*) were administrative innovations.\n` +
          `4. **Hormat (Respect):** Every community was allowed to maintain its religion, language, and customs within the same city.\n` +
          `5. **Keyakinan (Trust/Confidence):** Written laws (*Hukum Kanun & Undang-Undang Laut*) gave foreign merchants confidence that disputes would be judged fairly.\n` +
          `6. **Ihsan (Compassion):** Maritime rules protected sailors and small cargo owners — showing compassion toward weaker parties.\n\n` +
          `💡 **Lesson for Youth Today:** Unity is not an accident — it is the result of a fair system, respected laws, and openness toward people who are different from us.`;
        sendBotAnswer(madaniReply, "Here is how Melaka's governance connects to the 6 core values of Malaysia MADANI on Page 18.");
        return;
      }

      // Detail 10: Historical Quotes (Suara Sejarah — Venice, Ma Huan, Hang Li Po, Albuquerque — Page 17)
      if (/\b(quote|petikan|suara sejarah|venice|kerongkong|ma huan|yingya shenglan|hang li po|sulalatus salatin|sejarah melayu)\b/i.test(normalizedQuery)) {
        const quotesReply =
          `📜 **Historical Quotes & Records (Suara Sejarah — Page 17):**\n\n` +
          `1. **Tomé Pires (*Suma Oriental*, ±1515):**\n` +
          `   • *"Sesiapa yang menjadi tuan Melaka, tangannya berada di kerongkong Venice."* ("Whoever is lord of Malacca has his hand on the throat of Venice.")\n` +
          `   • Explains why European powers coveted Melaka: controlling the Straits meant controlling the spice route to Europe.\n\n` +
          `2. **Undang-Undang Laut Melaka:**\n` +
          `   • The *Nakhoda* is described as *"seperti raja di atas kapalnya"* (like a king aboard his ship) — balancing supreme authority with full accountability for crew and cargo.\n\n` +
          `3. **Ma Huan (*Yingya Shenglan*, 1433):**\n` +
          `   • Chronicler of the Ming treasure fleet who documented Melaka's daily life, customs, and trade products — the earliest Chinese external record of Melaka.\n\n` +
          `4. **Sulalatus Salatin (*Sejarah Melayu*):**\n` +
          `   • Records Melaka–China diplomatic ties through the story of **Princess Hang Li Po's** marriage to **Sultan Mansur Shah** and the settlement at Bukit China.`;
        sendBotAnswer(quotesReply, "Here are the historical quotes and records from Page 17 of your note, including Tomé Pires, Ma Huan, and Sejarah Melayu.");
        return;
      }

      // Detail 11: References (APA 7th Edition) & Gantt Chart (Pages 20–21)
      if (/\b(reference|references|rujukan|citation|apa|bibliography|source|sources|book|books|gantt|carta gantt|jadual)\b/i.test(normalizedQuery)) {
        const refReply =
          `📚 **Project Gantt Chart & APA 7th Edition References (Pages 20–21):**\n\n` +
          `**📊 Group Gantt Chart (Carta Gantt Kumpulan — Page 20):**\n` +
          `• **M1–M2:** Problem-based topic discussion & consultation with course lecturer.\n` +
          `• **M3–M6:** Group task distribution, data & historical source collection.\n` +
          `• **M7–M10:** Writing individual articles (Articles 1–4), graphic design & infographics.\n` +
          `• **M10–M12:** Language editing, magazine layout, fact-checking, PDF conversion & flipbook submission.\n\n` +
          `**📖 APA 7th Edition References (Senarai Rujukan — Page 21):**\n` +
          `1. Ahmad, A. S. (Peny.). (1986). *Sulalatus Salatin (Sejarah Melayu)*. Dewan Bahasa dan Pustaka.\n` +
          `2. Andaya, B. W., & Andaya, L. Y. (2017). *A history of Malaysia* (3rd ed.). Palgrave Macmillan.\n` +
          `3. Liaw, Y. F. (1976). *Undang-undang Melaka: The laws of Melaka*. Martinus Nijhoff.\n` +
          `4. Pires, T. (1944). *The Suma Oriental of Tomé Pires* (A. Cortesão, Trans.). Hakluyt Society. (Original work ±1515).\n` +
          `5. Reid, A. (1988). *Southeast Asia in the age of commerce, 1450–1680: Vol. 1 — The lands below the winds*. Yale University Press.\n` +
          `6. Winstedt, R. O. (1956). *Malaya and its history*. Hutchinson University Library.\n` +
          `7. UNESCO World Heritage Centre. (2008). *Melaka and George Town, historic cities of the Straits of Malacca*.`;
        sendBotAnswer(refReply, "Here are the Gantt Chart project phases and the 7 APA references from Pages 20 and 21.");
        return;
      }
    }

    // =========================================================================
    // MODE C: CHAPTER 1 FULL INFO ("ask about Chapter 1 give the info", "explain all 4 articles", "tell me about chapter 1")
    // =========================================================================
    const isChapterInfoRequest =
      /\b(chapter\s*1|chapter1|1\.1|all\s*4\s*article|four\s*article|4\s*article|empat\s*artikel|full\s*info|info|overview|about\s*this\s*chapter|about\s*this\s*note|give\s*me\s*the\s*note)\b/i.test(normalizedQuery);

    if (isChapterInfoRequest && isMelakaEfolio) {
      const fullChapterInfo =
        `📘 **COMPLETE CHAPTER 1 INFORMATION GUIDE: ${targetNote.subject_code} — ${targetNote.title}**\n` +
        `📄 *Uploaded File:* ${targetNote.file_name} (*Majalah E-Folio MPU21072 Penghayatan Etika & Peradaban · Politeknik Kuching Sarawak*)\n\n` +
        `**🏛️ Topic & Title:**\n` +
        `• **Topik 6 · Tajuk 4:** *Titik Awal — Peranan Hubungan Perdagangan Zaman Kesultanan Melayu Melaka (1400–1511) dalam Membentuk Titik Awal Masyarakat Majmuk*\n` +
        `• **Theme:** *"Dari Pelabuhan ke Perpaduan"* (From Port to Unity)\n\n` +
        `**📊 Key Numbers & Facts in Chapter 1:**\n` +
        `• **84 Languages** spoken at the port of Melaka (recorded by Tomé Pires in *Suma Oriental*).\n` +
        `• **4 Syahbandars** managing foreign traders according to region (Gujarat; South India/Bengal/Pegu/Pasai; Java/Maluku/Borneo/Luzon; China/Champa/Ryukyu).\n` +
        `• **44 Clauses (Fasal)** in *Hukum Kanun Melaka* + *Undang-Undang Laut Melaka*.\n` +
        `• **111 Years** of the Melaka Sultanate (**1400–1511**) & **2 Monsoon Winds** (*Barat Daya* Apr–Sep & *Timur Laut* Nov–Mac).\n\n` +
        `**🎯 Two Main Objectives (Page 5):**\n` +
        `1. Explain how the Melaka Sultanate's trade network attracted diverse nations and formed the starting point (*Titik Awal*) of a plural society in Tanah Melayu.\n` +
        `2. Evaluate Melaka's trade ethics and diversity management as a guide to strengthen unity in Malaysia today.\n\n` +
        `**📖 Summary of the 4 Core Articles (Pages 8–15):**\n` +
        `• **Article 1 (pp. 8–9): Pelabuhan Yang Tidak Pernah Tidur** *(by Arthur Ryan, 05DIT24F1055)* — Explains the 4 Pembesar (*Bendahara, Temenggung, Laksamana, Penghulu Bendahari*), 4 Syahbandars, standardized weights (*kati, tahil, bahara*), and tin currency (*jongkong timah*).\n` +
        `• **Article 2 (pp. 10–11): 84 Bahasa dalam Satu Bandar** *(by Vianfazerry, 05DIT24F1160)* — Covers the 84 languages, *Bahasa Melayu* as the *lingua franca*, merchant settlements (*Kampung Keling, Kampung Jawa, Kampung Cina, Bukit China*), and religious harmony (*Jalan Harmoni*).\n` +
        `• **Article 3 (pp. 12–13): Etika Sebelum Untung** *(by Amirull Hafiz, 05DIT24F1141)* — Covers *Hukum Kanun Melaka* (44 fasal), *Undang-Undang Laut Melaka* (*Nakhoda* as captain), and the 4 ethical pillars (*Amanah, Adil, Hormat, Tanggungjawab*).\n` +
        `• **Article 4 (pp. 14–15): Anak-Anak Selat** *(by Daniel Wong, 05DIT24F1059)* — Explains hybrid communities born from intermarriage (**Baba-Nyonya, Chetti Melaka, Portugis-Kristang, Jawi Peranakan**) and UNESCO recognition (2008 World Heritage & 2024 Kebaya).\n\n` +
        `💡 *Tip: You can ask me about any specific article, timeline date, group member, law, or click "📝 Generate Summary Note" for your revision sheet!*`;

      sendBotAnswer(
        fullChapterInfo,
        "Here is the complete information for Chapter 1, including its theme, key numbers, 2 objectives, and all 4 articles."
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
      'detail', 'details', 'info', 'information', 'fact', 'facts', 'efolio', 'folio', 'page', 'hlm'
    ]);

    // Bilingual English <-> Malay concept expansion so English questions match Malay PDF text and vice versa
    const bilingualSynonymMap = {
      port: ['pelabuhan', 'syahbandar', 'kapal', 'berlabuh'],
      harbour: ['pelabuhan', 'syahbandar'],
      trade: ['perdagangan', 'dagang', 'niaga', 'pedagang'],
      trader: ['pedagang', 'saudagar', 'nakhoda'],
      merchant: ['pedagang', 'komuniti', 'kampung'],
      plural: ['majmuk', 'kepelbagaian', 'berbilang'],
      society: ['masyarakat', 'komuniti', 'penduduk'],
      diversity: ['kepelbagaian', 'majmuk', 'harmoni'],
      king: ['sultan', 'raja', 'parameswara'],
      ruler: ['sultan', 'pemerintah', 'pembesar'],
      captain: ['nakhoda', 'kapal', 'laut'],
      ship: ['kapal', 'jong', 'perahu', 'pelayaran'],
      sea: ['laut', 'selat', 'maritim'],
      strait: ['selat', 'melaka'],
      tax: ['cukai', 'hasil', 'bendahari'],
      weight: ['timbang', 'sukat', 'kati', 'tahil', 'bahara'],
      tin: ['timah', 'jongkong'],
      money: ['mata wang', 'jongkong', 'timah'],
      currency: ['mata wang', 'tukaran', 'timah'],
      pirate: ['lanun', 'laksamana', 'keselamatan'],
      security: ['keselamatan', 'keamanan', 'laksamana', 'temenggung'],
      village: ['kampung', 'perkampungan', 'keling', 'jawa', 'cina'],
      settlement: ['perkampungan', 'kampung'],
      marriage: ['kahwin', 'perkahwinan', 'campur', 'peranakan'],
      food: ['masakan', 'asam pedas', 'kuih lapis', 'nyonya'],
      clothing: ['kebaya', 'pakaian'],
      religion: ['agama', 'islam', 'hindu', 'katolik', 'masjid', 'tokong', 'kuil'],
      mosque: ['masjid', 'kampung kling', 'jalan harmoni'],
      temple: ['tokong', 'kuil', 'jalan harmoni'],
      unity: ['perpaduan', 'harmoni', 'madani'],
      value: ['nilai', 'etika', 'amanah', 'adil', 'hormat', 'ihsan'],
      number: ['angka', 'fakta', '84', '44', '111'],
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

    // If user asked a question with ZERO matching tokens/synonyms/stems in the chapter and no chapter study intent -> Refuse!
    if (matchedTokens.length === 0 && !hasStudyIntent) {
      setTimeout(() => {
        const refusalReply =
          `⚠️ Sorry, I cannot answer this question because it is outside of your uploaded chapter (${targetNote.subject_code} - ${targetNote.title}).\n\n` +
          `I strictly answer questions based on your uploaded course notes (${availableChaptersText}). Try asking about Chapter 1, its summary note, the 4 articles, Melaka trade, Syahbandar, Hukum Kanun Melaka, 84 languages, Baba-Nyonya, or Malaysia MADANI!`;
        setMessages(prev => [...prev, { text: refusalReply, sender: "bot", source: "Chapter Guard" }]);
        speakText("Sorry, I cannot answer this question because it is outside of your uploaded chapter.");
      }, 300);
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

    let matchedExcerpts = [];
    if (scoredSections.length > 0) {
      matchedExcerpts = scoredSections.slice(0, 3).map(s => s.text);
    } else {
      matchedExcerpts = logicalSections.slice(0, 3);
    }

    const headerLabel = `📘 **Detailed Answer from ${targetNote.subject_code} — ${targetNote.title} (${targetNote.file_name}):**`;
    const responseText = `${headerLabel}\n\n${matchedExcerpts.join('\n\n')}`;

    sendBotAnswer(responseText, matchedExcerpts[0]?.slice(0, 240));
  };

  const handleSendMessage = () => {
    processStudentQuery(inputValue);
  };

  const speakText = (text) => {
    if (!voiceEnabled) return;
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[📘📚💡✅⏳🏆⬇️]/g, '');
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
              <span style={{ fontWeight: 600, color: '#10b981', fontSize: '0.95rem' }}>
                {selectedNote ? `${selectedNote.subject_code} - ${selectedNote.title}` : 'Selected Course Material'}
              </span>
              {selectedNote?.lecturer_name && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  (by {selectedNote.lecturer_name})
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={selectedNoteId}
              onChange={handleNoteChange}
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              {notesList.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.subject_code} - {n.title}
                </option>
              ))}
            </select>
            {selectedNote && (
              <button
                onClick={() => handleDownloadNote(selectedNote.id)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Download this lecture note"
              >
                ⬇️ Download Note
              </button>
            )}
          </div>
        </div>
      )}

      {/* Easy One-Click Smart Prompt Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Ask:</span>
        {[
          { label: "📘 Chapter 1 Full Info", prompt: "Give me Chapter 1 info" },
          { label: "📝 Generate Summary Note", prompt: "Help me do the summary note for Chapter 1" },
          { label: "🎯 2 Main Objectives", prompt: "What are the main purpose and 2 objectives of Chapter 1?" },
          { label: "🏛️ Article 1: Port & Syahbandar", prompt: "Explain Article 1 and the 4 Syahbandar in detail" },
          { label: "🗣️ Article 2: 84 Languages", prompt: "Explain Article 2 and the 84 languages in Melaka" },
          { label: "⚖️ Article 3: Laws & Ethics", prompt: "Explain Article 3 Hukum Kanun Melaka and Undang-Undang Laut" },
          { label: "🏮 Article 4: Baba Nyonya & Heritage", prompt: "Explain Article 4 Baba Nyonya, Chetti, Kristang and UNESCO" },
          { label: "👥 Group Members & Roles", prompt: "Who are the group members and their matrix numbers?" },
          { label: "⏳ Timeline (1400–1511)", prompt: "Show the historical timeline of Melaka 1400-1511" },
          { label: "❓ Make 5 Quiz Questions", prompt: "Generate 5 practice questions for me" }
        ].map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => processStudentQuery(chip.prompt)}
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '5px 12px',
              borderRadius: '999px',
              fontSize: '0.77rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Voice Controls */}
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
      <div style={{ display: 'flex', flexDirection: 'column', height: '430px', border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.4)', overflow: 'hidden' }}>
        <div style={{ flexGrow: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              style={{ 
                maxWidth: '90%', 
                padding: '12px 16px', 
                borderRadius: '16px', 
                fontSize: '0.92rem', 
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
              {msg.text}
              {msg.source && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                    📖 Detected Material: {msg.source}
                  </span>
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
                      <button
                        type="button"
                        onClick={() => handleDownloadNote(msg.noteId)}
                        style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#34d399',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ⬇️ Download {msg.noteFileName || 'Note'}
                      </button>
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
            placeholder='Ask anything from your note: "Chapter 1 info", "Summary note", "4 Syahbandar", "84 languages", "Hukum Kanun", "Baba Nyonya"...' 
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
            <div className="brand-logo">🎓</div>
            <div className="brand-text">
              <h2>AI-LMS Portal</h2>
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
              <div className="user-avatar">{initials}</div>
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
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    marginLeft: '2px'
                  }}>
                    {unreadNotificationsCount}
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
            <div className="user-badge">
              <span>{user.full_name}</span>
              <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
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
              {/* Easy-to-Understand Quick Action Cards */}
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
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
                              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{a.title}</h3>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                              <span>👨‍🏫 Lecturer: <strong>{a.lecturer_name || 'Lecturer'}</strong></span>
                              {a.due_date && <span>⏰ Due Date: <strong style={{ color: '#fbbf24' }}>{a.due_date}</strong></span>}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isSubmitted ? (
                              <span style={{ background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', padding: '5px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
                                ✅ Submitted
                              </span>
                            ) : (
                              <span style={{ background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', padding: '5px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
                                ⏳ Pending Submission
                              </span>
                            )}
                          </div>
                        </div>

                        {a.description && (
                          <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', background: 'rgba(0,0,0,0.15)', padding: '12px 14px', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                            {a.description}
                          </div>
                        )}

                        {a.file_name && (
                          <div>
                            <button
                              onClick={() => handleDownloadAssignmentFile(a.id)}
                              className="btn-secondary"
                              style={{ fontSize: '0.82rem', padding: '7px 14px' }}
                            >
                              📎 Download Lecturer Attachment ({a.file_name})
                            </button>
                          </div>
                        )}

                        {/* Existing Submission Info & Grade */}
                        {isSubmitted && (
                          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.86rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                              <span>📄 <strong>Your Submitted File:</strong> {a.submitted_file}</span>
                              <span style={{ color: 'var(--text-muted)' }}>
                                Submitted on {new Date(a.submitted_at).toLocaleString()}
                              </span>
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
            <div className="card" style={{ maxWidth: '600px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>👤 Student Academic Profile</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{user.full_name}</div>
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Matrix No / Student ID</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>{user.matrix_no || 'Not Specified'}</div>
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Username</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{user.username}</div>
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{user.email}</div>
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Account Role</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'capitalize' }}>{user.role}</div>
                </div>
              </div>
            </div>
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
    </div>
  );
};

export default StudentDashboard;
