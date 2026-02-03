import type { CoderRatings, Coding } from '../types'

export interface CohensKappaResult {
  kappa: number
  observedAgreement: number
  expectedAgreement: number
  categoryCount: number
  unitCount: number
  confusionMatrix: number[][]
}

/**
 * Cohen's Kappa for measuring inter-rater reliability between 2 coders
 *
 * κ = (Po - Pe) / (1 - Pe)
 *
 * Where:
 * - Po = observed agreement (proportion of units where raters agree)
 * - Pe = expected agreement by chance
 */
export class CohensKappa {
  calculate(
    rater1: CoderRatings,
    rater2: CoderRatings,
    weighted: boolean = false
  ): CohensKappaResult {
    // Get all unique coding units (text segments)
    const units = this.getUnits(rater1.codings, rater2.codings)

    // Get all categories (codes)
    const categories = this.getCategories(rater1.codings, rater2.codings)
    const categoryIndex = new Map<string, number>()
    categories.forEach((cat, idx) => categoryIndex.set(cat, idx))

    // Build confusion matrix
    const matrix = this.buildConfusionMatrix(
      rater1.codings,
      rater2.codings,
      units,
      categoryIndex,
      categories.length
    )

    // Calculate agreement
    const n = units.length
    if (n === 0) {
      return {
        kappa: 1,
        observedAgreement: 1,
        expectedAgreement: 1,
        categoryCount: categories.length,
        unitCount: 0,
        confusionMatrix: matrix,
      }
    }

    const { observedAgreement, expectedAgreement } = weighted
      ? this.calculateWeightedAgreement(matrix, n)
      : this.calculateUnweightedAgreement(matrix, n)

    // Calculate kappa
    const kappa = expectedAgreement === 1
      ? 1
      : (observedAgreement - expectedAgreement) / (1 - expectedAgreement)

    return {
      kappa,
      observedAgreement,
      expectedAgreement,
      categoryCount: categories.length,
      unitCount: n,
      confusionMatrix: matrix,
    }
  }

  private getUnits(codings1: Coding[], codings2: Coding[]): CodingUnit[] {
    const unitMap = new Map<string, CodingUnit>()

    for (const coding of [...codings1, ...codings2]) {
      const key = `${coding.documentId}-${coding.startOffset}-${coding.endOffset}`
      if (!unitMap.has(key)) {
        unitMap.set(key, {
          documentId: coding.documentId,
          startOffset: coding.startOffset,
          endOffset: coding.endOffset,
          text: coding.selectedText,
        })
      }
    }

    return Array.from(unitMap.values())
  }

  private getCategories(codings1: Coding[], codings2: Coding[]): string[] {
    const categories = new Set<string>()

    for (const coding of [...codings1, ...codings2]) {
      categories.add(coding.codeId || coding.codeName)
    }

    // Add "no code" category for units where only one rater coded
    categories.add('__NO_CODE__')

    return Array.from(categories).sort()
  }

  private buildConfusionMatrix(
    codings1: Coding[],
    codings2: Coding[],
    units: CodingUnit[],
    categoryIndex: Map<string, number>,
    numCategories: number
  ): number[][] {
    const matrix: number[][] = Array(numCategories)
      .fill(null)
      .map(() => Array(numCategories).fill(0))

    for (const unit of units) {
      const code1 = this.findCodeForUnit(codings1, unit) || '__NO_CODE__'
      const code2 = this.findCodeForUnit(codings2, unit) || '__NO_CODE__'

      const idx1 = categoryIndex.get(code1) ?? categoryIndex.get('__NO_CODE__')!
      const idx2 = categoryIndex.get(code2) ?? categoryIndex.get('__NO_CODE__')!

      matrix[idx1][idx2]++
    }

    return matrix
  }

  private findCodeForUnit(codings: Coding[], unit: CodingUnit): string | null {
    const coding = codings.find(
      c =>
        c.documentId === unit.documentId &&
        c.startOffset <= unit.startOffset &&
        c.endOffset >= unit.endOffset
    )
    return coding ? (coding.codeId || coding.codeName) : null
  }

  private calculateUnweightedAgreement(
    matrix: number[][],
    n: number
  ): { observedAgreement: number; expectedAgreement: number } {
    // Observed agreement: diagonal sum / total
    let diagonal = 0
    for (let i = 0; i < matrix.length; i++) {
      diagonal += matrix[i][i]
    }
    const observedAgreement = diagonal / n

    // Expected agreement: sum of (row marginal * col marginal) / n^2
    const rowMarginals = matrix.map(row => row.reduce((a, b) => a + b, 0))
    const colMarginals = matrix[0].map((_, colIdx) =>
      matrix.reduce((sum, row) => sum + row[colIdx], 0)
    )

    let expectedAgreement = 0
    for (let i = 0; i < matrix.length; i++) {
      expectedAgreement += (rowMarginals[i] * colMarginals[i]) / (n * n)
    }

    return { observedAgreement, expectedAgreement }
  }

  private calculateWeightedAgreement(
    matrix: number[][],
    n: number
  ): { observedAgreement: number; expectedAgreement: number } {
    // Linear weights for ordered categories
    const k = matrix.length

    let observedWeighted = 0
    let expectedWeighted = 0

    const rowMarginals = matrix.map(row => row.reduce((a, b) => a + b, 0))
    const colMarginals = matrix[0].map((_, colIdx) =>
      matrix.reduce((sum, row) => sum + row[colIdx], 0)
    )

    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        const weight = 1 - Math.abs(i - j) / (k - 1)
        observedWeighted += weight * matrix[i][j]
        expectedWeighted += weight * (rowMarginals[i] * colMarginals[j]) / n
      }
    }

    return {
      observedAgreement: observedWeighted / n,
      expectedAgreement: expectedWeighted / n,
    }
  }
}

interface CodingUnit {
  documentId: string
  startOffset: number
  endOffset: number
  text: string
}
