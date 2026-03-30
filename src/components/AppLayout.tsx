import React from 'react'
import { Sidebar } from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
}

export function AppLayout({ children, showSidebar = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:w-72">
            <Sidebar />
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 ${showSidebar ? 'lg:ml-64 xl:ml-72' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
