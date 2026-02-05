/**
 * Questionnaire Service
 * EVIDENRA Research - Scientific Questionnaire Development System
 *
 * Main service for questionnaire development, validation, and analysis.
 * Integrates with Nexus AI for intelligent recommendations.
 */

import {
  Scale,
  ScaleItem,
  ItemQualityReport,
  ItemIssue,
  ItemIssueType,
  ReliabilityResult,
  ReliabilityInterpretation,
  ItemTotalCorrelation,
  AlphaIfDeleted,
  ContentValidityResult,
  ItemCVI,
  CognitiveInterviewProtocol,
  ValidationStudyPlan,
  ConstructDefinition,
  FactorAnalysisResult,
  FactorLoading,
  ModelFitIndices,
} from './types'

import {
  RELIABILITY_THRESHOLDS,
  VALIDITY_THRESHOLDS,
  SAMPLE_SIZE_GUIDELINES,
  ITEM_WRITING_RULES,
  COGNITIVE_INTERVIEW_PROBES,
  LIKERT_SCALE_GUIDELINES,
  MODEL_FIT_THRESHOLDS,
} from './knowledge'

// ============================================================================
// ITEM QUALITY ANALYSIS
// ============================================================================

export class ItemQualityAnalyzer {
  /**
   * Analyze an item for quality issues
   */
  static analyzeItem(item: string): ItemQualityReport {
    const issues: ItemIssue[] = []

    // Check for double-barreled
    const doubleBarreledResult = this.checkDoubleBarreled(item)
    if (doubleBarreledResult) {
      issues.push(doubleBarreledResult)
    }

    // Check for leading language
    const leadingResult = this.checkLeading(item)
    if (leadingResult) {
      issues.push(leadingResult)
    }

    // Check for double negatives
    const doubleNegativeResult = this.checkDoubleNegative(item)
    if (doubleNegativeResult) {
      issues.push(doubleNegativeResult)
    }

    // Check length
    const lengthIssues = this.checkLength(item)
    issues.push(...lengthIssues)

    // Check for absolute terms
    const absoluteResult = this.checkAbsoluteTerms(item)
    if (absoluteResult) {
      issues.push(absoluteResult)
    }

    // Calculate overall score
    const errorCount = issues.filter(i => i.severity === 'error').length
    const warningCount = issues.filter(i => i.severity === 'warning').length
    const overallScore = Math.max(0, 100 - (errorCount * 30) - (warningCount * 10))

    // Generate suggestions
    const suggestions = this.generateSuggestions(issues, item)

    return {
      item,
      issues,
      suggestions,
      overallScore,
      passesValidation: errorCount === 0,
    }
  }

  private static checkDoubleBarreled(item: string): ItemIssue | null {
    const indicators = ITEM_WRITING_RULES.avoid.doubleBarreled.indicators
    const lowerItem = item.toLowerCase()

    for (const indicator of indicators) {
      const index = lowerItem.indexOf(indicator.toLowerCase())
      if (index !== -1) {
        // Check if it's actually connecting two distinct concepts
        const beforeAnd = item.substring(0, index).trim()
        const afterAnd = item.substring(index + indicator.length).trim()

        // Simple heuristic: if both parts have verbs or nouns, likely double-barreled
        if (beforeAnd.length > 10 && afterAnd.length > 10) {
          return {
            type: 'double-barreled',
            severity: 'error',
            description: `Item fragt nach zwei Dingen gleichzeitig (Indikator: "${indicator}")`,
            location: { start: index, end: index + indicator.length },
          }
        }
      }
    }
    return null
  }

  private static checkLeading(item: string): ItemIssue | null {
    const indicators = ITEM_WRITING_RULES.avoid.leading.indicators
    const lowerItem = item.toLowerCase()

    for (const indicator of indicators) {
      if (lowerItem.includes(indicator.toLowerCase())) {
        return {
          type: 'leading',
          severity: 'error',
          description: `Führende Formulierung gefunden: "${indicator}"`,
        }
      }
    }
    return null
  }

