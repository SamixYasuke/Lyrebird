export function countEndpoints(spec: string): number {
  try {
    const parsed = JSON.parse(spec)
    const paths = parsed?.paths
    if (paths && typeof paths === 'object') {
      return Object.keys(paths).length
    }
  } catch {
    // fall through to the YAML heuristic
  }

  let inPaths = false
  let count = 0
  for (const line of spec.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    const indent = line.length - line.trimStart().length
    if (!inPaths) {
      if (/^paths\s*:$/.test(trimmed)) inPaths = true
      continue
    }
    if (indent === 0) break
    if (trimmed.startsWith('/') && indent <= 4) count += 1
  }
  return count
}

export function hostOf(baseUrl: string): string {
  try {
    return new URL(baseUrl).host
  } catch {
    return baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
  }
}

export function maskToken(token: string): string {
  if (token.length <= 8) return '••••'
  return `${token.slice(0, 4)}…${token.slice(-4)}`
}
