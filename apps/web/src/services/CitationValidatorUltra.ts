/**
 * Citation Validator ULTRA v2.0
 * 5-Level Intelligent Validation System
 * Detects AI hallucinations in citations
 * Ported from EVIDENRA Ultimate for Team Multimedia
 */

import { SemanticAnalysisService } from './SemanticAnalysisService'

export interface Citation {
  text: string
  author?: string
  year?: string
  page?: string
  fullCitation: string
  type: 'direct-quote' | 'paraphrase' | 'reference'
}

export interface ValidationResult {
  citation: Citation
  isValid: boolean
  confidence: number
  validationLevel: 1 | 2 | 3 | 4 | 5
  foundIn?: string
  matchedText?: string
  issue?: string
  reasoning?: string
}

export interface ArticleValidationReport {
  totalCitations: number
  validCitations: number
  invalidCitations: number
  suspiciousCitations: number
  validationRate: number
  citationScore: number
  levelBreakdown: {
    level1: number
    level2: number
    level3: number
    level4: number
    level5: number
  }
  results: ValidationResult[]
  hallucinations: ValidationResult[]
  warnings: string[]
  autoFixSuggestions: Array<{
    original: string
    suggested: string
    reason: string
  }>
  summary: string
  skipped?: boolean
  skipReason?: string
}

export class CitationValidatorUltra {

  /**
   * LEVEL 1: Exact Quote Match
   */
  private static level1_ExactQuoteMatch(
    citation: Citation,
    documents: Array<{ name: string; content: string }>
  ): ValidationResult | null {
    if (!citation.text || citation.text.length < 10) return null

    for (const doc of documents) {
      if (doc.content.includes(citation.text)) {
        return {
          citation,
          isValid: true,
          confidence: 1.0,
          validationLevel: 1,
          foundIn: doc.name,
          matchedText: citation.text,
          reasoning: 'Exact quote found in source document'
        }
      }
    }
    return null
  }

  /**
   * LEVEL 2: Author-Year Validation
   */
  private static level2_AuthorYearValidation(
    citation: Citation,
    documents: Array<{ name: string; content: string }>
  ): ValidationResult | null {
    if (!citation.author || !citation.year) return null

    const author = citation.author.toLowerCase()
    const year = citation.year

    for (const doc of documents) {
      const content = doc.content.toLowerCase()
      const name = doc.name.toLowerCase()

      const authorParts = author.split(/[,&]/).map(p => p.trim())
      const authorLastNames = authorParts.map(part => {
        const words = part.split(/\s+/)
        return words[words.length - 1].replace(/\./g, '')
      })

      const nameMatchScore = authorLastNames.filter(lastName =>
        name.includes(lastName)
      ).length / authorLastNames.length

      const yearInDoc = content.includes(year) || name.includes(year)

      const contentMatchScore = authorLastNames.filter(lastName =>
        content.includes(lastName)
      ).length / authorLastNames.length

      const matchScore = Math.max(nameMatchScore, contentMatchScore)

      if (matchScore >= 0.5 && yearInDoc) {
        return {
          citation,
          isValid: true,
          confidence: 0.7 + (matchScore * 0.3),
          validationLevel: 2,
          foundIn: doc.name,
          reasoning: `Author "${citation.author}" and year ${year} found in document (${(matchScore * 100).toFixed(0)}% author match)`
        }
      }

      if (matchScore >= 0.8) {
        return {
          citation,
          isValid: true,
          confidence: 0.6,
          validationLevel: 2,
          foundIn: doc.name,
          reasoning: `Strong author match (${(matchScore * 100).toFixed(0)}%), year not verified`
        }
      }
    }
    return null
  }

