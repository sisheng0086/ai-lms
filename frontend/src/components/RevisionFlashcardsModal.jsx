import React, { useState, useEffect } from 'react';

const DEFAULT_FLASHCARDS = [
  {
    id: 1,
    topic: 'Chapter 1: Pengenalan Etika',
    front: 'What is the main role of a Syahbandar in the Malacca Sultanate?',
    back: 'The Syahbandar was the Port Master responsible for maritime trade operations, customs duty collection, managing warehouse storage, and resolving disputes among foreign merchants.'
  },
  {
    id: 2,
    topic: 'Chapter 1: Kepelbagaian Bahasa',
    front: 'How many spoken languages were recorded in Malacca during its golden era?',
    back: 'According to Tome Pires (Suma Oriental), 84 spoken languages and dialects were actively spoken by global merchants in the port of Malacca.'
  },
  {
    id: 3,
    topic: 'Chapter 1: Perundangan',
    front: 'What are the two foundational legal codes of the Malacca Sultanate?',
    back: '1. Hukum Kanun Melaka (44 clauses covering civil, constitutional, and criminal law)\n2. Undang-Undang Laut Melaka (maritime regulations, ship safety, and maritime trade ethics).'
  },
  {
    id: 4,
    topic: 'Chapter 1: Komuniti Peranakan',
    front: 'Who are the Peranakan (Baba & Nyonya) communities in Malaysia?',
    back: 'Descendants of early Chinese traders who married local Malay women, creating a unique hybrid culture combining Chinese customs with Malay language, cuisine, and traditional attire (kebaya).'
  },
  {
    id: 5,
    topic: 'Chapter 1: Angin Monsun',
    front: 'How did the Monsoon Wind calendar govern trade in Malacca?',
    back: 'Merchants from India and the West arrived via the Southwest Monsoon (May-August), while ships from China and Japan sailed on the Northeast Monsoon (November-March).'
  },
  {
    id: 6,
    topic: 'Chapter 1: Garis Masa Melaka',
    front: 'What are the key timeline milestones of the Malacca Sultanate?',
    back: '• 1400: Parameswara founds Malacca\n• 1405: Admiral Zheng He begins diplomatic missions\n• 1456–1477: Peak golden age under Sultan Mansur Shah\n• 1511: Portuguese conquest led by Afonso de Albuquerque.'
  },
  {
    id: 7,
    topic: 'Chapter 1: Etika & Peradaban',
    front: 'What are the 3 key pillars of civilized trade ethics in Malacca?',
    back: '1. Fair weights and measures (Amanah dalam timbangan)\n2. Protection of foreign merchant property and cargo\n3. Consistent customs tax rates without arbitrary extortion.'
  },
  {
    id: 8,
    topic: 'Chapter 1: Hubungan Diplomatik',
    front: 'Why was the diplomatic relationship with Ming Dynasty China vital for Malacca?',
    back: 'It provided royal recognition and military protection from Siamese (Ayutthaya) aggression, enabling Malacca to safely grow into Southeast Asia\'s preeminent trading entrepôt.'
  }
];

