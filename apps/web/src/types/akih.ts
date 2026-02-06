/**
 * AKIH Score Types
 * AI-Kodierung Human-Integration Score
 *
 * Based on: AKIH_Score_Methodologische_Grundlagen.pdf
 * Formula: AKIH-Score = Σ(wᵢ × Pᵢ) × TI × HV
 */

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export type ValidationStatus = 'pending' | 'accepted' | 'modified' | 'rejected'

export interface CodingValidation {
  status: ValidationStatus
  validatedBy: string
  validatedAt: Date
  originalCodeId?: string  // If modified, what was the original code
  newCodeId?: string       // If modified, what is the new code
  notes?: string
  confidence?: number      // 0-1, how confident is the validator
}

export interface TeamValidation {
  odingId: string
  validations: Array<{
    userId: string
    userName?: string
    status: ValidationStatus
    codeId?: string        // If modified
    timestamp: Date
    notes?: string
  }>
  consensusStatus?: ValidationStatus | 'conflict'
  consensusReachedAt?: Date
}

// ============================================================================
// AKIH COMPONENT TYPES
// ============================================================================

export type AKIHComponentId =
  | 'precision'
  | 'recall'
  | 'consistency'
  | 'saturation'
  | 'coverage'
  | 'integration'
  | 'traceability'
  | 'reflexivity'

export interface AKIHComponent {
  id: AKIHComponentId
  name: string
  description: string
  score: number           // 0-100
  weight: number          // Component weight in total calculation
  color: string           // For visualization
  suggestions?: string[]  // Improvement suggestions
}

export const AKIH_COMPONENT_DEFINITIONS: Record<AKIHComponentId, Omit<AKIHComponent, 'score' | 'suggestions'>> = {
  precision: {
    id: 'precision',
    name: 'Präzision',
    description: 'Genauigkeit der Code-Zuweisungen',
    weight: 0.15,
    color: '#3b82f6', // blue
  },
  recall: {
    id: 'recall',
    name: 'Vollständigkeit',
    description: 'Vollständigkeit der Kodierung aller relevanten Stellen',
    weight: 0.15,
    color: '#22c55e', // green
  },
  consistency: {
    id: 'consistency',
    name: 'Konsistenz',
    description: 'Konsistenz zwischen Kodierern und AI',
    weight: 0.15,
    color: '#f59e0b', // amber
  },
  saturation: {
    id: 'saturation',
    name: 'Sättigung',
    description: 'Theoretische Sättigung erreicht',
    weight: 0.10,
    color: '#8b5cf6', // purple
  },
  coverage: {
    id: 'coverage',
    name: 'Abdeckung',
    description: 'Abdeckung des gesamten Datenmaterials',
    weight: 0.10,
    color: '#ec4899', // pink
  },
  integration: {
    id: 'integration',
    name: 'Integration',
    description: 'Verknüpfung mit Kategorien und Hierarchie',
    weight: 0.10,
    color: '#06b6d4', // cyan
  },
  traceability: {
    id: 'traceability',
    name: 'Nachvollziehbarkeit',
    description: 'Nachvollziehbarkeit der AI-Entscheidungen',
    weight: 0.15,
    color: '#f97316', // orange
  },
  reflexivity: {
    id: 'reflexivity',
    name: 'Reflexivität',
    description: 'Dokumentation menschlicher Reflexion',
    weight: 0.10,
    color: '#64748b', // slate
  },
}

// ============================================================================
// RESEARCH PHASE TYPES (from methodology paper)
// ============================================================================

export type ResearchPhaseId =
  | 'literature'
  | 'design'
  | 'collection'
  | 'analysis'
  | 'interpretation'
  | 'writing'
  | 'documentation'

export interface ResearchPhase {
  id: ResearchPhaseId
  name: string
  weight: number
  score: number           // 0-100
  aiUsage: number         // 0-100, how much AI was used
  humanValidation: number // 0-100, how much human validation
}

export const RESEARCH_PHASE_WEIGHTS: Record<ResearchPhaseId, { name: string; weight: number }> = {
  literature: { name: 'Literaturrecherche', weight: 0.15 },
  design: { name: 'Forschungsdesign', weight: 0.10 },
  collection: { name: 'Datenerhebung', weight: 0.15 },
  analysis: { name: 'Datenanalyse', weight: 0.20 },
  interpretation: { name: 'Interpretation', weight: 0.15 },
  writing: { name: 'Schreiben', weight: 0.15 },
  documentation: { name: 'Dokumentation', weight: 0.10 },
}

// ============================================================================
// MAIN AKIH SCORE TYPES
// ============================================================================

export type QualityLevel = 'excellent' | 'good' | 'acceptable' | 'critical'

export interface AKIHScoreResult {
  // Main score (0-100)
  score: number
  qualityLevel: QualityLevel

  // Factor breakdown
  transparencyIndex: number  // TI: 0.5-1.0
  humanValidation: number    // HV: 0.5-1.0
  phaseScore: number         // Σ(wᵢ × Pᵢ): 0-100

  // Detailed components
  components: AKIHComponent[]
  phases: ResearchPhase[]

  // Validation stats
  validationStats: {
    total: number
    pending: number
    accepted: number
    modified: number
    rejected: number
    validationRate: number   // 0-1
  }

  // Metadata
  calculatedAt: Date
  projectId?: string
  documentIds?: string[]

  // Suggestions for improvement
  suggestions: AKIHSuggestion[]

  // Trend (compared to previous calculation)
  trend?: {
    previousScore: number
    change: number
    direction: 'up' | 'down' | 'stable'
  }
}

export interface AKIHSuggestion {
  id: string
  priority: 'high' | 'medium' | 'low'
  category: AKIHComponentId | 'general'
  title: string
  description: string
  impact: number  // Estimated score improvement if implemented
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface AKIHConfig {
  enabled: boolean
  showInCodingPanel: boolean
  autoCalculate: boolean
  calculateOnSave: boolean

  // Custom weights (optional, defaults to RESEARCH_PHASE_WEIGHTS)
  customPhaseWeights?: Partial<Record<ResearchPhaseId, number>>

  // Team settings
  requireConsensus: boolean
  minimumValidators: number
  consensusThreshold: number  // 0-1, e.g., 0.67 for 2/3 majority
}

export const DEFAULT_AKIH_CONFIG: AKIHConfig = {
  enabled: false,
  showInCodingPanel: true,
  autoCalculate: true,
  calculateOnSave: false,
  requireConsensus: true,
  minimumValidators: 2,
  consensusThreshold: 0.67,
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface AKIHCalculationInput {
  codings: Array<{
    id: string
    codeId: string
    documentId: string
    codingMethod?: string
    createdAt?: Date
    validation?: CodingValidation
    validations?: TeamValidation['validations']
    aiReasoning?: string
  }>
  codes: Array<{
    id: string
    name: string
    categoryId?: string
    parentId?: string
  }>
  documents: Array<{
    id: string
    name: string
    content?: string
    wordCount?: number
  }>
  // Optional: phase progress data
  phases?: Partial<Record<ResearchPhaseId, { aiUsage: number; humanValidation: number }>>
}

// Score thresholds for quality levels
export const QUALITY_THRESHOLDS: Record<QualityLevel, { min: number; max: number; label: string; color: string }> = {
  excellent: { min: 85, max: 100, label: 'Exzellent', color: '#22c55e' },
  good: { min: 70, max: 84, label: 'Gut', color: '#3b82f6' },
  acceptable: { min: 50, max: 69, label: 'Akzeptabel', color: '#f59e0b' },
  critical: { min: 0, max: 49, label: 'Kritisch', color: '#ef4444' },
}
