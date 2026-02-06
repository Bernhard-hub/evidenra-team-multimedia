/**
 * Enhanced Code Frequency Chart
 * Sprint 1 - Visualization Roadmap
 *
 * Features:
 * - Interactive bar chart with Recharts
 * - Click to filter/show segments
 * - Sorting options
 * - Export functionality
 * - Tooltips with details
 */

import { useMemo, useRef, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import { IconSortAscending, IconSortDescending, IconFilter } from '@tabler/icons-react'
import { ChartExportButton } from './shared/ChartExportButton'
import type { Code, Coding } from '@/stores/projectStore'

interface CodeFrequencyChartProps {
  codes: Code[]
  codings: Coding[]
  maxBars?: number
  onCodeClick?: (codeId: string, codeName: string) => void
  orientation?: 'horizontal' | 'vertical'
  showExport?: boolean
  title?: string
}

type SortMode = 'frequency' | 'alphabetical' | 'color'

export default function CodeFrequencyChart({
  codes,
  codings,
  maxBars = 15,
  onCodeClick,
  orientation = 'horizontal',
  showExport = true,
  title = 'Code-Haeufigkeit',
}: CodeFrequencyChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [sortMode, setSortMode] = useState<SortMode>('frequency')
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)

  const data = useMemo(() => {
    // Calculate frequency for each code
    const frequencies = codes.map((code) => {
      const codeCodings = codings.filter((c) => c.codeId === code.id)
      return {
        id: code.id,
        name: code.name,
        shortName: code.name.length > 15 ? code.name.slice(0, 12) + '...' : code.name,
        color: code.color,
        count: codeCodings.length,
        documents: new Set(codeCodings.map(c => c.documentId)).size,
      }
    })

    // Sort based on mode
    let sorted = [...frequencies]
    switch (sortMode) {
      case 'frequency':
        sorted.sort((a, b) => sortAsc ? a.count - b.count : b.count - a.count)
        break
      case 'alphabetical':
        sorted.sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
        break
      case 'color':
        sorted.sort((a, b) => sortAsc ? a.color.localeCompare(b.color) : b.color.localeCompare(a.color))
        break
    }

    return sorted.slice(0, maxBars)
  }, [codes, codings, maxBars, sortMode, sortAsc])

  const totalCodings = codings.length
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  const handleBarClick = (entry: any) => {
    setSelectedCode(entry.id === selectedCode ? null : entry.id)
    if (onCodeClick) {
      onCodeClick(entry.id, entry.name)
    }
  }

  const toggleSort = () => {
    setSortAsc(!sortAsc)
  }

  const cycleSortMode = () => {
    const modes: SortMode[] = ['frequency', 'alphabetical', 'color']
    const currentIndex = modes.indexOf(sortMode)
    setSortMode(modes[(currentIndex + 1) % modes.length])
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-surface-500">
        <IconFilter size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm">Keine Kodierungen vorhanden</p>
        <p className="text-xs mt-1">Kodieren Sie Dokumente, um Haeufigkeiten zu sehen</p>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.count / totalCodings) * 100).toFixed(1)
      return (
        <div className="bg-surface-800 border border-surface-700 rounded-lg p-3 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-medium text-surface-100">{data.name}</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-surface-400">Kodierungen:</span>
              <span className="text-surface-200 font-medium">{data.count}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-surface-400">Anteil:</span>
              <span className="text-surface-200">{percentage}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-surface-400">Dokumente:</span>
              <span className="text-surface-200">{data.documents}</span>
            </div>
          </div>
          {onCodeClick && (
            <p className="text-xs text-primary-400 mt-2">Klicken zum Filtern</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-surface-100">{title}</h3>
        <div className="flex items-center gap-2">
          {/* Sort controls */}
          <button
            onClick={cycleSortMode}
            className="px-2 py-1 text-xs rounded bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
            title={`Sortierung: ${sortMode}`}
          >
            {sortMode === 'frequency' && 'Nach Haeufigkeit'}
            {sortMode === 'alphabetical' && 'Alphabetisch'}
            {sortMode === 'color' && 'Nach Farbe'}
          </button>
          <button
            onClick={toggleSort}
            className="p-1.5 rounded bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
            title={sortAsc ? 'Aufsteigend' : 'Absteigend'}
          >
            {sortAsc ? <IconSortAscending size={16} /> : <IconSortDescending size={16} />}
          </button>

          {/* Export */}
          {showExport && (
            <ChartExportButton chartRef={chartRef} filename="code_frequency" />
          )}
        </div>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="bg-surface-900 rounded-xl p-4">
        {orientation === 'horizontal' ? (
          <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 50, left: 100, bottom: 5 }}
            >
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis
                type="category"
                dataKey="shortName"
                stroke="#64748b"
                fontSize={12}
                width={90}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                onClick={(data) => handleBarClick(data)}
                cursor={onCodeClick ? 'pointer' : 'default'}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={selectedCode && selectedCode !== entry.id ? 0.3 : 1}
                  />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  fill="#94a3b8"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
              <XAxis
                dataKey="shortName"
                stroke="#64748b"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                onClick={(data) => handleBarClick(data)}
                cursor={onCodeClick ? 'pointer' : 'default'}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={selectedCode && selectedCode !== entry.id ? 0.3 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary stats */}
      <div className="flex items-center justify-between text-sm text-surface-500 px-2">
        <span>{data.length} Codes angezeigt</span>
        <span>{totalCodings} Kodierungen gesamt</span>
      </div>
    </div>
  )
}
