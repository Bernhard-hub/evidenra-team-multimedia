import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  action: () => void
  description: string
  category: string
  enabled?: boolean
}

interface ShortcutMap {
  [key: string]: KeyboardShortcut
}

// Create a unique key for a shortcut
function createShortcutKey(shortcut: Omit<KeyboardShortcut, 'action' | 'description' | 'category'>): string {
  const parts: string[] = []
  if (shortcut.ctrl || shortcut.meta) parts.push('mod')
  if (shortcut.shift) parts.push('shift')
  if (shortcut.alt) parts.push('alt')
  parts.push(shortcut.key.toLowerCase())
  return parts.join('+')
}

// Parse an event to create a shortcut key
function eventToShortcutKey(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('mod')
  if (e.shiftKey) parts.push('shift')
  if (e.altKey) parts.push('alt')
  parts.push(e.key.toLowerCase())
  return parts.join('+')
}

// Global shortcut registry
const globalShortcuts: ShortcutMap = {}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const shortcutsRef = useRef<ShortcutMap>({})

  // Register shortcuts
  useEffect(() => {
    if (!enabled) return

    shortcuts.forEach(shortcut => {
      if (shortcut.enabled === false) return
      const key = createShortcutKey(shortcut)
      shortcutsRef.current[key] = shortcut
      globalShortcuts[key] = shortcut
    })

    return () => {
      shortcuts.forEach(shortcut => {
        const key = createShortcutKey(shortcut)
        delete shortcutsRef.current[key]
        delete globalShortcuts[key]
      })
    }
  }, [shortcuts, enabled])

  // Handle key events
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow some shortcuts even in inputs
        const key = eventToShortcutKey(e)
        const shortcut = shortcutsRef.current[key]
        if (!shortcut) return

        // Only allow escape and some navigation shortcuts in inputs
        if (e.key !== 'Escape' && !e.ctrlKey && !e.metaKey) return
      }

      const key = eventToShortcutKey(e)
      const shortcut = shortcutsRef.current[key]

      if (shortcut && shortcut.enabled !== false) {
        e.preventDefault()
        e.stopPropagation()
        shortcut.action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled])
}

// Get all registered shortcuts for help display
export function getRegisteredShortcuts(): KeyboardShortcut[] {
  return Object.values(globalShortcuts)
}

// Format shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
  const parts: string[] = []

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift')
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt')

  // Format special keys
  const keyDisplay: Record<string, string> = {
    escape: 'Esc',
    enter: '↵',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
    backspace: '⌫',
    delete: 'Del',
    ' ': 'Space',
  }

  parts.push(keyDisplay[shortcut.key.toLowerCase()] || shortcut.key.toUpperCase())

  return parts.join(isMac ? '' : '+')
}

// Common shortcuts factory
export function createCommonShortcuts(actions: {
  onSave?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onSearch?: () => void
  onDelete?: () => void
  onNew?: () => void
  onEscape?: () => void
  onHelp?: () => void
  onExport?: () => void
  onSelectAll?: () => void
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = []

  if (actions.onSave) {
    shortcuts.push({
      key: 's',
      ctrl: true,
      action: actions.onSave,
      description: 'Speichern',
      category: 'Allgemein',
    })
  }

  if (actions.onUndo) {
    shortcuts.push({
      key: 'z',
      ctrl: true,
      action: actions.onUndo,
      description: 'Rückgängig',
      category: 'Bearbeiten',
    })
  }

  if (actions.onRedo) {
    shortcuts.push({
      key: 'z',
      ctrl: true,
      shift: true,
      action: actions.onRedo,
      description: 'Wiederholen',
      category: 'Bearbeiten',
    })
    shortcuts.push({
      key: 'y',
      ctrl: true,
      action: actions.onRedo,
      description: 'Wiederholen',
      category: 'Bearbeiten',
    })
  }

  if (actions.onSearch) {
    shortcuts.push({
      key: 'k',
      ctrl: true,
      action: actions.onSearch,
      description: 'Suchen',
      category: 'Navigation',
    })
    shortcuts.push({
      key: 'f',
      ctrl: true,
      action: actions.onSearch,
      description: 'Suchen',
      category: 'Navigation',
    })
  }

  if (actions.onDelete) {
    shortcuts.push({
      key: 'Delete',
      action: actions.onDelete,
      description: 'Löschen',
      category: 'Bearbeiten',
    })
    shortcuts.push({
      key: 'Backspace',
      action: actions.onDelete,
      description: 'Löschen',
      category: 'Bearbeiten',
    })
  }

  if (actions.onNew) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      action: actions.onNew,
      description: 'Neu erstellen',
      category: 'Allgemein',
    })
  }

  if (actions.onEscape) {
    shortcuts.push({
      key: 'Escape',
      action: actions.onEscape,
      description: 'Abbrechen / Schließen',
      category: 'Navigation',
    })
  }

  if (actions.onHelp) {
    shortcuts.push({
      key: '?',
      ctrl: true,
      action: actions.onHelp,
      description: 'Hilfe anzeigen',
      category: 'Allgemein',
    })
    shortcuts.push({
      key: '/',
      ctrl: true,
      action: actions.onHelp,
      description: 'Hilfe anzeigen',
      category: 'Allgemein',
    })
  }

  if (actions.onExport) {
    shortcuts.push({
      key: 'e',
      ctrl: true,
      shift: true,
      action: actions.onExport,
      description: 'Exportieren',
      category: 'Allgemein',
    })
  }

  if (actions.onSelectAll) {
    shortcuts.push({
      key: 'a',
      ctrl: true,
      action: actions.onSelectAll,
      description: 'Alles auswählen',
      category: 'Bearbeiten',
    })
  }

  return shortcuts
}
