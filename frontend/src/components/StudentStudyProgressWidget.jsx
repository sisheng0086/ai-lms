import React from 'react';

const StudentStudyProgressWidget = ({
  notesList = [],
  reviewedNotesCount = 8,
  quizzesCompletedCount = 5,
  quizAverageScore = 85,
  streakDays = 3,
  onOpenNotes,
  onOpenQuiz,
  onOpenFlashcards,
  onExportPdf
}) => {
  const totalNotes = notesList.length || 12;
  const safeReviewed = Math.min(reviewedNotesCount, totalNotes);
  const notesProgressPercent = Math.round((safeReviewed / totalNotes) * 100);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.35) 0%, rgba(15, 23, 42, 0.85) 100%)',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      borderRadius: '16px',
      padding: '20px 24px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '160px',
        height: '160px',
        background: 'rgba(56, 189, 248, 0.12)',
        borderRadius: '50%',
        filter: 'blur(40px)'
      }} />

      {/* Widget Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
          }}>
            🔥
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                Student Study Progress & Streaks
              </h2>
              <span style={{
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                letterSpacing: '0.04em'
              }}>
                FYP ENGAGEMENT METRICS
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Real-time learning analytics, retention tracking, and exam readiness
            </p>
          </div>
        </div>

        {/* Quick Study Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onOpenFlashcards && (
            <button
              type="button"
              onClick={onOpenFlashcards}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📇</span>
              <span>Flashcards</span>
            </button>
          )}

          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📄</span>
              <span>Export PDF Study Sheet</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        {/* Metric 1: Study Streak */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                Study Streak
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                🔥 {streakDays} Days Active
              </div>
            </div>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
          </div>
          <div style={{ fontSize: '0.73rem', color: '#cbd5e1', marginTop: '10px' }}>
            Daily consistency streak. Study today to reach <strong>Day {streakDays + 1}</strong>!
          </div>
        </div>

        {/* Metric 2: Notes Completed */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: onOpenNotes ? 'pointer' : 'default'
        }} onClick={onOpenNotes}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                Notes Completed
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>
                {notesProgressPercent}%
              </span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
              📚 {safeReviewed} / {totalNotes} Reviewed
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${notesProgressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                borderRadius: '999px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
              {totalNotes - safeReviewed > 0 ? `${totalNotes - safeReviewed} chapters left to review` : 'All chapters completed! 🎉'}
            </div>
          </div>
        </div>

        {/* Metric 3: Practice Quizzes */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: onOpenQuiz ? 'pointer' : 'default'
        }} onClick={onOpenQuiz}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                Practice Quizzes
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                📝 {quizzesCompletedCount} Quizzes Completed
              </div>
            </div>
            <span style={{ fontSize: '1.4rem' }}>🏆</span>
          </div>

          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
              Average Mastery: <strong style={{ color: '#34d399' }}>{quizAverageScore}%</strong>
            </div>
            <span style={{
              fontSize: '0.68rem',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              padding: '2px 6px',
              borderRadius: '6px',
              fontWeight: 700
            }}>
              EXAM READY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentStudyProgressWidget;
