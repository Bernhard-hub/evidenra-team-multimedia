import { create } from 'zustand'

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface TeamMember {
  id: string
  projectId: string
  userId: string
  email: string
  name: string
  avatar?: string
  role: TeamRole
  invitedBy: string
  invitedAt: string
  joinedAt: string | null
  status: 'pending' | 'active' | 'inactive'
}

export interface TeamInvite {
  id: string
  projectId: string
  email: string
  role: TeamRole
  token: string
  expiresAt: string
  createdBy: string
  createdAt: string
}

interface TeamState {
  members: TeamMember[]
  invites: TeamInvite[]
  isLoading: boolean
  error: string | null

  fetchMembers: (projectId: string) => Promise<void>
  inviteMember: (projectId: string, email: string, role: TeamRole) => Promise<boolean>
  updateMemberRole: (memberId: string, role: TeamRole) => Promise<void>
  removeMember: (memberId: string) => Promise<void>
  cancelInvite: (inviteId: string) => Promise<void>
  resendInvite: (inviteId: string) => Promise<void>
  clearError: () => void
}

// Demo data for development without backend
const demoMembers: TeamMember[] = [
  {
    id: '1',
    projectId: 'demo-project',
    userId: 'user-1',
    email: 'max.mustermann@example.com',
    name: 'Max Mustermann',
    role: 'owner',
    invitedBy: 'system',
    invitedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
  {
    id: '2',
    projectId: 'demo-project',
    userId: 'user-2',
    email: 'anna.schmidt@example.com',
    name: 'Anna Schmidt',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
    role: 'admin',
    invitedBy: 'user-1',
    invitedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    joinedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
  {
    id: '3',
    projectId: 'demo-project',
    userId: 'user-3',
    email: 'peter.meyer@example.com',
    name: 'Peter Meyer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Peter',
    role: 'editor',
    invitedBy: 'user-1',
    invitedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    joinedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
  {
    id: '4',
    projectId: 'demo-project',
    userId: 'user-4',
    email: 'lisa.weber@example.com',
    name: 'Lisa Weber',
    role: 'viewer',
    invitedBy: 'user-2',
    invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    joinedAt: null,
    status: 'pending',
  },
]

const demoInvites: TeamInvite[] = [
  {
    id: 'inv-1',
    projectId: 'demo-project',
    email: 'lisa.weber@example.com',
    role: 'viewer',
    token: 'demo-token-123',
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-2',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const useTeamStore = create<TeamState>()((set, get) => ({
  members: [],
  invites: [],
  isLoading: false,
  error: null,

  fetchMembers: async (projectId: string) => {
    set({ isLoading: true, error: null })

    // Simulate API call - in production this would call Supabase
    await new Promise(resolve => setTimeout(resolve, 500))

    set({
      members: demoMembers.filter(m => m.projectId === projectId || projectId === 'demo-project'),
      invites: demoInvites.filter(i => i.projectId === projectId || projectId === 'demo-project'),
      isLoading: false,
    })
  },

  inviteMember: async (projectId: string, email: string, role: TeamRole) => {
    set({ isLoading: true, error: null })

    try {
      // Check if already invited
      const existing = get().members.find(m => m.email === email)
      if (existing) {
        set({ error: 'Diese E-Mail wurde bereits eingeladen', isLoading: false })
        return false
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))

      const newInvite: TeamInvite = {
        id: `inv-${Date.now()}`,
        projectId,
        email,
        role,
        token: `token-${Date.now()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'current-user',
        createdAt: new Date().toISOString(),
      }

      const newMember: TeamMember = {
        id: `member-${Date.now()}`,
        projectId,
        userId: '',
        email,
        name: email.split('@')[0],
        role,
        invitedBy: 'current-user',
        invitedAt: new Date().toISOString(),
        joinedAt: null,
        status: 'pending',
      }

      set(state => ({
        invites: [...state.invites, newInvite],
        members: [...state.members, newMember],
        isLoading: false,
      }))

      return true
    } catch (err) {
      set({ error: 'Fehler beim Einladen', isLoading: false })
      return false
    }
  },

  updateMemberRole: async (memberId: string, role: TeamRole) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      set(state => ({
        members: state.members.map(m =>
          m.id === memberId ? { ...m, role } : m
        ),
        isLoading: false,
      }))
    } catch (err) {
      set({ error: 'Fehler beim Aktualisieren der Rolle', isLoading: false })
    }
  },

  removeMember: async (memberId: string) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      const member = get().members.find(m => m.id === memberId)

      set(state => ({
        members: state.members.filter(m => m.id !== memberId),
        invites: member ? state.invites.filter(i => i.email !== member.email) : state.invites,
        isLoading: false,
      }))
    } catch (err) {
      set({ error: 'Fehler beim Entfernen des Mitglieds', isLoading: false })
    }
  },

  cancelInvite: async (inviteId: string) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      const invite = get().invites.find(i => i.id === inviteId)

      set(state => ({
        invites: state.invites.filter(i => i.id !== inviteId),
        members: invite
          ? state.members.filter(m => !(m.email === invite.email && m.status === 'pending'))
          : state.members,
        isLoading: false,
      }))
    } catch (err) {
      set({ error: 'Fehler beim Abbrechen der Einladung', isLoading: false })
    }
  },

  resendInvite: async (inviteId: string) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))

      set(state => ({
        invites: state.invites.map(i =>
          i.id === inviteId
            ? { ...i, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }
            : i
        ),
        isLoading: false,
      }))
    } catch (err) {
      set({ error: 'Fehler beim erneuten Senden', isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))

export const roleLabels: Record<TeamRole, string> = {
  owner: 'Eigentümer',
  admin: 'Administrator',
  editor: 'Bearbeiter',
  viewer: 'Betrachter',
}

export const roleDescriptions: Record<TeamRole, string> = {
  owner: 'Volle Kontrolle über das Projekt',
  admin: 'Kann Mitglieder verwalten und alle Inhalte bearbeiten',
  editor: 'Kann Dokumente und Kodierungen bearbeiten',
  viewer: 'Kann nur lesen und kommentieren',
}

export const roleColors: Record<TeamRole, string> = {
  owner: 'text-amber-400 bg-amber-500/10',
  admin: 'text-purple-400 bg-purple-500/10',
  editor: 'text-blue-400 bg-blue-500/10',
  viewer: 'text-surface-400 bg-surface-500/10',
}
