import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { supabase } from '../config/supabase'

const router = express.Router()

// GET /api/settings - Get system settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId

    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Default settings if none exist
    const defaultSettings = {
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
      theme: 'light'
    }

    res.json(settings || defaultSettings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// PUT /api/settings - Update system settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId
    const updates = req.body

    // Check if settings exist for this organization
    const { data: existingSettings } = await supabase
      .from('system_settings')
      .select('id')
      .eq('organization_id', organizationId)
      .single()

    let result
    if (existingSettings) {
      // Update existing settings
      const { data: updatedSettings, error } = await supabase
        .from('system_settings')
        .update(updates)
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (error) throw error
      result = updatedSettings
    } else {
      // Create new settings
      const { data: newSettings, error } = await supabase
        .from('system_settings')
        .insert({
          organization_id: organizationId,
          ...updates
        })
        .select()
        .single()

      if (error) throw error
      result = newSettings
    }

    res.json({
      message: 'Settings updated successfully',
      settings: result
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

// GET /api/settings/organization - Get organization details
router.get('/organization', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (error) throw error

    res.json({
      id: organization.id,
      name: organization.name,
      industry: organization.industry,
      size: organization.size,
      subscriptionTier: organization.subscription_tier,
      createdAt: organization.created_at,
      settings: organization.settings || {}
    })
  } catch (error) {
    console.error('Error fetching organization:', error)
    res.status(500).json({ error: 'Failed to fetch organization details' })
  }
})

// PUT /api/settings/organization - Update organization details
router.put('/organization', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId
    const { name, industry, size } = req.body

    const { data: organization, error } = await supabase
      .from('organizations')
      .update({
        name,
        industry,
        size
      })
      .eq('id', organizationId)
      .select()
      .single()

    if (error) throw error

    res.json({
      message: 'Organization updated successfully',
      organization: {
        id: organization.id,
        name: organization.name,
        industry: organization.industry,
        size: organization.size,
        subscriptionTier: organization.subscription_tier,
        createdAt: organization.created_at
      }
    })
  } catch (error) {
    console.error('Error updating organization:', error)
    res.status(500).json({ error: 'Failed to update organization' })
  }
})

// GET /api/settings/ai-config - Get AI configuration
router.get('/ai-config', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId

    const { data: aiConfig, error } = await supabase
      .from('ai_configurations')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    const defaultConfig = {
      enableIntelligentRouting: true,
      enablePredictiveMaintenance: true,
      enableAICreation: true,
      accuracyThreshold: 85,
      maxTokensPerRequest: 1000,
      modelVersion: 'gpt-4',
      customPrompts: {},
      apiRateLimit: 100
    }

    res.json(aiConfig || defaultConfig)
  } catch (error) {
    console.error('Error fetching AI config:', error)
    res.status(500).json({ error: 'Failed to fetch AI configuration' })
  }
})

// PUT /api/settings/ai-config - Update AI configuration
router.put('/ai-config', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId
    const updates = req.body

    // Check if AI config exists
    const { data: existingConfig } = await supabase
      .from('ai_configurations')
      .select('id')
      .eq('organization_id', organizationId)
      .single()

    let result
    if (existingConfig) {
      // Update existing config
      const { data: updatedConfig, error } = await supabase
        .from('ai_configurations')
        .update(updates)
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (error) throw error
      result = updatedConfig
    } else {
      // Create new config
      const { data: newConfig, error } = await supabase
        .from('ai_configurations')
        .insert({
          organization_id: organizationId,
          ...updates
        })
        .select()
        .single()

      if (error) throw error
      result = newConfig
    }

    res.json({
      message: 'AI configuration updated successfully',
      config: result
    })
  } catch (error) {
    console.error('Error updating AI config:', error)
    res.status(500).json({ error: 'Failed to update AI configuration' })
  }
})

// GET /api/settings/integrations - Get integration settings
router.get('/integrations', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId

    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (error) throw error

    const formattedIntegrations = integrations?.map(integration => ({
      id: integration.id,
      name: integration.integration_name,
      type: integration.integration_type,
      status: integration.is_active ? 'active' : 'inactive',
      lastSync: integration.last_sync_at,
      configuration: integration.configuration || {}
    })) || []

    res.json({ integrations: formattedIntegrations })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    res.status(500).json({ error: 'Failed to fetch integrations' })
  }
})

// POST /api/settings/integrations - Add new integration
router.post('/integrations', authenticateToken, async (req, res) => {
  try {
    const { name, type, configuration } = req.body
    const organizationId = req.user.organizationId

    const { data: integration, error } = await supabase
      .from('integrations')
      .insert({
        integration_name: name,
        integration_type: type,
        configuration,
        organization_id: organizationId,
        is_active: true,
        last_sync_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      id: integration.id,
      name: integration.integration_name,
      type: integration.integration_type,
      status: 'active',
      lastSync: integration.last_sync_at,
      configuration: integration.configuration || {}
    })
  } catch (error) {
    console.error('Error adding integration:', error)
    res.status(500).json({ error: 'Failed to add integration' })
  }
})

export default router
