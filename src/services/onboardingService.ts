import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export interface OnboardingSession {
  id: string
  userId: string
  currentStep: string
  progress: {
    current: number
    total: number
    percentage: number
    estimatedTimeRemaining: number
  }
  userResponses: Record<string, any>
  aiRecommendations: any[]
  completedSteps: string[]
  createdAt: string
  updatedAt: string
}

export interface OnboardingStepData {
  id: string
  title: string
  description: string
  instructions: string
  fields: OnboardingField[]
  aiAssistance?: {
    enabled: boolean
    context: string
    suggestions: string[]
    nextSteps: string[]
    estimatedTime: number
  }
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

export interface OnboardingResponse {
  session: OnboardingSession
  currentStep: OnboardingStepData
  aiRecommendations: any[]
  nextStep?: string
  canSkip: boolean
  canGoBack: boolean
}

export interface CSVAnalysisResponse {
  analysis: {
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
  aiRecommendations: any[]
}

class OnboardingService {
  private baseURL = `${API_BASE_URL}/onboarding`

  async startOnboarding(userId: string): Promise<OnboardingResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/start`, { userId })
      return response.data
    } catch (error) {
      console.error('Error starting onboarding:', error)
      throw error
    }
  }

  async getCurrentStep(): Promise<OnboardingResponse> {
    try {
      const response = await axios.get(`${this.baseURL}/current`)
      return response.data
    } catch (error) {
      console.error('Error getting current onboarding step:', error)
      throw error
    }
  }

  async submitStep(step: string, data: Record<string, any>): Promise<OnboardingResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/step`, { step, data })
      return response.data
    } catch (error) {
      console.error('Error submitting onboarding step:', error)
      throw error
    }
  }

  async analyzeCSV(file: File): Promise<CSVAnalysisResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(`${this.baseURL}/import/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error analyzing CSV:', error)
      throw error
    }
  }

  async getBusinessPreferences(verticalId: string, companySize: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/preferences/recommendations`, {
        params: { verticalId, companySize }
      })
      return response.data
    } catch (error) {
      console.error('Error getting preferences recommendations:', error)
      throw error
    }
  }

  async completeOnboarding(): Promise<any> {
    try {
      const response = await axios.post(`${this.baseURL}/complete`)
      return response.data
    } catch (error) {
      console.error('Error completing onboarding:', error)
      throw error
    }
  }
}

export const onboardingService = new OnboardingService()
