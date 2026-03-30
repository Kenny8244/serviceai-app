import { supabase, supabaseAdmin, DatabaseUser, DatabaseVertical, DatabaseUserVertical, DatabaseServiceRequest, DatabaseAsset, DatabaseInventoryTransaction, isDemoMode, fallbackUsers, fallbackUserVerticals, fallbackServiceRequests, fallbackAssets, fallbackInventoryTransactions } from '../config/supabase'
import { User } from '../models/User'
import { Vertical, UserVertical } from '../models/Vertical'

// Convert database user to API user
export const mapDatabaseUserToUser = (dbUser: DatabaseUser): User => ({
  id: dbUser.id,
  email: dbUser.email,
  firstName: dbUser.first_name,
  lastName: dbUser.last_name,
  companyName: dbUser.company_name,
  phoneNumber: dbUser.phone_number,
  jobTitle: dbUser.job_title ?? undefined,
  companySize: dbUser.company_size ?? undefined,
  industry: dbUser.industry ?? undefined,
  passwordHash: dbUser.password_hash,
  createdAt: new Date(dbUser.created_at),
  updatedAt: new Date(dbUser.updated_at),
})

// Convert database vertical to API vertical
export const mapDatabaseVerticalToVertical = (dbVertical: DatabaseVertical): Vertical => ({
  id: dbVertical.id,
  name: dbVertical.name,
  description: dbVertical.description,
  features: dbVertical.features,
  isActive: dbVertical.is_active,
})

// Demo mode fallback functions
const fallbackFindUserByEmail = (email: string): User | null => {
  const user = fallbackUsers.find((user: any) => user.email.toLowerCase() === email.toLowerCase())
  return user ? mapDatabaseUserToUser(user) : null
}

const fallbackFindUserById = (id: string): User | null => {
  const user = fallbackUsers.find((user: any) => user.id === id)
  return user ? mapDatabaseUserToUser(user) : null
}

const fallbackCreateUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User => {
  const newUser: DatabaseUser = {
    id: generateId(),
    email: userData.email,
    first_name: userData.firstName,
    last_name: userData.lastName,
    company_name: userData.companyName,
    phone_number: userData.phoneNumber,
    job_title: userData.jobTitle || undefined,
    company_size: userData.companySize || undefined,
    industry: userData.industry || undefined,
    password_hash: userData.passwordHash,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  fallbackUsers.push(newUser)
  return mapDatabaseUserToUser(newUser)
}

const fallbackSelectVertical = async (userId: string, verticalId: string): Promise<UserVertical> => {
  // Remove any existing selection for this user
  const existingIndex = fallbackUserVerticals.findIndex((uv: any) => uv.user_id === userId)
  if (existingIndex !== -1) {
    fallbackUserVerticals.splice(existingIndex, 1)
  }

  // Add new selection
  const newSelection: DatabaseUserVertical = {
    id: generateId(),
    user_id: userId,
    vertical_id: verticalId,
    selected_at: new Date().toISOString(),
  }
  fallbackUserVerticals.push(newSelection)

  return {
    userId: newSelection.user_id,
    verticalId: newSelection.vertical_id,
    selectedAt: new Date(newSelection.selected_at),
  }
}

const fallbackGetUserVertical = async (userId: string): Promise<UserVertical | null> => {
  const userVertical = fallbackUserVerticals.find((uv: any) => uv.user_id === userId)
  return userVertical ? {
    userId: userVertical.user_id,
    verticalId: userVertical.vertical_id,
    selectedAt: new Date(userVertical.selected_at),
  } : null
}

const fallbackGetVerticals = async (): Promise<Vertical[]> => {
  const verticals: Vertical[] = [
    {
      id: "retail",
      name: "Retail",
      description: "Transform your retail operations with AI-powered customer insights and inventory optimization.",
      features: ["Smart Recommendations", "Inventory Management", "Customer Analytics"],
      isActive: true,
    },
    {
      id: "restaurant",
      name: "Restaurant",
      description: "Streamline restaurant operations with intelligent order management and customer service.",
      features: ["Order Optimization", "Menu Analytics", "Staff Scheduling"],
      isActive: true,
    },
    {
      id: "store-market",
      name: "Marketplace",
      description: "Optimize marketplace operations with AI-driven vendor management and customer insights.",
      features: ["Vendor Analytics", "Price Optimization", "Customer Segmentation"],
      isActive: true,
    },
    {
      id: "business",
      name: "Enterprise",
      description: "Custom AI solutions tailored for your unique business needs and workflows.",
      features: ["Custom Workflows", "Advanced Analytics", "Enterprise Security"],
      isActive: true,
    },
  ]
  return verticals
}

// Helper functions with fallback support
export const findUserByEmail = async (email: string): Promise<User | null> => {
  if (isDemoMode()) {
    return fallbackFindUserByEmail(email)
  }

  try {
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !data) {
      return null
    }

    return mapDatabaseUserToUser(data)
  } catch (error) {
    console.error('Error finding user by email:', error)
    return null
  }
}

