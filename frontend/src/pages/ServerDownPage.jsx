import React, { useState, useEffect } from 'react';

const ServerDownPage = ({ onRetry }) => {
  const [countdown, setCountdown] = useState(10);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleRetry();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    if (onRetry) await onRetry();
    setIsRetrying(false);
    setCountdown(10);
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgDots}></div>
      <div style={styles.card}>
        <div style={styles.gearContainer}>
          <svg viewBox="0 0 200 200" style={styles.gearSvg}>
            <g style={{ animation: 'spinCW 4s linear infinite', transformOrigin: '100px 100px' }}>
              <path d="M100 60 L108 40 L92 40 Z M100 140 L108 160 L92 160 Z M60 100 L40 108 L40 92 Z M140 100 L160 108 L160 92 Z M72.9 72.9 L58.6 58.6 L47.3 69.9 Z M127.1 127.1 L141.4 141.4 L152.7 130.1 Z M72.9 127.1 L58.6 141.4 L69.9 152.7 Z M127.1 72.9 L141.4 58.6 L130.1 47.3 Z" fill="#6366f1" />
              <circle cx="100" cy="100" r="30" fill="#6366f1" />
              <circle cx="100" cy="100" r="15" fill="#f1f5f9" />
            </g>
            <g style={{ animation: 'spinCCW 2s linear infinite', transformOrigin: '155px 50px' }}>
              <path d="M155 30 L159 20 L151 20 Z M155 70 L159 80 L151 80 Z M135 50 L125 54 L125 46 Z M175 50 L185 54 L185 46 Z M142.1 37.1 L133.5 28.5 L127.5 34.5 Z M167.9 62.9 L176.5 71.5 L182.5 65.5 Z M142.1 62.9 L133.5 71.5 L139.5 77.5 Z M167.9 37.1 L176.5 28.5 L170.5 22.5 Z" fill="#818cf8" />
              <circle cx="155" cy="50" r="16" fill="#818cf8" />
              <circle cx="155" cy="50" r="8" fill="#f1f5f9" />
            </g>
            <g style={{ animation: 'spinCCW 3s linear infinite', transformOrigin: '45px 150px' }}>
              <path d="M45 130 L49 120 L41 120 Z M45 170 L49 180 L41 180 Z M25 150 L15 154 L15 146 Z M65 150 L75 154 L75 146 Z M32.1 137.1 L23.5 128.5 L17.5 134.5 Z M57.9 162.9 L66.5 171.5 L72.5 165.5 Z M32.1 162.9 L23.5 171.5 L29.5 177.5 Z M57.9 137.1 L66.5 128.5 L60.5 122.5 Z" fill="#a5b4fc" />
              <circle cx="45" cy="150" r="16" fill="#a5b4fc" />
              <circle cx="45" cy="150" r="8" fill="#f1f5f9" />
            </g>
            <g style={{ animation: 'wiggle 2s ease-in-out infinite', transformOrigin: '90px 110px' }}>
              <rect x="85" y="85" width="10" height="50" rx="5" fill="#f59e0b" />
              <circle cx="90" cy="82" r="10" fill="none" stroke="#f59e0b" strokeWidth="5" />
              <rect x="83" y="130" width="14" height="8" rx="3" fill="#f59e0b" />
            </g>
          </svg>
          <style>{`
            @keyframes spinCW { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes spinCCW { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
            @keyframes wiggle { 0%, 100% { transform: rotate(-15deg); } 50% { transform: rotate(15deg); } }
            @keyframes progressBar { 0% { width: 100%; } 100% { width: 0%; } }
          `}</style>
        </div>
        <div>
          <div style={styles.badge}>🔧 System Maintenance</div>
          <h1 style={styles.title}>We are Under Maintenance</h1>
          <p style={styles.subtitle}>Our backend server is currently being serviced.<br />We will be back online shortly!</p>
          <div style={styles.countdownWrapper}>
            <div style={styles.countdownBar}>
              <div key={countdown} style={{ ...styles.countdownFill, animation: 'progressBar 10s linear' }} />
            </div>
            <p style={styles.countdownText}>{isRetrying ? 'Checking server...' : `Auto-retrying in ${countdown}s`}</p>
          </div>
          <button onClick={handleRetry} disabled={isRetrying} style={isRetrying ? { ...styles.button, opacity: 0.6, cursor: 'not-allowed' } : styles.button}>
            {isRetrying ? 'Retrying...' : 'Retry Now'}
          </button>
          <p style={styles.hint}>If this keeps happening, please contact your system administrator.</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', fontFamily: "'Segoe UI', sans-serif", padding: '20px', position: 'relative', overflow: 'hidden' },
  bgDots: { position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.15) 1px, transparent 1px)', backgroundSize: '30px 30px' },
  card: { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', position: 'relative', zIndex: 1 },
  gearContainer: { display: 'flex', justifyContent: 'center', marginBottom: '24px' },
  gearSvg: { width: '160px', height: '160px', filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.5))' },
  badge: { display: 'inline-block', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', padding: '6px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' },
  title: { color: '#f1f5f9', fontSize: '28px', fontWeight: '700', margin: '0 0 12px 0' },
  subtitle: { color: '#94a3b8', fontSize: '15px', lineHeight: '1.6', margin: '0 0 28px 0' },
  countdownWrapper: { marginBottom: '24px' },
  countdownBar: { background: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '6px', overflow: 'hidden', marginBottom: '10px' },
  countdownFill: { height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: '999px', width: '100%' },
  countdownText: { color: '#64748b', fontSize: '13px', margin: 0 },
  button: { background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px 32px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 15px rgba(99,102,241,0.4)', marginBottom: '20px' },
  hint: { color: '#475569', fontSize: '12px', margin: 0 },
};

export default ServerDownPage;
