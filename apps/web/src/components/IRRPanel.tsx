import { useState, useMemo } from 'react'
import type { Coding, Code, Document } from '@/stores/projectStore'
import {
  calculateCohensKappa,
  calculatePercentAgreement,
  calculateKrippendorffsAlpha,
  extractCoders,
  calculateDemoIRR,
  type IRRResult,
  type Disagreement,
} from '@/lib/irr'

interface IRRPanelProps {
  codings: Coding[]
  codes: Code[]
  documents: Document[]
}

const metrics = [
  {
    id: 'cohens-kappa',
    name: "Cohen's Kappa",
    description: 'Für 2 Kodierer',
    minCoders: 2,
    maxCoders: 2,
  },
  {
    id: 'fleiss-kappa',
    name: "Fleiss' Kappa",
    description: 'Für 3+ Kodierer',
    minCoders: 3,
    maxCoders: null,
  },
  {
    id: 'krippendorff-alpha',
    name: "Krippendorff's Alpha",
    description: 'Beliebige Anzahl, robuster',
    minCoders: 2,
    maxCoders: null,
  },
  {
    id: 'percent-agreement',
    name: 'Prozentuale Übereinstimmung',
    description: 'Einfache Berechnung',
    minCoders: 2,
    maxCoders: null,
  },
]

const interpretationColors: Record<string, string> = {
  'Poor': 'text-red-400 bg-red-400/10',
  'Slight': 'text-orange-400 bg-orange-400/10',
  'Fair': 'text-yellow-400 bg-yellow-400/10',
  'Moderate': 'text-blue-400 bg-blue-400/10',
  'Substantial': 'text-green-400 bg-green-400/10',
  'Almost Perfect': 'text-primary-400 bg-primary-400/10',
}

