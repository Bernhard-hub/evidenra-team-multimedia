/**
 * Nexus Item Generator
 * EVIDENRA Research - AI-Assisted Questionnaire Development
 *
 * This service enables Nexus to:
 * 1. Extract constructs from qualitative codes
 * 2. Search for existing validated scales
 * 3. Generate new items when no scale fits
 * 4. Quality-check all generated items
 *
 * The generator follows strict scientific guidelines:
 * - Items based on qualitative data, never invented
 * - Automatic quality checks (double-barreled, leading, etc.)
 * - Integration with ZIS/GESIS for validated scales
 * - COSMIN-compliant documentation
 */

import {
  ConstructDefinition,
  ConstructDimension,
  SourceSegment,
  Scale,
  ItemQualityReport,
} from './types'

import { ItemQualityAnalyzer } from './QuestionnaireService'
import { ZISRepository, ZISSearchResult } from './repositories/ZISRepository'
import { ITEM_WRITING_RULES, LIKERT_SCALE_GUIDELINES } from './knowledge'

// ============================================================================
// TYPES
// ============================================================================

export interface QualitativeCode {
  id: string
  name: string
  description?: string
  color?: string
  parentId?: string
}

export interface QualitativeSegment {
  id: string
  text: string
  codeId: string
  codeName: string
  documentId?: string
  documentName?: string
}

export interface ConstructExtractionResult {
  construct: ConstructDefinition
  confidence: number
  existingScales: ZISSearchResult[]
  recommendation: 'use-existing' | 'adapt-existing' | 'create-new'
  rationale: string
}

export interface GeneratedItem {
  id: string
  text: string
  dimension: string
  formulation: 'positive' | 'negative'
  basedOn: {
    type: 'segment' | 'code' | 'dimension'
    reference: string
    text?: string
  }
  qualityReport: ItemQualityReport
  alternativeVersions?: string[]
}

export interface ItemGenerationResult {
  items: GeneratedItem[]
  distribution: {
    byDimension: Record<string, number>
    positiveNegative: { positive: number; negative: number }
  }
  qualitySummary: {
    passed: number
    needsRevision: number
    rejected: number
  }
  warnings: string[]
}

// ============================================================================
// CONSTRUCT EXTRACTOR
// ============================================================================

export class ConstructExtractor {
  /**
   * Extract construct definition from qualitative codes and segments
   */
  static extract(
    codes: QualitativeCode[],
    segments: QualitativeSegment[]
  ): ConstructExtractionResult {
    // Group segments by code
    const segmentsByCode = new Map<string, QualitativeSegment[]>()
    for (const segment of segments) {
      const existing = segmentsByCode.get(segment.codeId) || []
      existing.push(segment)
      segmentsByCode.set(segment.codeId, existing)
    }

    // Identify main construct (most coded topic or parent code)
    const rootCodes = codes.filter(c => !c.parentId)
    const mainCode = rootCodes.length > 0
      ? rootCodes.reduce((max, code) => {
          const count = segmentsByCode.get(code.id)?.length || 0
          const maxCount = segmentsByCode.get(max.id)?.length || 0
          return count > maxCount ? code : max
        })
      : codes[0]

    // Extract dimensions from child codes or from main codes
    const dimensions = this.extractDimensions(codes, segmentsByCode, mainCode.id)

    // Create construct definition
    const construct: ConstructDefinition = {
      name: mainCode.name,
      definition: mainCode.description || `Konstrukt basierend auf ${segments.length} qualitativen Segmenten`,
      dimensions,
      relatedConstructs: this.identifyRelatedConstructs(codes, segments),
      sourceSegments: segments.slice(0, 50).map(s => ({
        id: s.id,
        text: s.text,
        codeId: s.codeId,
        codeName: s.codeName,
      })),
    }

    // Search for existing scales
    const existingScales = ZISRepository.suggestFromCodes(
      codes.map(c => ({ name: c.name, description: c.description }))
    )

    // Determine recommendation
    const { recommendation, rationale } = this.determineRecommendation(
      construct,
      existingScales
    )

    // Calculate confidence
    const confidence = this.calculateConfidence(construct, segments.length)

    return {
      construct,
      confidence,
      existingScales,
      recommendation,
      rationale,
    }
  }

