import { useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { DataImport } from './DataImport'
import { AppLayout } from './AppLayout'
import {
  BarChart3,
  Users,
  Package,
  TrendingUp,
  Plus,
  Sparkles,
  CheckCircle
} from 'lucide-react'

export function Dashboard() {
  const location = useLocation()

  // Get the selected vertical from navigation state or default to retail
  const selectedVertical = location.state?.verticalId || 'retail'

  const verticals = {
    retail: {
      name: 'Retail Store',
      icon: '🛍️',
      description: 'Manage your retail operations',
      stats: [
        { label: 'Total Products', value: '247', icon: Package },
        { label: 'Active Customers', value: '1,203', icon: Users },
        { label: 'Monthly Revenue', value: '$12,450', icon: TrendingUp }
      ]
    },
    restaurant: {
      name: 'Restaurant',
      icon: '🍽️',
      description: 'Optimize your restaurant operations',
      stats: [
        { label: 'Menu Items', value: '89', icon: Package },
        { label: 'Daily Orders', value: '156', icon: Users },
        { label: 'Weekly Revenue', value: '$8,750', icon: TrendingUp }
      ]
    },
    'store-market': {
      name: 'Online Marketplace',
      icon: '🛒',
      description: 'Grow your online marketplace',
      stats: [
        { label: 'Active Vendors', value: '34', icon: Package },
        { label: 'Monthly Sales', value: '$25,800', icon: Users },
        { label: 'Growth Rate', value: '+12%', icon: TrendingUp }
      ]
    },
    business: {
      name: 'Enterprise',
      icon: '🏢',
      description: 'Enterprise-grade solutions',
      stats: [
        { label: 'Departments', value: '12', icon: Package },
        { label: 'Team Members', value: '89', icon: Users },
        { label: 'Efficiency Score', value: '94%', icon: TrendingUp }
      ]
    }
  }

  const vertical = verticals[selectedVertical as keyof typeof verticals] || verticals.retail

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
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

            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Sparkles className="h-3 w-3 mr-1" />
                ServiceAI Active
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {vertical.stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index}>
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

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks for your {vertical.name.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Add New Product
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Create Service Request
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      ServiceAI Setup Complete
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Your {vertical.name.toLowerCase()} is ready to use
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      AI Recommendations Ready
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Personalized suggestions for your business
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="text-6xl mb-4">{vertical.icon}</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Welcome to ServiceAI!
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Your {vertical.name.toLowerCase()} is now connected to ServiceAI.
                Start exploring the features designed specifically for your business type.
              </p>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                <Sparkles className="h-4 w-4 mr-2" />
                Explore Features
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Import Section */}
        <DataImport
          vertical={selectedVertical}
          onDataImported={(data) => {
            console.log('Data imported:', data)
            // TODO: Store data and update dashboard
          }}
        />
      </div>
    </AppLayout>
  )
}
