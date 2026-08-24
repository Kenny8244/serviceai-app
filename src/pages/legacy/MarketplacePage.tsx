import { useState } from "react"
import { MarketplaceLandingPage } from "./MarketplaceLandingPage"
import { MarketplaceDashboard } from "./MarketplaceDashboard"

export function MarketplacePage() {
  const [showDashboard, setShowDashboard] = useState(false)

  const handleGetStarted = () => {
    setShowDashboard(true)
  }

  return showDashboard ? <MarketplaceDashboard /> : <MarketplaceLandingPage onGetStarted={handleGetStarted} />
}
