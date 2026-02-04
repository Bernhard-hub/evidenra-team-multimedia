import { useState, useRef } from 'react'

interface ImportWizardProps {
  projectId: string
  onImport: (data: ImportedData) => Promise<void>
  onClose: () => void
}

type ImportFormat = 'refi-qda' | 'atlas' | 'nvivo' | 'maxqda' | 'evidenra'

export interface ImportedData {
  format: ImportFormat
  documents: ImportedDocument[]
  codes: ImportedCode[]
  codings: ImportedCoding[]
  memos?: ImportedMemo[]
}

interface ImportedDocument {
  name: string
  content: string
  type: string
  metadata?: Record<string, any>
}

interface ImportedCode {
  id: string
  name: string
  color: string
  description?: string
  parentId?: string
}

interface ImportedCoding {
  codeId: string
  documentName: string
  selectedText: string
  startOffset?: number
  endOffset?: number
  comment?: string
}

interface ImportedMemo {
  title: string
  content: string
  type: string
}

type Step = 'select' | 'upload' | 'mapping' | 'preview' | 'importing'

export default function ImportWizard({ projectId, onImport, onClose }: ImportWizardProps) {
  const [step, setStep] = useState<Step>('select')
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ImportedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formats = [
    {
      id: 'refi-qda' as ImportFormat,
      name: 'REFI-QDA',
      description: 'Standard-Austauschformat für QDA-Software',
      extension: '.qdpx',
      icon: 'M4 6h16M4 12h16m-7 6h7',
    },
    {
      id: 'atlas' as ImportFormat,
      name: 'ATLAS.ti',
      description: 'ATLAS.ti Projektexport',
      extension: '.atlproj, .xml',
      icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
    },
    {
      id: 'nvivo' as ImportFormat,
      name: 'NVivo',
      description: 'NVivo Projektexport (.nvp, .xml)',
      extension: '.nvp, .xml',
      icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    },
    {
      id: 'maxqda' as ImportFormat,
      name: 'MAXQDA',
      description: 'MAXQDA Projektexport',
      extension: '.mx20, .xml',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    },
    {
      id: 'evidenra' as ImportFormat,
      name: 'Evidenra',
      description: 'Evidenra JSON-Export',
      extension: '.json',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
  ]

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setIsProcessing(true)
    setProgress(10)

    try {
      const data = await parseFile(selectedFile, selectedFormat!)
      setProgress(80)
      setParsedData(data)
      setProgress(100)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Parsen der Datei')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!parsedData) return

    setStep('importing')
    setProgress(0)

    try {
      await onImport(parsedData)
      setProgress(100)
      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 500))
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Import')
      setStep('preview')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-900 rounded-2xl border border-surface-800 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-surface-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-surface-100">Projekt importieren</h2>
              <p className="text-sm text-surface-400 mt-1">
                Importieren Sie Daten aus anderen QDA-Programmen
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-800 text-surface-400"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {(['select', 'upload', 'preview'] as Step[]).map((s, idx) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s ? 'bg-primary-500 text-white' :
                  ['upload', 'preview'].indexOf(step) > idx ? 'bg-green-500 text-white' :
                  'bg-surface-800 text-surface-500'
                }`}>
                  {['upload', 'preview', 'importing'].indexOf(step) > idx ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : idx + 1}
                </div>
                {idx < 2 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    ['upload', 'preview'].indexOf(step) > idx ? 'bg-green-500' : 'bg-surface-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Format Selection */}
          {step === 'select' && (
            <div className="space-y-3">
              <p className="text-sm text-surface-400 mb-4">
                Wählen Sie das Quellformat aus:
              </p>
              {formats.map(format => (
                <button
                  key={format.id}
                  onClick={() => {
                    setSelectedFormat(format.id)
                    setStep('upload')
                  }}
                  className="w-full p-4 rounded-xl border border-surface-700 hover:border-primary-500/50 hover:bg-surface-800/50 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center">
                      <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={format.icon} />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-surface-100">{format.name}</h3>
                      <p className="text-xs text-surface-500">{format.description}</p>
                    </div>
                    <span className="text-xs text-surface-500 bg-surface-800 px-2 py-1 rounded">
                      {format.extension}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: File Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('select')}
                className="text-sm text-surface-400 hover:text-surface-200 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Zurück zur Formatauswahl
              </button>

              <div className="p-4 rounded-lg bg-surface-800/50 border border-surface-700">
                <p className="text-sm text-surface-300 mb-1">
                  Ausgewähltes Format: <strong>{formats.find(f => f.id === selectedFormat)?.name}</strong>
                </p>
                <p className="text-xs text-surface-500">
                  Unterstützte Dateitypen: {formats.find(f => f.id === selectedFormat)?.extension}
                </p>
              </div>

              {isProcessing ? (
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
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-surface-700 rounded-xl p-8 text-center cursor-pointer hover:border-surface-600 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".qdpx,.xml,.json,.nvp,.mx20,.atlproj"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-surface-200 font-medium">
                    Datei auswählen oder hierher ziehen
                  </p>
                  <p className="text-sm text-surface-500 mt-1">
                    {formats.find(f => f.id === selectedFormat)?.extension}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && parsedData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-surface-300">Import-Vorschau</h3>
                <button
                  onClick={() => {
                    setStep('upload')
                    setParsedData(null)
                    setFile(null)
                  }}
                  className="text-sm text-surface-400 hover:text-surface-200"
                >
                  Andere Datei wählen
                </button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-surface-800/50 rounded-xl">
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-100">{parsedData.documents.length}</p>
                  <p className="text-xs text-surface-500">Dokumente</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-100">{parsedData.codes.length}</p>
                  <p className="text-xs text-surface-500">Codes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-100">{parsedData.codings.length}</p>
                  <p className="text-xs text-surface-500">Kodierungen</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-100">{parsedData.memos?.length || 0}</p>
                  <p className="text-xs text-surface-500">Memos</p>
                </div>
              </div>

              {/* Code Preview */}
              {parsedData.codes.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-surface-400 mb-2">Codes ({parsedData.codes.length})</h4>
                  <div className="bg-surface-800/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {parsedData.codes.slice(0, 20).map((code, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: code.color + '20', color: code.color }}
                        >
                          {code.name}
                        </span>
                      ))}
                      {parsedData.codes.length > 20 && (
                        <span className="px-2 py-1 rounded text-xs bg-surface-700 text-surface-400">
                          +{parsedData.codes.length - 20} weitere
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Document Preview */}
              {parsedData.documents.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-surface-400 mb-2">Dokumente ({parsedData.documents.length})</h4>
                  <div className="bg-surface-800/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="space-y-1">
                      {parsedData.documents.slice(0, 10).map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-surface-300 truncate">{doc.name}</span>
                        </div>
                      ))}
                      {parsedData.documents.length > 10 && (
                        <p className="text-xs text-surface-500 mt-2">
                          +{parsedData.documents.length - 10} weitere Dokumente
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Importing */}
          {step === 'importing' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-surface-100 mb-2">Daten werden importiert...</h3>
              <p className="text-sm text-surface-400 mb-4">
                {parsedData?.documents.length || 0} Dokumente, {parsedData?.codes.length || 0} Codes, {parsedData?.codings.length || 0} Kodierungen
              </p>
              <div className="max-w-xs mx-auto">
                <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-800 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800"
          >
            Abbrechen
          </button>
          {step === 'preview' && (
            <button
              onClick={handleImport}
              className="px-6 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importieren
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// File parsing functions
async function parseFile(file: File, format: ImportFormat): Promise<ImportedData> {
  const text = await file.text()

  switch (format) {
    case 'evidenra':
      return parseEvidenraJSON(text)
    case 'refi-qda':
      return parseREFIQDA(text)
    case 'atlas':
    case 'nvivo':
    case 'maxqda':
      return parseGenericXML(text, format)
    default:
      throw new Error('Unbekanntes Format')
  }
}

function parseEvidenraJSON(text: string): ImportedData {
  try {
    const data = JSON.parse(text)

    return {
      format: 'evidenra',
      documents: (data.documents || []).map((d: any) => ({
        name: d.name,
        content: d.content,
        type: d.fileType || 'text',
      })),
      codes: (data.codes || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        color: c.color || '#3b82f6',
        description: c.description,
        parentId: c.parentId,
      })),
      codings: (data.codings || []).map((c: any) => ({
        codeId: c.codeId,
        documentName: c.documentId,
        selectedText: c.selectedText,
        startOffset: c.startOffset,
        endOffset: c.endOffset,
        comment: c.comment,
      })),
      memos: (data.memos || []).map((m: any) => ({
        title: m.title,
        content: m.content,
        type: m.type || 'free',
      })),
    }
  } catch (err) {
    throw new Error('Ungültiges JSON-Format')
  }
}

function parseREFIQDA(text: string): ImportedData {
  // REFI-QDA is typically a ZIP file containing XML
  // For simplicity, we'll handle the case where users provide the internal XML
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/xml')

  const documents: ImportedDocument[] = []
  const codes: ImportedCode[] = []
  const codings: ImportedCoding[] = []

  // Parse sources (documents)
  const sources = doc.querySelectorAll('Source')
  sources.forEach(source => {
    documents.push({
      name: source.getAttribute('name') || 'Unbenannt',
      content: source.textContent || '',
      type: 'text',
    })
  })

  // Parse codes
  const codeElements = doc.querySelectorAll('Code')
  codeElements.forEach(code => {
    codes.push({
      id: code.getAttribute('guid') || `code-${codes.length}`,
      name: code.getAttribute('name') || 'Unbenannt',
      color: code.getAttribute('color') || '#3b82f6',
      description: code.getAttribute('description') || undefined,
    })
  })

  // Parse codings
  const codingElements = doc.querySelectorAll('Coding')
  codingElements.forEach(coding => {
    codings.push({
      codeId: coding.getAttribute('codeGuid') || '',
      documentName: coding.getAttribute('sourceGuid') || '',
      selectedText: coding.textContent || '',
    })
  })

  return { format: 'refi-qda', documents, codes, codings }
}

function parseGenericXML(text: string, format: ImportFormat): ImportedData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/xml')

  const documents: ImportedDocument[] = []
  const codes: ImportedCode[] = []
  const codings: ImportedCoding[] = []
  const memos: ImportedMemo[] = []

  // Generic parsing - looks for common elements across formats
  // Documents
  doc.querySelectorAll('Document, Source, TextDocument, PrimaryDoc').forEach(el => {
    documents.push({
      name: el.getAttribute('name') || el.getAttribute('Name') || 'Unbenannt',
      content: el.textContent || '',
      type: 'text',
    })
  })

  // Codes
  doc.querySelectorAll('Code, Node, Thema').forEach(el => {
    codes.push({
      id: el.getAttribute('id') || el.getAttribute('guid') || `code-${codes.length}`,
      name: el.getAttribute('name') || el.getAttribute('Name') || 'Unbenannt',
      color: el.getAttribute('color') || el.getAttribute('Color') || generateColor(codes.length),
      description: el.getAttribute('description') || undefined,
    })
  })

  // Codings
  doc.querySelectorAll('Coding, Reference, Quotation').forEach(el => {
    codings.push({
      codeId: el.getAttribute('codeRef') || el.getAttribute('CodeRef') || '',
      documentName: el.getAttribute('docRef') || el.getAttribute('DocRef') || '',
      selectedText: el.textContent || '',
    })
  })

  // Memos
  doc.querySelectorAll('Memo, Annotation, Note').forEach(el => {
    memos.push({
      title: el.getAttribute('name') || 'Memo',
      content: el.textContent || '',
      type: 'free',
    })
  })

  return { format, documents, codes, codings, memos }
}

function generateColor(index: number): string {
  const colors = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']
  return colors[index % colors.length]
}