export default function IRRPanel({ codings, codes, documents }: IRRPanelProps) {
  // Extract coders from codings data
  const coders = useMemo(() => {
    const extracted = extractCoders(codings)
    // Add demo coders if not enough
    if (extracted.length < 2) {
      return [
        { id: 'demo-1', name: 'Anna Schmidt', codings: codings.slice(0, Math.floor(codings.length / 2)) },
        { id: 'demo-2', name: 'Peter Meyer', codings: codings.slice(Math.floor(codings.length / 2)) },
        { id: 'demo-3', name: 'Lisa Weber', codings: codings.slice(0, Math.floor(codings.length / 3)) },
      ]
    }
    return extracted
  }, [codings])

  const [selectedMetric, setSelectedMetric] = useState('percent-agreement')
  const [selectedCoderIds, setSelectedCoderIds] = useState<string[]>(coders.slice(0, 3).map(c => c.id))
  const [result, setResult] = useState<IRRResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showDisagreements, setShowDisagreements] = useState(false)

  const metricInfo = metrics.find((m) => m.id === selectedMetric)

  const selectedCoders = useMemo(() =>
    coders.filter(c => selectedCoderIds.includes(c.id)),
    [coders, selectedCoderIds]
  )

  const canCalculate = useMemo(() => {
    if (!metricInfo) return false
    const count = selectedCoderIds.length
    if (count < metricInfo.minCoders) return false
    if (metricInfo.maxCoders && count > metricInfo.maxCoders) return false
    return true
  }, [selectedCoderIds, metricInfo])

  const handleCalculate = async () => {
    setIsCalculating(true)

    // Small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500))

    let calculatedResult: IRRResult

    // Use demo calculation if not enough real data
    if (codings.length < 10 || documents.length === 0) {
      calculatedResult = calculateDemoIRR(selectedMetric, selectedCoderIds.length)
    } else {
      switch (selectedMetric) {
        case 'cohens-kappa':
          if (selectedCoders.length === 2) {
            calculatedResult = calculateCohensKappa(
              selectedCoders[0],
              selectedCoders[1],
              documents,
              codes
            )
          } else {
            calculatedResult = calculateDemoIRR(selectedMetric, 2)
          }
          break
        case 'krippendorff-alpha':
          calculatedResult = calculateKrippendorffsAlpha(selectedCoders, documents, codes)
          break
        case 'percent-agreement':
        default:
          calculatedResult = calculatePercentAgreement(selectedCoders, documents, codes)
      }
    }

    setResult(calculatedResult)
    setIsCalculating(false)
  }

  const toggleCoder = (coderId: string) => {
    setSelectedCoderIds((prev) =>
      prev.includes(coderId)
        ? prev.filter((id) => id !== coderId)
        : [...prev, coderId]
    )
    setResult(null)
  }

  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800">
      <div className="p-4 border-b border-surface-800">
        <h3 className="font-medium text-surface-100">Inter-Rater-Reliabilität</h3>
        <p className="text-sm text-surface-500 mt-1">
          Berechnen Sie die Übereinstimmung zwischen Kodierern
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Metric Selection */}
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">Metrik</label>
          <select
            value={selectedMetric}
            onChange={(e) => {
              setSelectedMetric(e.target.value)
              setResult(null)
            }}
            className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            {metrics.map((metric) => (
              <option key={metric.id} value={metric.id}>
                {metric.name} - {metric.description}
              </option>
            ))}
          </select>
        </div>

        {/* Coder Selection */}
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">
            Kodierer auswählen ({selectedCoderIds.length} von {coders.length})
          </label>
          <div className="space-y-1">
            {coders.map((coder) => (
              <label
                key={coder.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCoderIds.includes(coder.id)}
                  onChange={() => toggleCoder(coder.id)}
                  className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500/50"
                />
                <span className="flex-1 text-sm text-surface-200">{coder.name}</span>
                <span className="text-xs text-surface-500">{coder.codings.length} Kodierungen</span>
              </label>
            ))}
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={!canCalculate || isCalculating}
          className="w-full px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:bg-surface-700 disabled:text-surface-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isCalculating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Berechne...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              IRR berechnen
            </>
          )}
        </button>

        {!canCalculate && selectedCoderIds.length > 0 && (
          <p className="text-xs text-yellow-400 text-center">
            {metricInfo?.name} benötigt {metricInfo?.minCoders}
            {metricInfo?.maxCoders ? ` bis ${metricInfo.maxCoders}` : '+'} Kodierer
          </p>
        )}

        {/* Result */}
        {result && (
          <div className="mt-4 p-4 rounded-xl bg-surface-800 border border-surface-700">
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-surface-100">
                {result.value.toFixed(3)}
              </p>
              <p className="text-sm text-surface-400 mt-1">
                {metrics.find((m) => m.id === result.metric)?.name}
              </p>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                  interpretationColors[result.interpretation] || 'text-surface-400 bg-surface-700'
                }`}
              >
                {result.interpretation}
              </span>
            </div>

            {/* Interpretation Scale */}
            <div className="mb-4">
              <div className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-blue-500 to-green-500 relative">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-surface-900 shadow"
                  style={{ left: `${Math.min(result.value * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-surface-500 mt-1">
                <span>0.0</span>
                <span>0.5</span>
                <span>1.0</span>
              </div>
            </div>

            {/* Pairwise Results */}
            {result.pairwise && (
              <div className="border-t border-surface-700 pt-3 mt-3">
                <p className="text-xs font-medium text-surface-400 mb-2">Paarweise Übereinstimmung</p>
                <div className="space-y-1">
                  {result.pairwise.map((pair, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-surface-300">
                        {pair.coder1} ↔ {pair.coder2}
                      </span>
                      <span className="font-mono text-surface-100">{pair.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Landis & Koch Scale */}
            <div className="border-t border-surface-700 pt-3 mt-3">
              <p className="text-xs font-medium text-surface-400 mb-2">Landis & Koch Skala</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-surface-500">&lt; 0.00</span><span className="text-red-400">Poor</span>
                <span className="text-surface-500">0.00 - 0.20</span><span className="text-orange-400">Slight</span>
                <span className="text-surface-500">0.21 - 0.40</span><span className="text-yellow-400">Fair</span>
                <span className="text-surface-500">0.41 - 0.60</span><span className="text-blue-400">Moderate</span>
                <span className="text-surface-500">0.61 - 0.80</span><span className="text-green-400">Substantial</span>
                <span className="text-surface-500">0.81 - 1.00</span><span className="text-primary-400">Almost Perfect</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
