import { create } from 'zustand'
import { projectsApi, documentsApi, codesApi, codingsApi } from '@/lib/api'

export interface Project {
  id: string
  name: string
  description: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
  documentsCount?: number
  codesCount?: number
  codingsCount?: number
}

export interface Document {
  id: string
  projectId: string
  name: string
  content: string | null
  fileType: string
  wordCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Code {
  id: string
  projectId: string
  parentId: string | null
  name: string
  description: string | null
  color: string
  createdBy: string
  createdAt: string
}

export interface Coding {
  id: string
  documentId: string
  codeId: string
  startOffset: number
  endOffset: number
  selectedText: string
  memo: string | null
  confidence: number | null
  codingMethod: string | null
  codedBy: string
  createdAt: string
  code?: Code
}

export interface ProjectState {
  // Data
  projects: Project[]
  currentProject: Project | null
  documents: Document[]
  currentDocument: Document | null
  codes: Code[]
  codings: Coding[]

  // Loading states
  isLoading: boolean
  isLoadingDocuments: boolean
  isLoadingCodes: boolean
  isLoadingCodings: boolean
  error: string | null

  // Actions
  fetchProjects: (organizationId?: string) => Promise<void>
  fetchProject: (id: string) => Promise<void>
  createProject: (data: { name: string; description?: string; organizationId: string }) => Promise<Project | null>
  updateProject: (id: string, updates: { name?: string; description?: string }) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  fetchDocuments: (projectId: string) => Promise<void>
  fetchDocument: (id: string) => Promise<void>
  createDocument: (data: { projectId: string; name: string; content: string; fileType?: string }) => Promise<Document | null>
  updateDocument: (id: string, updates: { name?: string; content?: string }) => Promise<void>
  deleteDocument: (id: string) => Promise<void>

  fetchCodes: (projectId: string) => Promise<void>
  createCode: (data: { projectId: string; name: string; description?: string; color: string; parentId?: string }) => Promise<Code | null>
  updateCode: (id: string, updates: { name?: string; description?: string; color?: string; parentId?: string }) => Promise<void>
  deleteCode: (id: string) => Promise<void>

  fetchCodings: (documentId: string) => Promise<void>
  createCoding: (data: { documentId: string; codeId: string; startOffset: number; endOffset: number; selectedText: string; memo?: string; codingMethod?: string }) => Promise<Coding | null>
  createCodingsBatch: (codings: { documentId: string; codeId: string; startOffset: number; endOffset: number; selectedText: string; memo?: string; codingMethod?: string }[]) => Promise<void>
  updateCoding: (id: string, updates: { memo?: string }) => Promise<void>
  deleteCoding: (id: string) => Promise<void>

  clearError: () => void
  setCurrentProject: (project: Project | null) => void
  setCurrentDocument: (document: Document | null) => void
}

// Helper to convert snake_case to camelCase
function toCamelCase<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  if (typeof obj !== 'object') return obj

