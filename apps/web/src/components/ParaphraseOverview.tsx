/**
 * ParaphraseOverview - Table for Mayring's reduction step
 *
 * Features:
 * - Overview of all paraphrases in a project
 * - Drag & drop categorization
 * - Filter by document, category, uncategorized
 * - Bulk operations for bundling similar paraphrases
 * - Export functionality
 */

import { useState, useMemo } from 'react'
import {
  IconCategory,
  IconPlus,
  IconFilter,
  IconDownload,
  IconSparkles,
  IconArrowUp,
  IconCheck,
  IconTrash
} from '@tabler/icons-react'
import { useParaphraseStore, Paraphrase, ParaphraseCategory } from '@/stores/paraphraseStore'
import { useProjectStore } from '@/stores/projectStore'

interface ParaphraseOverviewProps {
  projectId: string
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#64748b'
]

export default function ParaphraseOverview({ projectId }: ParaphraseOverviewProps) {
  const { documents } = useProjectStore()
  const {
    paraphrases,
    categories,
    createCategory,
    deleteCategory,
    updateParaphrase,
    bundleParaphrases
  } = useParaphraseStore()

  const [filterDocument, setFilterDocument] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedParaphrases, setSelectedParaphrases] = useState<Set<string>>(new Set())
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0])

  // Filter paraphrases
  const filteredParaphrases = useMemo(() => {
    let result = paraphrases.filter(p => p.projectId === projectId)

    if (filterDocument !== 'all') {
      result = result.filter(p => p.documentId === filterDocument)
    }

    if (filterCategory === 'uncategorized') {
      result = result.filter(p => !p.categoryId)
    } else if (filterCategory !== 'all') {
      result = result.filter(p => p.categoryId === filterCategory)
    }

    return result.sort((a, b) => a.startOffset - b.startOffset)
  }, [paraphrases, projectId, filterDocument, filterCategory])

  // Group by category for display
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, Paraphrase[]> = {
      uncategorized: []
    }

    categories.forEach(c => {
      groups[c.id] = []
    })

    filteredParaphrases.forEach(p => {
      if (p.categoryId && groups[p.categoryId]) {
        groups[p.categoryId].push(p)
      } else {
        groups.uncategorized.push(p)
      }
    })

    return groups
  }, [filteredParaphrases, categories])

  // Handle category creation
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    await createCategory({
      projectId,
      name: newCategoryName.trim(),
      color: newCategoryColor
    })

    setNewCategoryName('')
    setShowNewCategory(false)
  }

  // Handle bulk assign to category
  const handleBulkAssign = async (categoryId: string) => {
    if (selectedParaphrases.size === 0) return

    await bundleParaphrases(Array.from(selectedParaphrases), categoryId)
    setSelectedParaphrases(new Set())
  }

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedParaphrases)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedParaphrases(newSelection)
  }

  // Get document name
  const getDocumentName = (documentId: string) => {
    return documents.find(d => d.id === documentId)?.name || 'Unbekannt'
  }

  // Get category by ID
  const getCategoryById = (categoryId: string | null) => {
    if (!categoryId) return null
    return categories.find(c => c.id === categoryId) || null
  }

  // Export to CSV
  const handleExport = () => {
    const csv = [
      ['Originaltext', 'Paraphrase', 'Generalisierung', 'Kategorie', 'Dokument', 'KI-generiert'].join(';'),
      ...filteredParaphrases.map(p => [
        `"${p.originalText.replace(/"/g, '""')}"`,
        `"${p.paraphraseText.replace(/"/g, '""')}"`,
        `"${(p.generalization || '').replace(/"/g, '""')}"`,
        `"${getCategoryById(p.categoryId)?.name || ''}"`,
        `"${getDocumentName(p.documentId)}"`,
        p.isAiGenerated ? 'Ja' : 'Nein'
      ].join(';'))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paraphrasen-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <IconCategory size={24} className="text-emerald-400" />
            Paraphrasen-Übersicht
          </h2>
          <p className="text-sm text-surface-400 mt-1">
            Mayring: Reduktion und Kategorisierung
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-3 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm flex items-center gap-2"
          >
            <IconDownload size={16} />
            Export CSV
          </button>
          <button
            onClick={() => setShowNewCategory(true)}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium flex items-center gap-2"
          >
            <IconPlus size={16} />
            Kategorie erstellen
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <IconFilter size={16} className="text-surface-400" />
          <select
            value={filterDocument}
            onChange={(e) => setFilterDocument(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option value="all">Alle Dokumente</option>
            {documents.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        >
          <option value="all">Alle Kategorien</option>
          <option value="uncategorized">Unkategorisiert</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <span className="text-sm text-surface-500">
          {filteredParaphrases.length} Paraphrase{filteredParaphrases.length !== 1 ? 'n' : ''}
        </span>
      </div>

      {/* Bulk Actions */}
      {selectedParaphrases.size > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4">
          <span className="text-sm text-emerald-400">
            {selectedParaphrases.size} ausgewählt
          </span>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleBulkAssign(e.target.value)
                e.target.value = ''
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-200 text-sm"
            defaultValue=""
          >
            <option value="" disabled>Kategorie zuweisen...</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={() => setSelectedParaphrases(new Set())}
            className="text-sm text-surface-400 hover:text-surface-200"
          >
            Auswahl aufheben
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Uncategorized */}
          {groupedByCategory.uncategorized.length > 0 && (
            <div className="bg-surface-900 rounded-xl border border-surface-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-surface-300">
                  Unkategorisiert
                </h3>
                <span className="text-xs text-surface-500 bg-surface-800 px-2 py-1 rounded">
                  {groupedByCategory.uncategorized.length}
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {groupedByCategory.uncategorized.map(p => (
                  <ParaphraseCard
                    key={p.id}
                    paraphrase={p}
                    isSelected={selectedParaphrases.has(p.id)}
                    onToggle={() => toggleSelection(p.id)}
                    documentName={getDocumentName(p.documentId)}
                    categories={categories}
                    onAssignCategory={(catId) => updateParaphrase(p.id, { categoryId: catId })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {categories.map(cat => (
            <div
              key={cat.id}
              className="bg-surface-900 rounded-xl border p-4"
              style={{ borderColor: `${cat.color}40` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: cat.color }}
                  />
                  <h3 className="font-medium text-surface-100">{cat.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-surface-500 bg-surface-800 px-2 py-1 rounded">
                    {groupedByCategory[cat.id]?.length || 0}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Kategorie "${cat.name}" löschen?`)) {
                        deleteCategory(cat.id)
                      }
                    }}
                    className="p-1 rounded hover:bg-red-500/10 text-red-400"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
              {cat.description && (
                <p className="text-xs text-surface-500 mb-3">{cat.description}</p>
              )}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(groupedByCategory[cat.id] || []).map(p => (
                  <ParaphraseCard
                    key={p.id}
                    paraphrase={p}
                    isSelected={selectedParaphrases.has(p.id)}
                    onToggle={() => toggleSelection(p.id)}
                    documentName={getDocumentName(p.documentId)}
                    categories={categories}
                    onAssignCategory={(catId) => updateParaphrase(p.id, { categoryId: catId })}
                    onRemoveCategory={() => updateParaphrase(p.id, { categoryId: null })}
                  />
                ))}
                {(groupedByCategory[cat.id] || []).length === 0 && (
                  <p className="text-sm text-surface-500 text-center py-4">
                    Keine Paraphrasen in dieser Kategorie
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Category Modal */}
      {showNewCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-900 rounded-xl border border-surface-700 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              Neue Kategorie
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="z.B. 'Motivation', 'Herausforderungen'..."
                  className="w-full px-4 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Farbe
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-8 h-8 rounded-lg transition-transform ${
                        newCategoryColor === color ? 'ring-2 ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewCategory(false)
                  setNewCategoryName('')
                }}
                className="px-4 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Individual paraphrase card
function ParaphraseCard({
  paraphrase,
  isSelected,
  onToggle,
  documentName,
  categories,
  onAssignCategory,
  onRemoveCategory
}: {
  paraphrase: Paraphrase
  isSelected: boolean
  onToggle: () => void
  documentName: string
  categories: ParaphraseCategory[]
  onAssignCategory: (categoryId: string) => void
  onRemoveCategory?: () => void
}) {
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isSelected
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-surface-800/50 border-surface-700 hover:border-surface-600'
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={onToggle}
          className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
            isSelected
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-surface-600 hover:border-surface-400'
          }`}
        >
          {isSelected && <IconCheck size={12} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-surface-500 truncate mb-1">
            {documentName}
          </p>
          <p className="text-sm text-surface-200 mb-1">
            {paraphrase.paraphraseText}
          </p>
          {paraphrase.generalization && (
            <p className="text-xs text-purple-400 flex items-center gap-1">
              <IconArrowUp size={10} />
              {paraphrase.generalization}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {paraphrase.isAiGenerated && (
              <span className="inline-flex items-center gap-1 text-xs text-primary-400">
                <IconSparkles size={10} />
                KI
              </span>
            )}
            {onRemoveCategory && (
              <button
                onClick={onRemoveCategory}
                className="text-xs text-surface-500 hover:text-red-400"
              >
                Entfernen
              </button>
            )}
            {!paraphrase.categoryId && (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="text-xs text-surface-400 hover:text-emerald-400"
                >
                  + Kategorie
                </button>
                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 z-20 bg-surface-800 rounded-lg border border-surface-700 shadow-xl py-1 min-w-32">
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            onAssignCategory(cat.id)
                            setShowDropdown(false)
                          }}
                          className="w-full px-3 py-1.5 text-left text-sm text-surface-200 hover:bg-surface-700 flex items-center gap-2"
                        >
                          <span
                            className="w-2 h-2 rounded"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
