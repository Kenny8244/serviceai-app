export type WorkspaceNotificationPreferences = {
  email: boolean
  push: boolean
  sms: boolean
}

export type WorkspacePreferences = {
  timezone: string
  language: string
  notifications: WorkspaceNotificationPreferences
}

export type WorkspacePreferencesSnapshot = {
  workspaceId: string
  businessName: string
  preferences: WorkspacePreferences
}

export const DEFAULT_WORKSPACE_PREFERENCES: WorkspacePreferences = {
  timezone: 'America/New_York',
  language: 'en',
  notifications: {
    email: true,
    push: false,
    sms: false,
  },
}

const PREFS_STORAGE_KEY = 'serviceai_workspacePreferences'
const PREFS_OWNER_KEY = 'serviceai_workspacePreferencesOwner'

export function getCachedWorkspacePreferences(
  userId?: string | null
): WorkspacePreferencesSnapshot | null {
  try {
    if (userId) {
      const owner = localStorage.getItem(PREFS_OWNER_KEY)
      if (owner && owner !== userId) return null
    }
    const raw = localStorage.getItem(PREFS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WorkspacePreferencesSnapshot
    if (!parsed?.workspaceId || typeof parsed.businessName !== 'string') return null
    return {
      workspaceId: parsed.workspaceId,
      businessName: parsed.businessName,
      preferences: {
        timezone: parsed.preferences?.timezone || DEFAULT_WORKSPACE_PREFERENCES.timezone,
        language: parsed.preferences?.language || DEFAULT_WORKSPACE_PREFERENCES.language,
        notifications: {
          email:
            typeof parsed.preferences?.notifications?.email === 'boolean'
              ? parsed.preferences.notifications.email
              : DEFAULT_WORKSPACE_PREFERENCES.notifications.email,
          push:
            typeof parsed.preferences?.notifications?.push === 'boolean'
              ? parsed.preferences.notifications.push
              : DEFAULT_WORKSPACE_PREFERENCES.notifications.push,
          sms:
            typeof parsed.preferences?.notifications?.sms === 'boolean'
              ? parsed.preferences.notifications.sms
              : DEFAULT_WORKSPACE_PREFERENCES.notifications.sms,
        },
      },
    }
  } catch {
    return null
  }
}

export function setCachedWorkspacePreferences(
  snapshot: WorkspacePreferencesSnapshot,
  userId?: string | null
): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(snapshot))
    if (userId) {
      localStorage.setItem(PREFS_OWNER_KEY, userId)
    }
  } catch {
    // Ignore quota / private-mode failures
  }
}

export function clearCachedWorkspacePreferences(): void {
  try {
    localStorage.removeItem(PREFS_STORAGE_KEY)
    localStorage.removeItem(PREFS_OWNER_KEY)
  } catch {
    // Ignore storage failures
  }
}
