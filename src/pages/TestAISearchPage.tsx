import { AISearch } from "@/components/ai/AISearch"
import { PageShell } from "@/components/layout/PageShell"

export function TestAISearchPage() {
  return (
    <PageShell title="AI Search Test Page">
      <div className="max-w-4xl space-y-8">
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
    </PageShell>
  )
}