  private static checkDoubleNegative(item: string): ItemIssue | null {
    const indicators = ITEM_WRITING_RULES.avoid.doubleNegative.indicators
    const lowerItem = item.toLowerCase()

    for (const indicator of indicators) {
      if (lowerItem.includes(indicator.toLowerCase())) {
        return {
          type: 'double-negative',
          severity: 'error',
          description: 'Doppelte Verneinung erschwert das Verständnis',
        }
      }
    }
    return null
  }

  private static checkLength(item: string): ItemIssue[] {
    const issues: ItemIssue[] = []
    const wordCount = item.split(/\s+/).length
    const { minimum, maximum, optimal } = ITEM_WRITING_RULES.guidelines.length

    if (wordCount < minimum) {
      issues.push({
        type: 'too-short',
        severity: 'warning',
        description: `Item hat nur ${wordCount} Wörter (Minimum: ${minimum})`,
      })
    }

    if (wordCount > maximum) {
      issues.push({
        type: 'too-long',
        severity: 'warning',
        description: `Item hat ${wordCount} Wörter (Maximum: ${maximum})`,
      })
    }

    return issues
  }

  private static checkAbsoluteTerms(item: string): ItemIssue | null {
    const indicators = ITEM_WRITING_RULES.avoid.absoluteTerms.indicators
    const lowerItem = item.toLowerCase()

    for (const indicator of indicators) {
      // Check for word boundaries
      const regex = new RegExp(`\\b${indicator}\\b`, 'i')
      if (regex.test(lowerItem)) {
        return {
          type: 'ambiguous',
          severity: 'warning',
          description: `Absoluter Begriff "${indicator}" kann selten zutreffen`,
        }
      }
    }
    return null
  }

  private static generateSuggestions(issues: ItemIssue[], item: string): string[] {
    const suggestions: string[] = []

    for (const issue of issues) {
      switch (issue.type) {
        case 'double-barreled':
          suggestions.push('Teilen Sie das Item in zwei separate Fragen auf')
          break
        case 'leading':
          suggestions.push('Verwenden Sie neutrale Formulierungen ohne wertende Adjektive')
          break
        case 'double-negative':
          suggestions.push('Formulieren Sie das Item positiv um')
          break
        case 'too-long':
          suggestions.push('Kürzen Sie das Item auf 15-20 Wörter')
          break
        case 'too-short':
          suggestions.push('Ergänzen Sie das Item um mehr Kontext')
          break
        case 'ambiguous':
          suggestions.push('Vermeiden Sie absolute Begriffe wie "immer" oder "nie"')
          break
      }
    }

    return suggestions
  }
}

// ============================================================================
// RELIABILITY ANALYSIS
// ============================================================================

export class ReliabilityAnalyzer {
  /**
   * Calculate Cronbach's Alpha from response data
   * @param data Matrix where rows are respondents and columns are items
   */
  static calculateCronbachAlpha(data: number[][]): number {
    if (data.length === 0 || data[0].length === 0) return 0

    const n = data[0].length // Number of items
    const variances = this.calculateItemVariances(data)
    const totalVariance = this.calculateTotalVariance(data)

    if (totalVariance === 0) return 0

    const sumVariances = variances.reduce((a, b) => a + b, 0)
    const alpha = (n / (n - 1)) * (1 - sumVariances / totalVariance)

    return Math.max(0, Math.min(1, alpha))
  }

  /**
   * Calculate full reliability report
   */
  static analyzeReliability(data: number[][], itemIds: string[]): ReliabilityResult {
    const alpha = this.calculateCronbachAlpha(data)
    const itemTotalCorrelations = this.calculateItemTotalCorrelations(data, itemIds)
    const alphaIfDeleted = this.calculateAlphaIfDeleted(data, itemIds)

    return {
      cronbachAlpha: alpha,
      itemTotalCorrelations,
      alphaIfDeleted,
      interpretation: this.interpretReliability(alpha),
    }
  }

