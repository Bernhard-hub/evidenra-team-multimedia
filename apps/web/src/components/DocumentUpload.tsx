import { useState, useCallback, useRef } from 'react'

interface DocumentUploadProps {
  onUpload: (document: { name: string; content: string; type: string }) => void
  onClose: () => void
  onBatchUpload?: (documents: Array<{ name: string; content: string; type: string }>) => void
}

type UploadState = 'idle' | 'loading' | 'success' | 'error'

interface FileQueueItem {
  id: string
  file: File
  name: string
  status: UploadState
  progress: number
  error?: string
  content?: string
  type?: string
}

export default function DocumentUpload({ onUpload, onClose, onBatchUpload }: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [content, setContent] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'upload' | 'paste'>('upload')
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string>('text')
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const processFile = async (file: File): Promise<{ content: string; type: string }> => {
    const extension = file.name.split('.').pop()?.toLowerCase() || ''

    let text: string
    let type: string

    if (extension === 'txt' || extension === 'md' || file.type === 'text/plain') {
      text = await readTextFile(file)
      type = 'text'
    } else if (extension === 'pdf' || file.type === 'application/pdf') {
      text = await parsePDF(file)
      type = 'pdf'
    } else if (
      extension === 'docx' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      text = await parseDOCX(file)
      type = 'docx'
    } else {
      text = await readTextFile(file)
      type = 'text'
    }

    if (!text.trim()) {
      throw new Error('Die Datei enthält keinen extrahierbaren Text.')
    }

    return { content: text, type }
  }

  const processSingleFile = async (file: File) => {
    setUploadState('loading')
    setProgress(10)
    setError(null)

    const baseName = file.name.replace(/\.[^/.]+$/, '')
    setName(baseName)

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || ''

      let text: string

      if (extension === 'txt' || extension === 'md' || file.type === 'text/plain') {
        text = await readTextFile(file)
        setFileType('text')
        setProgress(100)
      } else if (extension === 'pdf' || file.type === 'application/pdf') {
        setProgress(20)
        text = await parsePDF(file, (p) => setProgress(20 + p * 70))
        setFileType('pdf')
        setProgress(100)
      } else if (
        extension === 'docx' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        setProgress(20)
        text = await parseDOCX(file, (p) => setProgress(20 + p * 70))
        setFileType('docx')
        setProgress(100)
      } else {
        text = await readTextFile(file)
        setFileType('text')
        setProgress(100)
      }

      if (!text.trim()) {
        throw new Error('Die Datei enthält keinen extrahierbaren Text.')
      }

      setContent(text)
      setUploadState('success')
    } catch (err) {
      console.error('File processing error:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Verarbeiten der Datei')
      setUploadState('error')
    }
  }

  const processFileQueue = async (files: File[]) => {
    if (files.length === 1) {
      // Single file - use original flow
      processSingleFile(files[0])
      return
    }

    // Multiple files - use queue
    const queue: FileQueueItem[] = files.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      file,
      name: file.name.replace(/\.[^/.]+$/, ''),
      status: 'idle' as UploadState,
      progress: 0,
    }))

    setFileQueue(queue)
    setIsProcessingQueue(true)

    // Process files sequentially
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]

      setFileQueue(prev => prev.map(q =>
        q.id === item.id ? { ...q, status: 'loading', progress: 10 } : q
      ))

      try {
        const result = await processFile(item.file)

        setFileQueue(prev => prev.map(q =>
          q.id === item.id
            ? { ...q, status: 'success', progress: 100, content: result.content, type: result.type }
            : q
        ))
      } catch (err) {
        setFileQueue(prev => prev.map(q =>
          q.id === item.id
            ? { ...q, status: 'error', progress: 0, error: err instanceof Error ? err.message : 'Fehler' }
            : q
        ))
      }
    }

    setIsProcessingQueue(false)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFileQueue(files)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      processFileQueue(files)
    }
  }

  const handleSubmit = () => {
    if (fileQueue.length > 0) {
      // Batch upload mode
      const successfulDocs = fileQueue
        .filter(item => item.status === 'success' && item.content)
        .map(item => ({
          name: item.name,
          content: item.content!,
          type: item.type || 'text',
        }))

      if (successfulDocs.length === 0) {
        setError('Keine Dokumente wurden erfolgreich verarbeitet')
        return
      }

      if (onBatchUpload) {
        onBatchUpload(successfulDocs)
      } else {
        // Fallback: upload one by one
        successfulDocs.forEach(doc => onUpload(doc))
      }
      return
    }

    // Single file mode
    if (!content.trim() || !name.trim()) {
      setError('Name und Inhalt sind erforderlich')
      return
    }

    onUpload({
      name: name.trim(),
      content: content.trim(),
      type: fileType,
    })
  }

  const resetUpload = () => {
    setUploadState('idle')
    setContent('')
    setName('')
    setError(null)
    setProgress(0)
    setFileQueue([])
    setIsProcessingQueue(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFromQueue = (id: string) => {
    setFileQueue(prev => prev.filter(item => item.id !== id))
  }

  const updateQueueItemName = (id: string, newName: string) => {
    setFileQueue(prev => prev.map(item =>
      item.id === id ? { ...item, name: newName } : item
    ))
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const successfulUploads = fileQueue.filter(item => item.status === 'success').length
  const totalInQueue = fileQueue.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-900 rounded-2xl border border-surface-800 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-surface-800 flex-shrink-0">
          <h2 className="text-xl font-semibold text-surface-100">
            {fileQueue.length > 1 ? 'Dokumente hinzufügen' : 'Dokument hinzufügen'}
          </h2>
          <p className="text-sm text-surface-400 mt-1">
            Laden Sie Dokumente hoch (TXT, PDF, DOCX) oder fügen Sie Text direkt ein
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="flex rounded-lg bg-surface-800 p-1">
            <button
              onClick={() => { setMode('upload'); resetUpload(); }}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'upload'
                  ? 'bg-surface-700 text-surface-100'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              Dateien hochladen
            </button>
            <button
              onClick={() => { setMode('paste'); resetUpload(); }}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'paste'
                  ? 'bg-surface-700 text-surface-100'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              Text einfügen
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {mode === 'upload' ? (
            <>
              {/* File Queue Display */}
              {fileQueue.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-surface-200">
                      {isProcessingQueue
                        ? `Verarbeite ${successfulUploads}/${totalInQueue} Dateien...`
                        : `${successfulUploads}/${totalInQueue} Dateien bereit`
                      }
                    </h3>
                    <button
                      onClick={resetUpload}
                      className="text-sm text-surface-400 hover:text-surface-200"
                    >
                      Zurücksetzen
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {fileQueue.map(item => (
                      <div
                        key={item.id}
                        className={`border rounded-lg p-3 ${
                          item.status === 'success' ? 'border-green-500/30 bg-green-500/5' :
                          item.status === 'error' ? 'border-red-500/30 bg-red-500/5' :
                          item.status === 'loading' ? 'border-primary-500/30 bg-primary-500/5' :
                          'border-surface-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Status Icon */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            item.status === 'success' ? 'bg-green-500/20' :
                            item.status === 'error' ? 'bg-red-500/20' :
                            item.status === 'loading' ? 'bg-primary-500/20' :
                            'bg-surface-700'
                          }`}>
                            {item.status === 'loading' ? (
                              <svg className="w-4 h-4 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : item.status === 'success' ? (
                              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : item.status === 'error' ? (
                              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            {item.status === 'success' ? (
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateQueueItemName(item.id, e.target.value)}
                                className="w-full bg-transparent text-surface-200 text-sm font-medium focus:outline-none focus:bg-surface-800 px-1 rounded"
                              />
                            ) : (
                              <p className="text-surface-200 text-sm font-medium truncate">{item.name}</p>
                            )}
                            {item.status === 'error' && (
                              <p className="text-red-400 text-xs mt-0.5">{item.error}</p>
                            )}
                            {item.status === 'success' && item.content && (
                              <p className="text-surface-500 text-xs mt-0.5">
                                {item.content.trim().split(/\s+/).filter(Boolean).length} Wörter
                              </p>
                            )}
                          </div>

                          {/* Remove Button */}
                          {!isProcessingQueue && (
                            <button
                              onClick={() => removeFromQueue(item.id)}
                              className="p-1 hover:bg-surface-700 rounded text-surface-400 hover:text-surface-200"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {item.status === 'loading' && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add More Files */}
                  {!isProcessingQueue && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 border border-dashed border-surface-700 rounded-lg text-surface-400 hover:text-surface-200 hover:border-surface-600 text-sm transition-colors"
                    >
                      + Weitere Dateien hinzufügen
                    </button>
                  )}
                </div>
              ) : uploadState === 'idle' ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-primary-500 bg-primary-500/5'
                      : 'border-surface-700 hover:border-surface-600'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.pdf,.docx"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center">
                      <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-surface-200 font-medium">
                        Dateien hierher ziehen oder klicken
                      </p>
                      <p className="text-sm text-surface-500 mt-1">
                        TXT, PDF, DOCX (max. 10MB) - Mehrere Dateien möglich
                      </p>
                    </div>
                    {/* File type icons */}
                    <div className="flex items-center gap-4 mt-2">
                      <FileTypeIcon type="txt" />
                      <FileTypeIcon type="pdf" />
                      <FileTypeIcon type="docx" />
                    </div>
                  </div>
                </div>
              ) : uploadState === 'loading' ? (
                <div className="border-2 border-surface-700 rounded-xl p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <p className="text-surface-200 font-medium mb-3">Datei wird verarbeitet...</p>
                  <div className="max-w-xs mx-auto">
                    <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-surface-500 mt-2">{Math.round(progress)}%</p>
                  </div>
                </div>
              ) : (uploadState === 'success' || uploadState === 'error') && content ? (
                <div className="border-2 border-surface-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileTypeIcon type={fileType as 'txt' | 'pdf' | 'docx'} />
                      <span className="text-surface-200 font-medium">{name}</span>
                    </div>
                    <button
                      onClick={resetUpload}
                      className="text-sm text-surface-400 hover:text-surface-200"
                    >
                      Andere Datei
                    </button>
                  </div>
                  <p className="text-sm text-surface-400 line-clamp-3">{content}</p>
                  <p className="text-xs text-surface-500 mt-2">{wordCount} Wörter extrahiert</p>
                </div>
              ) : null}

              {/* Hidden file input for adding more files */}
              {fileQueue.length > 0 && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.docx"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              )}
            </>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Text hier einfügen..."
              className="w-full h-48 px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-mono text-sm"
            />
          )}

          {/* Document Name - only for single file or paste mode */}
          {(fileQueue.length === 0 || mode === 'paste') && (
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Dokumentname
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Interview_001_Schmidt"
                className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>
          )}

          {/* Word count for paste mode */}
          {mode === 'paste' && content && (
            <p className="text-xs text-surface-500">{wordCount} Wörter</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-800 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 font-medium"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isProcessingQueue ||
              (fileQueue.length > 0 ? successfulUploads === 0 : !content.trim() || !name.trim())
            }
            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:bg-surface-700 disabled:text-surface-500 text-white font-medium transition-colors"
          >
            {fileQueue.length > 1
              ? `${successfulUploads} Dokumente hinzufügen`
              : 'Dokument hinzufügen'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

function FileTypeIcon({ type }: { type: 'txt' | 'pdf' | 'docx' }) {
  const config = {
    txt: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'TXT' },
    pdf: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'PDF' },
    docx: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', label: 'DOCX' },
  }

  const { bg, text, label } = config[type] || config.txt

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${bg}`}>
      <svg className={`w-4 h-4 ${text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className={`text-xs font-medium ${text}`}>{label}</span>
    </div>
  )
}

// ============================================
// FILE PARSING UTILITIES
// ============================================

async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Textdatei'))
    reader.readAsText(file)
  })
}

async function parsePDF(file: File, onProgress?: (progress: number) => void): Promise<string> {
  try {
    // Dynamic import of pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist')

    // Set worker source using local import for Vite
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()

    const arrayBuffer = await file.arrayBuffer()
    onProgress?.(0.1)

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    onProgress?.(0.2)

    const textParts: string[] = []
    const totalPages = pdf.numPages

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (pageText) {
        textParts.push(pageText)
      }

      onProgress?.(0.2 + (i / totalPages) * 0.8)
    }

    return textParts.join('\n\n')
  } catch (err: any) {
    console.error('PDF parsing error:', err)
    if (err.message?.includes('pdfjs-dist')) {
      throw new Error('PDF-Bibliothek nicht gefunden. Bitte führen Sie aus: npm install pdfjs-dist')
    }
    throw new Error('PDF konnte nicht verarbeitet werden: ' + (err.message || 'Unbekannter Fehler'))
  }
}

async function parseDOCX(file: File, onProgress?: (progress: number) => void): Promise<string> {
  try {
    // Dynamic import of mammoth
    const mammoth = await import('mammoth')
    onProgress?.(0.2)

    const arrayBuffer = await file.arrayBuffer()
    onProgress?.(0.4)

    const result = await mammoth.extractRawText({ arrayBuffer })
    onProgress?.(1)

    if (result.messages.length > 0) {
      console.warn('DOCX parsing warnings:', result.messages)
    }

    return result.value
  } catch (err: any) {
    console.error('DOCX parsing error:', err)
    if (err.message?.includes('mammoth')) {
      throw new Error('DOCX-Bibliothek nicht gefunden. Bitte führen Sie aus: npm install mammoth')
    }
    throw new Error('DOCX konnte nicht verarbeitet werden: ' + (err.message || 'Unbekannter Fehler'))
  }
}
