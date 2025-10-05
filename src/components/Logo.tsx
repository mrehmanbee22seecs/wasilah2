import React from 'react';

const Logo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <div className={`${className} relative`}>
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Background circle with gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#0C1E3B" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Main Arabic calligraphy - وقالة */}
        <g fill="#f8fafc" filter="url(#glow)">
          {/* Main curved base */}
          <path d="M30 140 Q100 120 170 140 Q100 160 30 140 Z" strokeWidth="2" stroke="#e2e8f0"/>
          
          {/* Arabic letters - stylized وقالة */}
          <path d="M50 100 Q70 80 90 100 Q110 85 130 100 Q150 85 170 100" 
                strokeWidth="4" stroke="#f8fafc" fill="none"/>
          
          {/* Vertical strokes */}
          <line x1="80" y1="100" x2="80" y2="70" strokeWidth="6" stroke="#f8fafc"/>
          <line x1="120" y1="100" x2="120" y2="60" strokeWidth="6" stroke="#f8fafc"/>
          <line x1="140" y1="100" x2="140" y2="75" strokeWidth="4" stroke="#f8fafc"/>
          
          {/* Decorative dots */}
          <circle cx="60" cy="120" r="2" fill="#e2e8f0"/>
          <circle cx="80" cy="125" r="2" fill="#e2e8f0"/>
          <circle cx="100" cy="130" r="2" fill="#e2e8f0"/>
          <circle cx="120" cy="125" r="2" fill="#e2e8f0"/>
          <circle cx="140" cy="120" r="2" fill="#e2e8f0"/>
          
          {/* Central connecting element */}
          <path d="M100 135 L100 145 Q95 150 100 155 Q105 150 100 145 Z" fill="#f8fafc"/>
        </g>
      </svg>
    </div>
  );
};

export default Logo;