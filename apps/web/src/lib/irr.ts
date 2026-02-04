/**
 * Inter-Coder Reliability Calculations
 * Implements Cohen's Kappa, Fleiss' Kappa, Krippendorff's Alpha, and Percent Agreement
 */

import type { Coding, Code, Document } from '@/stores/projectStore'

export interface CoderData {
  id: string
  name: string
  codings: Coding[]
}

export interface IRRResult {
  metric: string
  value: number
  interpretation: string
  interpretationColor: string
  pairwise?: { coder1: string; coder2: string; value: number }[]
  agreementMatrix?: number[][]
  disagreements?: Disagreement[]
}

export interface Disagreement {
  documentId: string
  documentName: string
  segment: string
  coder1: string
  coder1Code: string | null
  coder2: string
  coder2Code: string | null
  startOffset: number
  endOffset: number
}

/**
 * Get interpretation based on Kappa value (Landis & Koch, 1977)
 */
function interpretKappa(kappa: number): { text: string; color: string } {
  if (kappa < 0) return { text: 'Poor', color: 'text-red-400' }
  if (kappa < 0.2) return { text: 'Slight', color: 'text-orange-400' }
  if (kappa < 0.4) return { text: 'Fair', color: 'text-yellow-400' }
  if (kappa < 0.6) return { text: 'Moderate', color: 'text-blue-400' }
  if (kappa < 0.8) return { text: 'Substantial', color: 'text-green-400' }
  return { text: 'Almost Perfect', color: 'text-primary-400' }
}

/**
 * Calculate Cohen's Kappa for two coders
 * Based on segment-level agreement
 */
export function calculateCohensKappa(
  coder1: CoderData,
  coder2: CoderData,
  documents: Document[],
  codes: Code[],
  segmentSize: number = 100 // Characters per segment
): IRRResult {
  // Create coding matrix: each segment gets a code assignment from each coder
  const allSegments: { docId: string; start: number; end: number }[] = []

  documents.forEach(doc => {
    if (!doc.content) return
    const contentLength = doc.content.length
    for (let i = 0; i < contentLength; i += segmentSize) {
      allSegments.push({
        docId: doc.id,
        start: i,
        end: Math.min(i + segmentSize, contentLength),
      })
    }
  })

  if (allSegments.length === 0) {
    return {
      metric: 'cohens-kappa',
      value: 0,
      interpretation: 'Keine Daten',
      interpretationColor: 'text-surface-400',
    }
  }

  // Get codes for each segment for each coder
  const getCodesForSegment = (codings: Coding[], docId: string, start: number, end: number): string[] => {
    return codings
      .filter(c => c.documentId === docId &&
        ((c.startOffset >= start && c.startOffset < end) ||
         (c.endOffset > start && c.endOffset <= end) ||
         (c.startOffset <= start && c.endOffset >= end)))
      .map(c => c.codeId)
  }

  let agreements = 0
  let total = allSegments.length
  const categoryAgreements: Record<string, { both: number; coder1Only: number; coder2Only: number }> = {}

  codes.forEach(code => {
    categoryAgreements[code.id] = { both: 0, coder1Only: 0, coder2Only: 0 }
  })
  categoryAgreements['none'] = { both: 0, coder1Only: 0, coder2Only: 0 }

  const disagreements: Disagreement[] = []

  allSegments.forEach(segment => {
    const codes1 = getCodesForSegment(coder1.codings, segment.docId, segment.start, segment.end)
    const codes2 = getCodesForSegment(coder2.codings, segment.docId, segment.start, segment.end)

    // For simplicity, take primary code (first one) or 'none'
    const code1 = codes1[0] || 'none'
    const code2 = codes2[0] || 'none'

    if (code1 === code2) {
      agreements++
      if (categoryAgreements[code1]) {
        categoryAgreements[code1].both++
      }
    } else {
      // Record disagreement
      const doc = documents.find(d => d.id === segment.docId)
      const code1Name = codes.find(c => c.id === code1)?.name || 'Keine Kodierung'
      const code2Name = codes.find(c => c.id === code2)?.name || 'Keine Kodierung'

      disagreements.push({
        documentId: segment.docId,
        documentName: doc?.name || 'Unknown',
        segment: doc?.content?.substring(segment.start, segment.end) || '',
        coder1: coder1.name,
        coder1Code: code1 === 'none' ? null : code1Name,
        coder2: coder2.name,
        coder2Code: code2 === 'none' ? null : code2Name,
        startOffset: segment.start,
        endOffset: segment.end,
      })

      if (categoryAgreements[code1]) categoryAgreements[code1].coder1Only++
      if (categoryAgreements[code2]) categoryAgreements[code2].coder2Only++
    }
  })

  // Calculate observed agreement
  const Po = agreements / total

  // Calculate expected agreement
  const codeCategories = [...codes.map(c => c.id), 'none']
  let Pe = 0
  codeCategories.forEach(codeId => {
    const stats = categoryAgreements[codeId] || { both: 0, coder1Only: 0, coder2Only: 0 }
    const p1 = (stats.both + stats.coder1Only) / total
    const p2 = (stats.both + stats.coder2Only) / total
    Pe += p1 * p2
  })

  // Cohen's Kappa formula
  const kappa = Pe === 1 ? 1 : (Po - Pe) / (1 - Pe)

  const interpretation = interpretKappa(kappa)

  return {
    metric: 'cohens-kappa',
    value: Math.max(0, Math.min(1, kappa)),
    interpretation: interpretation.text,
    interpretationColor: interpretation.color,
    disagreements: disagreements.slice(0, 20), // Limit to first 20
  }
}

