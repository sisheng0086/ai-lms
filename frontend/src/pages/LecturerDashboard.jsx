import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const LecturerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Upload states
  const [subjectCode, setSubjectCode] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });
  
  // Notes state
  const [notesList, setNotesList] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Student escalated questions queue
  const [pendingQueue] = useState([]);

  const fetchNotes = useCallback(async (lecturerId) => {
    setLoadingNotes(true);
    try {
      const response = await fetch(`${API_URL}/notes/${lecturerId}`);
      if (response.ok) {
        const data = await response.json();
        setNotesList(data.notes || []);
      }
    } catch (err) {
      console.error('Failed to fetch notes', err);
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'lecturer') {
      navigate('/student');
      return;
    }
    setUser(parsedUser);
    fetchNotes(parsedUser.id);
  }, [navigate, fetchNotes]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !subjectCode || !title) {
      setUploadMessage({ type: 'error', text: 'Please fill all fields and select a file.' });
      return;
    }

    setUploading(true);
    setUploadMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('user_id', user.id);
    formData.append('subject_code', subjectCode);
    formData.append('title', title);
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/notes/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setUploadMessage({ type: 'success', text: 'Notes uploaded successfully!' });
        setSubjectCode('');
        setTitle('');
        setFile(null);
        fetchNotes(user.id);
      } else {
        setUploadMessage({ type: 'error', text: data.detail || data.message || 'Upload failed.' });
      }
    } catch (err) {
      setUploadMessage({ type: 'error', text: 'Network error. Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  const initials = (user.full_name || user.username || "LC")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const tabMeta = {
    overview: { title: "Educator Portal", subtitle: "Course management, AI training materials, and student Q&A" },
    upload: { title: "Upload Lecture Notes", subtitle: "Upload PDF or text documents to train the student AI assistant" },
    materials: { title: "Uploaded Course Materials", subtitle: "Manage your active course notes and indexing status" },
    queue: { title: "Student Q&A Queue", subtitle: "Review questions escalated by students" },
    profile: { title: "Lecturer Profile", subtitle: "Your faculty account details" }
  };

  const renderUploadCard = () => (
    <div className="card">
      <div>
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          📤 Upload Lecture Notes
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Upload PDF or text files so students can study them with the AI Study Companion.
        </p>
      </div>

      {uploadMessage.text && (
        <div className={uploadMessage.type === 'success' ? 'success-message' : 'error-message'} style={{ marginBottom: 0 }}>
          {uploadMessage.text}
        </div>
      )}

      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label className="form-label">Subject Code</label>
            <input 
              type="text" 
              className="form-input" 
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              placeholder="e.g. DFC3013"
              required
            />
          </div>
          <div>
            <label className="form-label">Lecture Title</label>
            <input 
              type="text" 
              className="form-input" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1: Introduction to AI"
              required
            />
          </div>
        </div>

        <div>
          <label className="form-label">Document File (PDF / TXT)</label>
          <input 
            type="file" 
            accept=".pdf,.txt,.md" 
            onChange={handleFileChange}
            className="form-input"
            style={{ padding: '10px' }}
            required
          />
          {file && (
            <p style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '6px' }}>
              Selected: {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          )}
        </div>

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={uploading}
          style={{ width: 'fit-content', padding: '12px 28px' }}
        >
          {uploading ? 'Uploading...' : 'Upload & Publish to AI'}
        </button>
      </form>
    </div>
  );

  const renderMaterialsCard = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>📚 Your Uploaded Notes</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Materials currently available to students in the AI Study Companion.
          </p>
        </div>
        <button 
          onClick={() => fetchNotes(user.id)} 
          className="btn-secondary"
          disabled={loadingNotes}
        >
          {loadingNotes ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Title</th>
              <th>File Name</th>
              <th>Size</th>
              <th>AI Status</th>
              <th>Date Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {notesList.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '28px' }}>
                  No lecture notes uploaded yet. Use the Upload form to publish your first material.
                </td>
              </tr>
            ) : (
              notesList.map((note) => (
                <tr key={note.id}>
                  <td>
                    <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                      {note.subject_code}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600' }}>{note.title}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{note.file_name}</td>
                  <td>{note.file_size_kb} KB</td>
                  <td>
                    <span style={{ 
                      background: 'rgba(52, 211, 153, 0.2)', 
                      color: 'var(--success)', 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      ✓ Active in AI
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(note.uploaded_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderQueueCard = () => (
    <div className="card">
      <div>
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          ❓ Student Escalation Queue
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Questions that require direct lecturer verification.
        </p>
      </div>
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student Question</th>
              <th style={{ width: '120px' }}>Status</th>
              <th style={{ width: '100px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingQueue.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No pending student questions in the queue.
                </td>
              </tr>
            ) : (
              pendingQueue.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.question}</td>
                  <td>
                    <span style={{ background: 'rgba(251, 191, 36, 0.2)', color: 'var(--warning)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                      Reply
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      {/* LEFT SIDEBAR */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          <div className="sidebar-brand">
            <div className="brand-logo">🎓</div>
            <div className="brand-text">
              <h2>AI-LMS Portal</h2>
              <span>Educator Workspace</span>
            </div>
          </div>

          <div className="sidebar-user-card">
            <div className="sidebar-user-top">
              <div className="user-avatar" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                {initials}
              </div>
              <div className="user-info-text">
                <div className="user-info-name">{user.full_name}</div>
                <div className="user-info-role">Lecturer Account</div>
              </div>
            </div>
            <div className="staff-badge" style={{ width: 'fit-content' }}>
              ✓ Verified Faculty Staff
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">Management</div>
            <button
              className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
            >
              <span>📊</span>
              <span>Dashboard Overview</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => { setActiveTab('upload'); setSidebarOpen(false); }}
            >
              <span>📤</span>
              <span>Upload Lecture Notes</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'materials' ? 'active' : ''}`}
              onClick={() => { setActiveTab('materials'); setSidebarOpen(false); }}
            >
              <span>📚</span>
              <span>Uploaded Materials ({notesList.length})</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'queue' ? 'active' : ''}`}
              onClick={() => { setActiveTab('queue'); setSidebarOpen(false); }}
            >
              <span>❓</span>
              <span>Student Q&A Queue</span>
            </button>

            <div className="nav-section-label" style={{ marginTop: '12px' }}>Account</div>
            <button
              className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
            >
              <span>👤</span>
              <span>Lecturer Profile</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN AREA + TOP NAVBAR */}
      <div className="app-main">
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
            <div className="user-badge" style={{ background: 'rgba(251, 191, 36, 0.15)', color: 'var(--warning)', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
              <span>{user.full_name}</span>
              <span style={{ background: 'rgba(251, 191, 36, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                Lecturer
              </span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="app-content">
          {activeTab === 'overview' && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>📚</div>
                  <div className="stat-info">
                    <h3>{notesList.length}</h3>
                    <p>Published Notes</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>❓</div>
                  <div className="stat-info">
                    <h3>{pendingQueue.length}</h3>
                    <p>Pending Questions</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>🤖</div>
                  <div className="stat-info">
                    <h3>Online</h3>
                    <p>AI Clone Status</p>
                  </div>
                </div>
              </div>

              {renderUploadCard()}
              {renderMaterialsCard()}
            </>
          )}

          {activeTab === 'upload' && renderUploadCard()}

          {activeTab === 'materials' && renderMaterialsCard()}

          {activeTab === 'queue' && renderQueueCard()}

          {activeTab === 'profile' && (
            <div className="card" style={{ maxWidth: '600px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>👤 Lecturer Profile</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{user.full_name}</div>
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Username</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{user.username}</div>
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{user.email}</div>
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Role Status</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b' }}>Verified Lecturer</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LecturerDashboard;