  private static calculateItemVariances(data: number[][]): number[] {
    const itemCount = data[0].length
    const variances: number[] = []

    for (let i = 0; i < itemCount; i++) {
      const itemValues = data.map(row => row[i])
      variances.push(this.variance(itemValues))
    }

    return variances
  }

  private static calculateTotalVariance(data: number[][]): number {
    const totals = data.map(row => row.reduce((a, b) => a + b, 0))
    return this.variance(totals)
  }

  private static calculateItemTotalCorrelations(
    data: number[][],
    itemIds: string[]
  ): ItemTotalCorrelation[] {
    const results: ItemTotalCorrelation[] = []

    for (let i = 0; i < itemIds.length; i++) {
      const itemValues = data.map(row => row[i])
      // Corrected item-total: total minus this item
      const correctedTotals = data.map(row =>
        row.reduce((a, b, idx) => idx !== i ? a + b : a, 0)
      )

      const correlation = this.pearsonCorrelation(itemValues, correctedTotals)

      results.push({
        itemId: itemIds[i],
        correlation,
        flag: this.flagItemTotalCorrelation(correlation),
      })
    }

    return results
  }

  private static calculateAlphaIfDeleted(
    data: number[][],
    itemIds: string[]
  ): AlphaIfDeleted[] {
    const results: AlphaIfDeleted[] = []
    const originalAlpha = this.calculateCronbachAlpha(data)

    for (let i = 0; i < itemIds.length; i++) {
      // Remove item i from data
      const reducedData = data.map(row => row.filter((_, idx) => idx !== i))
      const alphaWithout = this.calculateCronbachAlpha(reducedData)

      const shouldDelete = alphaWithout > originalAlpha + 0.02

      results.push({
        itemId: itemIds[i],
        alphaIfDeleted: alphaWithout,
        shouldDelete,
        reason: shouldDelete
          ? `Entfernen würde Alpha von ${originalAlpha.toFixed(2)} auf ${alphaWithout.toFixed(2)} erhöhen`
          : undefined,
      })
    }

    return results
  }

  private static flagItemTotalCorrelation(
    correlation: number
  ): 'good' | 'acceptable' | 'poor' | 'problematic' {
    const thresholds = RELIABILITY_THRESHOLDS.itemTotalCorrelation
    if (correlation >= thresholds.good) return 'good'
    if (correlation >= thresholds.acceptable) return 'acceptable'
    if (correlation >= thresholds.problematic) return 'poor'
    return 'problematic'
  }

  private static interpretReliability(alpha: number): ReliabilityInterpretation {
    const t = RELIABILITY_THRESHOLDS.cronbachAlpha
    if (alpha >= t.excellent) return 'excellent'
    if (alpha >= t.good) return 'good'
    if (alpha >= t.acceptable) return 'acceptable'
    if (alpha >= t.questionable) return 'questionable'
    if (alpha >= t.poor) return 'poor'
    return 'unacceptable'
  }

  // Statistical helpers
  private static mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  private static variance(values: number[]): number {
    const m = this.mean(values)
    return values.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / values.length
  }

  private static pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length
    const meanX = this.mean(x)
    const meanY = this.mean(y)

    let numerator = 0
    let denomX = 0
    let denomY = 0

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX
      const dy = y[i] - meanY
      numerator += dx * dy
      denomX += dx * dx
      denomY += dy * dy
    }

    const denominator = Math.sqrt(denomX * denomY)
    if (denominator === 0) return 0

    return numerator / denominator
  }
}

// ============================================================================
// CONTENT VALIDITY ANALYSIS
// ============================================================================

