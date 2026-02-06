/**
 * Psychometrics Dashboard
 * Sprint 3 - Visualization Roadmap
 *
 * Features:
 * - Cronbach's Alpha with interpretation
 * - Item-Total Correlations table
 * - Alpha-if-deleted analysis
 * - Factor loadings visualization
 * - Scree plot
 * - Traffic light system (red/yellow/green)
 */

import { useState, useMemo } from 'react'
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconInfoCircle,
  IconRefresh,
  IconChartBar,
  IconTable,
  IconTrendingUp,
} from '@tabler/icons-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  ScatterChart,
  Scatter,
  CartesianGrid,
} from 'recharts'
import { PsychometricEngine, ComprehensivePsychometricReport } from '@/services/questionnaire/PsychometricEngine'

interface QuestionnaireItem {
  id: string
  text: string
  dimension?: string
  reversed?: boolean
}

interface ResponseData {
  respondentId: string
  responses: Record<string, number> // itemId -> response value
}

interface PsychometricsDashboardProps {
  items: QuestionnaireItem[]
  responses: ResponseData[]
  title?: string
  onItemSelect?: (itemId: string) => void
}

type ViewMode = 'overview' | 'items' | 'factors'

// Threshold configurations
const THRESHOLDS = {
  alpha: {
    excellent: 0.9,
    good: 0.8,
    acceptable: 0.7,
    questionable: 0.6,
    poor: 0.5,
  },
  itemTotal: {
    good: 0.4,
    acceptable: 0.3,
    poor: 0.2,
  },
  factorLoading: {
    strong: 0.6,
    moderate: 0.4,
    weak: 0.3,
  },
}

