import axios from 'axios'
import { getDeviceKey } from '@/lib/device'

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  config.headers.set('X-Admin-Key', getDeviceKey())
  return config
})

export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message: string | string[] }).message
      return Array.isArray(message) ? message.join(' · ') : message
    }
    if (err.response?.status === 401 || err.response?.status === 403) {
      return 'Forbidden — check the admin API key.'
    }
    return err.message
  }
  return err instanceof Error ? err.message : 'Something went wrong'
}

export interface Tenant {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  services?: Service[]
}

export interface Service {
  id: string
  tenantId: string
  name: string
  baseUrl: string
  openapiSpec: string
  botToken: string
  authHeaderName: string | null
  authHeaderValue: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTenantPayload {
  name: string
}

export interface CreateServicePayload {
  name: string
  baseUrl: string
  openapiSpec: string
  botToken: string
  authHeaderName?: string
  authHeaderValue?: string
}

export interface UpdateServicePayload {
  name?: string
  baseUrl?: string
  openapiSpec?: string
  authHeaderName?: string
  authHeaderValue?: string
}

export const tenantsApi = {
  list: () => api.get<Tenant[]>('/tenants').then((r) => r.data),
  create: (payload: CreateTenantPayload) =>
    api.post<Tenant>('/tenants', payload).then((r) => r.data),
  get: (tenantId: string) => api.get<Tenant>(`/tenants/${tenantId}`).then((r) => r.data),
  services: (tenantId: string) =>
    api.get<Service[]>(`/tenants/${tenantId}/services`).then((r) => r.data),
  createService: (tenantId: string, payload: CreateServicePayload) =>
    api.post<Service>(`/tenants/${tenantId}/services`, payload).then((r) => r.data),
  updateService: (tenantId: string, serviceId: string, payload: UpdateServicePayload) =>
    api.patch<Service>(`/tenants/${tenantId}/services/${serviceId}`, payload).then((r) => r.data),
  deleteService: (tenantId: string, serviceId: string) =>
    api.delete<{ ok: boolean }>(`/tenants/${tenantId}/services/${serviceId}`).then((r) => r.data),
}
