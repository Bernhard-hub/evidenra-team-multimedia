import { useState, useEffect } from 'react'
import {
  useMemoStore,
  Memo,
  MemoType,
  memoTypeLabels,
  memoTypeColors,
} from '@/stores/memoStore'

interface MemoPanelProps {
  projectId: string
  targetType?: MemoType
  targetId?: string
  showAllMemos?: boolean
}

export default function MemoPanel({
  projectId,
  targetType,
  targetId,
  showAllMemos = false,
}: MemoPanelProps) {
  const {
    memos,
    comments,
    isLoading,
    fetchMemos,
    createMemo,
    updateMemo,
    deleteMemo,
    addComment,
  } = useMemoStore()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)
  const [expandedMemoId, setExpandedMemoId] = useState<string | null>(null)
  const [filter, setFilter] = useState<MemoType | 'all'>('all')

  useEffect(() => {
    fetchMemos(projectId)
  }, [projectId, fetchMemos])

  // Filter memos based on target or show all
  const filteredMemos = memos.filter(memo => {
    if (targetType && targetId) {
      return memo.type === targetType && memo.targetId === targetId
    }
    if (filter !== 'all') {
      return memo.type === filter
    }
    return showAllMemos
  })

  const sortedMemos = [...filteredMemos].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-surface-100">
            Memos {!showAllMemos && targetType && `(${memoTypeLabels[targetType]})`}
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-surface-800 text-xs text-surface-400">
            {sortedMemos.length}
          </span>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Neues Memo
        </button>
      </div>

      {/* Filter (only when showing all) */}
      {showAllMemos && (
        <div className="flex gap-2 flex-wrap">
          <FilterButton
            label="Alle"
            isActive={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          {(['coding', 'document', 'code', 'free'] as MemoType[]).map(type => (
            <FilterButton
              key={type}
              label={memoTypeLabels[type]}
              isActive={filter === type}
              onClick={() => setFilter(type)}
              count={memos.filter(m => m.type === type).length}
            />
          ))}
        </div>
      )}

      {/* Memo List */}
      <div className="space-y-3">
        {isLoading && sortedMemos.length === 0 ? (
          <div className="text-center py-8 text-surface-500">
            <div className="animate-spin w-6 h-6 border-2 border-surface-600 border-t-primary-500 rounded-full mx-auto mb-2" />
            <p className="text-sm">Lade Memos...</p>
          </div>
        ) : sortedMemos.length === 0 ? (
          <div className="text-center py-8 text-surface-500">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Noch keine Memos vorhanden</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-2 text-sm text-primary-400 hover:text-primary-300"
            >
              Erstes Memo erstellen
            </button>
          </div>
        ) : (
          sortedMemos.map(memo => (
            <MemoCard
              key={memo.id}
              memo={memo}
              comments={comments.filter(c => c.memoId === memo.id)}
              isExpanded={expandedMemoId === memo.id}
              onToggleExpand={() => setExpandedMemoId(expandedMemoId === memo.id ? null : memo.id)}
              onEdit={() => setEditingMemo(memo)}
              onDelete={() => {
                if (confirm('Memo wirklich löschen?')) {
                  deleteMemo(memo.id)
                }
              }}
              onAddComment={(content) => addComment(memo.id, content)}
              showType={showAllMemos}
            />
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateForm || editingMemo) && (
        <MemoFormModal
          memo={editingMemo}
          defaultType={targetType || 'free'}
          defaultTargetId={targetId || null}
          projectId={projectId}
          onSave={async (data) => {
            if (editingMemo) {
              await updateMemo(editingMemo.id, data)
            } else {
              await createMemo({
                ...data,
                projectId,
              })
            }
            setShowCreateForm(false)
            setEditingMemo(null)
          }}
          onClose={() => {
            setShowCreateForm(false)
            setEditingMemo(null)
          }}
        />
      )}
    </div>
  )
}

function FilterButton({
  label,
  isActive,
  onClick,
  count,
}: {
  label: string
  isActive: boolean
  onClick: () => void
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
        isActive
          ? 'bg-primary-500/20 text-primary-400'
          : 'bg-surface-800 text-surface-400 hover:text-surface-200'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className="ml-1.5 text-xs opacity-60">({count})</span>
      )}
    </button>
  )
}