  private static extractDimensions(
    codes: QualitativeCode[],
    segmentsByCode: Map<string, QualitativeSegment[]>,
    mainCodeId: string
  ): ConstructDimension[] {
    const dimensions: ConstructDimension[] = []

    // Find child codes of main code
    const childCodes = codes.filter(c => c.parentId === mainCodeId)

    if (childCodes.length > 0) {
      // Use child codes as dimensions
      for (const child of childCodes) {
        const childSegments = segmentsByCode.get(child.id) || []
        dimensions.push({
          name: child.name,
          definition: child.description || '',
          indicators: this.extractIndicators(childSegments),
          segmentCount: childSegments.length,
        })
      }
    } else {
      // Use all codes as potential dimensions
      for (const code of codes) {
        const codeSegments = segmentsByCode.get(code.id) || []
        if (codeSegments.length >= 3) { // Minimum 3 segments for a dimension
          dimensions.push({
            name: code.name,
            definition: code.description || '',
            indicators: this.extractIndicators(codeSegments),
            segmentCount: codeSegments.length,
          })
        }
      }
    }

    return dimensions
  }

  private static extractIndicators(segments: QualitativeSegment[]): string[] {
    const indicators: string[] = []

    // Extract key phrases from segments
    for (const segment of segments.slice(0, 10)) {
      const words = segment.text.split(/\s+/)
      if (words.length >= 3 && words.length <= 15) {
        // Short segments can be indicators directly
        indicators.push(segment.text.substring(0, 100))
      } else if (words.length > 15) {
        // Extract first meaningful phrase
        const phrase = words.slice(0, 10).join(' ') + '...'
        indicators.push(phrase)
      }
    }

    return [...new Set(indicators)].slice(0, 5)
  }

  private static identifyRelatedConstructs(
    codes: QualitativeCode[],
    _segments: QualitativeSegment[]
  ): string[] {
    const related: string[] = []

    // Search ZIS for each code to find related constructs
    for (const code of codes.slice(0, 5)) {
      const results = ZISRepository.search({ query: code.name, maxItems: 2 })
      for (const result of results) {
        if (!related.includes(result.scale.construct)) {
          related.push(result.scale.construct)
        }
      }
    }

    return related.slice(0, 5)
  }

  private static determineRecommendation(
    construct: ConstructDefinition,
    existingScales: ZISSearchResult[]
  ): { recommendation: 'use-existing' | 'adapt-existing' | 'create-new'; rationale: string } {
    if (existingScales.length === 0) {
      return {
        recommendation: 'create-new',
        rationale: 'Keine validierten Skalen für dieses Konstrukt gefunden.',
      }
    }

    const topScale = existingScales[0]

    // High relevance score suggests good match
    if (topScale.relevanceScore >= 15) {
      return {
        recommendation: 'use-existing',
        rationale: `Die Skala "${topScale.scale.name}" (${topScale.scale.authors.join(', ')}, ${topScale.scale.year}) passt gut zum Konstrukt. Cronbach's α = ${topScale.scale.validation.cronbachAlpha?.toFixed(2) || 'k.A.'}`,
      }
    }

    if (topScale.relevanceScore >= 8) {
      return {
        recommendation: 'adapt-existing',
        rationale: `Die Skala "${topScale.scale.name}" kann als Basis dienen, benötigt aber Anpassung an den spezifischen Kontext.`,
      }
    }

    return {
      recommendation: 'create-new',
      rationale: 'Existierende Skalen passen nicht ausreichend zum spezifischen Konstrukt.',
    }
  }

  private static calculateConfidence(
    construct: ConstructDefinition,
    segmentCount: number
  ): number {
    let confidence = 0

    // More segments = higher confidence
    if (segmentCount >= 50) confidence += 30
    else if (segmentCount >= 20) confidence += 20
    else if (segmentCount >= 10) confidence += 10

    // More dimensions = higher confidence
    if (construct.dimensions.length >= 3) confidence += 25
    else if (construct.dimensions.length >= 2) confidence += 15
    else confidence += 5

    // Definition present
    if (construct.definition && construct.definition.length > 20) confidence += 15

    // Related constructs found
    if (construct.relatedConstructs.length > 0) confidence += 15

    // Indicators extracted
    const totalIndicators = construct.dimensions.reduce(
      (sum, d) => sum + d.indicators.length, 0
    )
    if (totalIndicators >= 10) confidence += 15
    else if (totalIndicators >= 5) confidence += 10

    return Math.min(100, confidence)
  }
}

// ============================================================================
// ITEM GENERATOR
// ============================================================================

