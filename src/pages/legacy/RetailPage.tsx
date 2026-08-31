import { useState } from "react"
import { RetailLandingPage } from "./RetailLandingPage"
import { RetailDashboard } from "./RetailDashboard"

export function RetailPage() {
  const [showDashboard, setShowDashboard] = useState(false)

  const handleGetStarted = () => {
    setShowDashboard(true)
  }

  return showDashboard ? <RetailDashboard /> : <RetailLandingPage onGetStarted={handleGetStarted} />
}
