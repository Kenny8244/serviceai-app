import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { ArrowRight, Sparkles } from 'lucide-react'
import { getSelectedVertical } from '@/lib/verticalStorage'
import { apiService } from '@/services/api'

interface OnboardingConfirmationProps {
  onComplete?: (verticalId: string) => void
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

  const [workspaceName, setWorkspaceName] = useState('Default Workspace')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { workspaces } = await apiService.listWorkspaces()
        if (cancelled || !workspaces[0]) return
        setWorkspaceName(workspaces[0].name || 'Default Workspace')
        if (workspaces[0].description) {
          setDescription(workspaces[0].description)
        }
      } catch {
        // Prefill is best-effort; form still works with default name
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleComplete = async () => {
    const name = workspaceName.trim()
    if (!name || isSaving) return

    setIsSaving(true)
    setError(null)
    try {
      await apiService.completeOnboardingWorkspace({
        name,
        description: description.trim() || undefined,
      })
      if (onComplete) {
        onComplete(selectedVertical)
      } else {
        navigate('/dashboard', { state: { verticalId: selectedVertical }, replace: true })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save workspace'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    navigate('/vertical-selection')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Set up your workspace
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Name the workspace for your {vertical.name.toLowerCase()} business
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="text-5xl">{vertical.icon}</div>
            </div>
            <CardTitle className="text-2xl mb-2">{vertical.name}</CardTitle>
            <CardDescription className="text-lg">{vertical.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Workspace name" htmlFor="workspaceName" required>
              <Input
                id="workspaceName"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Acme Ops"
                disabled={isSaving}
                autoFocus
              />
            </FormField>
            <FormField label="Description" htmlFor="workspaceDescription">
              <Input
                id="workspaceDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional short description"
                disabled={isSaving}
              />
            </FormField>
            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {vertical.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center"
            disabled={isSaving}
          >
            ← Back to Selection
          </Button>

          <Button
            onClick={handleComplete}
            disabled={isSaving || !workspaceName.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3"
          >
            {isSaving ? 'Saving…' : 'Continue to Dashboard'}
            {!isSaving ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        </div>
      </div>
    </div>
  )
}
