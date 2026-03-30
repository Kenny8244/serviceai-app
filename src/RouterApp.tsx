"use client"

import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"
import { AuthPage, VerticalSelectionPage, RetailPage, RestaurantPage, MarketplacePage, EnterprisePage, TestAISearchPage } from "./components/pages"
import { OnboardingConfirmation } from "./components/SimpleOnboarding"
import { Dashboard } from "./components/Dashboard"
import { Settings } from "./components/Settings"
import { AIHub } from "./components/AIHub"
import { Analytics } from "./components/Analytics"
import { TeamManagement } from "./components/TeamManagement"
import AssetsPage from "./pages/AssetsPage"
import { ThemeProvider } from "./lib/theme"

function VerticalRoute() {
  const navigate = useNavigate()
  return (
    <VerticalSelectionPage
      onBack={() => navigate("/auth", { replace: true })}
      onVerticalSelect={(verticalId: string) => {
        // Navigate to onboarding with the selected vertical
        navigate("/onboarding", { state: { verticalId }, replace: true })
      }}
    />
  )
}

function AuthRoute() {
  const navigate = useNavigate()
  return (
    <AuthPage onAuthSuccess={() => navigate("/vertical-selection", { replace: true })} />
  )
}

// Wrapper to inject navigation handlers for OnboardingPage
function OnboardingRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const verticalId = location.state?.verticalId || 'retail'

  return (
    <OnboardingConfirmation
      onComplete={() => navigate("/dashboard", { state: { verticalId }, replace: true })}
    />
  )
}

export default function RouterApp() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/vertical-selection" replace />} />
          <Route path="/auth" element={<AuthRoute />} />
          <Route path="/vertical-selection" element={<VerticalRoute />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/onboarding" element={<OnboardingRoute />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ai-hub" element={<AIHub />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/team" element={<TeamManagement />} />

          {/* Individual Vertical Routes */}
          <Route path="/retail" element={<RetailPage />} />
          <Route path="/restaurant" element={<RestaurantPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/enterprise" element={<EnterprisePage />} />

          {/* Test Route */}
          <Route path="/test-ai-search" element={<TestAISearchPage />} />

          {/* Keep generic dashboard route for backward compatibility */}
          <Route path="/dashboard-old" element={<Navigate to="/dashboard" replace />} />

          <Route path="*" element={<Navigate to="/vertical-selection" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
