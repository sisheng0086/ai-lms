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
  const [loadingNotes, setLoadingNotes] = useState(false);

  // AI chat states
  const [messages, setMessages] = useState([
    {
      text: "Hello! I am your AI learning companion. Ask me any questions about your uploaded course materials.",
      sender: "bot"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lecturerVoice, setLecturerVoice] = useState("male");
  
  // Quiz states
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizAnswerChecked, setQuizAnswerChecked] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState("");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);

  const loadNoteContent = useCallback(async (noteId) => {
    try {
      const res = await fetch(`${API_URL}/notes/${noteId}/content`);
      if (res.ok) {
        const data = await res.json();
        setNotesContent(data.content || "");
      }
    } catch (err) {
      console.error("Failed to load note content:", err);
    }
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

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [navigate, fetchNotes]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleNoteChange = (e) => {
    const noteId = e.target.value;
    setSelectedNoteId(noteId);
    loadNoteContent(noteId);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, { text: userText, sender: "user" }]);
    setInputValue("");

    if (notesList.length === 0 || !notesContent.trim()) {
      setTimeout(() => {
        const responseText = "No lecture notes have been uploaded yet by your lecturer. Please check back after your lecturer uploads course slides or notes in the Lecturer Dashboard!";
        setMessages(prev => [...prev, { text: responseText, sender: "bot", source: null }]);
        speakText(responseText);
      }, 400);
      return;
    }

    const selectedNote = notesList.find(n => String(n.id) === String(selectedNoteId));
    const noteTitle = selectedNote ? selectedNote.title : "Course Notes";

    const paragraphs = notesContent.split('\n').filter(p => p.trim().length > 15);
    const searchWords = userText.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    let bestParagraph = null;
    let maxMatches = 0;

    for (let paragraph of paragraphs) {
      let pLower = paragraph.toLowerCase();
      let matchCount = 0;
      for (let word of searchWords) {
        if (pLower.includes(word)) {
          matchCount++;
        }
      }
      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        bestParagraph = paragraph;
      }
    }

    let responseText = "";
    let source = null;

    if (bestParagraph && maxMatches > 0) {
      responseText = bestParagraph.trim();
      source = `${noteTitle} (${selectedNote?.subject_code || 'Course'})`;
    } else {
      responseText = `I searched through the uploaded materials for "${noteTitle}", but couldn't find specific details matching your question. Try asking a topic covered in these notes.`;
      source = null;
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { text: responseText, sender: "bot", source }]);
      speakText(responseText);
    }, 400);
  };

  const speakText = (text) => {
    if (!voiceEnabled) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
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

  const generateQuiz = () => {
    if (notesList.length === 0 || !notesContent.trim()) {
      setQuizQuestion(null);
      setQuizFeedback("⚠️ Cannot generate quiz: No lecture notes have been uploaded yet by your lecturer.");
      return;
    }

    const selectedNote = notesList.find(n => String(n.id) === String(selectedNoteId));
    const noteTitle = selectedNote ? selectedNote.title : "Course Notes";

    const sentences = notesContent
      .split(/[.\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 25 && s.length < 150);

    if (sentences.length > 0) {
      const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
      setQuizQuestion({
        question: `Based on "${noteTitle}": Which of the following statements is mentioned in the study notes?`,
        options: [
          { text: randomSentence, correct: true },
          { text: "This concept is not relevant to current software architecture.", correct: false },
          { text: "It is strictly prohibited under institutional educational guidelines.", correct: false }
        ]
      });
    } else {
      setQuizQuestion({
        question: `What is the primary focus of "${noteTitle}"?`,
        options: [
          { text: `Comprehensive concepts and fundamentals of ${noteTitle}.`, correct: true },
          { text: "Unrelated external hardware documentation.", correct: false },
          { text: "Outdated legacy protocols.", correct: false }
        ]
      });
    }

    setQuizAnswerChecked(false);
    setQuizFeedback("");
    setSelectedOptionIndex(null);
  };

  const handleCheckAnswer = (index, isCorrect) => {
    if (quizAnswerChecked) return;
    setSelectedOptionIndex(index);
    setQuizAnswerChecked(true);

    if (isCorrect) {
      setQuizFeedback("🎉 Correct answer! Well done.");
    } else {
      setQuizFeedback("❌ Incorrect. Review the uploaded course materials to find the correct concept.");
    }
  };

  if (!user) return null;

  const selectedNote = notesList.find(n => String(n.id) === String(selectedNoteId));
  const initials = (user.full_name || user.username || "ST")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const tabMeta = {
    overview: { title: "Student Dashboard", subtitle: "Overview of your AI learning workspace and course materials" },
    chat: { title: "AI Study Companion", subtitle: "Interactive Q&A and voice learning powered by lecturer notes" },
    quiz: { title: "AI Knowledge Check", subtitle: "Generate practice questions from your active course slides" },
    materials: { title: "Course Materials", subtitle: "Browse all lecture notes uploaded by your lecturers" },
    profile: { title: "Student Profile", subtitle: "Your academic registration details and Matrix ID" }
  };

  const renderChatCard = () => (
    <div className="card">
      <div>
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          🎓 AI Study Companion
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Ask your AI assistant questions based on verified lecturer materials.
        </p>
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
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Studying Material:</span>
              <span style={{ fontWeight: 600, color: '#10b981', fontSize: '0.95rem' }}>
                {selectedNote ? `${selectedNote.subject_code} - ${selectedNote.title}` : 'Selected Course Material'}
              </span>
              {selectedNote?.lecturer_name && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  (Uploaded by {selectedNote.lecturer_name})
                </span>
              )}
            </div>
          </div>

          {notesList.length > 1 && (
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
          )}
        </div>
      )}

      {/* Voice Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
        <div>
          <label className="form-label" style={{ marginBottom: '4px' }}>AI Voice Profile:</label>
          <select 
            value={lecturerVoice} 
            onChange={(e) => setLecturerVoice(e.target.value)} 
            className="form-select"
            style={{ padding: '8px' }}
          >
            <option value="male">Male Voice</option>
            <option value="female">Female Voice</option>
          </select>
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
          <input 
            type="checkbox" 
            checked={voiceEnabled} 
            onChange={(e) => setVoiceEnabled(e.target.checked)} 
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} 
          />
          Enable Text-to-Speech
        </div>
      </div>

      {/* Chat Interface */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '350px', border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.4)', overflow: 'hidden' }}>
        <div style={{ flexGrow: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              style={{ 
                maxWidth: '85%', 
                padding: '12px 16px', 
                borderRadius: '16px', 
                fontSize: '0.95rem', 
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
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '8px', fontStyle: 'italic' }}>
                  📖 Source: {msg.source}
                </span>
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
            placeholder={notesList.length === 0 ? "Ask a question (lecturer has not uploaded notes yet)..." : "Ask a question about the study materials..."} 
            className="form-input"
          />
          <button 
            onClick={handleSendMessage} 
            className="btn-primary"
            style={{ width: 'auto', padding: '0 24px', margin: 0 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuizCard = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>📝 AI Generated Knowledge Check</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Test your understanding with automatically generated practice questions.
          </p>
        </div>
        <button onClick={generateQuiz} className="btn-secondary">
          Generate Practice Question
        </button>
      </div>
      
      {quizQuestion ? (
        <div style={{ animation: 'fadeIn 0.3s ease-out', marginTop: '8px' }}>
          <p style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-main)', fontWeight: '500' }}>{quizQuestion.question}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quizQuestion.options.map((opt, idx) => {
              let btnColor = 'rgba(255, 255, 255, 0.05)';
              let textColor = 'var(--text-main)';
              if (quizAnswerChecked && selectedOptionIndex === idx) {
                btnColor = opt.correct ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)';
                textColor = opt.correct ? '#6ee7b7' : '#fca5a5';
              }
              return (
                <button 
                  key={idx} 
                  onClick={() => handleCheckAnswer(idx, opt.correct)} 
                  style={{ 
                    background: btnColor, 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    padding: '12px 16px', 
                    color: textColor, 
                    textAlign: 'left', 
                    cursor: 'pointer', 
                    fontSize: '0.95rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {String.fromCharCode(65 + idx)}. {opt.text}
                </button>
              );
            })}
          </div>
          {quizFeedback && (
            <p style={{ marginTop: '16px', fontSize: '0.95rem', fontWeight: '500', color: quizFeedback.startsWith('🎉') ? 'var(--success)' : '#f87171' }}>
              {quizFeedback}
            </p>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.9rem', background: 'rgba(56, 189, 248, 0.04)', borderRadius: '10px', border: '1px dashed rgba(56, 189, 248, 0.25)' }}>
          {quizFeedback || 'Click "Generate Practice Question" to test your knowledge on the uploaded study materials.'}
        </div>
      )}
    </div>
  );

  return (
    <div className="app-layout">
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
            <div className="nav-section-label">Main Menu</div>
            <button
              className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
            >
              <span>📊</span>
              <span>Dashboard Overview</span>
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
              <span>Practice Quiz</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'materials' ? 'active' : ''}`}
              onClick={() => { setActiveTab('materials'); setSidebarOpen(false); }}
            >
              <span>📚</span>
              <span>Course Materials ({notesList.length})</span>
            </button>

            <div className="nav-section-label" style={{ marginTop: '12px' }}>Account</div>
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

          <div className="navbar-right">
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
              {/* Stats Row */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>🪪</div>
                  <div className="stat-info">
                    <h3>{user.matrix_no || 'N/A'}</h3>
                    <p>Student Matrix No</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>📚</div>
                  <div className="stat-info">
                    <h3>{notesList.length}</h3>
                    <p>Uploaded Course Notes</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>🤖</div>
                  <div className="stat-info">
                    <h3>{notesList.length > 0 ? 'Ready' : 'Waiting'}</h3>
                    <p>AI Companion Status</p>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem' }}>📚 Available Course Materials</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Select any lecture note below to study with the AI Companion.
                  </p>
                </div>
                <button onClick={fetchNotes} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                  🔄 Refresh
                </button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Title</th>
                      <th>Lecturer</th>
                      <th>File Name</th>
                      <th>Uploaded Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notesList.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                          No lecture notes have been uploaded by lecturers yet.
                        </td>
                      </tr>
                    ) : (
                      notesList.map((note) => (
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
                            <button
                              className="btn-primary"
                              style={{ width: 'auto', padding: '6px 14px', fontSize: '0.8rem', margin: 0 }}
                              onClick={() => {
                                setSelectedNoteId(note.id);
                                loadNoteContent(note.id);
                                setActiveTab('chat');
                              }}
                            >
                              Study with AI
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
      </div>
    </div>
  );
};

export default StudentDashboard;
