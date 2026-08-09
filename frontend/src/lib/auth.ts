export interface AuthUser {
  id: string
  email: string
}

export interface AuthTenant {
  id: string
  name: string
}

export interface AuthState {
  token: string
  user: AuthUser
  tenant: AuthTenant
}

const AUTH_KEY = 'lyrebird_auth'

export function getStoredAuth(): AuthState | null {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthState
    if (!parsed?.token || !parsed?.user?.id || !parsed?.tenant?.id) return null
    return parsed
  } catch {
    return null
  }
}

export function storeAuth(state: AuthState): void {
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(state))
}

export function clearStoredAuth(): void {
  window.localStorage.removeItem(AUTH_KEY)
}
