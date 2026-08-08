import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft02Icon,
  Delete01Icon,
  Edit01Icon,
  PlusSignIcon,
  WebhookIcon,
} from '@hugeicons/core-free-icons'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { BotFatherGuide } from '@/components/dashboard/BotFatherGuide'
import { Modal } from '@/components/dashboard/Modal'
import { SystemMap } from '@/components/dashboard/SystemMap'
import { getApiError, tenantsApi } from '@/api/client'
import type { Service, Tenant } from '@/api/client'
import { countEndpoints, hostOf, maskToken } from '@/lib/spec'

const emptyForm = {
  name: '',
  baseUrl: '',
  openapiSpec: '',
  botToken: '',
  authHeaderName: '',
  authHeaderValue: '',
}

const emptyEditForm = {
  name: '',
  baseUrl: '',
  openapiSpec: '',
  authHeaderName: '',
  authHeaderValue: '',
}

export function TenantDetail() {
  const { tenantId = '' } = useParams()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newServiceOpen, setNewServiceOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<Service | null>(null)
  const [editForm, setEditForm] = useState(emptyEditForm)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [tenantData, servicesData] = await Promise.all([
        tenantsApi.get(tenantId),
        tenantsApi.services(tenantId),
      ])
      setTenant(tenantData)
      setServices(servicesData)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    void load()
  }, [load])

  const updateField = (field: keyof typeof emptyForm) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const updateEditField = (field: keyof typeof emptyEditForm) => (e: { target: { value: string } }) => {
    setEditForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const openEdit = (service: Service) => {
    setEditForm({
      name: service.name,
      baseUrl: service.baseUrl,
      openapiSpec: service.openapiSpec,
      authHeaderName: service.authHeaderName ?? '',
      authHeaderValue: '',
    })
    setEditing(service)
    setError(null)
  }

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setSubmitting(true)
    setError(null)
    try {
      await tenantsApi.updateService(tenantId, editing.id, {
        name: editForm.name.trim(),
        baseUrl: editForm.baseUrl.trim(),
        openapiSpec: editForm.openapiSpec,
        authHeaderName: editForm.authHeaderName.trim() || undefined,
        authHeaderValue: editForm.authHeaderValue.trim() || undefined,
      })
      setEditing(null)
      await load()
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await tenantsApi.createService(tenantId, {
        name: form.name.trim(),
        baseUrl: form.baseUrl.trim(),
        openapiSpec: form.openapiSpec,
        botToken: form.botToken.trim(),
        authHeaderName: form.authHeaderName.trim() || undefined,
        authHeaderValue: form.authHeaderValue.trim() || undefined,
      })
      setForm(emptyForm)
      setNewServiceOpen(false)
      await load()
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const removeService = async (service: Service) => {
    if (!window.confirm(`Delete service "${service.name}" and unregister its webhook?`)) return
    setDeletingId(service.id)
    try {
      await tenantsApi.deleteService(tenantId, service.id)
      await load()
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setDeletingId(null)
    }
  }

  const totalEndpoints = services.reduce((sum, s) => sum + countEndpoints(s.openapiSpec), 0)

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        {loading ? (
          <p className="mt-20 text-center font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
            loading tenant…
          </p>
        ) : error && !tenant ? (
          <div className="mt-20 rounded-3xl border border-coral/30 bg-coral-soft p-8 text-center">
            <p className="font-display text-lg font-medium text-coral-deep">Couldn't load this tenant</p>
            <p className="mt-2 text-sm text-ink-soft">{error}</p>
            <Link
              to="/app"
              className="mt-5 inline-flex rounded-full border border-coral/40 px-5 py-2 text-sm font-medium text-coral-deep transition-colors hover:bg-coral/10"
            >
              Back to tenants
            </Link>
          </div>
        ) : tenant ? (
          <>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={14} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
              All tenants
            </Link>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[11px] tracking-[0.22em] text-coral-deep uppercase">tenant</p>
                <h1 className="mt-2 font-display text-4xl font-medium tracking-tight md:text-5xl">
                  {tenant.name}
                </h1>
                <p className="mt-2 font-mono text-[11px] text-ink-soft">{tenant.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setNewServiceOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-[15px] font-semibold text-cream-solid transition-colors hover:bg-coral-deep"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
                Connect a service
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-3 font-mono text-[11px] tracking-[0.12em] text-ink-soft uppercase">
              <span className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-coral" /> {services.length} service{services.length === 1 ? '' : 's'}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-leaf" /> {totalEndpoints} endpoint{totalEndpoints === 1 ? '' : 's'} in spec
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-ink-soft" /> 1 bot per service
              </span>
            </div>

            <section className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-medium tracking-tight">System map</h2>
                <span className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
                  tenant → services
                </span>
              </div>
              <div className="mt-4">
                <SystemMap tenant={tenant} services={services} />
              </div>
            </section>

            <section className="mt-12">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-medium tracking-tight">Services</h2>
                <span className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
                  {services.length} connected
                </span>
              </div>

              {services.length === 0 ? (
                <div className="mt-5 rounded-3xl border border-dashed border-line bg-cream p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper-2 text-ink">
                    <HugeiconsIcon icon={WebhookIcon} size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-medium tracking-tight">No services yet</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
                    Connect an OpenAPI spec and a bot token, and Lyrebird stands the bot up for you.
                  </p>
                  <p className="mx-auto mt-4 max-w-sm text-[12px] leading-relaxed text-ink-soft">
                    New to bots? Grab a token from{' '}
                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-coral-deep underline decoration-coral/40 underline-offset-2 transition-colors hover:decoration-coral"
                    >
                      @BotFather
                    </a>{' '}
                    — you'll need it in step one.
                  </p>
                </div>
              ) : (
                <ul className="mt-5 space-y-4">
                  {services.map((service) => (
                    <li
                      key={service.id}
                      className="flex flex-wrap items-center gap-x-6 rounded-3xl border border-line bg-cream p-5 sm:p-6"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-2 text-ink">
                        <HugeiconsIcon icon={WebhookIcon} size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1 pb-4 sm:pb-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-display text-lg font-medium tracking-tight">{service.name}</h3>
                          <span className="rounded-full bg-paper-2 px-2.5 py-0.5 font-mono text-[10px] text-ink-soft uppercase">
                            {countEndpoints(service.openapiSpec)} endpoints
                          </span>
                          <span
                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase ${
                              service.authHeaderName ? 'bg-leaf-soft text-leaf-deep' : 'bg-paper-2 text-ink-soft'
                            }`}
                          >
                            <span className={`h-1 w-1 rounded-full ${service.authHeaderName ? 'bg-leaf' : 'bg-ink-soft/50'}`} />
                            {service.authHeaderName ? `${service.authHeaderName} auth` : 'no auth'}
                          </span>
                        </div>
                        <p className="mt-1 truncate font-mono text-[12px] text-ink-soft">{hostOf(service.baseUrl)}</p>
                      </div>
                      <div className="flex w-full items-center justify-between gap-4 border-t border-line pt-4 sm:w-auto sm:gap-6 sm:border-0 sm:pt-0">
                        <div className="flex min-w-0 flex-col gap-1 font-mono text-[11px] text-ink-soft sm:items-end">
                          <p className="truncate">bot {maskToken(service.botToken)}</p>
                          <p>created {new Date(service.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(service)}
                            aria-label={`Edit ${service.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-ink-soft transition-colors hover:border-coral/40 hover:text-coral-deep"
                          >
                            <HugeiconsIcon icon={Edit01Icon} size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeService(service)}
                            disabled={deletingId === service.id}
                            aria-label={`Delete ${service.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-ink-soft transition-colors hover:border-coral/40 hover:text-coral-deep disabled:opacity-50"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </main>

      {newServiceOpen ? (
        <Modal title="Connect a service" onClose={() => setNewServiceOpen(false)}>
          <form onSubmit={submit} className="space-y-5">
            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">Name <span className="text-coral">*</span></span>
              <input
                autoFocus
                type="text"
                value={form.name}
                onChange={updateField('name')}
                placeholder="Orders API"
                required
                className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] placeholder:text-ink-soft/50 focus:border-coral focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">Base URL <span className="text-coral">*</span></span>
              <input
                type="url"
                value={form.baseUrl}
                onChange={updateField('baseUrl')}
                placeholder="https://api.acme.com"
                required
                className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 font-mono text-[14px] placeholder:text-ink-soft/50 focus:border-coral focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">OpenAPI spec (YAML or JSON) <span className="text-coral">*</span></span>
              <textarea
                value={form.openapiSpec}
                onChange={updateField('openapiSpec')}
                placeholder={'openapi: 3.0.3\ninfo:\n  title: Orders API\npaths:\n  /orders:\n    get:\n      summary: List orders'}
                required
                rows={7}
                spellCheck={false}
                className="mt-2 w-full resize-y rounded-xl border border-line bg-code px-4 py-3 font-mono text-[12px] leading-relaxed text-mint placeholder:text-mint/40 focus:border-coral focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">Bot token (from @BotFather) <span className="text-coral">*</span></span>
              <input
                type="password"
                value={form.botToken}
                onChange={updateField('botToken')}
                placeholder="1234567890:AAE…"
                required
                className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 font-mono text-[14px] placeholder:text-ink-soft/50 focus:border-coral focus:outline-none"
              />
            </label>

            <BotFatherGuide />

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">Auth header name</span>
                <input
                  type="text"
                  value={form.authHeaderName}
                  onChange={updateField('authHeaderName')}
                  placeholder="Authorization"
                  className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 font-mono text-[14px] placeholder:text-ink-soft/50 focus:border-coral focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">Auth header value</span>
                <input
                  type="password"
                  value={form.authHeaderValue}
                  onChange={updateField('authHeaderValue')}
                  placeholder="Bearer sk-…"
                  className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 font-mono text-[14px] placeholder:text-ink-soft/50 focus:border-coral focus:outline-none"
                />
              </label>
            </div>

            {error ? <p className="rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral-deep">{error}</p> : null}

            <p className="text-[12px] leading-relaxed text-ink-soft">
              The spec is validated, the bot token checked via <span className="font-mono">getMe</span>, then a webhook is
              registered before the service is saved.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setNewServiceOpen(false)}
                className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-cream-solid transition-colors hover:bg-coral-deep disabled:opacity-50"
              >
                {submitting ? 'Connecting…' : 'Connect service'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {editing ? (
        <Modal title={`Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={submitEdit} className="space-y-5">
            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">Name</span>
              <input
                autoFocus
                type="text"
                value={editForm.name}
                onChange={updateEditField('name')}
                placeholder="Orders API"
                required
                className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] placeholder:text-ink-soft/50 focus:border-coral focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">Base URL</span>
              <input
                type="url"
                value={editForm.baseUrl}
                onChange={updateEditField('baseUrl')}
                placeholder="https://api.acme.com"
                required
                className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 font-mono text-[14px] placeholder:text-ink-soft/50 focus:border-coral focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">OpenAPI spec (YAML or JSON)</span>
              <textarea
                value={editForm.openapiSpec}
                onChange={updateEditField('openapiSpec')}
                required
                rows={7}
                spellCheck={false}
                className="mt-2 w-full resize-y rounded-xl border border-line bg-code px-4 py-3 font-mono text-[12px] leading-relaxed text-mint placeholder:text-mint/40 focus:border-coral focus:outline-none"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">Auth header name</span>
                <input
                  type="text"
                  value={editForm.authHeaderName}
                  onChange={updateEditField('authHeaderName')}
                  placeholder="Authorization"
                  className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 font-mono text-[14px] placeholder:text-ink-soft/50 focus:border-coral focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">Auth header value</span>
                <input
                  type="password"
                  value={editForm.authHeaderValue}
                  onChange={updateEditField('authHeaderValue')}
                  placeholder="Leave blank to keep the current value"
                  className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 font-mono text-[14px] placeholder:text-ink-soft/50 focus:border-coral focus:outline-none"
                />
              </label>
            </div>

            {error ? <p className="rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral-deep">{error}</p> : null}

            <p className="text-[12px] leading-relaxed text-ink-soft">
              The bot token can't be changed here. Editing the spec or base URL takes effect immediately — cached tools are
              refreshed.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-cream-solid transition-colors hover:bg-coral-deep disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}
