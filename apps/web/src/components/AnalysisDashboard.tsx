import { useState } from 'react'
import CodeFrequencyChart from './CodeFrequencyChart'
import CoOccurrenceMatrix from './CoOccurrenceMatrix'
import CodingTimeline from './CodingTimeline'
import IRRPanel from './IRRPanel'
import type { Code, Coding, Document } from '@/stores/projectStore'

interface AnalysisDashboardProps {
  codes: Code[]
  codings: Coding[]
  documents: Document[]
}

type ChartType = 'frequency' | 'cooccurrence' | 'timeline' | 'methods' | 'irr'

export default function AnalysisDashboard({
  codes,
  codings,
  documents,
}: AnalysisDashboardProps) {
  const [activeChart, setActiveChart] = useState<ChartType>('frequency')
  const [timelineRange, setTimelineRange] = useState(30)

  // Calculate statistics
  const stats = {
    totalCodings: codings.length,
    totalCodes: codes.length,
    avgCodingsPerDoc: documents.length > 0
      ? (codings.length / documents.length).toFixed(1)
      : '0',
    mostUsedCode: codes.reduce((max, code) => {
      const count = codings.filter(c => c.codeId === code.id).length
      const maxCount = codings.filter(c => c.codeId === max?.id).length
      return count > maxCount ? code : max
    }, codes[0]),
    codingMethods: {
      manual: codings.filter(c => c.codingMethod === 'manual').length,
      ai: codings.filter(c => c.codingMethod && c.codingMethod !== 'manual').length,
    },
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Kodierungen"
          value={stats.totalCodings}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
          color="primary"
        />
        <StatCard
          label="Codes"
          value={stats.totalCodes}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          label="Ø pro Dokument"
          value={stats.avgCodingsPerDoc}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          color="green"
        />
        <StatCard
          label="AI-Kodierungen"
          value={stats.codingMethods.ai}
          subtitle={`${Math.round((stats.codingMethods.ai / Math.max(stats.totalCodings, 1)) * 100)}%`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          color="purple"
        />
      </div>

      {/* Chart Selector */}
      <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
        <div className="flex border-b border-surface-800">
          <ChartTab
            label="Code-Häufigkeit"
            isActive={activeChart === 'frequency'}
            onClick={() => setActiveChart('frequency')}
          />
          <ChartTab
            label="Ko-Okkurrenz"
            isActive={activeChart === 'cooccurrence'}
            onClick={() => setActiveChart('cooccurrence')}
          />
          <ChartTab
            label="Zeitverlauf"
            isActive={activeChart === 'timeline'}
            onClick={() => setActiveChart('timeline')}
          />
          <ChartTab
            label="Methoden"
            isActive={activeChart === 'methods'}
            onClick={() => setActiveChart('methods')}
          />
          <ChartTab
            label="IRR"
            isActive={activeChart === 'irr'}
            onClick={() => setActiveChart('irr')}
          />
        </div>

        <div className="p-6">
          {/* Timeline Range Selector */}
          {activeChart === 'timeline' && (
            <div className="mb-4 flex items-center gap-3">
              <span className="text-sm text-surface-400">Zeitraum:</span>
              {[7, 14, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setTimelineRange(days)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    timelineRange === days
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-surface-400 hover:text-surface-200'
                  }`}
                >
                  {days} Tage
                </button>
              ))}
            </div>
          )}

          {/* Charts */}
          {activeChart === 'frequency' && (
            <CodeFrequencyChart codes={codes} codings={codings} maxBars={10} />
          )}

          {activeChart === 'cooccurrence' && (
            <CoOccurrenceMatrix
              codes={codes}
              codings={codings}
              documents={documents}
              maxCodes={8}
            />
          )}

          {activeChart === 'timeline' && (
            <CodingTimeline
              codings={codings}
              codes={codes}
              days={timelineRange}
            />
          )}

          {activeChart === 'methods' && (
            <CodingMethodsChart codings={codings} />
          )}

          {activeChart === 'irr' && (
            <IRRPanel
              codings={codings}
              codes={codes}
              documents={documents}
            />
          )}
        </div>
      </div>

      {/* Most Used Code */}
      {stats.mostUsedCode && (
        <div className="bg-surface-900 rounded-xl border border-surface-800 p-6">
          <h3 className="text-lg font-semibold text-surface-100 mb-4">Häufigster Code</h3>
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${stats.mostUsedCode.color}20` }}
            >
              <span
                className="w-6 h-6 rounded"
                style={{ backgroundColor: stats.mostUsedCode.color }}
              />
            </div>
            <div>
              <p className="font-medium text-surface-100">{stats.mostUsedCode.name}</p>
              <p className="text-sm text-surface-400">
                {codings.filter(c => c.codeId === stats.mostUsedCode?.id).length} Kodierungen
              </p>
              {stats.mostUsedCode.description && (
                <p className="text-sm text-surface-500 mt-1">{stats.mostUsedCode.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  subtitle,
  icon,
  color,
}: {
  label: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: 'primary' | 'blue' | 'green' | 'purple'
}) {
  const colorClasses = {
    primary: 'text-primary-400 bg-primary-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  }

  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-surface-400">{label}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-surface-100">{value}</p>
        {subtitle && <span className="text-sm text-surface-500">{subtitle}</span>}
      </div>
    </div>
  )
}

function ChartTab({
  label,
  isActive,
  onClick,
}: {
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium transition-colors ${
        isActive
          ? 'text-primary-400 border-b-2 border-primary-500 -mb-px'
          : 'text-surface-400 hover:text-surface-200'
      }`}
    >
      {label}
    </button>
  )
}

function CodingMethodsChart({ codings }: { codings: Coding[] }) {
  // Group by coding method
  const methodCounts = codings.reduce((acc, coding) => {
    const method = coding.codingMethod || 'manual'
    acc[method] = (acc[method] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const methodLabels: Record<string, { label: string; color: string }> = {
    manual: { label: 'Manuell', color: '#6b7280' },
    dynamic_personas: { label: 'Dynamic Personas', color: '#8b5cf6' },
    three_expert: { label: 'Three Expert', color: '#3b82f6' },
    calibrated_pattern: { label: 'Calibrated Pattern', color: '#22c55e' },
    ultra_turbo: { label: 'Ultra Turbo', color: '#f59e0b' },
  }

  const data = Object.entries(methodCounts)
    .map(([method, count]) => ({
      method,
      count,
      label: methodLabels[method]?.label || method,
      color: methodLabels[method]?.color || '#888',
    }))
    .sort((a, b) => b.count - a.count)

  const total = codings.length

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-surface-500">
        <p className="text-sm">Keine Kodierungen vorhanden</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Pie chart representation using bars */}
      <div className="h-8 rounded-full overflow-hidden flex bg-surface-800">
        {data.map((item) => (
          <div
            key={item.method}
            className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(item.count / total) * 100}%`,
              backgroundColor: item.color,
            }}
            title={`${item.label}: ${item.count} (${Math.round((item.count / total) * 100)}%)`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {data.map((item) => (
          <div key={item.method} className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-surface-300 flex-1">{item.label}</span>
            <span className="text-sm text-surface-500">
              {item.count} ({Math.round((item.count / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
