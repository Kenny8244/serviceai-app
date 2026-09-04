import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createMiddleware } from 'hono/factory'
import type { Env, JwtPayload, ServiceRequest, StoredUser, Variables } from './types'
import { generateToken, getTokenExpiration, publicUser, verifyToken } from './lib/jwt'
import { generateId, hashPassword, verifyPassword } from './lib/crypto'
import {
  AuthHttpError,
  ensureDemoAccount,
  findAccountById,
  hasSupabaseLogin,
  loginAccount,
  registerAccount,
} from './lib/authAccount'
import {
  VERTICALS,
  createUser,
  findUserByEmail,
  findUserById,
  listServiceRequests,
  saveServiceRequests,
  selectVertical,
} from './lib/store'
import { AssetsHttpError, createWorkspaceAsset, deleteWorkspaceAsset, getWorkspaceAsset, listWorkspaceAssets, updateWorkspaceAsset } from './lib/assets'
import { isValidVerticalId, resolveUserVertical, saveTenantVertical } from './lib/tenantVertical'
import {
  AI_FORMS,
  AI_SEARCH_DATA,
  AI_TEMPLATES,
  AI_WORKFLOWS,
  ANALYTICS_OVERVIEW,
  DEFAULT_SETTINGS,
  TEAM_MEMBERS,
  getDashboardOverview,
} from './lib/mocks'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('*', async (c, next) => {
  const origins = [c.env.FRONTEND_URL, 'http://localhost:5173', 'https://serviceai-app.pages.dev']
  return cors({
    origin: (origin) => (origins.includes(origin) ? origin : origins[0]),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })(c, next)
})