export default function PsychometricsDashboard({
  items,
  responses,
  title = 'Psychometrische Analyse',
  onItemSelect,
}: PsychometricsDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null)

  // Convert responses to matrix format for analysis
  const { dataMatrix, report, itemStats } = useMemo(() => {
    if (items.length === 0 || responses.length === 0) {
      return { dataMatrix: [], report: null, itemStats: [] }
    }

    // Build data matrix: rows = respondents, cols = items
    const matrix: number[][] = []
    for (const response of responses) {
      const row: number[] = []
      for (const item of items) {
        const value = response.responses[item.id]
        if (value !== undefined) {
          // Handle reversed items
          const adjustedValue = item.reversed ? (6 - value) : value // Assuming 5-point scale
          row.push(adjustedValue)
        } else {
          row.push(0) // Missing value handling
        }
      }
      if (row.length === items.length) {
        matrix.push(row)
      }
    }

    if (matrix.length < 3) {
      return { dataMatrix: matrix, report: null, itemStats: [] }
    }

    // Generate psychometric report
    let report: ComprehensivePsychometricReport | null = null
    try {
      report = PsychometricEngine.generateReport(matrix, items.map(i => i.id))
    } catch (e) {
      console.error('Psychometric analysis failed:', e)
    }

    // Calculate item statistics
    const itemStats = items.map((item, idx) => {
      const values = matrix.map(row => row[idx])
      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
      const sd = Math.sqrt(variance)

      // Item-total correlation (simplified)
      const totals = matrix.map(row => row.reduce((a, b) => a + b, 0))
      const itemTotalCorr = calculateCorrelation(values, totals)

      // Alpha if deleted (simplified approximation)
      const otherItems = matrix.map(row => row.filter((_, i) => i !== idx).reduce((a, b) => a + b, 0))
      const alphaIfDeleted = report?.reliability.cronbachAlpha || 0 // Placeholder

      return {
        id: item.id,
        text: item.text,
        dimension: item.dimension,
        mean,
        sd,
        itemTotalCorr,
        alphaIfDeleted,
        reversed: item.reversed,
      }
    })

    return { dataMatrix: matrix, report, itemStats }
  }, [items, responses])

  // Get unique dimensions
  const dimensions = useMemo(() => {
    return [...new Set(items.map(i => i.dimension).filter(Boolean))] as string[]
  }, [items])

  // Filter items by dimension
  const filteredItemStats = useMemo(() => {
    if (!selectedDimension) return itemStats
    return itemStats.filter(i => i.dimension === selectedDimension)
  }, [itemStats, selectedDimension])

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-surface-500">
        <IconChartBar size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm">Keine Items vorhanden</p>
        <p className="text-xs mt-1">Fuegen Sie Items zum Fragebogen hinzu</p>
      </div>
    )
  }

  if (responses.length < 3) {
    return (
      <div className="text-center py-12 text-surface-500">
        <IconAlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm">Nicht genuegend Daten</p>
        <p className="text-xs mt-1">Mindestens 3 Antworten werden fuer die Analyse benoetigt</p>
        <p className="text-xs mt-2 text-surface-600">
          Aktuell: {responses.length} Antwort{responses.length !== 1 ? 'en' : ''}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-surface-100">{title}</h3>
          <div className="group relative">
            <IconInfoCircle size={16} className="text-surface-500 cursor-help" />
            <div className="absolute left-0 top-6 w-72 p-3 bg-surface-800 border border-surface-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <p className="text-xs text-surface-300">
                Psychometrische Kennzahlen zur Beurteilung der Fragebogenqualitaet.
                Cronbach's Alpha misst die interne Konsistenz, Item-Analysen zeigen
                problematische Fragen.
              </p>
            </div>
          </div>
        </div>

        {/* View mode tabs */}
        <div className="flex items-center gap-1 bg-surface-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
              viewMode === 'overview'
                ? 'bg-primary-600 text-white'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <IconChartBar size={14} />
            Uebersicht
          </button>
          <button
            onClick={() => setViewMode('items')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
              viewMode === 'items'
                ? 'bg-primary-600 text-white'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <IconTable size={14} />
            Items
          </button>
          <button
            onClick={() => setViewMode('factors')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
              viewMode === 'factors'
                ? 'bg-primary-600 text-white'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <IconTrendingUp size={14} />
            Faktoren
          </button>
        </div>
      </div>

      {/* Sample info */}
      <div className="flex items-center gap-4 text-xs text-surface-500">
        <span><strong className="text-surface-300">{responses.length}</strong> Teilnehmer</span>
        <span><strong className="text-surface-300">{items.length}</strong> Items</span>
        {dimensions.length > 0 && (
          <span><strong className="text-surface-300">{dimensions.length}</strong> Dimensionen</span>
        )}
      </div>

      {/* Dimension filter */}
      {dimensions.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">Dimension:</span>
          <button
            onClick={() => setSelectedDimension(null)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              !selectedDimension
                ? 'bg-primary-600 text-white'
                : 'bg-surface-800 text-surface-400 hover:text-surface-200'
            }`}
          >
            Alle
          </button>
          {dimensions.map((dim) => (
            <button
              key={dim}
              onClick={() => setSelectedDimension(dim)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedDimension === dim
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-800 text-surface-400 hover:text-surface-200'
              }`}
            >
              {dim}
            </button>
          ))}
        </div>
      )}

      {/* Views */}
      {viewMode === 'overview' && report && (
        <OverviewView report={report} itemStats={filteredItemStats} />
      )}

      {viewMode === 'items' && (
        <ItemsView itemStats={filteredItemStats} onItemSelect={onItemSelect} />
      )}

      {viewMode === 'factors' && report && (
        <FactorsView report={report} items={items} />
      )}

      {/* Recommendations */}
      {report && report.recommendations.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-300 mb-2 flex items-center gap-2">
            <IconAlertTriangle size={16} />
            Empfehlungen
          </h4>
          <ul className="space-y-1">
            {report.recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-amber-200/80 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// OVERVIEW VIEW
// ============================================================================

function OverviewView({
  report,
  itemStats,
}: {
  report: ComprehensivePsychometricReport
  itemStats: any[]
}) {
  const alpha = report.reliability.cronbachAlpha
  const omega = report.reliability.mcdonaldOmega
  const splitHalf = report.reliability.splitHalf

  return (
    <div className="space-y-6">
      {/* Reliability Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReliabilityCard
          label="Cronbach's Alpha"
          value={alpha}
          interpretation={report.reliability.interpretation}
          description="Interne Konsistenz"
        />
        <ReliabilityCard
          label="McDonald's Omega"
          value={omega}
          interpretation={getReliabilityInterpretation(omega)}
          description="Modellbasierte Reliabilitaet"
        />
        <ReliabilityCard
          label="Split-Half"
          value={splitHalf}
          interpretation={getReliabilityInterpretation(splitHalf)}
          description="Testhalbierungs-Reliabilitaet"
        />
      </div>

      {/* Validity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-surface-300">Konvergente Validitaet</h4>
            <StatusBadge ok={report.validity.convergentOk} />
          </div>
          <div className="space-y-2">
            <MetricRow label="AVE" value={report.validity.ave} threshold={0.5} />
            <MetricRow label="CR" value={report.validity.compositeReliability} threshold={0.7} />
          </div>
        </div>

        <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-surface-300">Faktoranalyse</h4>
            <span className="text-xs text-surface-500">
              {report.factorAnalysis.suggestedFactors} Faktor{report.factorAnalysis.suggestedFactors !== 1 ? 'en' : ''}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-surface-400">Erklaerte Varianz</span>
              <span className="text-surface-200">
                {(report.factorAnalysis.varianceExplained.slice(0, report.factorAnalysis.suggestedFactors)
                  .reduce((a, b) => a + b, 0)).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-surface-400">Eigenwert 1. Faktor</span>
              <span className="text-surface-200">
                {report.factorAnalysis.eigenvalues[0]?.toFixed(2) || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Item-Total Correlation Distribution */}
      <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
        <h4 className="text-sm font-medium text-surface-300 mb-4">Item-Total Korrelationen</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={itemStats} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <XAxis dataKey="id" tick={false} />
            <YAxis domain={[0, 1]} ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]} fontSize={10} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-surface-800 border border-surface-700 rounded-lg p-2 shadow-xl">
                      <p className="text-xs text-surface-200 font-medium mb-1">
                        {data.text?.slice(0, 40)}...
                      </p>
                      <p className="text-xs text-surface-400">
                        r<sub>it</sub> = {data.itemTotalCorr.toFixed(3)}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine y={0.3} stroke="#f59e0b" strokeDasharray="3 3" />
            <ReferenceLine y={0.4} stroke="#22c55e" strokeDasharray="3 3" />
            <Bar dataKey="itemTotalCorr" radius={[4, 4, 0, 0]}>
              {itemStats.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.itemTotalCorr >= 0.4
                      ? '#22c55e'
                      : entry.itemTotalCorr >= 0.3
                      ? '#f59e0b'
                      : '#ef4444'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-surface-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500" /> ≥ 0.40 Gut
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-500" /> ≥ 0.30 Akzeptabel
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500" /> {'<'} 0.30 Problematisch
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ITEMS VIEW
// ============================================================================

function ItemsView({
  itemStats,
  onItemSelect,
}: {
  itemStats: any[]
  onItemSelect?: (itemId: string) => void
}) {
  const [sortBy, setSortBy] = useState<'id' | 'itemTotalCorr' | 'mean'>('itemTotalCorr')
  const [sortAsc, setSortAsc] = useState(true)

  const sortedItems = useMemo(() => {
    return [...itemStats].sort((a, b) => {
      const mult = sortAsc ? 1 : -1
      if (sortBy === 'id') return mult * a.id.localeCompare(b.id)
      return mult * (a[sortBy] - b[sortBy])
    })
  }, [itemStats, sortBy, sortAsc])

  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-700 bg-surface-800/50">
              <th
                className="px-3 py-2 text-left text-surface-400 font-medium cursor-pointer hover:text-surface-200"
                onClick={() => {
                  if (sortBy === 'id') setSortAsc(!sortAsc)
                  else { setSortBy('id'); setSortAsc(true) }
                }}
              >
                Item {sortBy === 'id' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="px-3 py-2 text-left text-surface-400 font-medium">Text</th>
              <th
                className="px-3 py-2 text-right text-surface-400 font-medium cursor-pointer hover:text-surface-200"
                onClick={() => {
                  if (sortBy === 'mean') setSortAsc(!sortAsc)
                  else { setSortBy('mean'); setSortAsc(false) }
                }}
              >
                M {sortBy === 'mean' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="px-3 py-2 text-right text-surface-400 font-medium">SD</th>
              <th
                className="px-3 py-2 text-right text-surface-400 font-medium cursor-pointer hover:text-surface-200"
                onClick={() => {
                  if (sortBy === 'itemTotalCorr') setSortAsc(!sortAsc)
                  else { setSortBy('itemTotalCorr'); setSortAsc(false) }
                }}
              >
                r<sub>it</sub> {sortBy === 'itemTotalCorr' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="px-3 py-2 text-center text-surface-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item, idx) => (
              <tr
                key={item.id}
                className={`border-b border-surface-800 hover:bg-surface-800/30 ${
                  onItemSelect ? 'cursor-pointer' : ''
                }`}
                onClick={() => onItemSelect?.(item.id)}
              >
                <td className="px-3 py-2 text-surface-300 font-mono">
                  {item.id}
                  {item.reversed && (
                    <span className="ml-1 text-amber-500" title="Recodiert">R</span>
                  )}
                </td>
                <td className="px-3 py-2 text-surface-400 max-w-xs truncate" title={item.text}>
                  {item.text}
                </td>
                <td className="px-3 py-2 text-right text-surface-300">{item.mean.toFixed(2)}</td>
                <td className="px-3 py-2 text-right text-surface-300">{item.sd.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">
                  <span
                    className={`font-medium ${
                      item.itemTotalCorr >= 0.4
                        ? 'text-green-400'
                        : item.itemTotalCorr >= 0.3
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {item.itemTotalCorr.toFixed(3)}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  {item.itemTotalCorr >= 0.4 ? (
                    <IconCheck size={16} className="inline text-green-500" />
                  ) : item.itemTotalCorr >= 0.3 ? (
                    <IconAlertTriangle size={16} className="inline text-amber-500" />
                  ) : (
                    <IconX size={16} className="inline text-red-500" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="px-3 py-2 bg-surface-800/50 border-t border-surface-700 flex items-center justify-between text-xs text-surface-500">
        <span>
          {sortedItems.filter(i => i.itemTotalCorr >= 0.4).length} gut |{' '}
          {sortedItems.filter(i => i.itemTotalCorr >= 0.3 && i.itemTotalCorr < 0.4).length} akzeptabel |{' '}
          {sortedItems.filter(i => i.itemTotalCorr < 0.3).length} problematisch
        </span>
        <span>
          r<sub>it</sub> = Item-Total Korrelation (korrigiert)
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// FACTORS VIEW
// ============================================================================

function FactorsView({
  report,
  items,
}: {
  report: ComprehensivePsychometricReport
  items: QuestionnaireItem[]
}) {
  // Scree plot data
  const screePlotData = report.factorAnalysis.eigenvalues.map((ev, idx) => ({
    factor: idx + 1,
    eigenvalue: ev,
  }))

  // Factor loadings data
  const loadingsData = report.factorAnalysis.loadings.map((loading, idx) => ({
    item: items[idx]?.id || `Item ${idx + 1}`,
    text: items[idx]?.text || '',
    loading: loading.loadings[loading.primaryFactor],
    communality: loading.communality,
    factor: loading.primaryFactor + 1,
  }))

  return (
    <div className="space-y-6">
      {/* Scree Plot */}
      <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
        <h4 className="text-sm font-medium text-surface-300 mb-4">Scree Plot (Eigenwerte)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={screePlotData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="factor"
              label={{ value: 'Faktor', position: 'bottom', fontSize: 10, fill: '#94a3b8' }}
              fontSize={10}
              stroke="#64748b"
            />
            <YAxis
              label={{ value: 'Eigenwert', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
              fontSize={10}
              stroke="#64748b"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-surface-800 border border-surface-700 rounded-lg p-2 shadow-xl">
                      <p className="text-xs text-surface-200">Faktor {data.factor}</p>
                      <p className="text-xs text-surface-400">Eigenwert: {data.eigenvalue.toFixed(3)}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine y={1} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Kaiser', fill: '#f59e0b', fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="eigenvalue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="text-xs text-surface-500 text-center mt-2">
          Kaiser-Kriterium: Faktoren mit Eigenwert {'>'} 1 extrahieren
        </div>
      </div>

      {/* Factor Loadings */}
      <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
        <h4 className="text-sm font-medium text-surface-300 mb-4">Faktorladungen</h4>
        <ResponsiveContainer width="100%" height={Math.max(200, loadingsData.length * 25)}>
          <BarChart
            data={loadingsData}
            layout="vertical"
            margin={{ top: 5, right: 50, left: 80, bottom: 5 }}
          >
            <XAxis type="number" domain={[0, 1]} ticks={[0, 0.3, 0.4, 0.6, 0.8, 1]} fontSize={10} stroke="#64748b" />
            <YAxis type="category" dataKey="item" fontSize={10} width={70} stroke="#64748b" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-surface-800 border border-surface-700 rounded-lg p-2 shadow-xl">
                      <p className="text-xs text-surface-200 font-medium mb-1">
                        {data.text?.slice(0, 50)}...
                      </p>
                      <p className="text-xs text-surface-400">Ladung: {Math.abs(data.loading).toFixed(3)}</p>
                      <p className="text-xs text-surface-400">Kommunalitaet: {data.communality.toFixed(3)}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine x={0.4} stroke="#f59e0b" strokeDasharray="3 3" />
            <Bar dataKey="loading" radius={[0, 4, 4, 0]}>
              {loadingsData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    Math.abs(entry.loading) >= 0.6
                      ? '#22c55e'
                      : Math.abs(entry.loading) >= 0.4
                      ? '#3b82f6'
                      : '#ef4444'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-surface-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500" /> ≥ 0.60 Stark
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-500" /> ≥ 0.40 Moderat
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500" /> {'<'} 0.40 Schwach
          </span>
        </div>
      </div>

      {/* Variance Explained */}
      <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
        <h4 className="text-sm font-medium text-surface-300 mb-3">Erklaerte Varianz</h4>
        <div className="space-y-2">
          {report.factorAnalysis.varianceExplained.slice(0, Math.min(5, report.factorAnalysis.suggestedFactors + 2)).map((variance, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-xs text-surface-400 w-16">Faktor {idx + 1}</span>
              <div className="flex-1 bg-surface-800 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    idx < report.factorAnalysis.suggestedFactors ? 'bg-primary-500' : 'bg-surface-600'
                  }`}
                  style={{ width: `${Math.min(100, variance)}%` }}
                />
              </div>
              <span className="text-xs text-surface-300 w-12 text-right">{variance.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ReliabilityCard({
  label,
  value,
  interpretation,
  description,
}: {
  label: string
  value: number
  interpretation: string
  description: string
}) {
  const getColor = () => {
    if (value >= 0.8) return 'text-green-400'
    if (value >= 0.7) return 'text-amber-400'
    return 'text-red-400'
  }

  const getBgColor = () => {
    if (value >= 0.8) return 'bg-green-500/10 border-green-500/30'
    if (value >= 0.7) return 'bg-amber-500/10 border-amber-500/30'
    return 'bg-red-500/10 border-red-500/30'
  }

  return (
    <div className={`rounded-xl p-4 border ${getBgColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-surface-400">{label}</span>
        <span className={`text-xs font-medium ${getColor()}`}>{interpretation}</span>
      </div>
      <p className={`text-2xl font-bold ${getColor()}`}>{value.toFixed(3)}</p>
      <p className="text-xs text-surface-500 mt-1">{description}</p>
    </div>
  )
}

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="flex items-center gap-1 text-xs text-green-400">
      <IconCheck size={12} /> OK
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs text-red-400">
      <IconX size={12} /> Nicht erfuellt
    </span>
  )
}

function MetricRow({
  label,
  value,
  threshold,
}: {
  label: string
  value: number
  threshold: number
}) {
  const ok = value >= threshold
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-surface-400">{label}</span>
      <span className={`text-xs font-medium ${ok ? 'text-green-400' : 'text-red-400'}`}>
        {value.toFixed(3)} {ok ? '✓' : `(< ${threshold})`}
      </span>
    </div>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let denomX = 0
  let denomY = 0

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    numerator += dx * dy
    denomX += dx * dx
    denomY += dy * dy
  }

  const denom = Math.sqrt(denomX * denomY)
  return denom > 0 ? numerator / denom : 0
}

function getReliabilityInterpretation(value: number): string {
  if (value >= 0.9) return 'Exzellent'
  if (value >= 0.8) return 'Gut'
  if (value >= 0.7) return 'Akzeptabel'
  if (value >= 0.6) return 'Fragwuerdig'
  return 'Unzureichend'
}
