import { Router } from 'express'

const router = Router()

// AI Search endpoint - currently returns mock data
router.post('/search', async (req, res) => {
  try {
    const { query, vertical = 'retail' } = req.body

    if (!query || !query.trim()) {
      return res.json({ results: [] })
    }

    // Mock search data (same as frontend for now)
    const searchData = {
      retail: [
        { id: "1", title: "Customer Segmentation Analysis", description: "AI-powered customer behavior analysis and segmentation", category: "Analytics", relevance: 95 },
        { id: "2", title: "Inventory Optimization", description: "Smart inventory management with demand forecasting", category: "Operations", relevance: 90 },
        { id: "3", title: "Dynamic Pricing", description: "Real-time price optimization based on market data", category: "Pricing", relevance: 88 },
        { id: "4", title: "Sales Forecasting", description: "Predictive analytics for sales trends and patterns", category: "Analytics", relevance: 85 },
        { id: "5", title: "Customer Support Automation", description: "AI chatbots for customer service and support", category: "Customer Service", relevance: 82 },
      ],
      restaurant: [
        { id: "1", title: "Menu Optimization", description: "Data-driven menu analysis and recommendation engine", category: "Menu", relevance: 95 },
        { id: "2", title: "Order Management", description: "Intelligent order processing and kitchen workflow", category: "Operations", relevance: 90 },
        { id: "3", title: "Staff Scheduling", description: "AI-powered staff scheduling based on demand patterns", category: "Management", relevance: 88 },
        { id: "4", title: "Customer Feedback Analysis", description: "Sentiment analysis of customer reviews and feedback", category: "Analytics", relevance: 85 },
        { id: "5", title: "Food Cost Optimization", description: "Ingredient cost analysis and waste reduction", category: "Cost Control", relevance: 82 },
      ],
      marketplace: [
        { id: "1", title: "Vendor Performance Analytics", description: "Comprehensive vendor scoring and performance tracking", category: "Vendor Management", relevance: 95 },
        { id: "2", title: "Price Intelligence", description: "Competitive pricing analysis and optimization", category: "Pricing", relevance: 90 },
        { id: "3", title: "Customer Segmentation", description: "Advanced customer behavior analysis and targeting", category: "Analytics", relevance: 88 },
        { id: "4", title: "Product Recommendation", description: "AI-powered product recommendation engine", category: "Personalization", relevance: 85 },
        { id: "5", title: "Market Trend Analysis", description: "Real-time market trend identification and insights", category: "Market Intelligence", relevance: 82 },
      ],
      enterprise: [
        { id: "1", title: "Workflow Automation", description: "Custom workflow design and automation solutions", category: "Automation", relevance: 95 },
        { id: "2", title: "Advanced Analytics", description: "Enterprise-grade data analysis and reporting", category: "Analytics", relevance: 90 },
        { id: "3", title: "Security Monitoring", description: "AI-powered threat detection and security management", category: "Security", relevance: 88 },
        { id: "4", title: "Team Collaboration", description: "Intelligent team management and collaboration tools", category: "Management", relevance: 85 },
        { id: "5", title: "Custom AI Solutions", description: "Tailored AI applications for specific business needs", category: "Solutions", relevance: 82 },
      ],
    }

    const verticalData = searchData[vertical as keyof typeof searchData] || searchData.retail

    // Filter results based on query
    const filtered = verticalData.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5)

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 300))

    res.json({
      query,
      vertical,
      results: filtered,
      total: filtered.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Search error:', error)
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while processing your search'
    })
  }
})

export default router