  /**
   * LEVEL 3: Document Name Fuzzy Match
   */
  private static level3_DocumentNameMatch(
    citation: Citation,
    documents: Array<{ name: string; content: string }>
  ): ValidationResult | null {
    if (!citation.author) return null

    const author = citation.author.toLowerCase()
    const year = citation.year || ''

    for (const doc of documents) {
      const name = doc.name.toLowerCase()
      const nameParts = name.split(/[_\-\s.]+/)

      const hasAuthor = nameParts.some(part =>
        author.includes(part) || part.includes(author.split(/\s+/)[0])
      )
      const hasYear = year && nameParts.includes(year)

      if (hasAuthor && hasYear) {
        return {
          citation,
          isValid: true,
          confidence: 0.85,
          validationLevel: 3,
          foundIn: doc.name,
          reasoning: `Document filename matches citation pattern (${citation.author}, ${year})`
        }
      }

      if (hasAuthor) {
        return {
          citation,
          isValid: true,
          confidence: 0.65,
          validationLevel: 3,
          foundIn: doc.name,
          reasoning: `Document filename contains author name`
        }
      }
    }
    return null
  }

  /**
   * LEVEL 4: Semantic Topic Match
   */
  private static level4_TopicMatch(
    citation: Citation,
    documents: Array<{ name: string; content: string }>
  ): ValidationResult | null {
    if (!citation.text || citation.text.length < 20) return null

    const keywords = this.extractKeywords(citation.text)
    if (keywords.length === 0) return null

    for (const doc of documents) {
      const content = doc.content.toLowerCase()

      const matchCount = keywords.filter(kw => content.includes(kw)).length
      const matchRate = matchCount / keywords.length

      if (matchRate >= 0.4) {
        const sentences = doc.content.split(/[.!?]+/).filter(s => s.length > 30)
        let bestSimilarity = 0
        let bestSentence = ''

        for (const sentence of sentences.slice(0, 100)) {
          const similarity = SemanticAnalysisService.calculateSimilarity(
            citation.text,
            sentence
          )
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity
            bestSentence = sentence.trim()
          }
        }

        if (bestSimilarity >= 0.6 || matchRate >= 0.6) {
          return {
            citation,
            isValid: true,
            confidence: Math.max(bestSimilarity, matchRate * 0.8),
            validationLevel: 4,
            foundIn: doc.name,
            matchedText: bestSentence.substring(0, 150) + '...',
            reasoning: `Semantic topic match: ${(matchRate * 100).toFixed(0)}% keyword overlap, ${(bestSimilarity * 100).toFixed(0)}% similarity`
          }
        }
      }
    }
    return null
  }

  /**
   * LEVEL 5: AI Plausibility Check
   */
  private static level5_AIPlausibilityCheck(
    citation: Citation,
    documents: Array<{ name: string; content: string }>
  ): ValidationResult {
    let plausibilityScore = 0
    const reasons: string[] = []

    if (citation.text && this.hasScientificLanguage(citation.text)) {
      plausibilityScore += 0.2
      reasons.push('Scientific language detected')
    }

    if (citation.year) {
      const year = parseInt(citation.year)
      const docYears = documents.map(d => this.extractYearFromContent(d.content)).filter(y => y > 0)
      const avgYear = docYears.reduce((a, b) => a + b, 0) / (docYears.length || 1)

      if (Math.abs(year - avgYear) < 10) {
        plausibilityScore += 0.15
        reasons.push(`Year ${year} matches document timeframe`)
      }
    }

    if (citation.author && this.isPlausibleAuthorName(citation.author)) {
      plausibilityScore += 0.1
      reasons.push('Plausible author name format')
    }

    if (citation.text && citation.text.length >= 20 && citation.text.length <= 500) {
      plausibilityScore += 0.1
      reasons.push('Plausible quote length')
    }

    const allContent = documents.map(d => d.content).join(' ').toLowerCase()
    if (citation.text) {
      const words = citation.text.toLowerCase().split(/\s+/).filter(w => w.length > 5)
      const relevantWords = words.filter(w => allContent.includes(w))
      const relevance = relevantWords.length / Math.max(words.length, 1)

      if (relevance >= 0.3) {
        plausibilityScore += relevance * 0.3
        reasons.push(`${(relevance * 100).toFixed(0)}% word overlap with corpus`)
      }
    }

    const isValid = plausibilityScore >= 0.5

    return {
      citation,
      isValid,
      confidence: Math.min(plausibilityScore, 0.75),
      validationLevel: 5,
      reasoning: isValid
        ? `AI Plausibility Check PASSED (${(plausibilityScore * 100).toFixed(0)}%): ${reasons.join(', ')}`
        : `AI Plausibility Check FAILED (${(plausibilityScore * 100).toFixed(0)}%): Likely hallucination`,
      issue: isValid ? undefined : 'Low plausibility score - possible hallucination'
    }
  }

  /**
   * MASTER VALIDATION: Cascade through all 5 levels
   */
  static validateCitation(
    citation: Citation,
    documents: Array<{ name: string; content: string }>
  ): ValidationResult {

    const level1 = this.level1_ExactQuoteMatch(citation, documents)
    if (level1) return level1

    const level2 = this.level2_AuthorYearValidation(citation, documents)
    if (level2 && level2.confidence >= 0.7) return level2

    const level3 = this.level3_DocumentNameMatch(citation, documents)
    if (level3 && level3.confidence >= 0.65) return level3

    const level4 = this.level4_TopicMatch(citation, documents)
    if (level4 && level4.confidence >= 0.6) return level4

    const level5 = this.level5_AIPlausibilityCheck(citation, documents)

    const allResults = [level2, level3, level4, level5].filter(r => r !== null) as ValidationResult[]
    if (allResults.length > 0) {
      return allResults.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      )
    }

    return {
      citation,
      isValid: false,
      confidence: 0,
      validationLevel: 5,
      issue: 'No match found across all 5 validation levels - likely hallucination',
      reasoning: 'Failed: Exact quote, Author-Year, Document name, Topic match, and AI plausibility checks'
    }
  }

  /**
   * Extract Citations from Article
   */
  static extractCitations(article: string): Citation[] {
    const citations: Citation[] = []

    // Pattern 1: Direct Quote: "..." (Author, Year)
    const pattern1 = /[""]([^""]{15,})[""]\s*\(([A-Za-zäöüÄÖÜß\s,&\.]+),?\s*(\d{4}[a-z]?)\)/g
    let match
    while ((match = pattern1.exec(article)) !== null) {
      citations.push({
        text: match[1].trim(),
        author: match[2].trim(),
        year: match[3],
        fullCitation: match[0],
        type: 'direct-quote'
      })
    }

    // Pattern 2: Paraphrase: (Author, Year)
    const pattern2 = /\(([A-Za-zäöüÄÖÜß\s,&\.]+),?\s*(\d{4}[a-z]?)\)/g
    while ((match = pattern2.exec(article)) !== null) {
      const isDuplicate = citations.some(c => c.fullCitation === match[0])
      if (!isDuplicate) {
        citations.push({
          text: '',
          author: match[1].trim(),
          year: match[2],
          fullCitation: match[0],
          type: 'paraphrase'
        })
      }
    }

    // Pattern 3: Reference: Author (Year) argues/states...
    const pattern3 = /([A-Za-zäöüÄÖÜß]+(?:\s+et\s+al\.?)?)\s*\((\d{4}[a-z]?)\)\s+(?:argues|states|claims|suggests|proposes|demonstrates)/gi
    while ((match = pattern3.exec(article)) !== null) {
      citations.push({
        text: '',
        author: match[1].trim(),
        year: match[2],
        fullCitation: match[0],
        type: 'reference'
      })
    }

    return citations
  }

  /**
   * Validate entire article with 5-Level System
   */
  static validateArticle(
    article: string,
    documents: Array<{ name: string; content: string }>
  ): ArticleValidationReport {
    const citations = this.extractCitations(article)
    const results: ValidationResult[] = []
    const hallucinationResults: ValidationResult[] = []
    const warnings: string[] = []

    let validCount = 0
    let invalidCount = 0
    let suspiciousCount = 0

    const levelBreakdown = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 }

    for (const citation of citations) {
      const result = this.validateCitation(citation, documents)
      results.push(result)

      if (result.isValid) {
        if (result.confidence >= 0.7) {
          validCount++
          levelBreakdown[`level${result.validationLevel}` as keyof typeof levelBreakdown]++
        } else {
          suspiciousCount++
          warnings.push(
            `"${citation.fullCitation}" validated at Level ${result.validationLevel} with ${(result.confidence * 100).toFixed(0)}% confidence - ${result.reasoning}`
          )
        }
      } else {
        invalidCount++
        hallucinationResults.push(result)
      }
    }

    const validationRate = citations.length > 0 ? validCount / citations.length : 0

    const citationScore = Math.round(
      validationRate * 100 * 0.8 +
      (1 - (suspiciousCount / Math.max(citations.length, 1))) * 100 * 0.2
    )

    const summary = `Validated ${citations.length} citations: ${validCount} valid (${(validationRate * 100).toFixed(1)}%), ${suspiciousCount} suspicious, ${invalidCount} invalid. Citation Score: ${citationScore}/100`

    return {
      totalCitations: citations.length,
      validCitations: validCount,
      invalidCitations: invalidCount,
      suspiciousCitations: suspiciousCount,
      validationRate,
      citationScore,
      levelBreakdown,
      results,
      hallucinations: hallucinationResults,
      warnings,
      autoFixSuggestions: [],
      summary
    }
  }

  /**
   * Generate Validation Report
   */
  static generateValidationReport(report: ArticleValidationReport, language: 'de' | 'en' = 'de'): string {
    const isDE = language === 'de'

    const validationGrade =
      report.validationRate >= 0.9 ? (isDE ? 'Exzellent (A+)' : 'Excellent (A+)') :
      report.validationRate >= 0.8 ? (isDE ? 'Sehr gut (A)' : 'Very Good (A)') :
      report.validationRate >= 0.7 ? (isDE ? 'Gut (B)' : 'Good (B)') :
      report.validationRate >= 0.5 ? (isDE ? 'Befriedigend (C)' : 'Fair (C)') :
      report.validationRate >= 0.3 ? (isDE ? 'Mangelhaft (D)' : 'Poor (D)') :
      (isDE ? 'Ungenügend (F)' : 'Failed (F)')

    if (isDE) {
      return `# Zitat-Validierung ULTRA v2.0 Bericht

## Zusammenfassung
- **Gesamtzitate:** ${report.totalCitations}
- **Valide Zitate:** ${report.validCitations} (${(report.validationRate * 100).toFixed(1)}%)
- **Verdächtige Zitate:** ${report.suspiciousCitations}
- **Ungültige Zitate:** ${report.invalidCitations}
- **Bewertung:** ${validationGrade}

## 5-Level Validierung
- **Level 1 (Exaktes Zitat):** ${report.levelBreakdown.level1} Zitate
- **Level 2 (Autor-Jahr):** ${report.levelBreakdown.level2} Zitate
- **Level 3 (Dokumentname):** ${report.levelBreakdown.level3} Zitate
- **Level 4 (Themen-Match):** ${report.levelBreakdown.level4} Zitate
- **Level 5 (AI Plausibilität):** ${report.levelBreakdown.level5} Zitate

## Valide Zitate (${report.validCitations})
${report.results
  .filter(r => r.isValid && r.confidence >= 0.7)
  .map(r => `- **${r.citation.fullCitation}**
  - Level ${r.validationLevel} | Konfidenz: ${(r.confidence * 100).toFixed(0)}% | Gefunden in: ${r.foundIn || 'N/A'}`)
  .join('\n') || 'Keine'}

## Mögliche Halluzinationen (${report.invalidCitations})
${report.hallucinations.map(h => `- **${h.citation.fullCitation}**
  - Problem: ${h.issue}
  - Konfidenz: ${(h.confidence * 100).toFixed(0)}%`).join('\n') || 'Keine'}

## Empfehlung
${report.validationRate >= 0.8
  ? 'Exzellent! Zitate sind gut belegt. Multi-Level-Validierung bestanden.'
  : report.validationRate >= 0.6
  ? 'Gute Qualität. Verdächtige Einträge vor Veröffentlichung prüfen.'
  : 'Signifikante Probleme erkannt. Manuelle Überprüfung erforderlich.'}

---
*Generiert von Citation Validator ULTRA v2.0*`
    }

    return `# Citation Validation ULTRA v2.0 Report

## Summary
- **Total Citations:** ${report.totalCitations}
- **Valid Citations:** ${report.validCitations} (${(report.validationRate * 100).toFixed(1)}%)
- **Suspicious Citations:** ${report.suspiciousCitations}
- **Invalid Citations:** ${report.invalidCitations}
- **Validation Grade:** ${validationGrade}

## 5-Level Validation Breakdown
- **Level 1 (Exact Quote):** ${report.levelBreakdown.level1} citations
- **Level 2 (Author-Year):** ${report.levelBreakdown.level2} citations
- **Level 3 (Document Name):** ${report.levelBreakdown.level3} citations
- **Level 4 (Topic Match):** ${report.levelBreakdown.level4} citations
- **Level 5 (AI Plausibility):** ${report.levelBreakdown.level5} citations

## Valid Citations (${report.validCitations})
${report.results
  .filter(r => r.isValid && r.confidence >= 0.7)
  .map(r => `- **${r.citation.fullCitation}**
  - Level ${r.validationLevel} | Confidence: ${(r.confidence * 100).toFixed(0)}% | Found in: ${r.foundIn || 'N/A'}`)
  .join('\n') || 'None'}

## Possible Hallucinations (${report.invalidCitations})
${report.hallucinations.map(h => `- **${h.citation.fullCitation}**
  - Issue: ${h.issue}
  - Confidence: ${(h.confidence * 100).toFixed(0)}%`).join('\n') || 'None'}

## Recommendation
${report.validationRate >= 0.8
  ? 'Excellent! Citations are well-supported. Multi-level validation passed.'
  : report.validationRate >= 0.6
  ? 'Good quality. Review suspicious items before final publication.'
  : 'Significant issues detected. Manual review required before use.'}

---
*Generated by Citation Validator ULTRA v2.0*`
  }

  // Helper functions
  private static extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how'])

    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 4 && !stopWords.has(word))
      .slice(0, 10)
  }

  private static hasScientificLanguage(text: string): boolean {
    const scientificTerms = ['study', 'research', 'analysis', 'findings', 'results', 'data', 'evidence', 'significant', 'hypothesis', 'theory', 'method', 'participants', 'sample', 'correlation', 'factor', 'variable', 'statistical', 'studie', 'forschung', 'analyse', 'ergebnisse', 'daten', 'hypothese', 'theorie', 'methode']
    const lowerText = text.toLowerCase()
    return scientificTerms.some(term => lowerText.includes(term))
  }

  private static extractYearFromContent(content: string): number {
    const yearMatch = content.match(/\b(19|20)\d{2}\b/)
    return yearMatch ? parseInt(yearMatch[0]) : 0
  }

  private static isPlausibleAuthorName(author: string): boolean {
    const parts = author.split(/[,&]/)
    return parts.every(part => {
      const trimmed = part.trim()
      return trimmed.length >= 2 && /^[A-Za-zäöüÄÖÜß\s.]+$/.test(trimmed)
    })
  }
}

export default CitationValidatorUltra
