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

/** SCRUM-30: ensure demo KV service requests cover all verticals. */
export async function ensureDemoServiceRequestSeed(kv: KVNamespace, userId: string): Promise<void> {
  const existing = await listServiceRequests(kv, userId)
  const covered = new Set(existing.map((r) => r.vertical_id))
  const now = new Date().toISOString()

  const templates: Array<Omit<ServiceRequest, 'id' | 'user_id' | 'created_at' | 'updated_at'>> = [
    {
      vertical_id: 'retail',
      title: 'POS Terminal Front card reader intermittent',
      description: 'Card reader drops mid-transaction at Checkout 1.',
      category: 'Equipment',
      priority: 'high',
      status: 'open',
      attachments: [],
    },
    {
      vertical_id: 'retail',
      title: 'Frozen Aisle Case frosting over',
      description: 'Excess frost on glass — schedule defrost cycle.',
      category: 'Facility',
      priority: 'medium',
      status: 'in_progress',
      attachments: [],
    },
    {
      vertical_id: 'restaurant',
      title: 'Walk-in Freezer A compressor noise',
      description: 'Compressor rattling during night cycle — needs inspection before weekend service.',
      category: 'Equipment',
      priority: 'high',
      status: 'open',
      attachments: [],
    },
    {
      vertical_id: 'restaurant',
      title: 'Dishwasher Station drain slow',
      description: 'Drain backs up after heavy lunch rush. Plumbing follow-up scheduled.',
      category: 'Facility',
      priority: 'medium',
      status: 'in_progress',
      attachments: [],
    },
    {
      vertical_id: 'store-market',
      title: 'Vendor Kiosk Printer jam',
      description: 'Ribbon jam at Booth 12 — swap consumables.',
      category: 'Equipment',
      priority: 'high',
      status: 'open',
      attachments: [],
    },
    {
      vertical_id: 'store-market',
      title: 'Late packing mailers shipment',
      description: 'Vendor Packing Mailers M delayed — escalate supplier.',
      category: 'Supplier',
      priority: 'medium',
      status: 'open',
      attachments: [],
    },
    {
      vertical_id: 'business',
      title: 'Conference Room AV HDMI switch failing',
      description: 'CR-401 cannot switch laptop inputs reliably.',
      category: 'Equipment',
      priority: 'urgent',
      status: 'open',
      attachments: [],
    },
    {
      vertical_id: 'business',
      title: 'Cafe Ice Machine slow fill',
      description: 'Ice production slow — check water filter.',
      category: 'Facility',
      priority: 'medium',
      status: 'in_progress',
      attachments: [],
    },
  ]

  const missing = templates.filter((t) => !covered.has(t.vertical_id))
  if (missing.length === 0) return

  // If vertical already covered, skip all templates for that vertical (add full set only for missing verticals)
  const byVertical = new Map<string, typeof templates>()
  for (const t of missing) {
    const list = byVertical.get(t.vertical_id) || []
    list.push(t)
    byVertical.set(t.vertical_id, list)
  }

  const additions: ServiceRequest[] = []
  for (const [, group] of byVertical) {
    for (const t of group) {
      additions.push({
        ...t,
        id: crypto.randomUUID(),
        user_id: userId,
        created_at: now,
        updated_at: now,
      })
    }
  }

  await saveServiceRequests(kv, userId, [...additions, ...existing])
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
