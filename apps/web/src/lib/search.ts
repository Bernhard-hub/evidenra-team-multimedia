/**
 * Full-text search and filter utilities
 */

import type { Document, Code, Coding } from '@/stores/projectStore'

export interface SearchResult {
  documentId: string
  documentName: string
  matches: SearchMatch[]
  totalMatches: number
}

export interface SearchMatch {
  text: string
  highlightedText: string
  offset: number
  codingId?: string
  codeId?: string
  codeName?: string
  codeColor?: string
}

export interface SearchFilters {
  query: string
  codeIds?: string[]
  documentTypes?: string[]
  dateFrom?: string
  dateTo?: string
  codingMethods?: string[]
  onlyWithMemos?: boolean
}

/**
 * Search documents for a query string
 */
export function searchDocuments(
  documents: Document[],
  codings: Coding[],
  codes: Code[],
  filters: SearchFilters
): SearchResult[] {
  const results: SearchResult[] = []
  const query = filters.query.toLowerCase().trim()

  for (const doc of documents) {
    // Apply document type filter
    if (filters.documentTypes?.length && !filters.documentTypes.includes(doc.fileType)) {
      continue
    }

    // Apply date filter
    if (filters.dateFrom && new Date(doc.createdAt) < new Date(filters.dateFrom)) {
      continue
    }
    if (filters.dateTo && new Date(doc.createdAt) > new Date(filters.dateTo)) {
      continue
    }

    const docCodings = codings.filter((c) => c.documentId === doc.id)

    // Apply code filter - document must have at least one coding with selected codes
    if (filters.codeIds?.length) {
      const hasMatchingCode = docCodings.some((c) => filters.codeIds!.includes(c.codeId))
      if (!hasMatchingCode) {
        continue
      }
    }

    // Apply coding method filter
    if (filters.codingMethods?.length) {
      const hasMatchingMethod = docCodings.some(
        (c) => c.codingMethod && filters.codingMethods!.includes(c.codingMethod)
      )
      if (!hasMatchingMethod) {
        continue
      }
    }

    // Apply memo filter
    if (filters.onlyWithMemos) {
      const hasMemos = docCodings.some((c) => c.memo && c.memo.trim().length > 0)
      if (!hasMemos) {
        continue
      }
    }

    const matches: SearchMatch[] = []

    // Search in document content
    if (query && doc.content) {
      const content = doc.content.toLowerCase()
      let searchPos = 0

      while (searchPos < content.length) {
        const matchIndex = content.indexOf(query, searchPos)
        if (matchIndex === -1) break

        // Get surrounding context (50 chars before and after)
        const contextStart = Math.max(0, matchIndex - 50)
        const contextEnd = Math.min(doc.content.length, matchIndex + query.length + 50)
        const text = doc.content.slice(contextStart, contextEnd)
        const highlightedText = highlightMatch(text, query, matchIndex - contextStart)

        // Check if this match is within a coding
        const matchEnd = matchIndex + query.length
        const matchingCoding = docCodings.find(
          (c) => matchIndex >= c.startOffset && matchEnd <= c.endOffset
        )

        let matchInfo: SearchMatch = {
          text,
          highlightedText,
          offset: matchIndex,
        }

        if (matchingCoding) {
          const code = codes.find((c) => c.id === matchingCoding.codeId)
          matchInfo = {
            ...matchInfo,
            codingId: matchingCoding.id,
            codeId: matchingCoding.codeId,
            codeName: code?.name,
            codeColor: code?.color,
          }
        }

        matches.push(matchInfo)
        searchPos = matchIndex + query.length
      }
    }

    // If no query, include document if it passes filters
    if (!query || matches.length > 0) {
      results.push({
        documentId: doc.id,
        documentName: doc.name,
        matches,
        totalMatches: matches.length,
      })
    }
  }

  // Sort by number of matches (descending)
  results.sort((a, b) => b.totalMatches - a.totalMatches)

  return results
}

/**
 * Search within codings/quotes
 */
export function searchCodings(
  codings: Coding[],
  codes: Code[],
  documents: Document[],
  filters: SearchFilters
): Coding[] {
  const query = filters.query.toLowerCase().trim()

  return codings.filter((coding) => {
    // Apply code filter
    if (filters.codeIds?.length && !filters.codeIds.includes(coding.codeId)) {
      return false
    }

    // Apply coding method filter
    if (filters.codingMethods?.length) {
      if (!coding.codingMethod || !filters.codingMethods.includes(coding.codingMethod)) {
        return false
      }
    }

    // Apply memo filter
    if (filters.onlyWithMemos) {
      if (!coding.memo || !coding.memo.trim()) {
        return false
      }
    }

    // Apply date filter
    if (filters.dateFrom && new Date(coding.createdAt) < new Date(filters.dateFrom)) {
      return false
    }
    if (filters.dateTo && new Date(coding.createdAt) > new Date(filters.dateTo)) {
      return false
    }

    // Apply document type filter
    if (filters.documentTypes?.length) {
      const doc = documents.find((d) => d.id === coding.documentId)
      if (!doc || !filters.documentTypes.includes(doc.fileType)) {
        return false
      }
    }

    // Apply text search
    if (query) {
      const matchesText = coding.selectedText.toLowerCase().includes(query)
      const matchesMemo = coding.memo?.toLowerCase().includes(query)
      if (!matchesText && !matchesMemo) {
        return false
      }
    }

    return true
  })
}

/**
 * Highlight search match in text
 */
function highlightMatch(text: string, query: string, startIndex: number): string {
  const before = text.slice(0, startIndex)
  const match = text.slice(startIndex, startIndex + query.length)
  const after = text.slice(startIndex + query.length)

  return `${before}<mark>${match}</mark>${after}`
}

/**
 * Generate search suggestions based on existing data
 */
export function getSearchSuggestions(
  documents: Document[],
  codes: Code[],
  codings: Coding[]
): string[] {
  const suggestions = new Set<string>()

  // Add code names
  codes.forEach((code) => {
    suggestions.add(code.name)
  })

  // Add document names
  documents.forEach((doc) => {
    suggestions.add(doc.name)
  })

  // Add common words from codings (limited)
  const wordCounts = new Map<string, number>()
  codings.slice(0, 100).forEach((coding) => {
    const words = coding.selectedText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)
    words.forEach((word) => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
    })
  })

  // Add top frequent words
  Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([word]) => suggestions.add(word))

  return Array.from(suggestions).slice(0, 50)
}

/**
 * Get available filter options based on data
 */
export function getFilterOptions(
  documents: Document[],
  codes: Code[],
  codings: Coding[]
): {
  documentTypes: string[]
  codingMethods: string[]
  dateRange: { min: string; max: string }
} {
  const documentTypes = [...new Set(documents.map((d) => d.fileType))]
  const codingMethods = [...new Set(codings.map((c) => c.codingMethod).filter(Boolean))] as string[]

  const dates = [
    ...documents.map((d) => d.createdAt),
    ...codings.map((c) => c.createdAt),
  ].sort()

  return {
    documentTypes,
    codingMethods,
    dateRange: {
      min: dates[0] || new Date().toISOString(),
      max: dates[dates.length - 1] || new Date().toISOString(),
    },
  }
}
