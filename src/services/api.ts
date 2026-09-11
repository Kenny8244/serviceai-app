import { isPublicAuthUrl, notifyAuthSessionChanged } from '@/lib/authSession';
import {
  clearActiveWorkspaceId,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
} from '@/lib/workspaceStorage';

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

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  tenantId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
  selectedVertical?: UserVertical | null;
  workspaceId?: string | null;
}

export interface WorkspaceSessionResponse {
  workspace: Workspace;
  token: string;
  expiresAt: string;
  workspaceId: string;
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
  rememberMe?: boolean;
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
  objectTypeId: string
  objectTypeName: string
  sku: string | null
  quantity: number
  minQuantity: number
  unitCost: number | null
  supplier: string | null
  location: string | null
  tags: string[] | null
  avatar: string | null
  customFields: Record<string, unknown>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ObjectTypeAttributeDataType = 'string' | 'number' | 'boolean' | 'text'

export interface ObjectTypeAttribute {
  id: string
  name: string
  label: string
  dataType: ObjectTypeAttributeDataType
  required: boolean
  order: number
}

export interface ObjectType {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  attributes: ObjectTypeAttribute[]
}

const OBJECT_TYPES_CACHE_TTL_MS = 60_000
let objectTypesCache: ObjectType[] | null = null
let objectTypesCacheAt = 0
let objectTypesInflight: Promise<ObjectType[]> | null = null

export function clearObjectTypesCache(): void {
  objectTypesCache = null
  objectTypesCacheAt = 0
  objectTypesInflight = null
}

export function peekObjectTypesCache(): ObjectType[] | null {
  if (!objectTypesCache || objectTypesCache.length === 0) return null
  if (Date.now() - objectTypesCacheAt > OBJECT_TYPES_CACHE_TTL_MS) return null
  return objectTypesCache
}

function rememberObjectTypes(types: ObjectType[]): void {
  objectTypesCache = types
  objectTypesCacheAt = Date.now()
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
  const customFieldsRaw = pickRaw(raw, 'customFields', 'custom_fields')
  const customFields = asRecord(customFieldsRaw)
  const sku = (pickRaw(raw, 'sku') as string | null) ?? (typeof customFields.sku === 'string' ? customFields.sku : null)
  const location =
    (pickRaw(raw, 'location') as string | null) ?? (typeof customFields.location === 'string' ? customFields.location : null)
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? 'Untitled'),
    description: (pickRaw(raw, 'description') as string | null) ?? (typeof customFields.description === 'string' ? customFields.description : null),
    category: String(raw.category ?? customFields.category ?? 'general'),
    sku,
    quantity: Number(raw.quantity ?? customFields.quantity ?? 0),
    minQuantity: Number(pickRaw(raw, 'minQuantity', 'min_quantity') ?? customFields.min_quantity ?? 0),
    unitCost: unitCost == null || unitCost === ''
      ? customFields.unit_cost == null || customFields.unit_cost === ''
        ? null
        : Number(customFields.unit_cost)
      : Number(unitCost),
    supplier: (pickRaw(raw, 'supplier') as string | null) ?? (typeof customFields.supplier === 'string' ? customFields.supplier : null),
    location,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : null,
    avatar: (pickRaw(raw, 'avatar') as string | null) ?? null,
    customFields,
    objectTypeId: String(pickRaw(raw, 'objectTypeId', 'object_type_id') ?? ''),
    objectTypeName: String(pickRaw(raw, 'objectTypeName', 'object_type_name') ?? ''),
    isActive: pickRaw(raw, 'isActive', 'is_active') !== false,
    createdAt: String(pickRaw(raw, 'createdAt', 'created_at') ?? ''),
    updatedAt: String(pickRaw(raw, 'updatedAt', 'updated_at') ?? ''),
  }
}

function asAttributeDataType(value: unknown): ObjectTypeAttributeDataType {
  const raw = String(value ?? 'string')
  if (raw === 'number' || raw === 'boolean' || raw === 'text' || raw === 'string') return raw
  return 'string'
}

