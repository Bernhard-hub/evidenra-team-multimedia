import { useEffect } from 'react'
import { formatShortcut, type KeyboardShortcut } from '@/hooks/useKeyboardShortcuts'

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[]
  onClose: () => void
}

export default function KeyboardShortcutsHelp({ shortcuts, onClose }: KeyboardShortcutsHelpProps) {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'Allgemein'
    if (!acc[category]) acc[category] = []
    // Remove duplicates by description
    if (!acc[category].find(s => s.description === shortcut.description)) {
      acc[category].push(shortcut)
    }
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)

  const categories = Object.keys(groupedShortcuts).sort()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-900 rounded-2xl border border-surface-800 shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-surface-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-surface-100">Tastaturkürzel</h2>
              <p className="text-sm text-surface-400 mt-1">
                Schneller arbeiten mit Shortcuts
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-800 text-surface-400"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map(category => (
              <div key={category}>
                <h3 className="text-sm font-medium text-surface-300 mb-3">{category}</h3>
                <div className="space-y-2">
                  {groupedShortcuts[category].map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm text-surface-400">{shortcut.description}</span>
                      <kbd className="px-2 py-1 rounded bg-surface-800 text-surface-200 text-xs font-mono min-w-[60px] text-center">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-800 flex-shrink-0">
          <p className="text-xs text-surface-500 text-center">
            Drücken Sie <kbd className="px-1.5 py-0.5 rounded bg-surface-800 text-surface-300 font-mono">Esc</kbd> zum Schließen
          </p>
        </div>
      </div>
    </div>
  )
}

// Shortcut Badge component for inline use
export function ShortcutBadge({ shortcut }: { shortcut: KeyboardShortcut }) {
  return (
    <kbd className="px-1.5 py-0.5 rounded bg-surface-800/50 text-surface-400 text-xs font-mono">
      {formatShortcut(shortcut)}
    </kbd>
  )
}
