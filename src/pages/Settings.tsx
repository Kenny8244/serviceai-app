import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FormField, nativeSelectClassName } from '@/components/ui/form-field'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { PageShell } from '@/components/layout/PageShell'
import { SettingsNav } from '@/components/settings/SettingsNav'
import { getSelectedVertical } from '@/lib/verticalStorage'
import { getVerticalDisplayName } from '@/lib/verticalContent'
import {
  Settings as SettingsIcon,
  Bot,
  LayoutDashboard,
  Package,
  Users,
  Database,
  Save,
  RotateCcw,
  Search,
  Workflow,
  FileText,
  Ticket,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react'

interface SettingsSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  content: React.ReactNode
}

const SETTINGS_SECTIONS = ['general', 'ai', 'dashboard', 'assets', 'team', 'integrations'] as const

export function Settings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sectionFromUrl = searchParams.get('section')
  const [activeSection, setActiveSection] = useState(
    sectionFromUrl && SETTINGS_SECTIONS.includes(sectionFromUrl as (typeof SETTINGS_SECTIONS)[number])
      ? sectionFromUrl
      : 'general'
  )
  const [settings, setSettings] = useState({
    // General Settings
    companyName: 'Your Business',
    timezone: 'America/New_York',
    language: 'en',
    notifications: {
      email: true,
      push: false,
      sms: false
    },

    // AI Configuration
    aiEnabled: true,
    autoResponses: true,
    aiConfidence: 0.8,
    customPrompts: false,

    // Dashboard Settings
    defaultView: 'overview',
    refreshInterval: 300,
    showTips: true,

    // Asset Management
    autoCategorization: true,
    lowStockAlerts: true,
    stockThreshold: 10,

    // Team Settings
    allowGuestAccess: false,
    requireApproval: true,
    maxTeamSize: 50
  })

  useEffect(() => {
    const section = searchParams.get('section')
    if (section && SETTINGS_SECTIONS.includes(section as (typeof SETTINGS_SECTIONS)[number])) {
      setActiveSection(section)
    }
  }, [searchParams])

  const selectSection = (sectionId: string) => {
    setActiveSection(sectionId)
    if (sectionId === 'general') {
      setSearchParams({}, { replace: true })
    } else {
      setSearchParams({ section: sectionId }, { replace: true })
    }
  }

  const handleSave = () => {
    // TODO: Save settings to backend/localStorage
    console.log('Settings saved:', settings)
  }

  const handleReset = () => {
    // TODO: Reset to defaults
    console.log('Settings reset to defaults')
  }

  const updateSetting = (category: keyof typeof settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as Record<string, any>),
        [key]: value
      }
    }))
  }

  const sections: SettingsSection[] = [
    {
      id: 'general',
      title: 'General Settings',
      description: 'Basic application preferences',
      icon: <SettingsIcon className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          {/* Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Company Name" htmlFor="companyName">
              <Input
                id="companyName"
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </FormField>

            <FormField label="Timezone" htmlFor="timezone">
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className={nativeSelectClassName}
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </FormField>
          </div>

          <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Active vertical</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Current workspace: {getVerticalDisplayName(getSelectedVertical())}
              </p>
            </div>
            <Button variant="outline" disabled title="Coming soon">
              Change Vertical
            </Button>
          </div>

          {/* Theme & Appearance */}
          <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Theme</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Choose your preferred theme</p>
            </div>
            <ThemeToggle />
          </div>

          {/* Notifications */}
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Notifications</h4>
            <div className="space-y-3">
              {Object.entries(settings.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                    {key} Notifications
                  </label>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'ai',
      title: 'AI Configuration',
      description: 'Configure AI behavior and workflows',
      icon: <Bot className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          {/* AI Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search AI settings, workflows, or ask for help..."
              className="pl-10 pr-24 py-3 h-auto"
            />
            <Button
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              Ask AI
            </Button>
          </div>

          {/* AI Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <Workflow className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Active Workflows</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">12</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">Custom Forms</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">8</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-2">
                <Ticket className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Service Requests</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">24</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Enable/Disable */}
          <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Enable AI Features</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Allow AI to help manage your service</p>
            </div>
            <input
              type="checkbox"
              checked={settings.aiEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, aiEnabled: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Auto Responses */}
          <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Auto Responses</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">AI automatically responds to common queries</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoResponses}
              onChange={(e) => setSettings(prev => ({ ...prev, autoResponses: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* AI Confidence Threshold */}
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">AI Confidence Threshold</h4>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {(settings.aiConfidence * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={settings.aiConfidence}
              onChange={(e) => setSettings(prev => ({ ...prev, aiConfidence: parseFloat(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Conservative (50%)</span>
              <span>Aggressive (95%)</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Higher values = more accurate but fewer AI responses
            </p>
          </div>

          {/* Custom Prompts */}
          <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Custom Prompts</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Use custom AI prompts for your business</p>
            </div>
            <input
              type="checkbox"
              checked={settings.customPrompts}
              onChange={(e) => setSettings(prev => ({ ...prev, customPrompts: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Configured Workflows */}
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 flex items-center">
                <Workflow className="h-5 w-5 mr-2 text-blue-600" />
                Configured Workflows
              </h4>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Workflow
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Customer Service Auto-Response</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Automatically responds to common inquiries</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Inventory Alert System</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Notifies when stock is low</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="font-medium text-sm">Service Request Routing</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Routes requests to appropriate team members</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
              </div>
            </div>
          </div>

          {/* Configured Forms */}
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Configured Forms
              </h4>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create Form
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                <div>
                  <p className="font-medium text-sm">Customer Feedback Form</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Collect customer satisfaction data</p>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">8 responses</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                <div>
                  <p className="font-medium text-sm">Service Request Form</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Standard service request submission</p>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">24 submissions</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                <div>
                  <p className="font-medium text-sm">Product Registration Form</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Register new products in inventory</p>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">156 entries</Badge>
              </div>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'dashboard',
      title: 'Dashboard Configuration',
      description: 'Customize your dashboard experience',
      icon: <LayoutDashboard className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          {/* Default View */}
          <FormField label="Default Dashboard View" htmlFor="defaultView">
            <select
              id="defaultView"
              value={settings.defaultView}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultView: e.target.value }))}
              className={nativeSelectClassName}
            >
              <option value="overview">Overview</option>
              <option value="analytics">Analytics</option>
              <option value="inventory">Inventory</option>
              <option value="team">Team</option>
            </select>
          </FormField>

          <FormField label="Auto Refresh Interval (seconds)" htmlFor="refreshInterval">
            <Input
              id="refreshInterval"
              type="number"
              min="60"
              max="3600"
              value={settings.refreshInterval}
              onChange={(e) => setSettings(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
            />
          </FormField>

          {/* Show Tips */}
          <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Show AI Tips</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Display helpful tips and suggestions</p>
            </div>
            <input
              type="checkbox"
              checked={settings.showTips}
              onChange={(e) => setSettings(prev => ({ ...prev, showTips: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      )
    },

    {
      id: 'assets',
      title: 'Asset Management',
      description: 'Configure inventory and asset settings',
      icon: <Package className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          {/* Auto Categorization */}
          <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Auto Categorization</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">AI automatically categorizes new items</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoCategorization}
              onChange={(e) => setSettings(prev => ({ ...prev, autoCategorization: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Low Stock Alerts */}
          <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Low Stock Alerts</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Get notified when items are running low</p>
            </div>
            <input
              type="checkbox"
              checked={settings.lowStockAlerts}
              onChange={(e) => setSettings(prev => ({ ...prev, lowStockAlerts: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Stock Threshold */}
          <FormField label={`Low Stock Threshold: ${settings.stockThreshold} items`} htmlFor="stockThreshold">
            <Input
              id="stockThreshold"
              type="number"
              min="1"
              max="100"
              value={settings.stockThreshold}
              onChange={(e) => setSettings(prev => ({ ...prev, stockThreshold: parseInt(e.target.value) }))}
            />
          </FormField>
        </div>
      )
    },

    {
      id: 'team',
      title: 'Team Management',
      description: 'Configure team settings and permissions',
      icon: <Users className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          {/* Guest Access */}
          <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Allow Guest Access</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Let external users access limited features</p>
            </div>
            <input
              type="checkbox"
              checked={settings.allowGuestAccess}
              onChange={(e) => setSettings(prev => ({ ...prev, allowGuestAccess: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Require Approval */}
          <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Require Approval</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">All changes require admin approval</p>
            </div>
            <input
              type="checkbox"
              checked={settings.requireApproval}
              onChange={(e) => setSettings(prev => ({ ...prev, requireApproval: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Max Team Size */}
          <FormField label={`Maximum Team Size: ${settings.maxTeamSize} members`} htmlFor="maxTeamSize">
            <Input
              id="maxTeamSize"
              type="number"
              min="1"
              max="1000"
              value={settings.maxTeamSize}
              onChange={(e) => setSettings(prev => ({ ...prev, maxTeamSize: parseInt(e.target.value) }))}
            />
          </FormField>

          {/* Team Communication */}
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Service Ticket Communication</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Enable team communication on service tickets for better documentation
            </p>
            <Button variant="outline" size="sm">
              Configure Communication Settings
            </Button>
          </div>
        </div>
      )
    },

    {
      id: 'integrations',
      title: 'API & Integrations',
      description: 'Connect external services and APIs',
      icon: <Database className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          {/* Google Sheets Integration */}
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Google Sheets Integration</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Connect your spreadsheets for data import</p>
              </div>
              <Badge variant={settings.aiEnabled ? "default" : "secondary"}>
                {settings.aiEnabled ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <Button variant="outline" size="sm">
              Configure Google Sheets
            </Button>
          </div>

          {/* API Keys */}
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">API Configuration</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Manage API keys and external service connections
            </p>
            <Button variant="outline" size="sm">
              Manage API Keys
            </Button>
          </div>

          {/* Webhooks */}
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Webhooks</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Configure webhooks for external integrations
            </p>
            <Button variant="outline" size="sm">
              Manage Webhooks
            </Button>
          </div>
        </div>
      )
    }
  ]

  return (
    <PageShell
      title="Settings"
      subtitle="Configure your ServiceAI experience"
      icon={<SettingsIcon className="h-6 w-6 text-muted-foreground" />}
      compact
      actions={
        <>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </>
      }
    >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <SettingsNav
              items={sections.map(({ id, title, description, icon }) => ({
                id,
                title,
                description,
                icon,
              }))}
              activeId={activeSection}
              onSelect={selectSection}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {sections.find(s => s.id === activeSection)?.icon}
                  <span className="ml-2">
                    {sections.find(s => s.id === activeSection)?.title}
                  </span>
                </CardTitle>
                <CardDescription>
                  {sections.find(s => s.id === activeSection)?.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {sections.find(s => s.id === activeSection)?.content}
              </CardContent>
            </Card>
          </div>
        </div>
    </PageShell>
  )
}