function normalizeObjectTypeAttribute(rawValue: unknown): ObjectTypeAttribute | null {
  const raw = asRecord(rawValue)
  const name = String(raw.name ?? '').trim()
  const id = String(pickRaw(raw, 'id', 'attributeId', 'attribute_id') ?? '')
  if (!id && !name) return null
  const order = Number(pickRaw(raw, 'order', 'sortOrder', 'sort_order') ?? 0)
  return {
    id,
    name,
    label: String(raw.label ?? name),
    dataType: asAttributeDataType(pickRaw(raw, 'dataType', 'data_type')),
    required: pickRaw(raw, 'required', 'isRequired', 'is_required') === true,
    order: Number.isFinite(order) ? order : 0,
  }
}

function normalizeObjectType(rawValue: unknown): ObjectType {
  const raw = asRecord(rawValue)
  const attributesRaw = pickRaw(raw, 'attributes')
  const attributes = Array.isArray(attributesRaw)
    ? attributesRaw
        .map(normalizeObjectTypeAttribute)
        .filter((item): item is ObjectTypeAttribute => item != null)
        .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name))
    : []
  return {
    id: String(pickRaw(raw, 'id', 'objectTypeId', 'object_type_id') ?? ''),
    name: String(raw.name ?? ''),
    description: (pickRaw(raw, 'description') as string | null) ?? null,
    isActive: pickRaw(raw, 'isActive', 'is_active') !== false,
    createdAt: String(pickRaw(raw, 'createdAt', 'created_at') ?? ''),
    updatedAt: String(pickRaw(raw, 'updatedAt', 'updated_at') ?? ''),
    attributes,
  }
}

