import type { Asset, ServiceRequest, StoredUser, UserVertical } from '../types'

async function readJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  return kv.get<T>(key, 'json')
}

async function writeJson(kv: KVNamespace, key: string, value: unknown): Promise<void> {
  await kv.put(key, JSON.stringify(value))
}

export async function findUserByEmail(kv: KVNamespace, email: string): Promise<StoredUser | null> {
  return readJson<StoredUser>(kv, `user:email:${email.toLowerCase()}`)
}

export async function findUserById(kv: KVNamespace, id: string): Promise<StoredUser | null> {
  return readJson<StoredUser>(kv, `user:id:${id}`)
}

export async function createUser(kv: KVNamespace, user: StoredUser): Promise<StoredUser> {
  await writeJson(kv, `user:email:${user.email.toLowerCase()}`, user)
  await writeJson(kv, `user:id:${user.id}`, user)
  return user
}

export async function selectVertical(kv: KVNamespace, userId: string, verticalId: string): Promise<UserVertical> {
  const selection: UserVertical = {
    userId,
    verticalId,
    selectedAt: new Date().toISOString(),
  }
  await writeJson(kv, `vertical:${userId}`, selection)
  return selection
}

export async function getUserVertical(kv: KVNamespace, userId: string): Promise<UserVertical | null> {
  return readJson<UserVertical>(kv, `vertical:${userId}`)
}

export async function listServiceRequests(kv: KVNamespace, userId: string): Promise<ServiceRequest[]> {
  return (await readJson<ServiceRequest[]>(kv, `requests:${userId}`)) || []
}

export async function saveServiceRequests(kv: KVNamespace, userId: string, requests: ServiceRequest[]): Promise<void> {
  await writeJson(kv, `requests:${userId}`, requests)
}

export async function listAssets(kv: KVNamespace, userId: string): Promise<Asset[]> {
  return (await readJson<Asset[]>(kv, `assets:${userId}`)) || []
}

export async function saveAssets(kv: KVNamespace, userId: string, assets: Asset[]): Promise<void> {
  await writeJson(kv, `assets:${userId}`, assets)
}

export const VERTICALS = [
  {
    id: 'retail',
    name: 'Retail',
    description: 'Transform your retail operations with AI-powered customer insights and inventory optimization.',
    features: ['Smart Recommendations', 'Inventory Management', 'Customer Analytics'],
    isActive: true,
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Streamline restaurant operations with intelligent order management and customer service.',
    features: ['Order Optimization', 'Menu Analytics', 'Staff Scheduling'],
    isActive: true,
  },
  {
    id: 'store-market',
    name: 'Marketplace',
    description: 'Optimize marketplace operations with AI-driven vendor management and customer insights.',
    features: ['Vendor Analytics', 'Price Optimization', 'Customer Segmentation'],
    isActive: true,
  },
  {
    id: 'business',
    name: 'Enterprise',
    description: 'Custom AI solutions tailored for your unique business needs and workflows.',
    features: ['Custom Workflows', 'Advanced Analytics', 'Enterprise Security'],
    isActive: true,
  },
]