export const findUserById = async (id: string): Promise<User | null> => {
  if (isDemoMode()) {
    return fallbackFindUserById(id)
  }

  try {
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return mapDatabaseUserToUser(data)
  } catch (error) {
    console.error('Error finding user by ID:', error)
    return null
  }
}

export const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
  if (isDemoMode()) {
    return fallbackCreateUser(userData)
  }

  try {
    const { data, error } = await supabaseAdmin!
      .from('users')
      .insert({
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        company_name: userData.companyName,
        phone_number: userData.phoneNumber,
        job_title: userData.jobTitle ?? undefined,
        company_size: userData.companySize ?? undefined,
        industry: userData.industry ?? undefined,
        password_hash: userData.passwordHash,
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create user')
    }

    return mapDatabaseUserToUser(data)
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export const selectVertical = async (userId: string, verticalId: string): Promise<UserVertical> => {
  if (isDemoMode()) {
    return fallbackSelectVertical(userId, verticalId)
  }

  try {
    // First, remove any existing selection for this user
    await supabaseAdmin!
      .from('user_verticals')
      .delete()
      .eq('user_id', userId)

    // Insert new selection
    const { data, error } = await supabaseAdmin!
      .from('user_verticals')
      .insert({
        user_id: userId,
        vertical_id: verticalId,
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Failed to select vertical')
    }

    return {
      userId: data.user_id,
      verticalId: data.vertical_id,
      selectedAt: new Date(data.selected_at),
    }
  } catch (error) {
    console.error('Error selecting vertical:', error)
    throw error
  }
}

export const getUserVertical = async (userId: string): Promise<UserVertical | null> => {
  if (isDemoMode()) {
    return fallbackGetUserVertical(userId)
  }

  try {
    const { data, error } = await supabase!
      .from('user_verticals')
      .select(`
        user_id,
        vertical_id,
        selected_at,
        verticals (
          id,
          name,
          description,
          features,
          is_active
        )
      `)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      userId: data.user_id,
      verticalId: data.vertical_id,
      selectedAt: new Date(data.selected_at),
    }
  } catch (error) {
    console.error('Error getting user vertical:', error)
    return null
  }
}

export const getVerticals = async (): Promise<Vertical[]> => {
  if (isDemoMode()) {
    return fallbackGetVerticals()
  }

  try {
    const { data, error } = await supabase!
      .from('verticals')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      throw new Error(error.message)
    }

    return data.map(mapDatabaseVerticalToVertical)
  } catch (error) {
    console.error('Error getting verticals:', error)
    throw error
  }
}

// Service Request functions
export const createServiceRequest = async (serviceRequestData: {
  userId: string
  verticalId: string
  title: string
  description: string
  category: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  attachments?: string[]
}): Promise<DatabaseServiceRequest> => {
  if (isDemoMode()) {
    // Fallback implementation for demo mode
    const newRequest: DatabaseServiceRequest = {
      id: generateId(),
      user_id: serviceRequestData.userId,
      vertical_id: serviceRequestData.verticalId,
      title: serviceRequestData.title,
      description: serviceRequestData.description,
      category: serviceRequestData.category,
      priority: serviceRequestData.priority || 'medium',
      status: 'open',
      attachments: serviceRequestData.attachments || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    fallbackServiceRequests.push(newRequest)
    return newRequest
  }

  try {
    const { data, error } = await supabaseAdmin!
      .from('service_requests')
      .insert({
        user_id: serviceRequestData.userId,
        vertical_id: serviceRequestData.verticalId,
        title: serviceRequestData.title,
        description: serviceRequestData.description,
        category: serviceRequestData.category,
        priority: serviceRequestData.priority || 'medium',
        attachments: serviceRequestData.attachments || [],
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create service request')
    }

    return data
  } catch (error) {
    console.error('Error creating service request:', error)
    throw error
  }
}

export const getUserServiceRequests = async (userId: string): Promise<DatabaseServiceRequest[]> => {
  if (isDemoMode()) {
    return fallbackServiceRequests.filter((req: any) => req.user_id === userId)
  }

  try {
    const { data, error } = await supabase!
      .from('service_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  } catch (error) {
    console.error('Error getting user service requests:', error)
    throw error
  }
}

export const updateServiceRequest = async (
  requestId: string,
  updates: Partial<Pick<DatabaseServiceRequest, 'status' | 'priority' | 'title' | 'description'>>
): Promise<DatabaseServiceRequest> => {
  if (isDemoMode()) {
    // Fallback implementation for demo mode
    const requestIndex = fallbackServiceRequests.findIndex((req: any) => req.id === requestId)
    if (requestIndex === -1) {
      throw new Error('Service request not found')
    }

    const updateData: any = { ...updates, updated_at: new Date().toISOString() }

    // Set resolved_at if status is being changed to resolved or closed
    if (updates.status === 'resolved' || updates.status === 'closed') {
      updateData.resolved_at = new Date().toISOString()
    }

    fallbackServiceRequests[requestIndex] = { ...fallbackServiceRequests[requestIndex], ...updateData }
    return fallbackServiceRequests[requestIndex]
  }

  try {
    const updateData: any = { ...updates }

    // Set resolved_at if status is being changed to resolved or closed
    if (updates.status === 'resolved' || updates.status === 'closed') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin!
      .from('service_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update service request')
    }

    return data
  } catch (error) {
    console.error('Error updating service request:', error)
    throw error
  }
};

// Asset Management Functions
export const getUserAssets = async (userId: string, options?: {
  page?: number;
  limit?: number;
  category?: string;
  supplier?: string;
  location?: string;
  search?: string;
  lowStock?: boolean;
}): Promise<DatabaseAsset[]> => {
  if (isDemoMode()) {
    let filteredAssets = fallbackAssets.filter((asset: DatabaseAsset) => asset.user_id === userId && asset.is_active);

    // Apply filters
    if (options?.category) {
      filteredAssets = filteredAssets.filter(asset => asset.category === options.category);
    }
    if (options?.supplier) {
      filteredAssets = filteredAssets.filter(asset => asset.supplier === options.supplier);
    }
    if (options?.location) {
      filteredAssets = filteredAssets.filter(asset => asset.location === options.location);
    }
    if (options?.search) {
      const searchTerm = options.search.toLowerCase();
      filteredAssets = filteredAssets.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm) ||
        (asset.description && asset.description.toLowerCase().includes(searchTerm)) ||
        (asset.sku && asset.sku.toLowerCase().includes(searchTerm))
      );
    }
    if (options?.lowStock) {
      filteredAssets = filteredAssets.filter(asset => asset.quantity <= asset.min_quantity);
    }

    // Apply pagination
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const startIndex = (page - 1) * limit;
    return filteredAssets.slice(startIndex, startIndex + limit);
  }

  try {
    let query = supabase!
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.supplier) {
      query = query.eq('supplier', options.supplier);
    }
    if (options?.location) {
      query = query.eq('location', options.location);
    }
    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%,sku.ilike.%${options.search}%`);
    }
    if (options?.lowStock) {
      // For low stock, we need to compare quantity <= min_quantity
      // This is complex in Supabase, so we'll handle it in the filter function
      query = query.eq('is_active', true); // Ensure we only get active assets
    }

    // Apply pagination
    if (options?.page && options?.limit) {
      const from = (options.page - 1) * options.limit;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user assets:', error);
    throw error;
  }
};

export const getAssetById = async (assetId: string, userId: string): Promise<DatabaseAsset | null> => {
  if (isDemoMode()) {
    return fallbackAssets.find((asset: DatabaseAsset) =>
      asset.id === assetId && asset.user_id === userId && asset.is_active
    ) || null;
  }

  try {
    const { data, error } = await supabase!
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting asset by ID:', error);
    return null;
  }
};

export const createAsset = async (userId: string, assetData: any): Promise<DatabaseAsset> => {
  if (isDemoMode()) {
    const newAsset: DatabaseAsset = {
      id: generateId(),
      user_id: userId,
      name: assetData.name,
      description: assetData.description || null,
      category: assetData.category,
      sku: assetData.sku || null,
      quantity: assetData.quantity || 0,
      min_quantity: assetData.minQuantity || 10,
      unit_cost: assetData.unitCost || null,
      supplier: assetData.supplier || null,
      location: assetData.location || null,
      tags: assetData.tags || null,
      metadata: assetData.metadata || {},
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    fallbackAssets.push(newAsset);
    return newAsset;
  }

  try {
    const { data, error } = await supabaseAdmin!
      .from('assets')
      .insert({
        user_id: userId,
        name: assetData.name,
        description: assetData.description || null,
        category: assetData.category,
        sku: assetData.sku || null,
        quantity: assetData.quantity || 0,
        min_quantity: assetData.minQuantity || 10,
        unit_cost: assetData.unitCost || null,
        supplier: assetData.supplier || null,
        location: assetData.location || null,
        tags: assetData.tags || null,
        metadata: assetData.metadata || {},
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create asset');
    }

    return data;
  } catch (error) {
    console.error('Error creating asset:', error);
    throw error;
  }
};

export const updateAsset = async (assetId: string, userId: string, updateData: any): Promise<DatabaseAsset | null> => {
  if (isDemoMode()) {
    const assetIndex = fallbackAssets.findIndex((asset: DatabaseAsset) =>
      asset.id === assetId && asset.user_id === userId && asset.is_active
    );

    if (assetIndex === -1) {
      return null;
    }

    fallbackAssets[assetIndex] = {
      ...fallbackAssets[assetIndex],
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    return fallbackAssets[assetIndex];
  }

  try {
    const updatePayload: any = { ...updateData, updated_at: new Date().toISOString() };

    const { data, error } = await supabaseAdmin!
      .from('assets')
      .update(updatePayload)
      .eq('id', assetId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating asset:', error);
    throw error;
  }
};

export const deleteAsset = async (assetId: string, userId: string): Promise<boolean> => {
  if (isDemoMode()) {
    const assetIndex = fallbackAssets.findIndex((asset: DatabaseAsset) =>
      asset.id === assetId && asset.user_id === userId && asset.is_active
    );

    if (assetIndex === -1) {
      return false;
    }

    fallbackAssets[assetIndex].is_active = false;
    return true;
  }

  try {
    const { error } = await supabaseAdmin!
      .from('assets')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', assetId)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error('Error deleting asset:', error);
    return false;
  }
};

export const createInventoryTransaction = async (userId: string, transactionData: any): Promise<DatabaseInventoryTransaction> => {
  if (isDemoMode()) {
    const newTransaction: DatabaseInventoryTransaction = {
      id: generateId(),
      asset_id: transactionData.assetId,
      user_id: userId,
      transaction_type: transactionData.transactionType,
      quantity_change: transactionData.quantityChange,
      reason: transactionData.reason || null,
      reference_id: transactionData.referenceId || null,
      notes: transactionData.notes || null,
      created_at: new Date().toISOString(),
    };
    fallbackInventoryTransactions.push(newTransaction);

    // Update asset quantity in demo mode
    const assetIndex = fallbackAssets.findIndex((asset: DatabaseAsset) => asset.id === transactionData.assetId);
    if (assetIndex !== -1) {
      fallbackAssets[assetIndex].quantity += transactionData.quantityChange;
      fallbackAssets[assetIndex].updated_at = new Date().toISOString();
    }

    return newTransaction;
  }

  try {
    // First, get the current asset to update its quantity
    const { data: assetData } = await supabase!
      .from('assets')
      .select('quantity')
      .eq('id', transactionData.assetId)
      .eq('user_id', userId)
      .single();

    if (!assetData) {
      throw new Error('Asset not found');
    }

    const newQuantity = assetData.quantity + transactionData.quantityChange;

    // Update asset quantity and create transaction in a transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin!
      .from('inventory_transactions')
      .insert({
        asset_id: transactionData.assetId,
        user_id: userId,
        transaction_type: transactionData.transactionType,
        quantity_change: transactionData.quantityChange,
        reason: transactionData.reason || null,
        reference_id: transactionData.referenceId || null,
        notes: transactionData.notes || null,
      })
      .select()
      .single();

    if (transactionError || !transaction) {
      throw new Error(transactionError?.message || 'Failed to create inventory transaction');
    }

    // Update asset quantity
    const { error: updateError } = await supabaseAdmin!
      .from('assets')
      .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq('id', transactionData.assetId)
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return transaction;
  } catch (error) {
    console.error('Error creating inventory transaction:', error);
    throw error;
  }
};

export const getAssetTransactions = async (assetId: string, userId: string, options?: {
  page?: number;
  limit?: number;
}): Promise<DatabaseInventoryTransaction[]> => {
  if (isDemoMode()) {
    let filteredTransactions = fallbackInventoryTransactions.filter((transaction: DatabaseInventoryTransaction) =>
      transaction.asset_id === assetId && transaction.user_id === userId
    );

    // Apply pagination
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const startIndex = (page - 1) * limit;
    return filteredTransactions.slice(startIndex, startIndex + limit);
  }

  try {
    let query = supabase!
      .from('inventory_transactions')
      .select('*')
      .eq('asset_id', assetId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply pagination
    if (options?.page && options?.limit) {
      const from = (options.page - 1) * options.limit;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error getting asset transactions:', error);
    throw error;
  }
};

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}
