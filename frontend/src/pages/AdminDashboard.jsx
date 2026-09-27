import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'tickets' | 'notes' | 'settings'
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Users state
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [resetPwUserId, setResetPwUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetFeedback, setResetFeedback] = useState({ type: '', text: '' });
  const [statusActionId, setStatusActionId] = useState(null);

  // Tickets state
  const [ticketsList, setTicketsList] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketFilter, setTicketFilter] = useState('all'); // 'all' | 'open' | 'resolved'
  const [resolvingTicketId, setResolvingTicketId] = useState(null);
  const [adminResponseText, setAdminResponseText] = useState({});
  const [ticketFeedback, setTicketFeedback] = useState({});
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState(null);

  // Notes state
  const [notesList, setNotesList] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Settings state
  const [staffPasscode, setStaffPasscode] = useState('');
  const [savingSetting, setSavingSetting] = useState(false);
  const [settingFeedback, setSettingFeedback] = useState({ type: '', text: '' });

  // Preview Note Modal state
  const [previewNote, setPreviewNote] = useState(null);
  const [previewNoteContent, setPreviewNoteContent] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Check auth
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/');
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') {
      navigate(parsed.role === 'lecturer' ? '/lecturer' : '/student');
      return;
    }
    setAdminUser(parsed);
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_URL}/admin/stats`);
      if (res.ok) {
        const d = await res.json();
        setStats(d.stats);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_URL}/admin/users`);
      if (res.ok) {
        const d = await res.json();
        setUsersList(d.users || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch(`${API_URL}/contact/admin/all`);
      if (res.ok) {
        const d = await res.json();
        setTicketsList(d.tickets || []);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`${API_URL}/admin/notes`);
      if (res.ok) {
        const d = await res.json();
        setNotesList(d.notes || []);
      }
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/settings`);
      if (res.ok) {
        const d = await res.json();
        setStaffPasscode(d.settings?.LECTURER_SECRET_KEY || 'STAFF2026');
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, []);

  useEffect(() => {
    if (!adminUser) return;
    fetchStats();
    fetchUsers();
    fetchTickets();
    fetchNotes();
    fetchSettings();
  }, [adminUser, fetchStats, fetchUsers, fetchTickets, fetchNotes, fetchSettings]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    setStatusActionId(userId);
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) {
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatusActionId(null);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setResetFeedback({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }
    setResetFeedback({ type: 'info', text: 'Resetting password...' });
    try {
      const res = await fetch(`${API_URL}/admin/users/${resetPwUserId}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setResetFeedback({ type: 'success', text: `✅ ${data.message}` });
        setTimeout(() => {
          setResetPwUserId(null);
          setNewPassword('');
          setResetFeedback({ type: '', text: '' });
        }, 1600);
      } else {
        setResetFeedback({ type: 'error', text: data.detail || 'Failed to reset password' });
      }
    } catch {
      setResetFeedback({ type: 'error', text: 'Network error resetting password' });
    }
  };

  const handleResolveTicket = async (ticketId, newStatus = 'resolved') => {
    const reply = adminResponseText[ticketId]?.trim() || '';
    if (!reply && newStatus === 'resolved') {
      setTicketFeedback(prev => ({ ...prev, [ticketId]: { type: 'error', text: 'Please write a resolution message for the user.' } }));
      return;
    }

    setResolvingTicketId(ticketId);
    setTicketFeedback(prev => ({ ...prev, [ticketId]: { type: 'info', text: 'Saving ticket update...' } }));

    try {
      const res = await fetch(`${API_URL}/contact/admin/${ticketId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          admin_response: reply || (newStatus === 'in_progress' ? 'Technical team is currently investigating.' : 'Issue verified and resolved.')
        })
      });
      if (res.ok) {
        setTicketFeedback(prev => ({ ...prev, [ticketId]: { type: 'success', text: `✅ Ticket marked as ${newStatus}!` } }));
        fetchTickets();
        fetchStats();
      } else {
        setTicketFeedback(prev => ({ ...prev, [ticketId]: { type: 'error', text: 'Failed to update ticket.' } }));
      }
    } catch {
      setTicketFeedback(prev => ({ ...prev, [ticketId]: { type: 'error', text: 'Network error updating ticket.' } }));
    } finally {
      setResolvingTicketId(null);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!staffPasscode.trim()) {
      setSettingFeedback({ type: 'error', text: 'Passcode cannot be empty.' });
      return;
    }
    setSavingSetting(true);
    setSettingFeedback({ type: 'info', text: 'Saving...' });
    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'LECTURER_SECRET_KEY',
          value: staffPasscode.trim()
        })
      });
      if (res.ok) {
        setSettingFeedback({ type: 'success', text: '✅ Lecturer Secret Passcode updated successfully!' });
      } else {
        setSettingFeedback({ type: 'error', text: 'Failed to update setting.' });
      }
    } catch {
      setSettingFeedback({ type: 'error', text: 'Network error saving setting.' });
    } finally {
      setSavingSetting(false);
    }
  };

  const handleOpenPreviewNote = async (note) => {
    setPreviewNote(note);
    setLoadingPreview(true);
    setPreviewNoteContent('');
    try {
      const res = await fetch(`${API_URL}/notes/${note.id}/content`);
      if (res.ok) {
        const d = await res.json();
        setPreviewNoteContent(d.content || 'No text extracted from this note.');
      }
    } catch {
      setPreviewNoteContent('Error loading note content.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDeleteNote = async (noteId, noteTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${noteTitle || 'this lecture note'}"?\n\nThis will remove it from all student AI Study Companions.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/notes/${noteId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        if (previewNote && previewNote.id === noteId) {
          setPreviewNote(null);
        }
        fetchNotes();
        fetchStats();
      } else {
        alert(data.detail || 'Failed to delete note.');
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Network error while deleting note.');
    }
  };

  const filteredUsers = usersList.filter(u => {
    const q = userSearch.toLowerCase();
    const matchSearch =
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.matrix_no || '').toLowerCase().includes(q);
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  const filteredTickets = ticketsList.filter(t => {
    if (ticketFilter === 'all') return true;
    return t.status === ticketFilter;
  });

  if (!adminUser) return null;

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="app-sidebar" style={{ width: '280px' }}>
        <div className="sidebar-header">
          <div className="app-brand">
            <span className="brand-icon">🛡️</span>
            <div>
              <span className="brand-title">AI-LMS Admin</span>
              <span className="brand-subtitle">System Control Center</span>
            </div>
          </div>
        </div>

        <div className="sidebar-content">
          <div className="user-profile-badge" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <div className="user-avatar" style={{ background: '#ef4444' }}>AD</div>
            <div className="user-info">
              <span className="user-name">{adminUser.full_name}</span>
              <span className="user-role" style={{ color: '#f87171' }}>Administrator</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">Management Menu</div>
            <button
              className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span>📊</span>
              <span>Overview & Health</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span>👥</span>
              <span>Users ({usersList.length})</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'tickets' ? 'active' : ''}`}
              onClick={() => setActiveTab('tickets')}
            >
              <span>🛠️</span>
              <span>
                Support Tickets
                {stats?.open_tickets > 0 && (
                  <span style={{ marginLeft: '6px', background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '999px', fontWeight: 800 }}>
                    {stats.open_tickets}
                  </span>
                )}
              </span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              <span>📚</span>
              <span>Course Notes ({notesList.length})</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <span>⚙️</span>
              <span>System Settings</span>
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

      {/* MAIN CONTENT */}
      <div className="app-main">
        {/* Top Navbar */}
        <header className="app-navbar">
          <div className="navbar-left">
            <div className="navbar-title">
              <h1>
                {activeTab === 'overview' && 'System Health & Overview'}
                {activeTab === 'users' && 'User Account Management'}
                {activeTab === 'tickets' && 'Technical Support Helpdesk'}
                {activeTab === 'notes' && 'Course Materials Oversight'}
                {activeTab === 'settings' && 'Platform Configuration & Security'}
              </h1>
              <p>Politeknik Kuching Sarawak AI Learning Management System Administration</p>
            </div>
          </div>
          <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                fetchStats();
                fetchUsers();
                fetchTickets();
                fetchNotes();
                fetchSettings();
              }}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              🔄 Refresh Data
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* KPI STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
              <div className="card" style={{ padding: '18px', borderLeft: '4px solid #38bdf8' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Registered Students</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                  {stats ? stats.total_students : '...'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  With student Matrix Numbers
                </div>
              </div>

              <div className="card" style={{ padding: '18px', borderLeft: '4px solid #a855f7' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Course Lecturers</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a855f7', marginTop: '4px' }}>
                  {stats ? stats.total_lecturers : '...'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Faculty Staff Accounts
                </div>
              </div>

              <div className="card" style={{ padding: '18px', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Lecture Notes & Files</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                  {stats ? stats.total_notes : '...'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {stats ? `${stats.total_storage_mb} MB stored on DB` : '...'}
                </div>
              </div>

              <div className="card" style={{ padding: '18px', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Assignments & Homework</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                  {stats ? `${stats.total_submissions} / ${stats.total_assignments}` : '...'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Submissions across all courses
                </div>
              </div>

              <div className="card" style={{ padding: '18px', borderLeft: '4px solid #ef4444' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Support Tickets</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: stats?.open_tickets > 0 ? '#ef4444' : '#10b981', marginTop: '4px' }}>
                  {stats ? `${stats.open_tickets} Open` : '...'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {stats ? `${stats.resolved_tickets} Resolved` : '...'}
                </div>
              </div>
            </div>

            {/* Quick Actions & System Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚡ System Health & Connection
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <span>API Server Status:</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>● Online & Active</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <span>Database Engine:</span>
                    <span style={{ fontWeight: 600 }}>PostgreSQL (Railway Persistent)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <span>AI Engine Status:</span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>Semantic Chapter & Detail Indexer Active</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <span>Lecturer Passcode:</span>
                    <span style={{ fontFamily: 'monospace', color: '#f59e0b', fontWeight: 700 }}>{staffPasscode || 'STAFF2026'}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🚨 Recent Support Inquiries ({ticketsList.slice(0, 3).length})
                </h3>
                {ticketsList.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No open technical support tickets.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ticketsList.slice(0, 3).map(t => (
                      <div
                        key={t.id}
                        onClick={() => setActiveTab('tickets')}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: t.status === 'open' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${t.status === 'open' ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{t.subject}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            by {t.reporter_name} ({t.user_role}) • {t.category}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: t.status === 'open' ? '#ef4444' : '#10b981',
                          color: '#fff'
                        }}>
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                    <button onClick={() => setActiveTab('tickets')} className="btn-secondary" style={{ marginTop: '8px', padding: '6px' }}>
                      View All Tickets ➔
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>👥 User Account Administration</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Manage registered student and lecturer accounts, reset passwords, or activate/deactivate access.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search name, email, matrix..."
                  className="form-input"
                  style={{ width: '220px', padding: '6px 12px', fontSize: '0.85rem' }}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="lecturer">Lecturers</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
            </div>

            {loadingUsers ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading users list...</p>
            ) : filteredUsers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No users found matching the search criteria.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 8px' }}>Name</th>
                      <th style={{ padding: '10px 8px' }}>Role</th>
                      <th style={{ padding: '10px 8px' }}>Matrix No / ID</th>
                      <th style={{ padding: '10px 8px' }}>Email</th>
                      <th style={{ padding: '10px 8px' }}>Registered</th>
                      <th style={{ padding: '10px 8px' }}>Status</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{u.full_name || u.username}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : u.role === 'lecturer' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                            color: u.role === 'admin' ? '#f87171' : u.role === 'lecturer' ? '#c084fc' : '#38bdf8'
                          }}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                          {u.matrix_no || '—'}
                        </td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{u.email}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: u.is_active !== false ? '#10b981' : '#ef4444'
                          }}>
                            {u.is_active !== false ? '● Active' : '○ Deactivated'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setResetPwUserId(u.id);
                                setNewPassword('');
                                setResetFeedback({ type: '', text: '' });
                              }}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Reset this user's password"
                            >
                              🔑 Reset PW
                            </button>
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleToggleUserStatus(u.id, u.is_active !== false)}
                                disabled={statusActionId === u.id}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.75rem',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  background: u.is_active !== false ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  color: u.is_active !== false ? '#f87171' : '#34d399'
                                }}
                              >
                                {u.is_active !== false ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Reset Password Modal */}
            {resetPwUserId && (
              <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999,
                padding: '16px'
              }}>
                <div className="card" style={{ maxWidth: '420px', width: '100%', margin: 0, padding: '24px' }}>
                  <h3 style={{ marginBottom: '8px' }}>🔑 Reset User Password</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
                    Enter a new password for user ID #{resetPwUserId} (minimum 8 characters).
                  </p>

                  {resetFeedback.text && (
                    <div className={resetFeedback.type === 'success' ? 'success-message' : 'error-message'} style={{ marginBottom: '12px' }}>
                      {resetFeedback.text}
                    </div>
                  )}

                  <form onSubmit={handleResetPassword}>
                    <input
                      type="password"
                      placeholder="Enter new secure password..."
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      style={{ marginBottom: '14px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setResetPwUserId(null)}
                        className="btn-secondary"
                        style={{ padding: '6px 14px' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: 'auto', padding: '6px 16px' }}
                      >
                        Save New Password
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>🛠️ Technical Support Tickets & Error Resolver</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Review issues submitted by students and lecturers, view screenshots, and send official resolution replies.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'open', 'resolved'].map(f => (
                  <button
                    key={f}
                    onClick={() => setTicketFilter(f)}
                    className="btn-secondary"
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      background: ticketFilter === f ? 'var(--primary)' : 'transparent',
                      color: ticketFilter === f ? '#fff' : 'var(--text-muted)'
                    }}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {loadingTickets ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading tickets...</p>
            ) : filteredTickets.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No support tickets found in this filter.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${t.status === 'open' ? 'rgba(239, 68, 68, 0.35)' : 'var(--border)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: t.priority === 'Urgent' ? '#ef4444' : '#f59e0b',
                            color: '#fff'
                          }}>
                            {t.priority || 'Normal'}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Category: <strong>{t.category}</strong>
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            • Reported by: <strong>{t.reporter_name}</strong> ({t.user_role}) {t.matrix_no && `[${t.matrix_no}]`}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.05rem', marginTop: '6px' }}>{t.subject}</h3>
                      </div>

                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: t.status === 'resolved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: t.status === 'resolved' ? '#34d399' : '#f87171'
                      }}>
                        STATUS: {t.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.15)', padding: '10px 12px', borderRadius: '8px' }}>
                      {t.description}
                    </div>

                    {/* Attached Screenshot */}
                    {t.image_data && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📷 Attached Screenshot:</span>
                        <img
                          src={t.image_data}
                          alt="Error screenshot"
                          onClick={() => setViewScreenshotUrl(t.image_data)}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border)' }}
                          title="Click to view full image"
                        />
                        <button
                          type="button"
                          onClick={() => setViewScreenshotUrl(t.image_data)}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          👁️ View Full Photo
                        </button>
                      </div>
                    )}

                    {/* Admin Response Section */}
                    {t.admin_response ? (
                      <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <strong style={{ color: '#10b981', fontSize: '0.84rem' }}>✓ Official Admin Resolution:</strong>
                        <p style={{ fontSize: '0.88rem', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{t.admin_response}</p>
                      </div>
                    ) : null}

                    {/* Feedback message for this ticket */}
                    {ticketFeedback[t.id]?.text && (
                      <div className={ticketFeedback[t.id].type === 'success' ? 'success-message' : 'error-message'} style={{ margin: 0 }}>
                        {ticketFeedback[t.id].text}
                      </div>
                    )}

                    {/* Reply Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      <textarea
                        rows={2}
                        placeholder={t.admin_response ? "Update or add to admin response..." : "Type technical resolution response for the student/lecturer..."}
                        className="form-input"
                        value={adminResponseText[t.id] !== undefined ? adminResponseText[t.id] : (t.admin_response || '')}
                        onChange={(e) => setAdminResponseText(prev => ({ ...prev, [t.id]: e.target.value }))}
                        style={{ fontSize: '0.85rem' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleResolveTicket(t.id, 'in_progress')}
                          disabled={resolvingTicketId === t.id}
                          className="btn-secondary"
                          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                        >
                          ⏳ Mark In Progress
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveTicket(t.id, 'resolved')}
                          disabled={resolvingTicketId === t.id}
                          className="btn-primary"
                          style={{ width: 'auto', padding: '5px 16px', fontSize: '0.78rem', background: '#10b981' }}
                        >
                          ✓ Save & Mark Resolved
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COURSE NOTES AUDIT */}
        {activeTab === 'notes' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>📚 Course Materials & Lecture Notes Oversight</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Audit all uploaded lecture notes across all lecturers. Preview content or verify download links.
                </p>
              </div>
            </div>

            {loadingNotes ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading course notes...</p>
            ) : notesList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No lecture notes uploaded yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 8px' }}>Course Code</th>
                      <th style={{ padding: '10px 8px' }}>Title</th>
                      <th style={{ padding: '10px 8px' }}>Uploaded By</th>
                      <th style={{ padding: '10px 8px' }}>File Name</th>
                      <th style={{ padding: '10px 8px' }}>Size</th>
                      <th style={{ padding: '10px 8px' }}>Uploaded At</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notesList.map((n) => (
                      <tr key={n.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: '#38bdf8' }}>{n.subject_code}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{n.title}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                          {n.lecturer_name || 'Lecturer'}
                        </td>
                        <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '0.8rem' }}>{n.file_name}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{n.file_size_kb || 0} KB</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {n.uploaded_at ? new Date(n.uploaded_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenPreviewNote(n)}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              👁️ Preview
                            </button>
                            <a
                              href={`${API_URL}/notes/${n.id}/download`}
                              download={n.file_name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                            >
                              ⬇️ Download
                            </a>
                            <button
                              onClick={() => handleDeleteNote(n.id, n.title)}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                              title="Delete note permanently"
                            >
                              🗑️ Delete
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

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ maxWidth: '640px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>🔑 Lecturer Staff Secret Passcode</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Lecturers must enter this passcode during registration to confirm their faculty staff status. Students cannot register as lecturers without it.
              </p>

              {settingFeedback.text && (
                <div className={settingFeedback.type === 'success' ? 'success-message' : 'error-message'} style={{ marginBottom: '14px' }}>
                  {settingFeedback.text}
                </div>
              )}

              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label">Current Lecturer Secret Key</label>
                  <input
                    type="text"
                    value={staffPasscode}
                    onChange={(e) => setStaffPasscode(e.target.value)}
                    className="form-input"
                    required
                    style={{ fontFamily: 'monospace', letterSpacing: '1px', fontWeight: 700 }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingSetting}
                  className="btn-primary"
                  style={{ width: 'auto', alignSelf: 'flex-start', padding: '8px 20px' }}
                >
                  {savingSetting ? 'Saving...' : 'Save New Passcode'}
                </button>
              </form>
            </div>

            <div className="card" style={{ maxWidth: '640px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>🛡️ Admin Account Information</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <strong>Username:</strong> {adminUser.username}<br />
                <strong>Email:</strong> {adminUser.email}<br />
                <strong>Role:</strong> {adminUser.role.toUpperCase()}<br />
                <strong>Platform:</strong> Politeknik Kuching Sarawak LMS Final Year Project
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: PREVIEW NOTE */}
      {previewNote && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '850px', width: '100%', height: '80vh', display: 'flex', flexDirection: 'column', margin: 0, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>👁️ Note Preview: {previewNote.subject_code} — {previewNote.title}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{previewNote.file_name}</span>
              </div>
              <button
                onClick={() => setPreviewNote(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <div style={{ flexGrow: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {loadingPreview ? 'Extracting note text...' : previewNoteContent}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => handleDeleteNote(previewNote.id, previewNote.title)}
                className="btn-secondary"
                style={{
                  width: 'auto',
                  padding: '6px 16px',
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Permanently remove this note from system"
              >
                🗑️ Delete Note
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={`${API_URL}/notes/${previewNote.id}/download`}
                  download={previewNote.file_name}
                  className="btn-primary"
                  style={{ width: 'auto', padding: '6px 16px', textDecoration: 'none' }}
                >
                  ⬇️ Download Original File
                </a>
                <button onClick={() => setPreviewNote(null)} className="btn-secondary" style={{ padding: '6px 16px' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ZOOM SCREENSHOT */}
      {viewScreenshotUrl && (
        <div
          onClick={() => setViewScreenshotUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '20px',
            cursor: 'zoom-out'
          }}
        >
          <img
            src={viewScreenshotUrl}
            alt="Zoomed screenshot"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.2)' }}
          />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
