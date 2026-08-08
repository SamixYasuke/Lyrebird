export function generateDeviceKey(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `lb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function getDeviceKey(): string {
  let key = window.localStorage.getItem('lyrebird_admin_key')
  if (!key) {
    key = generateDeviceKey()
    window.localStorage.setItem('lyrebird_admin_key', key)
  }
  return key
}

export function resetDeviceKey(): string {
  const key = generateDeviceKey()
  window.localStorage.setItem('lyrebird_admin_key', key)
  return key
}

export function maskKey(key: string): string {
  if (key.length <= 10) return key
  return `${key.slice(0, 6)}…${key.slice(-4)}`
}
