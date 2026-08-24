import { useState } from "react"
import { RestaurantLandingPage } from "./RestaurantLandingPage"
import { RestaurantDashboard } from "./RestaurantDashboard"

export function RestaurantPage() {
  const [showDashboard, setShowDashboard] = useState(false)

  const handleGetStarted = () => {
    setShowDashboard(true)
  }

  return showDashboard ? <RestaurantDashboard /> : <RestaurantLandingPage onGetStarted={handleGetStarted} />
}
