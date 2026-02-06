/**
 * AKIH Score Service
 * AI-Kodierung Human-Integration Score
 *
 * Main service for calculating and managing AKIH scores
 *
 * Formula: AKIH-Score = Σ(wᵢ × Pᵢ) × TI × HV
 * - Pᵢ = Phase scores (7 research phases)
 * - wᵢ = Weights per phase
 * - TI = Transparency Index (0.5-1.0)
 * - HV = Human Validation (0.5-1.0)
 */

import type {
  AKIHCalculationInput,
  AKIHScoreResult,
  AKIHSuggestion,
  AKIHConfig,
  AKIHComponent,
  AKIHComponentId,
  ValidationStatus,
  CodingValidation,
} from '@/types/akih'

import {
  DEFAULT_AKIH_CONFIG,
  QUALITY_THRESHOLDS,
} from '@/types/akih'

import {
  calculateValidationStats,
  calculateHumanValidation,
  calculateTransparencyIndex,
  calculateAllComponents,
  calculatePhaseScores,
  calculateWeightedPhaseScore,
  calculateAKIHScore,
  getQualityLevel,
} from '@/lib/akihCalculations'

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class AKIHScoreService {
  private config: AKIHConfig
  private lastResult: AKIHScoreResult | null = null

  constructor(config?: Partial<AKIHConfig>) {
    this.config = { ...DEFAULT_AKIH_CONFIG, ...config }
  }

  // --------------------------------------------------------------------------
  // CONFIGURATION
  // --------------------------------------------------------------------------

  /**
   * Update service configuration
   */
  setConfig(config: Partial<AKIHConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): AKIHConfig {
    return { ...this.config }
  }

  /**
   * Check if AKIH scoring is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled
  }

  // --------------------------------------------------------------------------
  // MAIN CALCULATION
  // --------------------------------------------------------------------------

  /**
   * Calculate the complete AKIH score
   */
  calculateScore(input: AKIHCalculationInput): AKIHScoreResult {
    const { codings, codes, documents, phases } = input

    // Step 1: Calculate validation statistics
    const validationStats = calculateValidationStats(codings)

    // Step 2: Calculate HV (Human Validation factor)
    const humanValidation = calculateHumanValidation(validationStats)

    // Step 3: Calculate TI (Transparency Index)
    const transparencyIndex = calculateTransparencyIndex(codings)

    // Step 4: Calculate phase scores
    const phaseResults = calculatePhaseScores(phases)
    const phaseScore = calculateWeightedPhaseScore(phaseResults)

    // Step 5: Calculate component scores
    const components = calculateAllComponents(input, validationStats)

    // Step 6: Calculate final AKIH score
    const score = calculateAKIHScore(phaseScore, transparencyIndex, humanValidation)
    const qualityLevel = getQualityLevel(score)

    // Step 7: Generate suggestions
    const suggestions = this.generateSuggestions(components, validationStats, score)

    // Step 8: Calculate trend
    const trend = this.calculateTrend(score)

    const result: AKIHScoreResult = {
      score,
      qualityLevel,
      transparencyIndex,
      humanValidation,
      phaseScore,
      components,
      phases: phaseResults,
      validationStats,
      calculatedAt: new Date(),
      suggestions,
      trend,
    }

    // Store for trend calculation
    this.lastResult = result

    return result
  }

  // --------------------------------------------------------------------------
  // VALIDATION HELPERS
  // --------------------------------------------------------------------------

  /**
   * Validate a single coding (mark as accepted/modified/rejected)
   */
  validateCoding(
    codingId: string,
    status: ValidationStatus,
    options?: {
      newCodeId?: string
      notes?: string
      validatedBy: string
    }
  ): CodingValidation {
    return {
      status,
      validatedBy: options?.validatedBy || 'unknown',
      validatedAt: new Date(),
      newCodeId: status === 'modified' ? options?.newCodeId : undefined,
      notes: options?.notes,
    }
  }

  /**
   * Get validation summary for a project
   */
  getValidationSummary(codings: AKIHCalculationInput['codings']): {
    total: number
    validated: number
    pending: number
    progress: number
    breakdown: Record<ValidationStatus, number>
  } {
    const stats = calculateValidationStats(codings)

    return {
      total: stats.total,
      validated: stats.accepted + stats.modified + stats.rejected,
      pending: stats.pending,
      progress: stats.validationRate * 100,
      breakdown: {
        pending: stats.pending,
        accepted: stats.accepted,
        modified: stats.modified,
        rejected: stats.rejected,
      },
    }
  }

  // --------------------------------------------------------------------------
  // SUGGESTIONS
  // --------------------------------------------------------------------------

  /**
   * Generate improvement suggestions based on scores
   */
  private generateSuggestions(
    components: AKIHComponent[],
    validationStats: { validationRate: number; pending: number; total: number },
    overallScore: number
  ): AKIHSuggestion[] {
    const suggestions: AKIHSuggestion[] = []

    // Check each component for low scores
    for (const component of components) {
      if (component.score < 50) {
        suggestions.push(this.getSuggestionForComponent(component, 'high'))
      } else if (component.score < 70) {
        suggestions.push(this.getSuggestionForComponent(component, 'medium'))
      }
    }

    // Check validation rate
    if (validationStats.validationRate < 0.5 && validationStats.total > 0) {
      suggestions.push({
        id: 'validation-rate',
        priority: 'high',
        category: 'general',
        title: 'Mehr Kodierungen validieren',
        description: `Nur ${Math.round(validationStats.validationRate * 100)}% der AI-Kodierungen wurden validiert. Validieren Sie mindestens ${validationStats.pending} weitere Kodierungen.`,
        impact: 15,
      })
    }

    // Sort by priority and impact
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    suggestions.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return b.impact - a.impact
    })

    return suggestions.slice(0, 5) // Return top 5 suggestions
  }

  /**
   * Get specific suggestion for a component
   */
  private getSuggestionForComponent(
    component: AKIHComponent,
    priority: 'high' | 'medium' | 'low'
  ): AKIHSuggestion {
    const suggestionMap: Record<AKIHComponentId, { title: string; description: string }> = {
      precision: {
        title: 'Kodierungsgenauigkeit verbessern',
        description: 'Überprüfen Sie abgelehnte/modifizierte Kodierungen und verfeinern Sie die Code-Definitionen.',
      },
      recall: {
        title: 'Kodierungsvollständigkeit erhöhen',
        description: 'Stellen Sie sicher, dass alle relevanten Textstellen kodiert sind. Prüfen Sie nicht-kodierte Dokumente.',
      },
      consistency: {
        title: 'Konsistenz zwischen Kodierern verbessern',
        description: 'Führen Sie Kalibrierungssitzungen durch und klären Sie mehrdeutige Code-Definitionen.',
      },
      saturation: {
        title: 'Theoretische Sättigung prüfen',
        description: 'Prüfen Sie, ob neue Codes noch emergieren oder ob Sättigung erreicht ist.',
      },
      coverage: {
        title: 'Datenmaterial-Abdeckung erhöhen',
        description: 'Einige Dokumente sind nicht oder nur wenig kodiert. Erweitern Sie die Kodierung.',
      },
      integration: {
        title: 'Code-Hierarchie strukturieren',
        description: 'Organisieren Sie Codes in Kategorien und erstellen Sie eine sinnvolle Hierarchie.',
      },
      traceability: {
        title: 'AI-Nachvollziehbarkeit verbessern',
        description: 'Dokumentieren Sie AI-Entscheidungen besser. Aktivieren Sie AI-Reasoning in den Einstellungen.',
      },
      reflexivity: {
        title: 'Mehr Reflexion dokumentieren',
        description: 'Fügen Sie Notizen zu Validierungen hinzu und dokumentieren Sie Ihre Überlegungen.',
      },
    }

    const suggestion = suggestionMap[component.id]
    const impact = Math.round((70 - component.score) * component.weight * 100) / 100

    return {
      id: `component-${component.id}`,
      priority,
      category: component.id,
      title: suggestion.title,
      description: suggestion.description,
      impact: Math.max(1, impact),
    }
  }

  // --------------------------------------------------------------------------
  // TREND CALCULATION
  // --------------------------------------------------------------------------

  /**
   * Calculate trend compared to previous result
   */
  private calculateTrend(currentScore: number): AKIHScoreResult['trend'] | undefined {
    if (!this.lastResult) return undefined

    const previousScore = this.lastResult.score
    const change = currentScore - previousScore

    return {
      previousScore,
      change: Math.round(change * 10) / 10,
      direction: change > 1 ? 'up' : change < -1 ? 'down' : 'stable',
    }
  }

  // --------------------------------------------------------------------------
  // QUICK ACCESS
  // --------------------------------------------------------------------------

  /**
   * Get a quick summary of the AKIH score
   */
  getScoreSummary(result: AKIHScoreResult): {
    score: number
    level: string
    color: string
    hvPercent: number
    tiPercent: number
    validationPercent: number
  } {
    const threshold = QUALITY_THRESHOLDS[result.qualityLevel]

    return {
      score: result.score,
      level: threshold.label,
      color: threshold.color,
      hvPercent: Math.round((result.humanValidation - 0.5) * 200), // Convert 0.5-1.0 to 0-100
      tiPercent: Math.round((result.transparencyIndex - 0.5) * 200),
      validationPercent: Math.round(result.validationStats.validationRate * 100),
    }
  }

  /**
   * Get the weakest components (for quick improvement targeting)
   */
  getWeakestComponents(result: AKIHScoreResult, count = 3): AKIHComponent[] {
    return [...result.components]
      .sort((a, b) => a.score - b.score)
      .slice(0, count)
  }

  /**
   * Get the strongest components
   */
  getStrongestComponents(result: AKIHScoreResult, count = 3): AKIHComponent[] {
    return [...result.components]
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
  }

  // --------------------------------------------------------------------------
  // EXPORT
  // --------------------------------------------------------------------------

  /**
   * Export AKIH result as JSON for reports
   */
  exportAsJSON(result: AKIHScoreResult): string {
    return JSON.stringify(result, null, 2)
  }

  /**
   * Get result for report generation
   */
  getReportData(result: AKIHScoreResult): {
    summary: ReturnType<typeof this.getScoreSummary>
    components: AKIHComponent[]
    topSuggestions: AKIHSuggestion[]
    validation: AKIHScoreResult['validationStats']
    formula: string
  } {
    return {
      summary: this.getScoreSummary(result),
      components: result.components,
      topSuggestions: result.suggestions.slice(0, 3),
      validation: result.validationStats,
      formula: `AKIH = ${result.phaseScore.toFixed(1)} × ${result.transparencyIndex.toFixed(2)} (TI) × ${result.humanValidation.toFixed(2)} (HV) = ${result.score}`,
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let serviceInstance: AKIHScoreService | null = null

/**
 * Get the AKIH Score service instance
 */
export function getAKIHService(config?: Partial<AKIHConfig>): AKIHScoreService {
  if (!serviceInstance) {
    serviceInstance = new AKIHScoreService(config)
  } else if (config) {
    serviceInstance.setConfig(config)
  }
  return serviceInstance
}

/**
 * Reset the service instance (for testing)
 */
export function resetAKIHService(): void {
  serviceInstance = null
}

// Default export
export default AKIHScoreService
