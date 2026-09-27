import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import StudentDashboard from './pages/StudentDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ServerDownPage from './pages/ServerDownPage';
import ErrorBoundary from './components/ErrorBoundary';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [serverOnline, setServerOnline] = useState(true);
  const [checked, setChecked] = useState(false);

  const checkServer = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/`, { signal: AbortSignal.timeout(5000) });
      setServerOnline(res.ok);
    } catch {
      setServerOnline(false);
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    checkServer();
    // Re-check every 15 seconds while page is open
    const interval = setInterval(checkServer, 15000);
    return () => clearInterval(interval);
  }, [checkServer]);

  // Show a dark loading screen until initial connectivity check completes (prevent blank white flash)
  if (!checked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <img
            src="/logo.png"
            alt="AI-LMS Logo"
            style={{ width: '68px', height: '68px', borderRadius: '50%', boxShadow: '0 4px 20px rgba(37, 99, 235, 0.35)' }}
          />
          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc' }}>Loading AI-LMS Portal...</div>
        </div>
      </div>
    );
  }

  // Show maintenance page when backend is unreachable
  if (!serverOnline) {
    return <ServerDownPage onRetry={checkServer} />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/lecturer" element={<LecturerDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
