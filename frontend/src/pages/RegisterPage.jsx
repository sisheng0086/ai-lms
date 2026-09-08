import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { EyeOpenIcon, EyeClosedIcon } from '../components/EyeIcon';

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

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const isEmailValid = emailRegex.test(formData.email.trim());

  // Password criteria (matching GeeksforGeeks reference)
  const hasLowercase = /[a-z]/.test(formData.password);
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasLength = formData.password.length >= 8 && formData.password.length <= 10;

  const criteriaPassed = [hasLowercase, hasUppercase, hasNumber, hasLength].filter(Boolean).length;

  // Password Level Calculation
  let levelInfo = {
    level: 0,
    text: 'Enter Password',
    color: 'var(--text-muted)',
    bg: 'transparent'
  };

  if (formData.password.length > 0) {
    if (criteriaPassed === 1) {
      levelInfo = { level: 1, text: 'Level 1 - Weak', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
    } else if (criteriaPassed === 2) {
      levelInfo = { level: 2, text: 'Level 2 - Fair', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' };
    } else if (criteriaPassed === 3) {
      levelInfo = { level: 3, text: 'Level 3 - Good', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' };
    } else if (criteriaPassed === 4) {
      levelInfo = { level: 4, text: 'Level 4 - Strong', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    } else {
      levelInfo = { level: 0, text: 'Very Weak', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
    }
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

    if (criteriaPassed < 4) {
      setError('Please satisfy all password requirements (Level 4 - Strong required).');
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
                    ? criteriaPassed === 4
                      ? 'input-success'
                      : 'input-error'
                    : ''
                }`}
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                placeholder="Create a password (8 - 10 characters)"
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

            {/* PASSWORD MUST CONTAIN (GeeksforGeeks style) */}
            <div className="gfg-criteria-box">
              <div className="gfg-criteria-heading">Password Must Contain:</div>
              <ul className="gfg-criteria-list">
                <li className={`gfg-criteria-item ${hasLowercase ? 'valid' : 'invalid'}`}>
                  <span className="gfg-icon">{hasLowercase ? '✔' : '✖'}</span>
                  <span>At least <strong>one lowercase letter</strong></span>
                </li>
                <li className={`gfg-criteria-item ${hasUppercase ? 'valid' : 'invalid'}`}>
                  <span className="gfg-icon">{hasUppercase ? '✔' : '✖'}</span>
                  <span>At least <strong>one uppercase letter</strong></span>
                </li>
                <li className={`gfg-criteria-item ${hasNumber ? 'valid' : 'invalid'}`}>
                  <span className="gfg-icon">{hasNumber ? '✔' : '✖'}</span>
                  <span>At least <strong>one number</strong></span>
                </li>
                <li className={`gfg-criteria-item ${hasLength ? 'valid' : 'invalid'}`}>
                  <span className="gfg-icon">{hasLength ? '✔' : '✖'}</span>
                  <span><strong>8 - 10 characters</strong></span>
                </li>
              </ul>

              {/* Password Level */}
              <div className="password-level-card">
                <div className="password-level-header">
                  <span className="password-level-title">Password Level</span>
                  <span
                    className="password-level-badge"
                    style={{ color: levelInfo.color, background: levelInfo.bg }}
                  >
                    {levelInfo.text}
                  </span>
                </div>
                <div className="level-segments">
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      className="level-segment"
                      style={{
                        backgroundColor:
                          seg <= levelInfo.level ? levelInfo.color : undefined
                      }}
                    />
                  ))}
                </div>
              </div>
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
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeClosedIcon size={20} /> : <EyeOpenIcon size={20} />}
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
            disabled={loading || (formData.email && !isEmailValid) || (formData.password && criteriaPassed < 4)}
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
