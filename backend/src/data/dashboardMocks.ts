export type DashboardVerticalId = 'retail' | 'restaurant' | 'store-market' | 'business'

export type DashboardStatIconKey =
  | 'package'
  | 'users'
  | 'trending-up'
  | 'alert-triangle'
  | 'wrench'
  | 'store'
  | 'building-2'

export interface DashboardStat {
  label: string
  value: string
  iconKey: DashboardStatIconKey
}

export interface DashboardActivity {
  title: string
  detail: string
}

export interface DashboardOverview {
  stats: DashboardStat[]
  activities: DashboardActivity[]
  aiRecommendation: {
    title: string
    detail: string
  }
}

const DEFAULT_VERTICAL: DashboardVerticalId = 'retail'

const DASHBOARD_MOCKS: Record<DashboardVerticalId, DashboardOverview> = {
  retail: {
    stats: [
      { label: 'Products / Assets', value: '247', iconKey: 'package' },
      { label: 'Low Stock Items', value: '18', iconKey: 'alert-triangle' },
      { label: 'Inventory Value', value: '$12,450', iconKey: 'trending-up' },
      { label: 'Open Service Requests', value: '6', iconKey: 'users' },
    ],
    activities: [],
    aiRecommendation: {
      title: 'Retail AI recommendation',
      detail: 'Restock the top 8 SKUs before weekend traffic. Suggested transfer from warehouse B.',
    },
  },
  restaurant: {
    stats: [
      { label: 'Ingredients / Inventory', value: '89', iconKey: 'package' },
      { label: 'Equipment Assets', value: '24', iconKey: 'wrench' },
      { label: 'Low Stock Ingredients', value: '11', iconKey: 'alert-triangle' },
      { label: 'Open Service Requests', value: '4', iconKey: 'users' },
    ],
    activities: [],
    aiRecommendation: {
      title: 'Restaurant AI recommendation',
      detail: 'Reduce Friday prep waste on herbs by 15% based on last month’s covers. Check oven #2 maintenance window.',
    },
  },
  'store-market': {
    stats: [
      { label: 'Active Vendors', value: '34', iconKey: 'store' },
      { label: 'Active Listings', value: '1,204', iconKey: 'package' },
      { label: 'Low Stock Listings', value: '27', iconKey: 'alert-triangle' },
      { label: 'Open Service Requests', value: '9', iconKey: 'users' },
    ],
    activities: [],
    aiRecommendation: {
      title: 'Marketplace AI recommendation',
      detail: 'Promote the 5 vendors with the highest fill rate. Pause 8 listings with repeated stockouts.',
    },
  },
  business: {
    stats: [
      { label: 'Departments', value: '12', iconKey: 'building-2' },
      { label: 'Managed Assets', value: '412', iconKey: 'package' },
      { label: 'Open Service Requests', value: '21', iconKey: 'users' },
      { label: 'Efficiency Score', value: '94%', iconKey: 'trending-up' },
    ],
    activities: [],
    aiRecommendation: {
      title: 'Enterprise AI recommendation',
      detail: 'Consolidate duplicate printer leases in two departments. Route P1 tickets to the on-call facilities queue.',
    },
  },
}

function resolveVerticalId(verticalId?: string): DashboardVerticalId {
  if (verticalId && verticalId in DASHBOARD_MOCKS) {
    return verticalId as DashboardVerticalId
  }
  return DEFAULT_VERTICAL
}

function getMockDashboardOverview(verticalId?: string): DashboardOverview {
  return DASHBOARD_MOCKS[resolveVerticalId(verticalId)]
}

export function getDashboardOverview(verticalId?: string): DashboardOverview {
  // TODO: When live metrics are wired, resolve the authenticated org/vertical
  // here and replace the mock lookup with database queries.
  return getMockDashboardOverview(verticalId)
}
