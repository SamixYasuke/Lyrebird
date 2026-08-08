import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight02Icon, Building01Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Modal } from '@/components/dashboard/Modal'
import { getApiError, tenantsApi } from '@/api/client'
import type { Tenant } from '@/api/client'

export function Dashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newTenantOpen, setNewTenantOpen] = useState(false)
  const [name, setName] = useState('')

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

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      await tenantsApi.create({ name: name.trim() })
      setName('')
      setNewTenantOpen(false)
      await load()
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setCreating(false)
    }
  }

  const totalServices = tenants.reduce((sum, t) => sum + (t.services?.length ?? 0), 0)

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] tracking-[0.22em] text-coral-deep uppercase">console</p>
            <h1 className="mt-2 font-display text-4xl font-medium tracking-tight md:text-5xl">
              Your tenants
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
              Each tenant is a company that connects its API. Under it live the services — one
              Telegram bot per API connection.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNewTenantOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-[15px] font-semibold text-cream-solid transition-colors hover:bg-coral-deep"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
            New tenant
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-3 font-mono text-[11px] tracking-[0.12em] text-ink-soft uppercase">
          <span className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-coral" /> {tenants.length} tenant{tenants.length === 1 ? '' : 's'}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-leaf" /> {totalServices} service{totalServices === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <p className="mt-16 text-center font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
            loading tenants…
          </p>
        ) : error && tenants.length === 0 ? (
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
        ) : tenants.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-line bg-cream p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-paper-2 text-ink">
              <HugeiconsIcon icon={Building01Icon} size={22} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-medium tracking-tight">No tenants yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
              Create your first tenant to start connecting APIs and shipping Telegram bots.
            </p>
            <button
              type="button"
              onClick={() => setNewTenantOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-[15px] font-semibold text-cream-solid transition-colors hover:bg-coral-deep"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
              Create tenant
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => (
              <Link
                key={tenant.id}
                to={`/app/tenants/${tenant.id}`}
                className="group flex flex-col rounded-3xl border border-line bg-cream p-6 transition-colors hover:border-coral/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-2 text-ink transition-colors group-hover:bg-coral-soft group-hover:text-coral-deep">
                    <HugeiconsIcon icon={Building01Icon} size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
                  </div>
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    size={16}
                    strokeWidth={1.5}
                    absoluteStrokeWidth
                    className="text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-coral-deep"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-5 truncate font-display text-xl font-medium tracking-tight">{tenant.name}</h3>
                <p className="mt-1.5 font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
                  {tenant.services?.length ?? 0} service{tenant.services?.length === 1 ? '' : 's'}
                </p>
                <p className="mt-5 border-t border-line pt-4 font-mono text-[10px] text-ink-soft">
                  created {new Date(tenant.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>

      {newTenantOpen ? (
        <Modal title="New tenant" onClose={() => setNewTenantOpen(false)}>
          <form onSubmit={submit} className="space-y-5">
            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">Name</span>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
                required
                className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] placeholder:text-ink-soft/50 focus:border-coral focus:outline-none"
              />
            </label>
            {error ? <p className="text-sm text-coral-deep">{error}</p> : null}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setNewTenantOpen(false)}
                className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !name.trim()}
                className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-cream-solid transition-colors hover:bg-coral-deep disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create tenant'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}
