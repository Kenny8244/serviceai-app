import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Workflow, Shield, BarChart3, Settings, LogOut, Zap } from "lucide-react"
import { BackButton } from "@/components/ui/BackButton"
import { AIAssistant } from "@/components/ai/AIAssistant"

export function EnterpriseDashboard() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-glass">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton to="/vertical-selection" className="mr-4 text-muted-foreground hover:text-foreground" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Enterprise Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Custom AI solutions for your business</p>
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
                  Welcome to Your <span className="text-gradient">Enterprise Hub</span>
                </h2>
                <p className="text-muted-foreground text-lg">
                  Custom AI solutions tailored for your unique business needs and workflows
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-orange-400" />
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
                  <p className="text-sm text-muted-foreground">Active Workflows</p>
                  <p className="text-2xl font-bold text-foreground">47</p>
                  <p className="text-sm text-green-400">+5 this month</p>
                </div>
                <Workflow className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold text-foreground">284</p>
                  <p className="text-sm text-muted-foreground">Across 12 departments</p>
                </div>
                <Users className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Security Score</p>
                  <p className="text-2xl font-bold text-foreground">98.5%</p>
                  <p className="text-sm text-green-400">Enterprise grade</p>
                </div>
                <Shield className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Process Efficiency</p>
                  <p className="text-2xl font-bold text-foreground">94.2%</p>
                  <p className="text-sm text-green-400">+12% improvement</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Custom Workflows */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Workflow className="h-5 w-5 text-white" />
                </div>
                <span>Custom Workflows</span>
              </CardTitle>
              <CardDescription>
                Tailored AI automation for your specific business processes and requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Active Automations</span>
                  <span className="text-sm text-muted-foreground">23 workflows</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Pending Approvals</span>
                  <span className="text-sm text-muted-foreground">3 requests</span>
                </div>
                <Button className="w-full button-glow">
                  Manage Workflows
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Analytics */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span>Advanced Analytics</span>
              </CardTitle>
              <CardDescription>
                Deep business intelligence with custom KPIs and predictive insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Custom Reports</span>
                  <span className="text-sm text-muted-foreground">15 active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Predictive Models</span>
                  <span className="text-sm text-muted-foreground">7 deployed</span>
                </div>
                <Button className="w-full button-glow">
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enterprise Security */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span>Enterprise Security</span>
              </CardTitle>
              <CardDescription>
                Bank-level security with compliance monitoring and threat detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Security Incidents</span>
                  <span className="text-sm text-green-400">0 this month</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-foreground">Compliance Status</span>
                  <span className="text-sm text-muted-foreground">100% compliant</span>
                </div>
                <Button className="w-full button-glow">
                  Security Center
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Team Management */}
          <Card className="backdrop-blur-glass border-border/50 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span>Team Management</span>
              </CardTitle>
              <CardDescription>
                Comprehensive team collaboration and project management tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="backdrop-blur-glass">
                  Team Directory
                </Button>
                <Button variant="outline" className="backdrop-blur-glass">
                  Project Boards
                </Button>
                <Button variant="outline" className="backdrop-blur-glass">
                  Access Control
                </Button>
                <Button variant="outline" className="backdrop-blur-glass">
                  Performance
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* AI Assistant */}
      <AIAssistant vertical="enterprise" context="dashboard" />
    </div>
  )
}
