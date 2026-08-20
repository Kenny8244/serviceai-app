import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Button } from './ui/button'

const DESKTOP_QUERY = '(min-width: 1024px)'

function isDesktopViewport() {
  return window.matchMedia(DESKTOP_QUERY).matches
}

export function AppLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === 'undefined' ? true : isDesktopViewport()
  )

  useEffect(() => {
    if (!isDesktopViewport()) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY)

    const onChange = () => {
      setSidebarOpen(media.matches)
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!sidebarOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    if (!isDesktopViewport()) {
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = previousOverflow
        window.removeEventListener('keydown', onKeyDown)
      }
    }

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {!sidebarOpen && (
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-slate-900 dark:text-slate-100">ServiceAI</span>
        </div>
      )}

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 lg:w-72 transform transition-transform duration-200 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className={`transition-[margin] duration-200 ${sidebarOpen ? 'lg:ml-64 xl:ml-72' : ''}`}>
        <Outlet />
      </div>
    </div>
  )
}
