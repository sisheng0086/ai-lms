import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:8000";

const VerifyEmailPage = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const email = location.state?.email || '';

  const handleChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus next
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    if (!email) {
      setError('Email not found. Please register again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSuccess('Email verified successfully! Redirecting to login...');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError(data.message || 'Verification failed. Invalid code.');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Verify Email</h2>
        <p className="auth-subtitle">
          A 6-digit code has been sent to your email <strong>{email}</strong>
        </p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleVerify}>
          <div className="otp-container">
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                className="otp-input"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={(el) => (inputRefs.current[index] = el)}
              />
            ))}
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading || success}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