export class ItemGenerator {
  /**
   * Generate items for a construct based on qualitative data
   */
  static generate(
    construct: ConstructDefinition,
    options: {
      itemsPerDimension?: number
      responseFormat?: 'likert5' | 'likert7'
      negativeItemRatio?: number
      language?: 'de' | 'en'
    } = {}
  ): ItemGenerationResult {
    const {
      itemsPerDimension = 4,
      responseFormat = 'likert5',
      negativeItemRatio = 0.2,
      language = 'de',
    } = options

    const items: GeneratedItem[] = []
    const warnings: string[] = []

    // Generate items for each dimension
    for (const dimension of construct.dimensions) {
      const dimensionItems = this.generateDimensionItems(
        dimension,
        construct.sourceSegments.filter(s =>
          dimension.indicators.some(ind =>
            s.text.toLowerCase().includes(ind.toLowerCase().split('...')[0])
          ) || s.codeName === dimension.name
        ),
        itemsPerDimension,
        negativeItemRatio,
        language
      )

      items.push(...dimensionItems)

      if (dimensionItems.length < itemsPerDimension) {
        warnings.push(
          `Dimension "${dimension.name}": Nur ${dimensionItems.length}/${itemsPerDimension} Items generiert (zu wenig qualitative Daten)`
        )
      }
    }

    // If no dimensions, generate from all segments
    if (construct.dimensions.length === 0 && construct.sourceSegments.length > 0) {
      const generalDimension: ConstructDimension = {
        name: construct.name,
        definition: construct.definition,
        indicators: construct.sourceSegments.slice(0, 5).map(s => s.text.substring(0, 50)),
        segmentCount: construct.sourceSegments.length,
      }

      const generalItems = this.generateDimensionItems(
        generalDimension,
        construct.sourceSegments,
        itemsPerDimension * 3,
        negativeItemRatio,
        language
      )

      items.push(...generalItems)
    }

    // Calculate distribution
    const byDimension: Record<string, number> = {}
    let positive = 0
    let negative = 0

    for (const item of items) {
      byDimension[item.dimension] = (byDimension[item.dimension] || 0) + 1
      if (item.formulation === 'positive') positive++
      else negative++
    }

    // Quality summary
    const passed = items.filter(i => i.qualityReport.passesValidation).length
    const needsRevision = items.filter(i =>
      !i.qualityReport.passesValidation &&
      i.qualityReport.overallScore >= 50
    ).length
    const rejected = items.length - passed - needsRevision

    return {
      items,
      distribution: {
        byDimension,
        positiveNegative: { positive, negative },
      },
      qualitySummary: { passed, needsRevision, rejected },
      warnings,
    }
  }

  private static generateDimensionItems(
    dimension: ConstructDimension,
    segments: SourceSegment[],
    count: number,
    negativeRatio: number,
    language: 'de' | 'en'
  ): GeneratedItem[] {
    const items: GeneratedItem[] = []
    const negativeCount = Math.floor(count * negativeRatio)
    const positiveCount = count - negativeCount

    // Generate positive items
    for (let i = 0; i < positiveCount && i < segments.length; i++) {
      const segment = segments[i]
      const item = this.createItemFromSegment(
        segment,
        dimension.name,
        'positive',
        language,
        items.length + 1
      )
      items.push(item)
    }

    // Generate negative items (reverse-coded)
    for (let i = 0; i < negativeCount && positiveCount + i < segments.length; i++) {
      const segment = segments[positiveCount + i]
      const item = this.createItemFromSegment(
        segment,
        dimension.name,
        'negative',
        language,
        items.length + 1
      )
      items.push(item)
    }

    // Generate from indicators if not enough segments
    if (items.length < count) {
      for (const indicator of dimension.indicators) {
        if (items.length >= count) break

        const item = this.createItemFromIndicator(
          indicator,
          dimension.name,
          items.length % 5 === 0 ? 'negative' : 'positive',
          language,
          items.length + 1
        )
        items.push(item)
      }
    }

    return items
  }

  private static createItemFromSegment(
    segment: SourceSegment,
    dimension: string,
    formulation: 'positive' | 'negative',
    language: 'de' | 'en',
    itemNumber: number
  ): GeneratedItem {
    // Extract key concept from segment
    const concept = this.extractConcept(segment.text)

    // Generate item text
    let itemText: string
    if (language === 'de') {
      itemText = formulation === 'positive'
        ? this.generatePositiveItemDE(concept, dimension)
        : this.generateNegativeItemDE(concept, dimension)
    } else {
      itemText = formulation === 'positive'
        ? this.generatePositiveItemEN(concept, dimension)
        : this.generateNegativeItemEN(concept, dimension)
    }

    // Quality check
    const qualityReport = ItemQualityAnalyzer.analyzeItem(itemText)

    // Generate alternatives if quality issues
    const alternativeVersions: string[] = []
    if (!qualityReport.passesValidation) {
      alternativeVersions.push(this.improveItem(itemText, qualityReport, language))
    }

    return {
      id: `item_${itemNumber.toString().padStart(2, '0')}`,
      text: itemText,
      dimension,
      formulation,
      basedOn: {
        type: 'segment',
        reference: segment.id,
        text: segment.text.substring(0, 100),
      },
      qualityReport,
      alternativeVersions: alternativeVersions.length > 0 ? alternativeVersions : undefined,
    }
  }

