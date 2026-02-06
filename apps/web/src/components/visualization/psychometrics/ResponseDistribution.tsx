/**
 * Response Distribution Charts
 * Sprint 4 - Visualization Roadmap
 *
 * Features:
 * - Histograms per item
 * - Likert-scale stacked bars
 * - Mean + SD overlay
 * - Skewness/Kurtosis warnings
 * - Subgroup comparison
 */

import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ComposedChart,
  Line,
  ErrorBar,
} from 'recharts'
import {
  IconChartHistogram,
  IconChartBar,
  IconAlertTriangle,
  IconInfoCircle,
  IconFilter,
} from '@tabler/icons-react'

interface QuestionnaireItem {
  id: string
  text: string
  dimension?: string
  scaleMin?: number
  scaleMax?: number
  scaleLabels?: string[]
}

interface ResponseData {
  respondentId: string
  responses: Record<string, number>
  group?: string // Optional subgroup for comparison
}

interface ResponseDistributionProps {
  items: QuestionnaireItem[]
  responses: ResponseData[]
  title?: string
  onItemSelect?: (itemId: string) => void
}

type ViewMode = 'histogram' | 'likert' | 'comparison'

// Likert scale colors (5-point)
const LIKERT_COLORS = {
  1: '#ef4444', // Strongly disagree - red
  2: '#f97316', // Disagree - orange
  3: '#eab308', // Neutral - yellow
  4: '#84cc16', // Agree - lime
  5: '#22c55e', // Strongly agree - green
}

const LIKERT_LABELS_DE = {
  1: 'Stimme gar nicht zu',
  2: 'Stimme nicht zu',
  3: 'Neutral',
  4: 'Stimme zu',
  5: 'Stimme voll zu',
}

