import type { CoderRatings, Coding } from '../types'

export interface FleissKappaResult {
  kappa: number
  observedAgreement: number
  expectedAgreement: number
  categoryCount: number
  unitCount: number
  categoryKappas: Map<string, number>
}

/**
 * Fleiss' Kappa for measuring inter-rater reliability among 3+ coders
 *
 * κ = (P̄ - P̄e) / (1 - P̄e)
 *
 * Where:
 * - P̄ = mean observed agreement
 * - P̄e = mean expected agreement by chance
 *
 * Handles multiple raters assigning subjects to categories.
 */
export class FleissKappa {
  calculate(ratings: CoderRatings[]): FleissKappaResult {
    const n = ratings.length // Number of raters

    // Get all unique units and categories
    const units = this.getUnits(ratings)
    const categories = this.getCategories(ratings)
    const categoryIndex = new Map<string, number>()
    categories.forEach((cat, idx) => categoryIndex.set(cat, idx))

    const N = units.length // Number of subjects/units
    const k = categories.length // Number of categories

    if (N === 0) {
      return {
        kappa: 1,
        observedAgreement: 1,
        expectedAgreement: 1,
        categoryCount: k,
        unitCount: 0,
        categoryKappas: new Map(),
      }
    }

    // Build the rating matrix: N x k
    // Each cell contains the number of raters who assigned that unit to that category
    const ratingMatrix = this.buildRatingMatrix(ratings, units, categoryIndex, k)

    // Calculate P_i (agreement for each subject)
    const P_i: number[] = []
    for (let i = 0; i < N; i++) {
      let sum = 0
      for (let j = 0; j < k; j++) {
        sum += ratingMatrix[i][j] * (ratingMatrix[i][j] - 1)
      }
      P_i.push(sum / (n * (n - 1)))
    }

    // Calculate P̄ (mean observed agreement)
    const P_bar = P_i.reduce((a, b) => a + b, 0) / N

    // Calculate p_j (proportion of assignments to each category)
    const p_j: number[] = []
    for (let j = 0; j < k; j++) {
      let sum = 0
      for (let i = 0; i < N; i++) {
        sum += ratingMatrix[i][j]
      }
      p_j.push(sum / (N * n))
    }

    // Calculate P̄e (expected agreement by chance)
    const P_e_bar = p_j.reduce((sum, p) => sum + p * p, 0)

    // Calculate kappa
    const kappa = P_e_bar === 1 ? 1 : (P_bar - P_e_bar) / (1 - P_e_bar)

    // Calculate category-specific kappas
    const categoryKappas = new Map<string, number>()
    categories.forEach((cat, j) => {
      const p = p_j[j]
      const q = 1 - p
      if (p === 0 || p === 1) {
        categoryKappas.set(cat, 1)
      } else {
        let P_j = 0
        for (let i = 0; i < N; i++) {
          P_j += ratingMatrix[i][j] * (n - ratingMatrix[i][j])
        }
        P_j = 1 - P_j / (N * n * (n - 1) * p * q)
        categoryKappas.set(cat, P_j)
      }
    })

    return {
      kappa,
      observedAgreement: P_bar,
      expectedAgreement: P_e_bar,
      categoryCount: k,
      unitCount: N,
      categoryKappas,
    }
  }

  private getUnits(ratings: CoderRatings[]): CodingUnit[] {
    const unitMap = new Map<string, CodingUnit>()

    for (const rater of ratings) {
      for (const coding of rater.codings) {
        const key = `${coding.documentId}-${coding.startOffset}-${coding.endOffset}`
        if (!unitMap.has(key)) {
          unitMap.set(key, {
            key,
            documentId: coding.documentId,
            startOffset: coding.startOffset,
            endOffset: coding.endOffset,
          })
        }
      }
    }

    return Array.from(unitMap.values())
  }

  private getCategories(ratings: CoderRatings[]): string[] {
    const categories = new Set<string>()

    for (const rater of ratings) {
      for (const coding of rater.codings) {
        categories.add(coding.codeId || coding.codeName)
      }
    }

    return Array.from(categories).sort()
  }

  private buildRatingMatrix(
    ratings: CoderRatings[],
    units: CodingUnit[],
    categoryIndex: Map<string, number>,
    k: number
  ): number[][] {
    const matrix: number[][] = units.map(() => Array(k).fill(0))

    for (const rater of ratings) {
      for (const coding of rater.codings) {
        const unitKey = `${coding.documentId}-${coding.startOffset}-${coding.endOffset}`
        const unitIdx = units.findIndex(u => u.key === unitKey)

        if (unitIdx >= 0) {
          const catIdx = categoryIndex.get(coding.codeId || coding.codeName)
          if (catIdx !== undefined) {
            matrix[unitIdx][catIdx]++
          }
        }
      }
    }

    return matrix
  }
}

interface CodingUnit {
  key: string
  documentId: string
  startOffset: number
  endOffset: number
}
