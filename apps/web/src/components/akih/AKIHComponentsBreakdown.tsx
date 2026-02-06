/**
 * AKIH Components Breakdown
 * Radar or Bar chart showing the 8 AKIH components
 */

import { useState, useMemo } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { IconChartRadar, IconChartBar } from '@tabler/icons-react'
import type { AKIHComponent } from '@/types/akih'

interface AKIHComponentsBreakdownProps {
  components: AKIHComponent[]
  showToggle?: boolean
  defaultView?: 'radar' | 'bar'
  height?: number
}

export default function AKIHComponentsBreakdown({
  components,
  showToggle = true,
  defaultView = 'radar',
  height = 300,
}: AKIHComponentsBreakdownProps) {
  const [viewType, setViewType] = useState<'radar' | 'bar'>(defaultView)

  // Prepare data for charts
  const chartData = useMemo(() => {
    return components.map(comp => ({
      name: comp.name,
      shortName: comp.name.substring(0, 6),
      score: comp.score,
      fullMark: 100,
      color: comp.color,
      description: comp.description,
    }))
  }, [components])

  // Calculate average score
  const avgScore = useMemo(() => {
    const sum = components.reduce((acc, c) => acc + c.score, 0)
    return sum / components.length
  }, [components])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-surface-800 border border-surface-700 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-surface-100">{data.name}</p>
          <p className="text-xs text-surface-400 mt-1">{data.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-sm text-surface-200 font-medium">
              {data.score.toFixed(1)}%
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-3">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-surface-300">Komponenten</h4>
          <span className="text-xs text-surface-500">
            Ø {avgScore.toFixed(1)}%
          </span>
        </div>

        {showToggle && (
          <div className="flex items-center gap-1 bg-surface-800 rounded-lg p-1">
            <button
              onClick={() => setViewType('radar')}
              className={`p-1.5 rounded transition-colors ${
                viewType === 'radar'
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
              title="Radar-Ansicht"
            >
              <IconChartRadar size={14} />
            </button>
            <button
              onClick={() => setViewType('bar')}
              className={`p-1.5 rounded transition-colors ${
                viewType === 'bar'
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
              title="Balken-Ansicht"
            >
              <IconChartBar size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="bg-surface-900 rounded-xl border border-surface-800 p-4">
        {viewType === 'radar' ? (
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis
                dataKey="shortName"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={{ stroke: '#475569' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 9 }}
                tickCount={5}
                axisLine={{ stroke: '#475569' }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={2}
                dot={{ r: 4, fill: '#3b82f6', stroke: '#0f172a', strokeWidth: 1 }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={{ stroke: '#475569' }}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={{ stroke: '#475569' }}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {components.map(comp => (
          <div
            key={comp.id}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface-800/50 ${
              comp.score < 50 ? 'ring-1 ring-red-500/30' : ''
            }`}
          >
            <span
              className="w-2 h-2 rounded-sm flex-shrink-0"
              style={{ backgroundColor: comp.color }}
            />
            <span className="text-xs text-surface-400 truncate flex-1">
              {comp.name}
            </span>
            <span
              className={`text-xs font-medium ${
                comp.score >= 70
                  ? 'text-green-400'
                  : comp.score >= 50
                    ? 'text-amber-400'
                    : 'text-red-400'
              }`}
            >
              {comp.score.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
