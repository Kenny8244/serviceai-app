import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageShell } from '@/components/layout/PageShell'
import { PageTabs } from '@/components/layout/PageTabs'
import { GradientIcon } from '@/components/layout/GradientIcon'
import {
  Activity,
  Target,
  Users,
  Brain,
  BarChart3,
  Bot,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Star,
  DollarSign,
  TrendingUp,
  Zap,
  Lightbulb,
  MessageSquare,
  FileText,
  Workflow,
  Ticket
} from 'lucide-react'

export function Analytics() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4" /> },
    { id: 'performance', label: 'Performance', icon: <Target className="h-4 w-4" /> },
    { id: 'usage', label: 'Usage', icon: <Users className="h-4 w-4" /> },
    { id: 'predictions', label: 'Predictions', icon: <Brain className="h-4 w-4" /> }
  ]

  return (
    <PageShell
      title="Analytics Dashboard"
      subtitle="Comprehensive insights and performance metrics"
      icon={<GradientIcon icon={BarChart3} />}
      actions={
        <>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/ai-hub')}
          >
            <Bot className="h-4 w-4 mr-2" />
            AI Hub
          </Button>
        </>
      }
    >
        <PageTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">AI Accuracy</p>
                        <p className="text-2xl font-bold text-green-600">94.2%</p>
                        <div className="flex items-center text-xs text-green-600 mt-1">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          +2.1% from last month
                        </div>
                      </div>
                      <Target className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Response Time</p>
                        <p className="text-2xl font-bold text-blue-600">2.3s</p>
                        <div className="flex items-center text-xs text-green-600 mt-1">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          -0.4s improvement
                        </div>
                      </div>
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">User Satisfaction</p>
                        <p className="text-2xl font-bold text-purple-600">4.8/5</p>
                        <div className="flex items-center text-xs text-green-600 mt-1">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          +0.2 from last week
                        </div>
                      </div>
                      <Star className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Cost Savings</p>
                        <p className="text-2xl font-bold text-green-600">$2,847</p>
                        <div className="flex items-center text-xs text-green-600 mt-1">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          +15% efficiency gain
                        </div>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analytics Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Performance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      AI Performance Trends
                    </CardTitle>
                    <CardDescription>Accuracy and response times over the last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between space-x-2">
                      {[
                        { day: 'Mon', accuracy: 92, response: 2.8 },
                        { day: 'Tue', accuracy: 94, response: 2.5 },
                        { day: 'Wed', accuracy: 93, response: 2.7 },
                        { day: 'Thu', accuracy: 95, response: 2.3 },
                        { day: 'Fri', accuracy: 94, response: 2.4 },
                        { day: 'Sat', accuracy: 96, response: 2.2 },
                        { day: 'Sun', accuracy: 94, response: 2.6 }
                      ].map((data, index) => (
                        <div key={index} className="flex flex-col items-center space-y-2">
                          <div className="flex flex-col items-center space-y-1">
                            <div
                              className="w-8 bg-blue-500 rounded-t-sm"
                              style={{ height: `${data.accuracy * 2}px` }}
                            ></div>
                            <div
                              className="w-8 bg-green-500 rounded-t-sm"
                              style={{ height: `${(data.response / 3) * 50}px` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">{data.day}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center space-x-6 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Accuracy %</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Response Time</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Usage Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Usage Statistics
                    </CardTitle>
                    <CardDescription>AI interactions and user engagement</CardDescription>
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
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Session Duration</span>
                      <span className="font-medium">8.4 min</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Service Request Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Ticket className="h-5 w-5 mr-2" />
                      Service Request Analytics
                    </CardTitle>
                    <CardDescription>Request patterns and resolution metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm">High Priority</span>
                        </div>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Medium Priority</span>
                        </div>
                        <span className="font-medium">18</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Low Priority</span>
                        </div>
                        <span className="font-medium">24</span>
                      </div>
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between text-sm">
                          <span>Avg Resolution Time</span>
                          <span className="font-medium">4.2 hours</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      AI Insights & Recommendations
                    </CardTitle>
                    <CardDescription>Smart suggestions for optimization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Peak Usage Pattern</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">AI usage peaks between 2-4 PM. Consider scheduling maintenance during off-peak hours.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">Form Optimization</p>
                          <p className="text-xs text-green-700 dark:text-green-300">Customer feedback forms have 94% completion rate. Consider adding phone field for better follow-up.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Zap className="h-4 w-4 text-purple-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Workflow Efficiency</p>
                          <p className="text-xs text-purple-700 dark:text-purple-300">Inventory alerts workflow is 32% more efficient than manual processes.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Performance Analytics</h2>
                <p className="text-slate-600 dark:text-slate-400">Detailed performance metrics and trends</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Response Time Trends</CardTitle>
                    <CardDescription>Average response times over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between space-x-2">
                      {[2.8, 2.5, 2.7, 2.3, 2.4, 2.2, 2.6].map((time, index) => (
                        <div key={index} className="flex flex-col items-center space-y-2">
                          <div
                            className="w-8 bg-green-500 rounded-t-sm"
                            style={{ height: `${(time / 3) * 100}px` }}
                          ></div>
                          <span className="text-xs text-slate-500">{time}s</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Accuracy Trends</CardTitle>
                    <CardDescription>AI accuracy percentages over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between space-x-2">
                      {[92, 94, 93, 95, 94, 96, 94].map((accuracy, index) => (
                        <div key={index} className="flex flex-col items-center space-y-2">
                          <div
                            className="w-8 bg-blue-500 rounded-t-sm"
                            style={{ height: `${accuracy * 2}px` }}
                          ></div>
                          <span className="text-xs text-slate-500">{accuracy}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Usage Analytics</h2>
                <p className="text-slate-600 dark:text-slate-400">User engagement and feature utilization</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Features</CardTitle>
                    <CardDescription>Most utilized AI capabilities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm">AI Chat Assistant</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">147 interactions today</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">+12%</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">Form Auto-Generation</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">8 forms created</p>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">+8%</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Workflow className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-sm">Workflow Automation</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">89 executions</p>
                          </div>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">+15%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Platform Analytics</CardTitle>
                    <CardDescription>User device and access patterns</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Desktop</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div className="w-16 bg-blue-500 h-2 rounded-full"></div>
                          </div>
                          <span className="text-sm font-medium">68%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Mobile</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div className="w-8 bg-green-500 h-2 rounded-full"></div>
                          </div>
                          <span className="text-sm font-medium">32%</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between text-sm">
                        <span>Peak Hours</span>
                        <span className="font-medium">2-4 PM</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span>Most Active Day</span>
                        <span className="font-medium">Wednesday</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Predictive Analytics</h2>
                <p className="text-slate-600 dark:text-slate-400">AI-powered forecasting and recommendations</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Predictions</CardTitle>
                    <CardDescription>Forecasted AI usage patterns</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Next Week Forecast</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">Expected 15% increase in AI queries based on current trends.</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">Peak Period Alert</p>
                      <p className="text-xs text-green-700 dark:text-green-300">Wednesday 2-4 PM expected to be busiest. Plan resources accordingly.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Opportunities</CardTitle>
                    <CardDescription>AI-suggested improvements</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Form Enhancement</p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">Adding phone field to feedback forms could improve follow-up success by 23%.</p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Workflow Optimization</p>
                      <p className="text-xs text-orange-700 dark:text-orange-300">Service request routing could be 18% more efficient with priority-based assignment.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
    </PageShell>
  )
}
