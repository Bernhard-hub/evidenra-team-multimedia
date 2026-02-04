import { useState, useRef, useCallback, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { Code, Coding } from '@/stores/projectStore'

// Configure PDF.js worker - use local worker to avoid CORS issues
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

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

interface TextItem {
  str: string
  transform: number[]
  width: number
  height: number
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
  const [scale, setScale] = useState(1.2)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [pageText, setPageText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selection, setSelection] = useState<{
    text: string
    pageNumber: number
    rect: DOMRect | null
  } | null>(null)
  const [showCodeMenu, setShowCodeMenu] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      if (!url && !content) return

      setIsLoading(true)
      setError(null)

      try {
        let loadingTask: pdfjsLib.PDFDocumentLoadingTask

        if (content) {
          // Handle base64 or data URL
          const data = content.startsWith('data:')
            ? atob(content.split(',')[1])
            : content
          const uint8Array = new Uint8Array(data.length)
          for (let i = 0; i < data.length; i++) {
            uint8Array[i] = data.charCodeAt(i)
          }
          loadingTask = pdfjsLib.getDocument({ data: uint8Array })
        } else if (url) {
          loadingTask = pdfjsLib.getDocument(url)
        } else {
          return
        }

        const pdf = await loadingTask.promise
        setPdfDoc(pdf)
        setNumPages(pdf.numPages)
        setPageNumber(1)
      } catch (err) {
        console.error('Error loading PDF:', err)
        setError('PDF konnte nicht geladen werden')
      } finally {
        setIsLoading(false)
      }
    }

    loadPDF()
  }, [url, content])

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return

      try {
        const page = await pdfDoc.getPage(pageNumber)
        const viewport = page.getViewport({ scale })

        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (!context) return

        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport,
        }).promise

        // Extract text content for selection
        const textContent = await page.getTextContent()
        const textItems = textContent.items as TextItem[]
        const text = textItems.map(item => item.str).join(' ')
        setPageText(text)

        // Render text layer for selection
        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = ''
          textLayerRef.current.style.width = `${viewport.width}px`
          textLayerRef.current.style.height = `${viewport.height}px`

          textItems.forEach(item => {
            const div = document.createElement('span')
            div.textContent = item.str
            div.style.position = 'absolute'
            div.style.left = `${item.transform[4] * scale}px`
            div.style.top = `${viewport.height - item.transform[5] * scale}px`
            div.style.fontSize = `${item.transform[0] * scale}px`
            div.style.color = 'transparent'
            div.style.cursor = 'text'
            textLayerRef.current?.appendChild(div)
          })
        }
      } catch (err) {
        console.error('Error rendering page:', err)
      }
    }

    renderPage()
  }, [pdfDoc, pageNumber, scale])

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.toString().trim()) {
      const text = sel.toString().trim()
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setSelection({
        text,
        pageNumber,
        rect,
      })
      setShowCodeMenu(true)
    }
  }, [pageNumber])

  // Listen for text selection
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('mouseup', handleTextSelection)
      return () => container.removeEventListener('mouseup', handleTextSelection)
    }
  }, [handleTextSelection])

  const handleCodeSelect = (codeId: string) => {
    if (selection) {
      // Calculate approximate offset based on text position
      const textBefore = pageText.indexOf(selection.text)
      const offset = textBefore >= 0 ? textBefore : 0

      onCreateCoding({
        codeId,
        startOffset: offset,
        endOffset: offset + selection.text.length,
        selectedText: selection.text,
        pageNumber: selection.pageNumber,
      })
    }
    setShowCodeMenu(false)
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

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
            onClick={() => setScale(Math.max(0.5, scale - 0.2))}
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
            onClick={() => setScale(Math.min(3.0, scale + 0.2))}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400"
            title="Vergrößern"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => setScale(1.0)}
            className="px-2 py-1 rounded text-xs text-surface-400 hover:bg-surface-800"
          >
            100%
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
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={pageNumber}
              onChange={(e) => {
                const num = parseInt(e.target.value)
                if (num >= 1 && num <= numPages) {
                  setPageNumber(num)
                }
              }}
              className="w-12 px-2 py-1 rounded bg-surface-800 border border-surface-700 text-surface-100 text-sm text-center"
              min={1}
              max={numPages}
            />
            <span className="text-sm text-surface-400">/ {numPages}</span>
          </div>
          <button
            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber >= numPages}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Coding count */}
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
        className="flex-1 overflow-auto p-4"
        style={{ backgroundColor: '#525659' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-surface-600 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-surface-400">PDF wird geladen...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-400">{error}</p>
              <p className="text-sm text-surface-500 mt-2">
                Versuchen Sie, die Datei erneut hochzuladen
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto relative" style={{ width: 'fit-content' }}>
            {/* Canvas for PDF rendering */}
            <canvas
              ref={canvasRef}
              className="shadow-xl rounded bg-white"
            />

            {/* Text layer for selection */}
            <div
              ref={textLayerRef}
              className="absolute top-0 left-0 overflow-hidden"
              style={{ mixBlendMode: 'multiply' }}
            />

            {/* Coding highlights */}
            {codings
              .filter(c => !c.startOffset || Math.floor(c.startOffset / 1000) === pageNumber - 1)
              .map(coding => {
                const code = codes.find(c => c.id === coding.codeId)
                return (
                  <div
                    key={coding.id}
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{
                      top: `${(coding.startOffset % 1000) * 0.5}px`,
                      backgroundColor: `${code?.color}33`,
                      borderLeft: `3px solid ${code?.color}`,
                      padding: '2px 8px',
                    }}
                    title={`${code?.name}: "${coding.selectedText}"`}
                  >
                    <span className="text-xs font-medium" style={{ color: code?.color }}>
                      {code?.name}
                    </span>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Code Selection Menu */}
      {showCodeMenu && selection && (
        <div
          className="fixed z-50 bg-surface-900 rounded-xl border border-surface-700 shadow-xl p-2 min-w-[220px]"
          style={{
            top: Math.min(selection.rect?.bottom ?? 0 + 10, window.innerHeight - 300),
            left: Math.min(selection.rect?.left ?? 0, window.innerWidth - 250),
          }}
        >
          <div className="px-3 py-2 border-b border-surface-800 mb-2">
            <p className="text-xs text-surface-400 mb-1">Text kodieren:</p>
            <p className="text-sm text-surface-100 line-clamp-2">
              "{selection.text.substring(0, 80)}{selection.text.length > 80 ? '...' : ''}"
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
                window.getSelection()?.removeAllRanges()
              }}
              className="w-full px-3 py-1.5 text-sm text-surface-400 hover:text-surface-200 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {codes.length > 0 && !isLoading && !error && (
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
        <h3 className="font-medium text-surface-100">PDF-Annotationen</h3>
        <p className="text-sm text-surface-500">{codings.length} Kodierungen</p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {codings.length === 0 ? (
          <div className="p-8 text-center text-surface-500">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className="text-sm">Noch keine Annotationen</p>
            <p className="text-xs text-surface-600 mt-1">Markieren Sie Text im PDF</p>
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
                          if (confirm('Kodierung löschen?')) {
                            onDeleteCoding(coding.id)
                          }
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
