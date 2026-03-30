// Onboarding Flow Models with AI Assistance

export interface OnboardingSession {
  id: string
  userId: string
  currentStep: OnboardingStep
  progress: OnboardingProgress
  userResponses: Record<string, any>
  aiRecommendations: AIRecommendation[]
  completedSteps: OnboardingStep[]
  createdAt: Date
  updatedAt: Date
}

export type OnboardingStep =
  | 'welcome'
  | 'vertical_selection'
  | 'inventory_import'
  | 'asset_configuration'
  | 'business_preferences'
  | 'integration_setup'
  | 'dashboard_ready'

export interface OnboardingProgress {
  current: number
  total: number
  percentage: number
  estimatedTimeRemaining: number // in minutes
}

export interface AIRecommendation {
  id: string
  type: 'suggestion' | 'warning' | 'tip' | 'next_step'
  title: string
  description: string
  action?: {
    type: 'button' | 'link' | 'input'
    label: string
    value?: string
  }
  confidence: number // 0-1
  context: string
  createdAt: Date
}

export interface VerticalRecommendation {
  verticalId: string
  confidence: number
  reasoning: string
  benefits: string[]
  nextSteps: string[]
}

export interface OnboardingRequest {
  step: OnboardingStep
  data?: Record<string, any>
  userId?: string
}

export interface OnboardingResponse {
  session: OnboardingSession
  currentStep: {
    id: OnboardingStep
    title: string
    description: string
    instructions: string
    fields: OnboardingField[]
    aiAssistance?: AIAssistance
  }
  aiRecommendations: AIRecommendation[]
  nextStep?: OnboardingStep
  canSkip: boolean
  canGoBack: boolean
}

export interface OnboardingField {
  name: string
  type: 'text' | 'select' | 'multiselect' | 'file' | 'checkbox' | 'radio'
  label: string
  placeholder?: string
  required: boolean
  options?: Array<{ value: string; label: string; description?: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
    custom?: string
  }
  aiSuggestions?: string[]
}

export interface AIAssistance {
  enabled: boolean
  context: string
  suggestions: string[]
  nextSteps: string[]
  estimatedTime: number
}

export interface CSVImportAnalysis {
  fileName: string
  totalRows: number
  validRows: number
  errorRows: number
  fieldMapping: Record<string, string>
  suggestedCategories: string[]
  dataQuality: {
    completeness: number
    consistency: number
    accuracy: number
  }
  recommendations: string[]
}

export interface BusinessPreferencesRecommendation {
  notifications: {
    email: boolean
    slack: boolean
    dashboard: boolean
    frequency: 'immediate' | 'daily' | 'weekly'
  }
  automation: {
    autoAssign: boolean
    approvalRequired: boolean
    escalationRules: boolean
  }
  slaPreferences: {
    responseTime: number // hours
    resolutionTime: number // hours
    priorityLevels: string[]
  }
  reasoning: string[]
}
