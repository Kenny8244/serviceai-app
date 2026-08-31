import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageShell } from '@/components/layout/PageShell'
import { GradientIcon } from '@/components/layout/GradientIcon'
import { DataImport } from '@/components/import/DataImport'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState, SkeletonBlock } from '@/components/ui/loading-state'
import { getSelectedVertical } from '@/lib/verticalStorage'
import { getVerticalContent } from '@/lib/verticalContent'
import { toUserMessage } from '@/lib/userFacingError'
import { apiService, type DashboardOverview, type DashboardStat } from '@/services/api'
import {
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
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-7 w-16" />
          </div>
          <SkeletonBlock className="w-8 h-8" />
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
    } catch (err) {
      setError(toUserMessage(err))
      setOverview(null)
    } finally {
      setLoading(false)
    }
  }, [selectedVertical])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  return (
    <PageShell
      title={`${vertical.name} Dashboard`}
      subtitle={vertical.description}
      icon={<GradientIcon icon={VerticalIcon} />}
      actions={
        <>
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
        </>
      }
    >
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
          <LoadingState variant="skeleton" label="Loading dashboard" className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, index) => (
                <MetricCardSkeleton key={index} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6 space-y-3">
                  <SkeletonBlock className="h-5 w-40" />
                  <SkeletonBlock className="h-4 w-full" />
                  <SkeletonBlock className="h-4 w-2/3" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 space-y-3">
                  <SkeletonBlock className="h-5 w-48" />
                  <SkeletonBlock className="h-4 w-full" />
                  <SkeletonBlock className="h-4 w-3/4" />
                </CardContent>
              </Card>
            </div>
          </LoadingState>
        )}

        {error && !loading && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <ErrorState
                title="Couldn't load the dashboard"
                message={error}
                onRetry={loadOverview}
              />
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
                    <EmptyState
                      icon={<Inbox className="h-6 w-6 text-slate-500" />}
                      title="No recent activity yet"
                      description="Import data or create a service request to see updates here."
                      className="py-8"
                    />
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
                    <EmptyState
                      title="No recommendations yet"
                      description="Recommendations will appear as your workspace collects data."
                      className="py-8"
                    />
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
    </PageShell>
  )
}
