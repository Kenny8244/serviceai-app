import { useNavigate } from 'react-router-dom'
import { FileQuestion, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { hasSelectedVertical } from '@/lib/verticalStorage'

export function NotFoundPage() {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate(hasSelectedVertical() ? '/dashboard' : '/vertical-selection')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-6">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <FileQuestion className="h-8 w-8 text-slate-500 dark:text-slate-400" />
            </div>
          </div>
          <CardTitle className="text-3xl">Page not found</CardTitle>
          <CardDescription className="text-base">
            This route does not exist. Go home to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleGoHome}>
            <Home className="h-4 w-4 mr-2" />
            Go home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
