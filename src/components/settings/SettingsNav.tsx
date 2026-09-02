import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface SettingsNavItem {
  id: string
  title: string
  description: string
  icon: ReactNode
}

export interface SettingsNavAction {
  title: string
  description: string
  icon: ReactNode
  onClick: () => void
}

interface SettingsNavProps {
  items: SettingsNavItem[]
  activeId: string
  onSelect: (id: string) => void
  footerAction?: SettingsNavAction
}

export function SettingsNav({ items, activeId, onSelect, footerAction }: SettingsNavProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <nav className="space-y-2">
          {items.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors',
                activeId === section.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              {section.icon}
              <div>
                <div className="font-medium text-sm">{section.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {section.description}
                </div>
              </div>
            </button>
          ))}
        </nav>

        {footerAction ? (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={footerAction.onClick}
              className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              {footerAction.icon}
              <div>
                <div className="font-medium text-sm">{footerAction.title}</div>
                <div className="text-xs text-red-600/80 dark:text-red-400">
                  {footerAction.description}
                </div>
              </div>
            </button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
