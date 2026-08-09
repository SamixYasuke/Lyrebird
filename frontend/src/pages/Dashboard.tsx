import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight02Icon, Building01Icon } from '@hugeicons/core-free-icons'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { getApiError, tenantsApi } from '@/api/client'
import type { Tenant } from '@/api/client'

export function Dashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTenants(await tenantsApi.list())
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const tenant = tenants[0] ?? null
  const totalServices = tenants.reduce((sum, t) => sum + (t.services?.length ?? 0), 0)

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-coral-deep uppercase">console</p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight md:text-5xl">
            Your workspace
          </h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
            Your company, its API connections, and one Telegram bot per service.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-3 font-mono text-[11px] tracking-[0.12em] text-ink-soft uppercase">
          <span className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-coral" /> {tenant ? '1' : '0'} tenant
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-leaf" /> {totalServices} service{totalServices === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <p className="mt-16 text-center font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
            loading workspace…
          </p>
        ) : error && !tenant ? (
          <div className="mt-16 rounded-3xl border border-coral/30 bg-coral-soft p-8 text-center">
            <p className="font-display text-lg font-medium text-coral-deep">Couldn't reach the API</p>
            <p className="mt-2 text-sm text-ink-soft">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-5 rounded-full border border-coral/40 px-5 py-2 text-sm font-medium text-coral-deep transition-colors hover:bg-coral/10"
            >
              Try again
            </button>
          </div>
        ) : tenant ? (
          <Link
            key={tenant.id}
            to={`/app/tenants/${tenant.id}`}
            className="group mt-10 flex flex-col rounded-3xl border border-line bg-cream p-8 transition-colors hover:border-coral/40 sm:flex-row sm:items-center sm:gap-6"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-paper-2 text-ink transition-colors group-hover:bg-coral-soft group-hover:text-coral-deep">
              <HugeiconsIcon icon={Building01Icon} size={24} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
            </div>
            <div className="mt-5 min-w-0 flex-1 sm:mt-0">
              <h2 className="truncate font-display text-2xl font-medium tracking-tight">{tenant.name}</h2>
              <p className="mt-1.5 font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
                {tenant.services?.length ?? 0} service{tenant.services?.length === 1 ? '' : 's'} · created{' '}
                {new Date(tenant.createdAt).toLocaleDateString()}
              </p>
            </div>
            <HugeiconsIcon
              icon={ArrowRight02Icon}
              size={18}
              strokeWidth={1.5}
              absoluteStrokeWidth
              className="mt-5 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-coral-deep sm:mt-0"
              aria-hidden="true"
            />
          </Link>
        ) : (
          <div className="mt-16 rounded-3xl border border-dashed border-line bg-cream p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-paper-2 text-ink">
              <HugeiconsIcon icon={Building01Icon} size={22} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-medium tracking-tight">No workspace yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
              Your account isn't linked to a tenant. Contact us and we'll get you set up.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
