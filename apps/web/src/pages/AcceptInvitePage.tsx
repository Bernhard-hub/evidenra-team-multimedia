import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { invitationsApi } from '@/lib/api'

interface InvitationData {
  id: string
  email: string
  role: string
  inviter_name: string | null
  expires_at: string
  organization: {
    id: string
    name: string
    slug: string
  }
}

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, isInitialized } = useAuthStore()
  const { reinitialize } = useSubscriptionStore()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Ungültiger Einladungslink')
      setIsLoading(false)
      return
    }

    const fetchInvitation = async () => {
      try {
        const { data, error } = await invitationsApi.getByToken(token)
        if (error) {
          throw new Error(error.message || 'Einladung nicht gefunden')
        }
        setInvitation(data as InvitationData)
      } catch (err: any) {
        setError(err.message || 'Die Einladung ist ungültig oder abgelaufen')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitation()
  }, [token])

  const handleAccept = async () => {
    if (!token) return

    setIsAccepting(true)
    setError(null)

    try {
      const { error } = await invitationsApi.accept(token)
      if (error) {
        throw new Error(error.message || 'Fehler beim Annehmen der Einladung')
      }

      setSuccess(true)

      // Reinitialize subscription to load the new organization
      if (user) {
        await reinitialize(user.id)
      }

      // Redirect to dashboard after a moment
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Annehmen der Einladung')
      setIsAccepting(false)
    }
  }

  const roleLabels: Record<string, string> = {
    owner: 'Inhaber',
    admin: 'Admin',
    editor: 'Bearbeiter',
    viewer: 'Betrachter',
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-400">Einladung wird geladen...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-900 rounded-2xl border border-surface-800 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-surface-100 mb-2">Einladung ungültig</h1>
            <p className="text-surface-400 mb-6">{error}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              Zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-900 rounded-2xl border border-surface-800 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-surface-100 mb-2">Willkommen im Team!</h1>
            <p className="text-surface-400 mb-4">
              Sie wurden erfolgreich zu <strong className="text-primary-400">{invitation?.organization.name}</strong> hinzugefügt.
            </p>
            <p className="text-surface-500 text-sm">Sie werden zum Dashboard weitergeleitet...</p>
          </div>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user && isInitialized) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-900 rounded-2xl border border-surface-800 overflow-hidden">
            {/* Header with gradient */}
            <div className="h-2 bg-gradient-to-r from-primary-500 via-violet-500 to-primary-500" />

            <div className="p-8">
              {/* Logo */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="text-2xl font-bold text-surface-100">EVIDENRA</span>
              </div>

              {/* Invitation Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>

              <h1 className="text-xl font-bold text-surface-100 text-center mb-2">Team-Einladung</h1>
              <p className="text-surface-400 text-center mb-6">
                {invitation?.inviter_name && (
                  <><strong className="text-surface-200">{invitation.inviter_name}</strong> lädt Sie ein, dem Team </>
                )}
                {!invitation?.inviter_name && <>Sie wurden eingeladen, dem Team </>}
                <strong className="text-primary-400">{invitation?.organization.name}</strong> beizutreten.
              </p>

              {/* Role Badge */}
              <div className="flex justify-center mb-6">
                <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  Rolle: {roleLabels[invitation?.role || 'editor']}
                </span>
              </div>

              <p className="text-center text-surface-400 mb-6">
                Um die Einladung anzunehmen, melden Sie sich bitte an oder erstellen Sie ein Konto.
              </p>

              <Link
                to={`/login?redirect=/invite/${token}`}
                className="block w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white text-center rounded-lg font-medium transition-colors"
              >
                Anmelden oder Registrieren
              </Link>

              <p className="text-center text-surface-500 text-sm mt-6">
                Einladung gültig bis: {new Date(invitation?.expires_at || '').toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Logged in - show accept button
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-900 rounded-2xl border border-surface-800 overflow-hidden">
          {/* Header with gradient */}
          <div className="h-2 bg-gradient-to-r from-primary-500 via-violet-500 to-primary-500" />

          <div className="p-8">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-2xl font-bold text-surface-100">EVIDENRA</span>
            </div>

            {/* Invitation Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-500/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-surface-100 text-center mb-2">Team-Einladung</h1>
            <p className="text-surface-400 text-center mb-6">
              {invitation?.inviter_name && (
                <><strong className="text-surface-200">{invitation.inviter_name}</strong> lädt Sie ein, dem Team </>
              )}
              {!invitation?.inviter_name && <>Sie wurden eingeladen, dem Team </>}
              <strong className="text-primary-400">{invitation?.organization.name}</strong> beizutreten.
            </p>

            {/* Role Badge */}
            <div className="flex justify-center mb-6">
              <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                Rolle: {roleLabels[invitation?.role || 'editor']}
              </span>
            </div>

            {/* Current user info */}
            <div className="bg-surface-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-surface-400 mb-1">Angemeldet als:</p>
              <p className="text-surface-200 font-medium">{user?.email}</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Link
                to="/"
                className="flex-1 py-3 px-4 border border-surface-700 text-surface-300 text-center rounded-lg font-medium hover:bg-surface-800 transition-colors"
              >
                Ablehnen
              </Link>
              <button
                onClick={handleAccept}
                disabled={isAccepting}
                className="flex-1 py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white text-center rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAccepting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Wird angenommen...
                  </>
                ) : (
                  'Einladung annehmen'
                )}
              </button>
            </div>

            <p className="text-center text-surface-500 text-sm mt-6">
              Einladung gültig bis: {new Date(invitation?.expires_at || '').toLocaleDateString('de-DE')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
