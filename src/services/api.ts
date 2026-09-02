const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber: string;
  jobTitle?: string | null;
  companySize?: string | null;
  industry?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserVertical {
  userId: string;
  verticalId: string;
  selectedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
  selectedVertical?: UserVertical | null;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber: string;
  jobTitle?: string;
  companySize?: string;
  industry?: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  verticalId: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: string
  lastActive: Date
  joinDate: Date
  permissions: string[]
  expertise: string[]
  workload: number
  stats: {
    ticketsResolved: number
    avgResponseTime: string
    satisfaction: number
  }
}

export interface Vertical {
  id: string;
  name: string;
  description: string;
  features: string[];
  isActive: boolean;
}

export interface TeamMembersResponse {
  teamMembers: TeamMember[]
}

export interface ServiceTicket {
  id: string
  title: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  messages: number
  lastMessage: string
}

export interface CreateServiceRequest {
  verticalId: string;
  title: string;
  description: string;
  category: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  attachments?: string[];
}

export interface Asset {
  id: string
  name: string
  description: string | null
  category: string
  sku: string | null
  quantity: number
  minQuantity: number
  unitCost: number | null
  supplier: string | null
  location: string | null
  tags: string[] | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function pickRaw(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] != null) return obj[key]
  }
  return undefined
}

function normalizeServiceRequest(rawValue: unknown): ServiceRequest {
  const raw = asRecord(rawValue)
  const resolvedAt = pickRaw(raw, 'resolvedAt', 'resolved_at')
  return {
    id: String(raw.id ?? ''),
    userId: String(pickRaw(raw, 'userId', 'user_id') ?? ''),
    verticalId: String(pickRaw(raw, 'verticalId', 'vertical_id') ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    category: String(raw.category ?? ''),
    priority: (raw.priority as ServiceRequest['priority']) || 'medium',
    status: (raw.status as ServiceRequest['status']) || 'open',
    attachments: Array.isArray(raw.attachments) ? (raw.attachments as string[]) : [],
    createdAt: new Date(String(pickRaw(raw, 'createdAt', 'created_at') ?? Date.now())),
    updatedAt: new Date(String(pickRaw(raw, 'updatedAt', 'updated_at') ?? Date.now())),
    resolvedAt: resolvedAt ? new Date(String(resolvedAt)) : undefined,
  }
}

function normalizeAsset(rawValue: unknown): Asset {
  const raw = asRecord(rawValue)
  const unitCost = pickRaw(raw, 'unitCost', 'unit_cost')
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? 'Untitled'),
    description: (pickRaw(raw, 'description') as string | null) ?? null,
    category: String(raw.category ?? 'general'),
    sku: (pickRaw(raw, 'sku') as string | null) ?? null,
    quantity: Number(raw.quantity ?? 0),
    minQuantity: Number(pickRaw(raw, 'minQuantity', 'min_quantity') ?? 0),
    unitCost: unitCost == null || unitCost === '' ? null : Number(unitCost),
    supplier: (pickRaw(raw, 'supplier') as string | null) ?? null,
    location: (pickRaw(raw, 'location') as string | null) ?? null,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : null,
    isActive: pickRaw(raw, 'isActive', 'is_active') !== false,
    createdAt: String(pickRaw(raw, 'createdAt', 'created_at') ?? ''),
    updatedAt: String(pickRaw(raw, 'updatedAt', 'updated_at') ?? ''),
  }
}

function asAssetList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  const assets = asRecord(data).assets
  return Array.isArray(assets) ? assets : []
}

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
  iconKey: DashboardStatIconKey | string
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

