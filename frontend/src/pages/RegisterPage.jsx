import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'student'
  });
  const [touched, setTouched] = useState({
    email: false,
    username: false,
    password: false,
    confirm_password: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Email format validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const isEmailValid = emailRegex.test(formData.email.trim());

  // Password criteria checklist
  const passwordCriteria = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=~/\\`[\];]/.test(formData.password)
  };

  const criteriaCount = Object.values(passwordCriteria).filter(Boolean).length;

  // Strength calculation
  let strengthLabel = 'Too Weak';
  let strengthColor = '#ef4444';
  let strengthPercent = (criteriaCount / 5) * 100;

  if (criteriaCount === 5) {
    strengthLabel = 'Strong';
    strengthColor = '#10b981';
  } else if (criteriaCount >= 3) {
    strengthLabel = 'Medium';
    strengthColor = '#f59e0b';
  } else if (formData.password.length > 0) {
    strengthLabel = 'Weak';
    strengthColor = '#ef4444';
  }

  // Password match validation
  const passwordsMatch =
    formData.confirm_password.length > 0 &&
    formData.password === formData.confirm_password;
  const passwordsMismatch =
    formData.confirm_password.length > 0 &&
    formData.password !== formData.confirm_password;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Mark all fields touched
    setTouched({
      email: true,
      username: true,
      password: true,
      confirm_password: true
    });

    if (!isEmailValid) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (criteriaCount < 4) {
      setError('Password does not meet the minimum security requirements.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        navigate('/verify-email', { state: { email: formData.email } });
      } else {
        setError(data.detail || data.message || 'Registration failed.');
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
        <h2 className="auth-title">Join LMS</h2>
        <p className="auth-subtitle">Create an account to get started</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleRegister} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="full_name"
              className="form-input"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. Daniel Wong"
              required
            />
          </div>

          {/* Username */}
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              className={`form-input ${formData.username.includes('@') ? 'input-error' : ''}`}
              value={formData.username}
              onChange={handleChange}
              onBlur={() => handleBlur('username')}
              placeholder="e.g. daniel_wong"
              required
            />
            {formData.username.includes('@') && (
              <div className="field-error-msg">
                ⚠️ Username should be a handle (e.g. daniel_wong), not an email address.
              </div>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className={`form-input ${
                touched.email && formData.email
                  ? isEmailValid
                    ? 'input-success'
                    : 'input-error'
                  : ''
              }`}
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              placeholder="name@example.com"
              required
            />
            {touched.email && formData.email && !isEmailValid && (
              <div className="field-error-msg">
                ❌ Please enter a valid email format (e.g. name@domain.com)
              </div>
            )}
            {touched.email && formData.email && isEmailValid && (
              <div className="field-success-msg">
                ✓ Valid email format
              </div>
            )}
          </div>

          {/* Role */}
          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
            </select>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className={`form-input ${
                  touched.password && formData.password
                    ? criteriaCount >= 4
                      ? 'input-success'
                      : 'input-error'
                    : ''
                }`}
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                placeholder="Create a strong password"
                required
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Password Strength Meter */}
            {formData.password.length > 0 && (
              <div className="strength-bar-container">
                <div className="strength-bar-track">
                  <div
                    className="strength-bar-fill"
                    style={{
                      width: `${strengthPercent}%`,
                      backgroundColor: strengthColor
                    }}
                  />
                </div>
                <div className="strength-label">
                  <span>Strength</span>
                  <span style={{ color: strengthColor, fontWeight: 600 }}>
                    {strengthLabel}
                  </span>
                </div>
              </div>
            )}

            {/* Password Criteria Checklist */}
            <div className="password-criteria-box">
              <div className="criteria-title">Password Must Include:</div>
              <ul className="criteria-list">
                <li className={`criteria-item ${passwordCriteria.length ? 'valid' : ''}`}>
                  <span className="criteria-icon">{passwordCriteria.length ? '✓' : '○'}</span>
                  <span>At least 8 characters</span>
                </li>
                <li className={`criteria-item ${passwordCriteria.uppercase ? 'valid' : ''}`}>
                  <span className="criteria-icon">{passwordCriteria.uppercase ? '✓' : '○'}</span>
                  <span>At least 1 uppercase letter (A-Z)</span>
                </li>
                <li className={`criteria-item ${passwordCriteria.lowercase ? 'valid' : ''}`}>
                  <span className="criteria-icon">{passwordCriteria.lowercase ? '✓' : '○'}</span>
                  <span>At least 1 lowercase letter (a-z)</span>
                </li>
                <li className={`criteria-item ${passwordCriteria.number ? 'valid' : ''}`}>
                  <span className="criteria-icon">{passwordCriteria.number ? '✓' : '○'}</span>
                  <span>At least 1 number (0-9)</span>
                </li>
                <li className={`criteria-item ${passwordCriteria.special ? 'valid' : ''}`}>
                  <span className="criteria-icon">{passwordCriteria.special ? '✓' : '○'}</span>
                  <span>At least 1 special character (!@#$%^&*)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm_password"
                className={`form-input ${
                  passwordsMatch
                    ? 'input-success'
                    : passwordsMismatch
                    ? 'input-error'
                    : ''
                }`}
                value={formData.confirm_password}
                onChange={handleChange}
                onBlur={() => handleBlur('confirm_password')}
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {passwordsMismatch && (
              <div className="field-error-msg">
                ❌ Passwords do not match
              </div>
            )}
            {passwordsMatch && (
              <div className="field-success-msg">
                ✓ Passwords match
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || (formData.email && !isEmailValid) || (formData.password && criteriaCount < 4)}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <Link to="/" className="auth-link">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
