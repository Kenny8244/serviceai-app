import { Router, Request, Response } from 'express'
import { OnboardingSession, OnboardingStep } from '../models/Onboarding'
import { onboardingService } from '../services/onboardingService'
import { createUser } from '../utils/database'

const router = Router()

// Extend Request type for onboarding
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
      }
    }
  }
}

// Start onboarding session
router.post('/start', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.body.userId

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Create new onboarding session
    const session: OnboardingSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      currentStep: 'welcome',
      progress: {
        current: 1,
        total: 7,
        percentage: 14,
        estimatedTimeRemaining: 8
      },
      userResponses: {},
      aiRecommendations: [],
      completedSteps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Generate initial AI guidance
    const aiRecommendations = await onboardingService.generateStepGuidance('welcome', {})

    res.status(201).json({
      session,
      currentStep: {
        id: 'welcome',
        title: 'Welcome to ServiceAI!',
        description: 'Let\'s get your account set up and optimized for your business needs.',
        instructions: 'I\'ll guide you through each step to ensure you get the most out of ServiceAI.',
        fields: [
          {
            name: 'company_size',
            type: 'select',
            label: 'Company Size',
            required: false,
            options: [
              { value: '1-10', label: '1-10 employees' },
              { value: '11-50', label: '11-50 employees' },
              { value: '51-200', label: '51-200 employees' },
              { value: '201-1000', label: '201-1000 employees' },
              { value: '1000+', label: '1000+ employees' }
            ]
          },
          {
            name: 'industry',
            type: 'text',
            label: 'Industry (optional)',
            required: false,
            placeholder: 'e.g., Retail, Restaurant, Technology'
          }
        ],
        aiAssistance: {
          enabled: true,
          context: 'Getting started with personalized recommendations',
          suggestions: [
            'I\'ll recommend the best vertical for your business',
            'Your company size helps me suggest optimal settings',
            'Industry information enables tailored feature recommendations'
          ],
          nextSteps: [
            'Analyze your business profile',
            'Recommend optimal vertical',
            'Suggest personalized settings'
          ],
          estimatedTime: 2
        }
      },
      aiRecommendations,
      nextStep: 'vertical_selection',
      canSkip: false,
      canGoBack: false
    })
  } catch (error) {
    console.error('Error starting onboarding:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current onboarding step
router.get('/current', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // For now, return a mock session - in real implementation, retrieve from database
    const mockSession: OnboardingSession = {
      id: 'mock_session',
      userId,
      currentStep: 'vertical_selection',
      progress: {
        current: 2,
        total: 7,
        percentage: 29,
        estimatedTimeRemaining: 6
      },
      userResponses: { company_size: '11-50' },
      aiRecommendations: [],
      completedSteps: ['welcome'],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Generate AI-powered vertical recommendations
    const verticalRecommendations = await onboardingService.recommendVertical({
      companySize: '11-50',
      industry: 'Technology'
    })

    res.json({
      session: mockSession,
      currentStep: {
        id: 'vertical_selection',
        title: 'Choose Your Business Vertical',
        description: 'Select the category that best describes your business operations.',
        instructions: 'I\'ve analyzed your profile and prepared personalized recommendations below.',
        fields: [
          {
            name: 'vertical_id',
            type: 'radio',
            label: 'Business Vertical',
            required: true,
            options: [
              {
                value: 'retail',
                label: 'Retail',
                description: 'Customer insights and inventory optimization for retail operations'
              },
              {
                value: 'restaurant',
                label: 'Restaurant',
                description: 'Order management and customer service for food service'
              },
              {
                value: 'store-market',
                label: 'Marketplace',
                description: 'Vendor management and customer insights for online marketplaces'
              },
              {
                value: 'business',
                label: 'Enterprise',
                description: 'Custom AI solutions for large organizations'
              }
            ]
          }
        ],
        aiAssistance: {
          enabled: true,
          context: 'AI-powered vertical recommendations based on your profile',
          suggestions: verticalRecommendations.map(rec => `${rec.verticalId}: ${rec.reasoning}`),
          nextSteps: [
            'Configure industry-specific settings',
            'Import relevant inventory data',
            'Set up tailored notifications'
          ],
          estimatedTime: 3
        }
      },
      aiRecommendations: [
        {
          id: 'vertical_ai_1',
          type: 'suggestion',
          title: 'AI Recommendation: Enterprise',
          description: `Based on your company size (${mockSession.userResponses.company_size} employees) and technology industry, I recommend the Enterprise vertical for maximum customization and advanced analytics.`,
          confidence: 0.85,
          context: 'vertical_selection',
          createdAt: new Date()
        }
      ],
      nextStep: 'inventory_import',
      canSkip: true,
      canGoBack: true
    })
  } catch (error) {
    console.error('Error getting current onboarding step:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Submit step data and get next step
router.post('/step', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { step, data }: { step: OnboardingStep; data?: Record<string, any> } = req.body

    // Process the step data and generate AI-powered next step
    const aiRecommendations = await onboardingService.generateStepGuidance(step, data || {})

    let nextStep: OnboardingStep = 'dashboard_ready'
    let stepTitle = 'Complete Setup'
    let stepDescription = 'Review your settings and complete the onboarding process.'

    // Determine next step based on current step
    switch (step) {
      case 'vertical_selection':
        nextStep = 'inventory_import'
        stepTitle = 'Import Your Inventory'
        stepDescription = 'Upload your existing inventory data or use our demo data to get started quickly.'
        break
      case 'inventory_import':
        nextStep = 'asset_configuration'
        stepTitle = 'Configure Your Assets'
        stepDescription = 'Review and optimize your imported inventory data.'
        break
      case 'asset_configuration':
        nextStep = 'business_preferences'
        stepTitle = 'Business Preferences'
        stepDescription = 'Set up notifications, automation, and SLA preferences.'
        break
      case 'business_preferences':
        nextStep = 'integration_setup'
        stepTitle = 'Integration Setup'
        stepDescription = 'Connect your favorite tools and services.'
        break
      case 'integration_setup':
        nextStep = 'dashboard_ready'
        stepTitle = 'Welcome to ServiceAI!'
        stepDescription = 'Your account is ready! Let\'s explore your personalized dashboard.'
        break
    }

    res.json({
      session: {
        id: 'mock_session',
        currentStep: nextStep,
        progress: {
          current: 3,
          total: 7,
          percentage: 43,
          estimatedTimeRemaining: 4
        }
      },
      currentStep: {
        id: nextStep,
        title: stepTitle,
        description: stepDescription,
        instructions: 'Follow the guided steps below to complete your setup.',
        fields: getStepFields(nextStep),
        aiAssistance: {
          enabled: true,
          context: `AI assistance for ${nextStep} step`,
          suggestions: getAISuggestions(nextStep),
          nextSteps: getNextStepSuggestions(nextStep),
          estimatedTime: getStepEstimatedTime(nextStep)
        }
      },
      aiRecommendations,
      nextStep: nextStep === 'dashboard_ready' ? null : getActualNextStep(nextStep),
      canSkip: nextStep !== 'dashboard_ready',
      canGoBack: true
    })
  } catch (error) {
    console.error('Error processing onboarding step:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload and analyze CSV for inventory import
router.post('/import/analyze', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // In a real implementation, you'd handle file upload here
    // For now, return mock analysis
    const mockCSVAnalysis = await onboardingService.analyzeCSVImport([
      { name: 'iPhone 14', sku: 'IPH14-128', category: 'Electronics', quantity: 50, price: 799 },
      { name: 'Samsung TV', sku: 'SAMTV-55', category: 'Electronics', quantity: 25, price: 599 }
    ], 'inventory.csv')

    res.json({
      analysis: mockCSVAnalysis,
      aiRecommendations: [
        {
          id: 'import_ai_1',
          type: 'tip',
          title: 'Smart Field Mapping',
          description: 'I\'ve automatically detected your CSV structure and mapped fields appropriately.',
          confidence: 0.95,
          context: 'csv_analysis',
          createdAt: new Date()
        },
        {
          id: 'import_ai_2',
          type: 'suggestion',
          title: 'Data Quality Assessment',
          description: `Your data quality score is ${(mockCSVAnalysis.dataQuality.completeness * 100).toFixed(0)}%. ${mockCSVAnalysis.recommendations[0]}`,
          confidence: 0.9,
          context: 'csv_analysis',
          createdAt: new Date()
        }
      ]
    })
  } catch (error) {
    console.error('Error analyzing CSV import:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get business preferences recommendations
router.get('/preferences/recommendations', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const verticalId = req.query.vertical as string || 'business'
    const companySize = req.query.companySize as string || '11-50'

    const recommendations = await onboardingService.recommendBusinessPreferences(verticalId, {
      companySize
    })

    res.json({
      recommendations,
      aiAssistance: {
        enabled: true,
        context: 'AI-powered business preferences based on your vertical and company size',
        reasoning: recommendations.reasoning,
        confidence: 0.9
      }
    })
  } catch (error) {
    console.error('Error getting preferences recommendations:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Complete onboarding
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Mark onboarding as complete and redirect to dashboard
    res.json({
      message: 'Onboarding completed successfully!',
      nextSteps: [
        'Explore your personalized dashboard',
        'Create your first service request',
        'Connect additional integrations',
        'Customize your notification preferences'
      ],
      aiSuggestions: [
        'I recommend starting with a service request to see how the system works',
        'Your dashboard is optimized for your Enterprise vertical',
        'Consider connecting Slack for team notifications'
      ]
    })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Helper functions
function getStepFields(step: OnboardingStep): any[] {
  switch (step) {
    case 'inventory_import':
      return [
        {
          name: 'import_method',
          type: 'radio',
          label: 'How would you like to import your inventory?',
          required: true,
          options: [
            { value: 'csv', label: 'Upload CSV File' },
            { value: 'sheets', label: 'Connect Google Sheets' },
            { value: 'demo', label: 'Use Demo Data' }
          ]
        }
      ]
    case 'business_preferences':
      return [
        {
          name: 'notifications_email',
          type: 'checkbox',
          label: 'Email Notifications',
          required: false
        },
        {
          name: 'notifications_slack',
          type: 'checkbox',
          label: 'Slack Notifications',
          required: false
        },
        {
          name: 'auto_assign',
          type: 'checkbox',
          label: 'Auto-assign service requests',
          required: false
        }
      ]
    default:
      return []
  }
}

function getAISuggestions(step: OnboardingStep): string[] {
  switch (step) {
    case 'inventory_import':
      return [
        'CSV upload supports common formats like Excel, Google Sheets exports',
        'I can help map your existing column headers to our system',
        'Demo data includes realistic examples for your vertical'
      ]
    case 'business_preferences':
      return [
        'Notifications can be customized by priority level',
        'Auto-assignment works best for teams with 5+ members',
        'SLA preferences affect response time expectations'
      ]
    default:
      return []
  }
}

function getNextStepSuggestions(step: OnboardingStep): string[] {
  switch (step) {
    case 'inventory_import':
      return ['Configure field mappings', 'Review data quality', 'Apply bulk settings']
    case 'business_preferences':
      return ['Set up team permissions', 'Configure integrations', 'Create first service request']
    default:
      return []
  }
}

function getStepEstimatedTime(step: OnboardingStep): number {
  switch (step) {
    case 'inventory_import': return 5
    case 'business_preferences': return 3
    case 'integration_setup': return 4
    default: return 2
  }
}

function getActualNextStep(step: OnboardingStep): OnboardingStep {
  switch (step) {
    case 'inventory_import': return 'asset_configuration'
    case 'asset_configuration': return 'business_preferences'
    case 'business_preferences': return 'integration_setup'
    case 'integration_setup': return 'dashboard_ready'
    default: return 'dashboard_ready'
  }
}

export default router
