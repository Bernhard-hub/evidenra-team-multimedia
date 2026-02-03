import { useState } from 'react'
import Layout from '@/components/Layout'
import { useTeamStore, type TeamMember, type Invitation } from '@/stores/teamStore'

// Mock data
const mockMembers: TeamMember[] = [
  {
    id: '1',
    userId: 'u1',
    organizationId: 'org-1',
    role: 'owner',
    user: { id: 'u1', email: 'admin@evidenra.com', fullName: 'Dr. Sarah Weber', avatarUrl: null },
    joinedAt: '2024-01-01T10:00:00Z',
    lastActiveAt: new Date().toISOString(),
    isOnline: true,
  },
  {
    id: '2',
    userId: 'u2',
    organizationId: 'org-1',
    role: 'admin',
    user: { id: 'u2', email: 'anna@example.com', fullName: 'Anna Müller', avatarUrl: null },
    joinedAt: '2024-01-05T10:00:00Z',
    lastActiveAt: new Date().toISOString(),
    isOnline: true,
  },
  {
    id: '3',
    userId: 'u3',
    organizationId: 'org-1',
    role: 'member',
    user: { id: 'u3', email: 'max@example.com', fullName: 'Max Koch', avatarUrl: null },
    joinedAt: '2024-01-10T10:00:00Z',
    lastActiveAt: '2024-01-19T14:30:00Z',
    isOnline: false,
  },
  {
    id: '4',
    userId: 'u4',
    organizationId: 'org-1',
    role: 'member',
    user: { id: 'u4', email: 'lisa@example.com', fullName: 'Lisa Schmidt', avatarUrl: null },
    joinedAt: '2024-01-12T10:00:00Z',
    lastActiveAt: '2024-01-18T09:15:00Z',
    isOnline: false,
  },
]

const mockInvitations: Invitation[] = [
  {
    id: 'inv-1',
    email: 'neues-mitglied@example.com',
    organizationId: 'org-1',
    role: 'member',
    invitedBy: 'u1',
    createdAt: '2024-01-19T10:00:00Z',
    expiresAt: '2024-01-26T10:00:00Z',
    status: 'pending',
  },
]

export default function TeamPage() {
  const [members] = useState<TeamMember[]>(mockMembers)
  const [invitations] = useState<Invitation[]>(mockInvitations)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const roleLabels: Record<string, string> = {
    owner: 'Inhaber',
    admin: 'Admin',
    member: 'Mitglied',
  }

  const roleColors: Record<string, string> = {
    owner: 'text-primary-400 bg-primary-400/10',
    admin: 'text-blue-400 bg-blue-400/10',
    member: 'text-surface-400 bg-surface-700',
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-surface-100">Team</h1>
            <p className="text-surface-400 mt-1">Verwalten Sie Ihr Forschungsteam</p>
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
            <p className="text-sm text-surface-400">Gesamt</p>
            <p className="text-2xl font-bold text-surface-100 mt-1">{members.length}</p>
          </div>
          <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
            <p className="text-sm text-surface-400">Online</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {members.filter((m) => m.isOnline).length}
            </p>
          </div>
          <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
            <p className="text-sm text-surface-400">Admins</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {members.filter((m) => m.role === 'admin' || m.role === 'owner').length}
            </p>
          </div>
          <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
            <p className="text-sm text-surface-400">Ausstehend</p>
            <p className="text-2xl font-bold text-primary-400 mt-1">
              {invitations.filter((i) => i.status === 'pending').length}
            </p>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-surface-900 rounded-xl border border-surface-800 mb-6">
          <div className="p-4 border-b border-surface-800">
            <h2 className="text-lg font-semibold text-surface-100">Mitglieder</h2>
          </div>
          <div className="divide-y divide-surface-800">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-4 hover:bg-surface-800/50 transition-colors">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <span className="text-lg font-medium text-white">
                      {member.user.fullName?.split(' ').map((n) => n[0]).join('') || '?'}
                    </span>
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-900 ${
                      member.isOnline ? 'bg-green-500 presence-online' : 'bg-surface-600'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-100">{member.user.fullName}</p>
                  <p className="text-sm text-surface-500">{member.user.email}</p>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm text-surface-400">
                    {member.isOnline ? 'Online' : `Zuletzt: ${formatDate(member.lastActiveAt)}`}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}>
                  {roleLabels[member.role]}
                </span>
                <button className="p-2 rounded-lg hover:bg-surface-700 text-surface-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.filter((i) => i.status === 'pending').length > 0 && (
          <div className="bg-surface-900 rounded-xl border border-surface-800">
            <div className="p-4 border-b border-surface-800">
              <h2 className="text-lg font-semibold text-surface-100">Ausstehende Einladungen</h2>
            </div>
            <div className="divide-y divide-surface-800">
              {invitations
                .filter((i) => i.status === 'pending')
                .map((invitation) => (
                  <div key={invitation.id} className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center">
                      <svg className="w-6 h-6 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-100">{invitation.email}</p>
                      <p className="text-sm text-surface-500">
                        Eingeladen am {new Date(invitation.createdAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary-400/10 text-primary-400">
                      Ausstehend
                    </span>
                    <button className="p-2 rounded-lg hover:bg-surface-700 text-surface-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <InviteModal onClose={() => setShowInviteModal(false)} />
        )}
      </div>
    </Layout>
  )
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement invitation
    console.log('Invite:', { email, role })
    onClose()
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
              onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="member">Mitglied</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 font-medium"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium"
            >
              Einladen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Nie'
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (hours < 1) return 'Gerade eben'
  if (hours < 24) return `vor ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Gestern'
  if (days < 7) return `vor ${days} Tagen`

  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}
