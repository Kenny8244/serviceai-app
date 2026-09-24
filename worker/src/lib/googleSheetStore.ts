import type { Env } from '../types'

const INDEX_KEY = 'gsheet:index'

export type SheetSyncCounts = {
  created: number
  updated: number
  skipped: number
}

export type SheetSyncCursor = {
  offset: number
  total: number
  created: number
  updated: number
  skipped: number
}

export type SheetLink = {
  workspaceId: string
  userId: string
  refreshToken: string
  spreadsheetId: string | null
  spreadsheetName: string | null
  sheetName: string | null
  connectedAt: string
  lastSyncAt: string | null
  lastError: string | null
  lastResult: SheetSyncCounts | null
  syncCursor: SheetSyncCursor | null
}

export type OAuthState = {
  userId: string
  workspaceId: string
  redirectUri: string
  returnTo: string
}

function linkKey(workspaceId: string): string {
  return `gsheet:link:${workspaceId}`
}

function stateKey(state: string): string {
  return `gsheet:oauth:${state}`
}

function finishedRows(result: SheetSyncCounts | null): number {
  if (!result) return 0
  return result.created + result.updated
}

export function publicSheetLink(link: SheetLink | null) {
  if (!link) {
    return {
      connected: false,
      spreadsheetId: null,
      spreadsheetName: null,
      sheetName: null,
      lastSyncAt: null,
      lastError: null,
      lastResult: null,
      syncDone: true,
      syncProcessed: 0,
      syncTotal: 0,
    }
  }

  const processed = link.syncCursor?.offset ?? finishedRows(link.lastResult)
  return {
    connected: true,
    spreadsheetId: link.spreadsheetId,
    spreadsheetName: link.spreadsheetName,
    sheetName: link.sheetName,
    lastSyncAt: link.lastSyncAt,
    lastError: link.lastError,
    lastResult: link.lastResult,
    syncDone: !link.syncCursor,
    syncProcessed: processed,
    syncTotal: link.syncCursor?.total ?? processed,
  }
}

export async function getSheetLink(kv: KVNamespace, workspaceId: string): Promise<SheetLink | null> {
  const raw = await kv.get(linkKey(workspaceId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as SheetLink
  } catch {
    return null
  }
}

export async function saveSheetLink(kv: KVNamespace, link: SheetLink): Promise<void> {
  await kv.put(linkKey(link.workspaceId), JSON.stringify(link))
  if (link.spreadsheetId && link.sheetName) {
    await addToIndex(kv, link.workspaceId)
  } else {
    await removeFromIndex(kv, link.workspaceId)
  }
}

export async function deleteSheetLink(kv: KVNamespace, workspaceId: string): Promise<void> {
  await kv.delete(linkKey(workspaceId))
  await removeFromIndex(kv, workspaceId)
}

export async function listLinkedWorkspaceIds(kv: KVNamespace): Promise<string[]> {
  const raw = await kv.get(INDEX_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

async function addToIndex(kv: KVNamespace, workspaceId: string): Promise<void> {
  const ids = await listLinkedWorkspaceIds(kv)
  if (ids.includes(workspaceId)) return
  await kv.put(INDEX_KEY, JSON.stringify([...ids, workspaceId]))
}

async function removeFromIndex(kv: KVNamespace, workspaceId: string): Promise<void> {
  const ids = await listLinkedWorkspaceIds(kv)
  if (!ids.includes(workspaceId)) return
  await kv.put(INDEX_KEY, JSON.stringify(ids.filter((id) => id !== workspaceId)))
}

export async function putOAuthState(kv: KVNamespace, state: string, value: OAuthState): Promise<void> {
  await kv.put(stateKey(state), JSON.stringify(value), { expirationTtl: 600 })
}

export async function takeOAuthState(kv: KVNamespace, state: string): Promise<OAuthState | null> {
  const key = stateKey(state)
  const raw = await kv.get(key)
  await kv.delete(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as OAuthState
  } catch {
    return null
  }
}

export function googleSheetsConfigured(env: Env): boolean {
  const id = env.GOOGLE_CLIENT_ID?.trim() ?? ''
  const secret = env.GOOGLE_CLIENT_SECRET?.trim() ?? ''
  if (!id || !secret) return false
  if (id.startsWith('your-') || secret.startsWith('your-')) return false
  return true
}
