export function makeJwt(payload: { userId?: string; exp?: number }): string {
  const header = encodePart({ alg: 'none', typ: 'JWT' })
  const body = encodePart(payload)
  return `${header}.${body}.sig`
}

export function validJwt(userId = 'user-1'): string {
  return makeJwt({
    userId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  })
}

export function expiredJwt(userId = 'user-1'): string {
  return makeJwt({ userId, exp: 1 })
}

function encodePart(value: unknown): string {
  const json = JSON.stringify(value)
  if (typeof btoa === 'function') {
    return btoa(json).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  }
  return Buffer.from(json).toString('base64url')
}
