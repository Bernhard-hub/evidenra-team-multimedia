/**
 * DocumentViewerWithParaphrases - Enhanced document viewer with paraphrase support
 *
 * Features:
 * - Text selection and coding (existing)
 * - Paraphrase mode toggle (Strg+Shift+P like MAXQDA)
 * - Green highlighting for paraphrased segments
 * - Paraphrase sidebar next to text
 * - AI-assisted paraphrasing
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  IconPencil,
  IconCode,
  IconEye,
  IconSparkles
} from '@tabler/icons-react'
import { useParaphraseStore, Paraphrase } from '@/stores/paraphraseStore'
import ParaphrasePanel from './ParaphrasePanel'

interface Coding {
  id: string
  codeId: string
  codeName: string
  color: string
  startOffset: number
  endOffset: number
  selectedText: string
  memo?: string
}

interface Code {
  id: string
  name: string
  color: string
}

interface DocumentViewerWithParaphrasesProps {
  content: string
  documentId: string
  projectId: string
  codings: Coding[]
  codes: Code[]
  onAddCoding: (coding: Omit<Coding, 'id'>) => void
  onRemoveCoding: (codingId: string) => void
  readOnly?: boolean
}

type ViewMode = 'coding' | 'paraphrase' | 'both'

export default function DocumentViewerWithParaphrases({
  content,
  documentId,
  projectId,
  codings,
  codes,
  onAddCoding,
  onRemoveCoding,
  readOnly = false,
}: DocumentViewerWithParaphrasesProps) {
  const [selectedCode, setSelectedCode] = useState<Code | null>(null)
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null)
  const [hoveredCoding, setHoveredCoding] = useState<string | null>(null)
  const [hoveredParaphrase, setHoveredParaphrase] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('both')
  const [showParaphrasePanel, setShowParaphrasePanel] = useState(false)
  const [editingParaphrase, setEditingParaphrase] = useState<Paraphrase | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const {
    paraphrases,
    fetchParaphrases,
    showParaphraseSidebar
  } = useParaphraseStore()

  // Fetch paraphrases on mount
  useEffect(() => {
    if (documentId) {
      fetchParaphrases(documentId)
    }
  }, [documentId, fetchParaphrases])

  // Keyboard shortcut: Ctrl+Shift+P for paraphrase mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        if (selection) {
          setShowParaphrasePanel(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selection])

  const handleMouseUp = useCallback(() => {
    if (readOnly) return

    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !contentRef.current) {
      setSelection(null)
      return
    }

    const range = sel.getRangeAt(0)
    const text = sel.toString().trim()

    if (!text) {
      setSelection(null)
      return
    }

    // Calculate offset within content
    const preSelectionRange = range.cloneRange()
    preSelectionRange.selectNodeContents(contentRef.current)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const start = preSelectionRange.toString().length

    setSelection({
      start,
      end: start + text.length,
      text,
    })
  }, [readOnly])

  const handleApplyCode = () => {
    if (!selection || !selectedCode) return

    onAddCoding({
      codeId: selectedCode.id,
      codeName: selectedCode.name,
      color: selectedCode.color,
      startOffset: selection.start,
      endOffset: selection.end,
      selectedText: selection.text,
    })

    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const handleOpenParaphrasePanel = () => {
    if (!selection) return
    setEditingParaphrase(null)
    setShowParaphrasePanel(true)
  }

  const handleEditParaphrase = (paraphrase: Paraphrase) => {
    setEditingParaphrase(paraphrase)
    setSelection({
      start: paraphrase.startOffset,
      end: paraphrase.endOffset,
      text: paraphrase.originalText
    })
    setShowParaphrasePanel(true)
  }

  // Render content with highlighted codings AND paraphrases
  const renderContent = () => {
    const showCodings = viewMode === 'coding' || viewMode === 'both'
    const showParaphrases = viewMode === 'paraphrase' || viewMode === 'both'

    // Simple rendering if nothing to highlight
    if (codings.length === 0 && paraphrases.length === 0) {
      return <span>{content}</span>
    }

    // Build segments from codings and paraphrases
    const markers: { offset: number; type: 'start' | 'end'; item: Coding | Paraphrase; itemType: 'coding' | 'paraphrase' }[] = []

    if (showCodings) {
      codings.forEach(c => {
        markers.push({ offset: c.startOffset, type: 'start', item: c, itemType: 'coding' })
        markers.push({ offset: c.endOffset, type: 'end', item: c, itemType: 'coding' })
      })
    }

    if (showParaphrases) {
      paraphrases.forEach(p => {
        markers.push({ offset: p.startOffset, type: 'start', item: p, itemType: 'paraphrase' })
        markers.push({ offset: p.endOffset, type: 'end', item: p, itemType: 'paraphrase' })
      })
    }

    markers.sort((a, b) => a.offset - b.offset || (a.type === 'end' ? -1 : 1))

    const elements: React.ReactNode[] = []
    let lastOffset = 0
    let activeCoding: Coding | null = null
    let activeParaphrase: Paraphrase | null = null

    // Get unique offsets
    const uniqueOffsets = [...new Set(markers.map(m => m.offset))].sort((a, b) => a - b)

    uniqueOffsets.forEach((offset) => {
      // Add text before this offset
      if (offset > lastOffset) {
        const textSegment = content.slice(lastOffset, offset)

        if (activeCoding || activeParaphrase) {
          elements.push(
            <mark
              key={`segment-${lastOffset}`}
              className="relative cursor-pointer rounded px-0.5 transition-all"
              style={{
                backgroundColor: activeParaphrase
                  ? 'rgba(16, 185, 129, 0.2)'  // Emerald/green for paraphrases
                  : `${activeCoding?.color}30`,
                borderBottom: activeParaphrase
                  ? '2px solid rgb(16, 185, 129)'
                  : activeCoding
                    ? `2px solid ${activeCoding.color}`
                    : undefined,
                opacity: (activeParaphrase && hoveredParaphrase === activeParaphrase.id) ||
                  (activeCoding && hoveredCoding === activeCoding.id) ? 1 : 0.8,
              }}
              onMouseEnter={() => {
                if (activeParaphrase) setHoveredParaphrase(activeParaphrase.id)
                if (activeCoding) setHoveredCoding(activeCoding.id)
              }}
              onMouseLeave={() => {
                setHoveredParaphrase(null)
                setHoveredCoding(null)
              }}
              onClick={() => {
                if (activeParaphrase) {
                  handleEditParaphrase(activeParaphrase)
                } else if (activeCoding && !readOnly) {
                  onRemoveCoding(activeCoding.id)
                }
              }}
              title={
                activeParaphrase
                  ? `Paraphrase: "${activeParaphrase.paraphraseText}"\n(Klicken zum Bearbeiten)`
                  : `${activeCoding?.codeName}${activeCoding?.memo ? `: ${activeCoding.memo}` : ''}\n(Klicken zum Entfernen)`
              }
            >
              {textSegment}
              {/* Hover label */}
              {((activeParaphrase && hoveredParaphrase === activeParaphrase.id) ||
                (activeCoding && hoveredCoding === activeCoding.id && !activeParaphrase)) && (
                <span
                  className="absolute -top-6 left-0 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap z-10"
                  style={{
                    backgroundColor: activeParaphrase ? 'rgb(16, 185, 129)' : activeCoding?.color
                  }}
                >
                  {activeParaphrase ? 'Paraphrase' : activeCoding?.codeName}
                </span>
              )}
            </mark>
          )
        } else {
          elements.push(<span key={`text-${lastOffset}`}>{textSegment}</span>)
        }
      }

      // Process markers at this offset
      const markersAtOffset = markers.filter(m => m.offset === offset)
      markersAtOffset.forEach(m => {
        if (m.type === 'start') {
          if (m.itemType === 'coding') activeCoding = m.item as Coding
          if (m.itemType === 'paraphrase') activeParaphrase = m.item as Paraphrase
        } else {
          if (m.itemType === 'coding') activeCoding = null
          if (m.itemType === 'paraphrase') activeParaphrase = null
        }
      })

      lastOffset = offset
    })

    // Add remaining text
    if (lastOffset < content.length) {
      elements.push(<span key="text-end">{content.slice(lastOffset)}</span>)
    }

    return elements
  }

  // Document paraphrases for current document
  const documentParaphrases = paraphrases.filter(p => p.documentId === documentId)

  return (
    <div className="flex gap-4 h-full">
      {/* Document Content */}
      <div className="flex-1 min-w-0">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center bg-surface-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('coding')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'coding'
                  ? 'bg-surface-700 text-surface-100'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <IconCode size={14} />
              Codes
            </button>
            <button
              onClick={() => setViewMode('paraphrase')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'paraphrase'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <IconPencil size={14} />
              Paraphrasen
            </button>
            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'both'
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <IconEye size={14} />
              Beides
            </button>
          </div>

          {documentParaphrases.length > 0 && (
            <span className="text-xs text-surface-500 ml-2">
              {documentParaphrases.length} Paraphrase{documentParaphrases.length !== 1 ? 'n' : ''}
            </span>
          )}
        </div>

        {/* Document Text */}
        <div
          ref={contentRef}
          onMouseUp={handleMouseUp}
          className="p-6 bg-surface-900 rounded-xl border border-surface-800 text-surface-200 leading-relaxed whitespace-pre-wrap select-text overflow-auto max-h-[calc(100vh-350px)]"
          style={{ fontFamily: 'Georgia, serif', fontSize: '16px', lineHeight: '1.8' }}
        >
          {renderContent()}
        </div>

        {/* Selection Toolbar */}
        {selection && !readOnly && (
          <div className="mt-4 p-4 bg-surface-800 rounded-xl border border-surface-700">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-surface-400 mb-1">Ausgewählter Text:</p>
                <p className="text-surface-200 text-sm truncate">"{selection.text}"</p>
              </div>

              {/* Code Selection */}
              <select
                value={selectedCode?.id || ''}
                onChange={(e) => {
                  const code = codes.find((c) => c.id === e.target.value)
                  setSelectedCode(code || null)
                }}
                className="px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="">Code wählen...</option>
                {codes.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.name}
                  </option>
                ))}
              </select>

              {/* Apply Code Button */}
              <button
                onClick={handleApplyCode}
                disabled={!selectedCode}
                className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:bg-surface-700 disabled:text-surface-500 text-white text-sm font-medium transition-colors"
              >
                Code anwenden
              </button>

              {/* Paraphrase Button */}
              <button
                onClick={handleOpenParaphrasePanel}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors flex items-center gap-2"
                title="Strg+Shift+P"
              >
                <IconPencil size={16} />
                Paraphrasieren
              </button>

              {/* Cancel */}
              <button
                onClick={() => {
                  setSelection(null)
                  window.getSelection()?.removeAllRanges()
                }}
                className="p-2 rounded-lg hover:bg-surface-700 text-surface-400"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar: Codes + Paraphrases */}
      {!readOnly && (
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* Codes */}
          <div className="bg-surface-900 rounded-xl border border-surface-800 p-4">
            <h3 className="font-medium text-surface-100 mb-3 flex items-center gap-2">
              <IconCode size={16} />
              Codes
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {codes.map((code) => {
                const count = codings.filter((c) => c.codeId === code.id).length
                return (
                  <button
                    key={code.id}
                    onClick={() => setSelectedCode(code)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                      selectedCode?.id === code.id
                        ? 'bg-surface-700 text-surface-100'
                        : 'hover:bg-surface-800 text-surface-300'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: code.color }}
                    />
                    <span className="flex-1 truncate">{code.name}</span>
                    {count > 0 && (
                      <span className="text-xs text-surface-500 bg-surface-800 px-1.5 py-0.5 rounded">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Paraphrases Sidebar */}
          {showParaphraseSidebar && documentParaphrases.length > 0 && (
            <div className="bg-surface-900 rounded-xl border border-emerald-500/20 p-4">
              <h3 className="font-medium text-emerald-400 mb-3 flex items-center gap-2">
                <IconPencil size={16} />
                Paraphrasen
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {documentParaphrases.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleEditParaphrase(p)}
                    onMouseEnter={() => setHoveredParaphrase(p.id)}
                    onMouseLeave={() => setHoveredParaphrase(null)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      hoveredParaphrase === p.id
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-surface-800/50 border-surface-700 hover:border-emerald-500/20'
                    }`}
                  >
                    <p className="text-xs text-surface-500 mb-1 truncate">
                      "{p.originalText.slice(0, 50)}..."
                    </p>
                    <p className="text-sm text-surface-200 line-clamp-2">
                      {p.paraphraseText}
                    </p>
                    {p.generalization && (
                      <p className="text-xs text-purple-400 mt-1 truncate">
                        → {p.generalization}
                      </p>
                    )}
                    {p.isAiGenerated && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-primary-400">
                        <IconSparkles size={10} />
                        KI
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paraphrase Panel Modal */}
      <ParaphrasePanel
        isOpen={showParaphrasePanel}
        onClose={() => {
          setShowParaphrasePanel(false)
          setEditingParaphrase(null)
          setSelection(null)
          window.getSelection()?.removeAllRanges()
        }}
        documentId={documentId}
        projectId={projectId}
        selection={selection}
        existingParaphrase={editingParaphrase}
        onParaphraseCreated={() => {
          fetchParaphrases(documentId)
        }}
      />
    </div>
  )
}
