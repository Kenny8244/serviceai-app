import { useState, useEffect, useRef } from "react"
import { Search, Sparkles, X, Loader2 } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent } from "./card"

interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  relevance: number
}

interface AISearchProps {
  placeholder?: string
  onSearch?: (query: string, results: SearchResult[]) => void
  className?: string
}

// Sample search data for different verticals
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

export function AISearch({ placeholder = "Search AI features and tools...", onSearch, className = "" }: AISearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVertical, setSelectedVertical] = useState<string>("retail")
  const searchRef = useRef<HTMLDivElement>(null)

  // Get current vertical from URL or context
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const vertical = urlParams.get("vertical") || "retail"
    setSelectedVertical(vertical)
    console.log("AI Search - Current vertical:", vertical)
  }, [])

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const performSearch = async (searchQuery: string) => {
    console.log("AI Search - Searching for:", searchQuery)
    console.log("AI Search - Current vertical:", selectedVertical)

    if (!searchQuery.trim()) {
      console.log("AI Search - Empty query, clearing results")
      setResults([])
      return
    }

    setIsLoading(true)
    console.log("AI Search - Loading started")

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800))

    const verticalData = searchData[selectedVertical as keyof typeof searchData] || searchData.retail
    console.log("AI Search - Vertical data:", verticalData)

    const filtered = verticalData.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)

    console.log("AI Search - Filtered results:", filtered)
    setResults(filtered)
    setIsLoading(false)
    onSearch?.(searchQuery, filtered)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log("AI Search - Input changed:", value)
    setQuery(value)
    setIsOpen(true)
    performSearch(value)
  }

  const clearSearch = () => {
    setQuery("")
    setResults([])
    setIsOpen(false)
  }

  const handleResultClick = (result: SearchResult) => {
    setQuery(result.title)
    setIsOpen(false)
    // Could trigger navigation or modal here
  }

  return (
    <div ref={searchRef} className={`relative w-full max-w-2xl ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Sparkles className="h-4 w-4 text-blue-400" />
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 text-lg rounded-2xl border border-border/50 bg-background text-foreground backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 placeholder:text-muted-foreground shadow-lg min-h-[3rem]"
        />

        {query && (
          <Button
            onClick={clearSearch}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-hidden z-50 backdrop-blur-glass border-border/50 shadow-xl">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
                <span className="text-muted-foreground">AI is analyzing...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-4 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0 focus:outline-none focus:bg-muted/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-foreground">{result.title}</h4>
                          <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                            {result.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm font-medium text-green-400">
                          {result.relevance}% match
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-muted-foreground mb-2">No results found</div>
                <div className="text-sm text-muted-foreground">
                  Try searching for: analytics, pricing, customer, inventory
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
