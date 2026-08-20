import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { DataImport } from './DataImport'
import { getSelectedVertical } from '../lib/verticalStorage'
import { getVerticalContent } from '../lib/verticalContent'
import {
  BarChart3,
  Users,
  Package,
  Plus,
  Sparkles,
  CheckCircle
} from 'lucide-react'

export function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const selectedVertical = getSelectedVertical(
    (location.state as { verticalId?: string } | null)?.verticalId
  )
  const vertical = getVerticalContent(selectedVertical)

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">{vertical.icon}</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {vertical.name} Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {vertical.description}
              </p>
            </div>
          </div>

          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Sparkles className="h-3 w-3 mr-1" />
            ServiceAI Active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {vertical.stats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {stat.value}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks for your {vertical.name.toLowerCase()} workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/assets')}>
              <Package className="h-4 w-4 mr-2" />
              {vertical.addAssetLabel}
            </Button>
            <Button className="w-full justify-start" variant="outline" disabled title="Coming soon">
              <Users className="h-4 w-4 mr-2" />
              {vertical.serviceRequestLabel}
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              {vertical.name} updates and service requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vertical.activities.map((item) => (
                <div key={item.title} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {vertical.aiRecommendation.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {vertical.aiRecommendation.detail}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardContent className="p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="text-6xl mb-4">{vertical.icon}</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Welcome to ServiceAI
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {vertical.welcome}
            </p>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => navigate('/ai-hub')}>
              <Sparkles className="h-4 w-4 mr-2" />
              Explore Features
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataImport
        vertical={selectedVertical}
        onDataImported={(data) => {
          console.log('Data imported:', data)
        }}
      />
    </div>
  )
}
