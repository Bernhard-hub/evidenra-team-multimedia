/**
 * AKIH Score Calculation Functions
 * Pure functions for calculating AKIH score components
 *
 * Formula: AKIH-Score = Σ(wᵢ × Pᵢ) × TI × HV
 */

import type {
  AKIHCalculationInput,
  AKIHComponent,
  AKIHComponentId,
  ValidationStatus,
  QualityLevel,
  ResearchPhase,
  ResearchPhaseId,
  AKIH_COMPONENT_DEFINITIONS,
  RESEARCH_PHASE_WEIGHTS,
  QUALITY_THRESHOLDS,
} from '@/types/akih'

// Re-export for convenience
export { AKIH_COMPONENT_DEFINITIONS, RESEARCH_PHASE_WEIGHTS, QUALITY_THRESHOLDS } from '@/types/akih'

// ============================================================================
// VALIDATION CALCULATIONS
// ============================================================================

interface ValidationStats {
  total: number
  pending: number
  accepted: number
  modified: number
  rejected: number
  validationRate: number
}

/**
 * Calculate validation statistics from codings
 */
export function calculateValidationStats(
  codings: AKIHCalculationInput['codings']
): ValidationStats {
  const aiCodings = codings.filter(c => c.codingMethod && c.codingMethod !== 'manual')
  const total = aiCodings.length

  if (total === 0) {
    return { total: 0, pending: 0, accepted: 0, modified: 0, rejected: 0, validationRate: 0 }
  }

  let pending = 0
  let accepted = 0
  let modified = 0
  let rejected = 0

  for (const coding of aiCodings) {
    const status = coding.validation?.status || 'pending'
    switch (status) {
      case 'pending': pending++; break
      case 'accepted': accepted++; break
      case 'modified': modified++; break
      case 'rejected': rejected++; break
    }
  }

  const validationRate = (accepted + modified + rejected) / total

  return { total, pending, accepted, modified, rejected, validationRate }
}

/**
 * Calculate Human Validation factor (HV)
 * Range: 0.5 - 1.0
 *
 * HV = 0.5 + (validationScore × 0.5)
 * where validationScore considers:
 * - accepted: 1.0
 * - modified: 0.75 (still counts as validation)
 * - rejected: 0.5 (validation happened, but disagreement)
 * - pending: 0.0
 */
export function calculateHumanValidation(stats: ValidationStats): number {
  if (stats.total === 0) {
    return 0.5 // Minimum, no AI codings to validate
  }

  const weightedSum =
    stats.accepted * 1.0 +
    stats.modified * 0.75 +
    stats.rejected * 0.5 +
    stats.pending * 0.0

  const rawScore = weightedSum / stats.total

  // HV ranges from 0.5 (no validation) to 1.0 (full validation)
  return 0.5 + rawScore * 0.5
}

// ============================================================================
// TRANSPARENCY INDEX CALCULATIONS
// ============================================================================

interface TransparencyFactors {
  hasAIReasoning: boolean       // AI provides explanations
  hasPromptDocumentation: boolean
  hasModelInfo: boolean
  hasCodingMethod: boolean
  hasTimestamps: boolean
}

/**
 * Calculate Transparency Index (TI)
 * Range: 0.5 - 1.0
 *
 * Based on how well AI processes are documented
 */
export function calculateTransparencyIndex(
  codings: AKIHCalculationInput['codings'],
  _options?: { hasPromptDocs?: boolean; hasModelInfo?: boolean }
): number {
  const aiCodings = codings.filter(c => c.codingMethod && c.codingMethod !== 'manual')

  if (aiCodings.length === 0) {
    return 1.0 // No AI codings = full transparency (all manual)
  }

  let score = 0
  let factors = 0

  // Factor 1: AI reasoning documented (weight: 0.3)
  const withReasoning = aiCodings.filter(c => c.aiReasoning && c.aiReasoning.length > 10).length
  score += (withReasoning / aiCodings.length) * 0.3
  factors++

  // Factor 2: Coding method documented (weight: 0.2)
  const withMethod = aiCodings.filter(c => c.codingMethod).length
  score += (withMethod / aiCodings.length) * 0.2
  factors++

  // Factor 3: Timestamps present (weight: 0.2)
  const withTimestamp = aiCodings.filter(c => c.createdAt).length
  score += (withTimestamp / aiCodings.length) * 0.2
  factors++

  // Factor 4: Overall AI documentation available (weight: 0.3)
  // This would check prompt docs, model info, etc.
  const docScore = _options?.hasPromptDocs ? 0.15 : 0
  const modelScore = _options?.hasModelInfo ? 0.15 : 0
  score += docScore + modelScore

  // TI ranges from 0.5 to 1.0
  return 0.5 + score * 0.5
}

// ============================================================================
// COMPONENT SCORE CALCULATIONS
// ============================================================================

/**
 * Calculate Precision score
 * How accurate are the code assignments?
 */
