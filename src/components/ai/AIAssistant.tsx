import { useState, useRef, useEffect } from "react"
import { MessageCircle, Send, X, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIAssistantProps {
  vertical: string
  context?: "landing" | "dashboard"
  className?: string
}

// Vertical-specific knowledge base
const verticalKnowledge = {
  retail: {
    welcome: "Hi! I'm your Retail AI Assistant. I'm here to help you navigate your dashboard, create service requests, manage inventory, and analyze your data. What would you like to know?",
    dashboardWelcome: "Welcome to your Retail Dashboard! I can help you understand your metrics, create service requests, manage inventory, or analyze your performance data. What would you like assistance with?",
    responses: {
      "service request": "You can create service requests for equipment maintenance, store issues, or vendor problems. Go to 'Service Requests' in your dashboard to submit a new request with details, priority level, and attachments.",
      "create service request": "To create a service request: 1) Click 'New Request' in the Service Requests section, 2) Select category (Maintenance, Issue, Enhancement), 3) Add description, location, and urgency level, 4) Attach photos if needed, 5) Submit for processing.",
      "inventory": "Your inventory dashboard shows real-time stock levels, product performance, and supplier data. You can set reorder points, track trends, and generate reports.",
      "asset review": "Review your store assets including POS systems, equipment, and fixtures. Track maintenance schedules, depreciation, and get replacement recommendations.",
      "data import": "Import your existing inventory data, customer records, or sales data through CSV upload or API integration. The system will validate and categorize your data automatically.",
      "service requests": "View all active and completed service requests in the dashboard. Filter by status, priority, or category. Track resolution progress and communicate with service teams.",
      "inventory review": "Analyze inventory performance with metrics showing turnover rates, stock levels, and profitability. Get alerts for low stock or expiring items.",
      "dashboard": "Your dashboard shows key metrics like sales performance, customer insights, inventory status, and service requests. Each section is interactive - click on any metric for detailed analysis.",
      "metrics": "The metrics cards show real-time data on sales, customers, inventory, and revenue. Click on any card to drill down into specific analytics and trends.",
      "help": "I can help you with: dashboard navigation, service request creation, inventory management, asset reviews, data imports, analytics, or troubleshooting. What specific task do you need assistance with?",
      "default": "I can assist with dashboard navigation, service request workflows, inventory optimization, asset management, and data analysis. What specific area would you like to explore?"
    }
  },
  restaurant: {
    welcome: "Hello! I'm your Restaurant AI Assistant. I can guide you through service request creation, inventory management, equipment reviews, and analyzing your operational data. How can I help?",
    dashboardWelcome: "Welcome to your Restaurant Dashboard! I can help you understand your operational metrics, create service requests, manage inventory, or analyze your performance data. What would you like assistance with?",
    responses: {
      "service request": "Create service requests for kitchen equipment repairs, facility maintenance, or supplier issues. Use the Service Requests module to submit detailed requests with photos and urgency levels.",
      "create service request": "To create a service request: 1) Navigate to Service Requests, 2) Click 'New Request', 3) Choose type (Equipment, Facility, Supplier), 4) Describe the issue with details, 5) Set priority and attach photos, 6) Submit for immediate processing.",
      "inventory": "Track food inventory, supplies, and equipment with real-time monitoring. Set par levels, monitor expiration dates, and get automatic reorder suggestions based on usage patterns.",
      "asset review": "Review kitchen equipment, furniture, and facility assets. Track maintenance schedules, depreciation, and get recommendations for equipment upgrades or replacements.",
      "data import": "Import menu data, supplier information, sales records, or customer feedback through secure CSV upload or direct API connections. Data is validated and categorized automatically.",
      "service requests": "Monitor all service requests from kitchen repairs to facility maintenance. Track status, assigned technicians, and resolution timelines in real-time.",
      "inventory review": "Analyze inventory turnover, food cost percentages, and waste patterns. Get insights on menu profitability and supplier performance metrics.",
      "dashboard": "Your dashboard shows key operational metrics like order volume, customer satisfaction, inventory levels, and service requests. Click on metrics for detailed breakdowns.",
      "metrics": "Monitor real-time metrics on orders, revenue, customer feedback, and operational efficiency. Each metric card provides drill-down capabilities for deeper analysis.",
      "help": "I can help you with: dashboard navigation, service request management, inventory control, equipment reviews, data analysis, menu optimization, or operational troubleshooting. What do you need assistance with?",
      "default": "I can guide you through restaurant operations including service requests, inventory management, equipment maintenance, and data-driven decision making. What would you like to know?"
    }
  },
  marketplace: {
    welcome: "Hi there! I'm your Marketplace AI Assistant. I can help you with service request creation, vendor management, inventory oversight, and analyzing platform data. What can I assist you with?",
    dashboardWelcome: "Welcome to your Marketplace Dashboard! I can help you understand your platform metrics, create service requests, manage vendors, or analyze your performance data. What would you like assistance with?",
    responses: {
      "service request": "Create service requests for platform issues, vendor disputes, or technical problems. Submit requests with detailed descriptions, screenshots, and urgency levels for quick resolution.",
      "create service request": "To create a service request: 1) Go to Service Center, 2) Select 'New Request', 3) Choose category (Platform, Vendor, Technical), 4) Provide detailed description, 5) Attach evidence/screenshots, 6) Set priority and submit.",
      "inventory": "Monitor vendor inventory, product listings, and stock levels across your marketplace. Track product performance, identify trending items, and manage vendor relationships.",
      "asset review": "Review platform assets including servers, software licenses, and vendor contracts. Monitor system performance, maintenance schedules, and renewal requirements.",
      "data import": "Import vendor data, product catalogs, transaction records, or customer data through secure APIs or bulk upload features. Data validation ensures accuracy and completeness.",
      "service requests": "Track all platform service requests from technical issues to vendor disputes. Monitor resolution progress, assigned teams, and SLA compliance.",
      "inventory review": "Analyze product performance, vendor metrics, and marketplace trends. Get insights on top-performing categories, vendor reliability, and inventory turnover rates.",
      "dashboard": "Your dashboard displays key marketplace metrics including vendor performance, customer activity, transaction volume, and service requests. Click metrics for detailed analytics.",
      "metrics": "Monitor real-time metrics on vendor performance, customer engagement, transaction volumes, and platform health. Each metric provides drill-down analysis capabilities.",
      "help": "I can help you with: dashboard navigation, service request workflows, vendor management, inventory analytics, data imports, platform optimization, or marketplace operations. What specific area interests you?",
      "default": "I can assist with marketplace operations including service request management, vendor analytics, inventory oversight, and data-driven platform optimization. What would you like to explore?"
    }
  },
  enterprise: {
    welcome: "Hello! I'm your Enterprise AI Assistant. I can help you with service request creation, asset management, inventory control, and analyzing your enterprise data. What can I assist you with today?",
    dashboardWelcome: "Welcome to your Enterprise Dashboard! I can help you understand your operational metrics, create service requests, manage assets, or analyze your enterprise data. What would you like assistance with?",
    responses: {
      "service request": "Create comprehensive service requests for IT support, facility maintenance, equipment repairs, or vendor issues. Include detailed specifications, SLAs, and escalation procedures.",
      "create service request": "To create a service request: 1) Access Service Management portal, 2) Select 'New Request', 3) Choose category and subcategory, 4) Provide technical details and requirements, 5) Set SLA requirements, 6) Attach documentation, 7) Submit with approval workflow.",
      "inventory": "Manage enterprise-wide inventory including IT assets, equipment, software licenses, and supplies. Track locations, depreciation, and lifecycle management across all departments.",
      "asset review": "Conduct comprehensive asset reviews including depreciation analysis, maintenance schedules, compliance tracking, and replacement planning for all enterprise assets.",
      "data import": "Import enterprise data from various sources including ERP systems, databases, spreadsheets, and external APIs. Advanced validation and mapping ensure data integrity.",
      "service requests": "Monitor enterprise service requests across IT, facilities, HR, and operations. Track SLAs, escalation paths, and resolution metrics with detailed reporting.",
      "inventory review": "Analyze inventory performance across departments, identify optimization opportunities, track compliance requirements, and generate comprehensive management reports.",
      "dashboard": "Your dashboard provides enterprise-wide visibility into operations, assets, compliance, and performance metrics. Click on any section for detailed departmental breakdowns.",
      "metrics": "Monitor enterprise KPIs including operational efficiency, asset utilization, compliance status, and departmental performance. Each metric offers drill-down analysis.",
      "help": "I can help you with: dashboard navigation, service request workflows, asset management, inventory control, data integration, compliance tracking, or enterprise operations. What specific area do you need assistance with?",
      "default": "I can guide you through enterprise operations including service request management, asset lifecycle management, inventory optimization, and data-driven decision making. What would you like to know?"
    }
  }
}

export function AIAssistant({ vertical, context = "landing", className = "" }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const knowledge = verticalKnowledge[vertical as keyof typeof verticalKnowledge] || verticalKnowledge.retail

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        type: "assistant",
        content: context === "dashboard" ? knowledge.dashboardWelcome || knowledge.welcome : knowledge.welcome,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, knowledge.welcome, knowledge.dashboardWelcome, context])

  // Listen for custom event to open AI assistant
  useEffect(() => {
    const handleOpenAIAssistant = () => {
      setIsOpen(true)
    }

    window.addEventListener('openAIAssistant', handleOpenAIAssistant)

    return () => {
      window.removeEventListener('openAIAssistant', handleOpenAIAssistant)
    }
  }, [])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const getAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()

    // Check for specific keywords
    for (const [keyword, response] of Object.entries(knowledge.responses)) {
      if (message.includes(keyword) && keyword !== "default" && keyword !== "help") {
        return response
      }
    }

    // Check for help request
    if (message.includes("help")) {
      return knowledge.responses.help
    }

    // Default response
    return knowledge.responses.default
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: getAIResponse(inputMessage),
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1000 + Math.random() * 1500) // 1-2.5 second delay
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 button-glow"
          aria-label="Open AI Assistant"
          data-ai-assistant
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className="w-96 h-[600px] backdrop-blur-glass border-border/50 shadow-2xl flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{vertical.charAt(0).toUpperCase() + vertical.slice(1)} AI Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">Ask me anything about {vertical} AI</p>
            </div>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-start space-x-3 max-w-[80%] ${
                    message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {message.type === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.type === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground/70"
                    }`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-3 max-w-[80%]">
                  <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted/50 text-muted-foreground rounded-2xl px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border/30 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about service requests, inventory, data imports, or asset reviews..."
                className="flex-1 h-10 px-3 rounded-lg border border-border/50 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="h-10 w-10 p-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Quick questions:</span>
              {["service request", "inventory", "asset review"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputMessage(suggestion)}
                  className="text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
