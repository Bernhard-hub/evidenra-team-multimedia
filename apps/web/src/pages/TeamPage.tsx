import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { invitationsApi } from '@/lib/api'

interface TeamMember {
  id: string
  oderId: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  joinedAt: string
  user: {
    id: string
    email: string
    fullName: string | null
  }
}

interface Invitation {
  id: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  token: string
  created_at: string
  expires_at: string
  status: string
}

export default function TeamPage() {
  const { organization } = useSubscriptionStore()
  const { user } = useAuthStore()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch team members and invitations
  useEffect(() => {
    if (!organization) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch members with user data
        const { data, error } = await (supabase as any)
          .from('organization_members')
          .select(`
            id,
            role,
            joined_at,
            user_id
          `)
          .eq('organization_id', organization.id)

        if (error) throw error

        // Get user details for each member
        const membersWithUsers: TeamMember[] = []
        for (const member of data || []) {
          const { data: userData } = await supabase.auth.admin.getUserById(member.user_id).catch(() => ({ data: null }))

          membersWithUsers.push({
            id: member.id,
            oderId: organization.id,
            role: member.role,
            joinedAt: member.joined_at,
            user: {
              id: member.user_id,
              email: userData?.user?.email || 'Unbekannt',
              fullName: userData?.user?.user_metadata?.full_name || null,
            },
          })
        }

        // If we couldn't get user data via admin API, try to at least show current user
        if (membersWithUsers.length === 0 && user) {
          const { data: memberData } = await (supabase as any)
            .from('organization_members')
            .select('*')
            .eq('organization_id', organization.id)
            .eq('user_id', user.id)
            .single()

          if (memberData) {
            membersWithUsers.push({
              id: memberData.id,
              oderId: organization.id,
              role: memberData.role,
              joinedAt: memberData.joined_at,
              user: {
                id: user.id,
                email: user.email || 'Unbekannt',
                fullName: user.user_metadata?.full_name || null,
              },
            })
          }
        }

        // Fallback: if still empty, just use data we have
        if (membersWithUsers.length === 0 && data && data.length > 0) {
          for (const member of data) {
            const isCurrentUser = member.user_id === user?.id
            membersWithUsers.push({
              id: member.id,
              oderId: organization.id,
              role: member.role,
              joinedAt: member.joined_at,
              user: {
                id: member.user_id,
                email: isCurrentUser ? (user?.email || 'Unbekannt') : 'Team-Mitglied',
                fullName: isCurrentUser ? (user?.user_metadata?.full_name || null) : null,
              },
            })
          }
        }

        setMembers(membersWithUsers)

        // Fetch pending invitations
        const { data: invitationsData } = await invitationsApi.getByOrganization(organization.id)
        setInvitations(invitationsData || [])
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Fehler beim Laden der Teammitglieder')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [organization, user])

  const roleLabels: Record<string, string> = {
    owner: 'Inhaber',
    admin: 'Admin',
    editor: 'Bearbeiter',
    viewer: 'Betrachter',
  }

  const roleColors: Record<string, string> = {
    owner: 'text-primary-400 bg-primary-400/10',
    admin: 'text-blue-400 bg-blue-400/10',
    editor: 'text-green-400 bg-green-400/10',
    viewer: 'text-surface-400 bg-surface-700',
  }

  const handleInvite = async (email: string, role: 'admin' | 'editor' | 'viewer') => {
    if (!organization || !user) return

    try {
      setError(null)

      const { data: invitation, error: inviteError } = await invitationsApi.create({
        organizationId: organization.id,
        email,
        role,
        inviterName: user.user_metadata?.full_name || user.email,
      })

      if (inviteError) {
        throw inviteError
      }

      if (invitation) {
        // Add to local state
        setInvitations(prev => [invitation as Invitation, ...prev])

        // Generate invite URL
        const inviteUrl = `${window.location.origin}/invite/${invitation.token}`

        setSuccess(
          `Einladung erstellt! Der Einladungslink wurde generiert. ` +
          `Teilen Sie diesen Link mit ${email}: ${inviteUrl}`
        )
        setShowInviteModal(false)

        // Copy to clipboard
        try {
          await navigator.clipboard.writeText(inviteUrl)
          setSuccess(prev => prev + ' (Link wurde in die Zwischenablage kopiert)')
        } catch {
          // Clipboard might not be available
        }
      }

      // Clear success message after 10 seconds
      setTimeout(() => setSuccess(null), 10000)
    } catch (err: any) {
      console.error('Error inviting member:', err)
      setError(err?.message || 'Fehler beim Erstellen der Einladung')
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await invitationsApi.cancel(invitationId)
      if (error) throw error

      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
      setSuccess('Einladung wurde storniert')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error canceling invitation:', err)
      setError(err?.message || 'Fehler beim Stornieren der Einladung')
    }
  }

  const handleResendInvitation = async (invitation: Invitation) => {
    try {
      const { data, error } = await invitationsApi.resend(invitation.id)
      if (error) throw error

      // Update local state
      if (data) {
        setInvitations(prev => prev.map(inv => inv.id === invitation.id ? { ...inv, ...data } : inv))
      }

      const inviteUrl = `${window.location.origin}/invite/${invitation.token}`
      setSuccess(`Einladung erneut gesendet! Link: ${inviteUrl}`)

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(inviteUrl)
        setSuccess(prev => prev + ' (Link wurde in die Zwischenablage kopiert)')
      } catch {
        // Clipboard might not be available
      }

      setTimeout(() => setSuccess(null), 10000)
    } catch (err: any) {
      console.error('Error resending invitation:', err)
      setError(err?.message || 'Fehler beim erneuten Senden')
    }
  }

  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setSuccess('Einladungslink in die Zwischenablage kopiert!')
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Konnte Link nicht kopieren')
    }
  }

  if (!organization) {
    return (
      <Layout>
        <div className="p-6 lg:p-8 text-center">
          <p className="text-surface-400">Keine Organisation gefunden</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-surface-100">Team</h1>
            <p className="text-surface-400 mt-1">{organization.name} - Teammitglieder verwalten</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Mitglied einladen
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
            <p className="text-sm text-surface-400">Mitglieder</p>
            <p className="text-2xl font-bold text-surface-100 mt-1">{members.length}</p>
          </div>
          <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
            <p className="text-sm text-surface-400">Admins</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {members.filter((m) => m.role === 'admin' || m.role === 'owner').length}
            </p>
          </div>
          <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
            <p className="text-sm text-surface-400">Bearbeiter</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {members.filter((m) => m.role === 'editor').length}
            </p>
          </div>
          <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
            <p className="text-sm text-surface-400">Ausstehend</p>
            <p className="text-2xl font-bold text-primary-400 mt-1">
              {invitations.length}
            </p>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-surface-900 rounded-xl border border-surface-800 mb-6">
          <div className="p-4 border-b border-surface-800">
            <h2 className="text-lg font-semibold text-surface-100">Mitglieder</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-surface-400">Mitglieder werden geladen...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-surface-400">Noch keine Mitglieder</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-800">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-4 hover:bg-surface-800/50 transition-colors">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <span className="text-lg font-medium text-white">
                        {member.user.fullName?.split(' ').map((n) => n[0]).join('') || member.user.email[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-100">
                      {member.user.fullName || member.user.email.split('@')[0]}
                      {member.user.id === user?.id && (
                        <span className="ml-2 text-xs text-primary-400">(Du)</span>
                      )}
                    </p>
                    <p className="text-sm text-surface-500">{member.user.email}</p>
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-sm text-surface-400">
                      Beigetreten: {new Date(member.joinedAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}>
                    {roleLabels[member.role]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="bg-surface-900 rounded-xl border border-surface-800">
            <div className="p-4 border-b border-surface-800">
              <h2 className="text-lg font-semibold text-surface-100">Ausstehende Einladungen</h2>
            </div>
            <div className="divide-y divide-surface-800">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center gap-4 p-4 hover:bg-surface-800/50 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-surface-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-100">{invitation.email}</p>
                    <p className="text-sm text-surface-500">
                      Eingeladen am {new Date(invitation.created_at).toLocaleDateString('de-DE')} ·
                      Läuft ab am {new Date(invitation.expires_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[invitation.role]}`}>
                    {roleLabels[invitation.role]}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyInviteLink(invitation.token)}
                      className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
                      title="Link kopieren"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleResendInvitation(invitation)}
                      className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
                      title="Erneut senden"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-400 transition-colors"
                      title="Einladung stornieren"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <InviteModal
            onClose={() => setShowInviteModal(false)}
            onInvite={handleInvite}
          />
        )}
      </div>
    </Layout>
  )
}

function InviteModal({
  onClose,
  onInvite
}: {
  onClose: () => void
  onInvite: (email: string, role: 'admin' | 'editor' | 'viewer') => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('editor')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await onInvite(email, role)
    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-900 rounded-2xl border border-surface-800 shadow-xl">
        <div className="p-6 border-b border-surface-800">
          <h2 className="text-xl font-semibold text-surface-100">Mitglied einladen</h2>
          <p className="text-sm text-surface-400 mt-1">Laden Sie ein neues Teammitglied ein</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">E-Mail-Adresse</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="kollege@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Rolle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'editor' | 'viewer')}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="editor">Bearbeiter - Kann Dokumente und Kodierungen bearbeiten</option>
              <option value="admin">Admin - Kann Mitglieder und Einstellungen verwalten</option>
              <option value="viewer">Betrachter - Kann nur lesen</option>
            </select>
          </div>

          <div className="p-3 rounded-lg bg-surface-800 text-sm text-surface-400">
            <strong>Hinweis:</strong> Das eingeladene Mitglied erhält einen Einladungslink, den Sie per E-Mail teilen können.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 font-medium disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                'Einladen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
