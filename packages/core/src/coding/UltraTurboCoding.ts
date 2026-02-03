import type { Document, CodingOptions, CodingResult, Code, Coding } from '../types'
import type { CodingServiceConfig } from './CodingService'

/**
 * Ultra Turbo Scientific Coding System
 *
 * Fastest coding method for rapid exploration:
 * 1. Single-pass analysis with optimized prompts
 * 2. Parallel processing of document segments
 * 3. Immediate code generation without consensus rounds
 *
 * Use cases:
 * - Initial exploration of large datasets
 * - Time-sensitive coding tasks
 * - Generating preliminary code suggestions
 *
 * Note: Lower reliability than multi-expert methods,
 * but significantly faster for first-pass analysis.
 */
export class UltraTurboCoding {
  private config: CodingServiceConfig
  private readonly CHUNK_SIZE = 2000 // Characters per chunk
  private readonly MAX_PARALLEL = 5 // Max parallel API calls

  constructor(config: CodingServiceConfig) {
    this.config = config
  }

  async code(document: Document, options: CodingOptions): Promise<CodingResult> {
    // Phase 1: Split document into processable chunks
    const chunks = this.splitDocument(document)

    // Phase 2: Process chunks in parallel batches
    const chunkResults = await this.processChunksParallel(chunks, document.id, options)

    // Phase 3: Merge and deduplicate results
    const mergedResult = this.mergeResults(chunkResults)

    // Phase 4: Build code hierarchy
    const codeHierarchy = this.buildCodeHierarchy(mergedResult.codes, options.existingCodes)

    return {
      codings: mergedResult.codings,
      codes: codeHierarchy,
      metadata: {
        method: 'ultra-turbo',
        duration: 0,
        tokenCount: chunks.reduce((sum, c) => sum + c.text.length, 0),
      },
    }
  }

  private splitDocument(document: Document): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    const content = document.content

    // Split at paragraph boundaries when possible
    const paragraphs = content.split(/\n\n+/)
    let currentChunk = ''
    let currentOffset = 0
    let chunkStartOffset = 0

