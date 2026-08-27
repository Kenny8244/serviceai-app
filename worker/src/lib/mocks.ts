type DashboardVerticalId = 'retail' | 'restaurant' | 'store-market' | 'business'

const DASHBOARD_MOCKS: Record<DashboardVerticalId, {
  stats: Array<{ label: string; value: string; iconKey: string }>
  activities: Array<{ title: string; detail: string }>
  aiRecommendation: { title: string; detail: string }
}> = {
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
      detail: 'Reduce Friday prep waste on herbs by 15% based on last month covers.',
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
      detail: 'Promote the 5 vendors with the highest fill rate.',
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
      detail: 'Consolidate duplicate printer leases in two departments.',
    },
  },
}

export function getDashboardOverview(verticalId?: string) {
  const id = verticalId && verticalId in DASHBOARD_MOCKS ? verticalId as DashboardVerticalId : 'retail'
  return DASHBOARD_MOCKS[id]
}

export const ANALYTICS_OVERVIEW = {
  aiAccuracy: 94.2,
  avgResponseTime: 2.3,
  userSatisfaction: 4.8,
  costSavings: 2847,
  aiQueries: 147,
  activeUsers: 23,
  formsCompleted: 12,
  workflowExecutions: 89,
  highPriorityTickets: 12,
  avgResolutionTime: 4.2,
}

export const TEAM_MEMBERS = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex@company.com',
    role: 'Admin',
    status: 'online',
    lastActive: new Date().toISOString(),
    joinDate: new Date(Date.now() - 86400000 * 120).toISOString(),
    permissions: ['admin', 'manage_team'],
    expertise: ['Operations', 'Analytics'],
    workload: 65,
    stats: { ticketsResolved: 42, avgResponseTime: '1.8h', satisfaction: 4.9 },
  },
  {
    id: '2',
    name: 'Maria Garcia',
    email: 'maria@company.com',
    role: 'Manager',
    status: 'offline',
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    joinDate: new Date(Date.now() - 86400000 * 90).toISOString(),
    permissions: ['manage_tickets'],
    expertise: ['Customer Service'],
    workload: 40,
    stats: { ticketsResolved: 28, avgResponseTime: '2.1h', satisfaction: 4.7 },
  },
]

export const DEFAULT_SETTINGS = {
  allowGuestAccess: false,
  requireApproval: true,
  maxTeamSize: 50,
  enableServiceTicketCommunication: true,
  aiAccuracyThreshold: 85,
  autoAssignTickets: true,
  enablePredictiveMaintenance: true,
  dataRetentionDays: 365,
  enableNotifications: true,
  notificationEmail: '',
  timezone: 'UTC',
  language: 'en',
  theme: 'light',
}

export const AI_SEARCH_DATA: Record<string, Array<{
  id: string
  title: string
  description: string
  category: string
  relevance: number
}>> = {
  retail: [
    { id: '1', title: 'Customer Segmentation Analysis', description: 'AI-powered customer behavior analysis', category: 'Analytics', relevance: 95 },
    { id: '2', title: 'Inventory Optimization', description: 'Smart inventory management', category: 'Operations', relevance: 90 },
  ],
  restaurant: [
    { id: '1', title: 'Menu Optimization', description: 'Data-driven menu analysis', category: 'Menu', relevance: 95 },
    { id: '2', title: 'Order Management', description: 'Intelligent order processing', category: 'Operations', relevance: 90 },
  ],
  marketplace: [
    { id: '1', title: 'Vendor Performance Analytics', description: 'Vendor scoring and tracking', category: 'Vendor Management', relevance: 95 },
  ],
  enterprise: [
    { id: '1', title: 'Workflow Automation', description: 'Custom workflow automation', category: 'Automation', relevance: 95 },
  ],
}

export const AI_WORKFLOWS = [
  {
    id: 'wf-1',
    name: 'Customer Support Triage',
    description: 'Automatically route and prioritize support tickets',
    type: 'automation',
    status: 'active',
    executions: 156,
    successRate: 94,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    lastRun: new Date().toISOString(),
  },
]

export const AI_FORMS = [
  {
    id: 'form-1',
    name: 'Service Request Intake',
    description: 'Standard service request collection form',
    fields: 5,
    submissions: 23,
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
]

export const AI_TEMPLATES = [
  { id: 'tpl-1', name: 'Support Ticket Response', category: 'Customer Service', uses: 45 },
  { id: 'tpl-2', name: 'Inventory Alert', category: 'Operations', uses: 32 },
]
