import { create } from 'zustand'

export type ChangeType = 'create' | 'update' | 'delete' | 'restore'
export type EntityType = 'code' | 'coding' | 'document' | 'memo' | 'project'

export interface HistoryEntry {
  id: string
  projectId: string
  entityType: EntityType
  entityId: string
  entityName: string
  changeType: ChangeType
  previousValue: any
  newValue: any
  changedBy: string
  changedByName: string
  changedAt: string
  description: string
}

export interface HistoryState {
  entries: HistoryEntry[]
  isLoading: boolean
  error: string | null

  fetchHistory: (projectId: string, filters?: HistoryFilters) => Promise<void>
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'changedAt' | 'changedBy' | 'changedByName'>) => void
  restoreVersion: (entryId: string) => Promise<boolean>
  clearHistory: () => void
  getEntityHistory: (entityType: EntityType, entityId: string) => HistoryEntry[]
}

export interface HistoryFilters {
  entityType?: EntityType
  entityId?: string
  changeType?: ChangeType
  startDate?: string
  endDate?: string
  limit?: number
}

// Demo history data
const demoHistory: HistoryEntry[] = [
  {
    id: 'hist-1',
    projectId: 'demo-project',
    entityType: 'code',
    entityId: 'code-1',
    entityName: 'Arbeitszufriedenheit',
    changeType: 'update',
    previousValue: { name: 'Zufriedenheit', color: '#3b82f6' },
    newValue: { name: 'Arbeitszufriedenheit', color: '#22c55e' },
    changedBy: 'user-1',
    changedByName: 'Max Mustermann',
    changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    description: 'Code umbenannt und Farbe geändert',
  },
  {
    id: 'hist-2',
    projectId: 'demo-project',
    entityType: 'coding',
    entityId: 'coding-1',
    entityName: 'Textstelle zu "Teamarbeit"',
    changeType: 'create',
    previousValue: null,
    newValue: { codeId: 'code-2', selectedText: 'Die Zusammenarbeit im Team...' },
    changedBy: 'user-2',
    changedByName: 'Anna Schmidt',
    changedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    description: 'Neue Kodierung erstellt',
  },
  {
    id: 'hist-3',
    projectId: 'demo-project',
    entityType: 'code',
    entityId: 'code-3',
    entityName: 'Motivation',
    changeType: 'create',
    previousValue: null,
    newValue: { name: 'Motivation', color: '#8b5cf6', description: 'Intrinsische und extrinsische Motivation' },
    changedBy: 'user-1',
    changedByName: 'Max Mustermann',
    changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Neuen Code erstellt',
  },
  {
    id: 'hist-4',
    projectId: 'demo-project',
    entityType: 'document',
    entityId: 'doc-1',
    entityName: 'Interview_01.docx',
    changeType: 'update',
    previousValue: { name: 'Interview_1.docx' },
    newValue: { name: 'Interview_01.docx' },
    changedBy: 'user-2',
    changedByName: 'Anna Schmidt',
    changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Dokument umbenannt',
  },
  {
    id: 'hist-5',
    projectId: 'demo-project',
    entityType: 'coding',
    entityId: 'coding-2',
    entityName: 'Textstelle zu "Kommunikation"',
    changeType: 'delete',
    previousValue: { codeId: 'code-1', selectedText: 'Die Kommunikation war schwierig...' },
    newValue: null,
    changedBy: 'user-1',
    changedByName: 'Max Mustermann',
    changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Kodierung gelöscht',
  },
  {
    id: 'hist-6',
    projectId: 'demo-project',
    entityType: 'code',
    entityId: 'code-4',
    entityName: 'Work-Life-Balance',
    changeType: 'update',
    previousValue: { parentId: null },
    newValue: { parentId: 'code-1' },
    changedBy: 'user-2',
    changedByName: 'Anna Schmidt',
    changedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Code in Hierarchie verschoben',
  },
  {
    id: 'hist-7',
    projectId: 'demo-project',
    entityType: 'memo',
    entityId: 'memo-1',
    entityName: 'Theoretische Notiz',
    changeType: 'create',
    previousValue: null,
    newValue: { title: 'Theoretische Notiz', content: 'Die Daten zeigen...' },
    changedBy: 'user-1',
    changedByName: 'Max Mustermann',
    changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Neues Memo erstellt',
  },
]

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  fetchHistory: async (projectId: string, filters?: HistoryFilters) => {
    set({ isLoading: true, error: null })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400))

    let filtered = demoHistory.filter(e => e.projectId === projectId || projectId === 'demo-project')

    if (filters?.entityType) {
      filtered = filtered.filter(e => e.entityType === filters.entityType)
    }
    if (filters?.entityId) {
      filtered = filtered.filter(e => e.entityId === filters.entityId)
    }
    if (filters?.changeType) {
      filtered = filtered.filter(e => e.changeType === filters.changeType)
    }
    if (filters?.startDate) {
      filtered = filtered.filter(e => new Date(e.changedAt) >= new Date(filters.startDate!))
    }
    if (filters?.endDate) {
      filtered = filtered.filter(e => new Date(e.changedAt) <= new Date(filters.endDate!))
    }
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit)
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())

    set({ entries: filtered, isLoading: false })
  },

  addEntry: (entry) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: `hist-${Date.now()}`,
      changedBy: 'current-user',
      changedByName: 'Aktueller Benutzer',
      changedAt: new Date().toISOString(),
    }

    set(state => ({
      entries: [newEntry, ...state.entries],
    }))
  },

  restoreVersion: async (entryId: string) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600))

      const entry = get().entries.find(e => e.id === entryId)
      if (!entry || !entry.previousValue) {
        set({ error: 'Keine vorherige Version verfügbar', isLoading: false })
        return false
      }

      // Add restore entry
      const restoreEntry: HistoryEntry = {
        id: `hist-${Date.now()}`,
        projectId: entry.projectId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        entityName: entry.entityName,
        changeType: 'restore',
        previousValue: entry.newValue,
        newValue: entry.previousValue,
        changedBy: 'current-user',
        changedByName: 'Aktueller Benutzer',
        changedAt: new Date().toISOString(),
        description: `Version wiederhergestellt von ${new Date(entry.changedAt).toLocaleDateString('de-DE')}`,
      }

      set(state => ({
        entries: [restoreEntry, ...state.entries],
        isLoading: false,
      }))

      return true
    } catch (err) {
      set({ error: 'Fehler beim Wiederherstellen', isLoading: false })
      return false
    }
  },

  clearHistory: () => {
    set({ entries: [], error: null })
  },

  getEntityHistory: (entityType: EntityType, entityId: string) => {
    return get().entries.filter(e => e.entityType === entityType && e.entityId === entityId)
  },
}))

// Helper functions
export const changeTypeLabels: Record<ChangeType, string> = {
  create: 'Erstellt',
  update: 'Geändert',
  delete: 'Gelöscht',
  restore: 'Wiederhergestellt',
}

export const changeTypeColors: Record<ChangeType, string> = {
  create: 'text-green-400 bg-green-500/10',
  update: 'text-blue-400 bg-blue-500/10',
  delete: 'text-red-400 bg-red-500/10',
  restore: 'text-purple-400 bg-purple-500/10',
}

export const entityTypeLabels: Record<EntityType, string> = {
  code: 'Code',
  coding: 'Kodierung',
  document: 'Dokument',
  memo: 'Memo',
  project: 'Projekt',
}

export const entityTypeIcons: Record<EntityType, string> = {
  code: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  coding: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  memo: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  project: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
}
