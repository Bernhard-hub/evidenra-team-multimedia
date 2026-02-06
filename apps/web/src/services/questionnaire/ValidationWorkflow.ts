/**
 * Validation Workflow Manager
 * EVIDENRA Research - Scientific Questionnaire Development System
 *
 * Manages the complete validation workflow for questionnaires:
 * 1. Content Validity (Expert Panel)
 * 2. Cognitive Interviews
 * 3. Pilot Study
 * 4. Full Validation (EFA + CFA)
 *
 * Based on COSMIN guidelines and international best practices.
 */

import {
  Scale,
  ScaleItem,
  ContentValidityResult,
  ItemCVI,
  CognitiveInterviewProtocol,
  ValidationStudyPlan,
  ValidationPhase,
  ReliabilityResult,
  FactorAnalysisResult,
  ValidityResult,
} from './types'

import {
  VALIDITY_THRESHOLDS,
  RELIABILITY_THRESHOLDS,
  SAMPLE_SIZE_GUIDELINES,
} from './knowledge'

import { ReliabilityAnalyzer, ContentValidityAnalyzer } from './QuestionnaireService'
import { PsychometricEngine, FactorAnalysis, ValidityMetrics } from './PsychometricEngine'

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationProject {
  id: string
  scaleId: string
  scaleName: string
  status: ValidationStatus
  phases: ValidationPhaseResult[]
  createdAt: Date
  updatedAt: Date
}

export type ValidationStatus =
  | 'draft'
  | 'content-validity'
  | 'cognitive-interviews'
  | 'pilot-study'
  | 'full-validation'
  | 'completed'
  | 'failed'

export interface ValidationPhaseResult {
  phase: ValidationPhase
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  startedAt?: Date
  completedAt?: Date
  results?: ContentValidityPhaseResult | CognitiveInterviewPhaseResult | PilotStudyPhaseResult | FullValidationPhaseResult
  notes?: string
}

export interface ContentValidityPhaseResult {
  experts: ExpertReview[]
  itemCVI: ItemCVI[]
  scaleCVI: number
  scaleCVIUA: number
  itemsToRevise: string[]
  itemsToRemove: string[]
  passesThreshold: boolean
}

export interface ExpertReview {
  expertId: string
  expertName: string
  expertise: string
  ratings: { itemId: string; relevance: number; clarity: number; comments?: string }[]
  completedAt: Date
}

export interface CognitiveInterviewPhaseResult {
  participants: CognitiveInterviewResult[]
  problemsFound: CognitiveInterviewProblem[]
  itemsToRevise: { itemId: string; reason: string; suggestedRevision: string }[]
}

export interface CognitiveInterviewResult {
  participantId: string
  demographics?: Record<string, string>
  itemResponses: {
    itemId: string
    comprehensionNotes: string
    retrievalNotes: string
    judgmentNotes: string
    responseNotes: string
    problemsIdentified: string[]
  }[]
  generalFeedback: string
  completedAt: Date
}

export interface CognitiveInterviewProblem {
  itemId: string
  problemType: 'comprehension' | 'retrieval' | 'judgment' | 'response'
  description: string
  frequency: number // How many participants reported
  severity: 'minor' | 'moderate' | 'major'
}

export interface PilotStudyPhaseResult {
  sampleSize: number
  demographics: Record<string, number>
  reliability: ReliabilityResult
  itemAnalysis: {
    itemId: string
    mean: number
    sd: number
    skewness: number
    kurtosis: number
    itemTotalCorrelation: number
    alphaIfDeleted: number
    recommendation: 'keep' | 'review' | 'remove'
  }[]
  itemsToRevise: string[]
  itemsToRemove: string[]
  passesThreshold: boolean
}

export interface FullValidationPhaseResult {
  sampleSize: number
  demographics: Record<string, number>
  reliability: ReliabilityResult
  factorAnalysis: {
    efa?: FactorAnalysisResult
    cfa?: FactorAnalysisResult & { modelFit: ModelFitResult }
  }
  validity: ValidityResult
  finalScale: Scale
  passesAllCriteria: boolean
}

