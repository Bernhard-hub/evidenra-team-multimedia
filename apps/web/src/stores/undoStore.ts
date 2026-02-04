import { create } from 'zustand'

export type ActionType = 'create_coding' | 'delete_coding' | 'update_coding' | 'batch_create_coding' | 'batch_delete_coding'

export interface UndoableAction {
  id: string
  type: ActionType
  timestamp: number
  description: string
  data: any
  inverse: any
}

interface UndoState {
  undoStack: UndoableAction[]
  redoStack: UndoableAction[]
  maxHistory: number

  // Actions
  pushAction: (action: Omit<UndoableAction, 'id' | 'timestamp'>) => void
  undo: () => UndoableAction | null
  redo: () => UndoableAction | null
  canUndo: () => boolean
  canRedo: () => boolean
  clearHistory: () => void
  getLastAction: () => UndoableAction | null
}

export const useUndoStore = create<UndoState>()((set, get) => ({
  undoStack: [],
  redoStack: [],
  maxHistory: 50,

  pushAction: (action) => {
    const fullAction: UndoableAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    }

    set(state => ({
      undoStack: [fullAction, ...state.undoStack].slice(0, state.maxHistory),
      redoStack: [], // Clear redo stack on new action
    }))
  },

  undo: () => {
    const { undoStack } = get()
    if (undoStack.length === 0) return null

    const action = undoStack[0]

    set(state => ({
      undoStack: state.undoStack.slice(1),
      redoStack: [action, ...state.redoStack].slice(0, state.maxHistory),
    }))

    return action
  },

  redo: () => {
    const { redoStack } = get()
    if (redoStack.length === 0) return null

    const action = redoStack[0]

    set(state => ({
      redoStack: state.redoStack.slice(1),
      undoStack: [action, ...state.undoStack].slice(0, state.maxHistory),
    }))

    return action
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  clearHistory: () => {
    set({ undoStack: [], redoStack: [] })
  },

  getLastAction: () => {
    const { undoStack } = get()
    return undoStack.length > 0 ? undoStack[0] : null
  },
}))

// Helper to create undo actions for codings
export function createCodingUndoAction(
  type: 'create' | 'delete' | 'update',
  coding: any,
  previousValue?: any
): Omit<UndoableAction, 'id' | 'timestamp'> {
  switch (type) {
    case 'create':
      return {
        type: 'create_coding',
        description: `Kodierung "${coding.codeId}" erstellt`,
        data: coding,
        inverse: { id: coding.id },
      }
    case 'delete':
      return {
        type: 'delete_coding',
        description: `Kodierung gelöscht`,
        data: { id: coding.id },
        inverse: coding,
      }
    case 'update':
      return {
        type: 'update_coding',
        description: `Kodierung aktualisiert`,
        data: coding,
        inverse: previousValue,
      }
  }
}

// Helper for batch operations
export function createBatchCodingUndoAction(
  type: 'create' | 'delete',
  codings: any[]
): Omit<UndoableAction, 'id' | 'timestamp'> {
  if (type === 'create') {
    return {
      type: 'batch_create_coding',
      description: `${codings.length} Kodierungen erstellt`,
      data: codings,
      inverse: codings.map(c => ({ id: c.id })),
    }
  } else {
    return {
      type: 'batch_delete_coding',
      description: `${codings.length} Kodierungen gelöscht`,
      data: codings.map(c => ({ id: c.id })),
      inverse: codings,
    }
  }
}
