/**
 * useAKIHScore Hook
 *
 * React hook for calculating and managing AKIH scores
 */

import { useState, useCallback, useMemo } from 'react'
import { getAKIHService, type AKIHScoreService } from '@/services/AKIHScoreService'
import type {
  AKIHScoreResult,
  AKIHConfig,
  AKIHCalculationInput,
  ValidationStatus,
  CodingValidation,
} from '@/types/akih'

interface UseAKIHScoreOptions {
  config?: Partial<AKIHConfig>
  autoCalculate?: boolean
}

interface UseAKIHScoreReturn {
  // State
  result: AKIHScoreResult | null
  isCalculating: boolean
  error: string | null

  // Service
  service: AKIHScoreService

  // Actions
  calculateScore: (input: AKIHCalculationInput) => AKIHScoreResult
  validateCoding: (
    codingId: string,
    status: ValidationStatus,
    options?: { newCodeId?: string; notes?: string; validatedBy: string }
  ) => CodingValidation
  reset: () => void

  // Helpers
  isEnabled: boolean
  qualityColor: string
  qualityLabel: string
  scorePercent: number
}

/**
 * Hook for using AKIH Score functionality
 */
export function useAKIHScore(options: UseAKIHScoreOptions = {}): UseAKIHScoreReturn {
  const { config } = options

  // Get service instance
  const service = useMemo(() => getAKIHService(config), [config])

  // State
  const [result, setResult] = useState<AKIHScoreResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate score
  const calculateScore = useCallback(
    (input: AKIHCalculationInput): AKIHScoreResult => {
      setIsCalculating(true)
      setError(null)

      try {
        const scoreResult = service.calculateScore(input)
        setResult(scoreResult)
        return scoreResult
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Score calculation failed'
        setError(errorMessage)
        throw err
      } finally {
        setIsCalculating(false)
      }
    },
    [service]
  )

  // Validate coding
  const validateCoding = useCallback(
    (
      codingId: string,
      status: ValidationStatus,
      options?: { newCodeId?: string; notes?: string; validatedBy: string }
    ): CodingValidation => {
      return service.validateCoding(codingId, status, options)
    },
    [service]
  )

  // Reset
  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setIsCalculating(false)
  }, [])

  // Derived values
  const isEnabled = service.isEnabled()

  const qualityColor = result
    ? result.qualityLevel === 'excellent'
      ? '#22c55e'
      : result.qualityLevel === 'good'
        ? '#3b82f6'
        : result.qualityLevel === 'acceptable'
          ? '#f59e0b'
          : '#ef4444'
    : '#64748b'

  const qualityLabel = result
    ? result.qualityLevel === 'excellent'
      ? 'Exzellent'
      : result.qualityLevel === 'good'
        ? 'Gut'
        : result.qualityLevel === 'acceptable'
          ? 'Akzeptabel'
          : 'Kritisch'
    : 'Nicht berechnet'

  const scorePercent = result ? result.score : 0

  return {
    result,
    isCalculating,
    error,
    service,
    calculateScore,
    validateCoding,
    reset,
    isEnabled,
    qualityColor,
    qualityLabel,
    scorePercent,
  }
}

// ============================================================================
// DERIVED HOOKS
// ============================================================================

/**
 * Hook to get only the summary values (for mini displays)
 */
export function useAKIHSummary(result: AKIHScoreResult | null) {
  return useMemo(() => {
    if (!result) {
      return {
        score: 0,
        level: 'Nicht berechnet',
        color: '#64748b',
        hvPercent: 0,
        tiPercent: 0,
        validationPercent: 0,
        trendDirection: 'stable' as const,
        trendChange: 0,
      }
    }

    const service = getAKIHService()
    const summary = service.getScoreSummary(result)

    return {
      ...summary,
      trendDirection: result.trend?.direction || 'stable',
      trendChange: result.trend?.change || 0,
    }
  }, [result])
}

/**
 * Hook to get validation queue for a list of codings
 */
export function useValidationQueue(
  codings: AKIHCalculationInput['codings']
) {
  return useMemo(() => {
    const pending = codings.filter(
      c => c.codingMethod !== 'manual' && (!c.validation || c.validation.status === 'pending')
    )

    const validated = codings.filter(
      c => c.validation && c.validation.status !== 'pending'
    )

    return {
      pending,
      validated,
      total: codings.filter(c => c.codingMethod !== 'manual').length,
      progress: validated.length / Math.max(1, pending.length + validated.length) * 100,
    }
  }, [codings])
}

export default useAKIHScore
