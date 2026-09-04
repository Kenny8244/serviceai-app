import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RouterApp from '@/app/RouterApp'
import { apiService } from '@/services/api'
import { validJwt } from '../helpers/jwt'

const overview = {
  stats: [],
  activities: [],
  aiRecommendation: { title: 'Tip', detail: 'Keep going' },
}

afterEach(() => {
  cleanup()
  apiService.clearAuthToken({ notify: false })
  localStorage.clear()
  sessionStorage.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/dashboard/overview')) {
        return Response.json(overview)
      }
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    })
  )
  window.history.replaceState({}, '', '/')
})

describe('session UI routes', () => {
  it('sends an anonymous visitor from a protected page to sign-in', async () => {
    window.history.pushState({}, '', '/dashboard')
    render(<RouterApp />)

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('keeps a restored session inside the app and bounces /auth away from the form', async () => {
    apiService.setAuthToken(validJwt())
    localStorage.setItem('serviceai_verticalId', 'retail')
    window.history.pushState({}, '', '/auth')
    render(<RouterApp />)

    expect(await screen.findByRole('heading', { name: 'Retail Dashboard' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument()
  })
})
