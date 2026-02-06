/**
 * Code Trends Timeline
 * Sprint 5 - Visualization Roadmap
 *
 * Features:
 * - X-axis = Documents/Time
 * - Y-axis = Code frequency
 * - Stacked areas for multiple codes
 * - Zoom on time range
 * - Interactive legend
 */

import { useState, useMemo, useRef, useCallback } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
  LineChart,
  Line,
} from 'recharts'
import {
  IconInfoCircle,
  IconDownload,
  IconChartAreaLine,
  IconChartLine,
  IconCalendar,
  IconFileText,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react'
import type { Code, Coding, Document } from '@/stores/projectStore'

interface CodeTrendsTimelineProps {
  codes: Code[]
  codings: Coding[]
  documents: Document[]
  title?: string
  showExport?: boolean
  maxCodes?: number
  mode?: 'document' | 'time'
  chartType?: 'area' | 'line'
}

export default function CodeTrendsTimeline({
  codes,
  codings,
  documents,
  title = 'Code-Trends',
  showExport = true,
  maxCodes = 8,
  mode: initialMode = 'document',
  chartType: initialChartType = 'area',
}: CodeTrendsTimelineProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'document' | 'time'>(initialMode)
  const [chartType, setChartType] = useState<'area' | 'line'>(initialChartType)
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set())
  const [stacked, setStacked] = useState(true)

  // Get top codes by frequency
  const topCodes = useMemo(() => {
    const codeFreq = codes.map((code) => ({
      code,
      count: codings.filter((c) => c.codeId === code.id).length,
    }))

    return codeFreq
      .sort((a, b) => b.count - a.count)
      .slice(0, maxCodes)
      .map((cf) => cf.code)
  }, [codes, codings, maxCodes])

  // Initialize visible codes
  useMemo(() => {
    if (visibleCodes.size === 0 && topCodes.length > 0) {
      setVisibleCodes(new Set(topCodes.map((c) => c.id)))
    }
  }, [topCodes, visibleCodes.size])

  // Prepare timeline data based on mode
  const timelineData = useMemo(() => {
    if (mode === 'document') {
      // Sort documents by creation date or name
      const sortedDocs = [...documents].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateA - dateB || a.name.localeCompare(b.name)
      })

      return sortedDocs.map((doc, idx) => {
        const dataPoint: any = {
          index: idx + 1,
          name: doc.name.length > 15 ? doc.name.slice(0, 12) + '...' : doc.name,
          fullName: doc.name,
          documentId: doc.id,
          date: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('de-DE') : '-',
        }

        topCodes.forEach((code) => {
          dataPoint[code.id] = codings.filter(
            (c) => c.codeId === code.id && c.documentId === doc.id
          ).length
        })

        // Total for this document
        dataPoint.total = topCodes.reduce((sum, code) => sum + (dataPoint[code.id] || 0), 0)

        return dataPoint
      })
    } else {
      // Time-based: group by date
      const codingsByDate = new Map<string, Coding[]>()

      codings.forEach((coding) => {
        const date = coding.createdAt
          ? new Date(coding.createdAt).toISOString().split('T')[0]
          : 'unknown'
        if (!codingsByDate.has(date)) {
          codingsByDate.set(date, [])
        }
        codingsByDate.get(date)!.push(coding)
      })

      // Sort dates
      const sortedDates = Array.from(codingsByDate.keys())
        .filter((d) => d !== 'unknown')
        .sort()

      return sortedDates.map((date, idx) => {
        const dateCodlings = codingsByDate.get(date) || []
        const dataPoint: any = {
          index: idx + 1,
          name: new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
          fullName: new Date(date).toLocaleDateString('de-DE'),
          date,
        }

        topCodes.forEach((code) => {
          dataPoint[code.id] = dateCodlings.filter((c) => c.codeId === code.id).length
        })

        dataPoint.total = topCodes.reduce((sum, code) => sum + (dataPoint[code.id] || 0), 0)

        return dataPoint
      })
    }
  }, [mode, documents, codings, topCodes])

  // Calculate cumulative data for trend lines
  const cumulativeData = useMemo(() => {
    let cumulative: Record<string, number> = {}
    topCodes.forEach((code) => {
      cumulative[code.id] = 0
    })

    return timelineData.map((point) => {
      const cumPoint: any = { ...point }
      topCodes.forEach((code) => {
        cumulative[code.id] += point[code.id] || 0
        cumPoint[`${code.id}_cumulative`] = cumulative[code.id]
      })
      return cumPoint
    })
  }, [timelineData, topCodes])

  // Toggle code visibility
  const toggleCode = (codeId: string) => {
    const newVisible = new Set(visibleCodes)
    if (newVisible.has(codeId)) {
      if (newVisible.size > 1) {
        newVisible.delete(codeId)
      }
    } else {
      newVisible.add(codeId)
    }
    setVisibleCodes(newVisible)
  }

  // Export as PNG
  const handleExport = useCallback(async () => {
    if (!chartRef.current) return

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
      })

      const link = document.createElement('a')
      link.download = `code_trends_${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
    }
  }, [])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload
      return (
        <div className="bg-surface-800 border border-surface-700 rounded-lg p-3 shadow-xl max-w-xs">
          <p className="text-sm text-surface-200 font-medium mb-2">
            {dataPoint?.fullName || label}
          </p>
          {dataPoint?.date && mode === 'document' && (
            <p className="text-xs text-surface-500 mb-2">{dataPoint.date}</p>
          )}
          <div className="space-y-1">
            {payload
              .filter((p: any) => visibleCodes.has(p.dataKey))
              .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
              .map((p: any) => {
                const code = topCodes.find((c) => c.id === p.dataKey)
                return (
                  <div key={p.dataKey} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: code?.color || p.color }}
                    />
                    <span className="text-surface-400 flex-1 truncate">{code?.name || p.name}</span>
                    <span className="text-surface-200 font-medium">{p.value}</span>
                  </div>
                )
              })}
          </div>
          {dataPoint?.total !== undefined && (
            <div className="mt-2 pt-2 border-t border-surface-700 text-xs text-surface-400">
              Gesamt: <span className="text-surface-200 font-medium">{dataPoint.total}</span>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  if (timelineData.length === 0) {
    return (
      <div className="text-center py-12 text-surface-500">
        <IconInfoCircle size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm">Keine Daten fuer Timeline</p>
        <p className="text-xs mt-1">Kodieren Sie Dokumente, um Trends zu sehen</p>
      </div>
    )
  }

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-surface-100">{title}</h3>
          <div className="group relative">
            <IconInfoCircle size={16} className="text-surface-500 cursor-help" />
            <div className="absolute left-0 top-6 w-64 p-3 bg-surface-800 border border-surface-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <p className="text-xs text-surface-300">
                Zeigt die Entwicklung der Code-Haeufigkeiten ueber Zeit oder Dokumente. Nutzen Sie
                die Brush-Funktion unten zum Zoomen.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center gap-1 bg-surface-800 rounded-lg p-1">
            <button
              onClick={() => setMode('document')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                mode === 'document'
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <IconFileText size={14} />
              Dokumente
            </button>
            <button
              onClick={() => setMode('time')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                mode === 'time'
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <IconCalendar size={14} />
              Zeit
            </button>
          </div>

          {/* Chart type toggle */}
          <div className="flex items-center gap-1 bg-surface-800 rounded-lg p-1">
            <button
              onClick={() => setChartType('area')}
              className={`p-1 rounded text-xs transition-colors ${
                chartType === 'area'
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
              title="Flaechendiagramm"
            >
              <IconChartAreaLine size={14} />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-1 rounded text-xs transition-colors ${
                chartType === 'line'
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
              title="Liniendiagramm"
            >
              <IconChartLine size={14} />
            </button>
          </div>

          {/* Stacked toggle (for area chart) */}
          {chartType === 'area' && (
            <button
              onClick={() => setStacked(!stacked)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                stacked
                  ? 'bg-surface-700 text-surface-200'
                  : 'bg-surface-800 text-surface-400 hover:text-surface-200'
              }`}
            >
              {stacked ? 'Gestapelt' : 'Ueberlappend'}
            </button>
          )}

          {/* Export */}
          {showExport && (
            <button
              onClick={handleExport}
              className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
              title="Als PNG exportieren"
            >
              <IconDownload size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="bg-surface-900 rounded-xl p-4 border border-surface-800">
        <ResponsiveContainer width="100%" height={350}>
          <ChartComponent data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="name"
              fontSize={10}
              stroke="#64748b"
              angle={-45}
              textAnchor="end"
              height={60}
              interval={Math.max(0, Math.floor(timelineData.length / 10) - 1)}
            />
            <YAxis fontSize={10} stroke="#64748b" />
            <Tooltip content={<CustomTooltip />} />

            {/* Render areas/lines for visible codes */}
            {topCodes
              .filter((code) => visibleCodes.has(code.id))
              .map((code, idx) =>
                chartType === 'area' ? (
                  <Area
                    key={code.id}
                    type="monotone"
                    dataKey={code.id}
                    name={code.name}
                    stackId={stacked ? 'stack' : undefined}
                    stroke={code.color}
                    fill={code.color}
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                ) : (
                  <Line
                    key={code.id}
                    type="monotone"
                    dataKey={code.id}
                    name={code.name}
                    stroke={code.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: code.color }}
                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                  />
                )
              )}

            {/* Brush for zooming */}
            {timelineData.length > 10 && (
              <Brush
                dataKey="name"
                height={30}
                stroke="#475569"
                fill="#1e293b"
                travellerWidth={10}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>

      {/* Code legend / selector */}
      <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-surface-300">Codes</h4>
          <button
            onClick={() => setVisibleCodes(new Set(topCodes.map((c) => c.id)))}
            className="text-xs text-surface-500 hover:text-surface-300 transition-colors"
          >
            Alle anzeigen
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {topCodes.map((code) => {
            const isVisible = visibleCodes.has(code.id)
            const count = codings.filter((c) => c.codeId === code.id).length
            return (
              <button
                key={code.id}
                onClick={() => toggleCode(code.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  isVisible
                    ? 'bg-surface-800 text-surface-200'
                    : 'bg-surface-800/50 text-surface-500'
                }`}
              >
                <span
                  className={`w-3 h-3 rounded transition-opacity ${
                    isVisible ? 'opacity-100' : 'opacity-30'
                  }`}
                  style={{ backgroundColor: code.color }}
                />
                <span className="max-w-[100px] truncate">{code.name}</span>
                <span className="text-surface-500">({count})</span>
                {isVisible ? (
                  <IconEye size={12} className="text-surface-400" />
                ) : (
                  <IconEyeOff size={12} className="text-surface-600" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex items-center justify-between text-xs text-surface-500 px-2">
        <span>
          {timelineData.length} {mode === 'document' ? 'Dokumente' : 'Tage'} |{' '}
          {visibleCodes.size} Codes sichtbar
        </span>
        <span>
          Gesamt: {codings.length} Kodierungen
        </span>
      </div>
    </div>
  )
}
