import { useState } from 'react'

interface Code {
  id: string
  name: string
  description?: string
  color: string
  parentId?: string | null
}

interface CodeManagerProps {
  codes: Code[]
  onAddCode: (code: Omit<Code, 'id'>) => void
  onUpdateCode: (id: string, updates: Partial<Code>) => void
  onDeleteCode: (id: string) => void
}

const COLORS = [
  '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

export default function CodeManager({
  codes,
  onAddCode,
  onUpdateCode,
  onDeleteCode,
}: CodeManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCode, setNewCode] = useState({ name: '', description: '', color: COLORS[0] })

  const rootCodes = codes.filter((c) => !c.parentId)

  const handleAddCode = () => {
    if (!newCode.name.trim()) return

    onAddCode({
      name: newCode.name.trim(),
      description: newCode.description.trim() || undefined,
      color: newCode.color,
      parentId: null,
    })

    setNewCode({ name: '', description: '', color: COLORS[Math.floor(Math.random() * COLORS.length)] })
    setIsAdding(false)
  }

  const renderCode = (code: Code, level: number = 0) => {
    const children = codes.filter((c) => c.parentId === code.id)
    const isEditing = editingId === code.id

    return (
      <div key={code.id}>
        <div
          className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-800 transition-colors"
          style={{ paddingLeft: `${12 + level * 20}px` }}
        >
          {isEditing ? (
            <EditCodeForm
              code={code}
              onSave={(updates) => {
                onUpdateCode(code.id, updates)
                setEditingId(null)
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <>
              <span
                className="w-4 h-4 rounded flex-shrink-0 cursor-pointer"
                style={{ backgroundColor: code.color }}
                onClick={() => setEditingId(code.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-surface-100 truncate">{code.name}</p>
                {code.description && (
                  <p className="text-xs text-surface-500 truncate">{code.description}</p>
                )}
              </div>
              <div className="hidden group-hover:flex items-center gap-1">
                <button
                  onClick={() => setEditingId(code.id)}
                  className="p-1 rounded hover:bg-surface-700 text-surface-400"
                  title="Bearbeiten"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Code "${code.name}" wirklich löschen?`)) {
                      onDeleteCode(code.id)
                    }
                  }}
                  className="p-1 rounded hover:bg-surface-700 text-red-400"
                  title="Löschen"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
        {children.map((child) => renderCode(child, level + 1))}
      </div>
    )
  }

  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800">
      <div className="p-4 border-b border-surface-800 flex items-center justify-between">
        <h3 className="font-medium text-surface-100">Codes ({codes.length})</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-100"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="p-2 max-h-96 overflow-y-auto">
        {isAdding && (
          <div className="p-3 mb-2 bg-surface-800 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCode({ ...newCode, color })}
                      className={`w-5 h-5 rounded ${newCode.color === color ? 'ring-2 ring-white ring-offset-1 ring-offset-surface-800' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={newCode.name}
                onChange={(e) => setNewCode({ ...newCode, name: e.target.value })}
                placeholder="Code-Name"
                className="w-full px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 text-surface-100 text-sm placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                autoFocus
              />
              <input
                type="text"
                value={newCode.description}
                onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                placeholder="Beschreibung (optional)"
                className="w-full px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 text-surface-100 text-sm placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsAdding(false)
                    setNewCode({ name: '', description: '', color: COLORS[0] })
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-surface-600 text-surface-300 text-sm hover:bg-surface-700"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleAddCode}
                  disabled={!newCode.name.trim()}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-sm hover:bg-primary-600 disabled:opacity-50"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>
        )}

        {rootCodes.length === 0 && !isAdding ? (
          <div className="text-center py-8 text-surface-500">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className="text-sm">Noch keine Codes vorhanden</p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-2 text-sm text-primary-400 hover:text-primary-300"
            >
              Ersten Code erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {rootCodes.map((code) => renderCode(code))}
          </div>
        )}
      </div>
    </div>
  )
}

function EditCodeForm({
  code,
  onSave,
  onCancel,
}: {
  code: Code
  onSave: (updates: Partial<Code>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(code.name)
  const [description, setDescription] = useState(code.description || '')
  const [color, setColor] = useState(code.color)

  return (
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-4 h-4 rounded ${color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-surface-800' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-2 py-1 rounded bg-surface-700 border border-surface-600 text-surface-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/50"
        autoFocus
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Beschreibung"
        className="w-full px-2 py-1 rounded bg-surface-700 border border-surface-600 text-surface-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/50"
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="px-2 py-1 rounded text-xs text-surface-400 hover:text-surface-200"
        >
          Abbrechen
        </button>
        <button
          onClick={() => onSave({ name, description: description || undefined, color })}
          className="px-2 py-1 rounded bg-primary-500 text-white text-xs hover:bg-primary-600"
        >
          Speichern
        </button>
      </div>
    </div>
  )
}
