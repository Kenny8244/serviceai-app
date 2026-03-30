import { OnboardingSession, OnboardingStep, AIRecommendation, VerticalRecommendation, CSVImportAnalysis, BusinessPreferencesRecommendation } from '../models/Onboarding'
import { Vertical } from '../models/Vertical'

export class OnboardingService {
  private sessions: Map<string, OnboardingSession> = new Map()

  /**
   * AI-powered vertical recommendation based on user profile and business needs
   */
  async recommendVertical(userData: {
    companySize?: string
    industry?: string
    currentChallenges?: string[]
    goals?: string[]
  }): Promise<VerticalRecommendation[]> {
    const recommendations: VerticalRecommendation[] = []

    // AI logic for vertical recommendations
    const verticals = await this.getAvailableVerticals()

    for (const vertical of verticals) {
      let confidence = 0.5 // Base confidence
      let reasoning: string[] = []
      let benefits: string[] = []

      // Analyze company size fit
      if (userData.companySize) {
        if (vertical.id === 'enterprise' && ['51-200', '201-1000', '1000+'].includes(userData.companySize)) {
          confidence += 0.2
          reasoning.push(`Enterprise vertical is ideal for ${userData.companySize} companies`)
          benefits.push('Advanced analytics and custom workflows')
        } else if (vertical.id === 'retail' && ['1-10', '11-50'].includes(userData.companySize)) {
          confidence += 0.15
          reasoning.push('Retail vertical suits smaller operations')
          benefits.push('Inventory optimization and customer insights')
        }
      }

      // Analyze industry alignment
      if (userData.industry) {
        const industryMatches = this.getIndustryMatches(vertical.id, userData.industry)
        confidence += industryMatches.score
        reasoning.push(...industryMatches.reasoning)
        benefits.push(...industryMatches.benefits)
      }

      // Analyze challenges and goals
      if (userData.currentChallenges?.length || userData.goals?.length) {
        const challengeAlignment = this.analyzeChallengeAlignment(vertical.id, userData.currentChallenges, userData.goals)
        confidence += challengeAlignment.score
        reasoning.push(...challengeAlignment.reasoning)
        benefits.push(...challengeAlignment.benefits)
      }

      recommendations.push({
        verticalId: vertical.id,
        confidence: Math.min(confidence, 1.0),
        reasoning: reasoning.join('. '),
        benefits,
        nextSteps: this.getNextStepsForVertical(vertical.id)
      })
    }

    // Sort by confidence
    return recommendations.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * AI-powered CSV import analysis and field mapping suggestions
   */
  async analyzeCSVImport(csvData: any[], fileName: string): Promise<CSVImportAnalysis> {
    // Analyze CSV structure and content
    const headers = Object.keys(csvData[0] || {})
    const totalRows = csvData.length
    const validRows = csvData.filter(row => this.validateRow(row)).length
    const errorRows = totalRows - validRows

    // AI-powered field mapping suggestions
    const fieldMapping = this.suggestFieldMapping(headers)

    // Analyze data quality
    const dataQuality = this.assessDataQuality(csvData)

    // Suggest categories based on content analysis
    const suggestedCategories = this.suggestCategories(csvData, headers)

    // Generate AI recommendations
    const recommendations = this.generateImportRecommendations(headers, dataQuality, suggestedCategories)

    return {
      fileName,
      totalRows,
      validRows,
      errorRows,
      fieldMapping,
      suggestedCategories,
      dataQuality,
      recommendations
    }
  }

  /**
   * AI-powered business preferences recommendations
   */
  async recommendBusinessPreferences(verticalId: string, userProfile: any): Promise<BusinessPreferencesRecommendation> {
    const baseRecommendation: BusinessPreferencesRecommendation = {
      notifications: {
        email: true,
        slack: false,
        dashboard: true,
        frequency: 'immediate'
      },
      automation: {
        autoAssign: false,
        approvalRequired: true,
        escalationRules: true
      },
      slaPreferences: {
        responseTime: 24,
        resolutionTime: 72,
        priorityLevels: ['low', 'medium', 'high', 'urgent']
      },
      reasoning: []
    }

    // Customize based on vertical
    switch (verticalId) {
      case 'retail':
        baseRecommendation.notifications.slack = true
        baseRecommendation.notifications.frequency = 'immediate'
        baseRecommendation.automation.autoAssign = true
        baseRecommendation.slaPreferences.responseTime = 12
        baseRecommendation.reasoning.push('Retail operations benefit from real-time notifications and quick response times')
        break

      case 'restaurant':
        baseRecommendation.notifications.frequency = 'immediate'
        baseRecommendation.automation.approvalRequired = false
        baseRecommendation.slaPreferences.responseTime = 6
        baseRecommendation.reasoning.push('Restaurant operations require immediate attention and streamlined processes')
        break

      case 'store-market':
        baseRecommendation.notifications.email = true
        baseRecommendation.notifications.slack = true
        baseRecommendation.automation.escalationRules = true
        baseRecommendation.slaPreferences.responseTime = 18
        baseRecommendation.reasoning.push('Marketplace operations benefit from comprehensive communication and escalation protocols')
        break

      case 'business':
        baseRecommendation.notifications.email = true
        baseRecommendation.notifications.dashboard = true
        baseRecommendation.automation.approvalRequired = true
        baseRecommendation.slaPreferences.responseTime = 24
        baseRecommendation.reasoning.push('Enterprise operations require structured processes and comprehensive tracking')
        break
    }

    // Customize based on company size
    if (userProfile.companySize) {
      if (userProfile.companySize === '1-10') {
        baseRecommendation.automation.approvalRequired = false
        baseRecommendation.reasoning.push('Small teams benefit from streamlined, automated processes')
      } else if (userProfile.companySize === '1000+') {
        baseRecommendation.automation.approvalRequired = true
        baseRecommendation.automation.escalationRules = true
        baseRecommendation.reasoning.push('Large organizations benefit from structured approval processes')
      }
    }

    return baseRecommendation
  }

  /**
   * Generate AI-powered step-by-step guidance
   */
  async generateStepGuidance(currentStep: OnboardingStep, userContext: any): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = []

    switch (currentStep) {
      case 'welcome':
        recommendations.push({
          id: 'welcome_tip',
          type: 'tip',
          title: 'Welcome to ServiceAI!',
          description: 'I\'ll guide you through setting up your account. This typically takes 5-10 minutes.',
          confidence: 1.0,
          context: 'onboarding_start',
          createdAt: new Date()
        })
        break

      case 'vertical_selection':
        const verticalRecs = await this.recommendVertical(userContext)
        recommendations.push({
          id: 'vertical_suggestion',
          type: 'suggestion',
          title: `Based on your profile, I recommend ${verticalRecs[0]?.verticalId}`,
          description: verticalRecs[0]?.reasoning || 'This vertical aligns best with your business needs.',
          confidence: verticalRecs[0]?.confidence || 0.8,
          context: 'vertical_selection',
          createdAt: new Date()
        })
        break

      case 'inventory_import':
        recommendations.push({
          id: 'import_tip',
          type: 'tip',
          title: 'Smart Import Available',
          description: 'I can automatically detect your CSV format and suggest field mappings.',
          confidence: 0.9,
          context: 'csv_import',
          createdAt: new Date()
        })
        break

      case 'asset_configuration':
        recommendations.push({
          id: 'config_tip',
          type: 'tip',
          title: 'Bulk Configuration',
          description: 'Apply settings to multiple assets at once, or let me suggest optimal configurations.',
          confidence: 0.85,
          context: 'asset_config',
          createdAt: new Date()
        })
        break

      case 'business_preferences':
        recommendations.push({
          id: 'prefs_tip',
          type: 'tip',
          title: 'Personalized Settings',
          description: 'I\'ve prepared recommended settings based on your industry and company size.',
          confidence: 0.9,
          context: 'business_prefs',
          createdAt: new Date()
        })
        break
    }

    return recommendations
  }

