import { AISearch } from "../ui/AISearch"
import { BackButton } from "../ui/BackButton"

export function TestAISearchPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton to="/vertical-selection" className="text-muted-foreground hover:text-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-8">AI Search Test Page</h1>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Basic Search Test</h2>
            <AISearch placeholder="Try searching for: analytics, pricing, customer, inventory..." />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Vertical-Specific Search</h2>
            <p className="text-muted-foreground mb-4">Current URL: {window.location.href}</p>
            <AISearch placeholder="Search based on current page vertical..." />
          </div>
        </div>
      </div>
    </div>
  )
}
