import React from 'react';

/**
 * Custom SVG Eye icons matching user reference:
 * - EyeOpenIcon: Open eye outline with iris circle and pupil dot
 * - EyeClosedIcon: Curved eyelid with eyelashes radiating downward
 */
export const EyeOpenIcon = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    {/* Outer eye contour */}
    <path
      d="M2 12C3.8 6.5 7.6 4.5 12 4.5C16.4 4.5 20.2 6.5 22 12C20.2 17.5 16.4 19.5 12 19.5C7.6 19.5 3.8 17.5 2 12Z"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Iris outer circle */}
    <circle
      cx="12"
      cy="12"
      r="4.2"
      stroke="currentColor"
      strokeWidth="2"
    />
    {/* Pupil center filled dot */}
    <circle
      cx="12"
      cy="12"
      r="2"
      fill="currentColor"
    />
  </svg>
);

export const EyeClosedIcon = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    {/* Eyelid curve */}
    <path
      d="M3.5 10C5.5 14 8.5 15.5 12 15.5C15.5 15.5 18.5 14 20.5 10"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    {/* 5 Eyelashes radiating downward */}
    <line x1="5" y1="12" x2="3.5" y2="16.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="8.5" y1="13.8" x2="7.5" y2="18.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="12" y1="14.5" x2="12" y2="19.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="15.5" y1="13.8" x2="16.5" y2="18.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="19" y1="12" x2="20.5" y2="16.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export default EyeOpenIcon;
