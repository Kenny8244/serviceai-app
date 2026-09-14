"use client"

import { useEffect, useSyncExternalStore } from "react"
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom"
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
  AssetsImportPage,
  AssetsManagePage,
  AssetDetailPage,
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
import { getActiveWorkspaceId } from "@/lib/workspaceStorage"
import { getAuthSessionVersion, subscribeAuthSession } from "@/lib/authSession"
import { apiService, type AuthResponse } from "@/services/api"

function useIsAuthenticated() {
  useSyncExternalStore(subscribeAuthSession, getAuthSessionVersion, () => 0)
  return apiService.isAuthenticated()
}

async function persistVertical(verticalId: string) {
  try {
    await apiService.selectVertical(verticalId)
  } catch (error) {
    console.error("Failed to persist vertical selection:", error)
  }
}

async function hydratePreferences(preferredWorkspaceId?: string | null) {
  try {
    await apiService.hydrateWorkspacePreferences(preferredWorkspaceId)
  } catch (error) {
    console.error("Failed to hydrate workspace preferences:", error)
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
        if (!apiService.isAuthenticated()) return
        navigate("/onboarding", { state: { verticalId }, replace: true })
      }}
    />
  )
}

function AuthRoute() {
  const navigate = useNavigate()
  const isAuthenticated = useIsAuthenticated()

  const continueAfterAuth = async (
    response: AuthResponse,
    options?: { isNewAccount?: boolean; forceVerticalSelection?: boolean }
  ) => {
    const userId = response.user.id
    await hydratePreferences(response.workspaceId)

    // Demo (and new signups) always pick a vertical — that's the point of the demo flow.
    if (options?.forceVerticalSelection || options?.isNewAccount) {
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

    if (!apiService.isAuthenticated()) {
      return
    }

    if (verticalId) {
      setSelectedVertical(verticalId, userId)
      navigate("/dashboard", { replace: true })
      return
    }

    clearSelectedVertical()
    navigate("/vertical-selection", { replace: true })
  }

  if (isAuthenticated) {
    return <SavedSessionRedirect />
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
      onComplete={(nextVerticalId) =>
        navigate("/dashboard", { state: { verticalId: nextVerticalId || verticalId }, replace: true })
      }
    />
  )
}

function SavedSessionRedirect() {
  const isAuthenticated = useIsAuthenticated()

  useEffect(() => {
    if (!isAuthenticated) return
    const userId = apiService.getAuthUserId()
    const preferred = getActiveWorkspaceId(userId)
    void hydratePreferences(preferred)
  }, [isAuthenticated])

  return (
    <Navigate
      to={hasSelectedVertical() ? "/dashboard" : "/vertical-selection"}
      replace
    />
  )
}

function RequireAuth() {
  const isAuthenticated = useIsAuthenticated()

  useEffect(() => {
    if (!isAuthenticated) return
    const userId = apiService.getAuthUserId()
    void hydratePreferences(getActiveWorkspaceId(userId))
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }
  return <Outlet />
}

export default function RouterApp() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthRoute />} />

          <Route element={<RequireAuth />}>
            <Route path="/" element={<SavedSessionRedirect />} />
            <Route path="/vertical-selection" element={<VerticalRoute />} />
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route path="/dashboard-old" element={<Navigate to="/dashboard" replace />} />
            <Route path="/retail" element={<SavedSessionRedirect />} />
            <Route path="/restaurant" element={<SavedSessionRedirect />} />
            <Route path="/marketplace" element={<SavedSessionRedirect />} />
            <Route path="/enterprise" element={<SavedSessionRedirect />} />

            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/assets/import" element={<AssetsImportPage />} />
              <Route path="/assets/manage" element={<AssetsManagePage />} />
              <Route path="/assets/:id" element={<AssetDetailPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/ai-hub" element={<AIHub />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/team" element={<TeamManagement />} />
              <Route path="/test-ai-search" element={<TestAISearchPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
