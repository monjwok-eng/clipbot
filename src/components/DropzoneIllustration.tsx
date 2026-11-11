import React from 'react';

export const DropzoneIllustration: React.FC<{ className?: string }> = ({ className = "w-20 h-20" }) => (
  <svg 
    viewBox="0 0 120 120" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Shadow beneath cards */}
    <ellipse cx="60" cy="106" rx="42" ry="7" fill="#141414" fillOpacity="0.08" />

    {/* Back document card tilted */}
    <rect 
      x="34" 
      y="22" 
      width="60" 
      height="76" 
      rx="4" 
      transform="rotate(7 64 60)" 
      fill="#FFFFFF" 
      stroke="#141414" 
      strokeWidth="2.2" 
    />
    {/* Decorative circle on back card */}
    <circle cx="80" cy="44" r="12" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1.8" strokeDasharray="3 3" />
    <path d="M76 40 L84 44 L76 48" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Front document card */}
    <rect 
      x="26" 
      y="18" 
      width="60" 
      height="76" 
      rx="4" 
      fill="#FFFFFF" 
      stroke="#141414" 
      strokeWidth="2.2" 
    />
    
    {/* Isometric Cube Graphic inspired by the reference screenshot */}
    <g transform="translate(42, 38)">
      {/* Top face */}
      <polygon 
        points="14,2 26,8 14,15 2,8" 
        fill="#FEF08A" 
        stroke="#141414" 
        strokeWidth="1.8" 
        strokeLinejoin="round" 
      />
      {/* Left face */}
      <polygon 
        points="2,8 14,15 14,29 2,22" 
        fill="#FED7AA" 
        stroke="#141414" 
        strokeWidth="1.8" 
        strokeLinejoin="round" 
      />
      {/* Right face */}
      <polygon 
        points="26,8 26,22 14,29 14,15" 
        fill="#DDD6FE" 
        stroke="#141414" 
        strokeWidth="1.8" 
        strokeLinejoin="round" 
      />
      {/* Center inner sphere / core */}
      <circle cx="14" cy="15" r="4" fill="#F59E0B" stroke="#141414" strokeWidth="1.5" />
    </g>

    {/* Document lines */}
    <line x1="36" y1="78" x2="66" y2="78" stroke="#141414" strokeWidth="2" strokeLinecap="round" />
    <line x1="36" y1="84" x2="52" y2="84" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