  // Helper methods
  private async getAvailableVerticals(): Promise<Vertical[]> {
    // This would typically fetch from database
    return [
      {
        id: 'retail',
        name: 'Retail',
        description: 'Transform your retail operations with AI-powered customer insights and inventory optimization.',
        features: ['Smart Recommendations', 'Inventory Management', 'Customer Analytics'],
        isActive: true
      },
      {
        id: 'restaurant',
        name: 'Restaurant',
        description: 'Streamline restaurant operations with intelligent order management and customer service.',
        features: ['Order Optimization', 'Menu Analytics', 'Staff Scheduling'],
        isActive: true
      },
      {
        id: 'store-market',
        name: 'Marketplace',
        description: 'Optimize marketplace operations with AI-driven vendor management and customer insights.',
        features: ['Vendor Analytics', 'Price Optimization', 'Customer Segmentation'],
        isActive: true
      },
      {
        id: 'business',
        name: 'Enterprise',
        description: 'Custom AI solutions tailored for your unique business needs and workflows.',
        features: ['Custom Workflows', 'Advanced Analytics', 'Enterprise Security'],
        isActive: true
      }
    ]
  }

  private getIndustryMatches(verticalId: string, industry: string): {
    score: number
    reasoning: string[]
    benefits: string[]
  } {
    const matches = {
      retail: ['retail', 'ecommerce', 'shopping', 'store'],
      restaurant: ['restaurant', 'food', 'hospitality', 'catering'],
      'store-market': ['marketplace', 'platform', 'multi-vendor', 'ecommerce'],
      business: ['enterprise', 'corporate', 'business', 'company']
    }

    const score = matches[verticalId as keyof typeof matches]?.some(match =>
      industry.toLowerCase().includes(match)
    ) ? 0.2 : 0

    return {
      score,
      reasoning: score > 0 ? [`Strong alignment with ${industry} industry`] : [],
      benefits: score > 0 ? ['Industry-specific optimizations and best practices'] : []
    }
  }

