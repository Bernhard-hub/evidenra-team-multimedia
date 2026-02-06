/**
 * Persona Radar Chart
 * Sprint 5 - Visualization Roadmap
 *
 * Features:
 * - Radar/Spider chart for persona comparison
 * - Multiple profiles overlay
 * - Normalized values (0-100%)
 * - Export for reports
 * - Interactive legend
 */

import { useState, useMemo, useRef, useCallback } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  IconInfoCircle,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconPlus,
  IconX,
} from '@tabler/icons-react'

interface Dimension {
  id: string
  name: string
  description?: string
}

interface PersonaProfile {
  id: string
  name: string
  color: string
  values: Record<string, number> // dimensionId -> value (0-100)
  description?: string
}

interface PersonaRadarChartProps {
  dimensions: Dimension[]
  profiles: PersonaProfile[]
  title?: string
  showExport?: boolean
  maxValue?: number
  onProfileClick?: (profileId: string) => void
}

// Predefined colors for profiles
const PROFILE_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

export default function PersonaRadarChart({
  dimensions,
  profiles,
  title = 'Persona-Vergleich',
  showExport = true,
  maxValue = 100,
  onProfileClick,
}: PersonaRadarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [visibleProfiles, setVisibleProfiles] = useState<Set<string>>(
    new Set(profiles.map((p) => p.id))
  )
  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null)

  // Prepare data for Recharts
  const chartData = useMemo(() => {
    return dimensions.map((dim) => {
      const dataPoint: any = {
        dimension: dim.name,
        dimensionId: dim.id,
        fullMark: maxValue,
      }

      profiles.forEach((profile) => {
        dataPoint[profile.id] = profile.values[dim.id] || 0
      })

      return dataPoint
    })
  }, [dimensions, profiles, maxValue])

  // Calculate average profile
  const averageProfile = useMemo(() => {
    if (profiles.length === 0) return null

    const avgValues: Record<string, number> = {}
    dimensions.forEach((dim) => {
      const values = profiles.map((p) => p.values[dim.id] || 0)
      avgValues[dim.id] = values.reduce((a, b) => a + b, 0) / values.length
    })

    return {
      id: '__average__',
      name: 'Durchschnitt',
      color: '#64748b',
      values: avgValues,
    }
  }, [profiles, dimensions])

  // Toggle profile visibility
  const toggleProfile = (profileId: string) => {
    const newVisible = new Set(visibleProfiles)
    if (newVisible.has(profileId)) {
      if (newVisible.size > 1) {
        newVisible.delete(profileId)
      }
    } else {
      newVisible.add(profileId)
    }
    setVisibleProfiles(newVisible)
  }

  // Show all profiles
  const showAllProfiles = () => {
    setVisibleProfiles(new Set(profiles.map((p) => p.id)))
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
      link.download = `persona_radar_${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
    }
  }, [])

  if (dimensions.length < 3) {
    return (
      <div className="text-center py-12 text-surface-500">
        <IconInfoCircle size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm">Mindestens 3 Dimensionen erforderlich</p>
        <p className="text-xs mt-1">Fuegen Sie mehr Dimensionen hinzu</p>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12 text-surface-500">
        <IconInfoCircle size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm">Keine Profile vorhanden</p>
        <p className="text-xs mt-1">Erstellen Sie Persona-Profile zum Vergleich</p>
      </div>
    )
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-800 border border-surface-700 rounded-lg p-3 shadow-xl">
          <p className="text-sm text-surface-200 font-medium mb-2">{label}</p>
          <div className="space-y-1">
            {payload
              .filter((p: any) => visibleProfiles.has(p.dataKey) || p.dataKey === '__average__')
              .map((p: any) => {
                const profile = profiles.find((pr) => pr.id === p.dataKey) || averageProfile
                return (
                  <div key={p.dataKey} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: profile?.color }}
                    />
                    <span className="text-surface-400">{profile?.name}:</span>
                    <span className="text-surface-200 font-medium">{p.value.toFixed(1)}%</span>
                  </div>
                )
              })}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-surface-100">{title}</h3>
          <div className="group relative">
            <IconInfoCircle size={16} className="text-surface-500 cursor-help" />
            <div className="absolute left-0 top-6 w-64 p-3 bg-surface-800 border border-surface-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <p className="text-xs text-surface-300">
                Radar-Diagramm zum Vergleich verschiedener Profile ueber mehrere Dimensionen.
                Klicken Sie auf die Legende, um Profile ein-/auszublenden.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={showAllProfiles}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
          >
            <IconEye size={14} />
            Alle
          </button>
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
      <div ref={chartRef} className="bg-surface-900 rounded-xl p-6 border border-surface-800">
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={{ stroke: '#475569' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, maxValue]}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickCount={5}
              axisLine={{ stroke: '#475569' }}
            />

            {/* Render visible profiles */}
            {profiles
              .filter((p) => visibleProfiles.has(p.id))
              .map((profile, idx) => (
                <Radar
                  key={profile.id}
                  name={profile.name}
                  dataKey={profile.id}
                  stroke={profile.color}
                  fill={profile.color}
                  fillOpacity={hoveredProfile === profile.id ? 0.4 : 0.15}
                  strokeWidth={hoveredProfile === profile.id ? 3 : 2}
                  dot={{
                    r: hoveredProfile === profile.id ? 5 : 3,
                    fill: profile.color,
                    stroke: '#0f172a',
                    strokeWidth: 1,
                  }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              ))}

            {/* Average profile (optional, dashed) */}
            {averageProfile && visibleProfiles.has('__average__') && (
              <Radar
                name="Durchschnitt"
                dataKey="__average__"
                stroke={averageProfile.color}
                fill="none"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}

            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / Profile selector */}
      <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-surface-300">Profile</h4>
          <span className="text-xs text-surface-500">
            {visibleProfiles.size} von {profiles.length} sichtbar
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {profiles.map((profile) => {
            const isVisible = visibleProfiles.has(profile.id)
            return (
              <button
                key={profile.id}
                onClick={() => toggleProfile(profile.id)}
                onMouseEnter={() => setHoveredProfile(profile.id)}
                onMouseLeave={() => setHoveredProfile(null)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  isVisible
                    ? 'bg-surface-800 text-surface-200'
                    : 'bg-surface-800/50 text-surface-500'
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full transition-opacity ${
                    isVisible ? 'opacity-100' : 'opacity-30'
                  }`}
                  style={{ backgroundColor: profile.color }}
                />
                <span>{profile.name}</span>
                {isVisible ? (
                  <IconEye size={12} className="text-surface-400" />
                ) : (
                  <IconEyeOff size={12} className="text-surface-600" />
                )}
              </button>
            )
          })}

          {/* Average toggle */}
          {averageProfile && (
            <button
              onClick={() => {
                const newVisible = new Set(visibleProfiles)
                if (newVisible.has('__average__')) {
                  newVisible.delete('__average__')
                } else {
                  newVisible.add('__average__')
                }
                setVisibleProfiles(newVisible)
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all border border-dashed ${
                visibleProfiles.has('__average__')
                  ? 'border-surface-600 text-surface-300'
                  : 'border-surface-700 text-surface-500'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border-2"
                style={{ borderColor: averageProfile.color }}
              />
              <span>Durchschnitt</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile details on hover */}
      {hoveredProfile && (
        <div className="bg-surface-800 border border-surface-700 rounded-lg p-4">
          {(() => {
            const profile = profiles.find((p) => p.id === hoveredProfile)
            if (!profile) return null

            return (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: profile.color }}
                  />
                  <span className="font-medium text-surface-100">{profile.name}</span>
                </div>
                {profile.description && (
                  <p className="text-sm text-surface-400 mb-3">{profile.description}</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {dimensions.map((dim) => (
                    <div key={dim.id} className="bg-surface-900 rounded px-2 py-1">
                      <p className="text-xs text-surface-500 truncate">{dim.name}</p>
                      <p className="text-sm font-medium text-surface-200">
                        {(profile.values[dim.id] || 0).toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* Dimension legend */}
      <div className="text-xs text-surface-500 px-2">
        <p className="font-medium text-surface-400 mb-1">Dimensionen:</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {dimensions.map((dim) => (
            <span key={dim.id} title={dim.description}>
              {dim.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
