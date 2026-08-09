import axios from 'axios'
import { clearStoredAuth, getStoredAuth } from '@/lib/auth'

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const auth = getStoredAuth()
  if (auth?.token) config.headers.set('Authorization', `Bearer ${auth.token}`)
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? ''
      if (!url.includes('/auth/login') && !url.includes('/auth/signup')) {
        clearStoredAuth()
        window.location.assign('/auth')
      }
    }
    return Promise.reject(error)
  },
)

export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message: string | string[] }).message
      return Array.isArray(message) ? message.join(' · ') : message
    }
    if (err.response?.status === 401 || err.response?.status === 403) {
      return 'Forbidden — sign in and try again.'
    }
    return err.message
  }
  return err instanceof Error ? err.message : 'Something went wrong'
}

export interface AuthResult {
  token: string
  user: { id: string; email: string }
  tenant: { id: string; name: string }
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

export const authApi = {
  signup: (payload: { companyName: string; email: string; password: string }) =>
    api.post<AuthResult>('/auth/signup', payload).then((r) => r.data),
  login: (payload: { email: string; password: string }) =>
    api.post<AuthResult>('/auth/login', payload).then((r) => r.data),
  me: () => api.get<AuthResult>('/auth/me').then((r) => r.data),
}

export const tenantsApi = {
  list: () => api.get<Tenant[]>('/tenants').then((r) => r.data),
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
