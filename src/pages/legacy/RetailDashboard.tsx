import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { ShoppingBag, TrendingUp, Users, Package, DollarSign, BarChart3, Settings, LogOut, MessageCircle, AlertCircle, Plus, FileText, Search } from "lucide-react"
import { BackButton } from "../ui/BackButton"
import { AIAssistant } from "../ui/AIAssistant"
import { ProductDrawer } from "../ui/ProductDrawer"
import { apiService } from "../../services/api"

interface DashboardStats {
  products: {
    count: number
    change: { value: number, percentage: number }
    trend: string
  }
  customers: {
    count: number
    change: { value: number, percentage: number }
    trend: string
  }
  revenue: {
    data: Array<{ month: string, revenue: number, timestamp: string }>
    total: number
  }
  activities: {
    activities: Array<{
      id: string
      timestamp: string
      action: string
      user: string
      details: string
      type: string
    }>
    total: number
  }
}

export function RetailDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Get products count from localStorage
        const products = JSON.parse(localStorage.getItem("serviceai_products") || "[]")
        const productsCount = products.length
        
        const [customersData, revenueData, activitiesData] = await Promise.all([
          apiService.getActiveCustomers(),
          apiService.getMonthlyRevenue(),
          apiService.getRecentActivity()
        ])

        setStats({
          products: {
            count: productsCount,
            change: { value: 0, percentage: 0 },
            trend: 'up'
          },
          customers: customersData as { count: number, change: { value: number, percentage: number }, trend: string },
          revenue: revenueData as { data: Array<{ month: string, revenue: number, timestamp: string }>, total: number },
          activities: activitiesData as { activities: Array<{ id: string, timestamp: string, action: string, user: string, details: string, type: string }>, total: number }
        })
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleProductSaved = async () => {
    // Refresh dashboard data after product is saved
    try {
      // Get products from localStorage
      const products = JSON.parse(localStorage.getItem("serviceai_products") || "[]")
      const currentCount = products.length
      
      // Calculate change (mock data for now)
      const previousCount = currentCount - 1
      const changeValue = currentCount - previousCount
      const changePercentage = previousCount > 0 ? (changeValue / previousCount) * 100 : 0
      
      setStats(prev => prev ? {
        ...prev,
        products: {
          count: currentCount,
          change: { value: changeValue, percentage: changePercentage },
          trend: changeValue >= 0 ? 'up' : 'down'
        }
      } : null)
    } catch (err) {
      console.error('Error refreshing dashboard data:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid-pattern flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background grid-pattern flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Dashboard</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentMonthRevenue = stats?.revenue.data[stats.revenue.data.length - 1]?.revenue || 0
  const previousMonthRevenue = stats?.revenue.data[stats.revenue.data.length - 2]?.revenue || 0
  const revenueChange = previousMonthRevenue > 0
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    : 0

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-glass">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton to="/retail" className="mr-4 text-muted-foreground hover:text-foreground" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Retail Dashboard</h1>
                  <p className="text-sm text-muted-foreground">AI-powered retail insights</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="backdrop-blur-glass"
                onClick={() => {
                  console.log("Search clicked");
                  alert("Opening Search");
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="backdrop-blur-glass"
                onClick={() => {
                  console.log("AI Assistant clicked");
                  alert("Opening AI Assistant");
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                AI Help
              </Button>
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
                  Welcome to Your <span className="text-gradient">Retail Hub</span>
                </h2>
                <p className="text-muted-foreground text-lg">
                  Transform your retail operations with AI-powered insights and automation
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-16 w-16 text-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-glass border-border/50 card-hover" onClick={() => {
            console.log("Widget clicked: Total Products");
            alert("Navigating to Product details");
          }}>
            <CardContent className="p-6 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.products.count.toLocaleString() || '...'}</p>
                  <p className={`text-sm ${stats?.products.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {stats?.products.change.value ? (stats.products.change.value > 0 ? '+' : '') + stats.products.change.value : '0'} ({stats?.products.change.percentage || 0}%)
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-glass border-border/50 card-hover" onClick={() => {
            console.log("Widget clicked: Active Customers");
            alert("Navigating to Customer details");
          }}>
            <CardContent className="p-6 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Customers</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.customers.count.toLocaleString() || '...'}</p>
                  <p className={`text-sm ${stats?.customers.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {stats?.customers.change.value ? (stats.customers.change.value > 0 ? '+' : '') + stats.customers.change.value : '0'} ({stats?.customers.change.percentage || 0}%)
                  </p>
                </div>
                <Users className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-glass border-border/50 card-hover" onClick={() => {
            console.log("Widget clicked: Monthly Revenue");
            alert("Navigating to Revenue details");
          }}>
            <CardContent className="p-6 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-foreground">${currentMonthRevenue.toLocaleString()}</p>
                  <p className={`text-sm ${revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% from last month
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-glass border-border/50 card-hover" onClick={() => {
            console.log("Widget clicked: Conversion Rate");
            alert("Navigating to Conversion Rate details");
          }}>
            <CardContent className="p-6 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold text-foreground">3.24%</p>
                  <p className="text-sm text-green-400">+0.4% from last month</p>
                </div>
                <BarChart3 className="h-8 w-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Smart Recommendations */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span>Smart Recommendations</span>
              </CardTitle>
              <CardDescription>
                AI-powered product recommendations to boost sales and customer satisfaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Top Selling Items</span>
                  <span className="text-sm text-muted-foreground">View Analytics</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Customer Preferences</span>
                  <span className="text-sm text-muted-foreground">Personalized Offers</span>
                </div>
                <Button className="w-full button-glow cursor-pointer" onClick={(e) => {
                  console.log("Add Product clicked - event:", e);
                  console.log("isProductDrawerOpen before:", isProductDrawerOpen);
                  setIsProductDrawerOpen(true);
                  console.log("isProductDrawerOpen after:", isProductDrawerOpen);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Product
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Management */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <span>Inventory Management</span>
              </CardTitle>
              <CardDescription>
                Optimize stock levels and reduce waste with intelligent inventory tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Low Stock Alerts</span>
                  <span className="text-sm text-muted-foreground">3 items</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Overstock Items</span>
                  <span className="text-sm text-muted-foreground">12 items</span>
                </div>
                <Button className="w-full button-glow" onClick={() => {
                  console.log("Manage Inventory clicked");
                  alert("Opening Inventory Management");
                }}>
                  <Package className="h-4 w-4 mr-2" />
                  Manage Inventory
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customer Analytics */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span>Customer Analytics</span>
              </CardTitle>
              <CardDescription>
                Deep insights into customer behavior and shopping patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Customer Segments</span>
                  <span className="text-sm text-muted-foreground">5 active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Purchase Patterns</span>
                  <span className="text-sm text-muted-foreground">Analyze Trends</span>
                </div>
                <Button className="w-full button-glow" onClick={() => {
                  console.log("Analytics clicked");
                  alert("Navigating to Analytics page");
                }}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>
                Common tasks and shortcuts for retail management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="backdrop-blur-glass" onClick={() => {
                  console.log("Service Request clicked");
                  alert("Opening Service Request form");
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Service Request
                </Button>
                <Button variant="outline" className="backdrop-blur-glass" onClick={() => {
                  console.log("Generate Report clicked");
                  alert("Opening Report Generator");
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" className="backdrop-blur-glass" onClick={() => {
                  console.log("Export Data clicked");
                  alert("Opening Data Export");
                }}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" className="backdrop-blur-glass" onClick={() => {
                  console.log("Schedule Alert clicked");
                  alert("Opening Alert Scheduler");
                }}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Schedule Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* AI Assistant */}
      <AIAssistant vertical="retail" context="dashboard" />

      {/* Product Drawer */}
      <ProductDrawer
        isOpen={isProductDrawerOpen}
        onClose={() => {
          console.log("Drawer closing");
          setIsProductDrawerOpen(false);
        }}
        onSave={handleProductSaved}
      />
    </div>
  )
}
