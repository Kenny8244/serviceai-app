import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UtensilsCrossed, ArrowRight, CheckCircle, Clock, ChefHat, Users } from "lucide-react"
import { AISearch } from "@/components/ai/AISearch"
import { BackButton } from "@/components/ui/BackButton"
import { AIAssistant } from "@/components/ai/AIAssistant"

interface RestaurantLandingPageProps {
  onGetStarted: () => void
}

export function RestaurantLandingPage({ onGetStarted }: RestaurantLandingPageProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGetStarted = () => {
    setIsLoading(true)
    // Simulate loading
    setTimeout(() => {
      onGetStarted()
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background grid-pattern floating-particles">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 gradient-animated opacity-20"></div>

        <div className="relative z-10 container mx-auto px-6 py-16 max-w-6xl">
          {/* Back Navigation */}
          <div className="mb-8">
            <BackButton to="/vertical-selection" className="text-muted-foreground hover:text-foreground" />
          </div>

          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                  <UtensilsCrossed className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight text-balance">
              Welcome to
              <br />
              <span className="text-gradient">Restaurant AI</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed text-pretty mb-12">
              Streamline your restaurant operations with intelligent order management, kitchen optimization,
              and AI-powered customer service designed for modern dining establishments.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="backdrop-blur-glass border-border/50 card-hover text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-purple-400" />
                </div>
                <CardTitle className="text-xl">Order Optimization</CardTitle>
                <CardDescription>
                  Intelligent order management and kitchen workflow optimization
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="backdrop-blur-glass border-border/50 card-hover text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-8 w-8 text-orange-400" />
                </div>
                <CardTitle className="text-xl">Menu Intelligence</CardTitle>
                <CardDescription>
                  Data-driven insights into menu performance and customer preferences
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="backdrop-blur-glass border-border/50 card-hover text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
                <CardTitle className="text-xl">Staff Management</CardTitle>
                <CardDescription>
                  AI-powered staff scheduling based on peak hours and demand patterns
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* AI Search Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                🔍 Explore Restaurant AI Features
              </h3>
              <p className="text-muted-foreground">
                Search for specific AI tools and capabilities designed for restaurant operations
              </p>
            </div>
            <AISearch
              placeholder="Search restaurant features like 'menu optimization', 'staff scheduling', 'order management'..."
              className="mx-auto"
            />
          </div>

          {/* Benefits Section */}
          <div className="backdrop-blur-glass rounded-3xl p-12 border border-border/50 mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Why Choose Restaurant AI?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Join successful restaurants who have optimized their operations with our AI platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-foreground">Reduce wait times by 40%</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-foreground">Increase table turnover by 25%</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-foreground">Optimize staff scheduling</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-foreground">Improve customer satisfaction</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-foreground">Menu performance analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-foreground">Real-time operational insights</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Button
              onClick={handleGetStarted}
              disabled={isLoading}
              className="px-12 py-6 text-xl font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 glow-blue shine-modern button-glow"
            >
              {isLoading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                  <span>Loading your dashboard...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <span>Get Started with Restaurant AI</span>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>

            <p className="text-muted-foreground mt-6 text-sm">
              Ready to transform your restaurant operations? Start your AI-powered journey today.
            </p>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant vertical="restaurant" />
    </div>
  )
}
