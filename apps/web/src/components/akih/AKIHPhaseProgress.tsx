/**
 * AKIH Phase Progress
 * Shows progress across the 7 research phases
 */

import { useMemo } from 'react'
import type { ResearchPhase } from '@/types/akih'

interface AKIHPhaseProgressProps {
  phases: ResearchPhase[]
  showDetails?: boolean
  compact?: boolean
}

export default function AKIHPhaseProgress({
  phases,
  showDetails = true,
  compact = false,
}: AKIHPhaseProgressProps) {
  // Calculate weighted total
  const weightedScore = useMemo(() => {
    return phases.reduce((sum, phase) => sum + phase.weight * phase.score, 0)
  }, [phases])

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-surface-400">Phasen-Score</span>
          <span className="text-surface-200 font-medium">{weightedScore.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-surface-800 rounded-full overflow-hidden flex">
          {phases.map((phase, idx) => (
            <div
              key={phase.id}
              className="h-full transition-all duration-500"
              style={{
                width: `${phase.weight * 100}%`,
                backgroundColor: getPhaseColor(phase.score),
                opacity: 0.6 + (phase.score / 100) * 0.4,
              }}
              title={`${phase.name}: ${phase.score.toFixed(0)}%`}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-surface-300">Forschungsphasen</h4>
        <span className="text-xs text-surface-500">
          Gewichtet: {weightedScore.toFixed(1)}%
        </span>
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {phases.map((phase) => (
          <div key={phase.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-surface-300">{phase.name}</span>
                <span className="text-surface-600">({(phase.weight * 100).toFixed(0)}%)</span>
              </div>
              <span
                className={`font-medium ${
                  phase.score >= 70
                    ? 'text-green-400'
                    : phase.score >= 50
                      ? 'text-amber-400'
                      : 'text-red-400'
                }`}
              >
                {phase.score.toFixed(0)}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${phase.score}%`,
                  backgroundColor: getPhaseColor(phase.score),
                }}
              />
            </div>

            {/* Details */}
            {showDetails && (
              <div className="flex items-center gap-4 text-xs text-surface-500">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>AI: {phase.aiUsage}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Human: {phase.humanValidation}%</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Formula display */}
      <div className="bg-surface-800/50 rounded-lg p-3 text-xs text-surface-400">
        <span className="font-mono">
          Σ(wᵢ × Pᵢ) = {phases.map(p => `${(p.weight * 100).toFixed(0)}% × ${p.score.toFixed(0)}`).join(' + ')}
        </span>
      </div>
    </div>
  )
}

function getPhaseColor(score: number): string {
  if (score >= 70) return '#22c55e' // green
  if (score >= 50) return '#f59e0b' // amber
  return '#ef4444' // red
}
