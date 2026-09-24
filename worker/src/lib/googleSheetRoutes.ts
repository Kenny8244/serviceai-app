import type { Hono, MiddlewareHandler } from 'hono'
import { generateId } from './crypto'
import {
  exchangeAuthCode,
  googleAuthUrl,
  GoogleSheetsError,
  listSheetTitles,
  listSpreadsheets,
  refreshAccessToken,
} from './googleSheetsApi'
import {
  deleteSheetLink,
  getSheetLink,
  googleSheetsConfigured,
  publicSheetLink,
  putOAuthState,
  saveSheetLink,
  takeOAuthState,
  type SheetLink,
} from './googleSheetStore'
import { syncSheetLink } from './sheetSync'
import type { Env, JwtPayload, Variables } from '../types'

const EXTRA_ORIGINS = ['http://localhost:5173', 'https://serviceai-app.pages.dev']

function returnOrigin(env: Env, origin: string | undefined): string {
  if (origin && (origin === env.FRONTEND_URL || EXTRA_ORIGINS.includes(origin))) return origin
  return env.FRONTEND_URL
}

function callbackUri(env: Env, requestUrl: string): string {
  const configured = env.GOOGLE_REDIRECT_URI?.trim()
  if (configured) return configured
  return `${new URL(requestUrl).origin}/api/integrations/google-sheets/callback`
}

function workspaceIdOf(user: JwtPayload): string {
  const workspaceId = user.workspaceId?.trim()
  if (!workspaceId) {
    throw new GoogleSheetsError('No workspace found for this account.', 400)
  }
  return workspaceId
}

async function accessTokenFor(env: Env, link: SheetLink): Promise<string> {
  return refreshAccessToken(env, link.refreshToken)
}

