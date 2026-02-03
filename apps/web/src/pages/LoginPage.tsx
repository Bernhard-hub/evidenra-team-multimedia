import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

type AuthMode = 'signin' | 'signup' | 'reset'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, isLoading, error, signIn, signUp, signInWithOAuth, resetPassword, clearError, initialize } = useAuthStore()

  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Initialize auth on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  // Clear error when switching modes
  useEffect(() => {
    clearError()
    setMessage(null)
  }, [mode, clearError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (mode === 'reset') {
      const result = await resetPassword(email)
      if (result.success) {
        setMessage({ type: 'success', text: 'Passwort-Reset-Link wurde gesendet.' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Fehler beim Zurücksetzen' })
      }
      return
    }

    if (mode === 'signup') {
      const result = await signUp(email, password, fullName)
      if (result.success) {
        if (result.error) {
          setMessage({ type: 'success', text: result.error })
        } else {
          navigate('/')
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Registrierung fehlgeschlagen' })
      }
      return
    }

    // Sign in
    const result = await signIn(email, password)
    if (result.success) {
      navigate('/')
    } else {
      setMessage({ type: 'error', text: result.error || 'Anmeldung fehlgeschlagen' })
    }
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    const result = await signInWithOAuth(provider)
    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'OAuth fehlgeschlagen' })
    }
  }

  const isDemoMode = !import.meta.env.VITE_SUPABASE_URL

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-surface-100">EVIDENRA Team</h1>
          <p className="text-surface-400 mt-2">Qualitative Forschung für Teams</p>
        </div>

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="mb-4 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm text-center">
            <strong>Demo-Modus:</strong> Beliebige E-Mail/Passwort eingeben
          </div>
        )}

        {/* Form Card */}
        <div className="bg-surface-900 rounded-2xl p-8 shadow-xl border border-surface-800">
          <h2 className="text-xl font-semibold text-surface-100 mb-6">
            {mode === 'signin' && 'Anmelden'}
            {mode === 'signup' && 'Konto erstellen'}
            {mode === 'reset' && 'Passwort zurücksetzen'}
          </h2>

          {/* Messages */}
          {(message || error) && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message?.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {message?.text || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-surface-300 mb-1.5">
                  Vollständiger Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                  placeholder="Max Mustermann"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-300 mb-1.5">
                E-Mail
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                placeholder="name@example.com"
                required
              />
            </div>

            {/* Password (not for reset) */}
            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-surface-300 mb-1.5">
                  Passwort
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            )}

            {/* Forgot password link */}
            {mode === 'signin' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  Passwort vergessen?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Wird geladen...</span>
                </>
              ) : (
                <span>
                  {mode === 'signin' && 'Anmelden'}
                  {mode === 'signup' && 'Registrieren'}
                  {mode === 'reset' && 'Link senden'}
                </span>
              )}
            </button>
          </form>

          {/* OAuth Buttons (only for signin/signup) */}
          {mode !== 'reset' && !isDemoMode && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-800" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-surface-900 text-surface-500">oder</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleOAuth('google')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-surface-700 hover:bg-surface-800 text-surface-300 font-medium transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button
                  onClick={() => handleOAuth('github')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-surface-700 hover:bg-surface-800 text-surface-300 font-medium transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </button>
              </div>
            </>
          )}

          {/* Mode Switch */}
          <div className="mt-6 pt-6 border-t border-surface-800 text-center">
            {mode === 'signin' && (
              <p className="text-surface-400 text-sm">
                Noch kein Konto?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Registrieren
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-surface-400 text-sm">
                Bereits ein Konto?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Anmelden
                </button>
              </p>
            )}
            {mode === 'reset' && (
              <p className="text-surface-400 text-sm">
                <button
                  onClick={() => setMode('signin')}
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Zurück zur Anmeldung
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-surface-500 text-sm mt-8">
          © 2024 EVIDENRA. Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  )
}
