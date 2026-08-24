import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { apiService } from '../services/api'
import type { TeamMember, ServiceTicket } from '../services/api'
import {
  Users,
  UserPlus,
  Settings,
  Shield,
  Activity,
  ArrowLeft,
  Search,
  Filter,
  MoreVertical,
  Edit3,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  Crown,
  User,
  FileText,
  TrendingUp,
  AlertCircle,
  Award,
  Bot,
  Brain,
  Route,
  Target,
  ArrowUpRight,
  DollarSign,
  BarChart3
} from 'lucide-react'

export function TeamManagement() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load team members and service tickets
        const [teamResponse, ticketsResponse] = await Promise.all([
          apiService.getTeamMembers(),
          // For now, we'll use mock tickets data until we implement the service tickets API
          Promise.resolve({
            serviceTickets: [
              {
                id: '1',
                title: 'Customer unable to access dashboard',
                status: 'in_progress' as const,
                priority: 'high' as const,
                assignee: 'Sarah Johnson',
                createdBy: 'John Doe',
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 30 * 60 * 1000),
                messages: 5,
                lastMessage: 'I\'m investigating the login issue...'
              },
              {
                id: '2',
                title: 'Feature request: Dark mode toggle',
                status: 'open' as const,
                priority: 'medium' as const,
                assignee: 'Mike Chen',
                createdBy: 'Jane Smith',
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
                messages: 3,
                lastMessage: 'This would be a great addition to improve UX'
              },
              {
                id: '3',
                title: 'Bug: Form submission error',
                status: 'resolved' as const,
                priority: 'urgent' as const,
                assignee: 'Emily Davis',
                createdBy: 'Bob Wilson',
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                messages: 8,
                lastMessage: 'Issue resolved - validation was too strict'
              }
            ]
          })
        ])

        setTeamMembers(teamResponse.teamMembers.map(member => ({
          ...member,
          joinDate: new Date(member.joinDate),
          lastActive: new Date(member.lastActive)
        })) || [])
        setServiceTickets(ticketsResponse.serviceTickets.map(ticket => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          updatedAt: new Date(ticket.updatedAt)
        })))
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load data from server')
        // Fallback to mock data on error
        setTeamMembers([
          {
            id: '1',
            name: 'Sarah Johnson',
            email: 'sarah@company.com',
            role: 'admin',
            status: 'online',
            lastActive: new Date(),
            joinDate: new Date('2024-01-15'),
            permissions: ['all'],
            expertise: ['technical', 'management', 'strategy'],
            workload: 75,
            stats: {
              ticketsResolved: 147,
              avgResponseTime: '2.3h',
              satisfaction: 4.8
            }
          },
          {
            id: '2',
            name: 'Mike Chen',
            email: 'mike@company.com',
            role: 'manager',
            status: 'away',
            lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
            joinDate: new Date('2024-02-01'),
            permissions: ['manage_team', 'manage_tickets'],
            expertise: ['customer_service', 'workflow_optimization', 'team_leadership'],
            workload: 60,
            stats: {
              ticketsResolved: 89,
              avgResponseTime: '1.8h',
              satisfaction: 4.6
            }
          },
          {
            id: '3',
            name: 'Emily Davis',
            email: 'emily@company.com',
            role: 'agent',
            status: 'online',
            lastActive: new Date(),
            joinDate: new Date('2024-03-10'),
            permissions: ['resolve_tickets', 'communicate'],
            expertise: ['customer_support', 'product_knowledge', 'troubleshooting'],
            workload: 45,
            stats: {
              ticketsResolved: 156,
              avgResponseTime: '3.2h',
              satisfaction: 4.9
            }
          },
          {
            id: '4',
            name: 'Alex Rodriguez',
            email: 'alex@company.com',
            role: 'agent',
            status: 'offline',
            lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000),
            joinDate: new Date('2024-03-15'),
            permissions: ['resolve_tickets', 'communicate'],
            expertise: ['technical_support', 'system_administration', 'networking'],
            workload: 80,
            stats: {
              ticketsResolved: 73,
              avgResponseTime: '4.1h',
              satisfaction: 4.4
            }
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading team data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Error Loading Data</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Team Management
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Manage your team, permissions, and collaboration
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Team Settings
              </Button>
              <Button className="bg-green-500 hover:bg-green-600 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-8">
          {[
            { id: 'overview', label: 'Team Overview', icon: <Users className="h-4 w-4" /> },
            { id: 'members', label: 'Team Members', icon: <User className="h-4 w-4" /> },
            { id: 'tickets', label: 'Service Tickets', icon: <FileText className="h-4 w-4" /> },
            { id: 'predictive', label: 'Predictive Maintenance', icon: <TrendingUp className="h-4 w-4" /> },
            { id: 'analytics', label: 'Team Analytics', icon: <TrendingUp className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1
                ${activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Team Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Team Members</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{teamMembers.length}</p>
                        <p className="text-xs text-green-600 mt-1">4 active today</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Tickets</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {serviceTickets.filter(t => t.status !== 'closed').length}
                        </p>
                        <p className="text-xs text-orange-600 mt-1">2 high priority</p>
                      </div>
                      <FileText className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Response</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">2.8h</p>
                        <p className="text-xs text-green-600 mt-1">-12% improvement</p>
                      </div>
                      <Clock className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Satisfaction</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">4.7/5</p>
                        <p className="text-xs text-green-600 mt-1">Above industry avg</p>
                      </div>
                      <Award className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Recent Team Activity
                    </CardTitle>
                    <CardDescription>Latest updates from your team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Sarah Johnson resolved ticket #1234</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">2 minutes ago</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Mike Chen updated workflow settings</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">15 minutes ago</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <UserPlus className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Emily Davis joined the team</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Top Performers
                    </CardTitle>
                    <CardDescription>Team members with highest performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">SJ</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Sarah Johnson</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Admin</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">147 tickets</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-green-600">ED</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Emily Davis</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Agent</p>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">156 tickets</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-purple-600">MC</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Mike Chen</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Manager</p>
                          </div>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">89 tickets</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search team members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
                <Button className="bg-green-500 hover:bg-green-600 text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </div>

              {/* Team Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map((member) => (
                  <Card key={member.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{member.name}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {member.status === 'online' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : member.status === 'away' ? (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-slate-400" />
                          )}
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {member.role === 'admin' ? (
                            <Crown className="h-4 w-4 text-yellow-600" />
                          ) : member.role === 'manager' ? (
                            <Shield className="h-4 w-4 text-blue-600" />
                          ) : (
                            <User className="h-4 w-4 text-slate-600" />
                          )}
                          <Badge className={
                            member.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                            member.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            member.role === 'agent' ? 'bg-green-100 text-green-800' :
                            'bg-slate-100 text-slate-800'
                          }>
                            {member.role}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-500">
                          Joined {member.joinDate.toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {member.stats.ticketsResolved}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Tickets</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {member.stats.avgResponseTime}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Avg Time</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {member.stats.satisfaction}/5
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Rating</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-6">
              {/* Ticket Management Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Service Tickets</h2>
                  <p className="text-slate-600 dark:text-slate-400">Manage and track team service requests</p>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" size="sm">
                    <Brain className="h-4 w-4 mr-2" />
                    AI Auto-Route
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                    <FileText className="h-4 w-4 mr-2" />
                    New Ticket
                  </Button>
                </div>
              </div>

              {/* Tickets List */}
              <div className="space-y-4">
                {serviceTickets.map((ticket) => {
                  const availableMembers = teamMembers.filter(member =>
                    member.status === 'online' && member.role !== 'guest'
                  )

                  const ticketContent = `${ticket.title} ${ticket.lastMessage}`.toLowerCase()
                  const keywords = ticketContent.match(/\b\w+\b/g) || []

                  const scoredMembers = availableMembers.map(member => {
                    let score = 0

                    const expertiseMatch = member.expertise.filter(exp =>
                      keywords.some(keyword => exp.toLowerCase().includes(keyword) || keyword.includes(exp.toLowerCase()))
                    ).length
                    score += (expertiseMatch / member.expertise.length) * 40

                    const workloadScore = Math.max(0, 30 - member.workload)
                    score += workloadScore

                    const performanceScore = (member.stats.satisfaction / 5) * 20
                    score += performanceScore

                    const availabilityScore = member.status === 'online' ? 10 : 5
                    score += availabilityScore

                    return { member, score }
                  })

                  scoredMembers.sort((a, b) => b.score - a.score)
                  const routingSuggestion = scoredMembers[0] || null

                  return (
                    <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{ticket.title}</h3>
                              <Badge className={
                                ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }>
                                {ticket.priority}
                              </Badge>
                              <Badge variant={ticket.status === 'resolved' ? 'default' : 'secondary'}>
                                {ticket.status}
                              </Badge>
                              {routingSuggestion && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <Bot className="h-3 w-3 mr-1" />
                                  AI Suggested
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                              <span>Current: {ticket.assignee}</span>
                              <span>Created: {ticket.createdAt.toLocaleDateString()}</span>
                              <span>{ticket.messages} messages</span>
                              {routingSuggestion && (
                                <span className="text-blue-600 font-medium">
                                  AI suggests: {routingSuggestion.member.name}
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {ticket.lastMessage}
                            </p>

                            {routingSuggestion && (
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Bot className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                      AI Routing Suggestion
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-blue-700 dark:text-blue-300">
                                      Score: {routingSuggestion.score.toFixed(1)}/100
                                    </span>
                                    <Button variant="outline" size="sm">
                                      <Route className="h-4 w-4 mr-1" />
                                      Reassign
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                  Based on expertise match, workload, and performance metrics
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Reply
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'predictive' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Predictive Maintenance</h2>
                <p className="text-slate-600 dark:text-slate-400">AI-powered insights for proactive service management</p>
              </div>

              {/* Maintenance Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                      System Health Alerts
                    </CardTitle>
                    <CardDescription>Potential issues detected by AI analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-orange-900 dark:text-orange-100">High Priority Tickets</h4>
                          <Badge className="bg-red-100 text-red-800">High</Badge>
                        </div>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                          5 high-priority tickets in the last week suggest potential system instability.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm">Schedule Check</Button>
                          <Button variant="outline" size="sm">Review Logs</Button>
                        </div>
                      </div>

                      <div className="p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Team Efficiency</h4>
                          <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                          Average response time of 3.2h suggests potential workflow improvements.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm">Review Workload</Button>
                          <Button variant="outline" size="sm">Training Needed</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2 text-blue-600" />
                      Optimization Opportunities
                    </CardTitle>
                    <CardDescription>Areas for improvement identified by AI</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-100">Auto-routing Efficiency</p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">85% accuracy rate</p>
                        </div>
                        <Button variant="outline" size="sm">Improve</Button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-100">Response Time</p>
                          <p className="text-sm text-green-700 dark:text-green-300">2.8h average</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Good</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-purple-900 dark:text-purple-100">Customer Satisfaction</p>
                          <p className="text-sm text-purple-700 dark:text-purple-300">4.7/5 rating</p>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">Excellent</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Team Analytics</h2>
                <p className="text-slate-600 dark:text-slate-400">Performance metrics and insights for your team</p>
              </div>

              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Resolved</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {teamMembers.reduce((sum, member) => sum + member.stats.ticketsResolved, 0)}
                        </p>
                        <div className="flex items-center text-xs text-green-600 mt-1">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          +12% this month
                        </div>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Response</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {(() => {
                            const total = teamMembers.reduce((sum, member) => {
                              const timeStr = member.stats.avgResponseTime
                              const hours = parseFloat(timeStr.replace('h', ''))
                              return sum + hours
                            }, 0)
                            return (total / teamMembers.length).toFixed(1) + 'h'
                          })()}
                        </p>
                        <div className="flex items-center text-xs text-green-600 mt-1">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          -8% improvement
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
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Satisfaction</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {(() => {
                            const total = teamMembers.reduce((sum, member) => sum + member.stats.satisfaction, 0)
                            return (total / teamMembers.length).toFixed(1) + '/5'
                          })()}
                        </p>
                        <div className="flex items-center text-xs text-green-600 mt-1">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          Above average
                        </div>
                      </div>
                      <Award className="h-8 w-8 text-yellow-600" />
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
                        { day: 'Wed', accuracy: 91, response: 3.1 },
                        { day: 'Thu', accuracy: 96, response: 2.3 },
                        { day: 'Fri', accuracy: 93, response: 2.7 },
                        { day: 'Sat', accuracy: 89, response: 3.2 },
                        { day: 'Sun', accuracy: 95, response: 2.4 }
                      ].map((data) => (
                        <div key={data.day} className="flex flex-col items-center space-y-2">
                          <div className="flex flex-col items-end space-y-1">
                            <div
                              className="bg-blue-500 rounded-t-sm"
                              style={{ height: `${data.accuracy}px`, width: '20px' }}
                            ></div>
                            <div
                              className="bg-green-500 rounded-t-sm"
                              style={{ height: `${data.response * 10}px`, width: '20px' }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-600 dark:text-slate-400">{data.day}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center space-x-6 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Accuracy %</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Response Time</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Team Performance
                    </CardTitle>
                    <CardDescription>Individual member contributions and metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{member.name}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">{member.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{member.stats.ticketsResolved} tickets</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{member.stats.avgResponseTime}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
