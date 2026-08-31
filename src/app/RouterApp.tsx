"use client"

import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"
import {
  AuthPage,
  VerticalSelectionPage,
  TestAISearchPage,
  NotFoundPage,
  OnboardingConfirmation,
  Dashboard,
  Settings,
  AIHub,
  Analytics,
  TeamManagement,
  AssetsPage,
} from "@/pages"
import { AppLayout } from "@/components/layout/AppLayout"
import { ThemeProvider } from "@/lib/theme"
import { getSelectedVertical, setSelectedVertical, hasSelectedVertical } from "@/lib/verticalStorage"

function VerticalRoute() {
  const navigate = useNavigate()
  return (
    <VerticalSelectionPage
      onBack={() => navigate("/auth", { replace: true })}
      onVerticalSelect={(verticalId: string) => {
        setSelectedVertical(verticalId)
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

function OnboardingRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const verticalId = getSelectedVertical(
    (location.state as { verticalId?: string } | null)?.verticalId
  )

  return (
    <OnboardingConfirmation
      onComplete={() => navigate("/dashboard", { state: { verticalId }, replace: true })}
    />
  )
}

function SavedVerticalRedirect() {
  return (
    <Navigate
      to={hasSelectedVertical() ? "/dashboard" : "/vertical-selection"}
      replace
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
          <Route path="/onboarding" element={<OnboardingRoute />} />
          <Route path="/dashboard-old" element={<Navigate to="/dashboard" replace />} />
          <Route path="/retail" element={<SavedVerticalRedirect />} />
          <Route path="/restaurant" element={<SavedVerticalRedirect />} />
          <Route path="/marketplace" element={<SavedVerticalRedirect />} />
          <Route path="/enterprise" element={<SavedVerticalRedirect />} />

          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/ai-hub" element={<AIHub />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/test-ai-search" element={<TestAISearchPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