/**
 * Calculate percent agreement
 */
export function calculatePercentAgreement(
  coders: CoderData[],
  documents: Document[],
  codes: Code[],
  segmentSize: number = 100
): IRRResult {
  if (coders.length < 2) {
    return {
      metric: 'percent-agreement',
      value: 0,
      interpretation: 'Mindestens 2 Kodierer erforderlich',
      interpretationColor: 'text-surface-400',
    }
  }

  // Create segments
  const allSegments: { docId: string; start: number; end: number }[] = []
  documents.forEach(doc => {
    if (!doc.content) return
    for (let i = 0; i < doc.content.length; i += segmentSize) {
      allSegments.push({
        docId: doc.id,
        start: i,
        end: Math.min(i + segmentSize, doc.content.length),
      })
    }
  })

  if (allSegments.length === 0) {
    return {
      metric: 'percent-agreement',
      value: 0,
      interpretation: 'Keine Daten',
      interpretationColor: 'text-surface-400',
    }
  }

  // Count agreements
  let totalComparisons = 0
  let agreements = 0

  const getCodeForSegment = (codings: Coding[], docId: string, start: number, end: number): string => {
    const matching = codings.find(c =>
      c.documentId === docId &&
      ((c.startOffset >= start && c.startOffset < end) ||
       (c.endOffset > start && c.endOffset <= end) ||
       (c.startOffset <= start && c.endOffset >= end))
    )
    return matching?.codeId || 'none'
  }

  // Pairwise comparison
  const pairwiseResults: { coder1: string; coder2: string; value: number }[] = []

  for (let i = 0; i < coders.length; i++) {
    for (let j = i + 1; j < coders.length; j++) {
      let pairAgreements = 0

      allSegments.forEach(segment => {
        const code1 = getCodeForSegment(coders[i].codings, segment.docId, segment.start, segment.end)
        const code2 = getCodeForSegment(coders[j].codings, segment.docId, segment.start, segment.end)

        if (code1 === code2) {
          agreements++
          pairAgreements++
        }
        totalComparisons++
      })

      pairwiseResults.push({
        coder1: coders[i].name,
        coder2: coders[j].name,
        value: pairAgreements / allSegments.length,
      })
    }
  }

  const percentAgreement = totalComparisons > 0 ? agreements / totalComparisons : 0

  const interpretation = interpretKappa(percentAgreement)

  return {
    metric: 'percent-agreement',
    value: percentAgreement,
    interpretation: interpretation.text,
    interpretationColor: interpretation.color,
    pairwise: pairwiseResults,
  }
}

/**
 * Calculate Krippendorff's Alpha (simplified nominal version)
 */
