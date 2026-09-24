import type { Env } from '../types'

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly'

export class GoogleSheetsError extends Error {
  constructor(
    message: string,
    public status: 400 | 401 | 502 = 502
  ) {
    super(message)
    this.name = 'GoogleSheetsError'
  }
}

export type GoogleSpreadsheet = {
  id: string
  name: string
  modifiedTime: string | null
}

function requireGoogle(env: Env): { clientId: string; clientSecret: string } {
  const clientId = env.GOOGLE_CLIENT_ID?.trim() ?? ''
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim() ?? ''
  if (!clientId || !clientSecret) {
    throw new GoogleSheetsError('Google Sheets is not configured.', 400)
  }
  return { clientId, clientSecret }
}

export function googleAuthUrl(env: Env, redirectUri: string, state: string): string {
  const { clientId } = requireGoogle(env)
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', `${SHEETS_SCOPE} ${DRIVE_SCOPE}`)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('state', state)
  return url.toString()
}

async function postToken(body: URLSearchParams): Promise<{ accessToken: string; refreshToken: string | null }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string
    refresh_token?: string
    error?: string
    error_description?: string
  }
  if (!response.ok || !payload.access_token) {
    const expired = payload.error === 'invalid_grant'
    throw new GoogleSheetsError(
      expired
        ? 'Google access expired. Connect the sheet again.'
        : payload.error_description || 'Google did not return an access token.',
      expired ? 401 : 502
    )
  }
  return { accessToken: payload.access_token, refreshToken: payload.refresh_token ?? null }
}

export async function exchangeAuthCode(
  env: Env,
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string | null }> {
  const { clientId, clientSecret } = requireGoogle(env)
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })
  return postToken(body)
}

export async function refreshAccessToken(env: Env, refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = requireGoogle(env)
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  })
  const tokens = await postToken(body)
  return tokens.accessToken
}

async function googleGet<T>(accessToken: string, url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (response.status === 401) {
    throw new GoogleSheetsError('Google access expired. Connect the sheet again.', 401)
  }
  if (!response.ok) {
    throw new GoogleSheetsError(`Google Sheets request failed (${response.status}).`, 502)
  }
  return (await response.json()) as T
}

export async function listSpreadsheets(accessToken: string): Promise<GoogleSpreadsheet[]> {
  const url = new URL('https://www.googleapis.com/drive/v3/files')
  url.searchParams.set('q', "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false")
  url.searchParams.set('fields', 'files(id,name,modifiedTime)')
  url.searchParams.set('pageSize', '50')
  url.searchParams.set('orderBy', 'modifiedTime desc')
  const data = await googleGet<{ files?: Array<{ id?: string; name?: string; modifiedTime?: string }> }>(
    accessToken,
    url.toString()
  )
  return (data.files ?? [])
    .filter((file) => file.id && file.name)
    .map((file) => ({
      id: file.id as string,
      name: file.name as string,
      modifiedTime: file.modifiedTime ?? null,
    }))
}

export async function listSheetTitles(accessToken: string, spreadsheetId: string): Promise<string[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties.title`
  const data = await googleGet<{ sheets?: Array<{ properties?: { title?: string } }> }>(accessToken, url)
  return (data.sheets ?? [])
    .map((sheet) => sheet.properties?.title?.trim() ?? '')
    .filter(Boolean)
}

export async function readSheetTable(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<{ headers: string[]; rows: string[][] }> {
  const safeName = sheetName.replace(/'/g, "''")
  const range = encodeURIComponent(`'${safeName}'!A:Z`)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}`
  const data = await googleGet<{ values?: string[][] }>(accessToken, url)
  const values = data.values ?? []
  if (values.length === 0) {
    return { headers: [], rows: [] }
  }
  const headers = (values[0] ?? []).map((cell) => String(cell ?? ''))
  const rows = values.slice(1).map((row) => row.map((cell) => String(cell ?? '')))
  return { headers, rows }
}
