import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { DataImport } from './DataImport'
import { getSelectedVertical } from '../lib/verticalStorage'
import { getVerticalContent } from '../lib/verticalContent'
import { apiService, type DashboardOverview, type DashboardStat } from '../services/api'
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle,
  Inbox,
  Package,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

const STAT_ICONS: Record<string, LucideIcon> = {
  package: Package,
  users: Users,
  'trending-up': TrendingUp,
  'alert-triangle': AlertTriangle,
  wrench: Wrench,
  store: Store,
  'building-2': Building2,
}

const VERTICAL_ICONS: Record<string, LucideIcon> = {
  retail: ShoppingBag,
  restaurant: UtensilsCrossed,
  'store-market': Store,
  business: Building2,
}

function MetricCard({ stat }: { stat: DashboardStat }) {
  const IconComponent = STAT_ICONS[stat.iconKey] ?? Package

  return (
    <Card className="h-full">
      <CardContent className="p-6 h-full flex items-center">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">{stat.value}</p>
          </div>
          <IconComponent className="h-8 w-8 text-blue-600 shrink-0 block" />
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const selectedVertical = getSelectedVertical(
    (location.state as { verticalId?: string } | null)?.verticalId
  )
  const vertical = getVerticalContent(selectedVertical)
  const VerticalIcon = VERTICAL_ICONS[vertical.id] ?? ShoppingBag

  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.getDashboardOverview(selectedVertical)
      setOverview(data)
    } catch {
      setError('Failed to load dashboard data')
      setOverview(null)
    } finally {
      setLoading(false)
    }
  }, [selectedVertical])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <VerticalIcon className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {vertical.name} Dashboard
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {vertical.description}
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Sparkles className="h-3 w-3 mr-1" />
                ServiceAI Active
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/analytics')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-8">
          <Button variant="outline" size="sm" onClick={() => navigate('/assets')}>
            <Package className="h-4 w-4 mr-2 shrink-0 block" />
            {vertical.addAssetLabel}
          </Button>
          <Button variant="outline" size="sm" disabled title="Coming soon">
            <Users className="h-4 w-4 mr-2 shrink-0 block" />
            {vertical.serviceRequestLabel}
          </Button>
        </div>

        {loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, index) => (
                <MetricCardSkeleton key={index} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 space-y-3">
                  <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 space-y-3">
                  <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {error && !loading && (
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Error Loading Dashboard
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
              <Button onClick={loadOverview} className="bg-blue-500 hover:bg-blue-600 text-white">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && overview && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {overview.stats.map((stat) => (
                <MetricCard key={stat.label} stat={stat} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Recent Activity</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {vertical.name} updates and service requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {overview.activities.length === 0 ? (
                    <div className="flex flex-col items-center text-center py-8 px-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <Inbox className="h-6 w-6 text-slate-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No recent activity yet</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm">
                        Import data or create a service request to see updates here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {overview.activities.map((item) => (
                        <div key={item.title} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {item.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center leading-normal text-slate-900 dark:text-slate-100">
                    <Sparkles className="h-5 w-5 mr-2 text-blue-600 shrink-0" />
                    AI Recommendation
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Suggested next step for this workspace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {overview.aiRecommendation ? (
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {overview.aiRecommendation.title}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {overview.aiRecommendation.detail}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center py-8 px-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No recommendations yet</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Recommendations will appear as your workspace collects data.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        <DataImport
          vertical={selectedVertical}
          onDataImported={(data) => {
            console.log('Data imported:', data)
          }}
        />
      </div>
    </div>
  )
}
