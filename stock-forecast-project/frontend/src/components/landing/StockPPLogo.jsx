export default function StockPPLogo({ size = 32, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background rounded square */}
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#FF6633" />

      {/* Abstract chart line forming S shape */}
      <path
        d="M16 44 L24 36 L32 40 L40 24 L48 28"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Forecast dot */}
      <circle cx="48" cy="28" r="3.5" fill="white" />

      {/* Upward arrow from dot */}
      <path
        d="M48 22 L48 16 M45 19 L48 16 L51 19"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Small P letter mark bottom-left */}
      <text x="14" y="54" fontFamily="Helvetica, Arial, sans-serif" fontSize="11" fontWeight="600" fill="rgba(255,255,255,0.9)">PP</text>
    </svg>
  )
}
