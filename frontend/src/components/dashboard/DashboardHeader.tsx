import { Link, useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Logout01Icon } from '@hugeicons/core-free-icons'
import { LogoMark } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/store/auth'

export function DashboardHeader() {
  const { user, tenant, logout } = useAuth()
  const navigate = useNavigate()

  const signOut = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Lyrebird — home">
          <LogoMark />
          <span className="shrink-0 font-display text-[1.35rem] leading-none font-semibold tracking-tight">Lyrebird</span>
          <span className="ml-1 hidden rounded-full border border-line bg-cream px-2.5 py-0.5 font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase sm:inline">
            console
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2.5">
          <div className="hidden items-center gap-2 rounded-full border border-line bg-cream px-3.5 py-2 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
            <span className="max-w-40 truncate font-mono text-[11px] text-ink" title={user?.email}>
              {tenant?.name ?? user?.email}
            </span>
            <span className="max-w-44 truncate font-mono text-[11px] text-ink-soft" title={user?.email}>
              {user?.email}
            </span>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-cream text-ink-soft transition-colors hover:border-coral/40 hover:text-coral-deep"
          >
            <HugeiconsIcon icon={Logout01Icon} size={14} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
          </button>
          <ThemeToggle />
          <Link
            to="/"
            className="hidden rounded-full border border-line bg-cream px-4 py-2 text-sm font-medium transition-colors hover:border-ink/30 sm:inline-flex"
          >
            Back to site
          </Link>
        </div>
      </div>
    </header>
  )
}