export function mountGoogleSheetRoutes(
  app: Hono<{ Bindings: Env; Variables: Variables }>,
  requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: Variables }>
) {
  app.get('/api/integrations/google-sheets', requireAuth, async (c) => {
    const user = c.get('user')
    const workspaceId = user.workspaceId?.trim()
    const link = workspaceId ? await getSheetLink(c.env.DEMO_KV, workspaceId) : null
    return c.json({
      configured: googleSheetsConfigured(c.env),
      ...publicSheetLink(link),
    })
  })

  app.post('/api/integrations/google-sheets/connect', requireAuth, async (c) => {
    if (!googleSheetsConfigured(c.env)) {
      return c.json({ error: 'Google Sheets is not configured.' }, 503)
    }
    try {
      const user = c.get('user')
      const workspaceId = workspaceIdOf(user)
      const state = generateId()
      const redirectUri = callbackUri(c.env, c.req.url)
      await putOAuthState(c.env.DEMO_KV, state, {
        userId: user.userId,
        workspaceId,
        redirectUri,
        returnTo: returnOrigin(c.env, c.req.header('origin')),
      })
      return c.json({ url: googleAuthUrl(c.env, redirectUri, state) })
    } catch (error) {
      return sheetError(c, error)
    }
  })

  app.get('/api/integrations/google-sheets/callback', async (c) => {
    const state = c.req.query('state') ?? ''
    const code = c.req.query('code') ?? ''
    const saved = state ? await takeOAuthState(c.env.DEMO_KV, state) : null
    const returnTo = saved?.returnTo || c.env.FRONTEND_URL
    const fail = (message: string) =>
      c.redirect(`${returnTo}/assets?sheets=error&message=${encodeURIComponent(message)}`)

    if (!saved || !code) return fail('Google sign-in did not finish. Try connecting again.')
    if (!googleSheetsConfigured(c.env)) return fail('Google Sheets is not configured.')

    try {
      const tokens = await exchangeAuthCode(c.env, code, saved.redirectUri)
      const existing = await getSheetLink(c.env.DEMO_KV, saved.workspaceId)
      const refreshToken = tokens.refreshToken || existing?.refreshToken
      if (!refreshToken) {
        return fail('Google did not return a refresh token. Remove SimpleServiceAI from your Google Account and connect again.')
      }
      const link: SheetLink = {
        workspaceId: saved.workspaceId,
        userId: saved.userId,
        refreshToken,
        spreadsheetId: existing?.spreadsheetId ?? null,
        spreadsheetName: existing?.spreadsheetName ?? null,
        sheetName: existing?.sheetName ?? null,
        connectedAt: new Date().toISOString(),
        lastSyncAt: existing?.lastSyncAt ?? null,
        lastError: null,
        lastResult: existing?.lastResult ?? null,
      }
      await saveSheetLink(c.env.DEMO_KV, link)
      return c.redirect(`${returnTo}/assets?sheets=pick`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not connect Google Sheets.'
      return fail(message)
    }
  })

  app.get('/api/integrations/google-sheets/spreadsheets', requireAuth, async (c) => {
    try {
      const link = await requireConnected(c.env, workspaceIdOf(c.get('user')))
      const accessToken = await accessTokenFor(c.env, link)
      const spreadsheets = await listSpreadsheets(accessToken)
      return c.json({ spreadsheets })
    } catch (error) {
      return sheetError(c, error)
    }
  })

  app.get('/api/integrations/google-sheets/tabs', requireAuth, async (c) => {
    try {
      const spreadsheetId = c.req.query('spreadsheetId')?.trim() ?? ''
      if (!spreadsheetId) return c.json({ error: 'spreadsheetId is required' }, 400)
      const link = await requireConnected(c.env, workspaceIdOf(c.get('user')))
      const accessToken = await accessTokenFor(c.env, link)
      const sheets = await listSheetTitles(accessToken, spreadsheetId)
      return c.json({ sheets })
    } catch (error) {
      return sheetError(c, error)
    }
  })

  app.post('/api/integrations/google-sheets/link', requireAuth, async (c) => {
    try {
      const user = c.get('user')
      const workspaceId = workspaceIdOf(user)
      const body = await c.req.json<{
        spreadsheetId?: string
        spreadsheetName?: string
        sheetName?: string
      }>()
      const spreadsheetId = body.spreadsheetId?.trim() ?? ''
      const sheetName = body.sheetName?.trim() ?? ''
      if (!spreadsheetId || !sheetName) {
        return c.json({ error: 'spreadsheetId and sheetName are required' }, 400)
      }
      const existing = await requireConnected(c.env, workspaceId)
      const accessToken = await accessTokenFor(c.env, existing)
      const titles = await listSheetTitles(accessToken, spreadsheetId)
      if (!titles.includes(sheetName)) {
        return c.json({ error: 'That tab was not found in the spreadsheet.' }, 400)
      }
      const linked: SheetLink = {
        ...existing,
        userId: user.userId,
        spreadsheetId,
        spreadsheetName: body.spreadsheetName?.trim() || existing.spreadsheetName,
        sheetName,
        lastError: null,
      }
      await saveSheetLink(c.env.DEMO_KV, linked)
      const synced = await syncSheetLink(c.env, linked)
      return c.json({
        configured: true,
        ...publicSheetLink(synced),
      })
    } catch (error) {
      return sheetError(c, error)
    }
  })

  app.post('/api/integrations/google-sheets/sync', requireAuth, async (c) => {
    try {
      const link = await requireConnected(c.env, workspaceIdOf(c.get('user')))
      if (!link.spreadsheetId || !link.sheetName) {
        return c.json({ error: 'Choose a spreadsheet before syncing.' }, 400)
      }
      const synced = await syncSheetLink(c.env, link)
      return c.json({
        configured: googleSheetsConfigured(c.env),
        ...publicSheetLink(synced),
      })
    } catch (error) {
      return sheetError(c, error)
    }
  })

  app.delete('/api/integrations/google-sheets', requireAuth, async (c) => {
    try {
      const workspaceId = workspaceIdOf(c.get('user'))
      await deleteSheetLink(c.env.DEMO_KV, workspaceId)
      return c.json({
        configured: googleSheetsConfigured(c.env),
        ...publicSheetLink(null),
      })
    } catch (error) {
      return sheetError(c, error)
    }
  })
}

async function requireConnected(env: Env, workspaceId: string): Promise<SheetLink> {
  const link = await getSheetLink(env.DEMO_KV, workspaceId)
  if (!link?.refreshToken) {
    throw new GoogleSheetsError('Connect Google Sheets first.', 400)
  }
  return link
}

function sheetError(c: { json: (body: unknown, status?: number) => Response }, error: unknown) {
  if (error instanceof GoogleSheetsError) {
    return c.json({ error: error.message }, error.status)
  }
  console.error('Google Sheets route failed:', error)
  return c.json({ error: 'Could not update the Google Sheets connection.' }, 500)
}
