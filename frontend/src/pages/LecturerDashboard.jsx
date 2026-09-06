import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const API_URL = "http://localhost:8000";

const LecturerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Upload states
  const [subjectCode, setSubjectCode] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });
  
  // Notes state
  const [notesList, setNotesList] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Queue state (mocked for UI)
  const [pendingQueue] = useState([
    { question: "How secure is FAISS?", status: "Pending" },
    { question: "What happens if a sensor breaks?", status: "Pending" }
  ]);

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
  }, [navigate]);

  const fetchNotes = async (lecturerId) => {
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
  };

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
        // Refresh notes list
        fetchNotes(user.id);
      } else {
        setUploadMessage({ type: 'error', text: data.message || 'Upload failed.' });
      }
    } catch (err) {
      setUploadMessage({ type: 'error', text: 'Network error. Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <ThemeToggle />
      
      {/* Portal Header */}
      <header className="dashboard-header">
        <div>
          <h1>LMS Educator Portal</h1>
          <p>Course Management & AI Integration</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="user-badge" style={{ background: 'rgba(251, 191, 36, 0.15)', color: 'var(--warning)', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
            <span>{user.full_name}</span>
            <span style={{ background: 'rgba(251, 191, 36, 0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>Lecturer</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'window.innerWidth > 900 ? "1fr 300px" : "1fr"', gap: '20px' }}>
        
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Upload Section */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>📤 Upload Learning Materials</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>Upload notes to train the AI assistant for your students.</p>
            
            {uploadMessage.text && (
              <div className={uploadMessage.type === 'success' ? 'success-message' : 'error-message'}>
                {uploadMessage.text}
              </div>
            )}

            <form onSubmit={handleUpload} style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Subject Code</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="e.g. ITT300"
                  />
                </div>
                <div>
                  <label className="form-label">Title / Topic</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chapter 1: Intro to IoT"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label">Document File</label>
                <input 
                  type="file" 
                  className="form-input" 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  style={{ padding: '8px' }}
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>Accepted formats: PDF, DOCX, PPTX (Max 10MB)</p>
              </div>

              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Uploading & Processing...' : 'Upload Notes'}
              </button>
            </form>
          </div>

          {/* Notes List Section */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>📚 Uploaded Materials Repository</h2>
            
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Topic Title</th>
                    <th>Filename</th>
                    <th>Upload Date</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingNotes ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading materials...</td>
                    </tr>
                  ) : notesList.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No materials uploaded yet.</td>
                    </tr>
                  ) : (
                    notesList.map((note) => (
                      <tr key={note.id || Math.random()}>
                        <td><span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{note.subject_code}</span></td>
                        <td style={{ fontWeight: '500' }}>{note.title}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{note.filename || 'document.pdf'}</td>
                        <td>{note.created_at ? new Date(note.created_at).toLocaleDateString() : 'Today'}</td>
                        <td>{(note.size / 1024 / 1024 || 1.2).toFixed(2)} MB</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '12px' }}>Lecturer Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(52, 211, 153, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }}></div>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--success)' }}>ONLINE</p>
                <p style={{ fontSize: '0.8rem', color: 'rgba(52, 211, 153, 0.8)' }}>AI assistant is active</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', flexGrow: 1 }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '16px' }}>Pending Q&A Queue</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Questions AI couldn't answer:</p>
            
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingQueue.map((item, idx) => (
                <li key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>"{item.question}"</p>
                  <span style={{ background: 'rgba(251, 191, 36, 0.2)', color: 'var(--warning)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                    {item.status}
                  </span>
                </li>
              ))}
              {pendingQueue.length === 0 && (
                <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '10px' }}>Queue is empty.</li>
              )}
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
