import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Notes state (fetched from real database)
  const [notesList, setNotesList] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [notesContent, setNotesContent] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);

  // AI chat states
  const [messages, setMessages] = useState([
    {
      text: "Hello! I am your AI learning companion. Ask me any questions about your course materials.",
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

    // Case 1: No notes have been uploaded to the system
    if (notesList.length === 0 || !notesContent.trim()) {
      setTimeout(() => {
        const responseText = "No lecture notes have been uploaded yet by your lecturer. Please check back after your lecturer uploads course slides or notes in the Lecturer Dashboard!";
        setMessages(prev => [...prev, { text: responseText, sender: "bot", source: null }]);
        speakText(responseText);
      }, 400);
      return;
    }

    // Case 2: Notes are available — search real uploaded content
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

    // Generate dynamic questions from uploaded text
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

  return (
    <div className="dashboard-container">
      <ThemeToggle />
      <header className="dashboard-header">
        <div>
          <h1>LMS Student Portal</h1>
          <p>Interactive AI Learning Environment</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="user-badge">
            <span>{user.full_name}</span>
            <span style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>Student</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="card">
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>🎓 AI Study Companion</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ask your AI assistant questions based on verified lecturer materials.</p>
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
            margin: '12px 0',
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
            margin: '12px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>📚</span>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Studying Material:</span>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
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

        {/* Quiz Section */}
        <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px dashed rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '20px', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ fontSize: '1.05rem' }}>📝 AI Generated Knowledge Check</h4>
            <button 
              onClick={generateQuiz} 
              className="btn-secondary"
            >
              Generate Practice Question
            </button>
          </div>
          
          {quizQuestion ? (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
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
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {quizFeedback || 'Click "Generate Practice Question" to test your knowledge on the uploaded study materials.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