export function calculatePrecision(
  codings: AKIHCalculationInput['codings'],
  stats: ValidationStats
): number {
  if (stats.total === 0) return 100 // No AI codings = no precision issues

  // Precision is based on acceptance rate
  // High acceptance = high precision
  const acceptanceRate = stats.accepted / stats.total
  const modifiedPenalty = stats.modified * 0.5 / stats.total
  const rejectedPenalty = stats.rejected / stats.total

  return Math.max(0, Math.min(100, (acceptanceRate - modifiedPenalty - rejectedPenalty) * 100 + 50))
}

/**
 * Calculate Recall score
 * How complete is the coding coverage?
 */
export function calculateRecall(
  codings: AKIHCalculationInput['codings'],
  documents: AKIHCalculationInput['documents']
): number {
  if (documents.length === 0) return 0

  // Calculate average codings per document
  const avgCodingsPerDoc = codings.length / documents.length

  // Assume 5+ codings per document is good coverage
  const targetCodingsPerDoc = 5
  const coverageRatio = Math.min(1, avgCodingsPerDoc / targetCodingsPerDoc)

  // Also check if all documents have at least one coding
  const docsWithCodings = new Set(codings.map(c => c.documentId)).size
  const docCoverageRatio = docsWithCodings / documents.length

  return (coverageRatio * 0.6 + docCoverageRatio * 0.4) * 100
}

/**
 * Calculate Consistency score
 * How consistent are codings across coders/AI?
 */
export function calculateConsistency(
  codings: AKIHCalculationInput['codings'],
  stats: ValidationStats
): number {
  // Consistency is high when:
  // - Few modifications (AI and human agree)
  // - Low rejection rate
  // - High validation rate

  if (stats.total === 0) return 100

  const agreementRate = stats.accepted / Math.max(1, stats.accepted + stats.modified + stats.rejected)
  const validationFactor = stats.validationRate

  // Penalize for modifications and rejections
  const consistencyScore = agreementRate * 0.7 + validationFactor * 0.3

  return consistencyScore * 100
}

/**
 * Calculate Saturation score
 * Has theoretical saturation been reached?
 */
export function calculateSaturation(
  codes: AKIHCalculationInput['codes'],
  codings: AKIHCalculationInput['codings']
): number {
  if (codes.length === 0) return 0

  // Check code usage distribution
  const codeUsage = new Map<string, number>()
  for (const coding of codings) {
    codeUsage.set(coding.codeId, (codeUsage.get(coding.codeId) || 0) + 1)
  }

  // Saturation indicators:
  // 1. Most codes are being used
  const usedCodes = codeUsage.size
  const codeUsageRatio = usedCodes / codes.length

  // 2. No single code dominates (evenness of distribution)
  const usages = Array.from(codeUsage.values())
  const maxUsage = Math.max(...usages, 1)
  const avgUsage = usages.reduce((a, b) => a + b, 0) / usages.length || 1
  const evenness = 1 - (maxUsage - avgUsage) / maxUsage

  // 3. Minimum threshold met (at least 3 codings per code on average)
  const avgCodingsPerCode = codings.length / codes.length
  const thresholdMet = Math.min(1, avgCodingsPerCode / 3)

  return (codeUsageRatio * 0.4 + evenness * 0.3 + thresholdMet * 0.3) * 100
}

/**
 * Calculate Coverage score
 * How much of the data material is covered?
 */
export function calculateCoverage(
  codings: AKIHCalculationInput['codings'],
  documents: AKIHCalculationInput['documents']
): number {
  if (documents.length === 0) return 0

  // Documents with at least one coding
  const codedDocs = new Set(codings.map(c => c.documentId))
  const docCoverage = codedDocs.size / documents.length

  // Estimate text coverage (if word counts available)
  const docsWithContent = documents.filter(d => d.wordCount && d.wordCount > 0)
  let textCoverage = 1

  if (docsWithContent.length > 0) {
    const codedDocsWithContent = docsWithContent.filter(d => codedDocs.has(d.id))
    const codedWords = codedDocsWithContent.reduce((sum, d) => sum + (d.wordCount || 0), 0)
    const totalWords = docsWithContent.reduce((sum, d) => sum + (d.wordCount || 0), 0)
    textCoverage = totalWords > 0 ? codedWords / totalWords : 1
  }

  return (docCoverage * 0.6 + textCoverage * 0.4) * 100
}

/**
 * Calculate Integration score
 * How well are codes integrated into categories/hierarchy?
 */
export function calculateIntegration(
  codes: AKIHCalculationInput['codes']
): number {
  if (codes.length === 0) return 0

  // Check how many codes have categories or parent codes
  const withCategory = codes.filter(c => c.categoryId).length
  const withParent = codes.filter(c => c.parentId).length

  const categoryRatio = withCategory / codes.length
  const hierarchyRatio = withParent / codes.length

  // Having some hierarchy is good, but not all codes need parents
  const idealHierarchyRatio = 0.3 // 30% of codes should have parents
  const hierarchyScore = Math.min(1, hierarchyRatio / idealHierarchyRatio)

  return (categoryRatio * 0.6 + hierarchyScore * 0.4) * 100
}

