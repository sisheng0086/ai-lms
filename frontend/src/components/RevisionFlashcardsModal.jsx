import React, { useState, useEffect } from 'react';

const NETSEC_FLASHCARDS = [
  {
    id: 1,
    topic: 'Firewalls & DMZ',
    front: 'What is the main difference between Stateless and Stateful firewalls?',
    back: 'Stateless packet filters check individual headers (IP/Port) against static ACLs without tracking connection states. Stateful firewalls maintain a State Table of active TCP/UDP sessions and only permit incoming traffic belonging to established outbound connections.'
  },
  {
    id: 2,
    topic: 'Perimeter Defense',
    front: 'What is a Demilitarized Zone (DMZ) and why is it used?',
    back: 'A DMZ is a dedicated perimeter subnet that hosts public-facing services (Web, Mail, DNS) separate from the internal private LAN. If a DMZ server is compromised, the internal LAN remains shielded behind internal firewall rules.'
  },
  {
    id: 3,
    topic: 'DoS & DDoS Defense',
    front: 'How does a TCP SYN Flood work, and how do SYN Cookies defend against it?',
    back: 'Attackers flood servers with spoofed SYN packets, filling the backlog connection queue. SYN Cookies defend by encoding session state cryptographically inside the Initial Sequence Number (ISN), allocating zero memory until the legitimate client\'s final ACK arrives.'
  },
  {
    id: 4,
    topic: 'IDS vs IPS',
    front: 'What is the structural difference between an IDS and an IPS?',
    back: 'An IDS (Intrusion Detection System) sits out-of-band via SPAN/mirror ports to passively monitor and alert. An IPS (Intrusion Prevention System) sits inline directly in traffic flow to actively drop malicious packets and reset suspicious connections.'
  },
  {
    id: 5,
    topic: 'IPsec Architecture',
    front: 'Compare the IPsec AH and ESP protocols.',
    back: 'AH (Authentication Header · IP 51) provides integrity, origin authentication, and anti-replay, but does NOT encrypt data. ESP (Encapsulating Security Payload · IP 50) provides confidentiality (encryption via AES), integrity, and authentication.'
  },
  {
    id: 6,
    topic: 'VPN Modes',
    front: 'What is the difference between IPsec Transport Mode and Tunnel Mode?',
    back: 'Transport Mode encrypts only the payload (Layer 4+) leaving original IP headers exposed (host-to-host). Tunnel Mode encrypts the entire original IP packet and encapsulates it inside a brand new IP header (gateway-to-gateway / site-to-site VPN).'
  },
  {
    id: 7,
    topic: 'Information Security Pillars',
    front: 'What are the 3 pillars of the CIA Triad?',
    back: '1. Confidentiality (preventing unauthorized data disclosure via encryption & RBAC)\n2. Integrity (guaranteeing data is not tampered with via hashing & signatures)\n3. Availability (ensuring uptime via redundancy & DDoS mitigation).'
  },
  {
    id: 8,
    topic: 'Security Architecture',
    front: 'What is the core principle of Zero Trust Architecture?',
    back: '"Never trust, always verify" — eliminates implicit trust based on network location. Enforces micro-segmentation, continuous multi-factor authentication, and least privilege access for every device and user.'
  }
];

const CPP_FLASHCARDS = [
  {
    id: 1,
    topic: 'Pointers & Addresses',
    front: 'What is a pointer in C++ and how do & and * operators differ?',
    back: 'A pointer stores the memory address of another variable. The address-of operator (&) retrieves a variable\'s address, while the dereference operator (*) accesses or modifies the value stored at that address.'
  },
  {
    id: 2,
    topic: 'Memory Management',
    front: 'What is the difference between Stack and Heap memory in C++?',
    back: 'Stack memory is fast and managed automatically for local variables upon function entry/exit. Heap memory is large and flexible, allocated dynamically at runtime using `new` and must be explicitly released using `delete`.'
  },
  {
    id: 3,
    topic: 'Error Prevention',
    front: 'What causes a memory leak and how do you prevent it in C++?',
    back: 'A memory leak occurs when heap memory allocated with `new` is never freed with `delete`, consuming system RAM. Prevent it by pairing every `new` with `delete` (or `delete[]`) and setting pointers to `nullptr`.'
  },
  {
    id: 4,
    topic: 'OOP 4 Pillars',
    front: 'Name and define the 4 pillars of Object-Oriented Programming (OOP).',
    back: '1. Encapsulation (bundling data and methods with access restrictions)\n2. Abstraction (hiding implementation details)\n3. Inheritance (reusing base class code in derived classes)\n4. Polymorphism (objects responding differently to identical function calls).'
  },
  {
    id: 5,
    topic: 'Functions & Passing',
    front: 'Compare pass-by-value versus pass-by-reference in C++.',
    back: 'Pass-by-value copies the argument, so changes inside the function do not affect the caller. Pass-by-reference (int &x) passes an alias to the original variable, allowing direct modification without copy overhead.'
  }
];

