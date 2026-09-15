export type VerticalId = 'retail' | 'restaurant' | 'store-market' | 'business'

export interface VerticalContent {
  id: VerticalId
  name: string
  icon: string
  description: string
  addAssetLabel: string
  navAssetsLabel: string
  navServiceRequestsLabel: string
  serviceRequestLabel: string
}

export const VERTICAL_CONTENT: Record<VerticalId, VerticalContent> = {
  retail: {
    id: 'retail',
    name: 'Retail',
    icon: '🛍️',
    description: 'Products, inventory, and store operations',
    addAssetLabel: 'Add Product / Asset',
    navAssetsLabel: 'Products',
    navServiceRequestsLabel: 'Service Requests',
    serviceRequestLabel: 'Create Retail Service Request',
  },
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant',
    icon: '🍽️',
    description: 'Ingredients, equipment, and kitchen operations',
    addAssetLabel: 'Add Ingredient / Equipment',
    navAssetsLabel: 'Inventory',
    navServiceRequestsLabel: 'Service Requests',
    serviceRequestLabel: 'Create Restaurant Service Request',
  },
  'store-market': {
    id: 'store-market',
    name: 'Marketplace',
    icon: '🛒',
    description: 'Vendors, listings, and marketplace operations',
    addAssetLabel: 'Add Listing / Asset',
    navAssetsLabel: 'Listings',
    navServiceRequestsLabel: 'Service Requests',
    serviceRequestLabel: 'Create Marketplace Service Request',
  },
  business: {
    id: 'business',
    name: 'Enterprise',
    icon: '🏢',
    description: 'Departments, assets, and organization operations',
    addAssetLabel: 'Add Enterprise Asset',
    navAssetsLabel: 'Assets',
    navServiceRequestsLabel: 'Service Requests',
    serviceRequestLabel: 'Create Enterprise Service Request',
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
