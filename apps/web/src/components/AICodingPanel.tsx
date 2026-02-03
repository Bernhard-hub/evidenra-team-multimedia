import { useState } from 'react'

type CodingMethod = 'dynamic-personas' | 'three-expert' | 'calibrated-pattern' | 'ultra-turbo'

interface AICodingPanelProps {
  documentId: string
  documentName: string
  onStartCoding: (method: CodingMethod) => void
  onClose: () => void
  isProcessing?: boolean
  progress?: number
  statusMessage?: string
  error?: string | null
}

const methods: {
  id: CodingMethod
  name: string
  description: string
  pros: string[]
  speed: 'fast' | 'medium' | 'slow'
  reliability: 'high' | 'very-high' | 'highest'
}[] = [
  {
    id: 'dynamic-personas',
    name: 'Dynamic Personas',
    description: 'KI-Personas passen sich an den Textinhalt an und kodieren aus verschiedenen Fachperspektiven.',
    pros: ['Kontextadaptiv', 'Mehrdimensionale Analyse', 'Konsensvalidierung'],
    speed: 'medium',
    reliability: 'very-high',
  },
  {
    id: 'three-expert',
    name: 'Drei-Experten-System',
    description: 'Drei KI-Experten kodieren unabhängig. Nur Codes mit Konsens werden übernommen.',
    pros: ['Höchste Reliabilität', 'Simuliert Multi-Coder', 'Automatische IRR'],
    speed: 'slow',
    reliability: 'highest',
  },
  {
    id: 'calibrated-pattern',
    name: 'Kalibrierte Mustererkennung',
    description: 'Mustererkennung mit Kalibrierung an bestehenden Codes. Ideal für konsistente Kodierung.',
    pros: ['Konsistenz', 'TF-IDF Matching', 'Lernfähig'],
    speed: 'medium',
    reliability: 'very-high',
  },
  {
    id: 'ultra-turbo',
    name: 'Ultra Turbo',
    description: 'Schnellste Methode mit Single-Pass-Analyse. Gut für erste Exploration.',
    pros: ['Sehr schnell', 'Parallel', 'Explorativ'],
    speed: 'fast',
    reliability: 'high',
  },
]

export default function AICodingPanel({
  documentId,
  documentName,
  onStartCoding,
  onClose,
  isProcessing = false,
  progress = 0,
  statusMessage = '',
  error = null,
}: AICodingPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<CodingMethod>('three-expert')

  const speedLabels = {
    fast: { label: 'Schnell', color: 'text-green-400' },
    medium: { label: 'Mittel', color: 'text-yellow-400' },
    slow: { label: 'Langsam', color: 'text-orange-400' },
  }

  const reliabilityLabels = {
    high: { label: 'Hoch', color: 'text-blue-400' },
    'very-high': { label: 'Sehr hoch', color: 'text-purple-400' },
    highest: { label: 'Höchste', color: 'text-primary-400' },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={!isProcessing ? onClose : undefined} />
      <div className="relative w-full max-w-3xl bg-surface-900 rounded-2xl border border-surface-800 shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-surface-100">AI-Kodierung</h2>
              <p className="text-sm text-surface-400">{documentName}</p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 border-b border-surface-800">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-400">Fehler</h4>
                  <p className="text-sm text-red-300/80 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && !error ? (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <svg className="w-16 h-16 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    className="opacity-75 text-primary-500"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-surface-100 mb-2">
                {progress >= 100 ? 'Fertig!' : 'Kodierung läuft...'}
              </h3>
              <p className="text-surface-400 text-sm">
                {statusMessage || `${methods.find((m) => m.id === selectedMethod)?.name} analysiert das Dokument`}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-surface-400">Fortschritt</span>
                <span className="text-surface-300">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="mt-8 max-w-md mx-auto space-y-3">
              {[
                { label: 'Dokument analysieren', done: progress > 20 },
                { label: 'Personas initialisieren', done: progress > 40 },
                { label: 'Kodierung durchführen', done: progress > 60 },
                { label: 'Konsens berechnen', done: progress > 80 },
                { label: 'Ergebnisse aufbereiten', done: progress > 95 },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      step.done ? 'bg-green-500' : 'bg-surface-700'
                    }`}
                  >
                    {step.done ? (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-surface-500" />
                    )}
                  </div>
                  <span className={step.done ? 'text-surface-300' : 'text-surface-500'}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Method Selection */}
            <div className="p-6">
              <h3 className="text-sm font-medium text-surface-300 mb-4">Kodierungsmethode wählen</h3>
              <div className="grid gap-3">
                {methods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedMethod === method.id
                        ? 'border-primary-500 bg-primary-500/5'
                        : 'border-surface-700 hover:border-surface-600 hover:bg-surface-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-surface-100">{method.name}</h4>
                          {selectedMethod === method.id && (
                            <span className="px-2 py-0.5 rounded text-xs bg-primary-500/10 text-primary-400">
                              Ausgewählt
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-surface-400 mb-2">{method.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {method.pros.map((pro, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-xs bg-surface-800 text-surface-300"
                            >
                              {pro}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <div>
                          <span className="text-surface-500">Geschwindigkeit: </span>
                          <span className={speedLabels[method.speed].color}>
                            {speedLabels[method.speed].label}
                          </span>
                        </div>
                        <div>
                          <span className="text-surface-500">Reliabilität: </span>
                          <span className={reliabilityLabels[method.reliability].color}>
                            {reliabilityLabels[method.reliability].label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-surface-800 flex justify-between items-center">
              <p className="text-sm text-surface-500">
                Benötigt Claude API-Schlüssel in den Einstellungen
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 font-medium"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => onStartCoding(selectedMethod)}
                  className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Kodierung starten
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
