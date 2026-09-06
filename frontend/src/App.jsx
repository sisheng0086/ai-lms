import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import StudentDashboard from './pages/StudentDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import ServerDownPage from './pages/ServerDownPage';

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

  // Show nothing until first check completes
  if (!checked) return null;

  // Show maintenance page when backend is unreachable
  if (!serverOnline) {
    return <ServerDownPage onRetry={checkServer} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/lecturer" element={<LecturerDashboard />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
