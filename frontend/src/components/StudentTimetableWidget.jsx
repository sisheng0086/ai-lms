import React, { useState, useEffect, useMemo, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const CLASS_TIMETABLE_DATA = [
  // MONDAY (ISNIN)
  {
    id: 'mon-1',
    day: 'Monday',
    dayIndex: 1,
    startTime: '08:00',
    endTime: '10:00',
    subjectCode: 'DFC11063',
    subjectTitle: 'Programming Fundamentals (C++)',
    type: 'Lecture',
    venue: 'Bilik Kuliah BK1 (Blok Teknologi Maklumat)',
    lecturer: '',
    color: '#0284c7', // Sky Blue
    bgLight: 'rgba(2, 132, 199, 0.08)',
    bgDark: 'rgba(2, 132, 199, 0.2)',
    borderColor: '#0284c7'
  },
  {
    id: 'mon-2',
    day: 'Monday',
    dayIndex: 1,
    startTime: '10:15',
    endTime: '12:15',
    subjectCode: 'DUA6022',
    subjectTitle: 'Komunikasi Bahasa Inggeris Komunikatif',
    type: 'Tutorial',
    venue: 'Bilik Bahasa BB2',
    lecturer: '',
    color: '#8b5cf6', // Purple
    bgLight: 'rgba(139, 92, 246, 0.08)',
    bgDark: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8b5cf6'
  },
  {
    id: 'mon-3',
    day: 'Monday',
    dayIndex: 1,
    startTime: '14:00',
    endTime: '16:00',
    subjectCode: 'DFT10014',
    subjectTitle: 'Computer Hardware & Devices Architecture',
    type: 'Practical Lab',
    venue: 'Bengkel Baikpulih Perkakasan (BHP)',
    lecturer: '',
    color: '#10b981', // Emerald
    bgLight: 'rgba(16, 185, 129, 0.08)',
    bgDark: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981'
  },

  // TUESDAY (SELASA)
  {
    id: 'tue-1',
    day: 'Tuesday',
    dayIndex: 2,
    startTime: '08:00',
    endTime: '10:00',
    subjectCode: 'DFN10078',
    subjectTitle: 'Network Security & Perimeter Defense',
    type: 'Practical Lab',
    venue: 'Makmal Keselamatan Siber & Rangkaian (MKSR)',
    lecturer: '',
    color: '#ef4444', // Red
    bgLight: 'rgba(239, 68, 68, 0.08)',
    bgDark: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444'
  },
  {
    id: 'tue-2',
    day: 'Tuesday',
    dayIndex: 2,
    startTime: '10:30',
    endTime: '12:30',
    subjectCode: 'DFC11063',
    subjectTitle: 'Programming Fundamentals (C++ Lab & Logic)',
    type: 'Practical Lab',
    venue: 'Makmal Komputer MK3 (Aras 2)',
    lecturer: '',
    color: '#0284c7',
    bgLight: 'rgba(2, 132, 199, 0.08)',
    bgDark: 'rgba(2, 132, 199, 0.2)',
    borderColor: '#0284c7'
  },
  {
    id: 'tue-3',
    day: 'Tuesday',
    dayIndex: 2,
    startTime: '14:00',
    endTime: '16:00',
    subjectCode: 'MPU21032',
    subjectTitle: 'Penghayatan Etika dan Peradaban',
    type: 'Lecture',
    venue: 'Dewan Kuliah DK2 (Bangunan Utama)',
    lecturer: '',
    color: '#f59e0b', // Amber
    bgLight: 'rgba(245, 158, 11, 0.08)',
    bgDark: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#f59e0b'
  },

  // WEDNESDAY (RABU)
  {
    id: 'wed-1',
    day: 'Wednesday',
    dayIndex: 3,
    startTime: '08:30',
    endTime: '10:30',
    subjectCode: 'DFT10014',
    subjectTitle: 'Computer Hardware & Device Diagnostics',
    type: 'Lecture',
    venue: 'Bilik Seminar CS (Jabatan TMK)',
    lecturer: '',
    color: '#10b981',
    bgLight: 'rgba(16, 185, 129, 0.08)',
    bgDark: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981'
  },
  {
    id: 'wed-2',
    day: 'Wednesday',
    dayIndex: 3,
    startTime: '11:00',
    endTime: '13:00',
    subjectCode: 'DFN10078',
    subjectTitle: 'Firewalls, IDS/IPS & IPsec Architecture',
    type: 'Lecture',
    venue: 'Dewan Kuliah Utama DKU',
    lecturer: '',
    color: '#ef4444',
    bgLight: 'rgba(239, 68, 68, 0.08)',
    bgDark: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444'
  },

  // THURSDAY (KHAMIS)
  {
    id: 'thu-1',
    day: 'Thursday',
    dayIndex: 4,
    startTime: '08:00',
    endTime: '11:00',
    subjectCode: 'DFC11063',
    subjectTitle: 'C++ Data Structures, Pointers & OOP Coding',
    type: 'Practical Lab',
    venue: 'Makmal Komputer MK4 (Software Lab)',
    lecturer: '',
    color: '#0284c7',
    bgLight: 'rgba(2, 132, 199, 0.08)',
    bgDark: 'rgba(2, 132, 199, 0.2)',
    borderColor: '#0284c7'
  },
  {
    id: 'thu-2',
    day: 'Thursday',
    dayIndex: 4,
    startTime: '14:00',
    endTime: '16:00',
    subjectCode: 'DFN10078',
    subjectTitle: 'Network Security Lab: Packet Inspection & Snort',
    type: 'Practical Lab',
    venue: 'Makmal Keselamatan Siber & Rangkaian (MKSR)',
    lecturer: '',
    color: '#ef4444',
    bgLight: 'rgba(239, 68, 68, 0.08)',
    bgDark: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444'
  },

  // FRIDAY (JUMAAT)
  {
    id: 'fri-1',
    day: 'Friday',
    dayIndex: 5,
    startTime: '08:00',
    endTime: '10:00',
    subjectCode: 'DFT10014',
    subjectTitle: 'Hardware Lab: Motherboard & NVMe PCIe Testing',
    type: 'Practical Lab',
    venue: 'Bengkel Baikpulih Perkakasan (BHP)',
    lecturer: '',
    color: '#10b981',
    bgLight: 'rgba(16, 185, 129, 0.08)',
    bgDark: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981'
  },
  {
    id: 'fri-2',
    day: 'Friday',
    dayIndex: 5,
    startTime: '10:15',
    endTime: '12:00',
    subjectCode: 'AI-LMS',
    subjectTitle: 'FYP Project Consultation & AI Revision Session',
    type: 'Consultation',
    venue: 'Bilik Rundingan FYP Aras 3',
    lecturer: '',
    color: '#38bdf8',
    bgLight: 'rgba(56, 189, 248, 0.08)',
    bgDark: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38bdf8'
  }
];

export const POLITEKNIK_TIMETABLE_DATA = CLASS_TIMETABLE_DATA;

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const StudentTimetableWidget = ({
  onOpenChatWithQuery,
  onOpenNotes,
  onOpenFlashcards,
  viewMode = 'tab', // 'tab' | 'overview'
  timetableData: propTimetableData
}) => {
  const [timetableData, setTimetableData] = useState(propTimetableData || CLASS_TIMETABLE_DATA);

  const fetchLiveTimetable = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/timetable`);
      if (res.ok) {
        const d = await res.json();
        if (d?.timetable && Array.isArray(d.timetable) && d.timetable.length > 0) {
          setTimetableData(d.timetable);
        }
      }
    } catch {
      // Keep initial/fallback data on offline error
    }
  }, []);

  useEffect(() => {
    if (propTimetableData && Array.isArray(propTimetableData)) {
      setTimetableData(propTimetableData);
    } else {
      fetchLiveTimetable();
    }
  }, [propTimetableData, fetchLiveTimetable]);
  // Get current Malaysian Day of week (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6/0=Weekend)
  const currentDayIndex = new Date().getDay();
  const defaultDay = currentDayIndex >= 1 && currentDayIndex <= 5 
    ? DAYS_OF_WEEK[currentDayIndex - 1] 
    : 'Monday';

  const [selectedDay, setSelectedDay] = useState(viewMode === 'overview' ? defaultDay : 'All');
  const [displayMode, setDisplayMode] = useState('grid'); // 'grid' | 'timeline'

  // Filter classes by day
  const filteredClasses = useMemo(() => {
    if (selectedDay === 'All') return timetableData;
    return timetableData.filter(c => c.day === selectedDay);
  }, [selectedDay, timetableData]);

  // Today's classes specifically
  const todayClasses = useMemo(() => {
    const todayName = DAYS_OF_WEEK[currentDayIndex - 1] || 'Monday';
    return timetableData.filter(c => c.day === todayName);
  }, [currentDayIndex, timetableData]);

  // Print timetable
  const handlePrintTimetable = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const daysRows = DAYS_OF_WEEK.map(day => {
      const dayClasses = timetableData.filter(c => c.day === day);
      return `
        <div style="margin-bottom: 18px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; page-break-inside: avoid;">
          <div style="background: #0f172a; color: #ffffff; padding: 8px 14px; font-weight: 700; font-size: 14px;">
            ${day.toUpperCase()} (${dayClasses.length} Sessions)
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155; text-align: left; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 8px 12px; width: 110px;">Time</th>
                <th style="padding: 8px 12px; width: 100px;">Code</th>
                <th style="padding: 8px 12px;">Course Title</th>
                <th style="padding: 8px 12px; width: 80px;">Type</th>
                <th style="padding: 8px 12px;">Venue</th>
                <th style="padding: 8px 12px;">Lecturer</th>
              </tr>
            </thead>
            <tbody>
              ${dayClasses.map(c => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 12px; font-weight: 600;">${c.startTime} - ${c.endTime}</td>
                  <td style="padding: 8px 12px; font-weight: 700; color: #0284c7;">${c.subjectCode}</td>
                  <td style="padding: 8px 12px;">${c.subjectTitle}</td>
                  <td style="padding: 8px 12px;"><span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${c.type}</span></td>
                  <td style="padding: 8px 12px; color: #475569;">${c.venue}</td>
                  <td style="padding: 8px 12px; color: #334155;">${c.lecturer || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Class Timetable — AI-LMS</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 0; padding: 10px; }
          </style>
        </head>
        <body>
          <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.04em;">CLASS TIMETABLE</h2>
            <h3 style="margin: 4px 0 0; color: #0284c7; font-size: 15px;">Student Class Schedule & Timetable • Academic Session 2026/2027</h3>
            <p style="margin: 4px 0 0; font-size: 11px; color: #64748b;">Generated via AI-LMS Study Companion • Printed: ${new Date().toLocaleDateString()}</p>
          </div>
          ${daysRows}
          <div style="margin-top: 14px; font-size: 11px; color: #64748b; text-align: center;">
            Official class schedule verified by Academic Faculty.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Export iCal (.ics) calendar file
  const handleExportIcs = () => {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AI-LMS//Class Timetable//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Class Schedule'
    ];

    timetableData.forEach(c => {
      const dayMap = { Monday: 'MO', Tuesday: 'TU', Wednesday: 'WE', Thursday: 'TH', Friday: 'FR' };
      const startClean = (c.startTime || '08:00').replace(':', '') + '00';
      const endClean = (c.endTime || '10:00').replace(':', '') + '00';

      icsContent.push(
        'BEGIN:VEVENT',
        `SUMMARY:${c.subjectCode} - ${c.subjectTitle} (${c.type})`,
        `LOCATION:${c.venue}`,
        `DESCRIPTION:Lecturer: ${c.lecturer || 'Unassigned'}\\nType: ${c.type}\\nPlatform: AI-LMS`,
        `RRULE:FREQ=WEEKLY;BYDAY=${dayMap[c.day]}`,
        `DTSTART;TZID=Asia/Kuala_Lumpur:20260901T${startClean}`,
        `DTEND;TZID=Asia/Kuala_Lumpur:20260901T${endClean}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Class_Timetable.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // =========================================================================
  // OVERVIEW COMPACT WIDGET ("Today's Classes & Schedule")
  // =========================================================================
  if (viewMode === 'overview') {
    const todayName = DAYS_OF_WEEK[currentDayIndex - 1] || 'Monday';
    const isWeekend = currentDayIndex === 0 || currentDayIndex === 6;

    return (
      <div className="timetable-overview-widget" style={{
        background: 'var(--card-bg, #1e293b)',
        border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📅</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Today's Class Schedule ({todayName})
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {isWeekend ? 'Weekend • Self-Study & AI Practice' : `${todayClasses.length} Scheduled Class Sessions`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={handlePrintTimetable}
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Print official schedule"
            >
              <span>🖨️</span>
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleExportIcs}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Sync to Google / Apple Calendar"
            >
              📅 Sync (.ics)
            </button>
          </div>
        </div>

        {todayClasses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '2rem' }}>🎉</span>
            <p style={{ margin: '8px 0 0', fontWeight: 600 }}>No classes scheduled for today!</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Use the AI Companion to revise past lecture notes or test yourself with flashcards.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {todayClasses.map(c => (
              <div
                key={c.id}
                style={{
                  background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                  border: `1.5px solid ${c.color}40`,
                  borderLeft: `5px solid ${c.color}`,
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px',
                  transition: 'transform 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      color: c.color,
                      letterSpacing: '0.04em'
                    }}>
                      {c.subjectCode} • {c.type}
                    </span>
                    <span style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      background: 'rgba(0, 0, 0, 0.08)',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      ⏰ {c.startTime} - {c.endTime}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {c.subjectTitle}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    📍 {c.venue}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    👨‍🏫 {c.lecturer ? c.lecturer : <span style={{ opacity: 0.65, fontStyle: 'italic' }}>Unassigned</span>}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => onOpenChatWithQuery?.(`Can you give me a simplified summary of ${c.subjectCode} (${c.subjectTitle}) before class?`)}
                    style={{
                      flex: 1,
                      background: `${c.color}18`,
                      border: `1px solid ${c.color}50`,
                      color: c.color,
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🤖</span>
                    <span>AI Study Prep</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenFlashcards?.()}
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Open revision flashcards"
                  >
                    📇
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // FULL TIMETABLE TAB VIEW
  // =========================================================================
  return (
    <div className="timetable-tab-container">
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📅</span>
            <span>Class Timetable</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Diploma Teknologi Maklumat (Keselamatan Maklumat) • Academic Session 2026/2027
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Display Mode Toggle */}
          <div style={{
            display: 'inline-flex',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '2px'
          }}>
            <button
              type="button"
              onClick={() => setDisplayMode('grid')}
              style={{
                background: displayMode === 'grid' ? 'var(--primary)' : 'transparent',
                color: displayMode === 'grid' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📊 Grid View
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('timeline')}
              style={{
                background: displayMode === 'timeline' ? 'var(--primary)' : 'transparent',
                color: displayMode === 'timeline' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📱 Timeline View
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrintTimetable}
            className="btn-secondary"
            style={{ padding: '7px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>🖨️</span>
            <span>Print Timetable (PDF)</span>
          </button>
          <button
            type="button"
            onClick={handleExportIcs}
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.16), rgba(37, 99, 235, 0.26))',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              color: '#38bdf8',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📅</span>
            <span>Sync to Calendar (.ics)</span>
          </button>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '10px',
        marginBottom: '16px',
        borderBottom: '1px solid var(--border)'
      }}>
        <button
          type="button"
          onClick={() => setSelectedDay('All')}
          style={{
            background: selectedDay === 'All' ? 'var(--primary)' : 'var(--card-bg)',
            color: selectedDay === 'All' ? '#fff' : 'var(--text-main)',
            border: '1px solid var(--border)',
            padding: '7px 16px',
            borderRadius: '8px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          All Days (Mon–Fri)
        </button>
        {DAYS_OF_WEEK.map(day => (
          <button
            key={day}
            type="button"
            onClick={() => setSelectedDay(day)}
            style={{
              background: selectedDay === day ? 'var(--primary)' : 'var(--card-bg)',
              color: selectedDay === day ? '#fff' : 'var(--text-main)',
              border: '1px solid var(--border)',
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: selectedDay === day ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {day}
          </button>
        ))}
      </div>

      {/* GRID VIEW */}
      {displayMode === 'grid' && selectedDay === 'All' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {DAYS_OF_WEEK.map(day => {
            const daySessions = timetableData.filter(c => c.day === day);
            const isToday = DAYS_OF_WEEK[currentDayIndex - 1] === day;

            return (
              <div
                key={day}
                style={{
                  background: 'var(--card-bg)',
                  border: isToday ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  boxShadow: isToday ? '0 4px 20px rgba(239, 68, 68, 0.15)' : 'none'
                }}
              >
                <div style={{
                  padding: '10px 14px',
                  background: isToday ? 'var(--primary)' : 'rgba(0,0,0,0.12)',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}>
                  <span>{day}</span>
                  {isToday && (
                    <span style={{ background: '#ffffff', color: '#ef4444', fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px' }}>
                      TODAY
                    </span>
                  )}
                </div>

                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {daySessions.map(c => (
                    <div
                      key={c.id}
                      style={{
                        background: 'var(--input-bg)',
                        border: `1px solid ${c.color}40`,
                        borderLeft: `4px solid ${c.color}`,
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.78rem', color: c.color }}>
                          {c.subjectCode}
                        </span>
                        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {c.startTime} - {c.endTime}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: '1.3' }}>
                        {c.subjectTitle}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        📍 {c.venue}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        👨‍🏫 {c.lecturer ? c.lecturer : <span style={{ opacity: 0.65, fontStyle: 'italic' }}>Unassigned</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => onOpenChatWithQuery?.(`Can you give me a simplified summary of ${c.subjectCode} (${c.subjectTitle}) before class?`)}
                          style={{
                            flex: 1,
                            background: `${c.color}15`,
                            border: `1px solid ${c.color}40`,
                            color: c.color,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          🤖 AI Prep
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenNotes?.()}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-main)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            cursor: 'pointer'
                          }}
                          title="View course notes"
                        >
                          📚 Notes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TIMELINE / DAY LIST VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredClasses.map(c => (
            <div
              key={c.id}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderLeft: `6px solid ${c.color}`,
                borderRadius: '14px',
                padding: '18px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ background: c.color, color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.76rem' }}>
                    {c.day}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: c.color }}>
                    {c.subjectCode}
                  </span>
                  <span style={{
                    background: `${c.color}20`,
                    color: c.color,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}>
                    {c.type}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {c.subjectTitle}
                </h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>📍 <strong>Venue:</strong> {c.venue}</span>
                  <span>👨‍🏫 <strong>Lecturer:</strong> {c.lecturer ? c.lecturer : <span style={{ opacity: 0.65, fontStyle: 'italic' }}>Unassigned</span>}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                <div style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  background: 'var(--input-bg)',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)'
                }}>
                  ⏰ {c.startTime} – {c.endTime}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => onOpenChatWithQuery?.(`Can you give me a simplified summary of ${c.subjectCode} (${c.subjectTitle}) before class?`)}
                    style={{
                      background: `${c.color}20`,
                      border: `1px solid ${c.color}50`,
                      color: c.color,
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>🤖</span>
                    <span>AI Study Prep</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenNotes?.()}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    📚 Open Notes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentTimetableWidget;
