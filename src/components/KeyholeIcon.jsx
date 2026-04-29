/**
 * Kingdom Hearts style keyhole: circular head, flared trapezoid base (reference silhouette).
 */
export function KeyholeIcon({ className = '' }) {
  return (
    <svg
      className={`kh-keyhole-svg ${className}`.trim()}
      viewBox="0 0 100 120"
      aria-hidden="true"
    >
      <path
        className="kh-keyhole-path"
        fill="#fff"
        d="M 32 30 A 20 20 0 0 1 50 8 A 20 20 0 0 1 68 30 L 80 100 L 20 100 L 32 30 Z"
      />
    </svg>
  )
}