export class ContentValidityAnalyzer {
  /**
   * Calculate Content Validity Index from expert ratings
   * @param ratings Matrix where rows are items and columns are experts
   *                Values should be 1-4 (1=not relevant, 4=highly relevant)
   */
  static calculateCVI(ratings: number[][], itemIds: string[]): ContentValidityResult {
    const itemCVIs: ItemCVI[] = []
    const expertCount = ratings[0]?.length || 0

    for (let i = 0; i < ratings.length; i++) {
      const expertRatings = ratings[i]
      // Count how many experts rated 3 or 4 (relevant or highly relevant)
      const relevanceCount = expertRatings.filter(r => r >= 3).length
      const cvi = relevanceCount / expertCount

      itemCVIs.push({
        itemId: itemIds[i],
        cvi,
        expertRatings,
        relevanceCount,
        needsRevision: cvi < VALIDITY_THRESHOLDS.content.iCVI,
      })
    }

    // Scale-level CVI (average method)
    const scaleCVI = itemCVIs.reduce((sum, item) => sum + item.cvi, 0) / itemCVIs.length

    // Scale-level CVI (universal agreement)
    const itemsWithUA = itemCVIs.filter(item => item.cvi === 1).length
    const scaleCVIUA = itemsWithUA / itemCVIs.length

    return {
      itemCVI: itemCVIs,
      scaleCVI,
      scaleCVIUA,
      expertCount,
      passesThreshold:
        scaleCVI >= VALIDITY_THRESHOLDS.content.sCVIAve &&
        itemCVIs.every(item => item.cvi >= VALIDITY_THRESHOLDS.content.iCVI),
    }
  }
}

// ============================================================================
// COGNITIVE INTERVIEW PROTOCOL GENERATOR
// ============================================================================

export class CognitiveInterviewGenerator {
  /**
   * Generate a cognitive interview protocol for a set of items
   */
  static generateProtocol(items: ScaleItem[]): CognitiveInterviewProtocol {
    return {
      introduction: this.generateIntroduction(),
      warmupQuestions: this.generateWarmupQuestions(),
      itemProbes: items.map(item => this.generateItemProbes(item)),
      closingQuestions: this.generateClosingQuestions(),
    }
  }

  private static generateIntroduction(): string {
    return `
Vielen Dank, dass Sie sich Zeit für dieses Interview nehmen.
Wir entwickeln einen Fragebogen und möchten verstehen, wie Menschen
die Fragen verstehen und beantworten.

Es gibt keine richtigen oder falschen Antworten - uns interessiert
Ihr Denkprozess. Bitte denken Sie laut und erzählen Sie mir,
was Ihnen durch den Kopf geht, während Sie die Fragen lesen und beantworten.

Ich werde Ihnen verschiedene Fragen vorlesen und Sie bitten,
mir zu erzählen, wie Sie zu Ihrer Antwort gekommen sind.
    `.trim()
  }

  private static generateWarmupQuestions(): string[] {
    return [
      'Bevor wir beginnen: Wie geht es Ihnen heute?',
      'Haben Sie in letzter Zeit an Umfragen teilgenommen?',
      'Gibt es etwas, das Sie bei Umfragen besonders stört oder gut finden?',
    ]
  }

  private static generateItemProbes(item: ScaleItem): {
    itemId: string
    itemText: string
    probes: { type: 'comprehension' | 'retrieval' | 'judgment' | 'response'; question: string }[]
  } {
    const probes: { type: 'comprehension' | 'retrieval' | 'judgment' | 'response'; question: string }[] = []

    // Always include comprehension probes
    probes.push({
      type: 'comprehension',
      question: COGNITIVE_INTERVIEW_PROBES.comprehension[0].replace('[TERM]', this.extractKeyTerm(item.text)),
    })
    probes.push({
      type: 'comprehension',
      question: COGNITIVE_INTERVIEW_PROBES.comprehension[2],
    })

    // Add retrieval probe
    probes.push({
      type: 'retrieval',
      question: COGNITIVE_INTERVIEW_PROBES.retrieval[3],
    })

    // Add judgment probe
    probes.push({
      type: 'judgment',
      question: COGNITIVE_INTERVIEW_PROBES.judgment[0],
    })

    // Add response probe
    probes.push({
      type: 'response',
      question: COGNITIVE_INTERVIEW_PROBES.response[1],
    })

    return {
      itemId: item.id,
      itemText: item.text,
      probes,
    }
  }

