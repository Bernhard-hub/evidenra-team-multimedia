import type { CoderRatings, Coding } from '../types'

export interface KrippendorffAlphaResult {
  alpha: number
  categoryCount: number
  unitCount: number
  observedDisagreement: number
  expectedDisagreement: number
}

/**
 * Krippendorff's Alpha for inter-rater reliability
 *
 * α = 1 - Do/De
 *
 * Where:
 * - Do = observed disagreement
 * - De = expected disagreement
 *
 * Advantages:
 * - Works with any number of raters
 * - Handles missing data
 * - Works with nominal, ordinal, interval, and ratio data
 * - More robust than other measures
 */
export class KrippendorffAlpha {
  calculate(
    ratings: CoderRatings[],
    level: 'nominal' | 'ordinal' | 'interval' | 'ratio' = 'nominal'
  ): KrippendorffAlphaResult {
    // Build reliability data matrix
    const { units, categories, matrix } = this.buildDataMatrix(ratings)

    const N = units.length
    const k = categories.length

    if (N === 0) {
      return {
        alpha: 1,
        categoryCount: k,
        unitCount: 0,
        observedDisagreement: 0,
        expectedDisagreement: 0,
      }
    }

    // Calculate observed disagreement
    const Do = this.calculateObservedDisagreement(matrix, categories, level)

    // Calculate expected disagreement
    const De = this.calculateExpectedDisagreement(matrix, categories, level)

    // Calculate alpha
    const alpha = De === 0 ? 1 : 1 - Do / De

    return {
      alpha,
      categoryCount: k,
      unitCount: N,
      observedDisagreement: Do,
      expectedDisagreement: De,
    }
  }

  private buildDataMatrix(ratings: CoderRatings[]): {
    units: string[]
    categories: string[]
    matrix: (string | null)[][]
  } {
    // Get all units
    const unitSet = new Set<string>()
    const categorySet = new Set<string>()

    for (const rater of ratings) {
      for (const coding of rater.codings) {
        const unitKey = `${coding.documentId}-${coding.startOffset}-${coding.endOffset}`
        unitSet.add(unitKey)
        categorySet.add(coding.codeId || coding.codeName)
      }
    }

    const units = Array.from(unitSet)
    const categories = Array.from(categorySet)

    // Build matrix: units x raters
    const matrix: (string | null)[][] = units.map(() =>
      Array(ratings.length).fill(null)
    )

    for (let r = 0; r < ratings.length; r++) {
      for (const coding of ratings[r].codings) {
        const unitKey = `${coding.documentId}-${coding.startOffset}-${coding.endOffset}`
        const unitIdx = units.indexOf(unitKey)
        if (unitIdx >= 0) {
          matrix[unitIdx][r] = coding.codeId || coding.codeName
        }
      }
    }

    return { units, categories, matrix }
  }

  private calculateObservedDisagreement(
    matrix: (string | null)[][],
    categories: string[],
    level: string
  ): number {
    const n = matrix.length // Number of units
    let totalDisagreement = 0
    let totalPairs = 0

    for (let u = 0; u < n; u++) {
      const values = matrix[u].filter((v): v is string => v !== null)
      const m_u = values.length // Number of raters for this unit

      if (m_u < 2) continue

      // Compare all pairs within unit
      for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
          const disagreement = this.getDisagreement(
            values[i],
            values[j],
            categories,
            level
          )
          totalDisagreement += disagreement
          totalPairs++
        }
      }
    }

    return totalPairs > 0 ? totalDisagreement / totalPairs : 0
  }

  private calculateExpectedDisagreement(
    matrix: (string | null)[][],
    categories: string[],
    level: string
  ): number {
    // Count frequency of each category across all ratings
    const frequency = new Map<string, number>()
    let total = 0

    for (const row of matrix) {
      for (const value of row) {
        if (value !== null) {
          frequency.set(value, (frequency.get(value) || 0) + 1)
          total++
        }
      }
    }

    if (total < 2) return 0

    // Expected disagreement based on marginal frequencies
    let expectedDisagreement = 0
    const cats = Array.from(frequency.keys())

    for (let i = 0; i < cats.length; i++) {
      for (let j = i + 1; j < cats.length; j++) {
        const f_i = frequency.get(cats[i]) || 0
        const f_j = frequency.get(cats[j]) || 0
        const disagreement = this.getDisagreement(cats[i], cats[j], categories, level)

        expectedDisagreement += (f_i * f_j * disagreement) / (total * (total - 1) / 2)
      }
    }

    return expectedDisagreement
  }

  private getDisagreement(
    c1: string,
    c2: string,
    categories: string[],
    level: string
  ): number {
    if (c1 === c2) return 0

    switch (level) {
      case 'nominal':
        // Binary: different = 1, same = 0
        return 1

      case 'ordinal': {
        // Distance based on rank
        const idx1 = categories.indexOf(c1)
        const idx2 = categories.indexOf(c2)
        // Sum of ranks between the two values
        const low = Math.min(idx1, idx2)
        const high = Math.max(idx1, idx2)
        let sum = 0
        for (let i = low; i <= high; i++) {
          sum += 1 // Each rank counts
        }
        return sum * sum - 1
      }

      case 'interval':
      case 'ratio': {
        // Squared difference (assumes categories are numeric)
        const v1 = parseFloat(c1) || categories.indexOf(c1)
        const v2 = parseFloat(c2) || categories.indexOf(c2)
        return (v1 - v2) * (v1 - v2)
      }

      default:
        return 1
    }
  }
}
