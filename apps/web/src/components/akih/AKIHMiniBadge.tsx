/**
 * AKIH Mini Badge
 * Compact score display for coding panel and other compact spaces
 */

import { useMemo } from 'react'
import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react'
import { QUALITY_THRESHOLDS, type QualityLevel } from '@/types/akih'

interface AKIHMiniBadgeProps {
  score: number
  qualityLevel: QualityLevel
  trend?: {
    direction: 'up' | 'down' | 'stable'
    change: number
  }
  validationPending?: number
  onClick?: () => void
  size?: 'sm' | 'md'
  showLabel?: boolean
}

export default function AKIHMiniBadge({
  score,
  qualityLevel,
  trend,
  validationPending,
  onClick,
  size = 'md',
  showLabel = false,
}: AKIHMiniBadgeProps) {
  const threshold = QUALITY_THRESHOLDS[qualityLevel]

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
  }

  const TrendIcon = useMemo(() => {
    if (!trend) return null
    const iconSize = size === 'sm' ? 10 : 12

    switch (trend.direction) {
      case 'up':
        return <IconTrendingUp size={iconSize} className="text-green-400" />
      case 'down':
        return <IconTrendingDown size={iconSize} className="text-red-400" />
      default:
        return <IconMinus size={iconSize} className="text-surface-500" />
    }
  }, [trend, size])

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center rounded-lg font-medium transition-all
        ${sizeClasses[size]}
        ${onClick ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}
      `}
      style={{
        backgroundColor: `${threshold.color}15`,
        border: `1px solid ${threshold.color}40`,
        color: threshold.color,
      }}
      title={`AKIH Score: ${score.toFixed(1)} (${threshold.label})`}
    >
      {/* Score circle */}
      <span
        className={`
          flex items-center justify-center rounded-full font-bold
          ${size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'}
        `}
        style={{ backgroundColor: `${threshold.color}30` }}
      >
        {Math.round(score)}
      </span>

      {/* Label */}
      {showLabel && (
        <span className="text-surface-300">AKIH</span>
      )}

      {/* Trend */}
      {TrendIcon}

      {/* Validation pending badge */}
      {validationPending !== undefined && validationPending > 0 && (
        <span
          className={`
            flex items-center justify-center rounded-full bg-amber-500 text-white font-medium
            ${size === 'sm' ? 'w-4 h-4 text-[9px]' : 'w-5 h-5 text-[10px]'}
          `}
          title={`${validationPending} Kodierungen zu validieren`}
        >
          {validationPending > 99 ? '99+' : validationPending}
        </span>
      )}
    </button>
  )
}

/**
 * AKIH Score Bar
 * Horizontal progress bar variant
 */
export function AKIHScoreBar({
  score,
  qualityLevel,
  showLabel = true,
  height = 'md',
}: {
  score: number
  qualityLevel: QualityLevel
  showLabel?: boolean
  height?: 'sm' | 'md' | 'lg'
}) {
  const threshold = QUALITY_THRESHOLDS[qualityLevel]

  const heightClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  }

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-surface-400">AKIH</span>
          <span style={{ color: threshold.color }}>{score.toFixed(0)}%</span>
        </div>
      )}
      <div className={`bg-surface-800 rounded-full overflow-hidden ${heightClasses[height]}`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, Math.max(0, score))}%`,
            backgroundColor: threshold.color,
          }}
        />
      </div>
    </div>
  )
}

/**
 * AKIH Validation Counter
 * Shows pending validations with action button
 */
export function AKIHValidationCounter({
  pending,
  total,
  onClick,
}: {
  pending: number
  total: number
  onClick?: () => void
}) {
  const progress = total > 0 ? ((total - pending) / total) * 100 : 100

  if (pending === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Alle validiert</span>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-xs transition-colors"
    >
      <div className="relative w-4 h-4">
        <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeOpacity="0.2"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${progress} 100`}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span>{pending} zu validieren</span>
    </button>
  )
}
