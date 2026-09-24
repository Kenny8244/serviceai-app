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
import { ActivityChangeLine } from '@/components/service-requests/ActivityChangeLine'
import { apiService, peekDashboardOverview, type DashboardOverview, type DashboardStat } from '@/services/api'
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle,
  ClipboardList,
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
  const navigate = useNavigate()
  const IconComponent = STAT_ICONS[stat.iconKey] ?? Package
  const content = (
    <CardContent className="p-6 h-full flex items-center">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600 dark:text-muted-foreground">{stat.label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-foreground truncate">{stat.value}</p>
        </div>
        <div className="rounded-lg bg-transparent dark:bg-muted p-0 dark:p-2.5 shrink-0">
          <IconComponent className="h-8 w-8 dark:h-5 dark:w-5 text-blue-600 dark:text-blue-400 block" />
        </div>
      </div>
    </CardContent>
  )

  if (!stat.href) {
    return <Card className="h-full">{content}</Card>
  }

  return (
    <Card className="h-full">
      <button
        type="button"
        className="block h-full w-full cursor-pointer rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => navigate(stat.href!)}
        aria-label={`${stat.label}: ${stat.value}`}
      >
        {content}
      </button>
    </Card>
  )
}

function formatActivityTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
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

  const [overview, setOverview] = useState<DashboardOverview | null>(() => peekDashboardOverview(selectedVertical))
  const [loading, setLoading] = useState(() => peekDashboardOverview(selectedVertical) == null)
  const [error, setError] = useState<string | null>(null)

  const loadOverview = useCallback(async () => {
    const cached = peekDashboardOverview(selectedVertical)
    try {
      if (!cached) {
        setLoading(true)
        setError(null)
      }
      const data = await apiService.getDashboardOverview(selectedVertical)
      setOverview(data)
      setError(null)
    } catch (err) {
      if (!cached) {
        setError(toUserMessage(err))
        setOverview(null)
      }
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
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/60">
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
          <Button variant="outline" size="sm" onClick={() => navigate('/service-requests?create=1')}>
            <ClipboardList className="h-4 w-4 mr-2 shrink-0 block" />
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

            {overview.aiRecommendation ? (
              <Card className="mb-6">
                <CardContent className="flex items-start gap-3 p-6">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-foreground">
                      {overview.aiRecommendation.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-muted-foreground">
                      {overview.aiRecommendation.detail}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900 dark:text-foreground">Recent Activity</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-muted-foreground">
                    {vertical.name} updates and service requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {overview.activities.length === 0 ? (
                    <EmptyState
                      icon={<Inbox className="h-6 w-6 text-slate-500 dark:text-muted-foreground" />}
                      title="No recent activity yet"
                      description="Import data or create a service request to see updates here."
                      className="py-8"
                    />
                  ) : (
                    <div className="max-h-80 overflow-y-auto pr-1">
                      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {overview.activities.map((item) => {
                          const time = item.createdAt ? formatActivityTime(item.createdAt) : ''
                          const title = (
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-foreground">
                              {item.title}
                            </p>
                          )
                          return (
                            <li key={item.id ?? `${item.title}-${item.detail}`} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-emerald-500/10">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-emerald-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  {item.requestId ? (
                                    <button
                                      type="button"
                                      className="min-w-0 flex-1 text-left hover:underline"
                                      onClick={() => navigate(`/service-requests/${item.requestId}`)}
                                    >
                                      {title}
                                    </button>
                                  ) : (
                                    title
                                  )}
                                  {time ? (
                                    <time className="shrink-0 text-xs text-slate-500 dark:text-muted-foreground">
                                      {time}
                                    </time>
                                  ) : null}
                                </div>
                                {item.eventType && item.eventType !== 'created' ? (
                                  <ActivityChangeLine
                                    change={{
                                      eventType: item.eventType,
                                      fromValue: item.fromValue ?? null,
                                      toValue: item.toValue ?? null,
                                    }}
                                    className="text-xs font-normal text-slate-600 dark:text-muted-foreground"
                                  />
                                ) : (
                                  <p className="truncate text-xs text-slate-600 dark:text-muted-foreground">
                                    {item.detail}
                                  </p>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </CardContent>
            </Card>
          </>
        )}

        <DataImport vertical={selectedVertical} />
    </PageShell>
  )
}
