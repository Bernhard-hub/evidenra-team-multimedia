import type { Document, CodingOptions, CodingResult, Code, Coding } from '../types'
import type { CodingServiceConfig } from './CodingService'

/**
 * Three Expert Coding System
 *
 * Simulates having three independent human coders:
 * 1. All three code the document independently
 * 2. Only codings where at least 2/3 experts agree are kept
 * 3. Achieves high inter-rater reliability through consensus
 *
 * This approach mirrors best practices in qualitative research
 * where multiple coders increase validity.
 */
export class ThreeExpertCodingSystem {
  private config: CodingServiceConfig

  constructor(config: CodingServiceConfig) {
    this.config = config
  }

  async code(document: Document, options: CodingOptions): Promise<CodingResult> {
    // Create three independent expert instances
    const experts: Expert[] = [
      {
        id: 'expert-1',
        name: 'Qualitative Researcher',
        prompt: this.getExpertPrompt(1, options.language),
        temperature: 0.3,
      },
      {
        id: 'expert-2',
        name: 'Thematic Analyst',
        prompt: this.getExpertPrompt(2, options.language),
        temperature: 0.4,
      },
      {
        id: 'expert-3',
        name: 'Content Specialist',
        prompt: this.getExpertPrompt(3, options.language),
        temperature: 0.5,
      },
    ]

    // Phase 1: Independent coding by all experts
    const expertResults = await Promise.all(
      experts.map(expert => this.codeWithExpert(document, expert, options))
    )

    // Phase 2: Calculate agreement matrix
    const agreementMatrix = this.calculateAgreementMatrix(expertResults)

    // Phase 3: Extract consensus codings (2/3 or 3/3 agreement)
    const consensusCodings = this.extractConsensusCodings(expertResults, agreementMatrix)

    // Phase 4: Merge code hierarchies
    const mergedCodes = this.mergeCodeHierarchies(expertResults.map(r => r.codes))

    return {
      codings: consensusCodings,
      codes: mergedCodes,
      metadata: {
        method: 'three-expert',
        duration: 0,
        consensusRate: this.calculateConsensusRate(agreementMatrix),
      },
    }
  }

  private getExpertPrompt(expertNumber: number, language?: string): string {
    const lang = language || 'de'

    const prompts = {
      1: {
        de: `Du bist Experte 1: Ein erfahrener qualitativer Forscher mit Fokus auf induktive Kodierung.
Identifiziere Themen, die direkt aus dem Text emergieren. Sei offen für unerwartete Muster.
Kodiere sorgfältig und begründe jeden Code kurz.`,
        en: `You are Expert 1: An experienced qualitative researcher focusing on inductive coding.
Identify themes that emerge directly from the text. Be open to unexpected patterns.
Code carefully and briefly justify each code.`
      },
      2: {
        de: `Du bist Experte 2: Ein thematischer Analyst mit Fokus auf deduktive Kodierung.
Suche nach bekannten Konzepten und theoretischen Konstrukten im Text.
Achte auf strukturelle Muster und kategoriale Zusammenhänge.`,
        en: `You are Expert 2: A thematic analyst focusing on deductive coding.
Look for known concepts and theoretical constructs in the text.
Pay attention to structural patterns and categorical relationships.`
      },
      3: {
        de: `Du bist Experte 3: Ein Inhaltsanalytiker mit Fokus auf manifeste und latente Bedeutungen.
Analysiere sowohl explizite Aussagen als auch implizite Bedeutungen.
Berücksichtige Kontext, Sprache und Emotionen.`,
        en: `You are Expert 3: A content analyst focusing on manifest and latent meanings.
Analyze both explicit statements and implicit meanings.
Consider context, language, and emotions.`
      }
    }

    return prompts[expertNumber as 1 | 2 | 3][lang]
  }

  private async codeWithExpert(
    document: Document,
    expert: Expert,
    options: CodingOptions
  ): Promise<ExpertCodingResult> {
    // In production, this would call the Claude API with expert-specific prompts
    // For now, return placeholder
    return {
      expertId: expert.id,
      codings: [],
      codes: [],
    }
  }

