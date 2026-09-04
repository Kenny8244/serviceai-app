import { afterEach, describe, expect, it, vi } from 'vitest'
import { isPublicAuthUrl } from '@/lib/authSession'
import { apiService } from '@/services/api'
import { expiredJwt, validJwt } from './helpers/jwt'

function jsonResponse(status: number, body: unknown, url: string): Response {
  const response = new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
  Object.defineProperty(response, 'url', { value: url })
  return response
}

afterEach(() => {
  apiService.clearAuthToken({ notify: false })
  localStorage.clear()
  sessionStorage.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('isPublicAuthUrl', () => {
  it('treats login, register, and demo as public', () => {
    expect(isPublicAuthUrl('http://localhost:5173/api/auth/login')).toBe(true)
    expect(isPublicAuthUrl('http://127.0.0.1:8787/api/auth/register')).toBe(true)
    expect(isPublicAuthUrl('http://localhost/api/auth/demo')).toBe(true)
  })

  it('treats protected APIs as session-ending', () => {
    expect(isPublicAuthUrl('http://localhost/api/assets')).toBe(false)
    expect(isPublicAuthUrl('http://localhost/api/dashboard/metrics')).toBe(false)
  })
})

describe('auth token persist and restore', () => {
  it('stores the session in localStorage so it survives browser close', () => {
    const token = validJwt()
    apiService.setAuthToken(token)

    expect(localStorage.getItem('authToken')).toBe(token)
    expect(sessionStorage.getItem('authToken')).toBeNull()
    expect(apiService.isAuthenticated()).toBe(true)
  })

  it('moves a leftover sessionStorage token into localStorage', () => {
    const token = validJwt()
    sessionStorage.setItem('authToken', token)
    sessionStorage.setItem('authUserId', 'user-1')

    expect(apiService.getAuthToken()).toBe(token)
    expect(localStorage.getItem('authToken')).toBe(token)
    expect(sessionStorage.getItem('authToken')).toBeNull()
    expect(apiService.isAuthenticated()).toBe(true)
  })

  it('treats an expired or malformed token as signed out', () => {
    apiService.setAuthToken(expiredJwt())
    expect(apiService.isAuthenticated()).toBe(false)
    expect(localStorage.getItem('authToken')).toBeNull()

    apiService.setAuthToken('not-a-jwt')
    expect(apiService.isAuthenticated()).toBe(false)
    expect(localStorage.getItem('authToken')).toBeNull()
  })
})

describe('session interceptor', () => {
  it('clears the session on 403 from a protected API', async () => {
    apiService.setAuthToken(validJwt())
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(403, { error: 'Invalid or expired token' }, 'http://localhost/api/assets?')
      )
    )

    await expect(apiService.getAssets()).rejects.toMatchObject({ status: 403 })
    expect(apiService.isAuthenticated()).toBe(false)
    expect(localStorage.getItem('authToken')).toBeNull()
  })

  it('does not clear a valid session on failed login', async () => {
    const token = validJwt()
    apiService.setAuthToken(token)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          401,
          { error: 'Invalid email or password' },
          'http://localhost/api/auth/login'
        )
      )
    )

    await expect(
      apiService.login({ email: 'a@b.c', password: 'wrong' })
    ).rejects.toMatchObject({ status: 401 })
    expect(apiService.getAuthToken()).toBe(token)
    expect(apiService.isAuthenticated()).toBe(true)
  })
})
