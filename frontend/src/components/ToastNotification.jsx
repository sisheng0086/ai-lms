import React, { useEffect } from 'react';

/**
 * ToastNotification Component
 * Provides clean in-app notifications replacing native browser window.alert()
 */
const ToastNotification = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';

  const borderColor = isSuccess ? '#10b981' : isError ? '#ef4444' : isWarning ? '#f59e0b' : '#3b82f6';
  const icon = isSuccess ? '✅' : isError ? '❌' : isWarning ? '⚠️' : 'ℹ️';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 100001,
        maxWidth: '420px',
        minWidth: '280px',
        background: 'var(--card-bg, #1a2234)',
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px ${borderColor}33`,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        animation: 'slideUp 0.3s ease-out'
      }}
      role="alert"
    >
      <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        {toast.title && (
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main, #ffffff)' }}>
            {toast.title}
          </h4>
        )}
        <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted, #cbd5e1)', lineHeight: '1.4' }}>
          {toast.message || toast.text}
        </p>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted, #94a3b8)',
          cursor: 'pointer',
          fontSize: '1.1rem',
          padding: '2px 4px',
          lineHeight: 1
        }}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};

export default ToastNotification;
