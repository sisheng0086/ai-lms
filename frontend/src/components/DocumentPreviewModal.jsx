import React, { useState, useEffect } from 'react';

/**
 * DocumentPreviewModal Component
 * Renders full inline PDF files, images (.png, .jpg, .jpeg, .webp, .gif),
 * and provides a tab to inspect the raw AI extracted text.
 */
const DocumentPreviewModal = ({
  isOpen,
  note,
  extractedText = '',
  loadingText = false,
  onClose,
  onDelete = null,
  apiUrl = '',
  canDelete = false
}) => {
  const [activeTab, setActiveTab] = useState('doc'); // 'doc' | 'text'
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset tab on opening new note
  useEffect(() => {
    if (isOpen) {
      setActiveTab('doc');
      setCopied(false);
    }
  }, [isOpen, note?.id]);

  if (!isOpen || !note) return null;

  const resolvedApiUrl = apiUrl || (import.meta.env.VITE_API_URL || 'https://ai-lms-production.up.railway.app');
  const viewUrl = `${resolvedApiUrl}/notes/${note.id}/view`;
  const downloadUrl = `${resolvedApiUrl}/notes/${note.id}/download`;

  const fileName = (note.file_name || note.title || '').toLowerCase();
  const isPdf = fileName.endsWith('.pdf');
  const isImage = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.webp') || fileName.endsWith('.gif') || fileName.endsWith('.svg');

  const handleCopyText = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = extractedText ? extractedText.trim().split(/\s+/).length : 0;
  const charCount = extractedText ? extractedText.length : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--card-bg, #111827)',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1050px',
          height: '90vh',
          maxHeight: '920px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.3rem' }}>
                {isPdf ? '📄' : isImage ? '🖼️' : '📑'}
              </span>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-main, #ffffff)',
                  letterSpacing: '-0.01em'
                }}
              >
                {note.subject_code ? `${note.subject_code} - ` : ''}{note.title}
              </h3>
            </div>
            {note.file_name && (
              <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                File: {note.file_name} {note.file_size_kb ? `(${note.file_size_kb} KB)` : ''}
              </p>
            )}
          </div>

          {/* Tab Controls & Direct View Link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.1))'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('doc')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'doc' ? 'var(--primary, #ef4444)' : 'transparent',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                <span>{isPdf ? '📄 PDF Document' : isImage ? '🖼️ Image View' : '📄 Original File'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'text' ? 'var(--primary, #ef4444)' : 'transparent',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                <span>📝 AI Extracted Text</span>
              </button>
            </div>

            <a
              href={viewUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '6px 10px',
                fontSize: '0.82rem',
                color: '#38bdf8',
                textDecoration: 'none',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                background: 'rgba(56, 189, 248, 0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Open full document in a new browser tab"
            >
              ↗ Open in Tab
            </a>

            <button
              onClick={onClose}
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.3rem',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                lineHeight: 1
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0b1120' }}>
          {activeTab === 'doc' ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {isPdf ? (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <iframe
                    src={`${viewUrl}#view=FitH`}
                    title={`PDF Preview - ${note.title}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      backgroundColor: '#1e293b'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(4px)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      pointerEvents: 'none',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    📄 In-Browser PDF Viewer &middot; Use mouse wheel or browser controls to zoom and page
                  </div>
                </div>
              ) : isImage ? (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    overflow: 'auto',
                    background: 'radial-gradient(circle, #172554 0%, #0b1120 100%)'
                  }}
                >
                  <img
                    src={viewUrl}
                    alt={note.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  />
                </div>
              ) : (
                /* Non-PDF / Non-Image file (e.g. DOCX, PPTX, TXT) */
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '30px',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📑</span>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#ffffff' }}>
                    {note.file_name || 'Document File'}
                  </h4>
                  <p style={{ maxWidth: '480px', color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                    This document format is best viewed by downloading or reading the extracted AI text below.
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setActiveTab('text')}
                      className="btn-primary"
                      style={{ padding: '8px 20px', fontSize: '0.88rem' }}
                    >
                      📝 View AI Extracted Text
                    </button>
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ padding: '8px 20px', fontSize: '0.88rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      ⬇️ Download Original File
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* AI Extracted Text View */
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Text Info Bar */}
              <div
                style={{
                  padding: '8px 20px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: '#94a3b8'
                }}
              >
                <span>
                  📊 {wordCount} words &middot; {charCount} characters &middot; Content indexed for AI Companion
                </span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#e2e8f0',
                    padding: '3px 10px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.78rem'
                  }}
                >
                  {copied ? '✓ Copied' : '📋 Copy Text'}
                </button>
              </div>

              {/* Scrollable Text Area */}
              <div
                style={{
                  flex: 1,
                  padding: '24px',
                  overflowY: 'auto',
                  fontFamily: 'monospace, sans-serif',
                  fontSize: '0.88rem',
                  lineHeight: '1.65',
                  color: '#e2e8f0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: '#0d131f'
                }}
              >
                {loadingText ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    ⏳ Fetching extracted AI text...
                  </div>
                ) : extractedText ? (
                  extractedText
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    No extracted text available for this lecture note.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          {/* Delete Option for Lecturer / Admin */}
          <div>
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = '#f87171';
                }}
                title="If this note was uploaded with incorrect content, delete it from the course database"
              >
                🗑️ Delete Note (Confirm Incorrect)
              </button>
            )}
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary, #ef4444)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.84rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              ⬇️ Download Note
            </a>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.2))',
                background: 'transparent',
                color: 'var(--text-main, #ffffff)',
                fontWeight: 500,
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