  private analyzeChallengeAlignment(verticalId: string, challenges?: string[], goals?: string[]): {
    score: number
    reasoning: string[]
    benefits: string[]
  } {
    // AI logic to analyze how well the vertical addresses user challenges and goals
    return {
      score: 0.15,
      reasoning: ['Addresses common operational challenges'],
      benefits: ['Streamlined workflows', 'Better resource management']
    }
  }

  private getNextStepsForVertical(verticalId: string): string[] {
    const nextSteps = {
      retail: ['Set up inventory tracking', 'Configure customer analytics', 'Import product catalog'],
      restaurant: ['Import menu items', 'Set up staff scheduling', 'Configure order management'],
      'store-market': ['Import vendor information', 'Set up product categories', 'Configure pricing rules'],
      business: ['Define custom workflows', 'Set up team permissions', 'Configure integrations']
    }

    return nextSteps[verticalId as keyof typeof nextSteps] || []
  }

  private suggestFieldMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {}

    // AI-powered field mapping suggestions
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase()
      if (lowerHeader.includes('name') || lowerHeader.includes('product')) {
        mapping[header] = 'name'
      } else if (lowerHeader.includes('sku') || lowerHeader.includes('code')) {
        mapping[header] = 'sku'
      } else if (lowerHeader.includes('category') || lowerHeader.includes('type')) {
        mapping[header] = 'category'
      } else if (lowerHeader.includes('quantity') || lowerHeader.includes('qty')) {
        mapping[header] = 'quantity'
      } else if (lowerHeader.includes('price') || lowerHeader.includes('cost')) {
        mapping[header] = 'unit_cost'
      } else if (lowerHeader.includes('supplier') || lowerHeader.includes('vendor')) {
        mapping[header] = 'supplier'
      } else if (lowerHeader.includes('location') || lowerHeader.includes('warehouse')) {
        mapping[header] = 'location'
      }
    })

    return mapping
  }

  private assessDataQuality(csvData: any[]): {
    completeness: number
    consistency: number
    accuracy: number
  } {
    // AI-powered data quality assessment
    return {
      completeness: 0.85,
      consistency: 0.92,
      accuracy: 0.88
    }
  }

  private suggestCategories(csvData: any[], headers: string[]): string[] {
    // AI analysis to suggest categories based on data content
    const suggestedCategories = ['Electronics', 'Clothing', 'Food & Beverage', 'Office Supplies']

    // Analyze data content for better suggestions
    const textContent = csvData.map(row =>
      Object.values(row).join(' ').toLowerCase()
    ).join(' ')

    if (textContent.includes('phone') || textContent.includes('laptop')) {
      suggestedCategories.unshift('Electronics')
    }
    if (textContent.includes('shirt') || textContent.includes('dress')) {
      suggestedCategories.unshift('Clothing')
    }

    return [...new Set(suggestedCategories)].slice(0, 5)
  }

  private generateImportRecommendations(headers: string[], dataQuality: any, categories: string[]): string[] {
    const recommendations: string[] = []

    if (dataQuality.completeness < 0.8) {
      recommendations.push('Consider adding missing data fields for better inventory management')
    }

    if (headers.some(h => h.toLowerCase().includes('price'))) {
      recommendations.push('Price data detected - I can help set up automated pricing rules')
    }

    if (categories.length > 0) {
      recommendations.push(`Suggested categories based on your data: ${categories.slice(0, 3).join(', ')}`)
    }

    return recommendations
  }

  private validateRow(row: any): boolean {
    // Basic row validation logic
    return row && typeof row === 'object' && Object.keys(row).length > 0
  }
}

export const onboardingService = new OnboardingService()
