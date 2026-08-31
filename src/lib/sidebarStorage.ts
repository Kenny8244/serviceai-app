const SIDEBAR_COLLAPSED_KEY = 'serviceai_sidebarCollapsed'

export function getDesktopSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

export function setDesktopSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? 'true' : 'false')
  } catch {
    // Ignore quota / private-mode failures; in-memory state still works
  }
}
