const VERTICAL_STORAGE_KEY = 'serviceai_verticalId'
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

export function setSelectedVertical(verticalId: string): void {
  try {
    localStorage.setItem(VERTICAL_STORAGE_KEY, verticalId)
  } catch {
    // Ignore quota / private-mode failures; navigation can still use location.state
  }
}