function MemoCard({
  memo,
  comments,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddComment,
  showType,
}: {
  memo: Memo
  comments: { id: string; content: string; createdByName: string; createdAt: string }[]
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onAddComment: (content: string) => void
  showType: boolean
}) {
  const [newComment, setNewComment] = useState('')
  const [showCommentForm, setShowCommentForm] = useState(false)

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Gerade eben'
    if (diffHours < 24) return `Vor ${diffHours} Stunden`
    if (diffDays < 7) return `Vor ${diffDays} Tagen`
    return d.toLocaleDateString('de-DE')
  }

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim())
      setNewComment('')
      setShowCommentForm(false)
    }
  }

  return (
    <div
      className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden"
      style={{ borderLeftColor: memo.color || undefined, borderLeftWidth: memo.color ? '3px' : undefined }}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-surface-800/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-surface-100 truncate">{memo.title}</h4>
              {showType && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${memoTypeColors[memo.type]}`}>
                  {memoTypeLabels[memo.type]}
                </span>
              )}
            </div>
            <p className="text-sm text-surface-400 line-clamp-2">{memo.content}</p>
          </div>
          <svg
            className={`w-5 h-5 text-surface-500 flex-shrink-0 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-3 text-xs text-surface-500">
          <span>{memo.createdByName}</span>
          <span>{formatDate(memo.updatedAt)}</span>
          {comments.length > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {comments.length}
            </span>
          )}
          {memo.tags.length > 0 && (
            <div className="flex gap-1">
              {memo.tags.slice(0, 2).map(tag => (
                <span key={tag} className="px-1.5 py-0.5 rounded bg-surface-800 text-surface-400">
                  #{tag}
                </span>
              ))}
              {memo.tags.length > 2 && (
                <span className="text-surface-500">+{memo.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-surface-800">
          {/* Full Content */}
          <div className="p-4">
            <p className="text-sm text-surface-300 whitespace-pre-wrap">{memo.content}</p>

            {/* Tags */}
            {memo.tags.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {memo.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 rounded-full bg-surface-800 text-xs text-surface-400">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-800">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="px-3 py-1.5 rounded-lg text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
              >
                Bearbeiten
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowCommentForm(true)
                }}
                className="px-3 py-1.5 rounded-lg text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
              >
                Kommentieren
              </button>
              <div className="flex-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>

          {/* Comments */}
          {(comments.length > 0 || showCommentForm) && (
            <div className="border-t border-surface-800 bg-surface-950/50 p-4 space-y-3">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-xs text-surface-400 flex-shrink-0">
                    {comment.createdByName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-surface-200">{comment.createdByName}</span>
                      <span className="text-xs text-surface-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-surface-400 mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}

              {showCommentForm && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-xs text-primary-400 flex-shrink-0">
                    Du
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Kommentar schreiben..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 text-sm placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setShowCommentForm(false)}
                        className="px-3 py-1 rounded text-sm text-surface-400 hover:text-surface-200"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim()}
                        className="px-3 py-1 rounded bg-primary-500 text-white text-sm disabled:opacity-50"
                      >
                        Senden
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MemoFormModal({
  memo,
  defaultType,
  defaultTargetId,
  projectId,
  onSave,
  onClose,
}: {
  memo: Memo | null
  defaultType: MemoType
  defaultTargetId: string | null
  projectId: string
  onSave: (data: Partial<Memo>) => Promise<void>
  onClose: () => void
}) {
  const [title, setTitle] = useState(memo?.title || '')
  const [content, setContent] = useState(memo?.content || '')
  const [type, setType] = useState<MemoType>(memo?.type || defaultType)
  const [tags, setTags] = useState<string[]>(memo?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return

    setIsSaving(true)
    await onSave({
      title: title.trim(),
      content: content.trim(),
      type,
      targetId: memo?.targetId || defaultTargetId,
      tags,
    })
    setIsSaving(false)
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-900 rounded-xl border border-surface-700 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-surface-100 mb-4">
            {memo ? 'Memo bearbeiten' : 'Neues Memo'}
          </h3>

          <div className="space-y-4">
            {/* Type Selector (only for new free memos) */}
            {!memo && !defaultTargetId && (
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Typ</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MemoType)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  <option value="free">Freies Memo</option>
                  <option value="project">Projekt-Memo</option>
                </select>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titel des Memos"
                className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                autoFocus
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Inhalt</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ihre analytischen Notizen, Beobachtungen oder Ideen..."
                rows={6}
                className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-800 text-sm text-surface-300"
                  >
                    #{tag}
                    <button
                      onClick={() => setTags(tags.filter(t => t !== tag))}
                      className="text-surface-500 hover:text-surface-300"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="Tag hinzufügen..."
                  className="flex-1 px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
                <button
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  className="px-3 py-2 rounded-lg bg-surface-800 text-surface-400 hover:text-surface-200 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-surface-600 text-surface-300 hover:bg-surface-800 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !content.trim() || isSaving}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
