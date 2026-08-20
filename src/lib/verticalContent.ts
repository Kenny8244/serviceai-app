import type { LucideIcon } from 'lucide-react'
import { Package, Users, TrendingUp, AlertTriangle, Wrench, Store, Building2 } from 'lucide-react'

export type VerticalId = 'retail' | 'restaurant' | 'store-market' | 'business'

export interface VerticalStat {
  label: string
  value: string
  icon: LucideIcon
}

export interface VerticalActivity {
  title: string
  detail: string
}

export interface VerticalContent {
  id: VerticalId
  name: string
  icon: string
  description: string
  stats: VerticalStat[]
  addAssetLabel: string
  serviceRequestLabel: string
  activities: VerticalActivity[]
  aiRecommendation: {
    title: string
    detail: string
  }
  welcome: string
}

export const VERTICAL_CONTENT: Record<VerticalId, VerticalContent> = {
  retail: {
    id: 'retail',
    name: 'Retail',
    icon: '🛍️',
    description: 'Products, inventory, and store operations',
    stats: [
      { label: 'Products / Assets', value: '247', icon: Package },
      { label: 'Low Stock Items', value: '18', icon: AlertTriangle },
      { label: 'Inventory Value', value: '$12,450', icon: TrendingUp },
      { label: 'Open Service Requests', value: '6', icon: Users },
    ],
    addAssetLabel: 'Add Product / Asset',
    serviceRequestLabel: 'Create Retail Service Request',
    activities: [
      { title: 'Low stock: winter jackets', detail: '12 SKUs below reorder point' },
      { title: 'POS terminal repair opened', detail: 'Store #4 — high priority' },
    ],
    aiRecommendation: {
      title: 'Retail AI recommendation',
      detail: 'Restock the top 8 SKUs before weekend traffic. Suggested transfer from warehouse B.',
    },
    welcome: 'Your retail workspace is connected. Track products, low stock, inventory metrics, and retail service requests here.',
  },
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant',
    icon: '🍽️',
    description: 'Ingredients, equipment, and kitchen operations',
    stats: [
      { label: 'Ingredients / Inventory', value: '89', icon: Package },
      { label: 'Equipment Assets', value: '24', icon: Wrench },
      { label: 'Low Stock Ingredients', value: '11', icon: AlertTriangle },
      { label: 'Open Service Requests', value: '4', icon: Users },
    ],
    addAssetLabel: 'Add Ingredient / Equipment',
    serviceRequestLabel: 'Create Restaurant Service Request',
    activities: [
      { title: 'Walk-in cooler service ticket', detail: 'Technician scheduled for 2pm' },
      { title: 'Produce below par level', detail: 'Tomatoes, herbs, and dairy flagged' },
    ],
    aiRecommendation: {
      title: 'Restaurant AI recommendation',
      detail: 'Reduce Friday prep waste on herbs by 15% based on last month’s covers. Check oven #2 maintenance window.',
    },
    welcome: 'Your restaurant workspace is connected. Track ingredients, equipment, low stock, and kitchen service requests here.',
  },
  'store-market': {
    id: 'store-market',
    name: 'Marketplace',
    icon: '🛒',
    description: 'Vendors, listings, and marketplace operations',
    stats: [
      { label: 'Active Vendors', value: '34', icon: Store },
      { label: 'Active Listings', value: '1,204', icon: Package },
      { label: 'Low Stock Listings', value: '27', icon: AlertTriangle },
      { label: 'Open Service Requests', value: '9', icon: Users },
    ],
    addAssetLabel: 'Add Listing / Asset',
    serviceRequestLabel: 'Create Marketplace Service Request',
    activities: [
      { title: 'Vendor onboarding completed', detail: '3 new sellers approved this week' },
      { title: 'Listing quality flags', detail: '14 SKUs missing shipping dimensions' },
    ],
    aiRecommendation: {
      title: 'Marketplace AI recommendation',
      detail: 'Promote the 5 vendors with the highest fill rate. Pause 8 listings with repeated stockouts.',
    },
    welcome: 'Your marketplace workspace is connected. Track vendors, listings, stock, and seller service requests here.',
  },
  business: {
    id: 'business',
    name: 'Enterprise',
    icon: '🏢',
    description: 'Departments, assets, and organization operations',
    stats: [
      { label: 'Departments', value: '12', icon: Building2 },
      { label: 'Managed Assets', value: '412', icon: Package },
      { label: 'Open Service Requests', value: '21', icon: Users },
      { label: 'Efficiency Score', value: '94%', icon: TrendingUp },
    ],
    addAssetLabel: 'Add Enterprise Asset',
    serviceRequestLabel: 'Create Enterprise Service Request',
    activities: [
      { title: 'Facilities ticket: HVAC zone 3', detail: 'Assigned to building ops' },
      { title: 'IT asset audit due', detail: 'Laptop refresh for Finance in 14 days' },
    ],
    aiRecommendation: {
      title: 'Enterprise AI recommendation',
      detail: 'Consolidate duplicate printer leases in two departments. Route P1 tickets to the on-call facilities queue.',
    },
    welcome: 'Your enterprise workspace is connected. Track departments, assets, and organization service requests here.',
  },
}

export function getVerticalContent(verticalId: string): VerticalContent {
  if (verticalId in VERTICAL_CONTENT) {
    return VERTICAL_CONTENT[verticalId as VerticalId]
  }
  return VERTICAL_CONTENT.retail
}

export function getVerticalDisplayName(verticalId: string): string {
  return getVerticalContent(verticalId).name
}