export interface ModelFitResult {
  chisq: number
  df: number
  pvalue: number
  cfi: number
  tli: number
  rmsea: number
  rmseaCI: [number, number]
  srmr: number
  interpretation: 'excellent' | 'good' | 'acceptable' | 'poor'
}

// ============================================================================
// CONTENT VALIDITY WORKFLOW
// ============================================================================

export class ContentValidityWorkflow {
  /**
   * Create expert review form for a scale
   */
  static createExpertReviewForm(scale: Scale): {
    instructions: string
    items: { id: string; text: string }[]
    ratingScale: { relevance: string[]; clarity: string[] }
  } {
    return {
      instructions: `
Bitte bewerten Sie die folgenden Items hinsichtlich ihrer Relevanz und Klarheit
für das Konstrukt "${scale.construct}".

Definition: ${scale.validation.sampleDescription || 'Siehe Skalenbeschreibung'}

Bewertungsskala:
- Relevanz: Wie relevant ist das Item für das Konstrukt?
- Klarheit: Wie klar und verständlich ist das Item formuliert?

1 = Nicht relevant/unklar
2 = Etwas relevant/etwas unklar
3 = Relevant/klar
4 = Sehr relevant/sehr klar
      `.trim(),
      items: scale.items.map(item => ({
        id: item.id,
        text: item.text,
      })),
      ratingScale: {
        relevance: [
          '1 - Nicht relevant',
          '2 - Etwas relevant',
          '3 - Relevant',
          '4 - Sehr relevant',
        ],
        clarity: [
          '1 - Unklar',
          '2 - Etwas unklar',
          '3 - Klar',
          '4 - Sehr klar',
        ],
      },
    }
  }

  /**
   * Analyze expert reviews and calculate CVI
   */
  static analyzeExpertReviews(
    reviews: ExpertReview[],
    itemIds: string[]
  ): ContentValidityPhaseResult {
    // Build rating matrix (items × experts)
    const relevanceMatrix: number[][] = []

    for (const itemId of itemIds) {
      const itemRatings: number[] = []
      for (const review of reviews) {
        const rating = review.ratings.find(r => r.itemId === itemId)
        itemRatings.push(rating?.relevance || 0)
      }
      relevanceMatrix.push(itemRatings)
    }

    // Calculate CVI
    const cviResult = ContentValidityAnalyzer.calculateCVI(relevanceMatrix, itemIds)

    // Determine items to revise/remove
    const itemsToRevise: string[] = []
    const itemsToRemove: string[] = []

    for (const itemCvi of cviResult.itemCVI) {
      if (itemCvi.cvi < 0.5) {
        itemsToRemove.push(itemCvi.itemId)
      } else if (itemCvi.needsRevision) {
        itemsToRevise.push(itemCvi.itemId)
      }
    }

    return {
      experts: reviews,
      itemCVI: cviResult.itemCVI,
      scaleCVI: cviResult.scaleCVI,
      scaleCVIUA: cviResult.scaleCVIUA,
      itemsToRevise,
      itemsToRemove,
      passesThreshold: cviResult.passesThreshold,
    }
  }

  /**
   * Generate report for content validity phase
   */
  static generateReport(result: ContentValidityPhaseResult): string {
    const lines: string[] = [
      '# Content Validity Report',
      '',
      `## Expert Panel (n = ${result.experts.length})`,
      '',
      '| Expert | Expertise | Datum |',
      '|--------|-----------|-------|',
    ]

    for (const expert of result.experts) {
      lines.push(`| ${expert.expertName} | ${expert.expertise} | ${expert.completedAt.toLocaleDateString()} |`)
    }

    lines.push('', '## Item-Level Content Validity Index (I-CVI)', '')
    lines.push('| Item | I-CVI | Status |')
    lines.push('|------|-------|--------|')

    for (const item of result.itemCVI) {
      const status = item.cvi >= 0.78 ? '✓ Akzeptiert' : item.cvi >= 0.5 ? '⚠ Überarbeiten' : '✗ Entfernen'
      lines.push(`| ${item.itemId} | ${item.cvi.toFixed(2)} | ${status} |`)
    }

    lines.push('', '## Scale-Level CVI', '')
    lines.push(`- S-CVI/Ave: ${result.scaleCVI.toFixed(2)} (Schwelle: ≥ 0.80)`)
    lines.push(`- S-CVI/UA: ${result.scaleCVIUA.toFixed(2)} (Schwelle: ≥ 0.80)`)
    lines.push('')
    lines.push(`## Ergebnis: ${result.passesThreshold ? '✓ BESTANDEN' : '✗ NICHT BESTANDEN'}`)

    if (result.itemsToRevise.length > 0) {
      lines.push('', '### Items zur Überarbeitung:', ...result.itemsToRevise.map(id => `- ${id}`))
    }

    if (result.itemsToRemove.length > 0) {
      lines.push('', '### Items zur Entfernung:', ...result.itemsToRemove.map(id => `- ${id}`))
    }

    return lines.join('\n')
  }
}

