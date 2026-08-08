export function LogoMark({ className }: { className?: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--color-ink-deep)" />
      <path
        d="M7.5 10.5h13a3.5 3.5 0 0 1 3.5 3.5v8a3.5 3.5 0 0 1-3.5 3.5h-4.3l-3.9 3.9v-3.9H7.5a3.5 3.5 0 0 1-3.5-3.5v-8a3.5 3.5 0 0 1 3.5-3.5z"
        fill="var(--color-coral)"
      />
      <path
        d="M20.5 20.5c3.4-.45 5.8-2 7-4.7"
        stroke="var(--color-mint)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="11.5" cy="14.5" r="1.35" fill="var(--color-paper)" />
      <circle cx="16.5" cy="14.5" r="1.35" fill="var(--color-paper)" />
      <circle cx="21.5" cy="14.5" r="1.35" fill="var(--color-leaf)" />
    </svg>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <a href="#top" className={`flex items-center gap-2.5 ${className}`} aria-label="Lyrebird — home">
      <LogoMark />
      <span className="font-display text-[1.35rem] leading-none font-semibold tracking-tight">
        Lyrebird
      </span>
    </a>
  )
}
