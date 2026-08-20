import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <div className="fixed inset-y-0 left-0 z-50 w-64 lg:w-72">
          <Sidebar />
        </div>

        <div className="flex-1 lg:ml-64 xl:ml-72">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