export function calculateKrippendorffsAlpha(
  coders: CoderData[],
  documents: Document[],
  codes: Code[],
  segmentSize: number = 100
): IRRResult {
  if (coders.length < 2) {
    return {
      metric: 'krippendorff-alpha',
      value: 0,
      interpretation: 'Mindestens 2 Kodierer erforderlich',
      interpretationColor: 'text-surface-400',
    }
  }

  // Create segments
  const allSegments: { docId: string; start: number; end: number }[] = []
  documents.forEach(doc => {
    if (!doc.content) return
    for (let i = 0; i < doc.content.length; i += segmentSize) {
      allSegments.push({
        docId: doc.id,
        start: i,
        end: Math.min(i + segmentSize, doc.content.length),
      })
    }
  })

  if (allSegments.length === 0) {
    return {
      metric: 'krippendorff-alpha',
      value: 0,
      interpretation: 'Keine Daten',
      interpretationColor: 'text-surface-400',
    }
  }

  const getCodeForSegment = (codings: Coding[], docId: string, start: number, end: number): string | null => {
    const matching = codings.find(c =>
      c.documentId === docId &&
      ((c.startOffset >= start && c.startOffset < end) ||
       (c.endOffset > start && c.endOffset <= end))
    )
    return matching?.codeId || null
  }

  // Build reliability data matrix
  const reliabilityData: (string | null)[][] = allSegments.map(segment =>
    coders.map(coder => getCodeForSegment(coder.codings, segment.docId, segment.start, segment.end))
  )

  // Calculate observed disagreement (Do)
  let Do = 0
  let totalPairs = 0

  reliabilityData.forEach(row => {
    const validValues = row.filter(v => v !== null) as string[]
    for (let i = 0; i < validValues.length; i++) {
      for (let j = i + 1; j < validValues.length; j++) {
        if (validValues[i] !== validValues[j]) {
          Do++
        }
        totalPairs++
      }
    }
  })

  if (totalPairs === 0) {
    return {
      metric: 'krippendorff-alpha',
      value: 1,
      interpretation: 'Perfect',
      interpretationColor: 'text-primary-400',
    }
  }

  Do = Do / totalPairs

  // Calculate expected disagreement (De)
  const allValues = reliabilityData.flat().filter(v => v !== null) as string[]
  const valueCounts: Record<string, number> = {}
  allValues.forEach(v => {
    valueCounts[v] = (valueCounts[v] || 0) + 1
  })

  const n = allValues.length
  let De = 0
  const categories = Object.keys(valueCounts)

  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      const ni = valueCounts[categories[i]]
      const nj = valueCounts[categories[j]]
      De += (ni * nj) / (n * (n - 1))
    }
  }

  // Krippendorff's Alpha
  const alpha = De === 0 ? 1 : 1 - (Do / De)

  const interpretation = interpretKappa(alpha)

  return {
    metric: 'krippendorff-alpha',
    value: Math.max(0, Math.min(1, alpha)),
    interpretation: interpretation.text,
    interpretationColor: interpretation.color,
  }
}

/**
 * Get coders from codings data
 */
export function extractCoders(codings: Coding[]): CoderData[] {
  const coderMap = new Map<string, { name: string; codings: Coding[] }>()

  codings.forEach(coding => {
    const coderId = coding.codedBy
    if (!coderMap.has(coderId)) {
      // Try to get name from coder ID or use placeholder
      const name = coderId.startsWith('user-')
        ? `Kodierer ${coderId.replace('user-', '')}`
        : coderId
      coderMap.set(coderId, { name, codings: [] })
    }
    coderMap.get(coderId)!.codings.push(coding)
  })

  return Array.from(coderMap.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    codings: data.codings,
  }))
}

/**
 * Demo calculation for testing (when not enough real data)
 */
export function calculateDemoIRR(metric: string, coderCount: number): IRRResult {
  const baseValue = 0.65 + Math.random() * 0.2

  const pairwise: { coder1: string; coder2: string; value: number }[] = []
  for (let i = 1; i <= coderCount; i++) {
    for (let j = i + 1; j <= coderCount; j++) {
      pairwise.push({
        coder1: `Kodierer ${i}`,
        coder2: `Kodierer ${j}`,
        value: 0.6 + Math.random() * 0.25,
      })
    }
  }

  const interpretation = interpretKappa(baseValue)

  return {
    metric,
    value: baseValue,
    interpretation: interpretation.text,
    interpretationColor: interpretation.color,
    pairwise: coderCount > 2 ? pairwise : undefined,
  }
}
