/** Watt & Watts mark (vector redraw of the brand logo) + lowercase wordmark. Uses currentColor. */
export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="500 35 600 340"
      height={size}
      width={Math.round(size * (600 / 340))}
      fill="none"
      stroke="currentColor"
      strokeWidth={26}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M532 66 H572 L762 254" />
      <path d="M532 66 L706 346 L762 256" />
      <path d="M684 66 H1066 L862 346 Z" />
      <path d="M818 184 L894 98 H1000" />
    </svg>
  );
}

export function Logo({ size = 28, wordmark = true, className = "" }: { size?: number; wordmark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-display ${className}`}>
      <LogoMark size={size} />
      {wordmark && <span className="text-lg font-medium lowercase tracking-wide">watt &amp; watts</span>}
    </span>
  );
}
