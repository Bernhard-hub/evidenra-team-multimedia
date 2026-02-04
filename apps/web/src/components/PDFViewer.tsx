import { useState, useRef, useCallback, useEffect } from 'react'
import type { Code, Coding } from '@/stores/projectStore'

interface PDFViewerProps {
  url?: string
  content?: string // Base64 or data URL
  documentId: string
  codes: Code[]
  codings: Coding[]
  onCreateCoding: (coding: {
    codeId: string
    startOffset: number
    endOffset: number
    selectedText: string
    pageNumber?: number
  }) => void
  selectedCodeId?: string
}

interface Annotation {
  id: string
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  text: string
  codeId: string
  codeName: string
  codeColor: string
}

export default function PDFViewer({
  url,
  content,
  documentId,
  codes,
  codings,
  onCreateCoding,
  selectedCodeId,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [selection, setSelection] = useState<{
    text: string
    pageNumber: number
    rect: DOMRect | null
  } | null>(null)
  const [showCodeMenu, setShowCodeMenu] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Convert codings to annotations for display
  const annotations: Annotation[] = codings.map(coding => {
    const code = codes.find(c => c.id === coding.codeId)
    return {
      id: coding.id,
      pageNumber: 1, // Would need page info in coding
      x: 0,
      y: coding.startOffset,
      width: 100,
      height: 20,
      text: coding.selectedText,
      codeId: coding.codeId,
      codeName: code?.name || 'Unknown',
      codeColor: code?.color || '#666',
    }
  })

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim()
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setSelection({
        text,
        pageNumber,
        rect,
      })
      setShowCodeMenu(true)
    }
  }, [pageNumber])

  const handleCodeSelect = (codeId: string) => {
    if (selection) {
      onCreateCoding({
        codeId,
        startOffset: 0, // Would need to calculate actual offset
        endOffset: selection.text.length,
        selectedText: selection.text,
        pageNumber: selection.pageNumber,
      })
    }
    setShowCodeMenu(false)
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  // Listen for text selection
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('mouseup', handleTextSelection)
      return () => container.removeEventListener('mouseup', handleTextSelection)
    }
  }, [handleTextSelection])

  // Determine PDF source
  const pdfSource = content || url

  if (!pdfSource) {
    return (
      <div className="flex items-center justify-center h-96 bg-surface-900 rounded-xl border border-surface-800">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto text-surface-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-surface-400">Keine PDF-Datei geladen</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface-950 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-surface-900 border-b border-surface-800">
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400"
            title="Verkleinern"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-sm text-surface-300 min-w-[4rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(Math.min(2.0, scale + 0.1))}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400"
            title="Vergrößern"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-surface-300">
            Seite {pageNumber} {numPages > 0 && `von ${numPages}`}
          </span>
          <button
            onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))}
            disabled={numPages > 0 && pageNumber >= numPages}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Annotation count */}
        <div className="flex items-center gap-2 text-sm text-surface-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span>{codings.length} Kodierungen</span>
        </div>
      </div>

      {/* PDF Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 relative"
        style={{ backgroundColor: '#525659' }}
      >
        {/* PDF Embed - using iframe as fallback */}
        <div
          className="mx-auto bg-white shadow-xl rounded"
          style={{
            width: `${600 * scale}px`,
            minHeight: `${800 * scale}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          {content?.startsWith('data:') ? (
            <iframe
              src={content}
              className="w-full h-full"
              style={{ minHeight: '800px' }}
              title="PDF Viewer"
            />
          ) : url ? (
            <iframe
              src={url}
              className="w-full h-full"
              style={{ minHeight: '800px' }}
              title="PDF Viewer"
            />
          ) : (
            <div className="p-8 text-center text-surface-500">
              <p>PDF wird geladen...</p>
            </div>
          )}
        </div>

        {/* Annotation Overlays */}
        {annotations.map(annotation => (
          <div
            key={annotation.id}
            className="absolute pointer-events-none"
            style={{
              top: `${annotation.y}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: `${annotation.codeColor}33`,
              borderLeft: `3px solid ${annotation.codeColor}`,
              padding: '2px 4px',
            }}
            title={`${annotation.codeName}: ${annotation.text}`}
          >
            <span className="text-xs" style={{ color: annotation.codeColor }}>
              {annotation.codeName}
            </span>
          </div>
        ))}
      </div>

      {/* Code Selection Menu */}
      {showCodeMenu && selection && (
        <div
          className="fixed z-50 bg-surface-900 rounded-xl border border-surface-700 shadow-xl p-2 min-w-[200px]"
          style={{
            top: selection.rect ? selection.rect.bottom + 10 : '50%',
            left: selection.rect ? selection.rect.left : '50%',
          }}
        >
          <div className="px-3 py-2 border-b border-surface-800 mb-2">
            <p className="text-xs text-surface-400">Auswahl kodieren:</p>
            <p className="text-sm text-surface-100 truncate max-w-[250px]">
              "{selection.text.substring(0, 50)}{selection.text.length > 50 ? '...' : ''}"
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {codes.length === 0 ? (
              <p className="px-3 py-2 text-sm text-surface-500">Keine Codes vorhanden</p>
            ) : (
              codes.map(code => (
                <button
                  key={code.id}
                  onClick={() => handleCodeSelect(code.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-800 transition-colors ${
                    selectedCodeId === code.id ? 'bg-surface-800' : ''
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: code.color }}
                  />
                  <span className="text-sm text-surface-200 truncate">{code.name}</span>
                </button>
              ))
            )}
          </div>

          <div className="pt-2 mt-2 border-t border-surface-800">
            <button
              onClick={() => {
                setShowCodeMenu(false)
                setSelection(null)
              }}
              className="w-full px-3 py-1.5 text-sm text-surface-400 hover:text-surface-200 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {codes.length > 0 && (
        <div className="p-3 bg-surface-900 border-t border-surface-800 text-center">
          <p className="text-xs text-surface-500">
            Markieren Sie Text im PDF, um eine Kodierung hinzuzufügen
          </p>
        </div>
      )}
    </div>
  )
}

// Annotation Sidebar Component
export function AnnotationSidebar({
  codings,
  codes,
  onSelectCoding,
  onDeleteCoding,
}: {
  codings: Coding[]
  codes: Code[]
  onSelectCoding?: (codingId: string) => void
  onDeleteCoding?: (codingId: string) => void
}) {
  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
      <div className="p-4 border-b border-surface-800">
        <h3 className="font-medium text-surface-100">Annotationen</h3>
        <p className="text-sm text-surface-500">{codings.length} Kodierungen</p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {codings.length === 0 ? (
          <div className="p-8 text-center text-surface-500">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className="text-sm">Noch keine Annotationen</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-800">
            {codings.map(coding => {
              const code = codes.find(c => c.id === coding.codeId)
              return (
                <div
                  key={coding.id}
                  className="p-3 hover:bg-surface-800/50 cursor-pointer transition-colors group"
                  onClick={() => onSelectCoding?.(coding.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: code?.color }}
                    />
                    <span className="text-sm font-medium text-surface-200">{code?.name}</span>
                    {onDeleteCoding && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteCoding(coding.id)
                        }}
                        className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-surface-500 hover:text-red-400 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-surface-400 line-clamp-2">
                    "{coding.selectedText}"
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