function asObjectTypeList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  const objectTypes = asRecord(data).objectTypes
  return Array.isArray(objectTypes) ? objectTypes : []
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
    const token = this.getAuthToken();
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
      if (this.shouldEndSession(response)) {
        this.clearAuthToken();
      }
      throw error;
    }
    return response.json();
  }

  private shouldEndSession(response: Response): boolean {
    if (response.status !== 401 && response.status !== 403) return false;
    return !isPublicAuthUrl(response.url);
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

  // Workspace endpoints
  async listWorkspaces(): Promise<{ workspaces: Workspace[] }> {
    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ workspaces: Workspace[] }>(response);
  }

  async completeOnboardingWorkspace(input: {
    name: string;
    description?: string;
  }): Promise<WorkspaceSessionResponse> {
    const response = await fetch(`${API_BASE_URL}/onboarding/workspace`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(input),
    });
    const data = await this.handleResponse<WorkspaceSessionResponse>(response);
    this.applyWorkspaceSession(data);
    return data;
  }

  async setActiveWorkspace(workspaceId: string): Promise<WorkspaceSessionResponse> {
    const response = await fetch(`${API_BASE_URL}/workspaces/active`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify({ workspaceId }),
    });
    const data = await this.handleResponse<WorkspaceSessionResponse>(response);
    this.applyWorkspaceSession(data);
    return data;
  }

  /**
   * Persist active workspace after auth or restore from API when missing locally.
   */
  async ensureActiveWorkspace(preferredWorkspaceId?: string | null): Promise<string | null> {
    const userId = this.getAuthUserId();
    if (!userId || !this.isAuthenticated()) return null;

    const fromToken = this.readWorkspaceIdFromToken(this.getAuthToken() || '');
    const stored = getActiveWorkspaceId(userId);
    let workspaceId = preferredWorkspaceId || stored || fromToken;

    if (!workspaceId) {
      try {
        const { workspaces } = await this.listWorkspaces();
        workspaceId = workspaces[0]?.id ?? null;
      } catch (error) {
        console.error('Failed to list workspaces:', error);
        return null;
      }
    }

    if (!workspaceId) return null;

    if (workspaceId !== fromToken) {
      try {
        await this.setActiveWorkspace(workspaceId);
        return workspaceId;
      } catch (error) {
        console.error('Failed to activate workspace:', error);
      }
    }

    setActiveWorkspaceId(workspaceId, userId);
    return workspaceId;
  }

  private applyWorkspaceSession(data: WorkspaceSessionResponse): void {
    if (data.token) {
      this.setAuthToken(data.token);
    }
    const userId = this.getAuthUserId();
    const workspaceId = data.workspaceId || data.workspace?.id;
    if (workspaceId) {
      setActiveWorkspaceId(workspaceId, userId);
    }
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

  async getAssetById(assetId: string): Promise<Asset> {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<unknown>(response);
    return normalizeAsset(data);
  }

  async createAsset(assetData: {
    name: string
    objectTypeId?: string
    category?: string
    sku?: string
    quantity?: number
    minQuantity?: number
    unitCost?: number | null
    supplier?: string
    location?: string
    description?: string
    avatar?: string | null
    customFields?: Record<string, unknown>
  }): Promise<Asset> {
    const response = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(assetData),
    });
    const data = await this.handleResponse<unknown>(response);
    return normalizeAsset(data);
  }

  async updateAsset(
    assetId: string,
    updates: {
      name: string
      objectTypeId?: string
      category?: string
      sku?: string
      quantity?: number
      minQuantity?: number
      unitCost?: number | null
      supplier?: string
      location?: string
      description?: string
      avatar?: string | null
      customFields?: Record<string, unknown>
    }
  ): Promise<Asset> {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(true),
      body: JSON.stringify(updates),
    });
    const data = await this.handleResponse<unknown>(response);
    return normalizeAsset(data);
  }

  async deleteAsset(assetId: string) {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getObjectTypes(): Promise<ObjectType[]> {
    const hit = peekObjectTypesCache()
    if (hit) return hit
    if (objectTypesInflight) return objectTypesInflight

    objectTypesInflight = (async () => {
      const response = await fetch(`${API_BASE_URL}/object-types`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })
      const data = await this.handleResponse<unknown>(response)
      const types = asObjectTypeList(data).map(normalizeObjectType)
      rememberObjectTypes(types)
      return types
    })().finally(() => {
      objectTypesInflight = null
    })

    return objectTypesInflight
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
  /**
   * Always localStorage so the session survives browser close.
   * JWT lifetime is 1d by default, 30d when Remember me was used at login.
   */
  setAuthToken(token: string): void {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUserId');
    localStorage.setItem('authToken', token);
    const userId = this.readUserIdFromToken(token);
    if (userId) {
      localStorage.setItem('authUserId', userId);
    } else {
      localStorage.removeItem('authUserId');
    }
    const workspaceId = this.readWorkspaceIdFromToken(token);
    if (workspaceId && userId) {
      setActiveWorkspaceId(workspaceId, userId);
    }
  }

  getAuthToken(): string | null {
    this.promoteSessionToken();
    return localStorage.getItem('authToken');
  }

  getAuthUserId(): string | null {
    this.promoteSessionToken();
    const stored = localStorage.getItem('authUserId');
    if (stored) return stored;
    const token = localStorage.getItem('authToken');
    return token ? this.readUserIdFromToken(token) : null;
  }

  private promoteSessionToken(): void {
    const sessionToken = sessionStorage.getItem('authToken');
    if (!sessionToken || localStorage.getItem('authToken')) {
      return;
    }
    localStorage.setItem('authToken', sessionToken);
    const sessionUserId = sessionStorage.getItem('authUserId');
    if (sessionUserId) {
      localStorage.setItem('authUserId', sessionUserId);
    }
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUserId');
  }

  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    if (!token) return false;
    const payload = this.readTokenPayload(token);
    if (!payload) {
      this.clearAuthToken({ notify: false });
      return false;
    }
    if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
      this.clearAuthToken({ notify: false });
      return false;
    }
    return true;
  }

  clearAuthToken(options?: { notify?: boolean }): void {
    const hadToken = Boolean(
      sessionStorage.getItem('authToken') || localStorage.getItem('authToken')
    );
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUserId');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUserId');
    clearActiveWorkspaceId();
    clearObjectTypesCache();
    if (hadToken && options?.notify !== false) {
      notifyAuthSessionChanged();
    }
  }

  private readUserIdFromToken(token: string): string | null {
    const payload = this.readTokenPayload(token);
    return typeof payload?.userId === 'string' ? payload.userId : null;
  }

  private readWorkspaceIdFromToken(token: string): string | null {
    const payload = this.readTokenPayload(token);
    return typeof payload?.workspaceId === 'string' ? payload.workspaceId : null;
  }

  private readTokenPayload(token: string): { userId?: string; workspaceId?: string; exp?: number } | null {
    try {
      const part = token.split('.')[1];
      if (!part) return null;
      const padded = part.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (part.length % 4)) % 4);
      return JSON.parse(atob(padded)) as { userId?: string; workspaceId?: string; exp?: number };
    } catch {
      return null;
    }
  }
}

export const apiService = new ApiService();







