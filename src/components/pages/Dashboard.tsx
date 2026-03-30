import { useSearchParams } from "react-router-dom"
import { RetailDashboard } from "./RetailDashboard"
import { RestaurantDashboard } from "./RestaurantDashboard"
import { MarketplaceDashboard } from "./MarketplaceDashboard"
import { EnterpriseDashboard } from "./EnterpriseDashboard"

export function Dashboard() {
  const [searchParams] = useSearchParams()
  const vertical = searchParams.get("vertical") || "retail"

  const renderDashboard = () => {
    switch (vertical) {
      case "retail":
        return <RetailDashboard />
      case "restaurant":
        return <RestaurantDashboard />
      case "store-market":
        return <MarketplaceDashboard />
      case "business":
        return <EnterpriseDashboard />
      default:
        return <RetailDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {renderDashboard()}
    </div>
  )
}

// Export individual dashboards for direct access
export { RetailDashboard } from "./RetailDashboard"
export { RestaurantDashboard } from "./RestaurantDashboard"
export { MarketplaceDashboard } from "./MarketplaceDashboard"
export { EnterpriseDashboard } from "./EnterpriseDashboard"
