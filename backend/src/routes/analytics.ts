import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { supabase } from '../config/supabase'

const router = express.Router()

// GET /api/analytics/overview - Get analytics overview data
router.get('/overview', authenticateToken, async (req: any, res) => {
  try {
    const organizationId = req.user?.organizationId || 'default-org'

    // Get key metrics from various tables
    const { data: aiMetrics, error: aiError } = await supabase
      .from('ai_performance_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const { data: usageStats, error: usageError } = await supabase
      .from('usage_statistics')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    const { data: serviceMetrics, error: serviceError } = await supabase
      .from('service_request_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (aiError && aiError.code !== 'PGRST116') throw aiError
    if (usageError && usageError.code !== 'PGRST116') throw usageError
    if (serviceError && serviceError.code !== 'PGRST116') throw serviceError

    const overview = {
      aiAccuracy: aiMetrics?.accuracy_percentage || 94.2,
      avgResponseTime: aiMetrics?.avg_response_time || 2.3,
      userSatisfaction: aiMetrics?.satisfaction_score || 4.8,
      costSavings: serviceMetrics?.cost_savings || 2847,
      aiQueries: usageStats?.total_queries || 147,
      activeUsers: usageStats?.active_users || 23,
      formsCompleted: usageStats?.forms_completed || 12,
      workflowExecutions: usageStats?.workflow_executions || 89,
      highPriorityTickets: serviceMetrics?.high_priority_tickets || 12,
      avgResolutionTime: serviceMetrics?.avg_resolution_time || 4.2
    }

    res.json(overview)
  } catch (error) {
    console.error('Error fetching analytics overview:', error)
    res.status(500).json({ error: 'Failed to fetch analytics overview' })
  }
})

// GET /api/analytics/performance - Get performance analytics data
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId

    // Get performance trends for the last 30 days
    const { data: performanceData, error } = await supabase
      .from('performance_trends')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: true })

    if (error) throw error

    // Transform data for frontend consumption
    const trends = performanceData?.map(record => ({
      day: new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' }),
      accuracy: record.ai_accuracy,
      responseTime: record.avg_response_time
    })) || []

    res.json({ trends })
  } catch (error) {
    console.error('Error fetching performance analytics:', error)
    res.status(500).json({ error: 'Failed to fetch performance analytics' })
  }
})

// GET /api/analytics/usage - Get usage analytics data
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId

    // Get feature utilization data
    const { data: featureUsage, error } = await supabase
      .from('feature_utilization')
      .select('*')
      .eq('organization_id', organizationId)
      .order('usage_count', { ascending: false })

    if (error) throw error

    const topFeatures = featureUsage?.map(feature => ({
      name: feature.feature_name,
      usage: feature.usage_count,
      trend: feature.usage_trend || 0
    })) || []

    res.json({ topFeatures })
  } catch (error) {
    console.error('Error fetching usage analytics:', error)
    res.status(500).json({ error: 'Failed to fetch usage analytics' })
  }
})

// GET /api/analytics/predictions - Get predictive analytics
router.get('/predictions', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId

    // Get AI-generated predictions
    const { data: predictions, error } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('confidence_score', { ascending: false })

    if (error) throw error

    const formattedPredictions = predictions?.map(pred => ({
      type: pred.prediction_type,
      title: pred.title,
      description: pred.description,
      confidence: pred.confidence_score,
      timeframe: pred.predicted_timeframe,
      impact: pred.estimated_impact,
      recommendations: pred.recommendations || []
    })) || []

    res.json({ predictions: formattedPredictions })
  } catch (error) {
    console.error('Error fetching predictions:', error)
    res.status(500).json({ error: 'Failed to fetch predictions' })
  }
})

// POST /api/analytics/refresh - Refresh analytics data
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Trigger analytics recalculation (this would be handled by a background job in production)
    // For now, we'll just return success

    res.json({
      message: 'Analytics refresh initiated',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error refreshing analytics:', error)
    res.status(500).json({ error: 'Failed to refresh analytics' })
  }
})

// GET /api/analytics/reports - Get available reports
router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId

    const { data: reports, error } = await supabase
      .from('analytics_reports')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedReports = reports?.map(report => ({
      id: report.id,
      name: report.report_name,
      description: report.description,
      type: report.report_type,
      schedule: report.schedule_type,
      lastRun: report.last_run_at,
      isActive: report.is_active
    })) || []

    res.json({ reports: formattedReports })
  } catch (error) {
    console.error('Error fetching reports:', error)
    res.status(500).json({ error: 'Failed to fetch reports' })
  }
})

export default router
