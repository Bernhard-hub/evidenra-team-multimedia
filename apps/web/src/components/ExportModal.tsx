import { useState } from 'react'

type ExportFormat = 'xlsx' | 'csv' | 'json' | 'maxqda' | 'atlas'

interface ExportModalProps {
  projectName: string
  documentCount: number
  codingCount: number
  onExport: (format: ExportFormat, options: ExportOptions) => void
  onClose: () => void
}

interface ExportOptions {
  includeDocuments: boolean
  includeCodes: boolean
  includeCodings: boolean
  includeMemos: boolean
  includeMetadata: boolean
}

const formats: {
  id: ExportFormat
  name: string
  description: string
  icon: string
  extension: string
}[] = [
  {
    id: 'xlsx',
    name: 'Excel (XLSX)',
    description: 'Microsoft Excel Format mit mehreren Arbeitsblättern',
    icon: '📊',
    extension: '.xlsx',
  },
  {
    id: 'csv',
    name: 'CSV',
    description: 'Komma-separierte Werte, universell kompatibel',
    icon: '📄',
    extension: '.csv',
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'Strukturiertes Datenformat für Entwickler',
    icon: '{ }',
    extension: '.json',
  },
  {
    id: 'maxqda',
    name: 'MAXQDA',
    description: 'Import-Format für MAXQDA Software',
    icon: '🔷',
    extension: '.mx22',
  },
  {
    id: 'atlas',
    name: 'Atlas.ti',
    description: 'Import-Format für Atlas.ti Software',
    icon: '🔶',
    extension: '.atlproj',
  },
]

export default function ExportModal({
  projectName,
  documentCount,
  codingCount,
  onExport,
  onClose,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('xlsx')
  const [options, setOptions] = useState<ExportOptions>({
    includeDocuments: true,
    includeCodes: true,
    includeCodings: true,
    includeMemos: true,
    includeMetadata: true,
  })
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    // Simulate export delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    onExport(selectedFormat, options)
    setIsExporting(false)
    onClose()
  }

  const selectedFormatInfo = formats.find((f) => f.id === selectedFormat)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-900 rounded-2xl border border-surface-800 shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-surface-800">
          <h2 className="text-xl font-semibold text-surface-100">Projekt exportieren</h2>
          <p className="text-sm text-surface-400 mt-1">{projectName}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="flex gap-4">
            <div className="flex-1 p-3 rounded-lg bg-surface-800 text-center">
              <p className="text-2xl font-bold text-surface-100">{documentCount}</p>
              <p className="text-xs text-surface-500">Dokumente</p>
            </div>
            <div className="flex-1 p-3 rounded-lg bg-surface-800 text-center">
              <p className="text-2xl font-bold text-primary-400">{codingCount}</p>
              <p className="text-xs text-surface-500">Kodierungen</p>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-3">
              Export-Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedFormat === format.id
                      ? 'border-primary-500 bg-primary-500/5'
                      : 'border-surface-700 hover:border-surface-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{format.icon}</span>
                    <span className="font-medium text-surface-100 text-sm">{format.name}</span>
                  </div>
                  <p className="text-xs text-surface-500">{format.extension}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-3">
              Inhalt
            </label>
            <div className="space-y-2">
              {[
                { key: 'includeDocuments', label: 'Dokumente' },
                { key: 'includeCodes', label: 'Code-System' },
                { key: 'includeCodings', label: 'Kodierungen' },
                { key: 'includeMemos', label: 'Memos & Kommentare' },
                { key: 'includeMetadata', label: 'Metadaten' },
              ].map((option) => (
                <label
                  key={option.key}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={options[option.key as keyof ExportOptions]}
                    onChange={(e) =>
                      setOptions({ ...options, [option.key]: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500/50"
                  />
                  <span className="text-sm text-surface-200">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-800 flex justify-between items-center">
          <p className="text-sm text-surface-500">
            {selectedFormatInfo?.description}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 font-medium"
            >
              Abbrechen
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Exportiere...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Exportieren
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
