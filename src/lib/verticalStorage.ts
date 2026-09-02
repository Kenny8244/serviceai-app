const VERTICAL_STORAGE_KEY = 'serviceai_verticalId'
const VERTICAL_OWNER_KEY = 'serviceai_verticalOwner'
const DEFAULT_VERTICAL = 'retail'

export function getSelectedVertical(fromState?: string): string {
  if (fromState) {
    return fromState
  }

  try {
    return localStorage.getItem(VERTICAL_STORAGE_KEY) || DEFAULT_VERTICAL
  } catch {
    return DEFAULT_VERTICAL
  }
}

export function hasSelectedVertical(): boolean {
  try {
    const value = localStorage.getItem(VERTICAL_STORAGE_KEY)
    return Boolean(value)
  } catch {
    return false
  }
}

export function getStoredVerticalForUser(userId: string): string | null {
  try {
    const value = localStorage.getItem(VERTICAL_STORAGE_KEY)
    if (!value) return null
    const owner = localStorage.getItem(VERTICAL_OWNER_KEY)
    if (!owner || owner === userId) return value
    return null
  } catch {
    return null
  }
}

export function setSelectedVertical(verticalId: string, userId?: string): void {
  try {
    localStorage.setItem(VERTICAL_STORAGE_KEY, verticalId)
    if (userId) {
      localStorage.setItem(VERTICAL_OWNER_KEY, userId)
    }
  } catch {
    // Ignore quota / private-mode failures; navigation can still use location.state
  }
}

export function clearSelectedVertical(): void {
  try {
    localStorage.removeItem(VERTICAL_STORAGE_KEY)
    localStorage.removeItem(VERTICAL_OWNER_KEY)
  } catch {
    // Ignore storage failures
  }
}
