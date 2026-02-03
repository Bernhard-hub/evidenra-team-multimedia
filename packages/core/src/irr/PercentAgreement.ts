import type { CoderRatings, Coding } from '../types'

export interface PercentAgreementResult {
  agreement: number
  categoryCount: number
  unitCount: number
  agreementByCategory: Map<string, number>
  pairwiseAgreements: Map<string, number>
}

/**
 * Simple Percent Agreement calculation
 *
 * Agreement = (Number of agreements) / (Total number of decisions)
 *
 * While simpler than Kappa measures, percent agreement:
 * - Is easy to interpret
 * - Provides a baseline measure
 * - Useful for quick checks during coding
 *
 * Limitation: Does not account for chance agreement.
 */
export class PercentAgreement {
  calculate(ratings: CoderRatings[]): PercentAgreementResult {
    // Get all units and categories
    const units = this.getUnits(ratings)
    const categories = this.getCategories(ratings)

    const N = units.length
    const k = categories.length

    if (N === 0) {
      return {
        agreement: 1,
        categoryCount: k,
        unitCount: 0,
        agreementByCategory: new Map(),
        pairwiseAgreements: new Map(),
      }
    }

    // Calculate overall agreement
    let totalAgreements = 0
    let totalComparisons = 0

    for (const unit of units) {
      const codesForUnit = this.getCodesForUnit(ratings, unit)
      const uniqueCodes = new Set(codesForUnit)

      if (codesForUnit.length > 1) {
        // Check if all raters who coded this unit agree
        if (uniqueCodes.size === 1) {
          totalAgreements++
        }
        totalComparisons++
      }
    }

    const agreement = totalComparisons > 0 ? totalAgreements / totalComparisons : 1

    // Calculate agreement by category
    const agreementByCategory = this.calculateCategoryAgreement(ratings, units, categories)

    // Calculate pairwise agreements between raters
    const pairwiseAgreements = this.calculatePairwiseAgreements(ratings, units)

    return {
      agreement,
      categoryCount: k,
      unitCount: N,
      agreementByCategory,
      pairwiseAgreements,
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

    return Array.from(categories)
  }

  private getCodesForUnit(ratings: CoderRatings[], unit: CodingUnit): string[] {
    const codes: string[] = []

    for (const rater of ratings) {
      const coding = rater.codings.find(
        c =>
          c.documentId === unit.documentId &&
          c.startOffset === unit.startOffset &&
          c.endOffset === unit.endOffset
      )

      if (coding) {
        codes.push(coding.codeId || coding.codeName)
      }
    }

    return codes
  }

  private calculateCategoryAgreement(
    ratings: CoderRatings[],
    units: CodingUnit[],
    categories: string[]
  ): Map<string, number> {
    const agreementByCategory = new Map<string, number>()

    for (const category of categories) {
      let agreements = 0
      let total = 0

      for (const unit of units) {
        const codes = this.getCodesForUnit(ratings, unit)
        const hasCategory = codes.filter(c => c === category)

        if (hasCategory.length > 0) {
          total++
          // All raters who coded this unit assigned this category
          if (hasCategory.length === codes.length && codes.length > 1) {
            agreements++
          }
        }
      }

      agreementByCategory.set(category, total > 0 ? agreements / total : 0)
    }

    return agreementByCategory
  }

  private calculatePairwiseAgreements(
    ratings: CoderRatings[],
    units: CodingUnit[]
  ): Map<string, number> {
    const pairwise = new Map<string, number>()

    for (let i = 0; i < ratings.length; i++) {
      for (let j = i + 1; j < ratings.length; j++) {
        const rater1 = ratings[i]
        const rater2 = ratings[j]
        const key = `${rater1.coderId}-${rater2.coderId}`

        let agreements = 0
        let comparisons = 0

        for (const unit of units) {
          const code1 = this.getCodeForUnit(rater1, unit)
          const code2 = this.getCodeForUnit(rater2, unit)

          if (code1 !== null && code2 !== null) {
            comparisons++
            if (code1 === code2) {
              agreements++
            }
          }
        }

        pairwise.set(key, comparisons > 0 ? agreements / comparisons : 0)
      }
    }

    return pairwise
  }

  private getCodeForUnit(rater: CoderRatings, unit: CodingUnit): string | null {
    const coding = rater.codings.find(
      c =>
        c.documentId === unit.documentId &&
        c.startOffset === unit.startOffset &&
        c.endOffset === unit.endOffset
    )

    return coding ? (coding.codeId || coding.codeName) : null
  }
}

interface CodingUnit {
  key: string
  documentId: string
  startOffset: number
  endOffset: number
}
