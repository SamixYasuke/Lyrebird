export const THEME_KEY = 'lyrebird_theme'

export type Theme = 'light' | 'dark'

export function getTheme(): Theme {
  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  meta?.setAttribute('content', theme === 'dark' ? '#131519' : '#faf7f0')
}

export function setTheme(theme: Theme): void {
  window.localStorage.setItem(THEME_KEY, theme)
  applyTheme(theme)
}
