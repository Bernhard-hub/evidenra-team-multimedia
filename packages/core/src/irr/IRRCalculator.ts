import type { IRRResult, IRRMetric, IRROptions, CoderRatings } from '../types'
import { CohensKappa } from './CohensKappa'
import { FleissKappa } from './FleissKappa'
import { KrippendorffAlpha } from './KrippendorffAlpha'
import { PercentAgreement } from './PercentAgreement'

export interface IRRCalculator {
  calculate(ratings: CoderRatings[], options: IRROptions): IRRResult
  getRecommendedMetric(coderCount: number): IRRMetric
  interpretResult(value: number, metric: IRRMetric): string
}

/**
 * Calculate Inter-Rater Reliability for qualitative coding
 *
 * Supports multiple metrics:
 * - Cohen's Kappa: For 2 coders
 * - Fleiss' Kappa: For 3+ coders
 * - Krippendorff's Alpha: For any number of coders, handles missing data
 * - Percent Agreement: Simple but useful baseline
 */
export function calculateIRR(
  ratings: CoderRatings[],
  options: IRROptions = { metric: 'fleiss-kappa' }
): IRRResult {
  if (ratings.length < 2) {
    throw new Error('At least 2 coders required for IRR calculation')
  }

  const metric = options.metric || getRecommendedMetric(ratings.length)

  let value: number
  let details: IRRResult['details']

  switch (metric) {
    case 'cohens-kappa':
      if (ratings.length !== 2) {
        throw new Error("Cohen's Kappa requires exactly 2 coders")
      }
      const cohens = new CohensKappa()
      const cohensResult = cohens.calculate(ratings[0], ratings[1], options.weightedKappa)
      value = cohensResult.kappa
      details = {
        observedAgreement: cohensResult.observedAgreement,
        expectedAgreement: cohensResult.expectedAgreement,
        coderCount: 2,
        categoryCount: cohensResult.categoryCount,
        unitCount: cohensResult.unitCount,
      }
      break

    case 'fleiss-kappa':
      const fleiss = new FleissKappa()
      const fleissResult = fleiss.calculate(ratings)
      value = fleissResult.kappa
      details = {
        observedAgreement: fleissResult.observedAgreement,
        expectedAgreement: fleissResult.expectedAgreement,
        coderCount: ratings.length,
        categoryCount: fleissResult.categoryCount,
        unitCount: fleissResult.unitCount,
      }
      break

    case 'krippendorff-alpha':
      const krippendorff = new KrippendorffAlpha()
      const alphaResult = krippendorff.calculate(ratings)
      value = alphaResult.alpha
      details = {
        coderCount: ratings.length,
        categoryCount: alphaResult.categoryCount,
        unitCount: alphaResult.unitCount,
      }
      break

    case 'percent-agreement':
      const percent = new PercentAgreement()
      const percentResult = percent.calculate(ratings)
      value = percentResult.agreement
      details = {
        observedAgreement: percentResult.agreement,
        coderCount: ratings.length,
        categoryCount: percentResult.categoryCount,
        unitCount: percentResult.unitCount,
      }
      break

    default:
      throw new Error(`Unknown IRR metric: ${metric}`)
  }

  return {
    metric,
    value,
    interpretation: interpretResult(value, metric),
    details,
  }
}

function getRecommendedMetric(coderCount: number): IRRMetric {
  if (coderCount === 2) {
    return 'cohens-kappa'
  }
  return 'fleiss-kappa'
}

function interpretResult(value: number, metric: IRRMetric): string {
  // Landis & Koch (1977) interpretation scale
  if (value < 0) {
    return 'Keine Übereinstimmung (Poor)'
  }
  if (value < 0.21) {
    return 'Geringe Übereinstimmung (Slight)'
  }
  if (value < 0.41) {
    return 'Ausreichende Übereinstimmung (Fair)'
  }
  if (value < 0.61) {
    return 'Moderate Übereinstimmung (Moderate)'
  }
  if (value < 0.81) {
    return 'Substanzielle Übereinstimmung (Substantial)'
  }
  return 'Fast perfekte Übereinstimmung (Almost Perfect)'
}