    for (const para of paragraphs) {
      if (currentChunk.length + para.length > this.CHUNK_SIZE && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          id: `chunk-${chunks.length}`,
          text: currentChunk.trim(),
          startOffset: chunkStartOffset,
          endOffset: currentOffset,
        })
        currentChunk = para
        chunkStartOffset = currentOffset
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para
      }
      currentOffset += para.length + 2
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: `chunk-${chunks.length}`,
        text: currentChunk.trim(),
        startOffset: chunkStartOffset,
        endOffset: content.length,
      })
    }

    return chunks
  }

  private async processChunksParallel(
    chunks: DocumentChunk[],
    documentId: string,
    options: CodingOptions
  ): Promise<ChunkResult[]> {
    const results: ChunkResult[] = []

    // Process in batches to respect rate limits
    for (let i = 0; i < chunks.length; i += this.MAX_PARALLEL) {
      const batch = chunks.slice(i, i + this.MAX_PARALLEL)
      const batchResults = await Promise.all(
        batch.map(chunk => this.processChunk(chunk, documentId, options))
      )
      results.push(...batchResults)
    }

    return results
  }

  private async processChunk(
    chunk: DocumentChunk,
    documentId: string,
    options: CodingOptions
  ): Promise<ChunkResult> {
    // Build the prompt
    const prompt = this.buildCodingPrompt(chunk.text, options)

    // In production, this would call Claude API
    // For now, return placeholder
    return {
      chunkId: chunk.id,
      codings: [],
      suggestedCodes: [],
      startOffset: chunk.startOffset,
    }
  }

  private buildCodingPrompt(text: string, options: CodingOptions): string {
    const lang = options.language || 'de'

    const basePrompt = lang === 'de' ? `
Analysiere den folgenden Text und identifiziere relevante Codes für qualitative Forschung.

Für jeden Code, gib an:
1. Name des Codes (kurz, prägnant)
2. Beschreibung (1 Satz)
3. Die exakte Textstelle, die kodiert werden soll
4. Begründung für die Kodierung

Existierende Codes zur Referenz:
${options.existingCodes?.map(c => `- ${c.name}: ${c.description || ''}`).join('\n') || 'Keine'}

TEXT:
${text}

Antworte im JSON-Format:
{
  "codings": [
    {
      "codeName": "...",
      "description": "...",
      "selectedText": "...",
      "reasoning": "..."
    }
  ],
  "newCodes": [
    {
      "name": "...",
      "description": "..."
    }
  ]
}
` : `
Analyze the following text and identify relevant codes for qualitative research.

For each code, provide:
1. Code name (short, concise)
2. Description (1 sentence)
3. The exact text segment to be coded
4. Reasoning for the coding

Existing codes for reference:
${options.existingCodes?.map(c => `- ${c.name}: ${c.description || ''}`).join('\n') || 'None'}

TEXT:
${text}

Respond in JSON format:
{
  "codings": [
    {
      "codeName": "...",
      "description": "...",
      "selectedText": "...",
      "reasoning": "..."
    }
  ],
  "newCodes": [
    {
      "name": "...",
      "description": "..."
    }
  ]
}
`

    return basePrompt
  }

  private mergeResults(chunkResults: ChunkResult[]): MergedResult {
    const allCodings: Coding[] = []
    const allCodes = new Map<string, Code>()

    for (const result of chunkResults) {
      // Add codings with adjusted offsets
      for (const coding of result.codings) {
        allCodings.push({
          ...coding,
          startOffset: coding.startOffset + result.startOffset,
          endOffset: coding.endOffset + result.startOffset,
        })
      }

      // Deduplicate codes by name
      for (const code of result.suggestedCodes) {
        const key = code.name.toLowerCase().trim()
        if (!allCodes.has(key)) {
          allCodes.set(key, code)
        }
      }
    }

    // Remove duplicate codings (same text, same code)
    const uniqueCodings = this.deduplicateCodings(allCodings)

    return {
      codings: uniqueCodings,
      codes: Array.from(allCodes.values()),
    }
  }

  private deduplicateCodings(codings: Coding[]): Coding[] {
    const seen = new Set<string>()
    const unique: Coding[] = []

    for (const coding of codings) {
      const key = `${coding.startOffset}-${coding.endOffset}-${coding.codeName.toLowerCase()}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(coding)
      }
    }

    return unique
  }

  private buildCodeHierarchy(newCodes: Code[], existingCodes?: Code[]): Code[] {
    const allCodes = [...(existingCodes || []), ...newCodes]

    // Group similar codes as children of parent codes
    const hierarchy: Code[] = []
    const used = new Set<string>()

    for (const code of allCodes) {
      if (used.has(code.id)) continue

      // Find potential children
      const children = allCodes.filter(c => {
        if (c.id === code.id || used.has(c.id)) return false
        return this.isSubconcept(c.name, code.name)
      })

      if (children.length > 0) {
        hierarchy.push({
          ...code,
          children: children,
        })
        used.add(code.id)
        children.forEach(c => used.add(c.id))
      } else if (!used.has(code.id)) {
        hierarchy.push(code)
        used.add(code.id)
      }
    }

    return hierarchy
  }

  private isSubconcept(childName: string, parentName: string): boolean {
    const child = childName.toLowerCase()
    const parent = parentName.toLowerCase()

    // Check if child contains parent name as prefix
    if (child.startsWith(parent + ' ') || child.startsWith(parent + ':')) {
      return true
    }

    // Check for common parent-child patterns
    const patterns = [
      { parent: 'emotion', children: ['freude', 'trauer', 'angst', 'wut', 'joy', 'sadness', 'fear', 'anger'] },
      { parent: 'erfahrung', children: ['positive', 'negative', 'neutral', 'experience'] },
    ]

    for (const pattern of patterns) {
      if (parent.includes(pattern.parent)) {
        if (pattern.children.some(c => child.includes(c))) {
          return true
        }
      }
    }

    return false
  }
}

interface DocumentChunk {
  id: string
  text: string
  startOffset: number
  endOffset: number
}

interface ChunkResult {
  chunkId: string
  codings: Coding[]
  suggestedCodes: Code[]
  startOffset: number
}

interface MergedResult {
  codings: Coding[]
  codes: Code[]
}
