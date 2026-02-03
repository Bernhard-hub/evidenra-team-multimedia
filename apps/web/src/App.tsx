import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Suspense, lazy, useEffect } from 'react'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ProjectPage = lazy(() => import('@/pages/ProjectPage'))
const DocumentDetailPage = lazy(() => import('@/pages/DocumentDetailPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const TeamPage = lazy(() => import('@/pages/TeamPage'))

// Loading spinner
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      <span className="text-surface-400 text-sm">Laden...</span>
    </div>
  </div>
)

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isInitialized } = useAuthStore()

  // Show loading while initializing or loading
  if (!isInitialized || isLoading) {
    return <LoadingSpinner />
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Auth callback handler for OAuth
const AuthCallback = () => {
  const { initialize } = useAuthStore()

  useEffect(() => {
    // Re-initialize to pick up the new session from OAuth callback
    initialize()
  }, [initialize])

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
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

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
    </Suspense>
  )
}

export default App