const HARDWARE_FLASHCARDS = [
  {
    id: 1,
    topic: 'CPU Sockets',
    front: 'Compare LGA, PGA, and BGA CPU socket architectures.',
    back: 'LGA (Land Grid Array) has pins on the motherboard socket and flat pads on the CPU (Intel, modern AMD AM5). PGA has pins on the CPU (legacy AMD AM4). BGA is soldered directly onto the motherboard (laptops & SoCs).'
  },
  {
    id: 2,
    topic: 'Memory Technologies',
    front: 'What is the difference between volatile RAM and non-volatile ROM?',
    back: 'RAM (Random Access Memory) is volatile temporary storage that loses all data when power is lost. ROM (Read-Only Memory) is non-volatile permanent storage holding BIOS/UEFI firmware for system booting.'
  },
  {
    id: 3,
    topic: 'RAM Generations',
    front: 'What are the primary advantages of DDR5 over DDR4 RAM?',
    back: 'Higher bandwidth (4800–7200+ MT/s vs DDR4 2133–3200 MT/s), lower voltage (1.1V vs 1.2V), dual independent 32-bit subchannels, and integrated On-Die ECC for data integrity.'
  },
  {
    id: 4,
    topic: 'Storage Architecture',
    front: 'Compare NVMe M.2 SSDs with SATA SSDs and mechanical HDDs.',
    back: 'NVMe M.2 connects via PCIe lanes with read speeds of 3,500–7,000+ MB/s. SATA SSDs use SATA III capped at ~550 MB/s. Mechanical HDDs use rotating magnetic platters with speeds of 100–200 MB/s.'
  }
];

const GENERIC_COURSE_FLASHCARDS = [
  {
    id: 1,
    topic: 'Course Foundations',
    front: 'What is the primary purpose and scope of this course module?',
    back: 'To establish foundational theoretical principles, industry standards, and hands-on practical competencies for student coursework and lab assessments.'
  },
  {
    id: 2,
    topic: 'Exam Preparation',
    front: 'What is the recommended strategy for exam preparation in this subject?',
    back: 'Review core definitions, understand structural diagrams and system workflows, complete practice quizzes, and verify configurations through hands-on exercises.'
  },
  {
    id: 3,
    topic: 'Methodology & Standards',
    front: 'Why is understanding system architecture critical for practical problem-solving?',
    back: 'It enables students to isolate subsystem bottlenecks, diagnose faults methodically, and apply targeted engineering solutions rather than trial and error.'
  },
  {
    id: 4,
    topic: 'Coursework Guidelines',
    front: 'What documentation standards should be followed for assignments and lab submissions?',
    back: 'Include Student Full Name, Matrix Number, Class Section, Subject Code, and clear step-by-step methodology with verified results.'
  }
];

const getDeckForSubject = (subjectCode = '', noteTitle = '') => {
  const combined = `${subjectCode} ${noteTitle}`.toLowerCase();
  if (combined.includes('dfn10078') || combined.includes('security') || combined.includes('firewall') || combined.includes('network')) {
    return NETSEC_FLASHCARDS;
  }
  if (combined.includes('dfc10042') || combined.includes('c++') || combined.includes('cpp') || combined.includes('programming')) {
    return CPP_FLASHCARDS;
  }
  if (combined.includes('dft10014') || combined.includes('hardware') || combined.includes('device')) {
    return HARDWARE_FLASHCARDS;
  }
  return GENERIC_COURSE_FLASHCARDS;
};

const RevisionFlashcardsModal = ({
  isOpen,
  onClose,
  subjectCode = 'COURSE',
  noteTitle = 'Lecture Note',
  customCards = null
}) => {
  const activeDeck = customCards && customCards.length > 0
    ? customCards
    : getDeckForSubject(subjectCode, noteTitle);
  const cards = activeDeck;
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
    <div
      className="flashcards-modal-overlay"
      style={{
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
      }}
    >
      <div className="flashcards-modal-dialog">
        {/* Modal Header */}
        <div className="flashcards-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.3rem' }}>📇</span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                AI Revision Flashcards
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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
        <div style={{ padding: '14px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Card <strong style={{ color: '#0284c7' }}>{currentIndex + 1}</strong> of {cards.length}
          </div>
          <div className="flashcard-progress-track">
            <div style={{
              width: `${masteryPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0284c7, #10b981)',
              borderRadius: '999px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#10b981' }}>
            {masteryPercent}% Mastered
          </div>
        </div>

        {/* Interactive Flip Card */}
        <div style={{ padding: '20px 24px' }}>
          <div
            onClick={() => setIsFlipped(prev => !prev)}
            className={`flashcard-surface ${isFlipped ? 'card-back' : 'card-front'}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="flashcard-badge">
                {isFlipped ? '💡 ANSWER / EXPLANATION' : '❓ QUESTION / CONCEPT'}
              </span>
              <span className="flashcard-hint">
                Click to flip card (Spacebar)
              </span>
            </div>

            <div style={{ margin: '20px 0', textAlign: 'center' }}>
              <div
                className="flashcard-body-text"
                style={{
                  fontSize: isFlipped ? '1.08rem' : '1.25rem',
                  fontWeight: isFlipped ? 500 : 700,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {isFlipped ? currentCard.back : currentCard.front}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="flashcard-topic-text">Topic: {currentCard.topic}</span>
              <span className="flashcard-action-pill">
                <span>🔄</span>
                <span>Tap card to {isFlipped ? 'view Question' : 'reveal Answer'}</span>
              </span>
            </div>
          </div>

          {/* Mastery Quick Feedback Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleMarkReview}
              className={`flashcard-btn-review ${needsReviewIds.includes(currentCard.id) ? 'active' : ''}`}
            >
              <span>❌</span>
              <span>Needs More Review</span>
            </button>

            <button
              type="button"
              onClick={handleMarkMastered}
              className={`flashcard-btn-mastered ${masteredIds.includes(currentCard.id) ? 'active' : ''}`}
            >
              <span>✅</span>
              <span>I Know This!</span>
            </button>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flashcards-modal-footer">
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
            className="flashcard-reset-btn"
            title="Reset master score and start over"
          >
            <span>🔄</span>
            <span>Reset Deck</span>
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
