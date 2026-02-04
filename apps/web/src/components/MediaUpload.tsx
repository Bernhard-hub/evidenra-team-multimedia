import { useState, useCallback, useRef } from 'react'
import {
  transcribeFile,
  isSupportedMediaFile,
  getMediaDuration,
  formatTimestamp,
  transcriptionToDocumentContent,
  hasOpenAIKey,
  type TranscriptionResult,
} from '@/lib/transcription'

interface MediaUploadProps {
  onUpload: (document: { name: string; content: string; type: string; duration?: number }) => void
  onClose: () => void
}

type UploadState = 'idle' | 'loading' | 'transcribing' | 'success' | 'error'

export default function MediaUpload({ onUpload, onClose }: MediaUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null)
  const [name, setName] = useState('')
  const [includeTimestamps, setIncludeTimestamps] = useState(true)
  const [mediaDuration, setMediaDuration] = useState(0)
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

  const processFile = async (file: File) => {
    if (!isSupportedMediaFile(file)) {
      setError('Nicht unterstütztes Dateiformat. Unterstützt: MP3, WAV, MP4, WebM, OGG, M4A')
      return
    }

    setUploadState('loading')
    setProgress(5)
    setStatus('Lade Mediendatei...')
    setError(null)

    const baseName = file.name.replace(/\.[^/.]+$/, '')
    setName(baseName)

    try {
      // Get duration
      const duration = await getMediaDuration(file)
      setMediaDuration(duration)
      setProgress(10)

      // Start transcription
      setUploadState('transcribing')
      setStatus('Starte Transkription...')

      const result = await transcribeFile(file, (p, s) => {
        setProgress(10 + p * 0.9)
        setStatus(s)
      })

      setTranscription(result)
      setUploadState('success')
      setProgress(100)
      setStatus('Transkription abgeschlossen!')
    } catch (err) {
      console.error('Media processing error:', err)
      setError(err instanceof Error ? err.message : 'Fehler bei der Verarbeitung')
      setUploadState('error')
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
    if (!transcription || !name.trim()) {
      setError('Name und Transkription sind erforderlich')
      return
    }

    const content = transcriptionToDocumentContent(transcription, includeTimestamps)

    onUpload({
      name: name.trim(),
      content,
      type: 'media',
      duration: mediaDuration,
    })
  }

  const resetUpload = () => {
    setUploadState('idle')
    setTranscription(null)
    setName('')
    setError(null)
    setProgress(0)
    setStatus('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const wordCount = transcription?.text.trim().split(/\s+/).filter(Boolean).length || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-900 rounded-2xl border border-surface-800 shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-surface-800">
          <h2 className="text-xl font-semibold text-surface-100">Audio/Video transkribieren</h2>
          <p className="text-sm text-surface-400 mt-1">
            Laden Sie eine Audio- oder Videodatei hoch zur automatischen Transkription
          </p>
          {!hasOpenAIKey() && (
            <p className="text-xs text-amber-400 mt-2">
              Demo-Modus aktiv. Für echte Transkription OpenAI API-Key in Einstellungen hinzufügen.
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {uploadState === 'idle' && (
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
                accept="audio/*,video/*,.mp3,.wav,.mp4,.webm,.ogg,.m4a"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </div>
                <div>
                  <p className="text-surface-200 font-medium">
                    Audio/Video hierher ziehen oder klicken
                  </p>
                  <p className="text-sm text-surface-500 mt-1">
                    MP3, WAV, MP4, WebM, OGG, M4A (max. 25MB)
                  </p>
                </div>
                {/* Format icons */}
                <div className="flex items-center gap-3 mt-2">
                  <MediaTypeIcon type="audio" />
                  <MediaTypeIcon type="video" />
                </div>
              </div>
            </div>
          )}

          {(uploadState === 'loading' || uploadState === 'transcribing') && (
            <div className="border-2 border-surface-700 rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-surface-200 font-medium mb-1">{status}</p>
              <p className="text-sm text-surface-500 mb-3">
                {uploadState === 'transcribing' ? 'KI analysiert die Audiodaten...' : 'Bitte warten...'}
              </p>
              <div className="max-w-xs mx-auto">
                <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-surface-500 mt-2">{Math.round(progress)}%</p>
              </div>
            </div>
          )}

          {(uploadState === 'success' || uploadState === 'error') && transcription && (
            <div className="border-2 border-surface-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MediaTypeIcon type="audio" />
                  <span className="text-surface-200 font-medium">{name}</span>
                  <span className="text-xs text-surface-500">
                    ({formatTimestamp(mediaDuration)})
                  </span>
                </div>
                <button
                  onClick={resetUpload}
                  className="text-sm text-surface-400 hover:text-surface-200"
                >
                  Andere Datei
                </button>
              </div>

              {/* Transcript Preview */}
              <div className="bg-surface-800 rounded-lg p-3 max-h-48 overflow-y-auto mb-3">
                <pre className="text-sm text-surface-300 whitespace-pre-wrap font-mono">
                  {transcriptionToDocumentContent(transcription, includeTimestamps).slice(0, 500)}
                  {transcription.text.length > 500 && '...'}
                </pre>
              </div>

              <div className="flex items-center justify-between text-xs text-surface-500">
                <span>{wordCount} Wörter · {transcription.segments.length} Segmente</span>
                <span>Sprache: {transcription.language.toUpperCase()}</span>
              </div>
            </div>
          )}

          {/* Document Name */}
          {transcription && (
            <>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">
                  Dokumentname
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Interview_Audio_001"
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>

              {/* Options */}
              <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTimestamps}
                  onChange={(e) => setIncludeTimestamps(e.target.checked)}
                  className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500/50"
                />
                <span className="text-sm text-surface-200">Zeitstempel im Transkript einschließen</span>
              </label>
            </>
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
            disabled={!transcription || !name.trim() || uploadState === 'loading' || uploadState === 'transcribing'}
            className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-surface-700 disabled:text-surface-500 text-white font-medium transition-colors"
          >
            Transkript hinzufügen
          </button>
        </div>
      </div>
    </div>
  )
}

function MediaTypeIcon({ type }: { type: 'audio' | 'video' }) {
  if (type === 'video') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10">
        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-medium text-blue-400">Video</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-500/10">
      <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
      <span className="text-xs font-medium text-purple-400">Audio</span>
    </div>
  )
}