// ============================================================================
// COGNITIVE INTERVIEW WORKFLOW
// ============================================================================

export class CognitiveInterviewWorkflow {
  /**
   * Generate cognitive interview protocol
   */
  static generateProtocol(scale: Scale): CognitiveInterviewProtocol {
    return {
      introduction: `
Vielen Dank für Ihre Teilnahme an diesem Interview.

Wir entwickeln einen Fragebogen zum Thema "${scale.construct}" und möchten
verstehen, wie Menschen die Fragen verstehen und beantworten.

Es gibt keine richtigen oder falschen Antworten. Uns interessiert Ihr
Denkprozess. Bitte denken Sie laut und erzählen Sie mir, was Ihnen
durch den Kopf geht, während Sie die Fragen lesen und beantworten.

Das Interview dauert etwa 30-45 Minuten.
      `.trim(),

      warmupQuestions: [
        'Können Sie mir kurz erzählen, was Sie heute hierher geführt hat?',
        'Haben Sie in letzter Zeit an Umfragen teilgenommen?',
        'Wie gehen Sie normalerweise vor, wenn Sie einen Fragebogen ausfüllen?',
      ],

      itemProbes: scale.items.map(item => ({
        itemId: item.id,
        itemText: item.text,
        probes: [
          {
            type: 'comprehension' as const,
            question: `Was bedeutet diese Aussage für Sie? Können Sie sie in Ihren eigenen Worten wiedergeben?`,
          },
          {
            type: 'retrieval' as const,
            question: 'An welche konkreten Situationen oder Erfahrungen denken Sie bei dieser Frage?',
          },
          {
            type: 'judgment' as const,
            question: 'Wie haben Sie entschieden, welche Antwort am besten passt?',
          },
          {
            type: 'response' as const,
            question: 'Fehlt eine Antwortoption, die Sie gerne hätten?',
          },
        ],
      })),

      closingQuestions: [
        'Gab es Fragen, die Sie besonders schwierig oder verwirrend fanden?',
        'Gibt es Fragen, die Sie anders formulieren würden?',
        'Haben wir etwas Wichtiges zum Thema vergessen zu fragen?',
        'Haben Sie noch weitere Anmerkungen zum Fragebogen?',
      ],
    }
  }

