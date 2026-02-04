import { useState, useEffect } from 'react'
import {
  useTeamStore,
  TeamRole,
  TeamMember,
  roleLabels,
  roleDescriptions,
  roleColors,
} from '@/stores/teamStore'

interface TeamManagerProps {
  projectId: string
}

export default function TeamManager({ projectId }: TeamManagerProps) {
  const {
    members,
    invites,
    isLoading,
    error,
    fetchMembers,
    inviteMember,
    updateMemberRole,
    removeMember,
    cancelInvite,
    resendInvite,
    clearError,
  } = useTeamStore()

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('editor')
  const [isInviting, setIsInviting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers(projectId)
  }, [projectId, fetchMembers])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    const success = await inviteMember(projectId, inviteEmail.trim(), inviteRole)

    if (success) {
      setInviteEmail('')
      setShowInviteModal(false)
      setSuccessMessage('Einladung wurde gesendet!')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
    setIsInviting(false)
  }

  const activeMembers = members.filter(m => m.status === 'active')
  const pendingMembers = members.filter(m => m.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-surface-100">Team-Mitglieder</h2>
          <p className="text-sm text-surface-400">
            {activeMembers.length} aktiv, {pendingMembers.length} ausstehend
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Einladen
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Active Members */}
      <div className="bg-surface-900 rounded-xl border border-surface-800">
        <div className="p-4 border-b border-surface-800">
          <h3 className="font-medium text-surface-100">Aktive Mitglieder ({activeMembers.length})</h3>
        </div>
        <div className="divide-y divide-surface-800">
          {activeMembers.map(member => (
            <MemberRow
              key={member.id}
              member={member}
              onUpdateRole={(role) => updateMemberRole(member.id, role)}
              onRemove={() => removeMember(member.id)}
            />
          ))}
          {activeMembers.length === 0 && (
            <div className="p-8 text-center text-surface-500 text-sm">
              Keine aktiven Mitglieder
            </div>
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingMembers.length > 0 && (
        <div className="bg-surface-900 rounded-xl border border-surface-800">
          <div className="p-4 border-b border-surface-800">
            <h3 className="font-medium text-surface-100">Ausstehende Einladungen ({pendingMembers.length})</h3>
          </div>
          <div className="divide-y divide-surface-800">
            {pendingMembers.map(member => {
              const invite = invites.find(i => i.email === member.email)
              return (
                <PendingMemberRow
                  key={member.id}
                  member={member}
                  invite={invite}
                  onResend={() => invite && resendInvite(invite.id)}
                  onCancel={() => invite && cancelInvite(invite.id)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-900 rounded-xl border border-surface-700 p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-surface-100 mb-4">Teammitglied einladen</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">E-Mail-Adresse</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInvite()
                    if (e.key === 'Escape') setShowInviteModal(false)
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Rolle</label>
                <div className="space-y-2">
                  {(['admin', 'editor', 'viewer'] as TeamRole[]).map(role => (
                    <label
                      key={role}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        inviteRole === role
                          ? 'border-primary-500 bg-primary-500/5'
                          : 'border-surface-700 hover:border-surface-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={inviteRole === role}
                        onChange={() => setInviteRole(role)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-surface-100">{roleLabels[role]}</p>
                        <p className="text-xs text-surface-400">{roleDescriptions[role]}</p>
                      </div>
                      {inviteRole === role && (
                        <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-surface-600 text-surface-300 hover:bg-surface-800 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || isInviting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium disabled:opacity-50 transition-colors"
              >
                {isInviting ? 'Wird gesendet...' : 'Einladung senden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MemberRow({
  member,
  onUpdateRole,
  onRemove,
}: {
  member: TeamMember
  onUpdateRole: (role: TeamRole) => void
  onRemove: () => void
}) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const isOwner = member.role === 'owner'

  return (
    <div className="flex items-center gap-4 p-4">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {member.avatar ? (
          <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-surface-300 font-medium">
            {member.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-surface-100 truncate">{member.name}</p>
        <p className="text-sm text-surface-400 truncate">{member.email}</p>
      </div>

      {/* Role Badge */}
      <div className="relative">
        <button
          onClick={() => !isOwner && setShowRoleDropdown(!showRoleDropdown)}
          disabled={isOwner}
          className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[member.role]} ${
            !isOwner ? 'cursor-pointer hover:opacity-80' : ''
          }`}
        >
          {roleLabels[member.role]}
        </button>

        {showRoleDropdown && !isOwner && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowRoleDropdown(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-surface-800 rounded-lg border border-surface-700 shadow-xl z-20">
              {(['admin', 'editor', 'viewer'] as TeamRole[]).map(role => (
                <button
                  key={role}
                  onClick={() => {
                    onUpdateRole(role)
                    setShowRoleDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-700 first:rounded-t-lg last:rounded-b-lg ${
                    member.role === role ? 'text-primary-400' : 'text-surface-200'
                  }`}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {!isOwner && (
        <button
          onClick={() => {
            if (confirm(`${member.name} wirklich entfernen?`)) {
              onRemove()
            }
          }}
          className="p-2 rounded-lg text-surface-400 hover:text-red-400 hover:bg-surface-800 transition-colors"
          title="Entfernen"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}

function PendingMemberRow({
  member,
  invite,
  onResend,
  onCancel,
}: {
  member: TeamMember
  invite?: { expiresAt: string }
  onResend: () => void
  onCancel: () => void
}) {
  const expiresAt = invite ? new Date(invite.expiresAt) : null
  const isExpired = expiresAt ? expiresAt < new Date() : false

  return (
    <div className="flex items-center gap-4 p-4">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-surface-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-surface-100 truncate">{member.email}</p>
        <p className="text-sm text-surface-500">
          {isExpired ? (
            <span className="text-amber-400">Einladung abgelaufen</span>
          ) : expiresAt ? (
            <>Läuft ab am {expiresAt.toLocaleDateString('de-DE')}</>
          ) : (
            'Ausstehend'
          )}
        </p>
      </div>

      {/* Role */}
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}>
        {roleLabels[member.role]}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onResend}
          className="p-2 rounded-lg text-surface-400 hover:text-primary-400 hover:bg-surface-800 transition-colors"
          title="Erneut senden"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={() => {
            if (confirm('Einladung wirklich abbrechen?')) {
              onCancel()
            }
          }}
          className="p-2 rounded-lg text-surface-400 hover:text-red-400 hover:bg-surface-800 transition-colors"
          title="Abbrechen"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
