import { create } from 'zustand'

export interface TeamMember {
  id: string
  userId: string
  organizationId: string
  role: 'owner' | 'admin' | 'member'
  user: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
  }
  joinedAt: string
  lastActiveAt: string | null
  isOnline: boolean
}

export interface Organization {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  createdAt: string
  memberCount: number
  projectCount: number
}

export interface Invitation {
  id: string
  email: string
  organizationId: string
  role: 'admin' | 'member'
  invitedBy: string
  createdAt: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'expired'
}

export interface TeamState {
  organization: Organization | null
  members: TeamMember[]
  invitations: Invitation[]
  isLoading: boolean
  error: string | null

  // Presence tracking
  onlineMembers: Set<string>

  // Actions
  setOrganization: (org: Organization | null) => void
  setMembers: (members: TeamMember[]) => void
  setInvitations: (invitations: Invitation[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void

  // Presence actions
  setMemberOnline: (userId: string) => void
  setMemberOffline: (userId: string) => void

  // Member actions
  addMember: (member: TeamMember) => void
  removeMember: (userId: string) => void
  updateMemberRole: (userId: string, role: TeamMember['role']) => void
}

export const useTeamStore = create<TeamState>()((set, get) => ({
  organization: null,
  members: [],
  invitations: [],
  isLoading: false,
  error: null,
  onlineMembers: new Set(),

  setOrganization: (organization) => set({ organization }),
  setMembers: (members) => set({ members }),
  setInvitations: (invitations) => set({ invitations }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  setMemberOnline: (userId) => set((state) => {
    const newSet = new Set(state.onlineMembers)
    newSet.add(userId)
    return {
      onlineMembers: newSet,
      members: state.members.map((m) =>
        m.userId === userId ? { ...m, isOnline: true } : m
      )
    }
  }),

  setMemberOffline: (userId) => set((state) => {
    const newSet = new Set(state.onlineMembers)
    newSet.delete(userId)
    return {
      onlineMembers: newSet,
      members: state.members.map((m) =>
        m.userId === userId ? { ...m, isOnline: false } : m
      )
    }
  }),

  addMember: (member) => set((state) => ({
    members: [...state.members, member]
  })),

  removeMember: (userId) => set((state) => ({
    members: state.members.filter((m) => m.userId !== userId)
  })),

  updateMemberRole: (userId, role) => set((state) => ({
    members: state.members.map((m) =>
      m.userId === userId ? { ...m, role } : m
    )
  })),
}))
