import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface PageTab {
  id: string
  label: string
  icon?: ReactNode
}

interface PageTabsProps {
  tabs: PageTab[]
  value: string
  onChange: (id: string) => void
}

export function PageTabs({ tabs, value, onChange }: PageTabsProps) {
  return (
    <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1',
            value === tab.id
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
