import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { getSelectedVertical } from '@/lib/verticalStorage'
import { getVerticalContent } from '@/lib/verticalContent'
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Users,
  Bot,
  Settings,
  X,
  Search,
  Plus,
  MessageSquare,
  HelpCircle,
  ChevronRight,
} from 'lucide-react'

interface NavigationItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
  badge?: string
  disabled?: boolean
  children?: NavigationItem[]
}

interface SidebarProps {
  className?: string
  collapsed?: boolean
  isDesktop?: boolean
  onClose?: () => void
  onToggleCollapsed?: () => void
}

export function Sidebar({
  className = '',
  collapsed = false,
  isDesktop = false,
  onClose,
  onToggleCollapsed,
}: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const assetsLabel = getVerticalContent(getSelectedVertical()).navAssetsLabel

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/dashboard',
    },
    {
      id: 'assets',
      label: assetsLabel,
      icon: <Package className="h-5 w-5" />,
      path: '/assets',
      children: [
        { id: 'import', label: 'Import Data', icon: <Plus className="h-4 w-4" />, path: '/assets/import' },
        { id: 'manage', label: 'Manage Items', icon: <Package className="h-4 w-4" />, path: '/assets/manage', disabled: true },
        { id: 'reports', label: 'Inventory Reports', icon: <BarChart3 className="h-4 w-4" />, path: '/assets/reports', disabled: true },
      ],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/analytics',
      badge: 'New',
    },
    {
      id: 'team',
      label: 'Team',
      icon: <Users className="h-5 w-5" />,
      path: '/team',
    },
    {
      id: 'ai-hub',
      label: 'AI Hub',
      icon: <Bot className="h-5 w-5" />,
      path: '/ai-hub',
      badge: 'AI',
    },
  ]

  const quickActions: NavigationItem[] = [
    {
      id: 'ask-ai',
      label: 'Ask AI Assistant',
      icon: <MessageSquare className="h-5 w-5" />,
      path: '/soon/ask-ai',
      disabled: true,
    },
    {
      id: 'search',
      label: 'Search Everything',
      icon: <Search className="h-5 w-5" />,
      path: '/soon/search',
      disabled: true,
    },
    {
      id: 'help',
      label: 'Get Help',
      icon: <HelpCircle className="h-5 w-5" />,
      path: '/soon/help',
      disabled: true,
    },
  ]

  const settingsItem: NavigationItem = {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    path: '/settings',
  }

  const handleNavigation = (path: string, disabled?: boolean) => {
    if (disabled) return
    navigate(path)
    if (!isDesktop) {
      onClose?.()
    }
  }

  const handleHeaderAction = () => {
    if (isDesktop) {
      onToggleCollapsed?.()
      return
    }
    onClose?.()
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const renderNavButton = (item: NavigationItem, options?: { muted?: boolean }) => {
    const active = !item.disabled && isActive(item.path)
    const muted = Boolean(options?.muted || item.disabled)

    return (
      <button
        type="button"
        onClick={() => handleNavigation(item.path, item.disabled)}
        disabled={item.disabled}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        title={item.disabled && !collapsed ? 'Coming soon' : undefined}
        className={`
          w-full flex items-center rounded-lg transition-colors duration-200 border
          ${collapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-2'}
          ${item.disabled ? 'cursor-not-allowed' : ''}
          ${active
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            : muted
              ? 'border-transparent text-slate-400 dark:text-slate-500'
              : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          }
        `}
      >
        <div className={`flex items-center ${collapsed ? '' : 'space-x-3'}`}>
          <span className="relative inline-flex shrink-0">
            {item.icon}
            {collapsed && item.badge && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-600" />
            )}
          </span>
          {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
        </div>

        {!collapsed && item.badge && (
          <Badge variant="default" className="text-xs">
            {item.badge}
          </Badge>
        )}
      </button>
    )
  }

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 ${className}`}>
      <div className={`shrink-0 border-b border-slate-200 dark:border-slate-700 ${collapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex ${collapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-2'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">ServiceAI</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered Management</p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleHeaderAction}
            className="p-2"
            aria-label={
              collapsed ? 'Expand navigation' : isDesktop ? 'Collapse navigation' : 'Close navigation'
            }
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <nav className={`flex-1 overflow-y-auto ${collapsed ? 'p-2 space-y-0.5' : 'p-3 space-y-0.5'}`}>
        {navigationItems.map((item) => (
          <div key={item.id}>
            {renderNavButton(item)}

            {!collapsed && item.children && isActive(item.path) && (
              <div className="ml-8 mt-0.5 space-y-0.5">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    disabled={child.disabled}
                    title={child.disabled ? 'Coming soon' : undefined}
                    onClick={() => handleNavigation(child.path, child.disabled)}
                    className={`
                      w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-lg border border-transparent transition-colors
                      ${child.disabled
                        ? 'cursor-not-allowed text-slate-400 dark:text-slate-500'
                        : isActive(child.path)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                      }
                    `}
                  >
                    {child.icon}
                    <span>{child.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {!collapsed && (
          <>
            <div className="pt-3 pb-1.5 px-3">
              <h4 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Quick Actions
              </h4>
            </div>
            {quickActions.map((item) => (
              <div key={item.id}>{renderNavButton(item, { muted: true })}</div>
            ))}

            <div className="my-2 mx-3 border-t border-slate-200 dark:border-slate-700" />
            {renderNavButton(settingsItem)}
          </>
        )}
      </nav>

      <div className={`shrink-0 border-t border-slate-200 dark:border-slate-700 ${collapsed ? 'p-2 space-y-2' : 'px-3 py-2.5'}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            {renderNavButton(settingsItem)}
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <ThemeToggle compact />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center min-w-0 gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                All systems operational
              </span>
            </div>
            <ThemeToggle quiet />
          </div>
        )}
      </div>
    </div>
  )
}