const RevisionFlashcardsModal = ({
  isOpen,
  onClose,
  subjectCode = 'MPU21032',
  noteTitle = 'Penghayatan Etika dan Peradaban',
  customCards = null
}) => {
  const cards = (customCards && customCards.length > 0) ? customCards : DEFAULT_FLASHCARDS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState([]);
  const [needsReviewIds, setNeedsReviewIds] = useState([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, cards.length]);

  if (!isOpen) return null;

  const currentCard = cards[currentIndex] || cards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + cards.length) % cards.length);
  };

  const handleMarkMastered = () => {
    if (!masteredIds.includes(currentCard.id)) {
      setMasteredIds(prev => [...prev, currentCard.id]);
      setNeedsReviewIds(prev => prev.filter(id => id !== currentCard.id));
    }
    handleNext();
  };

  const handleMarkReview = () => {
    if (!needsReviewIds.includes(currentCard.id)) {
      setNeedsReviewIds(prev => [...prev, currentCard.id]);
      setMasteredIds(prev => prev.filter(id => id !== currentCard.id));
    }
    handleNext();
  };

  const handleReset = () => {
    setMasteredIds([]);
    setNeedsReviewIds([]);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handlePrintFlashcards = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = cards.map((c, i) => `
      <div style="border: 2px dashed #94a3b8; border-radius: 12px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; font-family: system-ui, sans-serif;">
        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">CARD ${i + 1} • ${c.topic}</div>
        <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 10px 0 8px;">Q: ${c.front}</div>
        <div style="font-size: 14px; color: #334155; line-height: 1.5; white-space: pre-wrap; background: #f8fafc; padding: 10px; border-radius: 8px;"><strong>Answer:</strong> ${c.back}</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI-LMS Revision Flashcards - ${subjectCode}</title>
          <style>
            @page { margin: 15mm; size: A4; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0; font-size: 20px;">POLITEKNIK KUCHING SARAWAK — AI-LMS STUDY COMPANION</h2>
            <h3 style="margin: 6px 0 0; color: #2563eb;">${subjectCode}: ${noteTitle}</h3>
            <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Official Exam Revision Flashcard Sheet • Printed: ${new Date().toLocaleDateString()}</p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
            ${cardsHtml}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const masteryPercent = Math.round((masteredIds.length / cards.length) * 100);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--card-bg, #1e293b)',
        border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
        borderRadius: '20px',
        maxWidth: '680px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
          background: 'rgba(0, 0, 0, 0.15)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.3rem' }}>📇</span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #f8fafc)' }}>
                AI Revision Flashcards
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
              {subjectCode} • {noteTitle}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrintFlashcards}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Print or Save as PDF Flashcard Sheet"
            >
              <span>🖨️</span>
              <span>Print Sheet</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.3rem',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '4px 8px'
              }}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress Tracker */}
        <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Card <strong style={{ color: '#38bdf8' }}>{currentIndex + 1}</strong> of {cards.length}
          </div>
          <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${masteryPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #10b981)',
              borderRadius: '999px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>
            {masteryPercent}% Mastered
          </div>
        </div>

        {/* Interactive Flip Card */}
        <div style={{ padding: '20px 24px' }}>
          <div
            onClick={() => setIsFlipped(prev => !prev)}
            style={{
              minHeight: '260px',
              background: isFlipped
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(30, 41, 59, 0.9))'
                : 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(30, 41, 59, 0.9))',
              border: isFlipped
                ? '2px solid rgba(16, 185, 129, 0.4)'
                : '2px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '16px',
              padding: '24px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: isFlipped ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                color: isFlipped ? '#34d399' : '#38bdf8',
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                {isFlipped ? '💡 ANSWER / EXPLANATION' : '❓ QUESTION / CONCEPT'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Click to flip card (Spacebar)
              </span>
            </div>

            <div style={{ margin: '20px 0', textAlign: 'center' }}>
              <div style={{
                fontSize: isFlipped ? '1.05rem' : '1.25rem',
                fontWeight: isFlipped ? 500 : 700,
                color: 'var(--text-main, #f8fafc)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {isFlipped ? currentCard.back : currentCard.front}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <span>Topic: {currentCard.topic}</span>
              <span>🔄 Tap card to {isFlipped ? 'view Question' : 'reveal Answer'}</span>
            </div>
          </div>

          {/* Mastery Quick Feedback Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleMarkReview}
              style={{
                flex: 1,
                background: needsReviewIds.includes(currentCard.id) ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                padding: '10px 16px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>❌</span>
              <span>Needs More Review</span>
            </button>

            <button
              type="button"
              onClick={handleMarkMastered}
              style={{
                flex: 1,
                background: masteredIds.includes(currentCard.id) ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                padding: '10px 16px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>✅</span>
              <span>I Know This!</span>
            </button>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
          background: 'rgba(0, 0, 0, 0.15)'
        }}>
          <button
            type="button"
            onClick={handlePrev}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            ← Previous
          </button>

          <button
            type="button"
            onClick={handleReset}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            🔄 Reset Deck
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.85rem', width: 'auto', margin: 0 }}
          >
            Next Card →
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevisionFlashcardsModal;
