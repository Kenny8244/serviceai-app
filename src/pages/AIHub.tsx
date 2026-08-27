import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField as FormControl, nativeSelectClassName } from '@/components/ui/form-field'
import { PageShell } from '@/components/layout/PageShell'
import { PageTabs } from '@/components/layout/PageTabs'
import { GradientIcon } from '@/components/layout/GradientIcon'
import {
  Activity,
  TrendingUp,
  BarChart3,
  Users,
  Clock,
  Target,
  Zap,
  Brain,
  Eye,
  FileText,
  Workflow,
  Ticket,
  Trash2,
  Copy,
  GripVertical,
  Type,
  Mail,
  CheckSquare,
  AlignLeft,
  Edit3,
  Plus,
  CheckCircle,
  AlertCircle,
  Bot,
  MessageSquare,
  Send,
  ArrowLeft,
  Settings,
  Sparkles,
  Info,
  Hash,
  Lightbulb,
  Upload
} from 'lucide-react'

interface FormField {
  id: number
  type: 'text' | 'email' | 'textarea' | 'select' | 'file' | 'number'
  label: string
  required: boolean
  options?: string[]
}

interface AIHubProps {
  className?: string
}

export function AIHub({ className = "" }: AIHubProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [chatMessage, setChatMessage] = useState('')
  const [showFormBuilder, setShowFormBuilder] = useState(false)
  const [selectedForm, setSelectedForm] = useState<string | null>(null)
  const [formBuilderData, setFormBuilderData] = useState<{
    title: string
    description: string
    fields: FormField[]
  }>({
    title: '',
    description: '',
    fields: []
  })
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'ai',
      message: "Hello! I'm your ServiceAI assistant. How can I help you manage your business today?",
      timestamp: new Date()
    }
  ])

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return

    const newMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      message: chatMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, newMessage])
    const currentMessage = chatMessage.toLowerCase()
    setChatMessage('')

    // Enhanced AI response logic
    setTimeout(() => {
      let aiResponse = {
        id: chatMessages.length + 2,
        type: 'ai',
        message: "I understand your request. Let me help you with that.",
        timestamp: new Date()
      }

      // Check for creation requests
      if (currentMessage.includes('create') || currentMessage.includes('generate') || currentMessage.includes('build')) {
        if (currentMessage.includes('form') || currentMessage.includes('survey')) {
          aiResponse.message = "I can help you create a form! You can use the AI Creation Studio tab above, or describe what kind of form you need and I'll guide you through the process."
        } else if (currentMessage.includes('workflow')) {
          aiResponse.message = "I can help you create a workflow! The AI Creation Studio tab has templates and prompts to get you started, or describe what you need automated."
        } else if (currentMessage.includes('dashboard') || currentMessage.includes('report')) {
          aiResponse.message = "I can help you create analytics dashboards and reports! Use the AI Creation Studio or let me know what metrics you want to track."
        } else {
          aiResponse.message = "I can help you create various business assets! Try the AI Creation Studio tab, or be more specific about what you'd like to create (form, workflow, dashboard, etc.)."
        }
      }
      // Check for help requests
      else if (currentMessage.includes('help') || currentMessage.includes('how') || currentMessage.includes('what')) {
        aiResponse.message = "I'm here to help! You can ask me about creating workflows, forms, service requests, or managing your AI configurations. The AI Creation Studio tab is perfect for generating new business assets."
      }
      // Default responses
      else if (currentMessage.includes('workflow')) {
        aiResponse.message = "Workflows help automate your business processes. You can create them manually or use AI to generate them based on your requirements."
      }
      else if (currentMessage.includes('form')) {
        aiResponse.message = "Forms are great for collecting data from customers or team members. The AI Creation Studio can help you generate forms quickly."
      }
      else if (currentMessage.includes('analytics') || currentMessage.includes('data')) {
        aiResponse.message = "I can help you analyze your business data and create insightful reports. Check out the Analytics tab for detailed insights."
      }
      else {
        aiResponse.message = "I understand you're looking for help. You can manage your AI workflows, forms, and service requests from the tabs above, or use the AI Creation Studio to generate new assets."
      }

      setChatMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4" /> },
    { id: 'chat', label: 'AI Chat', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'creation', label: 'AI Creation', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'workflows', label: 'Workflows', icon: <Workflow className="h-4 w-4" /> },
    { id: 'forms', label: 'Forms', icon: <FileText className="h-4 w-4" /> },
    { id: 'requests', label: 'Service Requests', icon: <Ticket className="h-4 w-4" /> },
    { id: 'analytics', label: 'AI Analytics', icon: <BarChart3 className="h-4 w-4" /> }
  ]

  return (
    <PageShell
      className={className}
      title="AI Hub"
      subtitle="Centralized AI management and assistance"
      icon={<GradientIcon icon={Bot} />}
      actions={
        <>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Active
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings?section=ai')}
          >
            <Settings className="h-4 w-4 mr-2" />
            AI Settings
          </Button>
        </>
      }
    >
        <PageTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* AI Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Workflows</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">12</p>
                      </div>
                      <Workflow className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Custom Forms</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">8</p>
                      </div>
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Service Requests</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">24</p>
                      </div>
                      <Ticket className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">AI Accuracy</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">94%</p>
                      </div>
                      <Target className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Quick AI Actions
                  </CardTitle>
                  <CardDescription>
                    Common AI-powered tasks for your business
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex-col items-start"
                      onClick={() => setActiveTab('creation')}
                    >
                      <Workflow className="h-6 w-6 mb-2 text-blue-600" />
                      <span className="font-medium">Create Workflow</span>
                      <span className="text-xs text-slate-500">Automate business processes</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto p-4 flex-col items-start"
                      onClick={() => setActiveTab('creation')}
                    >
                      <FileText className="h-6 w-6 mb-2 text-green-600" />
                      <span className="font-medium">Build Form</span>
                      <span className="text-xs text-slate-500">Collect customer data</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto p-4 flex-col items-start"
                      onClick={() => setActiveTab('creation')}
                    >
                      <Ticket className="h-6 w-6 mb-2 text-purple-600" />
                      <span className="font-medium">Setup Service</span>
                      <span className="text-xs text-slate-500">Configure request handling</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent AI Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Recent AI Activity
                  </CardTitle>
                  <CardDescription>
                    Latest AI actions and insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Customer Service Auto-Response</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Handled 15 customer inquiries</p>
                      </div>
                      <span className="text-xs text-slate-500">2m ago</span>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Inventory Alert System</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Detected 3 low-stock items</p>
                      </div>
                      <span className="text-xs text-slate-500">15m ago</span>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Service Request Routing</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">New high-priority request assigned</p>
                      </div>
                      <span className="text-xs text-slate-500">1h ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'chat' && (
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  AI Assistant Chat
                </CardTitle>
                <CardDescription>
                  Ask questions, get help, or manage your AI configurations
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about your AI setup..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'creation' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">AI Creation Studio</h2>
                <p className="text-slate-600 dark:text-slate-400">Use AI to create workflows, forms, and service configurations</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Prompt Interface */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      AI Creation Prompts
                    </CardTitle>
                    <CardDescription>
                      Describe what you want to create and let AI generate it for you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <FormControl label="What would you like to create?" htmlFor="ai-create-type">
                        <select id="ai-create-type" className={nativeSelectClassName}>
                          <option value="workflow">AI Workflow</option>
                          <option value="form">Service Request Form</option>
                          <option value="service">Service Configuration</option>
                          <option value="report">Analytics Report</option>
                        </select>
                      </FormControl>

                      <FormControl label="Describe your requirements" htmlFor="ai-create-requirements">
                        <Textarea
                          id="ai-create-requirements"
                          rows={4}
                          placeholder="e.g., Create a customer feedback form for our restaurant with questions about food quality, service speed, and overall experience..."
                        />
                      </FormControl>

                      <Button className="w-full">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate with AI
                      </Button>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Recent AI Creations</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Customer Service Form</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Created</Badge>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <div className="flex items-center space-x-2">
                            <Workflow className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">Order Processing Workflow</span>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">Created</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Creation Templates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2" />
                      AI Creation Templates
                    </CardTitle>
                    <CardDescription>
                      Quick-start templates powered by AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start h-auto p-4">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-green-600" />
                          <div className="text-left">
                            <div className="font-medium">Customer Feedback Form</div>
                            <div className="text-xs text-slate-500">AI-generated form for collecting customer satisfaction</div>
                          </div>
                        </div>
                      </Button>

                      <Button variant="outline" className="w-full justify-start h-auto p-4">
                        <div className="flex items-center space-x-3">
                          <Workflow className="h-5 w-5 text-blue-600" />
                          <div className="text-left">
                            <div className="font-medium">Service Request Workflow</div>
                            <div className="text-xs text-slate-500">Automated workflow for handling service requests</div>
                          </div>
                        </div>
                      </Button>

                      <Button variant="outline" className="w-full justify-start h-auto p-4">
                        <div className="flex items-center space-x-3">
                          <BarChart3 className="h-5 w-5 text-purple-600" />
                          <div className="text-left">
                            <div className="font-medium">Performance Dashboard</div>
                            <div className="text-xs text-slate-500">AI-configured analytics dashboard</div>
                          </div>
                        </div>
                      </Button>

                      <Button variant="outline" className="w-full justify-start h-auto p-4">
                        <div className="flex items-center space-x-3">
                          <Ticket className="h-5 w-5 text-orange-600" />
                          <div className="text-left">
                            <div className="font-medium">Support Ticket System</div>
                            <div className="text-xs text-slate-500">Complete ticket management system</div>
                          </div>
                        </div>
                      </Button>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">AI Learning</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            AI improves with each creation, learning your business patterns and preferences.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'workflows' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">AI Workflows</h2>
                  <p className="text-slate-600 dark:text-slate-400">Manage automated business processes</p>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      Customer Service Auto-Response
                    </CardTitle>
                    <CardDescription>
                      Automatically responds to common customer inquiries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Status</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Responses Today</span>
                        <span className="font-medium">15</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span className="font-medium">94%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      Inventory Alert System
                    </CardTitle>
                    <CardDescription>
                      Monitors inventory levels and sends alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Status</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Items Monitored</span>
                        <span className="font-medium">247</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Alerts This Week</span>
                        <span className="font-medium">3</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'forms' && (
            <div className="space-y-6">
              {!showFormBuilder ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">AI Forms & Workflows</h2>
                      <p className="text-slate-600 dark:text-slate-400">Create, edit, and manage AI-powered forms and workflows</p>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => {
                          setShowFormBuilder(true)
                          setSelectedForm(null)
                          setFormBuilderData({ title: '', description: '', fields: [] })
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Form
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // AI-powered form generation
                          setShowFormBuilder(true)
                          setSelectedForm('ai-generated')
                          setFormBuilderData({
                            title: 'AI-Generated Service Request Form',
                            description: 'Automatically generated form for service requests',
                            fields: [
                              { id: 1, type: 'text', label: 'Customer Name', required: true },
                              { id: 2, type: 'email', label: 'Email Address', required: true },
                              { id: 3, type: 'select', label: 'Priority', required: true, options: ['Low', 'Medium', 'High', 'Urgent'] },
                              { id: 4, type: 'textarea', label: 'Description', required: true },
                              { id: 5, type: 'file' as const, label: 'Attachments', required: false }
                            ]
                          })
                        }}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate with AI
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Existing Forms */}
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-green-600" />
                            <CardTitle className="text-base">Customer Feedback Form</CardTitle>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>Collect customer satisfaction data</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Responses</span>
                            <span className="font-medium">8</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Fields</span>
                            <span className="font-medium">5</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Published</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-green-600" />
                            <CardTitle className="text-base">Service Request Form</CardTitle>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>Standard service request submission</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Submissions</span>
                            <span className="font-medium">24</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Fields</span>
                            <span className="font-medium">8</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Published</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-green-600" />
                            <CardTitle className="text-base">Product Registration Form</CardTitle>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>Register new products in inventory</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Entries</span>
                            <span className="font-medium">156</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Fields</span>
                            <span className="font-medium">6</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Published</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                /* Form Builder Interface */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowFormBuilder(false)
                          setSelectedForm(null)
                        }}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Forms
                      </Button>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {selectedForm === 'ai-generated' ? 'AI-Generated Form' : 'Form Builder'}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                          {selectedForm === 'ai-generated'
                            ? 'Customize your AI-generated form'
                            : 'Create a new form or workflow'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Publish Form
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Configuration */}
                    <div className="lg:col-span-2 space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Form Settings</CardTitle>
                          <CardDescription>Configure your form details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormControl label="Form Title" htmlFor="form-title">
                            <Input
                              id="form-title"
                              type="text"
                              value={formBuilderData.title}
                              onChange={(e) => setFormBuilderData(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Enter form title..."
                            />
                          </FormControl>

                          <FormControl label="Description" htmlFor="form-description">
                            <Textarea
                              id="form-description"
                              value={formBuilderData.description}
                              onChange={(e) => setFormBuilderData(prev => ({ ...prev, description: e.target.value }))}
                              rows={3}
                              placeholder="Describe what this form is for..."
                            />
                          </FormControl>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <GripVertical className="h-5 w-5 mr-2" />
                            Form Fields
                          </CardTitle>
                          <CardDescription>Drag and drop to reorder fields</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {formBuilderData.fields.map((field) => (
                              <div key={field.id} className="flex items-center space-x-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                                <GripVertical className="h-4 w-4 text-slate-400 cursor-move" />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    {field.type === 'text' && <Type className="h-4 w-4 text-blue-600" />}
                                    {field.type === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
                                    {field.type === 'select' && <CheckSquare className="h-4 w-4 text-blue-600" />}
                                    {field.type === 'textarea' && <AlignLeft className="h-4 w-4 text-blue-600" />}
                                    {field.type === 'file' && <Upload className="h-4 w-4 text-blue-600" />}
                                    <span className="font-medium text-sm">{field.label}</span>
                                    {field.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                                  </div>
                                </div>
                                <div className="flex space-x-1">
                                  <Button variant="ghost" size="sm">
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {/* Add Field Button */}
                            <Button variant="outline" className="w-full border-dashed border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Field
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Field Palette */}
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Field Types</CardTitle>
                          <CardDescription>Click to add fields to your form</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-auto p-3 flex-col items-center"
                              onClick={() => {
                                const newField: FormField = {
                                  id: Date.now(),
                                  type: 'text',
                                  label: 'Text Field',
                                  required: false
                                }
                                setFormBuilderData(prev => ({
                                  ...prev,
                                  fields: [...prev.fields, newField]
                                }))
                              }}
                            >
                              <Type className="h-5 w-5 mb-1" />
                              <span className="text-xs">Text</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-auto p-3 flex-col items-center"
                              onClick={() => {
                                const newField: FormField = {
                                  id: Date.now(),
                                  type: 'email',
                                  label: 'Email',
                                  required: false
                                }
                                setFormBuilderData(prev => ({
                                  ...prev,
                                  fields: [...prev.fields, newField]
                                }))
                              }}
                            >
                              <Mail className="h-5 w-5 mb-1" />
                              <span className="text-xs">Email</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-auto p-3 flex-col items-center"
                              onClick={() => {
                                const newField: FormField = {
                                  id: Date.now(),
                                  type: 'select',
                                  label: 'Dropdown',
                                  required: false,
                                  options: ['Option 1', 'Option 2', 'Option 3']
                                }
                                setFormBuilderData(prev => ({
                                  ...prev,
                                  fields: [...prev.fields, newField]
                                }))
                              }}
                            >
                              <CheckSquare className="h-5 w-5 mb-1" />
                              <span className="text-xs">Select</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-auto p-3 flex-col items-center"
                              onClick={() => {
                                const newField: FormField = {
                                  id: Date.now(),
                                  type: 'textarea',
                                  label: 'Long Text',
                                  required: false
                                }
                                setFormBuilderData(prev => ({
                                  ...prev,
                                  fields: [...prev.fields, newField]
                                }))
                              }}
                            >
                              <AlignLeft className="h-5 w-5 mb-1" />
                              <span className="text-xs">Textarea</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-auto p-3 flex-col items-center"
                              onClick={() => {
                                const newField: FormField = {
                                  id: Date.now(),
                                  type: 'file',
                                  label: 'File Upload',
                                  required: false
                                }
                                setFormBuilderData(prev => ({
                                  ...prev,
                                  fields: [...prev.fields, newField]
                                }))
                              }}
                            >
                              <Upload className="h-5 w-5 mb-1" />
                              <span className="text-xs">File</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-auto p-3 flex-col items-center"
                              onClick={() => {
                                const newField: FormField = {
                                  id: Date.now(),
                                  type: 'number',
                                  label: 'Number',
                                  required: false
                                }
                                setFormBuilderData(prev => ({
                                  ...prev,
                                  fields: [...prev.fields, newField]
                                }))
                              }}
                            >
                              <Hash className="h-5 w-5 mb-1" />
                              <span className="text-xs">Number</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>AI Suggestions</CardTitle>
                          <CardDescription>Smart field recommendations</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Priority Field</p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">Add for service requests</p>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">Description Field</p>
                            <p className="text-xs text-green-700 dark:text-green-300">Required for detailed requests</p>
                          </div>
                          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Attachment Field</p>
                            <p className="text-xs text-purple-700 dark:text-purple-300">Allow file uploads</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Service Requests</h2>
                  <p className="text-slate-600 dark:text-slate-400">Manage and track service requests</p>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">Urgent: System Outage</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Critical system failure affecting all users</p>
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-800">High Priority</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium">Feature Request: Dark Mode</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Customer requesting dark mode for better UX</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <Lightbulb className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Improvement: Mobile Responsiveness</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Enhance mobile user experience</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Low Priority</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">AI Analytics</h2>
                <p className="text-slate-600 dark:text-slate-400">Insights and performance metrics</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Response Accuracy</span>
                      <span className="font-medium">94%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Response Time</span>
                      <span className="font-medium">2.3s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Customer Satisfaction</span>
                      <span className="font-medium">4.8/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Workflow Efficiency</span>
                      <span className="font-medium">+32%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Usage Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">AI Queries Today</span>
                      <span className="font-medium">147</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Users</span>
                      <span className="font-medium">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Forms Completed</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Workflow Executions</span>
                      <span className="font-medium">89</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    Quick Insights
                  </CardTitle>
                  <CardDescription>AI-powered recommendations for your business</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">High AI Engagement</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Your team is actively using AI features. Consider expanding AI capabilities.</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">Workflow Efficiency</p>
                    <p className="text-xs text-green-700 dark:text-green-300">Automated workflows are 32% more efficient than manual processes.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
    </PageShell>
  )
}