  /**
   * Analyze cognitive interview results
   */
  static analyzeResults(
    results: CognitiveInterviewResult[]
  ): CognitiveInterviewPhaseResult {
    const problemsMap = new Map<string, CognitiveInterviewProblem>()

    // Aggregate problems across participants
    for (const result of results) {
      for (const itemResponse of result.itemResponses) {
        for (const problem of itemResponse.problemsIdentified) {
          const key = `${itemResponse.itemId}:${problem}`
          const existing = problemsMap.get(key)

          if (existing) {
            existing.frequency++
          } else {
            // Determine problem type from notes
            let problemType: 'comprehension' | 'retrieval' | 'judgment' | 'response' = 'comprehension'
            if (itemResponse.retrievalNotes.length > itemResponse.comprehensionNotes.length) {
              problemType = 'retrieval'
            }
            if (itemResponse.judgmentNotes.length > itemResponse.retrievalNotes.length) {
              problemType = 'judgment'
            }
            if (itemResponse.responseNotes.length > itemResponse.judgmentNotes.length) {
              problemType = 'response'
            }

            problemsMap.set(key, {
              itemId: itemResponse.itemId,
              problemType,
              description: problem,
              frequency: 1,
              severity: 'minor',
            })
          }
        }
      }
    }

    // Convert to array and determine severity
    const problems = Array.from(problemsMap.values())
    const participantCount = results.length

    for (const problem of problems) {
      const ratio = problem.frequency / participantCount
      if (ratio >= 0.5) {
        problem.severity = 'major'
      } else if (ratio >= 0.25) {
        problem.severity = 'moderate'
      }
    }

    // Determine items to revise
    const itemsToRevise: { itemId: string; reason: string; suggestedRevision: string }[] = []
    const itemsWithMajorProblems = problems.filter(p => p.severity === 'major')

    for (const problem of itemsWithMajorProblems) {
      if (!itemsToRevise.find(i => i.itemId === problem.itemId)) {
        itemsToRevise.push({
          itemId: problem.itemId,
          reason: `${problem.problemType}: ${problem.description} (${problem.frequency}/${participantCount} Teilnehmer)`,
          suggestedRevision: this.suggestRevision(problem),
        })
      }
    }

    return {
      participants: results,
      problemsFound: problems.sort((a, b) => b.frequency - a.frequency),
      itemsToRevise,
    }
  }

  private static suggestRevision(problem: CognitiveInterviewProblem): string {
    switch (problem.problemType) {
      case 'comprehension':
        return 'Verwenden Sie einfachere Sprache und vermeiden Sie Fachbegriffe.'
      case 'retrieval':
        return 'Spezifizieren Sie den Zeitraum oder Kontext genauer.'
      case 'judgment':
        return 'Überprüfen Sie, ob die Antwortkategorien zur Frage passen.'
      case 'response':
        return 'Erwägen Sie zusätzliche Antwortkategorien oder eine andere Skala.'
      default:
        return 'Überarbeitung erforderlich.'
    }
  }
}

// ============================================================================
// PILOT STUDY WORKFLOW
// ============================================================================

export class PilotStudyWorkflow {
  /**
   * Analyze pilot study data
   */
  static analyze(
    data: number[][],
    itemIds: string[]
  ): PilotStudyPhaseResult {
    const sampleSize = data.length

    // Basic reliability
    const reliability = ReliabilityAnalyzer.analyzeReliability(data, itemIds)

    // Item analysis
    const itemAnalysis = this.analyzeItems(data, itemIds, reliability)

    // Determine items to revise/remove
    const itemsToRevise: string[] = []
    const itemsToRemove: string[] = []

    for (const item of itemAnalysis) {
      if (item.recommendation === 'remove') {
        itemsToRemove.push(item.itemId)
      } else if (item.recommendation === 'review') {
        itemsToRevise.push(item.itemId)
      }
    }

    return {
      sampleSize,
      demographics: {}, // To be filled from actual data
      reliability,
      itemAnalysis,
      itemsToRevise,
      itemsToRemove,
      passesThreshold: reliability.cronbachAlpha >= RELIABILITY_THRESHOLDS.cronbachAlpha.acceptable,
    }
  }

