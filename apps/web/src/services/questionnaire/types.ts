/**
 * Questionnaire Module Types
 * EVIDENRA Research - Scientific Questionnaire Development System
 *
 * Based on:
 * - COSMIN Checklist for measurement properties
 * - Item Response Theory (IRT) models
 * - ZIS/GESIS standards for social science instruments
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export interface Scale {
  id: string
  name: string
  authors: string[]
  year: number
  doi?: string
  language: string[]
  construct: string
  dimensions?: ScaleDimension[]
  items: ScaleItem[]
  responseFormat: ResponseFormat
  validation: ValidationInfo
  source: ScaleSource
  adaptationNotes?: string
}

export interface ScaleDimension {
  id: string
  name: string
  definition: string
  itemIds: string[]
}

export interface ScaleItem {
  id: string
  text: string
  dimensionId?: string
  isReverseCoded: boolean
  originalText?: string // For adapted items
  itemNumber: number
}

export interface ResponseFormat {
  type: 'likert' | 'semantic-differential' | 'visual-analog' | 'dichotomous' | 'multiple-choice'
  points?: number // For Likert scales
  anchors?: string[] // e.g., ["Stimme gar nicht zu", "Stimme voll zu"]
  allLabeled?: boolean // Whether all points have labels
  midpoint?: string // e.g., "Weder noch"
}

export interface ValidationInfo {
  sampleSize?: number
  sampleDescription?: string
  cronbachAlpha?: number
  mcdonaldOmega?: number
  factorStructure?: 'unidimensional' | 'multidimensional'
  factorLoadingsRange?: [number, number]
  testRetestReliability?: number
  convergentValidity?: ConvergentValidityInfo[]
  discriminantValidity?: DiscriminantValidityInfo[]
  normData?: NormData
}

export interface ConvergentValidityInfo {
  relatedConstruct: string
  measure: string
  correlation: number
}

export interface DiscriminantValidityInfo {
  unrelatedConstruct: string
  measure: string
  correlation: number
}

export interface NormData {
  population: string
  mean: number
  sd: number
  percentiles?: Record<number, number>
}

export type ScaleSource =
  | 'zis-gesis'
  | 'promis'
  | 'psyctests'
  | 'psychology-tools'
  | 'pisa'
  | 'timss'
  | 'custom'
  | 'generated'

// ============================================================================
// ITEM QUALITY TYPES
// ============================================================================

export interface ItemQualityReport {
  item: string
  issues: ItemIssue[]
  suggestions: string[]
  overallScore: number // 0-100
  passesValidation: boolean
}

export interface ItemIssue {
  type: ItemIssueType
  severity: 'error' | 'warning' | 'info'
  description: string
  location?: { start: number; end: number }
}

export type ItemIssueType =
  | 'double-barreled'
  | 'leading'
  | 'double-negative'
  | 'ambiguous'
  | 'too-long'
  | 'too-short'
  | 'jargon'
  | 'social-desirability'
  | 'missing-subject'
  | 'hypothetical'

// ============================================================================
// PSYCHOMETRIC TYPES
// ============================================================================

export interface ReliabilityResult {
  cronbachAlpha: number
  mcdonaldOmega?: number
  splitHalf?: number
  itemTotalCorrelations: ItemTotalCorrelation[]
  alphaIfItemDeleted: AlphaIfDeleted[]
  interpretation: ReliabilityInterpretation
}

export interface ItemTotalCorrelation {
  itemId: string
  correlation: number
  flag: 'good' | 'acceptable' | 'poor' | 'problematic'
}

export interface AlphaIfDeleted {
  itemId: string
  alphaIfDeleted: number
  shouldDelete: boolean
  reason?: string
}

export type ReliabilityInterpretation =
  | 'excellent'   // >= 0.90
  | 'good'        // >= 0.80
  | 'acceptable'  // >= 0.70
  | 'questionable'// >= 0.60
  | 'poor'        // >= 0.50
  | 'unacceptable'// < 0.50

export interface ValidityResult {
  convergent: {
    ave: number // Average Variance Extracted
    compositeReliability: number
    meetsThreshold: boolean // AVE > 0.5, CR > 0.7
  }
  discriminant: {
    htmt: number[][] // Heterotrait-Monotrait Ratio matrix
    fornellLarcker: boolean // Passes Fornell-Larcker criterion
    meetsThreshold: boolean // HTMT < 0.85
  }
}

export interface FactorAnalysisResult {
  type: 'efa' | 'cfa'
  factorCount: number
  factorLoadings: FactorLoading[]
  modelFit?: ModelFitIndices
  eigenvalues?: number[]
  varianceExplained?: number[]
  rotationMethod?: 'varimax' | 'oblimin' | 'promax'
}

export interface FactorLoading {
  itemId: string
  loadings: number[] // One per factor
  communality: number
  primaryFactor: number
}

export interface ModelFitIndices {
  chisq: number
  df: number
  pvalue: number
  cfi: number
  tli: number
  rmsea: number
  rmseaCI: [number, number]
  srmr: number
  interpretation: ModelFitInterpretation
}

export type ModelFitInterpretation = 'excellent' | 'good' | 'acceptable' | 'poor'

// ============================================================================
// IRT TYPES
// ============================================================================

export interface IRTParameters {
  model: '1pl' | '2pl' | 'grm' // 1-PL (Rasch), 2-PL, Graded Response Model
  items: IRTItemParams[]
  thetaRange: [number, number]
}

export interface IRTItemParams {
  itemId: string
  difficulty: number // b parameter
  discrimination?: number // a parameter (2-PL and GRM)
  thresholds?: number[] // For GRM (ordinal responses)
}

export interface IRTResult {
  parameters: IRTParameters
  itemInformation: ItemInformation[]
  testInformation: TestInformation
  reliability: number // Marginal reliability
}

export interface ItemInformation {
  itemId: string
  informationCurve: { theta: number; information: number }[]
  peakTheta: number
  peakInformation: number
}

export interface TestInformation {
  informationCurve: { theta: number; information: number }[]
  reliabilityCurve: { theta: number; reliability: number }[]
  optimalRange: [number, number] // Theta range with reliability > 0.7
}

// ============================================================================
// VALIDATION WORKFLOW TYPES
// ============================================================================

export interface ContentValidityResult {
  itemCVI: ItemCVI[] // I-CVI for each item
  scaleCVI: number // S-CVI/Ave
  scaleCVIUA: number // S-CVI/UA (Universal Agreement)
  expertCount: number
  passesThreshold: boolean // I-CVI > 0.78, S-CVI > 0.80
}

export interface ItemCVI {
  itemId: string
  cvi: number
  expertRatings: number[] // 1-4 scale
  relevanceCount: number // Count of 3s and 4s
  needsRevision: boolean
}

export interface CognitiveInterviewProtocol {
  introduction: string
  warmupQuestions: string[]
  itemProbes: ItemProbe[]
  closingQuestions: string[]
}

export interface ItemProbe {
  itemId: string
  itemText: string
  probes: {
    type: 'comprehension' | 'retrieval' | 'judgment' | 'response'
    question: string
  }[]
}

export interface ValidationStudyPlan {
  phases: ValidationPhase[]
  totalSampleSize: number
  timeline: string
  analysisProtocol: string[]
}

export interface ValidationPhase {
  name: string
  purpose: string
  sampleSize: number
  analyses: string[]
  successCriteria: string[]
}

// ============================================================================
// CONSTRUCT EXTRACTION TYPES
// ============================================================================

export interface ConstructDefinition {
  name: string
  definition: string
  dimensions: ConstructDimension[]
  relatedConstructs: string[]
  sourceSegments: SourceSegment[]
  literatureSupport?: LiteratureSupport[]
}

export interface ConstructDimension {
  name: string
  definition: string
  indicators: string[]
  segmentCount: number
}

export interface SourceSegment {
  id: string
  text: string
  codeId: string
  codeName: string
}

export interface LiteratureSupport {
  citation: string
  relevance: string
  existingScales?: string[]
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface ExportFormat {
  type: 'ddi-xml' | 'qualtrics-qsf' | 'limesurvey-lss' | 'redcap-xml' | 'csv'
  version?: string
}

export interface MethodsSectionData {
  scaleInfo: Scale
  validationResults: {
    reliability: ReliabilityResult
    validity?: ValidityResult
    factorAnalysis?: FactorAnalysisResult
  }
  adaptationProcess?: AdaptationProcess
}

export interface AdaptationProcess {
  originalScale: Scale
  adaptedScale: Scale
  changes: AdaptationChange[]
  rationale: string
  expertPanel: string[]
  pilotResults?: ReliabilityResult
}

export interface AdaptationChange {
  type: 'translation' | 'cultural-adaptation' | 'item-modification' | 'item-addition' | 'item-removal'
  originalText?: string
  newText?: string
  reason: string
}