  private static generateClosingQuestions(): string[] {
    return [
      'Gibt es Fragen, die Sie besonders verwirrend oder schwierig fanden?',
      'Gibt es Fragen, die Sie anders formulieren würden?',
      'Haben wir etwas Wichtiges vergessen zu fragen?',
      'Haben Sie noch weitere Anmerkungen zum Fragebogen?',
    ]
  }

  private static extractKeyTerm(text: string): string {
    // Simple heuristic: extract nouns (capitalized words in German)
    const words = text.split(/\s+/)
    const nouns = words.filter(w => /^[A-ZÄÖÜ]/.test(w) && w.length > 3)
    return nouns[0] || words[Math.floor(words.length / 2)]
  }
}

// ============================================================================
// VALIDATION STUDY PLANNER
// ============================================================================

export class ValidationStudyPlanner {
  /**
   * Create a validation study plan for a new scale
   */
  static createPlan(
    scaleName: string,
    itemCount: number,
    dimensions: number = 1
  ): ValidationStudyPlan {
    const phases = this.calculatePhases(itemCount, dimensions)
    const totalSampleSize = phases.reduce((sum, phase) => sum + phase.sampleSize, 0)

    return {
      phases,
      totalSampleSize,
      timeline: this.estimateTimeline(phases),
      analysisProtocol: this.createAnalysisProtocol(dimensions),
    }
  }

  private static calculatePhases(itemCount: number, dimensions: number): ValidationStudyPlan['phases'] {
    return [
      {
        name: 'Content Validity',
        purpose: 'Sicherstellen, dass Items das Konstrukt repräsentieren',
        sampleSize: SAMPLE_SIZE_GUIDELINES.contentValidity.experts.min,
        analyses: [
          'I-CVI (Item Content Validity Index)',
          'S-CVI/Ave (Scale Content Validity Index)',
          'Kappa-Koeffizient',
        ],
        successCriteria: [
          `I-CVI ≥ ${VALIDITY_THRESHOLDS.content.iCVI} für alle Items`,
          `S-CVI/Ave ≥ ${VALIDITY_THRESHOLDS.content.sCVIAve}`,
        ],
      },
      {
        name: 'Cognitive Interviews',
        purpose: 'Verständlichkeit und Interpretierbarkeit prüfen',
        sampleSize: SAMPLE_SIZE_GUIDELINES.cognitiveInterview.recommended,
        analyses: [
          'Think-Aloud Protokolle',
          'Verbal Probing',
          'Qualitative Analyse der Probleme',
        ],
        successCriteria: [
          'Keine systematischen Verständnisprobleme',
          'Konsistente Interpretation der Items',
        ],
      },
      {
        name: 'Pilot Study',
        purpose: 'Vorläufige Reliabilität und Item-Analyse',
        sampleSize: Math.max(
          SAMPLE_SIZE_GUIDELINES.pilot.recommended,
          itemCount * 3
        ),
        analyses: [
          "Cronbach's Alpha",
          'Item-Total Korrelationen',
          'Alpha-if-Item-Deleted',
          'Item-Schwierigkeiten',
        ],
        successCriteria: [
          `Cronbach's α ≥ ${RELIABILITY_THRESHOLDS.cronbachAlpha.acceptable}`,
          `Item-Total r ≥ ${RELIABILITY_THRESHOLDS.itemTotalCorrelation.acceptable}`,
        ],
      },
      {
        name: 'Exploratory Factor Analysis',
        purpose: 'Faktorstruktur explorieren',
        sampleSize: Math.max(
          SAMPLE_SIZE_GUIDELINES.efa.recommended,
          itemCount * SAMPLE_SIZE_GUIDELINES.efa.subjectToItemRatio
        ),
        analyses: [
          'Parallel Analysis',
          'Scree Plot',
          'EFA mit Oblimin-Rotation',
          'Faktorladungen',
        ],
        successCriteria: [
          `Faktorladungen ≥ 0.40 auf Primärfaktor`,
          `Kreuzladungen ≤ 0.30`,
          `${dimensions} Faktor(en) erwartet`,
        ],
      },
      {
        name: 'Confirmatory Factor Analysis',
        purpose: 'Faktorstruktur bestätigen',
        sampleSize: Math.max(
          SAMPLE_SIZE_GUIDELINES.cfa.recommended,
          itemCount * SAMPLE_SIZE_GUIDELINES.cfa.perParameter
        ),
        analyses: [
          'CFA mit ML-Schätzung',
          'Model Fit Indices (CFI, TLI, RMSEA, SRMR)',
          'Modifikationsindizes',
          'Konvergente/Diskriminante Validität',
        ],
        successCriteria: [
          `CFI/TLI ≥ ${MODEL_FIT_THRESHOLDS.cfi.acceptable}`,
          `RMSEA ≤ ${MODEL_FIT_THRESHOLDS.rmsea.acceptable}`,
          `SRMR ≤ ${MODEL_FIT_THRESHOLDS.srmr.acceptable}`,
          `AVE > ${VALIDITY_THRESHOLDS.convergent.ave}`,
        ],
      },
    ]
  }