  private static analyzeItems(
    data: number[][],
    itemIds: string[],
    reliability: ReliabilityResult
  ): PilotStudyPhaseResult['itemAnalysis'] {
    const results: PilotStudyPhaseResult['itemAnalysis'] = []

    for (let i = 0; i < itemIds.length; i++) {
      const itemValues = data.map(row => row[i])

      // Calculate statistics
      const mean = itemValues.reduce((a, b) => a + b, 0) / itemValues.length
      const variance = itemValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / itemValues.length
      const sd = Math.sqrt(variance)

      // Skewness
      const skewness = itemValues.reduce((acc, val) => acc + Math.pow((val - mean) / sd, 3), 0) / itemValues.length

      // Kurtosis
      const kurtosis = itemValues.reduce((acc, val) => acc + Math.pow((val - mean) / sd, 4), 0) / itemValues.length - 3

      // Get item-total correlation from reliability analysis
      const itemTotal = reliability.itemTotalCorrelations.find(itc => itc.itemId === itemIds[i])
      const alphaIfDeleted = reliability.alphaIfItemDeleted.find(aid => aid.itemId === itemIds[i])

      // Determine recommendation
      let recommendation: 'keep' | 'review' | 'remove' = 'keep'
      if (itemTotal && itemTotal.correlation < RELIABILITY_THRESHOLDS.itemTotalCorrelation.problematic) {
        recommendation = 'remove'
      } else if (itemTotal && itemTotal.correlation < RELIABILITY_THRESHOLDS.itemTotalCorrelation.acceptable) {
        recommendation = 'review'
      }
      if (Math.abs(skewness) > 2 || Math.abs(kurtosis) > 7) {
        recommendation = recommendation === 'keep' ? 'review' : recommendation
      }

      results.push({
        itemId: itemIds[i],
        mean,
        sd,
        skewness,
        kurtosis,
        itemTotalCorrelation: itemTotal?.correlation || 0,
        alphaIfDeleted: alphaIfDeleted?.alphaIfDeleted || reliability.cronbachAlpha,
        recommendation,
      })
    }

    return results
  }

  /**
   * Generate pilot study report
   */
  static generateReport(result: PilotStudyPhaseResult): string {
    const lines: string[] = [
      '# Pilot Study Report',
      '',
      `## Stichprobe: n = ${result.sampleSize}`,
      '',
      '## Reliabilität',
      '',
      `- Cronbach's α = ${result.reliability.cronbachAlpha.toFixed(3)}`,
      `- Interpretation: ${result.reliability.interpretation}`,
      '',
      '## Item-Analyse',
      '',
      '| Item | M | SD | Schiefe | Item-Total r | α wenn entfernt | Empfehlung |',
      '|------|---|----|---------|--------------|-----------------|------------|',
    ]

    for (const item of result.itemAnalysis) {
      const emoji = item.recommendation === 'keep' ? '✓' : item.recommendation === 'review' ? '⚠' : '✗'
      lines.push(
        `| ${item.itemId} | ${item.mean.toFixed(2)} | ${item.sd.toFixed(2)} | ${item.skewness.toFixed(2)} | ${item.itemTotalCorrelation.toFixed(2)} | ${item.alphaIfDeleted.toFixed(3)} | ${emoji} ${item.recommendation} |`
      )
    }

    lines.push('')
    lines.push(`## Ergebnis: ${result.passesThreshold ? '✓ BESTANDEN' : '✗ WEITERE ITERATION NÖTIG'}`)

    if (result.itemsToRemove.length > 0) {
      lines.push('', '### Items zur Entfernung:', ...result.itemsToRemove.map(id => `- ${id}`))
    }

    if (result.itemsToRevise.length > 0) {
      lines.push('', '### Items zur Überprüfung:', ...result.itemsToRevise.map(id => `- ${id}`))
    }

    return lines.join('\n')
  }
}

// ============================================================================
// FULL VALIDATION WORKFLOW
// ============================================================================

export class FullValidationWorkflow {
  /**
   * Run complete validation analysis
   */
  static analyze(
    data: number[][],
    itemIds: string[],
    expectedFactors: number = 1
  ): FullValidationPhaseResult {
    const sampleSize = data.length

    // Split data for cross-validation (60% EFA, 40% CFA)
    const splitIndex = Math.floor(sampleSize * 0.6)
    const efaData = data.slice(0, splitIndex)
    const cfaData = data.slice(splitIndex)

    // EFA on first half
    const { suggestedFactors } = FactorAnalysis.parallelAnalysis(efaData, 50)
    const factorCount = expectedFactors || suggestedFactors
    const efaResult = FactorAnalysis.efa(efaData, factorCount, 'varimax')

    // Reliability on full data
    const reliability = ReliabilityAnalyzer.analyzeReliability(data, itemIds)

    // Validity metrics
    const primaryLoadings = efaResult.factorLoadings.map(fl => fl.loadings[fl.primaryFactor])
    const factorAssignments = efaResult.factorLoadings.map(fl => fl.primaryFactor)
    const R = PsychometricEngine.MatrixOps.correlationMatrix(data)

    const validity = ValidityMetrics.assessValidity(
      efaResult.factorLoadings.map(fl => fl.loadings),
      R,
      factorAssignments
    )

    // Check all criteria
    const passesAllCriteria =
      reliability.cronbachAlpha >= RELIABILITY_THRESHOLDS.cronbachAlpha.acceptable &&
      validity.convergent.meetsThreshold &&
      validity.discriminant.meetsThreshold &&
      efaResult.factorLoadings.every(fl => Math.abs(fl.loadings[fl.primaryFactor]) >= 0.4)

    return {
      sampleSize,
      demographics: {},
      reliability,
      factorAnalysis: {
        efa: efaResult,
      },
      validity,
      finalScale: null as any, // To be constructed
      passesAllCriteria,
    }
  }