export default function ResponseDistribution({
  items,
  responses,
  title = 'Antwortverteilungen',
  onItemSelect,
}: ResponseDistributionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('likert')
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null)

  // Calculate statistics for each item
  const itemStats = useMemo(() => {
    return items.map((item) => {
      const values = responses
        .map((r) => r.responses[item.id])
        .filter((v) => v !== undefined && v !== null)

      if (values.length === 0) {
        return {
          id: item.id,
          text: item.text,
          dimension: item.dimension,
          n: 0,
          mean: 0,
          sd: 0,
          skewness: 0,
          kurtosis: 0,
          distribution: {},
          scaleMin: item.scaleMin || 1,
          scaleMax: item.scaleMax || 5,
          scaleLabels: item.scaleLabels,
        }
      }

      const n = values.length
      const mean = values.reduce((a, b) => a + b, 0) / n
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n
      const sd = Math.sqrt(variance)

      // Skewness
      const skewness =
        sd > 0
          ? values.reduce((acc, val) => acc + Math.pow((val - mean) / sd, 3), 0) / n
          : 0

      // Kurtosis (excess)
      const kurtosis =
        sd > 0
          ? values.reduce((acc, val) => acc + Math.pow((val - mean) / sd, 4), 0) / n - 3
          : 0

      // Distribution counts
      const distribution: Record<number, number> = {}
      const scaleMin = item.scaleMin || 1
      const scaleMax = item.scaleMax || 5
      for (let i = scaleMin; i <= scaleMax; i++) {
        distribution[i] = 0
      }
      values.forEach((v) => {
        if (distribution[v] !== undefined) {
          distribution[v]++
        }
      })

      return {
        id: item.id,
        text: item.text,
        dimension: item.dimension,
        n,
        mean,
        sd,
        skewness,
        kurtosis,
        distribution,
        scaleMin,
        scaleMax,
        scaleLabels: item.scaleLabels,
      }
    })
  }, [items, responses])

  // Get unique dimensions
  const dimensions = useMemo(() => {
    return [...new Set(items.map((i) => i.dimension).filter(Boolean))] as string[]
  }, [items])

  // Get unique groups for comparison
  const groups = useMemo(() => {
    return [...new Set(responses.map((r) => r.group).filter(Boolean))] as string[]
  }, [responses])

  // Filter items by dimension
  const filteredStats = useMemo(() => {
    if (!selectedDimension) return itemStats
    return itemStats.filter((i) => i.dimension === selectedDimension)
  }, [itemStats, selectedDimension])

  // Prepare Likert data for stacked bar chart
  const likertData = useMemo(() => {
    return filteredStats.map((stat) => {
      const total = stat.n || 1
      const data: any = {
        id: stat.id,
        text: stat.text,
        mean: stat.mean,
        sd: stat.sd,
      }

      for (let i = stat.scaleMin; i <= stat.scaleMax; i++) {
        data[`value${i}`] = ((stat.distribution[i] || 0) / total) * 100
        data[`count${i}`] = stat.distribution[i] || 0
      }

      return data
    })
  }, [filteredStats])

  // Calculate group comparison data
  const comparisonData = useMemo(() => {
    if (groups.length < 2 || !selectedItem) return []

    const item = items.find((i) => i.id === selectedItem)
    if (!item) return []

    return groups.map((group) => {
      const groupResponses = responses.filter((r) => r.group === group)
      const values = groupResponses
        .map((r) => r.responses[selectedItem])
        .filter((v) => v !== undefined)

      const n = values.length
      const mean = n > 0 ? values.reduce((a, b) => a + b, 0) / n : 0
      const variance = n > 0 ? values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n : 0
      const sd = Math.sqrt(variance)

      return { group, n, mean, sd, errorLow: mean - sd, errorHigh: mean + sd }
    })
  }, [groups, selectedItem, items, responses])

  if (items.length === 0 || responses.length === 0) {
    return (
      <div className="text-center py-12 text-surface-500">
        <IconChartHistogram size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm">Keine Daten vorhanden</p>
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
                Visualisierung der Antwortverteilungen. Pruefen Sie auf Decken-/Bodeneffekte
                und schiefe Verteilungen.
              </p>
            </div>
          </div>
        </div>

        {/* View mode tabs */}
        <div className="flex items-center gap-1 bg-surface-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('likert')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
              viewMode === 'likert'
                ? 'bg-primary-600 text-white'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <IconChartBar size={14} />
            Likert
          </button>
          <button
            onClick={() => setViewMode('histogram')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
              viewMode === 'histogram'
                ? 'bg-primary-600 text-white'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <IconChartHistogram size={14} />
            Histogramm
          </button>
          {groups.length >= 2 && (
            <button
              onClick={() => setViewMode('comparison')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
                viewMode === 'comparison'
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <IconFilter size={14} />
              Vergleich
            </button>
          )}
        </div>
      </div>

      {/* Dimension filter */}
      {dimensions.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
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
      {viewMode === 'likert' && (
        <LikertView
          data={likertData}
          stats={filteredStats}
          onItemClick={(id) => {
            setSelectedItem(id)
            onItemSelect?.(id)
          }}
        />
      )}

      {viewMode === 'histogram' && (
        <HistogramView
          stats={filteredStats}
          selectedItem={selectedItem}
          onItemSelect={(id) => {
            setSelectedItem(id)
            onItemSelect?.(id)
          }}
        />
      )}

      {viewMode === 'comparison' && groups.length >= 2 && (
        <ComparisonView
          items={items}
          comparisonData={comparisonData}
          selectedItem={selectedItem}
          onItemSelect={(id) => {
            setSelectedItem(id)
            onItemSelect?.(id)
          }}
        />
      )}

      {/* Distribution warnings */}
      <DistributionWarnings stats={filteredStats} />
    </div>
  )
}

// ============================================================================
// LIKERT VIEW
// ============================================================================

function LikertView({
  data,
  stats,
  onItemClick,
}: {
  data: any[]
  stats: any[]
  onItemClick: (id: string) => void
}) {
  return (
    <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 35)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
        >
          <XAxis type="number" domain={[0, 100]} unit="%" fontSize={10} stroke="#64748b" />
          <YAxis
            type="category"
            dataKey="id"
            width={140}
            fontSize={10}
            stroke="#64748b"
            tick={({ x, y, payload }) => {
              const stat = stats.find((s) => s.id === payload.value)
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={-5}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize={10}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onItemClick(payload.value)}
                  >
                    {payload.value}
                  </text>
                  <text x={-5} y={12} textAnchor="end" fill="#64748b" fontSize={8}>
                    M={stat?.mean.toFixed(2)}
                  </text>
                </g>
              )
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="bg-surface-800 border border-surface-700 rounded-lg p-3 shadow-xl">
                    <p className="text-xs text-surface-200 font-medium mb-2">
                      {data.text?.slice(0, 50)}...
                    </p>
                    <div className="space-y-1 text-xs">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <div key={v} className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: LIKERT_COLORS[v as keyof typeof LIKERT_COLORS] }}
                          />
                          <span className="text-surface-400">{LIKERT_LABELS_DE[v as keyof typeof LIKERT_LABELS_DE]}:</span>
                          <span className="text-surface-200">
                            {data[`count${v}`]} ({data[`value${v}`]?.toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-surface-700">
                      <p className="text-xs text-surface-400">
                        M = {data.mean?.toFixed(2)}, SD = {data.sd?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          {[1, 2, 3, 4, 5].map((v) => (
            <Bar
              key={v}
              dataKey={`value${v}`}
              stackId="stack"
              fill={LIKERT_COLORS[v as keyof typeof LIKERT_COLORS]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
        {[1, 2, 3, 4, 5].map((v) => (
          <span key={v} className="flex items-center gap-1 text-xs text-surface-400">
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: LIKERT_COLORS[v as keyof typeof LIKERT_COLORS] }}
            />
            {v}
          </span>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// HISTOGRAM VIEW
// ============================================================================

function HistogramView({
  stats,
  selectedItem,
  onItemSelect,
}: {
  stats: any[]
  selectedItem: string | null
  onItemSelect: (id: string) => void
}) {
  const currentStat = selectedItem ? stats.find((s) => s.id === selectedItem) : stats[0]

  if (!currentStat) return null

  const histogramData = Object.entries(currentStat.distribution).map(([value, count]) => ({
    value: parseInt(value),
    count: count as number,
    label: currentStat.scaleLabels?.[parseInt(value) - 1] || value,
  }))

  return (
    <div className="space-y-4">
      {/* Item selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-surface-500">Item:</span>
        {stats.slice(0, 10).map((stat) => (
          <button
            key={stat.id}
            onClick={() => onItemSelect(stat.id)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              (selectedItem || stats[0]?.id) === stat.id
                ? 'bg-primary-600 text-white'
                : 'bg-surface-800 text-surface-400 hover:text-surface-200'
            }`}
          >
            {stat.id}
          </button>
        ))}
        {stats.length > 10 && (
          <span className="text-xs text-surface-500">+{stats.length - 10} weitere</span>
        )}
      </div>

      {/* Histogram */}
      <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
        <div className="mb-4">
          <p className="text-sm text-surface-200 font-medium">{currentStat.id}</p>
          <p className="text-xs text-surface-400 truncate">{currentStat.text}</p>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={histogramData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
            <XAxis
              dataKey="value"
              fontSize={10}
              stroke="#64748b"
              tickFormatter={(v) => histogramData.find((d) => d.value === v)?.label || v}
            />
            <YAxis fontSize={10} stroke="#64748b" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-surface-800 border border-surface-700 rounded-lg p-2 shadow-xl">
                      <p className="text-xs text-surface-200">Wert: {data.label}</p>
                      <p className="text-xs text-surface-400">Anzahl: {data.count}</p>
                      <p className="text-xs text-surface-400">
                        Anteil: {((data.count / currentStat.n) * 100).toFixed(1)}%
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine
              x={currentStat.mean}
              stroke="#3b82f6"
              strokeDasharray="3 3"
              label={{ value: `M=${currentStat.mean.toFixed(2)}`, fill: '#3b82f6', fontSize: 10 }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
              {histogramData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={LIKERT_COLORS[entry.value as keyof typeof LIKERT_COLORS] || '#3b82f6'}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-surface-400">
          <span>n = {currentStat.n}</span>
          <span>M = {currentStat.mean.toFixed(2)}</span>
          <span>SD = {currentStat.sd.toFixed(2)}</span>
          <span>Schiefe = {currentStat.skewness.toFixed(2)}</span>
          <span>Kurtosis = {currentStat.kurtosis.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPARISON VIEW
// ============================================================================

function ComparisonView({
  items,
  comparisonData,
  selectedItem,
  onItemSelect,
}: {
  items: QuestionnaireItem[]
  comparisonData: any[]
  selectedItem: string | null
  onItemSelect: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Item selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-surface-500">Item:</span>
        {items.slice(0, 10).map((item) => (
          <button
            key={item.id}
            onClick={() => onItemSelect(item.id)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              selectedItem === item.id
                ? 'bg-primary-600 text-white'
                : 'bg-surface-800 text-surface-400 hover:text-surface-200'
            }`}
          >
            {item.id}
          </button>
        ))}
      </div>

      {selectedItem && comparisonData.length > 0 && (
        <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
          <p className="text-sm text-surface-200 font-medium mb-4">
            Gruppenvergleich: {selectedItem}
          </p>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="group" fontSize={10} stroke="#64748b" />
              <YAxis domain={[1, 5]} fontSize={10} stroke="#64748b" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-surface-800 border border-surface-700 rounded-lg p-2 shadow-xl">
                        <p className="text-xs text-surface-200 font-medium">{data.group}</p>
                        <p className="text-xs text-surface-400">n = {data.n}</p>
                        <p className="text-xs text-surface-400">M = {data.mean.toFixed(2)}</p>
                        <p className="text-xs text-surface-400">SD = {data.sd.toFixed(2)}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="mean" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {comparisonData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!selectedItem && (
        <div className="text-center py-8 text-surface-500">
          <p className="text-sm">Waehlen Sie ein Item fuer den Gruppenvergleich</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// DISTRIBUTION WARNINGS
// ============================================================================

function DistributionWarnings({ stats }: { stats: any[] }) {
  const warnings = useMemo(() => {
    const result: { id: string; type: string; message: string }[] = []

    stats.forEach((stat) => {
      // Ceiling effect (mean > 4.5 on 5-point scale)
      if (stat.mean > stat.scaleMax - 0.5) {
        result.push({
          id: stat.id,
          type: 'ceiling',
          message: `Deckeneffekt: M=${stat.mean.toFixed(2)} (sehr hoch)`,
        })
      }

      // Floor effect (mean < 1.5 on 5-point scale)
      if (stat.mean < stat.scaleMin + 0.5) {
        result.push({
          id: stat.id,
          type: 'floor',
          message: `Bodeneffekt: M=${stat.mean.toFixed(2)} (sehr niedrig)`,
        })
      }

      // High skewness (|skew| > 1)
      if (Math.abs(stat.skewness) > 1) {
        result.push({
          id: stat.id,
          type: 'skewness',
          message: `Schiefe Verteilung: Skew=${stat.skewness.toFixed(2)}`,
        })
      }

      // High kurtosis (|kurt| > 2)
      if (Math.abs(stat.kurtosis) > 2) {
        result.push({
          id: stat.id,
          type: 'kurtosis',
          message: `Ungewoehnliche Woelbung: Kurt=${stat.kurtosis.toFixed(2)}`,
        })
      }

      // Low variance (SD < 0.5)
      if (stat.sd < 0.5 && stat.n > 10) {
        result.push({
          id: stat.id,
          type: 'variance',
          message: `Geringe Varianz: SD=${stat.sd.toFixed(2)}`,
        })
      }
    })

    return result
  }, [stats])

  if (warnings.length === 0) return null

  return (
    <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4">
      <h4 className="text-sm font-medium text-amber-300 mb-3 flex items-center gap-2">
        <IconAlertTriangle size={16} />
        Verteilungs-Hinweise ({warnings.length})
      </h4>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {warnings.map((warning, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className="text-amber-400 font-mono">{warning.id}</span>
            <span className="text-amber-200/80">{warning.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