class ApiService {
  private getAuthHeaders(jsonBody = false): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      ...(jsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: 'Network error' }));
      const error = new Error(payload.error || 'Request failed') as Error & { status?: number };
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  // Authentication endpoints
  async register(userData: CreateUserRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async demoLogin(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return this.handleResponse<AuthResponse>(response);
  }

  // Vertical endpoints
  async getVerticals(): Promise<{ verticals: Vertical[] }> {
    const response = await fetch(`${API_BASE_URL}/verticals`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ verticals: Vertical[] }>(response);
  }

  async selectVertical(verticalId: string): Promise<UserVertical> {
    const response = await fetch(`${API_BASE_URL}/verticals/select`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify({ verticalId }),
    });
    return this.handleResponse<UserVertical>(response);
  }

  async getSelectedVertical(): Promise<UserVertical | null> {
    const response = await fetch(`${API_BASE_URL}/verticals/selected`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<UserVertical | null>(response);
  }

  // Service Request endpoints
  async getServiceRequests(): Promise<{ serviceRequests: ServiceRequest[] }> {
    const response = await fetch(`${API_BASE_URL}/service-requests`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ serviceRequests?: unknown[] }>(response);
    return {
      serviceRequests: (data.serviceRequests ?? []).map(normalizeServiceRequest),
    };
  }

  async createServiceRequest(serviceRequest: CreateServiceRequest): Promise<{ serviceRequest: ServiceRequest }> {
    const response = await fetch(`${API_BASE_URL}/service-requests`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(serviceRequest),
    });
    const data = await this.handleResponse<{ serviceRequest: unknown }>(response);
    return { serviceRequest: normalizeServiceRequest(data.serviceRequest) };
  }

  async getServiceRequest(id: string): Promise<{ serviceRequest: ServiceRequest }> {
    const response = await fetch(`${API_BASE_URL}/service-requests/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ serviceRequest: unknown }>(response);
    return { serviceRequest: normalizeServiceRequest(data.serviceRequest) };
  }

  // Dashboard endpoints
  async getDashboardOverview(verticalId: string): Promise<DashboardOverview> {
    const params = new URLSearchParams({ verticalId });
    const response = await fetch(`${API_BASE_URL}/dashboard/overview?${params.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<DashboardOverview>(response);
  }

  async getDashboardMetrics() {
    const response = await fetch(`${API_BASE_URL}/dashboard/metrics`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getProductsCount() {
    const response = await fetch(`${API_BASE_URL}/dashboard/products/count`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getActiveCustomers() {
    const response = await fetch(`${API_BASE_URL}/dashboard/customers/active`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getMonthlyRevenue() {
    const response = await fetch(`${API_BASE_URL}/dashboard/revenue/monthly`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getRecentActivity() {
    const response = await fetch(`${API_BASE_URL}/dashboard/activity/recent`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async queryAIAssistant(query: string) {
    const response = await fetch(`${API_BASE_URL}/assistant/query`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify({ query }),
    });
    return this.handleResponse(response);
  }

  async markAlertAsRead(alertId: string) {
    const response = await fetch(`${API_BASE_URL}/dashboard/alerts/${alertId}/read`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Team Management endpoints
  async getTeamMembers(): Promise<TeamMembersResponse> {
    const response = await fetch(`${API_BASE_URL}/team`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<TeamMembersResponse>(response);
  }

  async createTeamMember(memberData: {
    name: string;
    email: string;
    role: string;
    expertise?: string[];
  }) {
    const response = await fetch(`${API_BASE_URL}/team`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(memberData),
    });
    return this.handleResponse(response);
  }

  async updateTeamMember(memberId: string, updates: any) {
    const response = await fetch(`${API_BASE_URL}/team/${memberId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deleteTeamMember(memberId: string) {
    const response = await fetch(`${API_BASE_URL}/team/${memberId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateTeamMemberWorkload(memberId: string, workload: number) {
    const response = await fetch(`${API_BASE_URL}/team/${memberId}/workload`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify({ workload }),
    });
    return this.handleResponse(response);
  }

  // Analytics endpoints
  async getAnalyticsOverview() {
    const response = await fetch(`${API_BASE_URL}/analytics/overview`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAnalyticsPerformance() {
    const response = await fetch(`${API_BASE_URL}/analytics/performance`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAnalyticsUsage() {
    const response = await fetch(`${API_BASE_URL}/analytics/usage`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAnalyticsPredictions() {
    const response = await fetch(`${API_BASE_URL}/analytics/predictions`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async refreshAnalytics() {
    const response = await fetch(`${API_BASE_URL}/analytics/refresh`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // AI Hub endpoints
  async getAIWorkflows() {
    const response = await fetch(`${API_BASE_URL}/ai-hub/workflows`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createAIWorkflow(workflowData: {
    name: string;
    description: string;
    type: string;
    configuration?: any;
  }) {
    const response = await fetch(`${API_BASE_URL}/ai-hub/workflows`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(workflowData),
    });
    return this.handleResponse(response);
  }

  async updateAIWorkflow(workflowId: string, updates: any) {
    const response = await fetch(`${API_BASE_URL}/ai-hub/workflows/${workflowId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deleteAIWorkflow(workflowId: string) {
    const response = await fetch(`${API_BASE_URL}/ai-hub/workflows/${workflowId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAIForms() {
    const response = await fetch(`${API_BASE_URL}/ai-hub/forms`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createAIForm(formData: {
    name: string;
    description: string;
    fields: any[];
  }) {
    const response = await fetch(`${API_BASE_URL}/ai-hub/forms`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(formData),
    });
    return this.handleResponse(response);
  }

  async generateAIContent(type: string, prompt: string) {
    const response = await fetch(`${API_BASE_URL}/ai-hub/generate`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify({ type, prompt }),
    });
    return this.handleResponse(response);
  }

  async getAICreationTemplates() {
    const response = await fetch(`${API_BASE_URL}/ai-hub/templates`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Asset Management endpoints
  async getAssets(filters: {
    category?: string
    supplier?: string
    location?: string
    search?: string
    lowStock?: boolean
    page?: number
    limit?: number
  } = {}): Promise<Asset[]> {
    const queryParams = new URLSearchParams();
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.supplier) queryParams.append('supplier', filters.supplier);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.lowStock) queryParams.append('lowStock', 'true');
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());

    const response = await fetch(`${API_BASE_URL}/assets?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<unknown>(response);
    return asAssetList(data).map(normalizeAsset);
  }

  async getAssetById(assetId: string) {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createAsset(assetData: any) {
    const response = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(assetData),
    });
    return this.handleResponse(response);
  }

  async updateAsset(assetId: string, updates: any) {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deleteAsset(assetId: string) {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAssetTransactions(assetId: string, page: number = 1, limit: number = 50) {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}/transactions?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createInventoryTransaction(assetId: string, transactionData: any) {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}/transactions`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(transactionData),
    });
    return this.handleResponse(response);
  }

  // Settings endpoints
  async getSystemSettings() {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateSystemSettings(settings: any) {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(settings),
    });
    return this.handleResponse(response);
  }

  async getOrganizationDetails() {
    const response = await fetch(`${API_BASE_URL}/settings/organization`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateOrganizationDetails(orgData: any) {
    const response = await fetch(`${API_BASE_URL}/settings/organization`, {
      method: 'PUT',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(orgData),
    });
    return this.handleResponse(response);
  }

  async getAIConfiguration() {
    const response = await fetch(`${API_BASE_URL}/settings/ai-config`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateAIConfiguration(config: any) {
    const response = await fetch(`${API_BASE_URL}/settings/ai-config`, {
      method: 'PUT',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(config),
    });
    return this.handleResponse(response);
  }

  async getIntegrations() {
    const response = await fetch(`${API_BASE_URL}/settings/integrations`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createIntegration(integrationData: any) {
    const response = await fetch(`${API_BASE_URL}/settings/integrations`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(integrationData),
    });
    return this.handleResponse(response);
  }

  // Token management
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
    const userId = this.readUserIdFromToken(token);
    if (userId) {
      localStorage.setItem('authUserId', userId);
    }
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getAuthUserId(): string | null {
    const stored = localStorage.getItem('authUserId');
    if (stored) return stored;
    const token = this.getAuthToken();
    return token ? this.readUserIdFromToken(token) : null;
  }

  clearAuthToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUserId');
  }

  private readUserIdFromToken(token: string): string | null {
    try {
      const part = token.split('.')[1];
      if (!part) return null;
      const padded = part.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (part.length % 4)) % 4);
      const payload = JSON.parse(atob(padded)) as { userId?: string };
      return typeof payload.userId === 'string' ? payload.userId : null;
    } catch {
      return null;
    }
  }
}

export const apiService = new ApiService();