  /**
   * Generate comprehensive validation report
   */
  static generateReport(result: FullValidationPhaseResult, scaleName: string): string {
    const lines: string[] = [
      `# Validation Report: ${scaleName}`,
      '',
      `## Stichprobe: n = ${result.sampleSize}`,
      '',
      '---',
      '',
      '## 1. Reliabilität',
      '',
      `| Metrik | Wert | Schwelle | Status |`,
      `|--------|------|----------|--------|`,
      `| Cronbach's α | ${result.reliability.cronbachAlpha.toFixed(3)} | ≥ 0.70 | ${result.reliability.cronbachAlpha >= 0.70 ? '✓' : '✗'} |`,
    ]

    if (result.reliability.mcdonaldOmega) {
      lines.push(`| McDonald's ω | ${result.reliability.mcdonaldOmega.toFixed(3)} | ≥ 0.70 | ${result.reliability.mcdonaldOmega >= 0.70 ? '✓' : '✗'} |`)
    }

    lines.push(
      '',
      '## 2. Faktorenanalyse (EFA)',
      '',
      `Extrahierte Faktoren: ${result.factorAnalysis.efa?.factorCount}`,
      '',
      '### Faktorladungen',
      '',
      '| Item | ' + Array.from({ length: result.factorAnalysis.efa?.factorCount || 1 }, (_, i) => `F${i + 1}`).join(' | ') + ' | h² |',
      '|------|' + Array.from({ length: result.factorAnalysis.efa?.factorCount || 1 }, () => '---').join('|') + '|---|',
    )

    for (const loading of result.factorAnalysis.efa?.factorLoadings || []) {
      const loadingStr = loading.loadings.map(l => l.toFixed(2)).join(' | ')
      lines.push(`| ${loading.itemId} | ${loadingStr} | ${loading.communality.toFixed(2)} |`)
    }

    lines.push(
      '',
      '## 3. Konvergente Validität',
      '',
      `| Metrik | Wert | Schwelle | Status |`,
      `|--------|------|----------|--------|`,
      `| AVE | ${result.validity.convergent.ave.toFixed(3)} | > 0.50 | ${result.validity.convergent.ave > 0.5 ? '✓' : '✗'} |`,
      `| CR | ${result.validity.convergent.compositeReliability.toFixed(3)} | > 0.70 | ${result.validity.convergent.compositeReliability > 0.7 ? '✓' : '✗'} |`,
      '',
      '## 4. Diskriminante Validität',
      '',
      `Fornell-Larcker Kriterium: ${result.validity.discriminant.fornellLarcker ? '✓ Erfüllt' : '✗ Nicht erfüllt'}`,
      '',
      '---',
      '',
      `## Gesamtergebnis: ${result.passesAllCriteria ? '✓ ALLE KRITERIEN ERFÜLLT' : '⚠ NICHT ALLE KRITERIEN ERFÜLLT'}`,
    )

    if (!result.passesAllCriteria) {
      lines.push('', '### Empfehlungen:', '')
      if (result.reliability.cronbachAlpha < 0.70) {
        lines.push('- Reliabilität verbessern: Problematische Items entfernen oder überarbeiten')
      }
      if (!result.validity.convergent.meetsThreshold) {
        lines.push('- Konvergente Validität: Items mit niedrigen Ladungen überprüfen')
      }
      if (!result.validity.discriminant.meetsThreshold) {
        lines.push('- Diskriminante Validität: Faktorstruktur überprüfen, ggf. Items umverteilen')
      }
    }

    return lines.join('\n')
  }
}

