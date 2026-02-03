import type { Document, CodingOptions, CodingResult, Code, Coding } from '../types'
import type { CodingServiceConfig } from './CodingService'

/**
 * Dynamic Coding Personas System
 *
 * Creates contextually-aware AI personas that adapt to the document content.
 * Each persona brings a unique perspective:
 * - Domain Expert: Deep knowledge of the subject matter
 * - Methodology Expert: Focus on research rigor and patterns
 * - Critical Analyst: Questions assumptions and finds edge cases
 *
 * Personas reach consensus through discussion, improving reliability.
 */
export class DynamicCodingPersonas {
  private config: CodingServiceConfig

  constructor(config: CodingServiceConfig) {
    this.config = config
  }

  async code(document: Document, options: CodingOptions): Promise<CodingResult> {
    const personas = this.generatePersonas(document, options)

    // Phase 1: Independent Coding
    const personaResults = await Promise.all(
      personas.map(persona => this.codeWithPersona(document, persona, options))
    )

    // Phase 2: Consensus Building
    const consensusResult = await this.buildConsensus(personaResults, document, options)

    // Phase 3: Integration
    return this.integrateResults(consensusResult, options)
  }

  private generatePersonas(document: Document, options: CodingOptions): Persona[] {
    // Analyze document to determine appropriate personas
    const contentType = this.analyzeContentType(document.content)

    return [
      {
        id: 'domain-expert',
        name: 'Domain Expert',
        systemPrompt: this.getDomainExpertPrompt(contentType, options.language),
        focus: 'thematic-depth',
      },
      {
        id: 'methodology-expert',
        name: 'Methodology Expert',
        systemPrompt: this.getMethodologyExpertPrompt(options.language),
        focus: 'pattern-recognition',
      },
      {
        id: 'critical-analyst',
        name: 'Critical Analyst',
        systemPrompt: this.getCriticalAnalystPrompt(options.language),
        focus: 'edge-cases',
      },
    ]
  }

  private analyzeContentType(content: string): ContentType {
    const lowerContent = content.toLowerCase()

    if (lowerContent.includes('interview') || lowerContent.includes('frage:') || lowerContent.includes('antwort:')) {
      return 'interview'
    }
    if (lowerContent.includes('fokusgruppe') || lowerContent.includes('diskussion') || lowerContent.includes('teilnehmer')) {
      return 'focus-group'
    }
    if (lowerContent.includes('beobachtung') || lowerContent.includes('feldnotiz')) {
      return 'field-notes'
    }
    return 'general'
  }

  private getDomainExpertPrompt(contentType: ContentType, language?: string): string {
    const lang = language || 'de'
    const prompts: Record<ContentType, string> = {
      'interview': lang === 'de'
        ? 'Du bist ein erfahrener Interviewforscher. Analysiere die Aussagen auf tieferliegende Bedeutungen, Emotionen und implizite Annahmen.'
        : 'You are an experienced interview researcher. Analyze statements for deeper meanings, emotions, and implicit assumptions.',
      'focus-group': lang === 'de'
        ? 'Du bist ein Fokusgruppen-Spezialist. Achte auf Gruppendynamik, Konsens, Dissens und soziale Einflüsse.'
        : 'You are a focus group specialist. Pay attention to group dynamics, consensus, dissent, and social influences.',
      'field-notes': lang === 'de'
        ? 'Du bist ein Ethnograph. Analysiere Beobachtungen auf kulturelle Muster, Praktiken und soziale Strukturen.'
        : 'You are an ethnographer. Analyze observations for cultural patterns, practices, and social structures.',
      'general': lang === 'de'
        ? 'Du bist ein qualitativer Forscher. Analysiere den Text auf Themen, Konzepte und Bedeutungsmuster.'
        : 'You are a qualitative researcher. Analyze the text for themes, concepts, and meaning patterns.',
    }
    return prompts[contentType]
  }

  private getMethodologyExpertPrompt(language?: string): string {
    return language === 'de'
      ? 'Du bist ein Methodenexperte für qualitative Forschung. Achte auf konsistente Kodierung, klare Abgrenzungen zwischen Codes und methodische Stringenz.'
      : 'You are a methodology expert for qualitative research. Focus on consistent coding, clear code boundaries, and methodological rigor.'
  }

