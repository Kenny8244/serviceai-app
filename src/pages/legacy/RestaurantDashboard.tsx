import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UtensilsCrossed, Clock, Users, ChefHat, TrendingUp, Calendar, Settings, LogOut } from "lucide-react"
import { BackButton } from "@/components/ui/BackButton"
import { AIAssistant } from "@/components/ai/AIAssistant"

export function RestaurantDashboard() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-glass">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton to="/restaurant" className="mr-4 text-muted-foreground hover:text-foreground" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <UtensilsCrossed className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Restaurant Dashboard</h1>
                  <p className="text-sm text-muted-foreground">AI-powered restaurant management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="backdrop-blur-glass" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" className="backdrop-blur-glass" onClick={() => navigate('/auth')}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="backdrop-blur-glass rounded-3xl p-8 border border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Welcome to Your <span className="text-gradient">Restaurant Hub</span>
                </h2>
                <p className="text-muted-foreground text-lg">
                  Streamline operations with intelligent order management and customer service
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                  <UtensilsCrossed className="h-16 w-16 text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Orders</p>
                  <p className="text-2xl font-bold text-foreground">247</p>
                  <p className="text-sm text-green-400">+15% from yesterday</p>
                </div>
                <Clock className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Tables</p>
                  <p className="text-2xl font-bold text-foreground">23/45</p>
                  <p className="text-sm text-muted-foreground">51% capacity</p>
                </div>
                <Users className="h-8 w-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Wait Time</p>
                  <p className="text-2xl font-bold text-foreground">12 min</p>
                  <p className="text-sm text-green-400">-3 min improvement</p>
                </div>
                <ChefHat className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Today</p>
                  <p className="text-2xl font-bold text-foreground">$3,421</p>
                  <p className="text-sm text-green-400">+8% from yesterday</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Optimization */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <span>Order Optimization</span>
              </CardTitle>
              <CardDescription>
                Intelligent order management and kitchen workflow optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Pending Orders</span>
                  <span className="text-sm text-muted-foreground">8 orders</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Prep Time</span>
                  <span className="text-sm text-muted-foreground">Avg: 8 min</span>
                </div>
                <Button className="w-full button-glow">
                  Optimize Orders
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Menu Analytics */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span>Menu Analytics</span>
              </CardTitle>
              <CardDescription>
                Data-driven insights into menu performance and customer preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Best Sellers</span>
                  <span className="text-sm text-muted-foreground">Grilled Salmon</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Low Performers</span>
                  <span className="text-sm text-muted-foreground">Caesar Salad</span>
                </div>
                <Button className="w-full button-glow">
                  Analyze Menu
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Staff Scheduling */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span>Staff Scheduling</span>
              </CardTitle>
              <CardDescription>
                AI-powered staff scheduling based on peak hours and demand patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Today Shifts</span>
                  <span className="text-sm text-muted-foreground">12 staff</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Peak Hours</span>
                  <span className="text-sm text-muted-foreground">6-8 PM</span>
                </div>
                <Button className="w-full button-glow">
                  Manage Schedule
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customer Service */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span>Customer Service</span>
              </CardTitle>
              <CardDescription>
                Enhanced customer experience with personalized service recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="backdrop-blur-glass">
                  Customer Feedback
                </Button>
                <Button variant="outline" className="backdrop-blur-glass">
                  Service Alerts
                </Button>
                <Button variant="outline" className="backdrop-blur-glass">
                  Loyalty Program
                </Button>
                <Button variant="outline" className="backdrop-blur-glass">
                  Reviews
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* AI Assistant */}
      <AIAssistant vertical="restaurant" context="dashboard" />
    </div>
  )
}
