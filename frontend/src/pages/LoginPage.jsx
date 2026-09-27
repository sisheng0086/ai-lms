import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { EyeOpenIcon, EyeClosedIcon } from '../components/EyeIcon';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect based on role
        if (data.user.role === 'student') {
          navigate('/student');
        } else if (data.user.role === 'lecturer') {
          navigate('/lecturer');
        } else if (data.user.role === 'admin') {
          navigate('/admin');
        }
      } else {
        setError(data.detail || data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <ThemeToggle />
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <img
            src="/logo.png"
            alt="AI-LMS Logo"
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              display: 'inline-block',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.28)'
            }}
          />
        </div>
        <h2 className="auth-title" style={{ letterSpacing: '-0.02em', fontSize: '1.75rem' }}>AI-LMS</h2>
        <p className="auth-subtitle">Intelligent Learning Management System</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeClosedIcon size={20} /> : <EyeOpenIcon size={20} />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
        
        <Link to="/register" className="auth-link">
          Don't have an account? Register here
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
