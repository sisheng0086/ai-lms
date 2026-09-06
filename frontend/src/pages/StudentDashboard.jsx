import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // AI chat states
  const [notes, setNotes] = useState(`Chapter 1: Internet of Things (IoT) Overview.\nSlide 1.1: The Internet of Things is a network of interconnected physical devices embedded with software, electronics, and smart sensors that exchange data over the internet.\nSlide 1.2: A smart sensor collects environmental parameters (such as temperature, motion, or light) and converts them into digital signals for network transmission.\nSlide 1.3: Actuators perform physical movements or operations (like opening a valve or turning on a fan) when instructed by the IoT controller.\nSlide 1.4: RAG stands for Retrieval-Augmented Generation. It allows AI to fetch specific slides before formulating answers, avoiding AI hallucination.`);
  const [messages, setMessages] = useState([
    { text: "Hello! I am your AI learning companion. Ask me any question about the current module.", sender: "bot" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lecturerVoice, setLecturerVoice] = useState("male");
  
  // Quiz states
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizAnswerChecked, setQuizAnswerChecked] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState("");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);

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

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, { text: userText, sender: "user" }]);
    setInputValue("");

    // Simulate RAG (Retrieval-Augmented Generation) based on hardcoded notes
    const sentences = notes.split('\n');
    let matchedSentence = null;
    let source = "General Knowledge (Context Not Found)";

    const searchWords = userText.toLowerCase().split(' ');
    
    for (let sentence of sentences) {
      if (!sentence.trim()) continue;
      let matches = 0;
      searchWords.forEach(word => {
        if (word.length > 3 && sentence.toLowerCase().includes(word)) {
          matches++;
        }
      });
      if (matches > 0) {
        matchedSentence = sentence;
        break;
      }
    }

    let responseText = "";
    if (matchedSentence) {
      const parts = matchedSentence.split(':');
      if (parts.length > 1) {
        source = parts[0].trim();
        responseText = parts.slice(1).join(':').trim();
      } else {
        responseText = matchedSentence;
      }
    } else {
      responseText = "I couldn't locate specific information about that in the current module materials. Try asking something related to IoT sensors, actuators, or RAG.";
      source = null;
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { text: responseText, sender: "bot", source }]);
      speakText(responseText);
    }, 500);
  };

  const speakText = (text) => {
    if (!voiceEnabled) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (lecturerVoice === 'female') {
      selectedVoice = voices.find(v => v.name.includes('Zira') || v.name.includes('Google UK English Female') || v.name.includes('female'));
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
    } else {
      selectedVoice = voices.find(v => v.name.includes('David') || v.name.includes('Google UK English Male') || v.name.includes('male'));
      utterance.rate = 0.95;
      utterance.pitch = 0.85;
    }

    if (selectedVoice) utterance.voice = selectedVoice;
    window.speechSynthesis.speak(utterance);
  };

  const generateQuiz = () => {
    const textLower = notes.toLowerCase();
    let question = "What is the primary role of a smart sensor in an IoT system?";
    let options = [
      { text: "It executes physical actions like turning on fans.", correct: false },
      { text: "It converts collected environmental data into digital signals.", correct: true },
      { text: "It hosts web servers directly.", correct: false }
    ];

    if (textLower.includes('actuator') && !textLower.includes('sensor')) {
      question = "What component executes movement or operations (e.g. turning on a fan)?";
      options = [
        { text: "Smart Sensor", correct: false },
        { text: "Actuator", correct: true },
        { text: "Vector Database", correct: false }
      ];
    }

    setQuizQuestion({ question, options });
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
      setQuizFeedback("❌ Incorrect. Try reviewing the module materials.");
    }
  };

  if (!user) return null;

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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chat with your AI assistant to understand the materials better.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'window.innerWidth > 768 ? "1fr 1fr" : "1fr"', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
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
                  color: msg.sender === 'user' ? '#0f172a' : 'var(--text-main)',
                  fontWeight: msg.sender === 'user' ? '500' : 'normal',
                  borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: msg.sender === 'bot' ? '4px' : '16px',
                }}
              >
                {msg.text}
                {msg.source && (
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '8px', fontStyle: 'italic' }}>
                    Source: {msg.source}
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
              placeholder="Ask a question about the study materials..." 
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
        <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px dashed rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '20px', marginTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
              <p style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-main)' }}>{quizQuestion.question}</p>
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
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
              Click "Generate Practice Question" to test your knowledge on the current topic.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