  private static estimateTimeline(phases: ValidationStudyPlan['phases']): string {
    // Rough estimates based on typical research timelines
    const phaseWeeks = [2, 3, 4, 6, 6] // Weeks per phase
    const totalWeeks = phaseWeeks.reduce((a, b) => a + b, 0)
    const totalMonths = Math.ceil(totalWeeks / 4)

    return `Geschätzte Dauer: ${totalMonths} Monate (${totalWeeks} Wochen)`
  }

  private static createAnalysisProtocol(dimensions: number): string[] {
    const protocol = [
      'Deskriptive Statistiken für alle Items',
      'Missing Data Analyse (<5% akzeptabel)',
      'Normalverteilungsprüfung (Schiefe <2, Kurtosis <7)',
      "Interne Konsistenz (Cronbach's α, McDonald's ω)",
      'Item-Total Korrelationen (korrigiert)',
    ]

    if (dimensions === 1) {
      protocol.push('Unidimensionalitätsprüfung')
    } else {
      protocol.push(`Multi-Faktor CFA (${dimensions} Faktoren)`)
      protocol.push('Messinvarianz-Prüfung (falls Gruppenvergleiche)')
    }

    protocol.push(
      'Konvergente Validität (AVE, CR)',
      'Diskriminante Validität (HTMT, Fornell-Larcker)',
      'Kriteriumsvalidität (falls Kriterium verfügbar)'
    )

    return protocol
  }
}

// ============================================================================
// SAMPLE SIZE CALCULATOR
// ============================================================================

