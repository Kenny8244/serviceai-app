import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Store, TrendingUp, Users, DollarSign, Package, BarChart3, Settings, LogOut } from "lucide-react"
import { BackButton } from "../ui/BackButton"
import { AIAssistant } from "../ui/AIAssistant"

export function MarketplaceDashboard() {
  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-glass">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton to="/marketplace" className="mr-4 text-muted-foreground hover:text-foreground" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Marketplace Dashboard</h1>
                  <p className="text-sm text-muted-foreground">AI-powered marketplace optimization</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="backdrop-blur-glass">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" className="backdrop-blur-glass">
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
                  Welcome to Your <span className="text-gradient">Marketplace Hub</span>
                </h2>
                <p className="text-muted-foreground text-lg">
                  Optimize vendor management and customer insights with AI-driven analytics
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                  <Store className="h-16 w-16 text-green-400" />
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
                  <p className="text-sm text-muted-foreground">Active Vendors</p>
                  <p className="text-2xl font-bold text-foreground">156</p>
                  <p className="text-sm text-green-400">+12 new this month</p>
                </div>
                <Users className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly GMV</p>
                  <p className="text-2xl font-bold text-foreground">$2.4M</p>
                  <p className="text-sm text-green-400">+18% from last month</p>
                </div>
                <DollarSign className="h-8 w-8 text-teal-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Listed Products</p>
                  <p className="text-2xl font-bold text-foreground">8,429</p>
                  <p className="text-sm text-muted-foreground">Across all categories</p>
                </div>
                <Package className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold text-foreground">4.2%</p>
                  <p className="text-sm text-green-400">+0.6% improvement</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vendor Analytics */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span>Vendor Analytics</span>
              </CardTitle>
              <CardDescription>
                Comprehensive insights into vendor performance and product trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Top Performers</span>
                  <span className="text-sm text-muted-foreground">23 vendors</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Needs Attention</span>
                  <span className="text-sm text-muted-foreground">5 vendors</span>
                </div>
                <Button className="w-full button-glow">
                  View Vendor Reports
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Price Optimization */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span>Price Optimization</span>
              </CardTitle>
              <CardDescription>
                AI-driven pricing strategies to maximize revenue and market share
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Auto-Pricing Active</span>
                  <span className="text-sm text-muted-foreground">1,247 products</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Revenue Impact</span>
                  <span className="text-sm text-green-400">+15% avg</span>
                </div>
                <Button className="w-full button-glow">
                  Optimize Prices
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customer Segmentation */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span>Customer Segmentation</span>
              </CardTitle>
              <CardDescription>
                Advanced customer behavior analysis and segmentation for targeted marketing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Customer Segments</span>
                  <span className="text-sm text-muted-foreground">8 active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">High-Value Customers</span>
                  <span className="text-sm text-muted-foreground">342 users</span>
                </div>
                <Button className="w-full button-glow">
                  Analyze Segments
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Platform Management */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <span>Platform Management</span>
              </CardTitle>
              <CardDescription>
                Essential tools for marketplace administration and vendor relations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="backdrop-blur-glass">
                  Vendor Onboarding
                </Button>
                <Button variant="outline" className="backdrop-blur-glass">
                  Commission Reports
                </Button>
                <Button variant="outline" className="backdrop-blur-glass">
                  Dispute Resolution
                </Button>
                <Button variant="outline" className="backdrop-blur-glass">
                  Platform Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* AI Assistant */}
      <AIAssistant vertical="marketplace" context="dashboard" />
    </div>
  )
}
