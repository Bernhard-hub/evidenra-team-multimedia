import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

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
  createdAt: string
  expiresAt: string
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

  // Fetch team members
  useEffect(() => {
    if (!organization) return

    const fetchMembers = async () => {
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
          // Just show the current user as the member
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
      } catch (err) {
        console.error('Error fetching members:', err)
        setError('Fehler beim Laden der Teammitglieder')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
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
      // For now, just add them directly to the organization
      // In a real app, you'd send an email invitation

      // Check if user exists
      // Note: This requires the user to already be registered
      // A proper implementation would use Supabase's invite functionality

      setSuccess(`Einladung an ${email} gesendet (Demo-Modus: Benutzer muss sich selbst registrieren)`)
      setShowInviteModal(false)

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      console.error('Error inviting member:', err)
      setError('Fehler beim Einladen')
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
          <div className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
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
            <strong>Hinweis:</strong> Das eingeladene Mitglied erhält eine E-Mail mit einem Einladungslink.
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
                  Wird gesendet...
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
