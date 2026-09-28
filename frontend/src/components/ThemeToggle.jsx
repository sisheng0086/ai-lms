import React, { useEffect, useState, useRef } from 'react';

const ThemeToggle = () => {
  // Read initial theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Apply theme to document element
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle clicking outside to close the dropdown menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const selectTheme = (newTheme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  const toggleTheme = (e) => {
    e.stopPropagation();
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="theme-toggle-container" ref={containerRef}>
      {/* Three Horizontal Bars (--- / Hamburger icon matching media screenshot) */}
      <button
        type="button"
        className={`theme-hamburger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`Theme Settings (Current: ${theme === 'dark' ? 'Dark Mode' : 'Light Mode'})`}
        aria-label="Theme settings menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <svg
          className="hamburger-bars-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Exact three rounded pill bars matching user screenshot */}
          <rect x="3" y="5" width="18" height="2.8" rx="1.4" />
          <rect x="3" y="10.6" width="18" height="2.8" rx="1.4" />
          <rect x="3" y="16.2" width="18" height="2.8" rx="1.4" />
        </svg>
        <span className="theme-current-badge">
          {theme === 'dark' ? '🌙' : '☀️'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="theme-menu-dropdown">
          <div className="theme-menu-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🎨</span>
              <span>Theme Mode</span>
            </span>
            <span className="theme-status-tag">
              {theme === 'dark' ? 'DARK' : 'LIGHT'}
            </span>
          </div>

          <div className="theme-options-list">
            <button
              type="button"
              className={`theme-menu-item ${theme === 'light' ? 'selected' : ''}`}
              onClick={() => selectTheme('light')}
            >
              <span className="theme-item-icon">☀️</span>
              <span className="theme-item-label">Light Mode</span>
              {theme === 'light' && <span className="theme-checkmark">✓</span>}
            </button>

            <button
              type="button"
              className={`theme-menu-item ${theme === 'dark' ? 'selected' : ''}`}
              onClick={() => selectTheme('dark')}
            >
              <span className="theme-item-icon">🌙</span>
              <span className="theme-item-label">Dark Mode</span>
              {theme === 'dark' && <span className="theme-checkmark">✓</span>}
            </button>
          </div>

          {/* Quick Toggle Switch Row */}
          <div className="theme-quick-toggle" onClick={toggleTheme} title="Click to quick toggle mode">
            <span className="quick-toggle-text">Quick Switch</span>
            <div className={`theme-toggle-switch ${theme === 'dark' ? 'is-dark' : 'is-light'}`}>
              <span className="toggle-switch-handle">
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
