import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { onboardingService } from '../services/onboardingService'
import type { OnboardingResponse, OnboardingStepData } from '../services/onboardingService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { CheckCircle, ArrowLeft, ArrowRight, Sparkles, Clock } from 'lucide-react'

interface OnboardingPageProps {
  onComplete?: () => void
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const navigate = useNavigate()
  const [currentData, setCurrentData] = useState<OnboardingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [stepData, setStepData] = useState<Record<string, any>>({})

  useEffect(() => {
    loadCurrentStep()
  }, [])

  const loadCurrentStep = async () => {
    try {
      setLoading(true)
      const data = await onboardingService.getCurrentStep()
      setCurrentData(data)
    } catch (error) {
      console.error('Error loading onboarding step:', error)
      // For demo purposes, show a mock onboarding flow
      setCurrentData(getMockOnboardingData())
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    console.log('Field change triggered:', fieldName, 'Value:', value)
    setStepData(prev => {
      const newData = { ...prev, [fieldName]: value }
      console.log('Updated stepData:', newData)
      return newData
    })
  }

  const handleSubmit = async () => {
    console.log('🎯 Continue button clicked!')
    console.log('📊 Current stepData:', stepData)

    if (!currentData) {
      console.log('❌ No current data available')
      return
    }

    try {
      setSubmitting(true)
      console.log('⏳ Processing...')

      // Simple progression for testing
      await new Promise(resolve => setTimeout(resolve, 200))

      // Move to next step
      const nextStepResponse = getNextStepMockData(currentData.currentStep.id)
      if (nextStepResponse) {
        console.log('✅ Moving to:', nextStepResponse.currentStep.id)
        setCurrentData(nextStepResponse)
        setStepData({})
      } else {
        console.log('🎉 Onboarding complete!')
        if (onComplete) onComplete()
      }

    } catch (error) {
      console.error('❌ Error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeepCurrent = () => {
    // User chose to keep their current selection despite the mismatch
    // We can add some logic here to acknowledge their choice
    console.log('User chose to keep current vertical selection')
  }

  const handleVerticalChange = (newVertical: string) => {
    // Update the vertical selection
    setStepData(prev => ({
      ...prev,
      vertical_id: newVertical
    }))

    // Optionally trigger a re-analysis or just continue
    console.log('User changed vertical to:', newVertical)
  }

  const handleBack = () => {
    console.log('HandleBack triggered')
    // In a real implementation, you'd track step history
    navigate('/vertical-selection')
  }

  const handleSkip = () => {
    console.log('HandleSkip triggered')
    if (currentData?.canSkip) {
      console.log('Calling handleSubmit from handleSkip')
      // Skip to next step using the same logic as Continue
      handleSubmit()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-center mt-4 text-gray-600">Loading your personalized onboarding...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentData) {
    return <div>Error loading onboarding</div>
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Simple white background */}
      <div className="absolute inset-0 bg-white"></div>
      {/* Header with progress */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">ServiceAI Setup</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{currentData.session.progress.estimatedTimeRemaining} min remaining</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Step {currentData.session.progress.current} of {currentData.session.progress.total}
              </span>
              <span className="text-gray-600">
                {Math.round(currentData.session.progress.percentage)}% complete
              </span>
            </div>
            <Progress value={currentData.session.progress.percentage} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main step content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{currentData.currentStep.title}</CardTitle>
                    <CardDescription className="mt-2 text-lg">
                      {currentData.currentStep.description}
                    </CardDescription>
                  </div>
                  {currentData.currentStep.aiAssistance?.enabled && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Assisted
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* AI Assistance */}
                {currentData.currentStep.aiAssistance && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium text-blue-900">
                          {currentData.currentStep.aiAssistance.context}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {currentData.currentStep.aiAssistance.suggestions.map((suggestion, index) => (
                            <div key={index} className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Instructions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{currentData.currentStep.instructions}</p>
                </div>

                {/* Step-specific fields */}
                <div className="space-y-4">
                  {renderStepFields(currentData.currentStep, stepData, handleFieldChange)}
                </div>

                {/* AI Recommendations */}
                {currentData.aiRecommendations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">AI Recommendations</h3>
                    {currentData.aiRecommendations.map((rec) => (
                      <Alert key={rec.id} className={
                        rec.type === 'suggestion' ? 'bg-blue-50/50 border-blue-200 text-blue-900' :
                        rec.type === 'warning' ? 'bg-amber-50/50 border-amber-200 text-amber-900' :
                        'bg-slate-50/50 border-slate-200 text-slate-900'
                      }>
                        <AlertDescription>
                          <div className="font-medium text-gray-900">{rec.title}</div>
                          <div className="text-sm mt-1 text-gray-700">{rec.description}</div>
                          {/* Add action buttons for mismatch recommendations */}
                          {rec.context === 'vertical_mismatch' && (
                            <div className="flex space-x-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerticalChange(rec.suggestedAlternative)}
                                className="text-xs"
                              >
                                Change to {getVerticalDisplayName(rec.suggestedAlternative)}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleKeepCurrent()}
                                className="text-xs"
                              >
                                Keep Current Selection
                              </Button>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with AI assistance */}
          <div className="space-y-6">
            {/* Progress summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['welcome', 'vertical_selection', 'inventory_import', 'asset_configuration', 'business_preferences', 'integration_setup', 'dashboard_ready'].map((step, index) => {
                    const isCompleted = currentData.session.completedSteps.includes(step)
                    const isCurrent = currentData.currentStep.id === step
                    const stepNumber = index + 1

                    return (
                      <div key={step} className={`flex items-center space-x-2 ${isCurrent ? 'text-blue-600' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          isCompleted ? 'bg-green-100 text-green-600' :
                          isCurrent ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {isCompleted ? <CheckCircle className="h-3 w-3" /> : stepNumber}
                        </div>
                        <span className={`text-sm ${isCurrent ? 'font-medium' : ''}`}>
                          {getStepDisplayName(step)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* AI Tips */}
            {currentData.currentStep.aiAssistance && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentData.currentStep.aiAssistance.nextSteps.map((tip, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        • {tip}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={!currentData.canGoBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex space-x-3">
            {currentData.canSkip && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
            )}

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? 'Processing...' : 'Continue'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to render step-specific fields
function renderStepFields(step: OnboardingStepData, data: Record<string, any>, onChange: (name: string, value: any) => void) {
  return step.fields.map((field) => {
    switch (field.type) {
      case 'text':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={data[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )

      case 'select':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={data[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an option...</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )

      case 'radio':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <label key={option.value} className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={field.name}
                    value={option.value}
                    checked={data[field.name] === option.value}
                    onChange={(e) => {
                      console.log('Radio button clicked:', field.name, 'Value:', e.target.value)
                      onChange(field.name, e.target.value)
                    }}
                    className="mt-1 cursor-pointer"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.name}>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={data[field.name] || false}
                onChange={(e) => onChange(field.name, e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{field.label}</span>
            </label>
          </div>
        )

      default:
        return null
    }
  })
}

// Helper function to get step display names
function getStepDisplayName(step: string): string {
  const names: Record<string, string> = {
    welcome: 'Welcome',
    vertical_selection: 'Choose Business Type',
    inventory_import: 'Import Your Data',
    asset_configuration: 'Review Your Items',
    business_preferences: 'Set Your Preferences',
    integration_setup: 'Connect Your Tools',
    dashboard_ready: 'All Set!'
  }
  return names[step] || step
}

// Mock data function for demo
function getMockOnboardingData(): OnboardingResponse {
  return {
    session: {
      id: 'mock_session',
      userId: 'demo_user',
      currentStep: 'vertical_selection',
      progress: {
        current: 2,
        total: 7,
        percentage: 29,
        estimatedTimeRemaining: 6
      },
      userResponses: {},
      aiRecommendations: [],
      completedSteps: ['welcome'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    currentStep: {
      id: 'vertical_selection',
      title: 'Choose Your Business Type',
      description: 'Select the option that best describes your business.',
      instructions: 'Pick the business type that matches what you do.',
      fields: [
        {
          name: 'vertical_id',
          type: 'radio',
          label: 'Choose your business type',
          required: true,
          options: [
            {
              value: 'retail',
              label: 'Retail Store',
              description: 'For shops, boutiques, and stores'
            },
            {
              value: 'restaurant',
              label: 'Restaurant',
              description: 'For cafes, restaurants, and food service'
            },
            {
              value: 'store-market',
              label: 'Online Store',
              description: 'For online sales and marketplaces'
            },
            {
              value: 'business',
              label: 'Other Business',
              description: 'For any business type'
            }
          ]
        }
      ],
      aiAssistance: {
        enabled: true,
        context: 'Helpful tips for your business',
        suggestions: [
          'Choose the option that best describes your main business activity',
          'You can change this later in your settings',
          'Each option is optimized for different types of businesses'
        ],
        nextSteps: [
          'Set up your inventory',
          'Configure notifications',
          'Start using ServiceAI'
        ],
        estimatedTime: 2
      }
    },
    aiRecommendations: [
      {
        id: 'vertical_ai_1',
        type: 'suggestion',
        title: 'Choose What Fits Your Business',
        description: 'Select the business type that matches your main activity. Each option provides tools tailored for that type of business.',
        confidence: 0.85,
        context: 'vertical_selection',
        createdAt: new Date().toISOString()
      }
    ],
    nextStep: 'inventory_import',
    canSkip: true,
    canGoBack: true
  }
}

// Enhanced AI recommendation function that analyzes vertical + business summary
// TODO: Integrate this function when ready to use real API instead of mock data
/*
function generateEnhancedAIRecommendations(verticalId: string, businessSummary: string = ''): any[] {
  const recommendations = []
  let mismatchDetected = false
  let suggestedAlternative = ''

  // Analyze business summary for keywords and context
  const summary = businessSummary.toLowerCase()
  const isCoffeeShop = summary.includes('coffee') || summary.includes('cafe') || summary.includes('espresso')
  const isClothing = summary.includes('clothing') || summary.includes('boutique') || summary.includes('fashion')
  const isRestaurant = summary.includes('restaurant') || summary.includes('food') || summary.includes('diner')
  const isSmallBusiness = summary.includes('small') || summary.includes('family') || summary.includes('local')
  const isOnline = summary.includes('online') || summary.includes('ecommerce') || summary.includes('website')

  // Check for vertical/summary mismatch
  if (verticalId === 'retail') {
    if (isCoffeeShop || isRestaurant) {
      mismatchDetected = true
      suggestedAlternative = 'restaurant'
    } else if (isOnline && !isClothing) {
      mismatchDetected = true
      suggestedAlternative = 'store-market'
    }
  } else if (verticalId === 'restaurant') {
    if (isClothing || (!isRestaurant && !isCoffeeShop)) {
      mismatchDetected = true
      suggestedAlternative = 'retail'
    }
  } else if (verticalId === 'store-market') {
    if (!isOnline && (isCoffeeShop || isRestaurant)) {
      mismatchDetected = true
      suggestedAlternative = 'restaurant'
    }
  }

  // Primary recommendation
  if (mismatchDetected) {
    recommendations.push({
      id: 'mismatch_ai_1',
      type: 'warning',
      title: 'Business Type Mismatch Detected',
      description: `Your business summary suggests you might be better suited for "${getVerticalDisplayName(suggestedAlternative)}" instead of "${getVerticalDisplayName(verticalId)}". Would you like to change your selection?`,
      confidence: 0.8,
      context: 'vertical_mismatch',
      createdAt: new Date().toISOString()
    })
  } else {
    recommendations.push({
      id: 'vertical_ai_1',
      type: 'suggestion',
      title: 'Great Choice for Your Business!',
      description: `${getVerticalDisplayName(verticalId)} is perfect for ${isSmallBusiness ? 'small businesses like yours' : 'businesses like yours'}. ${getVerticalBenefit(verticalId)}`,
      confidence: 0.9,
      context: 'vertical_confirmation',
      createdAt: new Date().toISOString()
    })
  }

  // Add business-specific insights
  if (businessSummary.trim()) {
    if (isSmallBusiness) {
      recommendations.push({
        id: 'business_ai_2',
        type: 'tip',
        title: 'Small Business Optimization',
        description: `For ${isSmallBusiness ? 'small businesses like yours' : 'your business'}, I recommend starting simple and scaling up as you grow.`,
        confidence: 0.85,
        context: 'business_insights',
        createdAt: new Date().toISOString()
      })
    }

    if (isCoffeeShop) {
      recommendations.push({
        id: 'business_ai_3',
        type: 'tip',
        title: 'Coffee Shop Specific Features',
        description: 'Coffee shops like yours benefit from inventory tracking for beans, pastries, and merchandise, plus customer feedback management.',
        confidence: 0.9,
        context: 'business_specific',
        createdAt: new Date().toISOString()
      })
    }
  }

  return recommendations
}
*/

// Helper functions
function getVerticalDisplayName(verticalId: string): string {
  const names: Record<string, string> = {
    'retail': 'Retail Store',
    'restaurant': 'Restaurant',
    'store-market': 'Marketplace',
    'business': 'General Business'
  }
  return names[verticalId] || verticalId
}

// Helper function to get next step mock data
function getNextStepMockData(currentStep: string): OnboardingResponse | null {
  switch (currentStep) {
    case 'vertical_selection':
      return {
        session: {
          id: 'mock_session',
          userId: 'demo_user',
          currentStep: 'inventory_import',
          progress: {
            current: 3,
            total: 7,
            percentage: 43,
            estimatedTimeRemaining: 5
          },
          userResponses: { vertical_id: 'retail' },
          aiRecommendations: [],
          completedSteps: ['welcome', 'vertical_selection'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        currentStep: {
          id: 'inventory_import',
          title: 'Import Your Inventory',
          description: 'Upload your existing inventory data or use our sample data to get started quickly.',
          instructions: 'You can upload a CSV file with your inventory, or we can provide sample data to help you get started.',
          fields: [
            {
              name: 'import_method',
              type: 'radio',
              label: 'How would you like to add your inventory?',
              required: true,
              options: [
                { value: 'csv', label: 'Upload CSV File' },
                { value: 'sheets', label: 'Connect Google Sheets' },
                { value: 'demo', label: 'Use Sample Data' }
              ]
            }
          ],
          aiAssistance: {
            enabled: true,
            context: 'Smart import options for your retail store',
            suggestions: [
              'Sample data includes common retail items like clothing, electronics, etc.',
              'CSV upload supports Excel and other common formats',
              'You can always change this later in settings'
            ],
            nextSteps: [
              'Review and organize your imported items',
              'Set up low stock alerts',
              'Configure item categories'
            ],
            estimatedTime: 3
          }
        },
        aiRecommendations: [
          {
            id: 'import_ai_1',
            type: 'tip',
            title: 'Smart Import Options',
            description: 'I recommend starting with sample data if you\'re new to inventory management - it\'s the quickest way to see how everything works.',
            confidence: 0.9,
            context: 'inventory_import',
            createdAt: new Date().toISOString()
          }
        ],
        nextStep: 'asset_configuration',
        canSkip: true,
        canGoBack: true
      }

    case 'inventory_import':
      return {
        session: {
          id: 'mock_session',
          userId: 'demo_user',
          currentStep: 'business_preferences',
          progress: {
            current: 5,
            total: 7,
            percentage: 71,
            estimatedTimeRemaining: 2
          },
          userResponses: { vertical_id: 'retail', import_method: 'demo' },
          aiRecommendations: [],
          completedSteps: ['welcome', 'vertical_selection', 'inventory_import', 'asset_configuration'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        currentStep: {
          id: 'business_preferences',
          title: 'Set Your Preferences',
          description: 'Configure notifications and automation settings for your business.',
          instructions: 'These settings will help ServiceAI work best for your retail store.',
          fields: [
            {
              name: 'notifications_email',
              type: 'checkbox',
              label: 'Email notifications for service requests',
              required: false
            },
            {
              name: 'notifications_slack',
              type: 'checkbox',
              label: 'Slack notifications (if you use Slack)',
              required: false
            },
            {
              name: 'auto_assign',
              type: 'checkbox',
              label: 'Automatically assign service requests to team members',
              required: false
            }
          ],
          aiAssistance: {
            enabled: true,
            context: 'Personalized settings for your retail store',
            suggestions: [
              'Email notifications are great for small teams',
              'Auto-assignment works well when you have 2+ team members',
              'You can always change these settings later'
            ],
            nextSteps: [
              'Connect your favorite tools',
              'Review your dashboard',
              'Start using ServiceAI!'
            ],
            estimatedTime: 2
          }
        },
        aiRecommendations: [
          {
            id: 'prefs_ai_1',
            type: 'tip',
            title: 'Recommended Settings',
            description: 'For a retail store like yours, I recommend enabling email notifications and auto-assignment if you have multiple team members.',
            confidence: 0.9,
            context: 'business_preferences',
            createdAt: new Date().toISOString()
          }
        ],
        nextStep: 'dashboard_ready',
        canSkip: true,
        canGoBack: true
      }

    default:
      return null
  }
}
