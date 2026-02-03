import { useState, useRef, useCallback } from 'react'

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

interface DocumentViewerProps {
  content: string
  codings: Coding[]
  codes: Code[]
  onAddCoding: (coding: Omit<Coding, 'id'>) => void
  onRemoveCoding: (codingId: string) => void
  readOnly?: boolean
}

export default function DocumentViewer({
  content,
  codings,
  codes,
  onAddCoding,
  onRemoveCoding,
  readOnly = false,
}: DocumentViewerProps) {
  const [selectedCode, setSelectedCode] = useState<Code | null>(null)
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null)
  const [hoveredCoding, setHoveredCoding] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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

  // Render content with highlighted codings
  const renderContent = () => {
    if (codings.length === 0) {
      return <span>{content}</span>
    }

    // Sort codings by start offset
    const sortedCodings = [...codings].sort((a, b) => a.startOffset - b.startOffset)

    const elements: React.ReactNode[] = []
    let lastIndex = 0

    sortedCodings.forEach((coding, idx) => {
      // Add text before this coding
      if (coding.startOffset > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {content.slice(lastIndex, coding.startOffset)}
          </span>
        )
      }

      // Add the coded segment
      elements.push(
        <mark
          key={coding.id}
          className="relative cursor-pointer rounded px-0.5 transition-all"
          style={{
            backgroundColor: `${coding.color}30`,
            borderBottom: `2px solid ${coding.color}`,
            opacity: hoveredCoding === coding.id ? 1 : 0.8,
          }}
          onMouseEnter={() => setHoveredCoding(coding.id)}
          onMouseLeave={() => setHoveredCoding(null)}
          onClick={() => !readOnly && onRemoveCoding(coding.id)}
          title={`${coding.codeName}${coding.memo ? `: ${coding.memo}` : ''}\n(Klicken zum Entfernen)`}
        >
          {content.slice(coding.startOffset, coding.endOffset)}
          {hoveredCoding === coding.id && (
            <span
              className="absolute -top-6 left-0 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap z-10"
              style={{ backgroundColor: coding.color }}
            >
              {coding.codeName}
            </span>
          )}
        </mark>
      )

      lastIndex = coding.endOffset
    })

    // Add remaining text
    if (lastIndex < content.length) {
      elements.push(
        <span key="text-end">{content.slice(lastIndex)}</span>
      )
    }

    return elements
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Document Content */}
      <div className="flex-1 min-w-0">
        <div
          ref={contentRef}
          onMouseUp={handleMouseUp}
          className="p-6 bg-surface-900 rounded-xl border border-surface-800 text-surface-200 leading-relaxed whitespace-pre-wrap select-text overflow-auto max-h-[calc(100vh-300px)]"
          style={{ fontFamily: 'Georgia, serif', fontSize: '16px', lineHeight: '1.8' }}
        >
          {renderContent()}
        </div>

        {/* Selection Toolbar */}
        {selection && !readOnly && (
          <div className="mt-4 p-4 bg-surface-800 rounded-xl border border-surface-700 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-surface-400 mb-1">Ausgewählter Text:</p>
              <p className="text-surface-200 text-sm truncate">"{selection.text}"</p>
            </div>
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
            <button
              onClick={handleApplyCode}
              disabled={!selectedCode}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:bg-surface-700 disabled:text-surface-500 text-white text-sm font-medium transition-colors"
            >
              Code anwenden
            </button>
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
        )}
      </div>

      {/* Code Sidebar */}
      {!readOnly && (
        <div className="w-64 flex-shrink-0">
          <div className="bg-surface-900 rounded-xl border border-surface-800 p-4">
            <h3 className="font-medium text-surface-100 mb-3">Codes</h3>
            <div className="space-y-1">
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
        </div>
      )}
    </div>
  )
}
