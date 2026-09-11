const WORKSPACE_STORAGE_KEY = 'serviceai_workspaceId'
const WORKSPACE_OWNER_KEY = 'serviceai_workspaceOwner'

export function getActiveWorkspaceId(userId?: string | null): string | null {
  try {
    const value = localStorage.getItem(WORKSPACE_STORAGE_KEY)
    if (!value) return null
    if (!userId) return value
    const owner = localStorage.getItem(WORKSPACE_OWNER_KEY)
    if (!owner || owner === userId) return value
    return null
  } catch {
    return null
  }
}

export function setActiveWorkspaceId(workspaceId: string, userId?: string | null): void {
  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId)
    if (userId) {
      localStorage.setItem(WORKSPACE_OWNER_KEY, userId)
    }
  } catch {
    // Ignore quota / private-mode failures
  }
}

export function clearActiveWorkspaceId(): void {
  try {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY)
    localStorage.removeItem(WORKSPACE_OWNER_KEY)
  } catch {
    // Ignore storage failures
  }
}