  const result: Record<string, any> = {}
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = toCamelCase(obj[key])
  }
  return result
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  currentProject: null,
  documents: [],
  currentDocument: null,
  codes: [],
  codings: [],
  isLoading: false,
  isLoadingDocuments: false,
  isLoadingCodes: false,
  isLoadingCodings: false,
  error: null,

  // ============================================
  // PROJECTS
  // ============================================

  fetchProjects: async (organizationId) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await projectsApi.getAll(organizationId)
      if (error) throw error
      set({ projects: (data || []).map(toCamelCase), isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch projects', isLoading: false })
    }
  },

  fetchProject: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await projectsApi.getById(id)
      if (error) throw error
      set({ currentProject: data ? toCamelCase(data) : null, isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch project', isLoading: false })
    }
  },

  createProject: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const { data: project, error } = await projectsApi.create(data)
      if (error) throw error
      const converted = project ? toCamelCase(project) : null
      if (converted) {
        set((state) => ({ projects: [...state.projects, converted], isLoading: false }))
      }
      return converted
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create project', isLoading: false })
      return null
    }
  },

  updateProject: async (id, updates) => {
    try {
      const { data, error } = await projectsApi.update(id, updates)
      if (error) throw error
      const converted = data ? toCamelCase(data) : null
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, ...converted } : p)),
        currentProject: state.currentProject?.id === id ? { ...state.currentProject, ...converted } : state.currentProject,
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update project' })
    }
  },

  deleteProject: async (id) => {
    try {
      const { error } = await projectsApi.delete(id)
      if (error) throw error
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete project' })
    }
  },

  // ============================================
  // DOCUMENTS
  // ============================================

  fetchDocuments: async (projectId) => {
    set({ isLoadingDocuments: true, error: null })
    try {
      const { data, error } = await documentsApi.getByProject(projectId)
      if (error) throw error
      set({ documents: (data || []).map(toCamelCase), isLoadingDocuments: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch documents', isLoadingDocuments: false })
    }
  },

  fetchDocument: async (id) => {
    set({ isLoadingDocuments: true, error: null })
    try {
      const { data, error } = await documentsApi.getById(id)
      if (error) throw error
      set({ currentDocument: data ? toCamelCase(data) : null, isLoadingDocuments: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch document', isLoadingDocuments: false })
    }
  },

  createDocument: async (data) => {
    set({ isLoadingDocuments: true, error: null })
    try {
      const { data: doc, error } = await documentsApi.create(data)
      if (error) throw error
      const converted = doc ? toCamelCase(doc) : null
      if (converted) {
        set((state) => ({ documents: [...state.documents, converted], isLoadingDocuments: false }))
      }
      return converted
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create document', isLoadingDocuments: false })
      return null
    }
  },

  updateDocument: async (id, updates) => {
    try {
      const { data, error } = await documentsApi.update(id, updates)
      if (error) throw error
      const converted = data ? toCamelCase(data) : null
      set((state) => ({
        documents: state.documents.map((d) => (d.id === id ? { ...d, ...converted } : d)),
        currentDocument: state.currentDocument?.id === id ? { ...state.currentDocument, ...converted } : state.currentDocument,
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update document' })
    }
  },

  deleteDocument: async (id) => {
    try {
      const { error } = await documentsApi.delete(id)
      if (error) throw error
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
        currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete document' })
    }
  },

  // ============================================
  // CODES
  // ============================================

  fetchCodes: async (projectId) => {
    set({ isLoadingCodes: true, error: null })
    try {
      const { data, error } = await codesApi.getByProject(projectId)
      if (error) throw error
      set({ codes: (data || []).map(toCamelCase), isLoadingCodes: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch codes', isLoadingCodes: false })
    }
  },

  createCode: async (data) => {
    set({ isLoadingCodes: true, error: null })
    try {
      const { data: code, error } = await codesApi.create(data)
      if (error) throw error
      const converted = code ? toCamelCase(code) : null
      if (converted) {
        set((state) => ({ codes: [...state.codes, converted], isLoadingCodes: false }))
      }
      return converted
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create code', isLoadingCodes: false })
      return null
    }
  },

  updateCode: async (id, updates) => {
    try {
      const { data, error } = await codesApi.update(id, updates)
      if (error) throw error
      const converted = data ? toCamelCase(data) : null
      set((state) => ({
        codes: state.codes.map((c) => (c.id === id ? { ...c, ...converted } : c)),
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update code' })
    }
  },

  deleteCode: async (id) => {
    try {
      const { error } = await codesApi.delete(id)
      if (error) throw error
      set((state) => ({
        codes: state.codes.filter((c) => c.id !== id),
        // Also remove codings with this code
        codings: state.codings.filter((c) => c.codeId !== id),
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete code' })
    }
  },

  // ============================================
  // CODINGS
  // ============================================

  fetchCodings: async (documentId) => {
    set({ isLoadingCodings: true, error: null })
    try {
      const { data, error } = await codingsApi.getByDocument(documentId)
      if (error) throw error
      set({ codings: (data || []).map(toCamelCase), isLoadingCodings: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch codings', isLoadingCodings: false })
    }
  },

  createCoding: async (data) => {
    try {
      const { data: coding, error } = await codingsApi.create(data)
      if (error) throw error
      const converted = coding ? toCamelCase(coding) : null
      if (converted) {
        // Add code reference
        const code = get().codes.find((c) => c.id === data.codeId)
        converted.code = code
        set((state) => ({ codings: [...state.codings, converted] }))
      }
      return converted
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create coding' })
      return null
    }
  },

  createCodingsBatch: async (codings) => {
    try {
      const { data, error } = await codingsApi.createBatch(codings)
      if (error) throw error
      const converted = (data || []).map(toCamelCase)
      // Add code references
      const codes = get().codes
      converted.forEach((c: Coding) => {
        c.code = codes.find((code) => code.id === c.codeId)
      })
      set((state) => ({ codings: [...state.codings, ...converted] }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create codings' })
    }
  },

  updateCoding: async (id, updates) => {
    try {
      const { data, error } = await codingsApi.update(id, updates)
      if (error) throw error
      const converted = data ? toCamelCase(data) : null
      set((state) => ({
        codings: state.codings.map((c) => (c.id === id ? { ...c, ...converted } : c)),
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update coding' })
    }
  },

  deleteCoding: async (id) => {
    try {
      const { error } = await codingsApi.delete(id)
      if (error) throw error
      set((state) => ({
        codings: state.codings.filter((c) => c.id !== id),
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete coding' })
    }
  },

  // ============================================
  // UTILITIES
  // ============================================

  clearError: () => set({ error: null }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentDocument: (document) => set({ currentDocument: document }),
}))
