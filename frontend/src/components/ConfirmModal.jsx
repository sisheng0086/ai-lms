import React, { useEffect } from 'react';

/**
 * Custom Confirmation Modal
 * Replaces native window.confirm() with a themed, dedicated confirmation dialog.
 */
const ConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Yes, Confirm',
  cancelText = 'Cancel',
  confirmColor = '#ef4444',
  icon = '🗑️',
  onConfirm,
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--card-bg, #182234)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '460px',
          padding: '26px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(239, 68, 68, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Close 'X' Button in Top Right */}
        <button
          onClick={onClose}
          type="button"
          style={{
            position: 'absolute',
            top: '14px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            fontSize: '1.25rem',
            color: 'var(--text-muted, #94a3b8)',
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1
          }}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Icon Circle */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            marginBottom: '16px'
          }}
        >
          {icon}
        </div>

        {/* Title */}
        <h3
          style={{
            margin: '0 0 10px 0',
            fontSize: '1.28rem',
            fontWeight: 700,
            color: 'var(--text-main, #ffffff)'
          }}
        >
          {title}
        </h3>

        {/* Message */}
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '0.92rem',
            lineHeight: '1.55',
            color: 'var(--text-muted, #94a3b8)',
            whiteSpace: 'pre-line'
          }}
        >
          {message}
        </p>

        {/* Actions Button Bar */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            width: '100%',
            justifyContent: 'center'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.2))',
              background: 'transparent',
              color: 'var(--text-main, #ffffff)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            style={{
              flex: 1,
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: confirmColor || '#ef4444',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseOut={(e) => (e.currentTarget.style.filter = 'none')}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
