import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ThemeToggle } from './ui/ThemeToggle'
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Users,
  Bot,
  Settings,
  Menu,
  X,
  Search,
  Plus,
  MessageSquare,
  HelpCircle
} from 'lucide-react'

interface NavigationItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
  badge?: string | number
  disabled?: boolean
  children?: NavigationItem[]
}

interface SidebarProps {
  className?: string
}

export function Sidebar({ className = "" }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/dashboard'
    },
    {
      id: 'assets',
      label: 'Assets/Inventory',
      icon: <Package className="h-5 w-5" />,
      path: '/assets',
      children: [
        { id: 'import', label: 'Import Data', icon: <Plus className="h-4 w-4" />, path: '/assets/import', disabled: true },
        { id: 'manage', label: 'Manage Items', icon: <Package className="h-4 w-4" />, path: '/assets/manage', disabled: true },
        { id: 'reports', label: 'Inventory Reports', icon: <BarChart3 className="h-4 w-4" />, path: '/assets/reports', disabled: true }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/analytics',
      badge: 'New'
    },
    {
      id: 'team',
      label: 'Team Members',
      icon: <Users className="h-5 w-5" />,
      path: '/team'
    },
    {
      id: 'ai-hub',
      label: 'AI Hub',
      icon: <Bot className="h-5 w-5" />,
      path: '/ai-hub',
      badge: 'AI'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      path: '/settings'
    }
  ]

  const handleNavigation = (path: string, disabled?: boolean) => {
    if (disabled) return
    navigate(path)
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className={`h-full relative bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">ServiceAI</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered Management</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => handleNavigation(item.path, item.disabled)}
              disabled={item.disabled}
              title={item.disabled ? 'Coming soon' : undefined}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${isActive(item.path)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </div>

              {!isCollapsed && item.badge && (
                <Badge
                  variant={typeof item.badge === 'string' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </button>

            {/* Sub-navigation */}
            {!isCollapsed && item.children && isActive(item.path) && (
              <div className="ml-8 mt-2 space-y-1">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    disabled={child.disabled}
                    title={child.disabled ? 'Coming soon' : undefined}
                    onClick={() => handleNavigation(child.path, child.disabled)}
                    className={`
                      w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors
                      ${child.disabled
                        ? 'opacity-50 cursor-not-allowed text-slate-500 dark:text-slate-500'
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
      </nav>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Quick Actions
            </h4>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              disabled
              title="Coming soon"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask AI Assistant
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              disabled
              title="Coming soon"
            >
              <Search className="h-4 w-4 mr-2" />
              Search Everything
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              disabled
              title="Coming soon"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Get Help
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isCollapsed ? 'Online' : 'All systems operational'}
            </span>
          </div>

          {!isCollapsed && <ThemeToggle />}
        </div>
      </div>
    </div>
  )
}
