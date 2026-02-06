import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useSubscriptionStore, useNeedsOnboarding } from '@/stores/subscriptionStore'
import { Suspense, lazy, useEffect, useState } from 'react'
import { MethodologyProvider, FloatingGuideButton } from '@/contexts/MethodologyContext'
import OnboardingModal from '@/components/OnboardingModal'
import { PaywallOverlay } from '@/components/SubscriptionBanner'
import { UserWatermark } from '@/components/UserWatermark'
import { registerDevice } from '@/hooks/useDeviceFingerprint'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ProjectPage = lazy(() => import('@/pages/ProjectPage'))
const DocumentDetailPage = lazy(() => import('@/pages/DocumentDetailPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const TeamPage = lazy(() => import('@/pages/TeamPage'))
const PricingPage = lazy(() => import('@/pages/PricingPage'))
const SuccessPage = lazy(() => import('@/pages/SuccessPage'))
const AcceptInvitePage = lazy(() => import('@/pages/AcceptInvitePage'))
const QuestionnairePage = lazy(() => import('@/pages/QuestionnairePage'))

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

  // Register device for fingerprinting (Phase 2: Account-Sharing Detection)
  useEffect(() => {
    if (user?.id) {
      registerDevice(user.id).catch(() => {
        // Silently fail - fingerprinting is optional
      })
    }
  }, [user?.id])

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

      {/* Phase 2: Unsichtbares Wasserzeichen mit User-ID */}
      <UserWatermark />

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
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL first
        const params = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))

        const errorParam = params.get('error') || hashParams.get('error')
        const errorDescription = params.get('error_description') || hashParams.get('error_description')

        if (errorParam) {
          setError(errorDescription || errorParam)
          setIsProcessing(false)
          return
        }

        // Import supabase directly to handle the callback
        const { supabase } = await import('@/lib/supabase')

        // Supabase should automatically detect and process the tokens from URL
        // Wait a moment for Supabase to process
        await new Promise(resolve => setTimeout(resolve, 500))

        // Check if we have a session now
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          setError(sessionError.message)
          setIsProcessing(false)
          return
        }

        if (session) {
          // Success! Redirect to dashboard
          window.location.href = '/'
        } else {
          // No session - try to exchange code if present
          const code = params.get('code')
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            if (exchangeError) {
              console.error('Code exchange error:', exchangeError)
              setError(exchangeError.message)
              setIsProcessing(false)
              return
            }
            // Success after code exchange
            window.location.href = '/'
          } else {
            // No session and no code - redirect to login
            window.location.href = '/login'
          }
        }
      } catch (err) {
        console.error('Callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [])

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

  if (isProcessing) {
    return <LoadingSpinner />
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
          <Route path="/invite/:token" element={<AcceptInvitePage />} />

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
          <Route
            path="/questionnaire"
            element={
              <ProtectedRoute>
                <QuestionnairePage />
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
