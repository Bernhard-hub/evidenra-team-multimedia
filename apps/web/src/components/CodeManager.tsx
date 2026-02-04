import { useState } from 'react'
import DraggableCodeTree from './DraggableCodeTree'
import type { Code } from '@/stores/projectStore'

interface CodeManagerProps {
  codes: Code[]
  onAddCode: (code: Omit<Code, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => void
  onUpdateCode: (id: string, updates: Partial<Code>) => Promise<void>
  onDeleteCode: (id: string) => Promise<void>
  selectedCodeId?: string
  onSelectCode?: (codeId: string) => void
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
  selectedCodeId,
  onSelectCode,
}: CodeManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingCode, setEditingCode] = useState<Code | null>(null)
  const [newCode, setNewCode] = useState({ name: '', description: '', color: COLORS[0] })

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

  const handleEditCode = (code: Code) => {
    setEditingCode(code)
  }

  const handleSaveEdit = async (updates: Partial<Code>) => {
    if (editingCode) {
      await onUpdateCode(editingCode.id, updates)
      setEditingCode(null)
    }
  }

  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800">
      <div className="p-4 border-b border-surface-800 flex items-center justify-between">
        <h3 className="font-medium text-surface-100">Codes ({codes.length})</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-100"
          title="Neuen Code hinzufügen"
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCode()
                  if (e.key === 'Escape') {
                    setIsAdding(false)
                    setNewCode({ name: '', description: '', color: COLORS[0] })
                  }
                }}
              />
              <input
                type="text"
                value={newCode.description}
                onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                placeholder="Beschreibung (optional)"
                className="w-full px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 text-surface-100 text-sm placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCode()
                  if (e.key === 'Escape') {
                    setIsAdding(false)
                    setNewCode({ name: '', description: '', color: COLORS[0] })
                  }
                }}
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

        {codes.length === 0 && !isAdding ? (
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
          <DraggableCodeTree
            codes={codes}
            onUpdateCode={onUpdateCode}
            onDeleteCode={onDeleteCode}
            onEditCode={handleEditCode}
            selectedCodeId={selectedCodeId}
            onSelectCode={onSelectCode}
          />
        )}
      </div>

      {/* Edit Code Modal */}
      {editingCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-900 rounded-xl border border-surface-700 p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-medium text-surface-100 mb-4">Code bearbeiten</h3>
            <EditCodeForm
              code={editingCode}
              onSave={handleSaveEdit}
              onCancel={() => setEditingCode(null)}
            />
          </div>
        </div>
      )}
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

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), description: description.trim() || undefined, color })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-surface-400 mb-2">Farbe</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-lg transition-transform ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-900 scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-surface-400 mb-2">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') onCancel()
          }}
        />
      </div>

      <div>
        <label className="block text-sm text-surface-400 mb-2">Beschreibung (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibung des Codes..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCancel()
          }}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg border border-surface-600 text-surface-300 text-sm hover:bg-surface-800 transition-colors"
        >
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="flex-1 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          Speichern
        </button>
      </div>
    </div>
  )
}
