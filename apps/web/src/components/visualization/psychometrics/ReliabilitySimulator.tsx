/**
 * Reliability Simulator
 * Sprint 4 - Visualization Roadmap
 *
 * Features:
 * - "What if" - Item removal simulation
 * - Alpha change prediction
 * - Optimal item selection suggestion
 * - Short scale generator
 * - Interactive item toggle
 */

import { useState, useMemo, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'
import {
  IconCheck,
  IconX,
  IconRefresh,
  IconBulb,
  IconAlertTriangle,
  IconInfoCircle,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
  IconWand,
  IconDownload,
} from '@tabler/icons-react'
import { PsychometricEngine } from '@/services/questionnaire/PsychometricEngine'

interface QuestionnaireItem {
  id: string
  text: string
  dimension?: string
}

interface ResponseData {
  respondentId: string
  responses: Record<string, number>
}

interface ReliabilitySimulatorProps {
  items: QuestionnaireItem[]
  responses: ResponseData[]
  title?: string
  onSelectionChange?: (selectedIds: string[]) => void
}

interface ItemAnalysis {
  id: string
  text: string
  dimension?: string
  included: boolean
  itemTotalCorr: number
  alphaIfDeleted: number
  impact: 'positive' | 'negative' | 'neutral'
}

export default function ReliabilitySimulator({
  items,
  responses,
  title = 'Reliabilitaets-Simulator',
  onSelectionChange,
}: ReliabilitySimulatorProps) {
  // Track which items are currently included
  const [includedItems, setIncludedItems] = useState<Set<string>>(
    new Set(items.map((i) => i.id))
  )
  const [targetItemCount, setTargetItemCount] = useState<number>(items.length)

  // Build data matrix from responses
  const buildDataMatrix = useCallback(
    (itemIds: string[]): number[][] => {
      const matrix: number[][] = []
      for (const response of responses) {
        const row: number[] = []
        for (const itemId of itemIds) {
          const value = response.responses[itemId]
          if (value !== undefined) {
            row.push(value)
          }
        }
        if (row.length === itemIds.length) {
          matrix.push(row)
        }
      }
      return matrix
    },
    [responses]
  )

  // Calculate Cronbach's Alpha for a subset of items
  const calculateAlpha = useCallback(
    (itemIds: string[]): number => {
      if (itemIds.length < 2) return 0
      const matrix = buildDataMatrix(itemIds)
      if (matrix.length < 3) return 0
      return PsychometricEngine.calculateCronbachAlpha(matrix)
    },
    [buildDataMatrix]
  )

  // Full analysis with all items
  const fullAnalysis = useMemo(() => {
    const allIds = items.map((i) => i.id)
    const matrix = buildDataMatrix(allIds)
    if (matrix.length < 3) return null

    const baseAlpha = calculateAlpha(allIds)

    // Calculate item-total correlations and alpha-if-deleted
    const itemAnalyses: ItemAnalysis[] = items.map((item, idx) => {
      // Item values
      const itemValues = matrix.map((row) => row[idx])
      // Total without this item
      const totalsWithout = matrix.map((row) =>
        row.reduce((sum, val, i) => (i !== idx ? sum + val : sum), 0)
      )

      // Item-total correlation
      const itemTotalCorr = calculateCorrelation(itemValues, totalsWithout)

      // Alpha if this item is deleted
      const remainingIds = allIds.filter((id) => id !== item.id)
      const alphaIfDeleted = calculateAlpha(remainingIds)

      // Impact assessment
      let impact: 'positive' | 'negative' | 'neutral' = 'neutral'
      if (alphaIfDeleted > baseAlpha + 0.01) {
        impact = 'negative' // Removing improves alpha = item is problematic
      } else if (alphaIfDeleted < baseAlpha - 0.01) {
        impact = 'positive' // Removing decreases alpha = item is valuable
      }

      return {
        id: item.id,
        text: item.text,
        dimension: item.dimension,
        included: includedItems.has(item.id),
        itemTotalCorr,
        alphaIfDeleted,
        impact,
      }
    })

    return {
      baseAlpha,
      itemAnalyses,
    }
  }, [items, buildDataMatrix, calculateAlpha, includedItems])

  // Current alpha with selected items
  const currentAlpha = useMemo(() => {
    const selectedIds = Array.from(includedItems)
    return calculateAlpha(selectedIds)
  }, [includedItems, calculateAlpha])

  // Optimal subset for target item count
  const optimalSubset = useMemo(() => {
    if (!fullAnalysis || targetItemCount >= items.length) return null

    // Greedy algorithm: remove items that increase alpha most
    let currentIds = items.map((i) => i.id)
    let currentAlpha = fullAnalysis.baseAlpha

    while (currentIds.length > targetItemCount && currentIds.length > 2) {
      let bestRemoval: { id: string; alpha: number } | null = null

      for (const id of currentIds) {
        const remainingIds = currentIds.filter((i) => i !== id)
        const newAlpha = calculateAlpha(remainingIds)

        if (!bestRemoval || newAlpha > bestRemoval.alpha) {
          bestRemoval = { id, alpha: newAlpha }
        }
      }

      if (bestRemoval) {
        currentIds = currentIds.filter((i) => i !== bestRemoval!.id)
        currentAlpha = bestRemoval.alpha
      } else {
        break
      }
    }

    return {
      itemIds: currentIds,
      alpha: currentAlpha,
      removed: items.filter((i) => !currentIds.includes(i.id)).map((i) => i.id),
    }
  }, [fullAnalysis, targetItemCount, items, calculateAlpha])

  // Toggle item inclusion
  const toggleItem = (itemId: string) => {
    const newIncluded = new Set(includedItems)
    if (newIncluded.has(itemId)) {
      if (newIncluded.size > 2) {
        newIncluded.delete(itemId)
      }
    } else {
      newIncluded.add(itemId)
    }
    setIncludedItems(newIncluded)
    onSelectionChange?.(Array.from(newIncluded))
  }

  // Apply optimal subset
  const applyOptimalSubset = () => {
    if (optimalSubset) {
      setIncludedItems(new Set(optimalSubset.itemIds))
      onSelectionChange?.(optimalSubset.itemIds)
    }
  }

  // Reset to all items
  const resetSelection = () => {
    const allIds = new Set(items.map((i) => i.id))
    setIncludedItems(allIds)
    onSelectionChange?.(Array.from(allIds))
  }

  if (items.length < 3 || responses.length < 3 || !fullAnalysis) {
    return (
      <div className="text-center py-12 text-surface-500">
        <IconAlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm">Nicht genuegend Daten</p>
        <p className="text-xs mt-1">Mindestens 3 Items und 3 Antworten benoetigt</p>
      </div>
    )
  }

  const alphaDiff = currentAlpha - fullAnalysis.baseAlpha

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
                Simulieren Sie die Auswirkungen von Item-Entfernung auf die Reliabilitaet.
                Klicken Sie auf Items, um sie ein-/auszuschliessen.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetSelection}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
          >
            <IconRefresh size={14} />
            Zuruecksetzen
          </button>
        </div>
      </div>

      {/* Alpha comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Original Alpha */}
        <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
          <p className="text-xs text-surface-500 mb-1">Original (alle Items)</p>
          <p className="text-2xl font-bold text-surface-300">
            α = {fullAnalysis.baseAlpha.toFixed(3)}
          </p>
          <p className="text-xs text-surface-500 mt-1">{items.length} Items</p>
        </div>

        {/* Current Alpha */}
        <div
          className={`rounded-xl p-4 border ${
            alphaDiff > 0.01
              ? 'bg-green-900/20 border-green-700/30'
              : alphaDiff < -0.01
              ? 'bg-red-900/20 border-red-700/30'
              : 'bg-surface-900 border-surface-800'
          }`}
        >
          <p className="text-xs text-surface-500 mb-1">Aktuell (Auswahl)</p>
          <div className="flex items-baseline gap-2">
            <p
              className={`text-2xl font-bold ${
                alphaDiff > 0.01
                  ? 'text-green-400'
                  : alphaDiff < -0.01
                  ? 'text-red-400'
                  : 'text-surface-300'
              }`}
            >
              α = {currentAlpha.toFixed(3)}
            </p>
            {Math.abs(alphaDiff) > 0.001 && (
              <span
                className={`text-sm flex items-center ${
                  alphaDiff > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {alphaDiff > 0 ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />}
                {Math.abs(alphaDiff).toFixed(3)}
              </span>
            )}
          </div>
          <p className="text-xs text-surface-500 mt-1">{includedItems.size} Items</p>
        </div>

        {/* Optimal subset */}
        <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-surface-500">Optimale Kurzskala</p>
            <select
              value={targetItemCount}
              onChange={(e) => setTargetItemCount(parseInt(e.target.value))}
              className="text-xs bg-surface-800 border border-surface-700 rounded px-2 py-0.5 text-surface-300"
            >
              {Array.from({ length: items.length - 1 }, (_, i) => i + 2).map((n) => (
                <option key={n} value={n}>
                  {n} Items
                </option>
              ))}
            </select>
          </div>
          {optimalSubset && (
            <>
              <p className="text-2xl font-bold text-primary-400">
                α = {optimalSubset.alpha.toFixed(3)}
              </p>
              <button
                onClick={applyOptimalSubset}
                className="mt-2 flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary-600 text-white hover:bg-primary-500 transition-colors"
              >
                <IconWand size={12} />
                Anwenden
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alpha-if-deleted chart */}
      <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
        <h4 className="text-sm font-medium text-surface-300 mb-4">
          Alpha wenn Item entfernt (α<sub>-i</sub>)
        </h4>
        <ResponsiveContainer width="100%" height={Math.max(200, items.length * 25)}>
          <BarChart
            data={fullAnalysis.itemAnalyses}
            layout="vertical"
            margin={{ top: 5, right: 50, left: 80, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={[0, 1]}
              ticks={[0, 0.5, 0.7, 0.8, 0.9, 1]}
              fontSize={10}
              stroke="#64748b"
            />
            <YAxis type="category" dataKey="id" fontSize={10} width={70} stroke="#64748b" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ItemAnalysis
                  return (
                    <div className="bg-surface-800 border border-surface-700 rounded-lg p-3 shadow-xl">
                      <p className="text-xs text-surface-200 font-medium mb-2">
                        {data.text?.slice(0, 50)}...
                      </p>
                      <div className="space-y-1 text-xs">
                        <p className="text-surface-400">
                          r<sub>it</sub> = {data.itemTotalCorr.toFixed(3)}
                        </p>
                        <p className="text-surface-400">
                          α<sub>-i</sub> = {data.alphaIfDeleted.toFixed(3)}
                        </p>
                        <p
                          className={
                            data.impact === 'negative'
                              ? 'text-red-400'
                              : data.impact === 'positive'
                              ? 'text-green-400'
                              : 'text-surface-400'
                          }
                        >
                          {data.impact === 'negative'
                            ? '⚠ Entfernung verbessert α'
                            : data.impact === 'positive'
                            ? '✓ Wertvolles Item'
                            : '○ Neutraler Effekt'}
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine
              x={fullAnalysis.baseAlpha}
              stroke="#3b82f6"
              strokeDasharray="3 3"
              label={{ value: `α=${fullAnalysis.baseAlpha.toFixed(2)}`, fill: '#3b82f6', fontSize: 10 }}
            />
            <Bar dataKey="alphaIfDeleted" radius={[0, 4, 4, 0]}>
              {fullAnalysis.itemAnalyses.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.impact === 'negative'
                      ? '#ef4444'
                      : entry.impact === 'positive'
                      ? '#22c55e'
                      : '#64748b'
                  }
                  opacity={entry.included ? 1 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-surface-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500" /> Wertvolles Item
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-500" /> Neutral
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500" /> Problematisch
          </span>
        </div>
      </div>

      {/* Item selection table */}
      <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
        <div className="p-3 border-b border-surface-800 bg-surface-800/50">
          <h4 className="text-sm font-medium text-surface-300">Item-Auswahl</h4>
          <p className="text-xs text-surface-500">
            Klicken Sie auf Items, um sie ein-/auszuschliessen
          </p>
        </div>
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface-800">
              <tr className="border-b border-surface-700">
                <th className="px-3 py-2 text-left text-surface-400 font-medium w-10"></th>
                <th className="px-3 py-2 text-left text-surface-400 font-medium">Item</th>
                <th className="px-3 py-2 text-right text-surface-400 font-medium">
                  r<sub>it</sub>
                </th>
                <th className="px-3 py-2 text-right text-surface-400 font-medium">
                  α<sub>-i</sub>
                </th>
                <th className="px-3 py-2 text-center text-surface-400 font-medium">Effekt</th>
              </tr>
            </thead>
            <tbody>
              {fullAnalysis.itemAnalyses.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-surface-800 cursor-pointer transition-colors ${
                    includedItems.has(item.id)
                      ? 'hover:bg-surface-800/50'
                      : 'bg-surface-800/30 opacity-60'
                  }`}
                  onClick={() => toggleItem(item.id)}
                >
                  <td className="px-3 py-2">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        includedItems.has(item.id)
                          ? 'bg-primary-600 border-primary-600'
                          : 'border-surface-600'
                      }`}
                    >
                      {includedItems.has(item.id) && <IconCheck size={12} className="text-white" />}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-surface-300 font-mono">{item.id}</span>
                    <span className="text-surface-500 ml-2 truncate max-w-xs inline-block align-bottom">
                      {item.text?.slice(0, 40)}...
                    </span>
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      item.itemTotalCorr >= 0.4
                        ? 'text-green-400'
                        : item.itemTotalCorr >= 0.3
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {item.itemTotalCorr.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 text-right text-surface-300">
                    {item.alphaIfDeleted.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {item.impact === 'negative' ? (
                      <span className="text-red-400" title="Entfernung verbessert α">
                        <IconArrowUp size={14} className="inline" />
                      </span>
                    ) : item.impact === 'positive' ? (
                      <span className="text-green-400" title="Wertvolles Item">
                        <IconArrowDown size={14} className="inline" />
                      </span>
                    ) : (
                      <span className="text-surface-500" title="Neutraler Effekt">
                        <IconMinus size={14} className="inline" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      {fullAnalysis.itemAnalyses.filter((i) => i.impact === 'negative').length > 0 && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-300 mb-2 flex items-center gap-2">
            <IconBulb size={16} />
            Empfehlungen
          </h4>
          <ul className="space-y-1 text-xs text-amber-200/80">
            {fullAnalysis.itemAnalyses
              .filter((i) => i.impact === 'negative')
              .slice(0, 3)
              .map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>
                    <strong>{item.id}</strong>: Entfernung wuerde α auf{' '}
                    {item.alphaIfDeleted.toFixed(3)} erhoehen (r<sub>it</sub> ={' '}
                    {item.itemTotalCorr.toFixed(2)})
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n === 0) return 0

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
