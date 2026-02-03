import { useState, useCallback } from 'react'

interface DocumentUploadProps {
  onUpload: (document: { name: string; content: string; type: string }) => void
  onClose: () => void
}

export default function DocumentUpload({ onUpload, onClose }: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [content, setContent] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'upload' | 'paste'>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const processFile = async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const text = await file.text()
      setContent(text)
      setName(file.name.replace(/\.[^/.]+$/, ''))
      setFile(file)
    } catch (err) {
      setError('Fehler beim Lesen der Datei')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files?.[0]) {
      processFile(files[0])
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.[0]) {
      processFile(files[0])
    }
  }

  const handleSubmit = () => {
    if (!content.trim() || !name.trim()) {
      setError('Name und Inhalt sind erforderlich')
      return
    }

    onUpload({
      name: name.trim(),
      content: content.trim(),
      type: file?.type || 'text/plain',
    })
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-900 rounded-2xl border border-surface-800 shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-surface-800">
          <h2 className="text-xl font-semibold text-surface-100">Dokument hinzufügen</h2>
          <p className="text-sm text-surface-400 mt-1">
            Laden Sie ein Textdokument hoch oder fügen Sie Text direkt ein
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 pt-4">
          <div className="flex rounded-lg bg-surface-800 p-1">
            <button
              onClick={() => setMode('upload')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'upload'
                  ? 'bg-surface-700 text-surface-100'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              Datei hochladen
            </button>
            <button
              onClick={() => setMode('paste')}
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
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {mode === 'upload' ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary-500 bg-primary-500/5'
                  : 'border-surface-700 hover:border-surface-600'
              }`}
            >
              <input
                type="file"
                accept=".txt,.md,.rtf,.doc,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-surface-200 font-medium">
                    Datei hierher ziehen oder klicken
                  </p>
                  <p className="text-sm text-surface-500 mt-1">
                    TXT, MD, RTF, DOC, DOCX
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Text hier einfügen..."
              className="w-full h-48 px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          )}

          {/* Document Name */}
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

          {/* Preview */}
          {content && (
            <div className="p-4 rounded-lg bg-surface-800 border border-surface-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-surface-300">Vorschau</span>
                <span className="text-xs text-surface-500">{wordCount} Wörter</span>
              </div>
              <p className="text-sm text-surface-400 line-clamp-3">{content}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 font-medium"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || !name.trim() || isLoading}
            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:bg-surface-700 disabled:text-surface-500 text-white font-medium transition-colors"
          >
            {isLoading ? 'Wird verarbeitet...' : 'Hinzufügen'}
          </button>
        </div>
      </div>
    </div>
  )
}
