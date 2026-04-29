/**
 * Custom vector crown — KH-inspired (three spires, heart-like negative space) — not a photo trace.
 */
export function KingdomCrownIcon({ className = '' }) {
  return (
    <svg
      className={`kh-crown-icon ${className}`.trim()}
      viewBox="0 0 100 64"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="khCrownShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fbff" />
          <stop offset="40%" stopColor="#b8c8e8" />
          <stop offset="100%" stopColor="#5a6a8a" />
        </linearGradient>
        <linearGradient id="khCrownRim" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#1a2a4a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#c7d0f3" stopOpacity="0.9" />
        </linearGradient>
        <filter id="khCrownGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#9fb8ff" floodOpacity="0.55" />
        </filter>
        <mask id="khCrownHoles" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="64">
          <rect width="100" height="64" fill="white" />
          <circle cx="32" cy="40" r="6" fill="black" />
          <circle cx="68" cy="40" r="6" fill="black" />
        </mask>
      </defs>
      <path
        filter="url(#khCrownGlow)"
        fill="url(#khCrownShine)"
        stroke="url(#khCrownRim)"
        strokeWidth="0.5"
        mask="url(#khCrownHoles)"
        d="M 6 60 L 20 60 L 26 32 L 32 6 L 50 2 L 68 6 L 74 32 L 80 60 L 94 60 L 95 64 L 5 64 Z"
      />
      <path
        fill="none"
        stroke="rgba(199, 208, 243, 0.35)"
        strokeWidth="0.4"
        d="M 12 60 Q 50 55 88 60"
        opacity="0.85"
      />
    </svg>
  )
}
