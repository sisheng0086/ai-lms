import React from 'react';

/**
 * Universal Error Boundary to prevent blank white screens
 * and provide instant recovery buttons if any component fails.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AI-LMS Caught UI Exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-main, #0f172a)',
            color: 'var(--text-main, #f8fafc)',
            padding: '24px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: 'rgba(30, 41, 59, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: '#ef4444' }}>
              Interface Recovered
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.5 }}>
              A UI rendering error was caught. Your session and data are safe. Please reload or navigate back to continue.
            </p>
            {this.state.error?.message && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  color: '#fca5a5',
                  marginBottom: '24px',
                  textAlign: 'left',
                  maxHeight: '100px',
                  overflowY: 'auto'
                }}
              >
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                🔄 Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                🏠 Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