  private getCriticalAnalystPrompt(language?: string): string {
    return language === 'de'
      ? 'Du bist ein kritischer Analyst. Hinterfrage offensichtliche Interpretationen, suche nach Widersprüchen, Ausnahmen und alternativen Lesarten.'
      : 'You are a critical analyst. Question obvious interpretations, look for contradictions, exceptions, and alternative readings.'
  }

  private async codeWithPersona(
    document: Document,
    persona: Persona,
    options: CodingOptions
  ): Promise<PersonaCodingResult> {
    // In production, this would call the Claude API
    // For now, return a placeholder structure
    return {
      personaId: persona.id,
      codings: [],
      suggestedCodes: [],
      reasoning: '',
    }
  }

  private async buildConsensus(
    results: PersonaCodingResult[],
    document: Document,
    options: CodingOptions
  ): Promise<ConsensusResult> {
    // Collect all codings
    const allCodings = results.flatMap(r => r.codings)

    // Find overlapping codings (same text span, similar code)
    const consensusCodings: Coding[] = []
    const usedIds = new Set<string>()

    for (const coding of allCodings) {
      if (usedIds.has(coding.id)) continue

      // Find matching codings from other personas
      const matches = allCodings.filter(
        c => c.id !== coding.id &&
          this.hasOverlap(coding, c) &&
          this.isSimilarCode(coding.codeName, c.codeName)
      )

      if (matches.length >= 1) {
        // At least 2 personas agree (original + 1 match)
        consensusCodings.push({
          ...coding,
          confidence: (matches.length + 1) / results.length,
        })
        usedIds.add(coding.id)
        matches.forEach(m => usedIds.add(m.id))
      }
    }

    // Merge suggested codes
    const allSuggestedCodes = results.flatMap(r => r.suggestedCodes)
    const mergedCodes = this.mergeCodeSuggestions(allSuggestedCodes)

    return {
      codings: consensusCodings,
      codes: mergedCodes,
      consensusRate: consensusCodings.length / Math.max(allCodings.length, 1),
    }
  }

  private hasOverlap(a: Coding, b: Coding): boolean {
    return a.documentId === b.documentId &&
      a.startOffset < b.endOffset &&
      a.endOffset > b.startOffset
  }

  private isSimilarCode(name1: string, name2: string): boolean {
    const normalize = (s: string) => s.toLowerCase().trim()
    const n1 = normalize(name1)
    const n2 = normalize(name2)

    if (n1 === n2) return true
    if (n1.includes(n2) || n2.includes(n1)) return true

    // Simple word overlap check
    const words1 = new Set(n1.split(/\s+/))
    const words2 = new Set(n2.split(/\s+/))
    const intersection = [...words1].filter(w => words2.has(w))
    const union = new Set([...words1, ...words2])

    return intersection.length / union.size > 0.5
  }

  private mergeCodeSuggestions(codes: Code[]): Code[] {
    const merged = new Map<string, Code>()

    for (const code of codes) {
      const normalized = code.name.toLowerCase().trim()
      if (!merged.has(normalized)) {
        merged.set(normalized, code)
      }
    }

    return Array.from(merged.values())
  }

  private integrateResults(consensus: ConsensusResult, options: CodingOptions): CodingResult {
    return {
      codings: consensus.codings,
      codes: consensus.codes,
      metadata: {
        method: 'dynamic-personas',
        duration: 0,
        consensusRate: consensus.consensusRate,
      },
    }
  }
}

interface Persona {
  id: string
  name: string
  systemPrompt: string
  focus: 'thematic-depth' | 'pattern-recognition' | 'edge-cases'
}

interface PersonaCodingResult {
  personaId: string
  codings: Coding[]
  suggestedCodes: Code[]
  reasoning: string
}

interface ConsensusResult {
  codings: Coding[]
  codes: Code[]
  consensusRate: number
}

type ContentType = 'interview' | 'focus-group' | 'field-notes' | 'general'