export class SampleSizeCalculator {
  /**
   * Calculate required sample size for different analyses
   */
  static calculate(
    analysisType: 'pilot' | 'efa' | 'cfa' | 'irt',
    itemCount: number,
    factorCount: number = 1
  ): { minimum: number; recommended: number; rationale: string } {
    switch (analysisType) {
      case 'pilot':
        return {
          minimum: SAMPLE_SIZE_GUIDELINES.pilot.minimum,
          recommended: Math.max(
            SAMPLE_SIZE_GUIDELINES.pilot.recommended,
            itemCount * 3
          ),
          rationale: 'Für vorläufige Reliabilitätsschätzung',
        }

      case 'efa':
        return {
          minimum: Math.max(
            SAMPLE_SIZE_GUIDELINES.efa.minimum,
            itemCount * SAMPLE_SIZE_GUIDELINES.efa.subjectToItemRatio
          ),
          recommended: Math.max(
            SAMPLE_SIZE_GUIDELINES.efa.recommended,
            itemCount * 10
          ),
          rationale: `Mindestens ${SAMPLE_SIZE_GUIDELINES.efa.subjectToItemRatio}:1 Subjects pro Item`,
        }

      case 'cfa':
        // Calculate parameters: factor loadings + factor variances + error variances
        const parameters = itemCount + factorCount + itemCount
        return {
          minimum: Math.max(
            SAMPLE_SIZE_GUIDELINES.cfa.minimum,
            parameters * SAMPLE_SIZE_GUIDELINES.cfa.perParameter
          ),
          recommended: Math.max(
            SAMPLE_SIZE_GUIDELINES.cfa.recommended,
            parameters * 15
          ),
          rationale: `${SAMPLE_SIZE_GUIDELINES.cfa.perParameter}:1 Subjects pro frei geschätztem Parameter`,
        }

      case 'irt':
        return {
          minimum: SAMPLE_SIZE_GUIDELINES.irt.minimum,
          recommended: SAMPLE_SIZE_GUIDELINES.irt.recommended,
          rationale: 'Für stabile IRT-Parameterschätzung',
        }

      default:
        return {
          minimum: 100,
          recommended: 300,
          rationale: 'Allgemeine Empfehlung',
        }
    }
  }
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class QuestionnaireService {
  // Item Quality
  static analyzeItemQuality = ItemQualityAnalyzer.analyzeItem.bind(ItemQualityAnalyzer)
  static analyzeItems(items: string[]): ItemQualityReport[] {
    return items.map(item => ItemQualityAnalyzer.analyzeItem(item))
  }

  // Reliability
  static analyzeReliability = ReliabilityAnalyzer.analyzeReliability.bind(ReliabilityAnalyzer)
  static calculateCronbachAlpha = ReliabilityAnalyzer.calculateCronbachAlpha.bind(ReliabilityAnalyzer)

  // Content Validity
  static calculateContentValidity = ContentValidityAnalyzer.calculateCVI.bind(ContentValidityAnalyzer)

  // Cognitive Interviews
  static generateCognitiveInterviewProtocol = CognitiveInterviewGenerator.generateProtocol.bind(CognitiveInterviewGenerator)

  // Validation Planning
  static createValidationPlan = ValidationStudyPlanner.createPlan.bind(ValidationStudyPlanner)
  static calculateSampleSize = SampleSizeCalculator.calculate.bind(SampleSizeCalculator)

  /**
   * Generate Likert scale anchors
   */
  static getLikertAnchors(
    type: 'agreement' | 'frequency' | 'satisfaction',
    points: 5 | 7 = 5
  ): string[] {
    const key = `${type}${points}` as keyof typeof LIKERT_SCALE_GUIDELINES.examples
    return LIKERT_SCALE_GUIDELINES.examples[key] || LIKERT_SCALE_GUIDELINES.examples.agreement5
  }

  /**
   * Interpret reliability coefficient
   */
  static interpretReliability(alpha: number): {
    interpretation: string
    recommendation: string
  } {
    const t = RELIABILITY_THRESHOLDS.cronbachAlpha

    if (alpha >= t.excellent) {
      return {
        interpretation: 'Exzellent',
        recommendation: alpha > t.tooHigh
          ? 'Alpha > 0.95 kann auf redundante Items hinweisen. Prüfen Sie, ob Items zusammengefasst werden können.'
          : 'Reliabilität ist ausgezeichnet.',
      }
    }
    if (alpha >= t.good) {
      return {
        interpretation: 'Gut',
        recommendation: 'Reliabilität ist gut für Forschungszwecke.',
      }
    }
    if (alpha >= t.acceptable) {
      return {
        interpretation: 'Akzeptabel',
        recommendation: 'Reliabilität ist akzeptabel, aber Verbesserung möglich.',
      }
    }
    if (alpha >= t.questionable) {
      return {
        interpretation: 'Fragwürdig',
        recommendation: 'Prüfen Sie Item-Total-Korrelationen und entfernen Sie problematische Items.',
      }
    }
    if (alpha >= t.poor) {
      return {
        interpretation: 'Schlecht',
        recommendation: 'Skala benötigt erhebliche Überarbeitung.',
      }
    }
    return {
      interpretation: 'Unakzeptabel',
      recommendation: 'Skala sollte nicht verwendet werden. Grundlegende Neuentwicklung nötig.',
    }
  }
}

export default QuestionnaireService
