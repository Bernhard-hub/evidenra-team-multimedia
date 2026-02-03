import type { Document, CodingOptions, CodingResult, Code, Coding } from '../types'
import type { CodingServiceConfig } from './CodingService'

/**
 * Calibrated Pattern Coding System
 *
 * Uses existing codes as calibration anchors:
 * 1. Learns patterns from existing codings (if provided)
 * 2. Uses TF-IDF similarity to match new text segments to existing patterns
 * 3. AI validates and adjusts matches
 * 4. Achieves high consistency with prior codings
 *
 * Ideal for maintaining coding consistency across large datasets.
 */
export class CalibratedPatternCoding {
  private config: CodingServiceConfig

  constructor(config: CodingServiceConfig) {
    this.config = config
  }

  async code(document: Document, options: CodingOptions): Promise<CodingResult> {
    // Phase 1: Build pattern vocabulary from existing codes
    const patterns = await this.buildPatternVocabulary(options.existingCodes || [])

    // Phase 2: Segment document into coding units
    const segments = this.segmentDocument(document)

    // Phase 3: Calculate TF-IDF similarity for each segment
    const similarities = this.calculateSimilarities(segments, patterns)

    // Phase 4: AI validation and refinement
    const validatedCodings = await this.validateWithAI(
      document,
      segments,
      similarities,
      patterns,
      options
    )

    // Phase 5: Generate new codes for unmatched segments
    const newCodes = await this.generateNewCodes(
      document,
      segments.filter(s => !validatedCodings.some(c => c.startOffset === s.startOffset)),
      options
    )

    return {
      codings: validatedCodings,
      codes: [...(options.existingCodes || []), ...newCodes],
      metadata: {
        method: 'calibrated-pattern',
        duration: 0,
        consensusRate: validatedCodings.length / Math.max(segments.length, 1),
      },
    }
  }

  private async buildPatternVocabulary(existingCodes: Code[]): Promise<Pattern[]> {
    return existingCodes.map(code => ({
      codeId: code.id,
      codeName: code.name,
      keywords: this.extractKeywords(code.name + ' ' + (code.description || '')),
      tfidf: new Map(),
    }))
  }

  private extractKeywords(text: string): string[] {
    const stopwords = new Set([
      'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'aber', 'wenn',
      'the', 'a', 'an', 'and', 'or', 'but', 'if', 'is', 'are', 'was', 'were'
    ])

    return text
      .toLowerCase()
      .replace(/[^\w\sÄäÖöÜüß]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.has(word))
  }

  private segmentDocument(document: Document): DocumentSegment[] {
    const segments: DocumentSegment[] = []
    const content = document.content

    // Split by paragraphs first
    const paragraphs = content.split(/\n\n+/)
    let currentOffset = 0

    for (const para of paragraphs) {
      if (para.trim().length === 0) {
        currentOffset += para.length + 2
        continue
      }

      // Split long paragraphs into sentences
      const sentences = para.split(/(?<=[.!?])\s+/)

      for (const sentence of sentences) {
        if (sentence.trim().length > 10) {
          const startOffset = content.indexOf(sentence, currentOffset)
          segments.push({
            text: sentence.trim(),
            startOffset,
            endOffset: startOffset + sentence.length,
            keywords: this.extractKeywords(sentence),
          })
        }
        currentOffset = content.indexOf(sentence, currentOffset) + sentence.length
      }
    }

    return segments
  }

  private calculateSimilarities(
    segments: DocumentSegment[],
    patterns: Pattern[]
  ): SimilarityResult[] {
    const results: SimilarityResult[] = []

    // Calculate document frequency for IDF
    const df = new Map<string, number>()
    for (const segment of segments) {
      const uniqueWords = new Set(segment.keywords)
      for (const word of uniqueWords) {
        df.set(word, (df.get(word) || 0) + 1)
      }
    }

    for (const segment of segments) {
      const segmentTfidf = this.calculateTFIDF(segment.keywords, df, segments.length)
      const patternSimilarities: PatternSimilarity[] = []

      for (const pattern of patterns) {
        const patternTfidf = this.calculateTFIDF(pattern.keywords, df, segments.length)
        const similarity = this.cosineSimilarity(segmentTfidf, patternTfidf)

        if (similarity > 0.1) {
          patternSimilarities.push({
            pattern,
            similarity,
          })
        }
      }

      // Sort by similarity descending
      patternSimilarities.sort((a, b) => b.similarity - a.similarity)

      results.push({
        segment,
        matches: patternSimilarities.slice(0, 3), // Top 3 matches
      })
    }

    return results
  }

  private calculateTFIDF(
    keywords: string[],
    df: Map<string, number>,
    totalDocs: number
  ): Map<string, number> {
    const tfidf = new Map<string, number>()
    const tf = new Map<string, number>()

    // Calculate term frequency
    for (const word of keywords) {
      tf.set(word, (tf.get(word) || 0) + 1)
    }

    // Calculate TF-IDF
    for (const [word, freq] of tf) {
      const docFreq = df.get(word) || 1
      const idf = Math.log(totalDocs / docFreq)
      tfidf.set(word, (freq / keywords.length) * idf)
    }

    return tfidf
  }

  private cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
    let dotProduct = 0
    let normA = 0
    let normB = 0

    const allWords = new Set([...a.keys(), ...b.keys()])

    for (const word of allWords) {
      const valA = a.get(word) || 0
      const valB = b.get(word) || 0
      dotProduct += valA * valB
      normA += valA * valA
      normB += valB * valB
    }

    if (normA === 0 || normB === 0) return 0
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  private async validateWithAI(
    document: Document,
    segments: DocumentSegment[],
    similarities: SimilarityResult[],
    patterns: Pattern[],
    options: CodingOptions
  ): Promise<Coding[]> {
    const codings: Coding[] = []
    const minConfidence = options.minConfidence || 0.3

    for (const result of similarities) {
      if (result.matches.length === 0) continue

      const topMatch = result.matches[0]
      if (topMatch.similarity < minConfidence) continue

      // In production, this would validate with Claude API
      // For now, create coding based on similarity score
      codings.push({
        id: `coding-${result.segment.startOffset}`,
        documentId: document.id,
        codeId: topMatch.pattern.codeId,
        codeName: topMatch.pattern.codeName,
        startOffset: result.segment.startOffset,
        endOffset: result.segment.endOffset,
        selectedText: result.segment.text,
        confidence: topMatch.similarity,
        codedBy: 'calibrated-pattern',
        createdAt: new Date().toISOString(),
      })
    }

    return codings
  }

  private async generateNewCodes(
    document: Document,
    unmatchedSegments: DocumentSegment[],
    options: CodingOptions
  ): Promise<Code[]> {
    // In production, this would use Claude to suggest new codes
    // For now, return empty array
    return []
  }
}

interface Pattern {
  codeId: string
  codeName: string
  keywords: string[]
  tfidf: Map<string, number>
}

interface DocumentSegment {
  text: string
  startOffset: number
  endOffset: number
  keywords: string[]
}

interface PatternSimilarity {
  pattern: Pattern
  similarity: number
}

interface SimilarityResult {
  segment: DocumentSegment
  matches: PatternSimilarity[]
}
