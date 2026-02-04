import { create } from 'zustand'

export type MemoType = 'coding' | 'document' | 'code' | 'project' | 'free'

export interface Memo {
  id: string
  projectId: string
  type: MemoType
  targetId: string | null // ID of coding, document, code, or null for free memos
  title: string
  content: string
  color?: string
  tags: string[]
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface MemoComment {
  id: string
  memoId: string
  content: string
  createdBy: string
  createdByName: string
  createdAt: string
}

interface MemoState {
  memos: Memo[]
  comments: MemoComment[]
  isLoading: boolean
  error: string | null

  fetchMemos: (projectId: string) => Promise<void>
  createMemo: (data: Omit<Memo, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName'>) => Promise<Memo | null>
  updateMemo: (id: string, updates: Partial<Memo>) => Promise<void>
  deleteMemo: (id: string) => Promise<void>
  addComment: (memoId: string, content: string) => Promise<void>
  getMemosByTarget: (type: MemoType, targetId: string) => Memo[]
  clearError: () => void
}

// Demo data
const demoMemos: Memo[] = [
  {
    id: 'memo-1',
    projectId: 'demo-project',
    type: 'coding',
    targetId: 'coding-1',
    title: 'Wichtige Beobachtung',
    content: 'Diese Kodierung zeigt einen klaren Zusammenhang zwischen Arbeitszufriedenheit und Teamdynamik. Der Interviewpartner betont mehrfach die Bedeutung kollegialer Unterstützung.',
    tags: ['wichtig', 'teamdynamik'],
    createdBy: 'user-1',
    createdByName: 'Max Mustermann',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'memo-2',
    projectId: 'demo-project',
    type: 'document',
    targetId: 'doc-1',
    title: 'Methodische Notiz',
    content: 'Interview wurde per Video durchgeführt. Tonqualität gut, einige technische Unterbrechungen in Minute 15-17. Transkription entsprechend angepasst.',
    tags: ['methodik', 'transkription'],
    createdBy: 'user-2',
    createdByName: 'Anna Schmidt',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'memo-3',
    projectId: 'demo-project',
    type: 'code',
    targetId: 'code-1',
    title: 'Code-Definition verfeinern',
    content: 'Der Code "Arbeitszufriedenheit" sollte in Subkategorien aufgeteilt werden:\n- Intrinsische Zufriedenheit\n- Extrinsische Zufriedenheit\n- Soziale Zufriedenheit',
    color: '#3b82f6',
    tags: ['code-entwicklung'],
    createdBy: 'user-1',
    createdByName: 'Max Mustermann',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'memo-4',
    projectId: 'demo-project',
    type: 'free',
    targetId: null,
    title: 'Theoretische Überlegung',
    content: 'Die bisherigen Daten legen nahe, dass das theoretische Sampling erweitert werden sollte. Insbesondere fehlen Perspektiven von Führungskräften auf mittlerer Ebene.',
    tags: ['theorie', 'sampling'],
    createdBy: 'user-2',
    createdByName: 'Anna Schmidt',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
]

const demoComments: MemoComment[] = [
  {
    id: 'comment-1',
    memoId: 'memo-1',
    content: 'Stimme zu - könnte auch mit dem Code "Teamkultur" verknüpft werden.',
    createdBy: 'user-2',
    createdByName: 'Anna Schmidt',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'comment-2',
    memoId: 'memo-3',
    content: 'Gute Idee! Ich schlage vor, wir diskutieren das im nächsten Team-Meeting.',
    createdBy: 'user-3',
    createdByName: 'Peter Meyer',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
]

export const useMemoStore = create<MemoState>()((set, get) => ({
  memos: [],
  comments: [],
  isLoading: false,
  error: null,

  fetchMemos: async (projectId: string) => {
    set({ isLoading: true, error: null })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400))

    set({
      memos: demoMemos.filter(m => m.projectId === projectId || projectId === 'demo-project'),
      comments: demoComments,
      isLoading: false,
    })
  },

  createMemo: async (data) => {
    set({ isLoading: true, error: null })

    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const newMemo: Memo = {
        ...data,
        id: `memo-${Date.now()}`,
        createdBy: 'current-user',
        createdByName: 'Aktueller Benutzer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      set(state => ({
        memos: [newMemo, ...state.memos],
        isLoading: false,
      }))

      return newMemo
    } catch (err) {
      set({ error: 'Fehler beim Erstellen des Memos', isLoading: false })
      return null
    }
  },

  updateMemo: async (id: string, updates: Partial<Memo>) => {
    set({ isLoading: true, error: null })

    try {
      await new Promise(resolve => setTimeout(resolve, 300))

      set(state => ({
        memos: state.memos.map(m =>
          m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
        ),
        isLoading: false,
      }))
    } catch (err) {
      set({ error: 'Fehler beim Aktualisieren', isLoading: false })
    }
  },

  deleteMemo: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      await new Promise(resolve => setTimeout(resolve, 300))

      set(state => ({
        memos: state.memos.filter(m => m.id !== id),
        comments: state.comments.filter(c => c.memoId !== id),
        isLoading: false,
      }))
    } catch (err) {
      set({ error: 'Fehler beim Löschen', isLoading: false })
    }
  },

  addComment: async (memoId: string, content: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))

      const newComment: MemoComment = {
        id: `comment-${Date.now()}`,
        memoId,
        content,
        createdBy: 'current-user',
        createdByName: 'Aktueller Benutzer',
        createdAt: new Date().toISOString(),
      }

      set(state => ({
        comments: [...state.comments, newComment],
      }))
    } catch (err) {
      set({ error: 'Fehler beim Hinzufügen des Kommentars' })
    }
  },

  getMemosByTarget: (type: MemoType, targetId: string) => {
    return get().memos.filter(m => m.type === type && m.targetId === targetId)
  },

  clearError: () => set({ error: null }),
}))

export const memoTypeLabels: Record<MemoType, string> = {
  coding: 'Kodierung',
  document: 'Dokument',
  code: 'Code',
  project: 'Projekt',
  free: 'Freies Memo',
}

export const memoTypeColors: Record<MemoType, string> = {
  coding: 'text-green-400 bg-green-500/10',
  document: 'text-blue-400 bg-blue-500/10',
  code: 'text-purple-400 bg-purple-500/10',
  project: 'text-amber-400 bg-amber-500/10',
  free: 'text-surface-400 bg-surface-500/10',
}