const requireAuth = createMiddleware<{ Bindings: Env; Variables: Variables }>(async (c, next) => {
  const header = c.req.header('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return c.json({ error: 'Access token required' }, 401)

  const payload = await verifyToken(c.env, token)
  if (!payload) return c.json({ error: 'Invalid or expired token' }, 403)

  if (hasSupabaseLogin(c.env)) {
    const account = await findAccountById(c.env, payload.userId)
    if (!account) return c.json({ error: 'User not found' }, 403)
  } else {
    const user = await findUserById(c.env.DEMO_KV, payload.userId)
    if (!user) return c.json({ error: 'User not found' }, 403)
  }

  c.set('user', payload)
  await next()
})

app.get('/health', (c) =>
  c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'cloudflare-workers',
  })
)

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (c) => {
  const body = await c.req.json<{
    email: string
    firstName: string
    lastName: string
    companyName: string
    phoneNumber: string
    jobTitle?: string
    companySize?: string
    industry?: string
    password: string
  }>()

  for (const field of ['email', 'firstName', 'lastName', 'companyName', 'phoneNumber', 'password'] as const) {
    if (!body[field]) return c.json({ error: `${field} is required` }, 400)
  }
  if (body.password.length < 8) return c.json({ error: 'Password must be at least 8 characters long' }, 400)

  if (hasSupabaseLogin(c.env)) {
    try {
      const account = await registerAccount(c.env, body)
      const token = await generateToken(c.env, {
        userId: account.id,
        email: account.email,
        organizationId: account.tenantId,
      })
      return c.json({
        user: publicUser(account),
        token,
        expiresAt: getTokenExpiration(),
        selectedVertical: null,
      }, 201)
    } catch (error) {
      if (error instanceof AuthHttpError) return c.json({ error: error.message }, error.status)
      console.error('Registration error:', error)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  const existing = await findUserByEmail(c.env.DEMO_KV, body.email)
  if (existing) return c.json({ error: 'User with this email already exists' }, 409)

  const now = new Date().toISOString()
  const user: StoredUser = {
    id: generateId(),
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    companyName: body.companyName,
    phoneNumber: body.phoneNumber,
    jobTitle: body.jobTitle,
    companySize: body.companySize,
    industry: body.industry,
    passwordHash: await hashPassword(body.password),
    createdAt: now,
    updatedAt: now,
  }
  await createUser(c.env.DEMO_KV, user)

  const token = await generateToken(c.env, { userId: user.id, email: user.email })
  return c.json({
    user: publicUser(user),
    token,
    expiresAt: getTokenExpiration(),
    selectedVertical: null,
  }, 201)
})

app.post('/api/auth/login', async (c) => {
  const { email, password, rememberMe } = await c.req.json<{
    email: string
    password: string
    rememberMe?: boolean
  }>()
  if (!email || !password) return c.json({ error: 'Email and password are required' }, 400)
  const persist = Boolean(rememberMe)

  if (hasSupabaseLogin(c.env)) {
    try {
      const account = await loginAccount(c.env, email, password)
      const token = await generateToken(
        c.env,
        {
          userId: account.id,
          email: account.email,
          organizationId: account.tenantId,
        },
        { rememberMe: persist }
      )
      const selectedVertical = await resolveUserVertical(
        c.env,
        c.env.DEMO_KV,
        account.id,
        account.tenantId
      )
      return c.json({
        user: publicUser(account),
        token,
        expiresAt: getTokenExpiration(persist),
        selectedVertical,
      })
    } catch (error) {
      if (error instanceof AuthHttpError) return c.json({ error: error.message }, error.status)
      console.error('Login error:', error)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  const user = await findUserByEmail(c.env.DEMO_KV, email)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const token = await generateToken(c.env, { userId: user.id, email: user.email }, { rememberMe: persist })
  const selectedVertical = await resolveUserVertical(c.env, c.env.DEMO_KV, user.id)
  return c.json({
    user: publicUser(user),
    token,
    expiresAt: getTokenExpiration(persist),
    selectedVertical,
  })
})

app.post('/api/auth/demo', async (c) => {
  if (hasSupabaseLogin(c.env)) {
    try {
      const account = await ensureDemoAccount(c.env)
      const token = await generateToken(c.env, {
        userId: account.id,
        email: account.email,
        organizationId: account.tenantId,
      })
      const selectedVertical = await resolveUserVertical(
        c.env,
        c.env.DEMO_KV,
        account.id,
        account.tenantId
      )
      return c.json({ user: publicUser(account), token, expiresAt: getTokenExpiration(), selectedVertical })
    } catch (error) {
      if (error instanceof AuthHttpError) return c.json({ error: error.message }, error.status)
      console.error('Demo login error:', error)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  const email = 'demo@simpleserviceai.com'
  let user = await findUserByEmail(c.env.DEMO_KV, email)
  if (!user) {
    const now = new Date().toISOString()
    user = {
      id: generateId(),
      email,
      firstName: 'Demo',
      lastName: 'User',
      companyName: 'Demo Company',
      phoneNumber: '+1 (555) 123-4567',
      jobTitle: 'Demo Manager',
      companySize: '11-50',
      industry: 'technology',
      passwordHash: await hashPassword('demo123'),
      createdAt: now,
      updatedAt: now,
    }
    await createUser(c.env.DEMO_KV, user)
  }

  const token = await generateToken(c.env, { userId: user.id, email: user.email })
  const selectedVertical = await resolveUserVertical(c.env, c.env.DEMO_KV, user.id)
  return c.json({ user: publicUser(user), token, expiresAt: getTokenExpiration(), selectedVertical })
})

// ── Verticals ─────────────────────────────────────────────────────────────────

app.get('/api/verticals', (c) => c.json({ verticals: VERTICALS }))

app.post('/api/verticals/select', requireAuth, async (c) => {
  const { verticalId } = await c.req.json<{ verticalId: string }>()
  if (!verticalId) return c.json({ error: 'Vertical ID is required' }, 400)
  if (!isValidVerticalId(verticalId)) return c.json({ error: 'Invalid vertical' }, 400)
  const user = c.get('user')
  const selected = await selectVertical(c.env.DEMO_KV, user.userId, verticalId)
  await saveTenantVertical(c.env, user.organizationId, verticalId)
  return c.json(selected)
})

app.get('/api/verticals/selected', requireAuth, async (c) => {
  const user = c.get('user')
  const selected = await resolveUserVertical(c.env, c.env.DEMO_KV, user.userId, user.organizationId)
  return c.json(selected)
})

// ── Dashboard ─────────────────────────────────────────────────────────────────

app.get('/api/dashboard/overview', (c) => {
  const verticalId = c.req.query('verticalId')
  return c.json(getDashboardOverview(verticalId))
})

app.get('/api/dashboard/metrics', requireAuth, (c) =>
  c.json({
    metrics: [
      { date: new Date().toISOString().slice(0, 10), users: 23, tickets: 8, completed: 15, satisfaction: 4.8 },
    ],
  })
)

app.get('/api/dashboard/alerts', requireAuth, (c) => c.json({ alerts: [] }))
app.post('/api/dashboard/alerts/:id/read', requireAuth, (c) => c.json({ message: 'Alert marked as read' }))
app.get('/api/dashboard/quick-stats', requireAuth, (c) =>
  c.json({
    totalRevenue: 12450,
    newCustomers: 8,
    serviceRequests: 6,
    systemUptime: 99.9,
    avgResponseTime: '2.3h',
    customerSatisfaction: 4.8,
  })
)
app.get('/api/dashboard/products/count', requireAuth, (c) => c.json({ count: 247 }))
app.get('/api/dashboard/customers/active', requireAuth, (c) => c.json({ count: 89 }))
app.get('/api/dashboard/revenue/monthly', requireAuth, (c) => c.json({ revenue: 12450 }))
app.get('/api/dashboard/activity/recent', requireAuth, (c) => c.json({ activities: [] }))
app.post('/api/assistant/query', requireAuth, async (c) => {
  const { query } = await c.req.json<{ query: string }>()
  return c.json({
    answer: `Based on your data, here is a suggestion related to "${query}". Consider reviewing inventory levels and open service requests this week.`,
    sources: [],
  })
})

// ── Service Requests ──────────────────────────────────────────────────────────

app.get('/api/service-requests', requireAuth, async (c) => {
  const requests = await listServiceRequests(c.env.DEMO_KV, c.get('user').userId)
  return c.json({ serviceRequests: requests })
})

app.post('/api/service-requests', requireAuth, async (c) => {
  const userId = c.get('user').userId
  const body = await c.req.json<{
    verticalId?: string
    title: string
    description: string
    category: string
    priority?: ServiceRequest['priority']
    attachments?: string[]
  }>()
  if (!body.title || !body.description || !body.category) {
    return c.json({ error: 'Title, description, and category are required' }, 400)
  }

  const now = new Date().toISOString()
  const request: ServiceRequest = {
    id: generateId(),
    user_id: userId,
    vertical_id: body.verticalId || 'retail',
    title: body.title,
    description: body.description,
    category: body.category,
    priority: body.priority || 'medium',
    status: 'open',
    attachments: body.attachments || [],
    created_at: now,
    updated_at: now,
  }

  const requests = await listServiceRequests(c.env.DEMO_KV, userId)
  requests.unshift(request)
  await saveServiceRequests(c.env.DEMO_KV, userId, requests)
  return c.json({ serviceRequest: request }, 201)
})

app.get('/api/service-requests/:id', requireAuth, async (c) => {
  const requests = await listServiceRequests(c.env.DEMO_KV, c.get('user').userId)
  const request = requests.find((r) => r.id === c.req.param('id'))
  if (!request) return c.json({ error: 'Service request not found' }, 404)
  return c.json({ serviceRequest: request })
})

app.patch('/api/service-requests/:id', requireAuth, async (c) => {
  const userId = c.get('user').userId
  const requests = await listServiceRequests(c.env.DEMO_KV, userId)
  const index = requests.findIndex((r) => r.id === c.req.param('id'))
  if (index === -1) return c.json({ error: 'Service request not found' }, 404)

  const updates = await c.req.json<Partial<ServiceRequest>>()
  requests[index] = {
    ...requests[index],
    ...updates,
    updated_at: new Date().toISOString(),
    resolved_at:
      updates.status === 'resolved' || updates.status === 'closed'
        ? new Date().toISOString()
        : requests[index].resolved_at,
  }
  await saveServiceRequests(c.env.DEMO_KV, userId, requests)
  return c.json({ serviceRequest: requests[index] })
})

// ── Assets ────────────────────────────────────────────────────────────────────

app.get('/api/assets', requireAuth, async (c) => {
  try {
    const assets = await listWorkspaceAssets(c.env, c.get('user').userId)
    return c.json(assets.filter((a) => a.is_active))
  } catch (error) {
    if (error instanceof AssetsHttpError) return c.json({ error: error.message }, error.status)
    throw error
  }
})

app.get('/api/assets/:id', requireAuth, async (c) => {
  try {
    const asset = await getWorkspaceAsset(c.env, c.get('user').userId, c.req.param('id'))
    if (!asset || !asset.is_active) return c.json({ error: 'Asset not found' }, 404)
    return c.json(asset)
  } catch (error) {
    if (error instanceof AssetsHttpError) return c.json({ error: error.message }, error.status)
    throw error
  }
})

function assetInputFromBody(body: Record<string, unknown>) {
  return {
    name: String(body.name ?? ''),
    category: typeof body.category === 'string' ? body.category : null,
    sku: typeof body.sku === 'string' ? body.sku : null,
    quantity: body.quantity == null || body.quantity === '' ? 0 : Number(body.quantity),
    minQuantity: body.minQuantity == null || body.minQuantity === '' ? 0 : Number(body.minQuantity),
    unitCost: body.unitCost == null || body.unitCost === '' ? null : Number(body.unitCost),
    supplier: typeof body.supplier === 'string' ? body.supplier : null,
    location: typeof body.location === 'string' ? body.location : null,
    description: typeof body.description === 'string' ? body.description : null,
    avatar: typeof body.avatar === 'string' ? body.avatar : null,
  }
}

app.post('/api/assets', requireAuth, async (c) => {
  try {
    const body = await c.req.json<Record<string, unknown>>()
    const asset = await createWorkspaceAsset(c.env, c.get('user').userId, assetInputFromBody(body))
    return c.json(asset, 201)
  } catch (error) {
    if (error instanceof AssetsHttpError) return c.json({ error: error.message }, error.status)
    throw error
  }
})

app.put('/api/assets/:id', requireAuth, async (c) => {
  try {
    const body = await c.req.json<Record<string, unknown>>()
    const asset = await updateWorkspaceAsset(c.env, c.get('user').userId, c.req.param('id'), assetInputFromBody(body))
    return c.json(asset)
  } catch (error) {
    if (error instanceof AssetsHttpError) return c.json({ error: error.message }, error.status)
    throw error
  }
})

app.delete('/api/assets/:id', requireAuth, async (c) => {
  try {
    await deleteWorkspaceAsset(c.env, c.get('user').userId, c.req.param('id'))
    return c.json({ success: true })
  } catch (error) {
    if (error instanceof AssetsHttpError) return c.json({ error: error.message }, error.status)
    throw error
  }
})

app.get('/api/assets/:id/transactions', requireAuth, (c) => c.json([]))
app.post('/api/assets/:id/transactions', requireAuth, (c) => c.json({ id: generateId(), success: true }, 201))

// ── Team ──────────────────────────────────────────────────────────────────────

app.get('/api/team', requireAuth, (c) => c.json({ teamMembers: TEAM_MEMBERS }))
app.post('/api/team', requireAuth, async (c) => {
  const body = await c.req.json<{ name: string; email: string; role: string }>()
  return c.json({ id: generateId(), ...body, status: 'offline' }, 201)
})
app.put('/api/team/:id', requireAuth, (c) => c.json({ message: 'Updated' }))
app.delete('/api/team/:id', requireAuth, (c) => c.json({ message: 'Deleted' }))
app.get('/api/team/stats', requireAuth, (c) => c.json({ totalMembers: TEAM_MEMBERS.length, online: 1 }))
app.post('/api/team/:id/workload', requireAuth, (c) => c.json({ message: 'Workload updated' }))

// ── Analytics ─────────────────────────────────────────────────────────────────

app.get('/api/analytics/overview', requireAuth, (c) => c.json(ANALYTICS_OVERVIEW))
app.get('/api/analytics/performance', requireAuth, (c) =>
  c.json({ trends: [{ day: 'Mon', accuracy: 94, responseTime: 2.1 }] })
)
app.get('/api/analytics/usage', requireAuth, (c) =>
  c.json({ topFeatures: [{ name: 'AI Search', usage: 147, trend: 12 }] })
)
app.get('/api/analytics/predictions', requireAuth, (c) => c.json({ predictions: [] }))
app.post('/api/analytics/refresh', requireAuth, (c) =>
  c.json({ message: 'Analytics refresh initiated', timestamp: new Date().toISOString() })
)
app.get('/api/analytics/reports', requireAuth, (c) => c.json({ reports: [] }))

// ── AI Hub ────────────────────────────────────────────────────────────────────

app.get('/api/ai-hub/workflows', requireAuth, (c) => c.json({ workflows: AI_WORKFLOWS }))
app.post('/api/ai-hub/workflows', requireAuth, async (c) => {
  const body = await c.req.json<{ name: string; description: string; type: string }>()
  return c.json({ id: generateId(), ...body, status: 'active', executions: 0, successRate: 0 }, 201)
})
app.put('/api/ai-hub/workflows/:id', requireAuth, (c) => c.json({ message: 'Updated' }))
app.delete('/api/ai-hub/workflows/:id', requireAuth, (c) => c.json({ message: 'Deleted' }))
app.get('/api/ai-hub/forms', requireAuth, (c) => c.json({ forms: AI_FORMS }))
app.post('/api/ai-hub/forms', requireAuth, async (c) => c.json(await c.req.json(), 201))
app.post('/api/ai-hub/generate', requireAuth, async (c) => {
  const { type, prompt } = await c.req.json<{ type: string; prompt: string }>()
  return c.json({
    content: `Generated ${type} content for: ${prompt}`,
    timestamp: new Date().toISOString(),
  })
})
app.get('/api/ai-hub/templates', requireAuth, (c) => c.json({ templates: AI_TEMPLATES }))

// ── AI Search ─────────────────────────────────────────────────────────────────

app.post('/api/ai-search/search', async (c) => {
  const { query, vertical = 'retail' } = await c.req.json<{ query: string; vertical?: string }>()
  if (!query?.trim()) return c.json({ results: [] })

  const key = vertical === 'store-market' ? 'marketplace' : vertical === 'business' ? 'enterprise' : vertical
  const data = AI_SEARCH_DATA[key] || AI_SEARCH_DATA.retail
  const results = data
    .filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5)

  return c.json({ query, vertical, results, total: results.length, timestamp: new Date().toISOString() })
})

// ── Settings ──────────────────────────────────────────────────────────────────

app.get('/api/settings', requireAuth, (c) => c.json(DEFAULT_SETTINGS))
app.put('/api/settings', requireAuth, async (c) => c.json({ ...(await c.req.json()), updated: true }))
app.get('/api/settings/organization', requireAuth, (c) =>
  c.json({ name: 'Demo Company', size: '11-50', industry: 'technology' })
)
app.put('/api/settings/organization', requireAuth, async (c) => c.json(await c.req.json()))
app.get('/api/settings/ai-config', requireAuth, (c) =>
  c.json({ model: 'gpt-4', temperature: 0.7, maxTokens: 2048 })
)
app.put('/api/settings/ai-config', requireAuth, async (c) => c.json(await c.req.json()))
app.get('/api/settings/integrations', requireAuth, (c) => c.json({ integrations: [] }))
app.post('/api/settings/integrations', requireAuth, async (c) => c.json(await c.req.json(), 201))

// ── Onboarding ────────────────────────────────────────────────────────────────

app.post('/api/onboarding/start', async (c) => {
  const { userId } = await c.req.json<{ userId: string }>()
  return c.json({
    session: {
      id: generateId(),
      userId,
      currentStep: 'welcome',
      progress: { current: 1, total: 7, percentage: 14, estimatedTimeRemaining: 8 },
      userResponses: {},
      aiRecommendations: [],
      completedSteps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    currentStep: { id: 'welcome', title: 'Welcome to ServiceAI!', description: 'Let us get started.', fields: [] },
    aiRecommendations: [],
    canSkip: false,
    canGoBack: false,
  })
})

app.get('/api/onboarding/current', (c) =>
  c.json({
    session: null,
    currentStep: { id: 'welcome', title: 'Welcome', description: '', fields: [] },
    aiRecommendations: [],
    canSkip: true,
    canGoBack: false,
  })
)

app.post('/api/onboarding/step', async (c) => c.json({ success: true, nextStep: 'complete' }))
app.post('/api/onboarding/import/analyze', (c) =>
  c.json({
    analysis: {
      fileName: 'upload.csv',
      totalRows: 100,
      validRows: 95,
      errorRows: 5,
      fieldMapping: {},
      suggestedCategories: ['inventory'],
      dataQuality: { completeness: 95, consistency: 90, accuracy: 88 },
      recommendations: ['Review 5 rows with missing SKU values'],
    },
    aiRecommendations: [],
  })
)
app.get('/api/onboarding/preferences/recommendations', (c) =>
  c.json({ recommendations: ['Enable inventory alerts', 'Connect Google Sheets'] })
)
app.post('/api/onboarding/complete', (c) => c.json({ success: true, redirectTo: '/dashboard' }))

app.notFound((c) => c.json({ error: 'Route not found' }, 404))

export default app
