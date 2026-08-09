import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { LockPasswordIcon, Mail02Icon } from '@hugeicons/core-free-icons'
import { LogoMark } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/store/auth'
import { getApiError } from '@/api/client'

type Mode = 'login' | 'signup'

export function Auth() {
  const { user, login, signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<Mode>('login')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  if (user) return <Navigate to="/app" replace />

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'signup') {
        await signup(companyName.trim(), email.trim(), password)
      } else {
        await login(email.trim(), password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const fieldClass =
    'mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] placeholder:text-ink-soft/50 focus:border-coral focus:outline-none'

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Lyrebird — home">
          <LogoMark />
          <span className="font-display text-[1.35rem] leading-none font-semibold tracking-tight">
            Lyrebird
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex max-w-md flex-col px-6 pb-24 pt-8 md:pt-16">
        <p className="font-mono text-[11px] tracking-[0.22em] text-coral-deep uppercase">console</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">
          {mode === 'login' ? 'Welcome back' : 'Start your workspace'}
        </h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          {mode === 'login'
            ? 'Sign in to connect APIs and manage your Telegram bots.'
            : 'Create an account and Lyrebird spins up a workspace for your company.'}
        </p>

        <div className="relative mt-8 grid grid-cols-2 rounded-full border border-line bg-paper-2 p-1">
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-cream shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-cream-solid ${
              mode === 'login' ? 'translate-x-0' : 'translate-x-full'
            }`}
          />
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`relative z-10 rounded-full py-2 text-sm font-medium transition-colors ${
              mode === 'login' ? 'text-ink dark:text-ink-deep' : 'text-ink-soft hover:text-ink'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`relative z-10 rounded-full py-2 text-sm font-medium transition-colors ${
              mode === 'signup' ? 'text-ink dark:text-ink-deep' : 'text-ink-soft hover:text-ink'
            }`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-5">
          {mode === 'signup' ? (
            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">
                Company name
              </span>
              <input
                autoFocus
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                required
                className={fieldClass}
              />
            </label>
          ) : null}

          <label className="block">
            <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">Email</span>
            <div className="relative">
              <HugeiconsIcon
                icon={Mail02Icon}
                size={16}
                strokeWidth={1.5}
                absoluteStrokeWidth
                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft"
                aria-hidden="true"
              />
              <input
                autoFocus={mode === 'login'}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className={`${fieldClass} pl-11`}
              />
            </div>
          </label>

          <label className="block">
            <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">Password</span>
            <div className="relative">
              <HugeiconsIcon
                icon={LockPasswordIcon}
                size={16}
                strokeWidth={1.5}
                absoluteStrokeWidth
                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft"
                aria-hidden="true"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                required
                minLength={mode === 'signup' ? 8 : undefined}
                className={`${fieldClass} pl-11`}
              />
            </div>
          </label>

          {error ? (
            <p className="rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral-deep">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-coral px-6 py-3 text-[15px] font-semibold text-cream-solid transition-colors hover:bg-coral-deep disabled:opacity-50"
          >
            {submitting ? (mode === 'signup' ? 'Creating account…' : 'Signing in…') : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-8 text-center text-[12px] leading-relaxed text-ink-soft">
          {mode === 'login' ? (
            <>
              New to Lyrebird?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-medium text-coral-deep underline decoration-coral/40 underline-offset-2 transition-colors hover:decoration-coral"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-medium text-coral-deep underline decoration-coral/40 underline-offset-2 transition-colors hover:decoration-coral"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </main>
    </div>
  )
}