  private calculateAgreementMatrix(results: ExpertCodingResult[]): AgreementMatrix {
    const matrix: AgreementMatrix = {
      segments: [],
      pairwiseAgreement: {},
    }

    // Segment the document into units for comparison
    const allCodings = results.flatMap(r => r.codings)
    const uniqueSegments = this.extractUniqueSegments(allCodings)

    for (const segment of uniqueSegments) {
      const expertsAgreeing: string[] = []

      for (const result of results) {
        const hasOverlappingCoding = result.codings.some(
          c => this.segmentsOverlap(c, segment)
        )
        if (hasOverlappingCoding) {
          expertsAgreeing.push(result.expertId)
        }
      }

      matrix.segments.push({
        ...segment,
        expertsAgreeing,
        agreementLevel: expertsAgreeing.length / results.length,
      })
    }

    // Calculate pairwise agreement
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const key = `${results[i].expertId}-${results[j].expertId}`
        matrix.pairwiseAgreement[key] = this.calculatePairwiseAgreement(
          results[i].codings,
          results[j].codings
        )
      }
    }

    return matrix
  }

  private extractUniqueSegments(codings: Coding[]): Segment[] {
    const segments: Segment[] = []

    for (const coding of codings) {
      const existing = segments.find(
        s => s.documentId === coding.documentId &&
          s.startOffset === coding.startOffset &&
          s.endOffset === coding.endOffset
      )

      if (!existing) {
        segments.push({
          documentId: coding.documentId,
          startOffset: coding.startOffset,
          endOffset: coding.endOffset,
          text: coding.selectedText,
        })
      }
    }

    return segments
  }

  private segmentsOverlap(coding: Coding, segment: Segment): boolean {
    return coding.documentId === segment.documentId &&
      coding.startOffset < segment.endOffset &&
      coding.endOffset > segment.startOffset
  }

  private calculatePairwiseAgreement(codings1: Coding[], codings2: Coding[]): number {
    if (codings1.length === 0 && codings2.length === 0) return 1
    if (codings1.length === 0 || codings2.length === 0) return 0

    let agreements = 0
    const matched = new Set<string>()

    for (const c1 of codings1) {
      for (const c2 of codings2) {
        if (matched.has(c2.id)) continue
        if (this.codingsMatch(c1, c2)) {
          agreements++
          matched.add(c2.id)
          break
        }
      }
    }

    const total = Math.max(codings1.length, codings2.length)
    return agreements / total
  }

  private codingsMatch(a: Coding, b: Coding): boolean {
    // Check text overlap
    const textOverlap =
      a.documentId === b.documentId &&
      a.startOffset < b.endOffset &&
      a.endOffset > b.startOffset

    if (!textOverlap) return false

    // Check code similarity
    const codeMatch = this.normalizeCode(a.codeName) === this.normalizeCode(b.codeName)

    return codeMatch
  }

  private normalizeCode(name: string): string {
    return name.toLowerCase().trim().replace(/[^\w\s]/g, '')
  }

  private extractConsensusCodings(
    results: ExpertCodingResult[],
    matrix: AgreementMatrix
  ): Coding[] {
    const consensusCodings: Coding[] = []

    for (const segment of matrix.segments) {
      // Require at least 2/3 agreement
      if (segment.agreementLevel >= 0.66) {
        // Find the coding from the agreeing experts
        const agreeingExperts = segment.expertsAgreeing

        for (const result of results) {
          if (!agreeingExperts.includes(result.expertId)) continue

          const matchingCoding = result.codings.find(
            c => this.segmentsOverlap(c, segment)
          )

          if (matchingCoding) {
            consensusCodings.push({
              ...matchingCoding,
              confidence: segment.agreementLevel,
            })
            break
          }
        }
      }
    }

    return consensusCodings
  }

  private mergeCodeHierarchies(codeArrays: Code[][]): Code[] {
    const merged = new Map<string, Code>()

    for (const codes of codeArrays) {
      for (const code of codes) {
        const key = this.normalizeCode(code.name)
        if (!merged.has(key)) {
          merged.set(key, code)
        }
      }
    }

    return Array.from(merged.values())
  }

  private calculateConsensusRate(matrix: AgreementMatrix): number {
    if (matrix.segments.length === 0) return 0

    const consensusSegments = matrix.segments.filter(s => s.agreementLevel >= 0.66)
    return consensusSegments.length / matrix.segments.length
  }
}

interface Expert {
  id: string
  name: string
  prompt: string
  temperature: number
}

interface ExpertCodingResult {
  expertId: string
  codings: Coding[]
  codes: Code[]
}

interface Segment {
  documentId: string
  startOffset: number
  endOffset: number
  text: string
}

interface AgreementSegment extends Segment {
  expertsAgreeing: string[]
  agreementLevel: number
}

interface AgreementMatrix {
  segments: AgreementSegment[]
  pairwiseAgreement: Record<string, number>
}