// ============================================================================
// MAIN WORKFLOW MANAGER
// ============================================================================

export class ValidationWorkflowManager {
  /**
   * Create a new validation project
   */
  static createProject(scale: Scale): ValidationProject {
    const plan = this.createValidationPlan(scale)

    return {
      id: `val_${Date.now()}`,
      scaleId: scale.id,
      scaleName: scale.name,
      status: 'draft',
      phases: plan.phases.map(phase => ({
        phase,
        status: 'pending',
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  /**
   * Create validation plan for a scale
   */
  static createValidationPlan(scale: Scale): ValidationStudyPlan {
    const itemCount = scale.items?.length || 0
    const dimensionCount = scale.dimensions?.length || 1

    return {
      phases: [
        {
          name: 'Content Validity',
          purpose: 'Sicherstellen, dass Items das Konstrukt repräsentieren',
          sampleSize: SAMPLE_SIZE_GUIDELINES.contentValidity.experts.min,
          analyses: ['I-CVI', 'S-CVI/Ave', 'S-CVI/UA'],
          successCriteria: [
            `I-CVI ≥ ${VALIDITY_THRESHOLDS.content.iCVI} für alle Items`,
            `S-CVI/Ave ≥ ${VALIDITY_THRESHOLDS.content.sCVIAve}`,
          ],
        },
        {
          name: 'Cognitive Interviews',
          purpose: 'Verständlichkeit und Interpretierbarkeit prüfen',
          sampleSize: SAMPLE_SIZE_GUIDELINES.cognitiveInterview.recommended,
          analyses: ['Think-Aloud', 'Verbal Probing'],
          successCriteria: [
            'Keine systematischen Verständnisprobleme',
            'Konsistente Interpretation',
          ],
        },
        {
          name: 'Pilot Study',
          purpose: 'Vorläufige Reliabilität und Item-Analyse',
          sampleSize: Math.max(SAMPLE_SIZE_GUIDELINES.pilot.recommended, itemCount * 3),
          analyses: ["Cronbach's α", 'Item-Total Korrelationen', 'Item-Statistiken'],
          successCriteria: [
            `α ≥ ${RELIABILITY_THRESHOLDS.cronbachAlpha.acceptable}`,
            `Item-Total r ≥ ${RELIABILITY_THRESHOLDS.itemTotalCorrelation.acceptable}`,
          ],
        },
        {
          name: 'Full Validation',
          purpose: 'Faktorstruktur und Validität bestätigen',
          sampleSize: Math.max(SAMPLE_SIZE_GUIDELINES.cfa.recommended, itemCount * 10),
          analyses: ['EFA', 'CFA', 'AVE', 'CR', 'HTMT'],
          successCriteria: [
            'CFI/TLI ≥ 0.95',
            'RMSEA ≤ 0.06',
            'AVE > 0.50',
            'HTMT < 0.85',
          ],
        },
      ],
      totalSampleSize:
        SAMPLE_SIZE_GUIDELINES.contentValidity.experts.min +
        SAMPLE_SIZE_GUIDELINES.cognitiveInterview.recommended +
        Math.max(SAMPLE_SIZE_GUIDELINES.pilot.recommended, itemCount * 3) +
        Math.max(SAMPLE_SIZE_GUIDELINES.cfa.recommended, itemCount * 10),
      timeline: 'Geschätzt: 4-6 Monate',
      analysisProtocol: [
        'SPSS oder R mit lavaan/psych Paketen',
        'Deskriptive Statistiken für alle Items',
        'Normalverteilungsprüfung',
        'Reliabilitätsanalyse',
        'Exploratorische Faktorenanalyse',
        'Konfirmatorische Faktorenanalyse',
        'Validitätsprüfung',
      ],
    }
  }

  // Export sub-workflows
  static ContentValidity = ContentValidityWorkflow
  static CognitiveInterview = CognitiveInterviewWorkflow
  static PilotStudy = PilotStudyWorkflow
  static FullValidation = FullValidationWorkflow
}

export default ValidationWorkflowManager
