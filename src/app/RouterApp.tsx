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
import {
  getSelectedVertical,
  setSelectedVertical,
  hasSelectedVertical,
  getStoredVerticalForUser,
  clearSelectedVertical,
} from "@/lib/verticalStorage"
import { apiService, type AuthResponse } from "@/services/api"

async function persistVertical(verticalId: string) {
  try {
    await apiService.selectVertical(verticalId)
  } catch (error) {
    console.error("Failed to persist vertical selection:", error)
  }
}

function VerticalRoute() {
  const navigate = useNavigate()
  return (
    <VerticalSelectionPage
      onBack={() => navigate("/auth", { replace: true })}
      onVerticalSelect={async (verticalId: string) => {
        setSelectedVertical(verticalId, apiService.getAuthUserId() || undefined)
        await persistVertical(verticalId)
        navigate("/onboarding", { state: { verticalId }, replace: true })
      }}
    />
  )
}

function AuthRoute() {
  const navigate = useNavigate()

  const continueAfterAuth = async (response: AuthResponse, options?: { isNewAccount?: boolean }) => {
    const userId = response.user.id

    if (options?.isNewAccount) {
      clearSelectedVertical()
      navigate("/vertical-selection", { replace: true })
      return
    }

    let verticalId = response.selectedVertical?.verticalId

    if (!verticalId) {
      try {
        verticalId = (await apiService.getSelectedVertical())?.verticalId
      } catch (error) {
        console.error("Failed to load saved vertical:", error)
      }
    }

    if (!verticalId) {
      verticalId = getStoredVerticalForUser(userId) || undefined
      if (verticalId) {
        await persistVertical(verticalId)
      }
    }

    if (verticalId) {
      setSelectedVertical(verticalId, userId)
      navigate("/dashboard", { replace: true })
      return
    }

    clearSelectedVertical()
    navigate("/vertical-selection", { replace: true })
  }

  return <AuthPage onAuthSuccess={continueAfterAuth} />
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
          <Route path="/" element={<SavedVerticalRedirect />} />
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
