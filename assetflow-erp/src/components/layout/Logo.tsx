export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="14"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M 28 68 L 50 32 L 72 68" strokeMiterlimit="10" />
    </svg>
  )
}
