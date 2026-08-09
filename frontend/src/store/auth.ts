import { create } from 'zustand'
import { authApi } from '@/api/client'
import type { AuthResult } from '@/api/client'
import { clearStoredAuth, getStoredAuth, storeAuth } from '@/lib/auth'
import type { AuthTenant, AuthUser } from '@/lib/auth'

interface AuthStore {
  user: AuthUser | null
  tenant: AuthTenant | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (companyName: string, email: string, password: string) => Promise<void>
  logout: () => void
  hydrate: () => Promise<void>
}

const stored = getStoredAuth()

function applyResult(result: AuthResult) {
  const state = { token: result.token, user: result.user, tenant: result.tenant }
  storeAuth(state)
  useAuth.setState({ token: state.token, user: state.user, tenant: state.tenant })
}

export const useAuth = create<AuthStore>((set) => ({
  user: stored?.user ?? null,
  tenant: stored?.tenant ?? null,
  token: stored?.token ?? null,
  login: async (email, password) => {
    applyResult(await authApi.login({ email, password }))
  },
  signup: async (companyName, email, password) => {
    applyResult(await authApi.signup({ companyName, email, password }))
  },
  logout: () => {
    clearStoredAuth()
    set({ user: null, tenant: null, token: null })
  },
  hydrate: async () => {
    if (!getStoredAuth()) return
    try {
      applyResult(await authApi.me())
    } catch {
      // the 401 interceptor clears the session and redirects to /auth
    }
  },
}))
