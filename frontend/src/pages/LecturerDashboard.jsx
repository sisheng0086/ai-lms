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

  // Assignments & Student Homework Submissions state
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignSubject, setAssignSubject] = useState('');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignFile, setAssignFile] = useState(null);
  const [creatingAssign, setCreatingAssign] = useState(false);
  const [assignMessage, setAssignMessage] = useState({ type: '', text: '' });

  // Expanded assignment submissions viewer & grading state
  const [expandedAssignId, setExpandedAssignId] = useState(null);
  const [submissionsMap, setSubmissionsMap] = useState({});
  const [loadingSubmissionsId, setLoadingSubmissionsId] = useState(null);
  const [gradeInputs, setGradeInputs] = useState({});
  const [feedbackInputs, setFeedbackInputs] = useState({});
  const [savingGradeId, setSavingGradeId] = useState(null);

  // Contact & Student Q&A Inbox + Admin Support state
  const [contactSubTab, setContactSubTab] = useState('student_inbox'); // 'student_inbox' | 'admin_support'
  const [studentInbox, setStudentInbox] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [replyInputs, setReplyInputs] = useState({});
  const [sendingReplyId, setSendingReplyId] = useState(null);

  // Admin Support Ticket states for Lecturer
  const [adminCategory, setAdminCategory] = useState('System / Technical Error');
  const [adminPriority, setAdminPriority] = useState('Normal');
  const [adminSubject, setAdminSubject] = useState('');
  const [adminDescription, setAdminDescription] = useState('');
  const [adminImageData, setAdminImageData] = useState('');
  const [sendingAdminTicket, setSendingAdminTicket] = useState(false);
  const [adminTicketFeedback, setAdminTicketFeedback] = useState({ type: '', text: '' });
  const [adminTicketsList, setAdminTicketsList] = useState([]);

  // Notification Bell state for Lecturer
  const [notifOpen, setNotifOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lecturer_read_notifs') || '[]');
    } catch {
      return [];
    }
  });

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

  const fetchAssignments = useCallback(async (lecturerId) => {
    if (!lecturerId) return;
    setLoadingAssignments(true);
    try {
      const res = await fetch(`${API_URL}/assignments/lecturer/${lecturerId}`);
      if (res.ok) {
        const data = await res.json();
        setAssignmentsList(data.assignments || []);
      }
    } catch (err) {
      console.error('Failed to fetch lecturer assignments', err);
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  const fetchContactInbox = useCallback(async (lecturerId) => {
    if (!lecturerId) return;
    setLoadingInbox(true);
    try {
      const [inboxRes, tickRes] = await Promise.all([
        fetch(`${API_URL}/contact/lecturer/inbox/${lecturerId}`),
        fetch(`${API_URL}/contact/admin/all`)
      ]);
      if (inboxRes.ok) {
        const data = await inboxRes.json();
        const msgs = data.messages || [];
        setStudentInbox(msgs);
        const initReplies = {};
        msgs.forEach(m => {
          initReplies[m.id] = m.reply || '';
        });
        setReplyInputs(prev => ({ ...prev, ...initReplies }));
      }
      if (tickRes.ok) {
        const d = await tickRes.json();
        setAdminTicketsList(d.tickets || []);
      }
    } catch (err) {
      console.error('Failed to fetch contact inbox', err);
    } finally {
      setLoadingInbox(false);
    }
  }, []);

  const fetchSubmissionsForAssignment = async (assignmentId) => {
    setLoadingSubmissionsId(assignmentId);
    try {
      const res = await fetch(`${API_URL}/assignments/${assignmentId}/submissions`);
      if (res.ok) {
        const data = await res.json();
        const subs = data.submissions || [];
        setSubmissionsMap(prev => ({ ...prev, [assignmentId]: subs }));
        const gInit = {};
        const fInit = {};
        subs.forEach(s => {
          gInit[s.id] = s.grade || '';
          fInit[s.id] = s.feedback || '';
        });
        setGradeInputs(prev => ({ ...prev, ...gInit }));
        setFeedbackInputs(prev => ({ ...prev, ...fInit }));
      }
    } catch (err) {
      console.error('Failed to fetch submissions', err);
    } finally {
      setLoadingSubmissionsId(null);
    }
  };

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
    fetchAssignments(parsedUser.id);
    fetchContactInbox(parsedUser.id);
  }, [navigate, fetchNotes, fetchAssignments, fetchContactInbox]);

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

    try {
      const CHUNK_SIZE = 512 * 1024; // 512 KB chunks for fast, reliable upload of large original files
      if (file.size > 2 * 1024 * 1024) {
        // First create/update the note metadata with a small initial slice
        const initSlice = file.slice(0, Math.min(CHUNK_SIZE, file.size));
        const initForm = new FormData();
        initForm.append('user_id', user.id);
        initForm.append('subject_code', subjectCode);
        initForm.append('title', title);
        initForm.append('file', new File([initSlice], file.name, { type: file.type }));

        const initRes = await fetch(`${API_URL}/notes/upload`, {
          method: 'POST',
          body: initForm
        });
        const initData = await initRes.json();
        if (!initRes.ok || initData.status !== 'success') {
          setUploadMessage({ type: 'error', text: initData.detail || 'Upload failed.' });
          setUploading(false);
          return;
        }

        const noteId = initData.note_id;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunkBlob = file.slice(start, end);
          const chunkForm = new FormData();
          chunkForm.append('chunk_index', String(i));
          chunkForm.append('total_chunks', String(totalChunks));
          chunkForm.append('file_name', file.name);
          chunkForm.append('chunk', chunkBlob, file.name);

          setUploadMessage({
            type: 'success',
            text: `⏳ Uploading original file (${Math.round(((i + 1) / totalChunks) * 100)}%)...`
          });

          const cRes = await fetch(`${API_URL}/notes/${noteId}/upload-chunk`, {
            method: 'POST',
            body: chunkForm
          });
          if (!cRes.ok) {
            throw new Error(`Failed uploading chunk ${i + 1}`);
          }
        }

        setUploadMessage({
          type: 'success',
          text: '✅ Original file uploaded 100% intact! Students can now download the exact original file.'
        });
        setSubjectCode('');
        setTitle('');
        setFile(null);
        fetchNotes(user.id);
        return;
      }

      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('subject_code', subjectCode);
      formData.append('title', title);
      formData.append('file', file);

      const response = await fetch(`${API_URL}/notes/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setUploadMessage({ type: 'success', text: '✅ Original file uploaded successfully! Students can now study or download this chapter.' });
        setSubjectCode('');
        setTitle('');
        setFile(null);
        fetchNotes(user.id);
      } else {
        setUploadMessage({ type: 'error', text: data.detail || data.message || 'Upload failed.' });
      }
    } catch {
      setUploadMessage({ type: 'error', text: 'Network error. Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignSubject.trim() || !assignTitle.trim()) {
      setAssignMessage({ type: 'error', text: 'Subject code and assignment title are required.' });
      return;
    }

    setCreatingAssign(true);
    setAssignMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('user_id', user.id);
    formData.append('subject_code', assignSubject.trim());
    formData.append('title', assignTitle.trim());
    formData.append('description', assignDesc.trim());
    formData.append('due_date', assignDueDate);
    if (assignFile) {
      formData.append('file', assignFile);
    }

    try {
      const res = await fetch(`${API_URL}/assignments/create`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAssignMessage({ type: 'success', text: '✅ Assignment published for students!' });
        setAssignSubject('');
        setAssignTitle('');
        setAssignDesc('');
        setAssignDueDate('');
        setAssignFile(null);
        fetchAssignments(user.id);
      } else {
        setAssignMessage({ type: 'error', text: data.detail || 'Failed to create assignment.' });
      }
    } catch {
      setAssignMessage({ type: 'error', text: 'Network error while creating assignment.' });
    } finally {
      setCreatingAssign(false);
    }
  };

  const handleToggleSubmissions = (assignmentId) => {
    if (expandedAssignId === assignmentId) {
      setExpandedAssignId(null);
    } else {
      setExpandedAssignId(assignmentId);
      fetchSubmissionsForAssignment(assignmentId);
    }
  };

  const handleSaveGrade = async (submissionId, assignmentId) => {
    setSavingGradeId(submissionId);
    try {
      const res = await fetch(`${API_URL}/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: gradeInputs[submissionId] || '',
          feedback: feedbackInputs[submissionId] || ''
        })
      });
      if (res.ok) {
        fetchSubmissionsForAssignment(assignmentId);
      }
    } catch (err) {
      console.error('Failed to save grade', err);
    } finally {
      setSavingGradeId(null);
    }
  };

  const handleReplyStudentQuestion = async (msgId) => {
    const replyText = (replyInputs[msgId] || '').trim();
    if (!replyText) return;
    setSendingReplyId(msgId);
    try {
      const res = await fetch(`${API_URL}/contact/lecturer/${msgId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText })
      });
      if (res.ok) {
        fetchContactInbox(user.id);
      }
    } catch (err) {
      console.error('Failed to send reply', err);
    } finally {
      setSendingReplyId(null);
    }
  };

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

  const handleRefreshAll = () => {
    if (!user) return;
    fetchContactInbox(user.id);
    fetchAssignments(user.id);
    fetchNotes(user.id);
  };

  const handleSendAdminTicket = async (e) => {
    e.preventDefault();
    if (!adminSubject.trim() || !adminDescription.trim()) {
      setAdminTicketFeedback({ type: 'error', text: 'Please enter both issue summary and details.' });
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
        setAdminTicketFeedback({ type: 'success', text: '🛠️ Technical support report submitted to Admin!' });
        setAdminSubject('');
        setAdminDescription('');
        setAdminImageData('');
        fetchContactInbox(user.id);
      } else {
        setAdminTicketFeedback({ type: 'error', text: data.detail || 'Failed to submit report.' });
      }
    } catch {
      setAdminTicketFeedback({ type: 'error', text: 'Network error submitting support ticket.' });
    } finally {
      setSendingAdminTicket(false);
    }
  };

  if (!user) return null;

  const initials = (user.full_name || user.username || "LC")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const pendingStudentQuestionsCount = studentInbox.filter(m => m.status === 'pending').length;

  const tabMeta = {
    overview: { title: "Educator Portal", subtitle: "Course management, AI training materials, assignments, and student Q&A" },
    upload: { title: "Upload Lecture Notes", subtitle: "Upload Chapter PDFs or text notes for students to study & download" },
    materials: { title: "Uploaded Course Materials", subtitle: "Manage and download your active course notes" },
    assignments: { title: "Assignments & Student Homework", subtitle: "Publish homework assignments and grade student file submissions" },
    contact: { title: "Contact & Student Questions", subtitle: "Answer questions from students (with Student Name, Matrix ID & Class) or contact Admin Support" },
    profile: { title: "Lecturer Profile", subtitle: "Your faculty account details" }
  };

  const renderUploadCard = () => (
    <div className="card">
      <div>
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          📤 Upload Lecture Notes / Chapters
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Tip: Include the chapter number in the title (e.g. <strong>"Chapter 1: Introduction"</strong> or <strong>"Chapter 1.1: Basics"</strong>) so students can ask the AI for it directly!
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
            <label className="form-label">Chapter / Lecture Title</label>
            <input 
              type="text" 
              className="form-input" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1 / Chapter 1.1: Introduction to AI"
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
          style={{ width: 'fit-content', padding: '12px 28px', margin: 0 }}
        >
          {uploading ? 'Uploading...' : '📤 Upload & Publish to AI'}
        </button>
      </form>
    </div>
  );

  const renderMaterialsCard = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>📚 Your Uploaded Notes</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Materials currently available to students for download and in the AI Study Companion.
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
              <th>Chapter / Title</th>
              <th>File Name</th>
              <th>Size</th>
              <th>AI Status</th>
              <th>Date Uploaded</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {notesList.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '28px' }}>
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
                  <td>
                    <button
                      onClick={() => window.open(`${API_URL}/notes/${note.id}/download`, '_blank')}
                      className="btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                    >
                      ⬇️ Download
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

  const renderAssignmentsSection = () => (
    <>
      {/* Create New Assignment Card */}
      <div className="card">
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            📋 Create New Assignment / Homework
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Publish an assignment or homework task so students can view instructions and submit their completed work.
          </p>
        </div>

        {assignMessage.text && (
          <div className={assignMessage.type === 'success' ? 'success-message' : 'error-message'} style={{ marginBottom: 0 }}>
            {assignMessage.text}
          </div>
        )}

        <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label className="form-label">Subject Code</label>
              <input
                type="text"
                className="form-input"
                value={assignSubject}
                onChange={(e) => setAssignSubject(e.target.value)}
                placeholder="e.g. DFC3013"
                required
              />
            </div>
            <div>
              <label className="form-label">Assignment Title</label>
              <input
                type="text"
                className="form-input"
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
                placeholder="e.g. Lab Assignment 1: Python Basics"
                required
              />
            </div>
            <div>
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={assignDueDate}
                onChange={(e) => setAssignDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Instructions / Description</label>
            <textarea
              className="form-input"
              rows={3}
              value={assignDesc}
              onChange={(e) => setAssignDesc(e.target.value)}
              placeholder="Write clear instructions, grading criteria, or submission requirements for students..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <label className="form-label">Attach Question Sheet / Rubric (Optional PDF, DOCX, ZIP)</label>
            <input
              type="file"
              onChange={(e) => setAssignFile(e.target.files ? e.target.files[0] : null)}
              className="form-input"
              style={{ padding: '8px' }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={creatingAssign}
            style={{ width: 'fit-content', padding: '12px 28px', margin: 0 }}
          >
            {creatingAssign ? 'Publishing...' : '📢 Publish Assignment to Students'}
          </button>
        </form>
      </div>

      {/* Published Assignments & Student Submissions Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>📥 Published Assignments & Student Submissions</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Click "View Submissions" on any assignment to download student homework files and assign grades.
            </p>
          </div>
          <button onClick={() => fetchAssignments(user.id)} className="btn-secondary" disabled={loadingAssignments}>
            {loadingAssignments ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {assignmentsList.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '10px' }}>
            No assignments published yet. Create your first assignment above!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {assignmentsList.map((a) => {
              const isExpanded = expandedAssignId === a.id;
              const subs = submissionsMap[a.id] || [];
              return (
                <div
                  key={a.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '18px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '3px 9px', borderRadius: '5px', fontWeight: 700, fontSize: '0.8rem' }}>
                          {a.subject_code}
                        </span>
                        <strong style={{ fontSize: '1.08rem' }}>{a.title}</strong>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        {a.due_date && <span>⏰ Due: <strong style={{ color: '#fbbf24' }}>{a.due_date}</strong></span>}
                        <span>📅 Created: {new Date(a.created_at).toLocaleDateString()}</span>
                        <span>📥 Student Submissions: <strong style={{ color: '#38bdf8' }}>{a.submission_count || 0}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {a.file_name && (
                        <button
                          onClick={() => window.open(`${API_URL}/assignments/${a.id}/download`, '_blank')}
                          className="btn-secondary"
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        >
                          📎 Question File ({a.file_name})
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleSubmissions(a.id)}
                        className="btn-primary"
                        style={{ width: 'auto', margin: 0, padding: '7px 16px', fontSize: '0.82rem' }}
                      >
                        {isExpanded ? '🔼 Hide Submissions' : `📂 View Submissions (${a.submission_count || 0})`}
                      </button>
                    </div>
                  </div>

                  {a.description && (
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.14)', padding: '10px 14px', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                      {a.description}
                    </div>
                  )}

                  {isExpanded && (
                    <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', color: '#38bdf8' }}>
                        👨‍🎓 Submitted Student Homework ({subs.length})
                      </h4>
                      {loadingSubmissionsId === a.id ? (
                        <div style={{ padding: '16px', color: 'var(--text-muted)' }}>Loading student submissions...</div>
                      ) : subs.length === 0 ? (
                        <div style={{ padding: '18px', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.12)', borderRadius: '8px', textAlign: 'center' }}>
                          No students have submitted homework for this assignment yet.
                        </div>
                      ) : (
                        <div className="data-table-container">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Student Name</th>
                                <th>Matrix No</th>
                                <th>Submitted File</th>
                                <th>Student Comment</th>
                                <th>Submitted At</th>
                                <th>Grade & Feedback</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subs.map((s) => (
                                <tr key={s.id}>
                                  <td style={{ fontWeight: 600 }}>{s.student_name}</td>
                                  <td>
                                    <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem' }}>
                                      {s.matrix_no || 'N/A'}
                                    </span>
                                  </td>
                                  <td>
                                    <button
                                      onClick={() => window.open(`${API_URL}/submissions/${s.id}/download`, '_blank')}
                                      className="btn-secondary"
                                      style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                                    >
                                      ⬇️ {s.file_name}
                                    </button>
                                  </td>
                                  <td style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                                    {s.comment || '—'}
                                  </td>
                                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {new Date(s.submitted_at).toLocaleString()}
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                      <input
                                        type="text"
                                        placeholder="Grade (e.g. A / 90%)"
                                        value={gradeInputs[s.id] ?? ''}
                                        onChange={(e) => setGradeInputs(prev => ({ ...prev, [s.id]: e.target.value }))}
                                        className="form-input"
                                        style={{ width: '110px', padding: '6px 8px', fontSize: '0.8rem' }}
                                      />
                                      <input
                                        type="text"
                                        placeholder="Feedback for student..."
                                        value={feedbackInputs[s.id] ?? ''}
                                        onChange={(e) => setFeedbackInputs(prev => ({ ...prev, [s.id]: e.target.value }))}
                                        className="form-input"
                                        style={{ width: '160px', padding: '6px 8px', fontSize: '0.8rem' }}
                                      />
                                      <button
                                        onClick={() => handleSaveGrade(s.id, a.id)}
                                        disabled={savingGradeId === s.id}
                                        className="btn-primary"
                                        style={{ width: 'auto', margin: 0, padding: '6px 12px', fontSize: '0.78rem' }}
                                      >
                                        {savingGradeId === s.id ? 'Saving...' : '💾 Save'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  // Build live notifications for Lecturer (student questions, student homework submissions, admin replies)
  const lecturerNotificationsList = [
    ...studentInbox
      .filter(m => m.status === 'pending')
      .map(m => ({
        id: `stu-q-${m.id}`,
        icon: '🙋‍♂️',
        title: `New Student Question (${m.class_name} • ${m.subject_code || 'General'})`,
        detail: `${m.student_name} (${m.matrix_no || 'Student'}): "${(m.question || '').slice(0, 70)}"`,
        onClick: () => {
          setActiveTab('contact');
          setContactSubTab('student_inbox');
          setNotifOpen(false);
        }
      })),
    ...assignmentsList
      .filter(a => Number(a.submission_count) > 0)
      .map(a => ({
        id: `sub-count-${a.id}-${a.submission_count}`,
        icon: '📥',
        title: `Homework Submissions: ${a.subject_code} - ${a.title}`,
        detail: `${a.submission_count} student submission(s) ready for review and grading`,
        onClick: () => {
          setActiveTab('assignments');
          setExpandedAssignId(a.id);
          fetchSubmissionsForAssignment(a.id);
          setNotifOpen(false);
        }
      })),
    ...adminTicketsList
      .filter(t => t.admin_response || t.status === 'resolved')
      .map(t => ({
        id: `lec-admin-${t.id}`,
        icon: '🛠️',
        title: `Admin Support Update: ${t.subject}`,
        detail: t.admin_response || 'Marked as resolved',
        onClick: () => {
          setActiveTab('contact');
          setContactSubTab('admin_support');
          setNotifOpen(false);
        }
      }))
  ];

  const unreadLecturerNotifs = lecturerNotificationsList.filter(n => !readNotifIds.includes(n.id)).length;

  const handleMarkNotifRead = (id) => {
    if (!readNotifIds.includes(id)) {
      const updated = [...readNotifIds, id];
      setReadNotifIds(updated);
      localStorage.setItem('lecturer_read_notifs', JSON.stringify(updated));
    }
  };

  const handleMarkAllNotifsRead = () => {
    const allIds = lecturerNotificationsList.map(n => n.id);
    setReadNotifIds(allIds);
    localStorage.setItem('lecturer_read_notifs', JSON.stringify(allIds));
  };

  const renderContactAndInboxCard = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>💬 Student Q&A Inbox & Admin Support</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            View questions sent by students (with their Name, Matrix No, Class & attached images) or report technical/system issues to Admin.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => fetchContactInbox(user.id)}
            className="btn-secondary"
            disabled={loadingInbox}
            style={{ padding: '8px 14px', fontSize: '0.84rem', margin: 0 }}
          >
            {loadingInbox ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>

          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setContactSubTab('student_inbox')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.84rem',
                background: contactSubTab === 'student_inbox' ? 'var(--primary)' : 'transparent',
                color: contactSubTab === 'student_inbox' ? '#fff' : 'var(--text-muted)'
              }}
            >
              👨‍🎓 Student Questions ({studentInbox.length})
            </button>
            <button
              type="button"
              onClick={() => setContactSubTab('admin_support')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.84rem',
                background: contactSubTab === 'admin_support' ? 'var(--primary)' : 'transparent',
                color: contactSubTab === 'admin_support' ? '#fff' : 'var(--text-muted)'
              }}
            >
              🛠️ Contact Admin (Tech Support)
            </button>
          </div>
        </div>
      </div>

      {contactSubTab === 'student_inbox' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Showing all questions from students, including who asked, their class, and any uploaded screenshot:
            </span>
            <button onClick={() => fetchContactInbox(user.id)} className="btn-secondary" disabled={loadingInbox} style={{ fontSize: '0.82rem' }}>
              {loadingInbox ? 'Refreshing...' : '🔄 Refresh Inbox'}
            </button>
          </div>

          {studentInbox.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '10px' }}>
              📭 No student questions in your inbox yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {studentInbox.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    border: m.status === 'pending' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.35)',
                    background: m.status === 'pending' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                        👨‍🎓 {m.student_name}
                      </span>
                      <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '3px 9px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem' }}>
                        🪪 Matrix: {m.matrix_no || 'N/A'}
                      </span>
                      <span style={{ background: 'rgba(168, 85, 247, 0.18)', color: '#c084fc', padding: '3px 9px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem' }}>
                        🏫 Class: {m.class_name}
                      </span>
                      <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '3px 9px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem' }}>
                        📚 {m.subject_code || 'General'}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: m.status === 'answered' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                      color: m.status === 'answered' ? '#10b981' : '#fbbf24'
                    }}>
                      {m.status === 'answered' ? '✅ Answered' : '⏳ Needs Reply'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.94rem', color: 'var(--text-main)', background: 'rgba(0,0,0,0.18)', padding: '12px 14px', borderRadius: '8px' }}>
                    <strong>Question:</strong> {m.question}
                    {m.image_data && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginBottom: '4px', fontWeight: 600 }}>
                          📷 Attached Student Screenshot / Image (Click to enlarge):
                        </div>
                        <a href={m.image_data} target="_blank" rel="noreferrer">
                          <img
                            src={m.image_data}
                            alt="Student uploaded screenshot"
                            style={{ maxHeight: '240px', maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)', objectFit: 'contain' }}
                          />
                        </a>
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Asked on {new Date(m.created_at).toLocaleString()} {m.student_email ? `• ${m.student_email}` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Write your reply to this student..."
                      value={replyInputs[m.id] ?? ''}
                      onChange={(e) => setReplyInputs(prev => ({ ...prev, [m.id]: e.target.value }))}
                      style={{ flex: 1, minWidth: '240px' }}
                    />
                    <button
                      onClick={() => handleReplyStudentQuestion(m.id)}
                      disabled={sendingReplyId === m.id}
                      className="btn-primary"
                      style={{ width: 'auto', margin: 0, padding: '10px 20px', fontSize: '0.85rem' }}
                    >
                      {sendingReplyId === m.id ? 'Sending...' : m.status === 'answered' ? '🔄 Update Reply' : '📤 Send Reply'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '8px' }}>
          <div style={{
            padding: '14px 16px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            fontSize: '0.86rem'
          }}>
            <strong>🛠️ System & Technical Error Support (Admin Helpdesk)</strong>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
              Report any technical error, server problem, or system bug with an optional screenshot to the System Administrator (`admin@pks.edu.my`).
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
                <label className="form-label">Error Category</label>
                <select value={adminCategory} onChange={(e) => setAdminCategory(e.target.value)} className="form-select">
                  <option value="System / Technical Error">System / Technical Error</option>
                  <option value="Note Upload / AI Indexing Issue">Note Upload / AI Indexing Issue</option>
                  <option value="Assignment / Grading System Bug">Assignment / Grading System Bug</option>
                  <option value="Account / Permission Issue">Account / Permission Issue</option>
                </select>
              </div>
              <div>
                <label className="form-label">Priority</label>
                <select value={adminPriority} onChange={(e) => setAdminPriority(e.target.value)} className="form-select">
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="form-label">Short Summary *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Error uploading large PDF slide"
                  value={adminSubject}
                  onChange={(e) => setAdminSubject(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="form-label">Error Details *</label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Describe the technical error so the Admin can fix it..."
                value={adminDescription}
                onChange={(e) => setAdminDescription(e.target.value)}
                required
              />
            </div>

            {/* Image Upload for Lecturer Admin Support */}
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
                <label className="form-label" style={{ margin: 0 }}>
                  📷 Upload Screenshot / Image (Optional)
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
                    alt="Admin report preview"
                    style={{ maxHeight: '140px', maxWidth: '240px', borderRadius: '8px', border: '1px solid var(--border)', objectFit: 'contain' }}
                  />
                  <button
                    type="button"
                    onClick={() => setAdminImageData('')}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#f87171' }}
                  >
                    ✖ Remove Image
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={sendingAdminTicket} className="btn-primary" style={{ width: 'fit-content', margin: 0, padding: '10px 24px' }}>
              {sendingAdminTicket ? 'Submitting...' : '🛠️ Submit Error Report to Admin'}
            </button>
          </form>

          {adminTicketsList.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '10px' }}>🎫 Recent System Support Tickets ({adminTicketsList.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {adminTicketsList.slice(0, 5).map(t => (
                  <div key={t.id} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.84rem' }}>
                    <strong>[{t.category}] {t.subject}</strong> — <span style={{ color: 'var(--text-muted)' }}>by {t.reporter_name} ({t.user_role})</span>
                    <div style={{ color: 'var(--text-muted)', marginTop: '3px' }}>{t.description}</div>
                    {t.image_data && (
                      <div style={{ marginTop: '6px' }}>
                        <a href={t.image_data} target="_blank" rel="noreferrer">
                          <img
                            src={t.image_data}
                            alt="Support ticket screenshot"
                            style={{ maxHeight: '140px', borderRadius: '6px', border: '1px solid var(--border)', objectFit: 'contain' }}
                          />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
            <div className="nav-section-label">Course Management</div>
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
              className={`sidebar-nav-item ${activeTab === 'assignments' ? 'active' : ''}`}
              onClick={() => { setActiveTab('assignments'); setSidebarOpen(false); }}
            >
              <span>📋</span>
              <span>Assignments ({assignmentsList.length})</span>
            </button>

            <div className="nav-section-label" style={{ marginTop: '12px' }}>Communication & Help</div>
            <button
              className={`sidebar-nav-item ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => { setActiveTab('contact'); setSidebarOpen(false); }}
            >
              <span>💬</span>
              <span>Contact & Student Q&A ({pendingStudentQuestionsCount})</span>
            </button>
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

          <div className="navbar-right" style={{ position: 'relative' }}>
            {/* NOTIFICATION BELL FOR LECTURER */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>🔔</span>
                <span>Notifications</span>
                {unreadLecturerNotifs > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '999px'
                  }}>
                    {unreadLecturerNotifs}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: '360px',
                  maxWidth: '90vw',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  background: 'var(--bg-card, #1e293b)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
                  zIndex: 1000,
                  padding: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      🔔 Activity Notifications ({lecturerNotificationsList.length})
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleRefreshAll}
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        🔄 Refresh
                      </button>
                      {unreadLecturerNotifs > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllNotifsRead}
                          style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                          ✓ Read All
                        </button>
                      )}
                    </div>
                  </div>

                  {lecturerNotificationsList.length === 0 ? (
                    <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                      No pending notifications right now.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {lecturerNotificationsList.map(notif => {
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
                              alignItems: 'flex-start'
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
            >
              💬 Student Q&A ({pendingStudentQuestionsCount})
            </button>
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
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('materials')}>
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>📚</div>
                  <div className="stat-info">
                    <h3>{notesList.length}</h3>
                    <p>Published Notes</p>
                  </div>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('assignments')}>
                  <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>📋</div>
                  <div className="stat-info">
                    <h3>{assignmentsList.length}</h3>
                    <p>Active Assignments</p>
                  </div>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('contact')}>
                  <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>💬</div>
                  <div className="stat-info">
                    <h3>{studentInbox.length}</h3>
                    <p>Student Questions</p>
                  </div>
                </div>
              </div>

              {renderUploadCard()}
              {renderMaterialsCard()}
            </>
          )}

          {activeTab === 'upload' && renderUploadCard()}

          {activeTab === 'materials' && renderMaterialsCard()}

          {activeTab === 'assignments' && renderAssignmentsSection()}

          {activeTab === 'contact' && renderContactAndInboxCard()}

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
