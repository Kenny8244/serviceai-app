import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import { getSelectedVertical } from '@/lib/verticalStorage'

interface OnboardingConfirmationProps {
  onComplete?: () => void
}

export function OnboardingConfirmation({ onComplete }: OnboardingConfirmationProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const selectedVertical = getSelectedVertical(
    (location.state as { verticalId?: string } | null)?.verticalId
  )

  const verticals = {
    retail: {
      name: 'Retail Store',
      description: 'Perfect for shops, boutiques, and stores',
      icon: '🛍️',
      features: ['Inventory Management', 'Customer Analytics', 'Smart Recommendations']
    },
    restaurant: {
      name: 'Restaurant',
      description: 'Great for cafes, restaurants, and food service',
      icon: '🍽️',
      features: ['Order Optimization', 'Menu Analytics', 'Staff Scheduling']
    },
    'store-market': {
      name: 'Online Marketplace',
      description: 'Ideal for online sales and marketplaces',
      icon: '🛒',
      features: ['Vendor Analytics', 'Price Optimization', 'Customer Segmentation']
    },
    business: {
      name: 'Enterprise',
      description: 'Custom solutions for unique business needs',
      icon: '🏢',
      features: ['Custom Workflows', 'Advanced Analytics', 'Enterprise Security']
    }
  }

  const vertical = verticals[selectedVertical as keyof typeof verticals] || verticals.retail

  const handleComplete = () => {
    if (onComplete) {
      onComplete()
    } else {
      navigate('/dashboard')
    }
  }

  const handleBack = () => {
    navigate('/vertical-selection')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Perfect! 🎉
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            We've set up ServiceAI for your business
          </p>
        </div>

        {/* Confirmation Card */}
        <Card className="mb-8">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="text-6xl">{vertical.icon}</div>
            </div>
            <CardTitle className="text-2xl mb-2">
              {vertical.name}
            </CardTitle>
            <CardDescription className="text-lg">
              {vertical.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                ✨ What's included:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {vertical.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Explore your dashboard</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">View your personalized ServiceAI interface</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">2</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Add your data (optional)</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Import inventory, customers, or other business data</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">3</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Start using ServiceAI</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Create service requests, track progress, and optimize your operations</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center"
          >
            ← Back to Selection
          </Button>

          <Button
            onClick={handleComplete}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3"
          >
            Continue to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
