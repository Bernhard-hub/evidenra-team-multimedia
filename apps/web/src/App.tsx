import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useSubscriptionStore, useNeedsOnboarding } from '@/stores/subscriptionStore'
import { Suspense, lazy, useEffect, useState } from 'react'
import { MethodologyProvider, FloatingGuideButton } from '@/contexts/MethodologyContext'
import OnboardingModal from '@/components/OnboardingModal'
import { PaywallOverlay } from '@/components/SubscriptionBanner'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ProjectPage = lazy(() => import('@/pages/ProjectPage'))
const DocumentDetailPage = lazy(() => import('@/pages/DocumentDetailPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const TeamPage = lazy(() => import('@/pages/TeamPage'))
const PricingPage = lazy(() => import('@/pages/PricingPage'))
const SuccessPage = lazy(() => import('@/pages/SuccessPage'))

// Loading spinner
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      <span className="text-surface-400 text-sm">Laden...</span>
    </div>
  </div>
)

// Protected route wrapper with subscription check
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: authLoading, isInitialized: authInitialized } = useAuthStore()
  const { initialize: initSubscription, isLoading: subLoading, isInitialized: subInitialized } = useSubscriptionStore()
  const needsOnboarding = useNeedsOnboarding()
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Initialize subscription when user is available
  useEffect(() => {
    if (user && authInitialized && !subInitialized) {
      initSubscription(user.id)
    }
  }, [user, authInitialized, subInitialized, initSubscription])

  // Show onboarding when needed
  useEffect(() => {
    if (needsOnboarding && !showOnboarding) {
      setShowOnboarding(true)
    }
  }, [needsOnboarding, showOnboarding])

  // Show loading while initializing auth
  if (!authInitialized || authLoading) {
    return <LoadingSpinner />
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Show loading while initializing subscription
  if (!subInitialized || subLoading) {
    return <LoadingSpinner />
  }

  return (
    <>
      {children}

      {/* Onboarding Modal - for new users without organization */}
      <OnboardingModal
        isOpen={showOnboarding && needsOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      {/* Paywall Overlay - for expired subscriptions */}
      <PaywallOverlay />
    </>
  )
}

// Auth callback handler for OAuth
const AuthCallback = () => {
  const { initialize, user, isInitialized } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Re-initialize to pick up the new session from OAuth callback
    initialize()
  }, [initialize])

  // Redirect to dashboard once authenticated
  useEffect(() => {
    if (isInitialized) {
      if (user) {
        // Successfully authenticated - redirect to dashboard
        window.location.href = '/'
      } else {
        // Check for error in URL
        const params = new URLSearchParams(window.location.search)
        const errorParam = params.get('error')
        const errorDescription = params.get('error_description')
        if (errorParam) {
          setError(errorDescription || errorParam)
        } else {
          // No user and no error - redirect to login
          window.location.href = '/login'
        }
      }
    }
  }, [isInitialized, user])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="bg-surface-900 p-8 rounded-2xl border border-surface-800 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-surface-100 mb-2">Anmeldung fehlgeschlagen</h2>
          <p className="text-surface-400 mb-6">{error}</p>
          <a href="/login" className="inline-block px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium">
            Zurück zum Login
          </a>
        </div>
      </div>
    )
  }

  return <LoadingSpinner />
}

function App() {
  const { initialize, isInitialized } = useAuthStore()

  // Initialize auth on app mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Show loading while auth is initializing
  if (!isInitialized) {
    return <LoadingSpinner />
  }

  return (
    <MethodologyProvider>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/success" element={<SuccessPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId"
            element={
              <ProtectedRoute>
                <ProjectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId/document/:documentId"
            element={
              <ProtectedRoute>
                <DocumentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <TeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global floating guide button - shows when guide is minimized */}
        <FloatingGuideButton />
      </Suspense>
    </MethodologyProvider>
  )
}

export default App
