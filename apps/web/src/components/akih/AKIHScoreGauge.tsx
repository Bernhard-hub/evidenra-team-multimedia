/**
 * AKIH Score Gauge
 * Circular gauge visualization for the main AKIH score
 */

import { useMemo } from 'react'
import { QUALITY_THRESHOLDS, type QualityLevel } from '@/types/akih'

interface AKIHScoreGaugeProps {
  score: number
  qualityLevel: QualityLevel
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
  trend?: {
    direction: 'up' | 'down' | 'stable'
    change: number
  }
}

const SIZE_CONFIG = {
  sm: { width: 120, strokeWidth: 8, fontSize: 24, labelSize: 10 },
  md: { width: 180, strokeWidth: 12, fontSize: 36, labelSize: 12 },
  lg: { width: 240, strokeWidth: 16, fontSize: 48, labelSize: 14 },
}

export default function AKIHScoreGauge({
  score,
  qualityLevel,
  size = 'md',
  showLabel = true,
  animated = true,
  trend,
}: AKIHScoreGaugeProps) {
  const config = SIZE_CONFIG[size]
  const radius = (config.width - config.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const threshold = QUALITY_THRESHOLDS[qualityLevel]

  // Calculate stroke offset for progress
  const progress = Math.min(100, Math.max(0, score)) / 100
  const strokeDashoffset = circumference * (1 - progress)

  // Trend icon
  const TrendIcon = useMemo(() => {
    if (!trend) return null

    if (trend.direction === 'up') {
      return (
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )
    } else if (trend.direction === 'down') {
      return (
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    )
  }, [trend])

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* SVG Gauge */}
      <svg
        width={config.width}
        height={config.width}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          className="text-surface-800"
        />

        {/* Progress circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke={threshold.color}
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={animated ? 'transition-all duration-1000 ease-out' : ''}
        />

        {/* Glow effect */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke={threshold.color}
          strokeWidth={config.strokeWidth / 2}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          opacity={0.3}
          filter="blur(4px)"
          className={animated ? 'transition-all duration-1000 ease-out' : ''}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Score */}
        <span
          className="font-bold text-surface-100"
          style={{ fontSize: config.fontSize }}
        >
          {Math.round(score)}
        </span>

        {/* Trend indicator */}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {TrendIcon}
            <span
              className={`text-xs font-medium ${
                trend.direction === 'up'
                  ? 'text-green-400'
                  : trend.direction === 'down'
                    ? 'text-red-400'
                    : 'text-surface-400'
              }`}
            >
              {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <div className="mt-2 text-center">
          <span
            className="font-medium"
            style={{ color: threshold.color, fontSize: config.labelSize }}
          >
            {threshold.label}
          </span>
        </div>
      )}
    </div>
  )
}
