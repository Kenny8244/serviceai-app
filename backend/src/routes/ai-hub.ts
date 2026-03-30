import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { supabase } from '../config/supabase'

const router = express.Router()

// GET /api/ai/workflows - Get AI workflows
router.get('/workflows', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId

    const { data: workflows, error } = await supabase
      .from('ai_workflows')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedWorkflows = workflows?.map(workflow => ({
      id: workflow.id,
      name: workflow.workflow_name,
      description: workflow.description,
      type: workflow.workflow_type,
      status: workflow.is_active ? 'active' : 'inactive',
      executions: workflow.execution_count || 0,
      successRate: workflow.success_rate || 0,
      createdAt: workflow.created_at,
      lastRun: workflow.last_execution_at
    })) || []

    res.json({ workflows: formattedWorkflows })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    res.status(500).json({ error: 'Failed to fetch workflows' })
  }
})

// POST /api/ai/workflows - Create new AI workflow
router.post('/workflows', authenticateToken, async (req, res) => {
  try {
    const { name, description, type, configuration } = req.body
    const organizationId = req.user.organizationId

    const { data: workflow, error } = await supabase
      .from('ai_workflows')
      .insert({
        workflow_name: name,
        description,
        workflow_type: type,
        configuration,
        organization_id: organizationId,
        is_active: true,
        execution_count: 0,
        success_rate: 0
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      id: workflow.id,
      name: workflow.workflow_name,
      description: workflow.description,
      type: workflow.workflow_type,
      status: 'active',
      executions: 0,
      successRate: 0,
      createdAt: workflow.created_at,
      lastRun: null
    })
  } catch (error) {
    console.error('Error creating workflow:', error)
    res.status(500).json({ error: 'Failed to create workflow' })
  }
})

// PUT /api/ai/workflows/:id - Update workflow
router.put('/workflows/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, configuration, isActive } = req.body

    const updateData: any = {}
    if (name) updateData.workflow_name = name
    if (description !== undefined) updateData.description = description
    if (configuration) updateData.configuration = configuration
    if (isActive !== undefined) updateData.is_active = isActive

    const { data: workflow, error } = await supabase
      .from('ai_workflows')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .select()
      .single()

    if (error) throw error

    res.json({
      id: workflow.id,
      name: workflow.workflow_name,
      description: workflow.description,
      type: workflow.workflow_type,
      status: workflow.is_active ? 'active' : 'inactive',
      executions: workflow.execution_count || 0,
      successRate: workflow.success_rate || 0,
      createdAt: workflow.created_at,
      lastRun: workflow.last_execution_at
    })
  } catch (error) {
    console.error('Error updating workflow:', error)
    res.status(500).json({ error: 'Failed to update workflow' })
  }
})

// DELETE /api/ai/workflows/:id - Delete workflow
router.delete('/workflows/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('ai_workflows')
      .update({ is_active: false })
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)

    if (error) throw error

    res.json({ message: 'Workflow deleted successfully' })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    res.status(500).json({ error: 'Failed to delete workflow' })
  }
})

// GET /api/ai/forms - Get AI forms
router.get('/forms', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId

    const { data: forms, error } = await supabase
      .from('ai_forms')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedForms = forms?.map(form => ({
      id: form.id,
      name: form.form_name,
      description: form.description,
      fields: form.form_fields || [],
      submissions: form.submission_count || 0,
      status: form.is_active ? 'published' : 'draft',
      createdAt: form.created_at,
      lastSubmission: form.last_submission_at
    })) || []

    res.json({ forms: formattedForms })
  } catch (error) {
    console.error('Error fetching forms:', error)
    res.status(500).json({ error: 'Failed to fetch forms' })
  }
})

// POST /api/ai/forms - Create new AI form
router.post('/forms', authenticateToken, async (req, res) => {
  try {
    const { name, description, fields } = req.body
    const organizationId = req.user.organizationId

    const { data: form, error } = await supabase
      .from('ai_forms')
      .insert({
        form_name: name,
        description,
        form_fields: fields,
        organization_id: organizationId,
        is_active: true,
        submission_count: 0
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      id: form.id,
      name: form.form_name,
      description: form.description,
      fields: form.form_fields || [],
      submissions: 0,
      status: 'published',
      createdAt: form.created_at,
      lastSubmission: null
    })
  } catch (error) {
    console.error('Error creating form:', error)
    res.status(500).json({ error: 'Failed to create form' })
  }
})

// POST /api/ai/generate - Generate AI content based on prompt
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { type, prompt } = req.body

    // This would integrate with an AI service (OpenAI, etc.)
    // For now, we'll simulate AI generation based on the type and prompt

    let generatedContent = {}

    if (type === 'workflow') {
      generatedContent = {
        type: 'workflow',
        name: 'AI Generated Workflow',
        description: 'Workflow generated based on your requirements',
        steps: [
          { id: 1, name: 'Trigger Event', description: 'Start workflow when condition is met' },
          { id: 2, name: 'Process Data', description: 'Handle and transform data' },
          { id: 3, name: 'Send Notification', description: 'Notify relevant team members' },
          { id: 4, name: 'Complete Action', description: 'Finalize the workflow process' }
        ],
        configuration: {
          triggerType: 'event',
          conditions: prompt.split(' ').slice(0, 3).join(' '),
          actions: ['notification', 'data_processing']
        }
      }
    } else if (type === 'form') {
      generatedContent = {
        type: 'form',
        name: 'AI Generated Form',
        description: 'Form generated based on your requirements',
        fields: [
          { id: 1, type: 'text', label: 'Name', required: true },
          { id: 2, type: 'email', label: 'Email', required: true },
          { id: 3, type: 'textarea', label: 'Description', required: true },
          { id: 4, type: 'select', label: 'Priority', required: true, options: ['Low', 'Medium', 'High'] }
        ]
      }
    } else if (type === 'service') {
      generatedContent = {
        type: 'service',
        name: 'AI Generated Service',
        description: 'Service configuration generated based on your requirements',
        configuration: {
          name: prompt.split(' ').slice(0, 2).join(' '),
          type: 'automated',
          settings: {
            priority: 'medium',
            autoAssign: true,
            notifications: true
          }
        }
      }
    }

    res.json({
      success: true,
      generatedContent,
      message: `AI generated ${type} based on your requirements`
    })
  } catch (error) {
    console.error('Error generating AI content:', error)
    res.status(500).json({ error: 'Failed to generate AI content' })
  }
})

// GET /api/ai/templates - Get AI creation templates
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const templates = [
      {
        id: 'customer-feedback',
        name: 'Customer Feedback Form',
        type: 'form',
        description: 'AI-generated form for collecting customer satisfaction',
        icon: 'file-text'
      },
      {
        id: 'service-workflow',
        name: 'Service Request Workflow',
        type: 'workflow',
        description: 'Automated workflow for handling service requests',
        icon: 'workflow'
      },
      {
        id: 'performance-dashboard',
        name: 'Performance Dashboard',
        type: 'dashboard',
        description: 'AI-configured analytics dashboard',
        icon: 'bar-chart'
      },
      {
        id: 'support-system',
        name: 'Support Ticket System',
        type: 'service',
        description: 'Complete ticket management system',
        icon: 'ticket'
      }
    ]

    res.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    res.status(500).json({ error: 'Failed to fetch templates' })
  }
})

export default router
