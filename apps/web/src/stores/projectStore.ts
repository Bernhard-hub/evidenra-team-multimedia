import { create } from 'zustand'

export interface Project {
  id: string
  name: string
  description: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
  memberCount: number
  documentCount: number
  codeCount: number
}

export interface ProjectMember {
  id: string
  userId: string
  projectId: string
  role: 'admin' | 'coder' | 'reviewer' | 'viewer'
  user: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
  }
  joinedAt: string
}

export interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  members: ProjectMember[]
  isLoading: boolean
  error: string | null

  // Actions
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  setMembers: (members: ProjectMember[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  removeProject: (id: string) => void
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  currentProject: null,
  members: [],
  isLoading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  setMembers: (members) => set({ members }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addProject: (project) => set((state) => ({
    projects: [...state.projects, project]
  })),

  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    ),
    currentProject: state.currentProject?.id === id
      ? { ...state.currentProject, ...updates }
      : state.currentProject
  })),

  removeProject: (id) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== id),
    currentProject: state.currentProject?.id === id ? null : state.currentProject
  })),
}))