  private static createItemFromIndicator(
    indicator: string,
    dimension: string,
    formulation: 'positive' | 'negative',
    language: 'de' | 'en',
    itemNumber: number
  ): GeneratedItem {
    const concept = indicator.replace('...', '').trim()

    let itemText: string
    if (language === 'de') {
      itemText = formulation === 'positive'
        ? this.generatePositiveItemDE(concept, dimension)
        : this.generateNegativeItemDE(concept, dimension)
    } else {
      itemText = formulation === 'positive'
        ? this.generatePositiveItemEN(concept, dimension)
        : this.generateNegativeItemEN(concept, dimension)
    }

    const qualityReport = ItemQualityAnalyzer.analyzeItem(itemText)

    return {
      id: `item_${itemNumber.toString().padStart(2, '0')}`,
      text: itemText,
      dimension,
      formulation,
      basedOn: {
        type: 'dimension',
        reference: dimension,
        text: indicator,
      },
      qualityReport,
    }
  }

  private static extractConcept(text: string): string {
    // Remove common filler words and extract core concept
    const words = text
      .replace(/[.,;:!?]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .filter(w => !['dass', 'wenn', 'weil', 'aber', 'oder', 'auch', 'noch', 'schon', 'sehr', 'that', 'when', 'because', 'also', 'very'].includes(w.toLowerCase()))

    // Take middle portion (often most meaningful)
    const start = Math.floor(words.length * 0.2)
    const end = Math.min(words.length, start + 8)

    return words.slice(start, end).join(' ')
  }

  private static generatePositiveItemDE(concept: string, _dimension: string): string {
    const templates = [
      `Ich erlebe ${concept.toLowerCase()} als positiv.`,
      `${concept} ist für mich wichtig.`,
      `Ich fühle mich wohl, wenn ${concept.toLowerCase()}.`,
      `Ich schätze ${concept.toLowerCase()} in meinem Alltag.`,
      `${concept} trägt zu meinem Wohlbefinden bei.`,
      `Ich bin zufrieden mit ${concept.toLowerCase()}.`,
    ]

    return templates[Math.floor(Math.random() * templates.length)]
  }

  private static generateNegativeItemDE(concept: string, _dimension: string): string {
    const templates = [
      `${concept} bereitet mir Schwierigkeiten.`,
      `Ich habe Probleme mit ${concept.toLowerCase()}.`,
      `${concept} belastet mich.`,
      `Ich fühle mich unwohl bei ${concept.toLowerCase()}.`,
      `${concept} ist eine Herausforderung für mich.`,
    ]

    return templates[Math.floor(Math.random() * templates.length)]
  }

  private static generatePositiveItemEN(concept: string, _dimension: string): string {
    const templates = [
      `I experience ${concept.toLowerCase()} positively.`,
      `${concept} is important to me.`,
      `I feel comfortable when ${concept.toLowerCase()}.`,
      `I value ${concept.toLowerCase()} in my daily life.`,
      `${concept} contributes to my well-being.`,
    ]

    return templates[Math.floor(Math.random() * templates.length)]
  }

  private static generateNegativeItemEN(concept: string, _dimension: string): string {
    const templates = [
      `${concept} causes me difficulties.`,
      `I struggle with ${concept.toLowerCase()}.`,
      `${concept} is a burden for me.`,
      `I feel uncomfortable with ${concept.toLowerCase()}.`,
      `${concept} is challenging for me.`,
    ]

    return templates[Math.floor(Math.random() * templates.length)]
  }

  private static improveItem(
    item: string,
    report: ItemQualityReport,
    _language: 'de' | 'en'
  ): string {
    let improved = item

    // Fix double-barreled
    if (report.issues.some(i => i.type === 'double-barreled')) {
      const parts = improved.split(/ und | or /i)
      improved = parts[0] + '.'
    }

    // Fix leading questions
    if (report.issues.some(i => i.type === 'leading')) {
      const leadingWords = ['natürlich', 'offensichtlich', 'selbstverständlich', 'excellent', 'amazing', 'ausgezeichnet']
      for (const word of leadingWords) {
        improved = improved.replace(new RegExp(word, 'gi'), '')
      }
      improved = improved.replace(/\s+/g, ' ').trim()
    }

    // Fix too long
    if (report.issues.some(i => i.type === 'too-long')) {
      const words = improved.split(/\s+/)
      improved = words.slice(0, 15).join(' ')
      if (!improved.endsWith('.')) improved += '.'
    }

    return improved
  }
}

// ============================================================================
// SCALE BUILDER
// ============================================================================

export class ScaleBuilder {
  /**
   * Build a complete scale from generated items
   */
  static build(
    name: string,
    construct: ConstructDefinition,
    items: GeneratedItem[],
    responseFormat: 'likert5' | 'likert7' = 'likert5'
  ): Scale {
    // Filter to only passing items
    const validItems = items.filter(i => i.qualityReport.passesValidation)

    // Create scale items
    const scaleItems: ScaleItem[] = validItems.map((item, index) => ({
      id: item.id,
      text: item.text,
      dimensionId: item.dimension,
      isReverseCoded: item.formulation === 'negative',
      itemNumber: index + 1,
    }))

    // Create response format
    const format: ResponseFormat = {
      type: 'likert',
      points: responseFormat === 'likert5' ? 5 : 7,
      anchors: responseFormat === 'likert5'
        ? LIKERT_SCALE_GUIDELINES.examples.agreement5
        : LIKERT_SCALE_GUIDELINES.examples.agreement7,
      allLabeled: true,
      midpoint: 'Weder noch',
    }

    // Create dimensions
    const dimensions = construct.dimensions.map((d, i) => ({
      id: `dim_${i + 1}`,
      name: d.name,
      definition: d.definition,
      itemIds: scaleItems.filter(item => item.dimensionId === d.name).map(item => item.id),
    }))

    return {
      id: `scale_${Date.now()}`,
      name,
      authors: ['EVIDENRA Nexus (AI-generiert)'],
      year: new Date().getFullYear(),
      language: ['de'],
      construct: construct.name,
      dimensions,
      items: scaleItems,
      responseFormat: format,
      validation: {
        // To be filled after validation study
      },
      source: 'generated',
    }
  }
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class NexusItemGenerator {
  /**
   * Complete workflow: Extract construct → Find scales → Generate items
   */
  static async generateQuestionnaire(
    codes: QualitativeCode[],
    segments: QualitativeSegment[],
    options: {
      scaleName?: string
      itemsPerDimension?: number
      responseFormat?: 'likert5' | 'likert7'
      language?: 'de' | 'en'
    } = {}
  ): Promise<{
    constructAnalysis: ConstructExtractionResult
    generatedItems?: ItemGenerationResult
    scale?: Scale
    recommendation: string
  }> {
    // Step 1: Extract construct
    const constructAnalysis = ConstructExtractor.extract(codes, segments)

    // Step 2: Check recommendation
    if (constructAnalysis.recommendation === 'use-existing') {
      return {
        constructAnalysis,
        recommendation: `Empfehlung: Verwenden Sie die existierende Skala "${constructAnalysis.existingScales[0]?.scale.name}". Zugang: ${constructAnalysis.existingScales[0]?.scale.zisUrl}`,
      }
    }

    // Step 3: Generate items
    const generatedItems = ItemGenerator.generate(
      constructAnalysis.construct,
      {
        itemsPerDimension: options.itemsPerDimension || 4,
        responseFormat: options.responseFormat || 'likert5',
        language: options.language || 'de',
      }
    )

    // Step 4: Build scale
    const scale = ScaleBuilder.build(
      options.scaleName || constructAnalysis.construct.name,
      constructAnalysis.construct,
      generatedItems.items,
      options.responseFormat || 'likert5'
    )

    // Step 5: Generate recommendation
    let recommendation: string
    if (constructAnalysis.recommendation === 'adapt-existing') {
      recommendation = `Empfehlung: Adaptieren Sie "${constructAnalysis.existingScales[0]?.scale.name}" und ergänzen Sie mit ${generatedItems.qualitySummary.passed} generierten Items.`
    } else {
      recommendation = `Neue Skala mit ${scale.items?.length || 0} Items erstellt. Nächster Schritt: Content-Validierung durch Experten.`
    }

    return {
      constructAnalysis,
      generatedItems,
      scale,
      recommendation,
    }
  }

  // Export sub-modules
  static ConstructExtractor = ConstructExtractor
  static ItemGenerator = ItemGenerator
  static ScaleBuilder = ScaleBuilder
}

export default NexusItemGenerator
