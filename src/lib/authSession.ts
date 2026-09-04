type AuthSessionListener = () => void

export function isPublicAuthUrl(url: string): boolean {
  if (!url) return false
  try {
    const path = new URL(url, 'http://local.invalid').pathname.replace(/\/+$/, '')
    return (
      path.endsWith('/auth/login') ||
      path.endsWith('/auth/register') ||
      path.endsWith('/auth/demo')
    )
  } catch {
    return false
  }
}

const listeners = new Set<AuthSessionListener>()
let version = 0

export function getAuthSessionVersion(): number {
  return version
}

export function subscribeAuthSession(listener: AuthSessionListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifyAuthSessionChanged(): void {
  version += 1
  listeners.forEach((listener) => listener())
}
