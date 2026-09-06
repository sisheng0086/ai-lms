import React, { useEffect, useState } from 'react';

const ThemeToggle = () => {
  // Read initial theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // Apply theme to the document element (so CSS variables switch)
    document.documentElement.setAttribute('data-theme', theme);
    // Save preference to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button onClick={toggleTheme} className="theme-toggle-btn">
      {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </button>
  );
};

export default ThemeToggle;