/**
 * Calculate Traceability score
 * How traceable are AI decisions?
 */
export function calculateTraceability(
  codings: AKIHCalculationInput['codings']
): number {
  const aiCodings = codings.filter(c => c.codingMethod && c.codingMethod !== 'manual')

  if (aiCodings.length === 0) return 100 // All manual = fully traceable

  // Check for AI reasoning/explanation
  const withReasoning = aiCodings.filter(c => c.aiReasoning && c.aiReasoning.length > 20).length
  const reasoningRatio = withReasoning / aiCodings.length

  // Check for method documentation
  const withMethod = aiCodings.filter(c => c.codingMethod).length
  const methodRatio = withMethod / aiCodings.length

  // Check for timestamps
  const withTimestamp = aiCodings.filter(c => c.createdAt).length
  const timestampRatio = withTimestamp / aiCodings.length

  return (reasoningRatio * 0.5 + methodRatio * 0.3 + timestampRatio * 0.2) * 100
}

/**
 * Calculate Reflexivity score
 * How much human reflection is documented?
 */
export function calculateReflexivity(
  codings: AKIHCalculationInput['codings'],
  stats: ValidationStats
): number {
  // Reflexivity is based on:
  // 1. Validation notes/comments added
  // 2. Modifications with explanations
  // 3. Overall engagement with AI output

  const withNotes = codings.filter(c => c.validation?.notes && c.validation.notes.length > 5).length
  const noteRatio = codings.length > 0 ? withNotes / codings.length : 0

  // High modification rate shows critical engagement
  const modificationEngagement = stats.total > 0
    ? Math.min(1, (stats.modified + stats.rejected) / stats.total * 2)
    : 0

  // Validation itself is a form of reflection
  const validationEngagement = stats.validationRate

  return (noteRatio * 0.3 + modificationEngagement * 0.3 + validationEngagement * 0.4) * 100
}

// ============================================================================
// PHASE CALCULATIONS
// ============================================================================

/**
 * Calculate phase scores based on AI usage and human validation
 */
export function calculatePhaseScores(
  phases?: AKIHCalculationInput['phases']
): ResearchPhase[] {
  const result: ResearchPhase[] = []

  for (const [phaseId, info] of Object.entries(RESEARCH_PHASE_WEIGHTS)) {
    const phaseData = phases?.[phaseId as ResearchPhaseId]

    const aiUsage = phaseData?.aiUsage ?? 50 // Default: 50% AI usage
    const humanValidation = phaseData?.humanValidation ?? 50 // Default: 50% validation

    // Score combines AI efficiency with human oversight
    // High AI + High Validation = Best score
    const score = (aiUsage * 0.4 + humanValidation * 0.6)

    result.push({
      id: phaseId as ResearchPhaseId,
      name: info.name,
      weight: info.weight,
      score,
      aiUsage,
      humanValidation,
    })
  }

  return result
}

/**
 * Calculate weighted phase score: Σ(wᵢ × Pᵢ)
 */
export function calculateWeightedPhaseScore(phases: ResearchPhase[]): number {
  return phases.reduce((sum, phase) => sum + phase.weight * phase.score, 0)
}

// ============================================================================
// MAIN SCORE CALCULATION
// ============================================================================

/**
 * Determine quality level from score
 */
export function getQualityLevel(score: number): QualityLevel {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'acceptable'
  return 'critical'
}

/**
 * Calculate all component scores
 */
export function calculateAllComponents(
  input: AKIHCalculationInput,
  stats: ValidationStats
): AKIHComponent[] {
  const { codings, codes, documents } = input

  const componentScores: Record<AKIHComponentId, number> = {
    precision: calculatePrecision(codings, stats),
    recall: calculateRecall(codings, documents),
    consistency: calculateConsistency(codings, stats),
    saturation: calculateSaturation(codes, codings),
    coverage: calculateCoverage(codings, documents),
    integration: calculateIntegration(codes),
    traceability: calculateTraceability(codings),
    reflexivity: calculateReflexivity(codings, stats),
  }

  return Object.entries(AKIH_COMPONENT_DEFINITIONS).map(([id, def]) => ({
    ...def,
    id: id as AKIHComponentId,
    score: Math.round(componentScores[id as AKIHComponentId] * 10) / 10,
  }))
}

/**
 * Calculate the final AKIH score
 * Formula: AKIH-Score = Σ(wᵢ × Pᵢ) × TI × HV
 */
export function calculateAKIHScore(
  phaseScore: number,
  transparencyIndex: number,
  humanValidation: number
): number {
  const rawScore = phaseScore * transparencyIndex * humanValidation
  return Math.round(rawScore * 10) / 10
}
