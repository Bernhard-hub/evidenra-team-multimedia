import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setSession, setLoading, setError, error, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // TODO: Implement actual Supabase auth
      // For now, simulate login
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock session for development
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'mock-user-id',
          email: email,
          app_metadata: {},
          user_metadata: { full_name: 'Test User' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
      }

      setSession(mockSession as any)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

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

        {/* Form Card */}
        <div className="bg-surface-900 rounded-2xl p-8 shadow-xl border border-surface-800">
          <h2 className="text-xl font-semibold text-surface-100 mb-6">
            {isSignUp ? 'Konto erstellen' : 'Anmelden'}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500/50"
                  />
                  <span className="text-sm text-surface-400">Angemeldet bleiben</span>
                </label>
                <button type="button" className="text-sm text-primary-400 hover:text-primary-300">
                  Passwort vergessen?
                </button>
              </div>
            )}

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
                <span>{isSignUp ? 'Konto erstellen' : 'Anmelden'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-surface-800 text-center">
            <p className="text-surface-400 text-sm">
              {isSignUp ? 'Bereits ein Konto?' : 'Noch kein Konto?'}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                {isSignUp ? 'Anmelden' : 'Registrieren'}
              </button>
            </p>
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
