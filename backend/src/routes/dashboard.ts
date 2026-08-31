import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { supabase } from '../config/supabase'
import { getDashboardOverview } from '../data/dashboardMocks'

const router = express.Router()

// GET /api/dashboard/overview - Workspace KPI and activity for the selected vertical.
// Auth is omitted for now because the live dashboard is reachable without a JWT.
// Add authenticateToken here when replacing mocks with org-scoped queries.
router.get('/overview', (req, res) => {
  try {
    const verticalId = typeof req.query.verticalId === 'string' ? req.query.verticalId : undefined
    res.json(getDashboardOverview(verticalId))
  } catch (error) {
    console.error('Error fetching dashboard overview:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard overview' })
  }
})

// GET /api/dashboard/metrics - Get detailed metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId

    // Get metrics for the last 30 days
    const { data: dailyMetrics, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: true })

    if (error) throw error

    const metrics = dailyMetrics?.map(metric => ({
      date: metric.date,
      users: metric.active_users,
      tickets: metric.tickets_created,
      completed: metric.tasks_completed,
      satisfaction: metric.avg_satisfaction
    })) || []

    res.json({ metrics })
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' })
  }
})

// GET /api/dashboard/alerts - Get system alerts
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId

    const { data: alerts, error } = await supabase
      .from('system_alerts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedAlerts = alerts?.map(alert => ({
      id: alert.id,
      type: alert.alert_type,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      createdAt: alert.created_at,
      isRead: alert.is_read || false
    })) || []

    res.json({ alerts: formattedAlerts })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    res.status(500).json({ error: 'Failed to fetch alerts' })
  }
})

// POST /api/dashboard/alerts/:id/read - Mark alert as read
router.post('/alerts/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('system_alerts')
      .update({ is_read: true })
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)

    if (error) throw error

    res.json({ message: 'Alert marked as read' })
  } catch (error) {
    console.error('Error marking alert as read:', error)
    res.status(500).json({ error: 'Failed to mark alert as read' })
  }
})

// GET /api/dashboard/quick-stats - Get quick statistics for widgets
router.get('/quick-stats', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId

    // Get current period stats
    const { data: currentStats, error } = await supabase
      .from('current_period_stats')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    const defaultStats = {
      totalRevenue: 0,
      newCustomers: 0,
      serviceRequests: 0,
      systemUptime: 99.9,
      avgResponseTime: '2.3h',
      customerSatisfaction: 4.8
    }

    res.json(currentStats || defaultStats)
  } catch (error) {
    console.error('Error fetching quick stats:', error)
    res.status(500).json({ error: 'Failed to fetch quick stats' })
  }
})

export default router
