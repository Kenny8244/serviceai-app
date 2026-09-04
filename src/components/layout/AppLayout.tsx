import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Button } from '@/components/ui/button'
import { getDesktopSidebarCollapsed, setDesktopSidebarCollapsed } from '@/lib/sidebarStorage'
import { HeaderSlot, LayoutSlotsProvider } from './LayoutSlots'
import { ImportProgressPanel } from './ImportProgressPanel'

const DESKTOP_QUERY = '(min-width: 1024px)'

function isDesktopViewport() {
  return window.matchMedia(DESKTOP_QUERY).matches
}

export function AppLayout() {
  const location = useLocation()
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? true : isDesktopViewport()
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(() =>
    typeof window === 'undefined' ? false : getDesktopSidebarCollapsed()
  )

  const persistCollapsed = (collapsed: boolean) => {
    setDesktopCollapsed(collapsed)
    setDesktopSidebarCollapsed(collapsed)
  }

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY)

    const onChange = () => {
      setIsDesktop(media.matches)
      if (!media.matches) {
        setMobileOpen(false)
      }
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      if (!isDesktopViewport()) {
        setMobileOpen(false)
        return
      }

      persistCollapsed(true)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (isDesktop || !mobileOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isDesktop, mobileOpen])

  const sidebarVisible = isDesktop || mobileOpen
  const sidebarCollapsed = isDesktop && desktopCollapsed

  return (
    <LayoutSlotsProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {!isDesktop && !mobileOpen && (
          <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-3 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-foreground">ServiceAI</span>
          </div>
        )}

        {mobileOpen && !isDesktop && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div
          className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-200 ${
            sidebarCollapsed ? 'w-16' : 'w-64 lg:w-72'
          } ${
            sidebarVisible ? 'translate-x-0' : '-translate-x-full pointer-events-none'
          }`}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            isDesktop={isDesktop}
            onClose={() => setMobileOpen(false)}
            onToggleCollapsed={() => persistCollapsed(!desktopCollapsed)}
          />
        </div>

        <div
          className={`flex flex-1 flex-col min-h-0 transition-[margin] duration-200 ${
            isDesktop ? (desktopCollapsed ? 'lg:ml-16' : 'lg:ml-72') : ''
          }`}
        >
          <HeaderSlot />
          <div className="flex flex-1 flex-col min-h-0">
            <Outlet />
          </div>
        </div>
        <ImportProgressPanel />
      </div>
    </LayoutSlotsProvider>
  )
}
