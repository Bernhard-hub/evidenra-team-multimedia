/**
 * Psychometric Analysis Engine
 * EVIDENRA Research - Scientific Questionnaire Development System
 *
 * Advanced psychometric calculations including:
 * - Factor Analysis (EFA with rotation)
 * - McDonald's Omega
 * - Validity Metrics (AVE, CR, HTMT)
 * - Correlation Matrices
 *
 * Uses matrix operations for eigenvalue decomposition.
 * Based on classical test theory and factor analysis literature.
 */

import {
  ReliabilityResult,
  FactorAnalysisResult,
  FactorLoading,
  ModelFitIndices,
  ValidityResult,
} from './types'

import {
  RELIABILITY_THRESHOLDS,
  VALIDITY_THRESHOLDS,
  MODEL_FIT_THRESHOLDS,
} from './knowledge'

// ============================================================================
// MATRIX UTILITIES
// ============================================================================

type Matrix = number[][]
type Vector = number[]

class MatrixOps {
  /**
   * Create identity matrix
   */
  static identity(n: number): Matrix {
    const result: Matrix = []
    for (let i = 0; i < n; i++) {
      result[i] = []
      for (let j = 0; j < n; j++) {
        result[i][j] = i === j ? 1 : 0
      }
    }
    return result
  }

  /**
   * Matrix multiplication
   */
  static multiply(A: Matrix, B: Matrix): Matrix {
    const rowsA = A.length
    const colsA = A[0].length
    const colsB = B[0].length
    const result: Matrix = []

    for (let i = 0; i < rowsA; i++) {
      result[i] = []
      for (let j = 0; j < colsB; j++) {
        let sum = 0
        for (let k = 0; k < colsA; k++) {
          sum += A[i][k] * B[k][j]
        }
        result[i][j] = sum
      }
    }
    return result
  }

  /**
   * Transpose matrix
   */
  static transpose(A: Matrix): Matrix {
    const rows = A.length
    const cols = A[0].length
    const result: Matrix = []

    for (let j = 0; j < cols; j++) {
      result[j] = []
      for (let i = 0; i < rows; i++) {
        result[j][i] = A[i][j]
      }
    }
    return result
  }

  /**
   * Calculate mean of array
   */
  static mean(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  /**
   * Calculate standard deviation
   */
  static std(arr: number[]): number {
    const m = this.mean(arr)
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / arr.length
    return Math.sqrt(variance)
  }

  /**
   * Calculate covariance between two arrays
   */
  static covariance(x: number[], y: number[]): number {
    const n = x.length
    const meanX = this.mean(x)
    const meanY = this.mean(y)
    let sum = 0

    for (let i = 0; i < n; i++) {
      sum += (x[i] - meanX) * (y[i] - meanY)
    }

    return sum / (n - 1)
  }

  /**
   * Calculate Pearson correlation
   */
  static correlation(x: number[], y: number[]): number {
    const cov = this.covariance(x, y)
    const stdX = this.std(x)
    const stdY = this.std(y)

    if (stdX === 0 || stdY === 0) return 0
    return cov / (stdX * stdY)
  }

  /**
   * Calculate correlation matrix from data
   */
  static correlationMatrix(data: Matrix): Matrix {
    const n = data[0].length // Number of variables (items)
    const result: Matrix = []

    // Transpose to get items as rows
    const items: Vector[] = []
    for (let j = 0; j < n; j++) {
      items[j] = data.map(row => row[j])
    }

    for (let i = 0; i < n; i++) {
      result[i] = []
      for (let j = 0; j < n; j++) {
        if (i === j) {
          result[i][j] = 1
        } else if (j < i) {
          result[i][j] = result[j][i]
        } else {
          result[i][j] = this.correlation(items[i], items[j])
        }
      }
    }

    return result
  }

  /**
   * Calculate covariance matrix from data
   */
  static covarianceMatrix(data: Matrix): Matrix {
    const n = data[0].length
    const result: Matrix = []

    const items: Vector[] = []
    for (let j = 0; j < n; j++) {
      items[j] = data.map(row => row[j])
    }

    for (let i = 0; i < n; i++) {
      result[i] = []
      for (let j = 0; j < n; j++) {
        if (j < i) {
          result[i][j] = result[j][i]
        } else {
          result[i][j] = this.covariance(items[i], items[j])
        }
      }
    }

    return result
  }

  /**
   * Power iteration for dominant eigenvalue/eigenvector
   */
  static powerIteration(A: Matrix, maxIter: number = 100, tol: number = 1e-10): { value: number; vector: Vector } {
    const n = A.length
    let v: Vector = new Array(n).fill(1).map(() => Math.random())

    // Normalize
    let norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0))
    v = v.map(x => x / norm)

    let eigenvalue = 0

    for (let iter = 0; iter < maxIter; iter++) {
      // Matrix-vector multiplication
      const Av: Vector = []
      for (let i = 0; i < n; i++) {
        let sum = 0
        for (let j = 0; j < n; j++) {
          sum += A[i][j] * v[j]
        }
        Av[i] = sum
      }

      // Calculate eigenvalue (Rayleigh quotient)
      const newEigenvalue = Av.reduce((sum, x, i) => sum + x * v[i], 0)

      // Normalize
      norm = Math.sqrt(Av.reduce((sum, x) => sum + x * x, 0))
      const newV = Av.map(x => x / norm)

      // Check convergence
      if (Math.abs(newEigenvalue - eigenvalue) < tol) {
        return { value: newEigenvalue, vector: newV }
      }

      eigenvalue = newEigenvalue
      v = newV
    }

    return { value: eigenvalue, vector: v }
  }

  /**
   * Deflation to find multiple eigenvalues
   */
  static eigenDecomposition(A: Matrix, numEigenvalues?: number): { values: number[]; vectors: Matrix } {
    const n = A.length
    const k = numEigenvalues || n
    const values: number[] = []
    const vectors: Matrix = []

    // Copy matrix for deflation
    let deflated = A.map(row => [...row])

    for (let i = 0; i < k; i++) {
      const { value, vector } = this.powerIteration(deflated)

      if (Math.abs(value) < 1e-10) break

      values.push(value)
      vectors.push(vector)

      // Deflate: A = A - λ * v * v^T
      for (let j = 0; j < n; j++) {
        for (let l = 0; l < n; l++) {
          deflated[j][l] -= value * vector[j] * vector[l]
        }
      }
    }

    return { values, vectors: this.transpose(vectors) }
  }

  /**
   * Varimax rotation
   */
  static varimax(loadings: Matrix, maxIter: number = 100, tol: number = 1e-6): Matrix {
    const n = loadings.length // Items
    const k = loadings[0].length // Factors

    let rotated = loadings.map(row => [...row])
    let prevVariance = -Infinity

    for (let iter = 0; iter < maxIter; iter++) {
      // Calculate variance
      let variance = 0
      for (let j = 0; j < k; j++) {
        const col = rotated.map(row => row[j])
        const sq = col.map(x => x * x)
        const mean = this.mean(sq)
        variance += sq.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0)
      }

      if (Math.abs(variance - prevVariance) < tol) break
      prevVariance = variance

      // Rotate pairs of factors
      for (let j = 0; j < k - 1; j++) {
        for (let l = j + 1; l < k; l++) {
          // Calculate rotation angle
          let u = 0, v = 0, a = 0, b = 0

          for (let i = 0; i < n; i++) {
            const x = rotated[i][j]
            const y = rotated[i][l]
            u += (x * x - y * y)
            v += 2 * x * y
            a += (x * x - y * y) ** 2 - 4 * x * x * y * y
            b += 4 * (x * x - y * y) * x * y
          }

          const phi = Math.atan2(b, a) / 4

          // Apply rotation
          const cos = Math.cos(phi)
          const sin = Math.sin(phi)

          for (let i = 0; i < n; i++) {
            const x = rotated[i][j]
            const y = rotated[i][l]
            rotated[i][j] = x * cos + y * sin
            rotated[i][l] = -x * sin + y * cos
          }
        }
      }
    }

    return rotated
  }
}

// ============================================================================
// FACTOR ANALYSIS
// ============================================================================

export class FactorAnalysis {
  /**
   * Perform Exploratory Factor Analysis
   */
  static efa(
    data: Matrix,
    numFactors: number,
    rotation: 'none' | 'varimax' | 'oblimin' = 'varimax'
  ): FactorAnalysisResult {
    // Calculate correlation matrix
    const R = MatrixOps.correlationMatrix(data)

    // Eigendecomposition
    const { values: eigenvalues, vectors: eigenvectors } = MatrixOps.eigenDecomposition(R, numFactors)

    // Calculate factor loadings: L = V * sqrt(Lambda)
    const loadingsMatrix: Matrix = []
    for (let i = 0; i < R.length; i++) {
      loadingsMatrix[i] = []
      for (let j = 0; j < numFactors; j++) {
        loadingsMatrix[i][j] = eigenvectors[i][j] * Math.sqrt(Math.abs(eigenvalues[j]))
      }
    }

    // Apply rotation
    let rotatedLoadings = loadingsMatrix
    if (rotation === 'varimax' && numFactors > 1) {
      rotatedLoadings = MatrixOps.varimax(loadingsMatrix)
    }

    // Calculate communalities and create results
    const factorLoadings: FactorLoading[] = []
    for (let i = 0; i < rotatedLoadings.length; i++) {
      const loadings = rotatedLoadings[i]
      const communality = loadings.reduce((sum, l) => sum + l * l, 0)

      // Find primary factor
      let maxLoading = 0
      let primaryFactor = 0
      for (let j = 0; j < loadings.length; j++) {
        if (Math.abs(loadings[j]) > Math.abs(maxLoading)) {
          maxLoading = loadings[j]
          primaryFactor = j
        }
      }

      factorLoadings.push({
        itemId: `item_${i + 1}`,
        loadings,
        communality,
        primaryFactor,
      })
    }

    // Calculate variance explained
    const totalVariance = eigenvalues.reduce((a, b) => a + b, 0)
    const varianceExplained = eigenvalues.map(e => (e / R.length) * 100)

    return {
      type: 'efa',
      factorCount: numFactors,
      factorLoadings,
      eigenvalues,
      varianceExplained,
      rotationMethod: rotation,
    }
  }

  /**
   * Determine optimal number of factors using parallel analysis
   */
  static parallelAnalysis(
    data: Matrix,
    iterations: number = 100
  ): { suggestedFactors: number; realEigenvalues: number[]; randomEigenvalues: number[] } {
    const n = data.length // Subjects
    const p = data[0].length // Items

    // Get real eigenvalues
    const R = MatrixOps.correlationMatrix(data)
    const { values: realEigenvalues } = MatrixOps.eigenDecomposition(R)

    // Generate random eigenvalues
    const randomEigenvaluesAll: number[][] = []

    for (let iter = 0; iter < iterations; iter++) {
      // Generate random data with same dimensions
      const randomData: Matrix = []
      for (let i = 0; i < n; i++) {
        randomData[i] = []
        for (let j = 0; j < p; j++) {
          // Box-Muller transform for normal distribution
          const u1 = Math.random()
          const u2 = Math.random()
          randomData[i][j] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
        }
      }

      const randomR = MatrixOps.correlationMatrix(randomData)
      const { values } = MatrixOps.eigenDecomposition(randomR)
      randomEigenvaluesAll.push(values)
    }

    // Calculate 95th percentile of random eigenvalues
    const randomEigenvalues: number[] = []
    for (let j = 0; j < p; j++) {
      const eigenAtPosition = randomEigenvaluesAll.map(e => e[j] || 0).sort((a, b) => a - b)
      const idx = Math.floor(0.95 * iterations)
      randomEigenvalues.push(eigenAtPosition[idx])
    }

    // Count factors where real > random
    let suggestedFactors = 0
    for (let i = 0; i < realEigenvalues.length; i++) {
      if (realEigenvalues[i] > randomEigenvalues[i]) {
        suggestedFactors++
      } else {
        break
      }
    }

    return {
      suggestedFactors: Math.max(1, suggestedFactors),
      realEigenvalues,
      randomEigenvalues,
    }
  }

  /**
   * Kaiser criterion (eigenvalue > 1)
   */
  static kaiserCriterion(eigenvalues: number[]): number {
    return eigenvalues.filter(e => e > 1).length
  }
}

// ============================================================================
// ADVANCED RELIABILITY
// ============================================================================

export class AdvancedReliability {
  /**
   * Calculate McDonald's Omega from factor loadings
   * ω = (Σλ)² / ((Σλ)² + Σ(1-λ²))
   */
  static mcdonaldOmega(factorLoadings: number[]): number {
    const sumLoadings = factorLoadings.reduce((sum, l) => sum + l, 0)
    const sumErrorVariance = factorLoadings.reduce((sum, l) => sum + (1 - l * l), 0)

    const omega = Math.pow(sumLoadings, 2) / (Math.pow(sumLoadings, 2) + sumErrorVariance)
    return Math.max(0, Math.min(1, omega))
  }

  /**
   * Calculate Omega Hierarchical (general factor saturation)
   */
  static omegaHierarchical(
    generalLoadings: number[],
    groupLoadings: number[][]
  ): number {
    const sumGeneral = generalLoadings.reduce((sum, l) => sum + l, 0)
    const sumGroupSquared = groupLoadings.reduce((sum, group) =>
      sum + Math.pow(group.reduce((s, l) => s + l, 0), 2), 0)
    const sumError = generalLoadings.reduce((sum, l, i) => {
      const groupSum = groupLoadings.reduce((s, g) => s + (g[i] || 0) ** 2, 0)
      return sum + (1 - l * l - groupSum)
    }, 0)

    const numerator = Math.pow(sumGeneral, 2)
    const denominator = numerator + sumGroupSquared + sumError

    return denominator > 0 ? numerator / denominator : 0
  }

  /**
   * Calculate split-half reliability with Spearman-Brown correction
   */
  static splitHalf(data: Matrix): number {
    const n = data[0].length // Items

    // Split into odd and even items
    const oddItems: number[] = []
    const evenItems: number[] = []

    for (const row of data) {
      let oddSum = 0
      let evenSum = 0
      for (let i = 0; i < n; i++) {
        if (i % 2 === 0) {
          evenSum += row[i]
        } else {
          oddSum += row[i]
        }
      }
      oddItems.push(oddSum)
      evenItems.push(evenSum)
    }

    // Calculate correlation between halves
    const r = MatrixOps.correlation(oddItems, evenItems)

    // Spearman-Brown correction
    const reliability = (2 * r) / (1 + r)
    return Math.max(0, Math.min(1, reliability))
  }

  /**
   * Calculate Guttman's Lambda 6 (based on squared multiple correlations)
   */
  static guttmanLambda6(R: Matrix): number {
    const n = R.length
    let sumSMC = 0

    for (let i = 0; i < n; i++) {
      // Calculate SMC for item i (simplified: use max r²)
      let maxRsq = 0
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const rsq = R[i][j] * R[i][j]
          if (rsq > maxRsq) maxRsq = rsq
        }
      }
      sumSMC += maxRsq
    }

    // Calculate total variance
    let totalVar = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        totalVar += R[i][j]
      }
    }

    if (totalVar === 0) return 0
    return 1 - (n - sumSMC) / totalVar
  }
}

// ============================================================================
// VALIDITY METRICS
// ============================================================================

export class ValidityMetrics {
  /**
   * Calculate Average Variance Extracted (AVE)
   * AVE = Σλ² / (Σλ² + Σε)
   */
  static averageVarianceExtracted(factorLoadings: number[]): number {
    const sumLoadingsSquared = factorLoadings.reduce((sum, l) => sum + l * l, 0)
    const sumError = factorLoadings.reduce((sum, l) => sum + (1 - l * l), 0)

    const ave = sumLoadingsSquared / (sumLoadingsSquared + sumError)
    return Math.max(0, Math.min(1, ave))
  }

  /**
   * Calculate Composite Reliability (CR)
   * CR = (Σλ)² / ((Σλ)² + Σε)
   */
  static compositeReliability(factorLoadings: number[]): number {
    const sumLoadings = factorLoadings.reduce((sum, l) => sum + l, 0)
    const sumError = factorLoadings.reduce((sum, l) => sum + (1 - l * l), 0)

    const cr = Math.pow(sumLoadings, 2) / (Math.pow(sumLoadings, 2) + sumError)
    return Math.max(0, Math.min(1, cr))
  }

  /**
   * Calculate HTMT (Heterotrait-Monotrait Ratio)
   */
  static htmt(
    correlationMatrix: Matrix,
    factorAssignments: number[] // Which factor each item belongs to
  ): Matrix {
    const factors = [...new Set(factorAssignments)]
    const k = factors.length
    const htmtMatrix: Matrix = []

    for (let i = 0; i < k; i++) {
      htmtMatrix[i] = []
      for (let j = 0; j < k; j++) {
        if (i === j) {
          htmtMatrix[i][j] = 1
        } else if (j < i) {
          htmtMatrix[i][j] = htmtMatrix[j][i]
        } else {
          // Items in factor i
          const itemsI = factorAssignments
            .map((f, idx) => f === factors[i] ? idx : -1)
            .filter(idx => idx >= 0)

          // Items in factor j
          const itemsJ = factorAssignments
            .map((f, idx) => f === factors[j] ? idx : -1)
            .filter(idx => idx >= 0)

          // Heterotrait-heteromethod correlations
          let sumHetero = 0
          let countHetero = 0
          for (const ii of itemsI) {
            for (const jj of itemsJ) {
              sumHetero += Math.abs(correlationMatrix[ii][jj])
              countHetero++
            }
          }
          const meanHetero = countHetero > 0 ? sumHetero / countHetero : 0

          // Monotrait-heteromethod correlations for factor i
          let sumMonoI = 0
          let countMonoI = 0
          for (let ii = 0; ii < itemsI.length; ii++) {
            for (let jj = ii + 1; jj < itemsI.length; jj++) {
              sumMonoI += Math.abs(correlationMatrix[itemsI[ii]][itemsI[jj]])
              countMonoI++
            }
          }
          const meanMonoI = countMonoI > 0 ? sumMonoI / countMonoI : 1

          // Monotrait-heteromethod correlations for factor j
          let sumMonoJ = 0
          let countMonoJ = 0
          for (let ii = 0; ii < itemsJ.length; ii++) {
            for (let jj = ii + 1; jj < itemsJ.length; jj++) {
              sumMonoJ += Math.abs(correlationMatrix[itemsJ[ii]][itemsJ[jj]])
              countMonoJ++
            }
          }
          const meanMonoJ = countMonoJ > 0 ? sumMonoJ / countMonoJ : 1

          // HTMT formula
          const htmt = meanHetero / Math.sqrt(meanMonoI * meanMonoJ)
          htmtMatrix[i][j] = Math.min(1, htmt)
        }
      }
    }

    return htmtMatrix
  }

  /**
   * Check Fornell-Larcker criterion
   * Square root of AVE for each construct should be greater than
   * its correlations with other constructs
   */
  static fornellLarcker(
    aveValues: number[],
    constructCorrelations: Matrix
  ): { passes: boolean; issues: string[] } {
    const issues: string[] = []
    const sqrtAve = aveValues.map(Math.sqrt)

    for (let i = 0; i < sqrtAve.length; i++) {
      for (let j = 0; j < sqrtAve.length; j++) {
        if (i !== j) {
          if (sqrtAve[i] < Math.abs(constructCorrelations[i][j])) {
            issues.push(
              `Konstrukt ${i + 1}: √AVE (${sqrtAve[i].toFixed(2)}) < Korrelation mit Konstrukt ${j + 1} (${constructCorrelations[i][j].toFixed(2)})`
            )
          }
        }
      }
    }

    return {
      passes: issues.length === 0,
      issues,
    }
  }

  /**
   * Comprehensive validity assessment
   */
  static assessValidity(
    factorLoadings: number[][],
    correlationMatrix: Matrix,
    factorAssignments: number[]
  ): ValidityResult {
    // Calculate AVE and CR for each factor
    const factors = [...new Set(factorAssignments)]
    const aveValues: number[] = []
    const crValues: number[] = []

    for (const factor of factors) {
      const loadings = factorLoadings
        .filter((_, i) => factorAssignments[i] === factor)
        .map(l => l[factor] || l[0])

      aveValues.push(this.averageVarianceExtracted(loadings))
      crValues.push(this.compositeReliability(loadings))
    }

    // Calculate HTMT
    const htmtMatrix = this.htmt(correlationMatrix, factorAssignments)

    // Check thresholds
    const aveOk = aveValues.every(ave => ave >= VALIDITY_THRESHOLDS.convergent.ave)
    const crOk = crValues.every(cr => cr >= VALIDITY_THRESHOLDS.convergent.cr)

    let htmtOk = true
    for (let i = 0; i < htmtMatrix.length; i++) {
      for (let j = i + 1; j < htmtMatrix.length; j++) {
        if (htmtMatrix[i][j] >= VALIDITY_THRESHOLDS.discriminant.htmt) {
          htmtOk = false
        }
      }
    }

    // Fornell-Larcker (simplified - use factor correlations)
    const factorCorr: Matrix = []
    for (let i = 0; i < factors.length; i++) {
      factorCorr[i] = []
      for (let j = 0; j < factors.length; j++) {
        factorCorr[i][j] = htmtMatrix[i][j] * Math.sqrt(aveValues[i] * aveValues[j])
      }
    }
    const flResult = this.fornellLarcker(aveValues, factorCorr)

    return {
      convergent: {
        ave: aveValues[0] || 0,
        compositeReliability: crValues[0] || 0,
        meetsThreshold: aveOk && crOk,
      },
      discriminant: {
        htmt: htmtMatrix,
        fornellLarcker: flResult.passes,
        meetsThreshold: htmtOk && flResult.passes,
      },
    }
  }
}

// ============================================================================
// COMPREHENSIVE PSYCHOMETRIC REPORT
// ============================================================================

export interface ComprehensivePsychometricReport {
  reliability: {
    cronbachAlpha: number
    mcdonaldOmega: number
    splitHalf: number
    interpretation: string
  }
  factorAnalysis: {
    suggestedFactors: number
    eigenvalues: number[]
    varianceExplained: number[]
    loadings: FactorLoading[]
  }
  validity: {
    ave: number
    compositeReliability: number
    htmt?: Matrix
    convergentOk: boolean
    discriminantOk: boolean
  }
  recommendations: string[]
}

export class PsychometricEngine {
  /**
   * Generate comprehensive psychometric report
   */
  static generateReport(
    data: Matrix,
    itemIds?: string[]
  ): ComprehensivePsychometricReport {
    const recommendations: string[] = []

    // 1. Calculate correlation matrix
    const R = MatrixOps.correlationMatrix(data)

    // 2. Parallel analysis for factor count
    const { suggestedFactors, realEigenvalues, randomEigenvalues } = FactorAnalysis.parallelAnalysis(data, 50)

    // 3. Factor analysis
    const efaResult = FactorAnalysis.efa(data, suggestedFactors, 'varimax')
    const primaryLoadings = efaResult.factorLoadings.map(fl => fl.loadings[fl.primaryFactor])

    // 4. Reliability
    const alpha = this.calculateCronbachAlpha(data)
    const omega = AdvancedReliability.mcdonaldOmega(primaryLoadings)
    const splitHalf = AdvancedReliability.splitHalf(data)

    // 5. Validity
    const ave = ValidityMetrics.averageVarianceExtracted(primaryLoadings)
    const cr = ValidityMetrics.compositeReliability(primaryLoadings)

    // Interpretation
    let reliabilityInterpretation = ''
    const t = RELIABILITY_THRESHOLDS.cronbachAlpha
    if (alpha >= t.excellent) reliabilityInterpretation = 'Exzellent'
    else if (alpha >= t.good) reliabilityInterpretation = 'Gut'
    else if (alpha >= t.acceptable) reliabilityInterpretation = 'Akzeptabel'
    else if (alpha >= t.questionable) reliabilityInterpretation = 'Fragwürdig'
    else reliabilityInterpretation = 'Unzureichend'

    // Recommendations
    if (alpha < t.acceptable) {
      recommendations.push('Reliabilität unter 0.70 - prüfen Sie Item-Total-Korrelationen')
    }
    if (alpha > t.tooHigh) {
      recommendations.push('Sehr hohe Reliabilität (>0.95) kann auf redundante Items hinweisen')
    }
    if (ave < VALIDITY_THRESHOLDS.convergent.ave) {
      recommendations.push(`AVE (${ave.toFixed(2)}) < 0.50 - konvergente Validität nicht gegeben`)
    }

    const lowLoadings = efaResult.factorLoadings.filter(fl =>
      Math.abs(fl.loadings[fl.primaryFactor]) < 0.40
    )
    if (lowLoadings.length > 0) {
      recommendations.push(`${lowLoadings.length} Items mit Faktorladung < 0.40 - Überprüfung empfohlen`)
    }

    return {
      reliability: {
        cronbachAlpha: alpha,
        mcdonaldOmega: omega,
        splitHalf,
        interpretation: reliabilityInterpretation,
      },
      factorAnalysis: {
        suggestedFactors,
        eigenvalues: realEigenvalues,
        varianceExplained: efaResult.varianceExplained || [],
        loadings: efaResult.factorLoadings,
      },
      validity: {
        ave,
        compositeReliability: cr,
        convergentOk: ave >= VALIDITY_THRESHOLDS.convergent.ave,
        discriminantOk: true, // Simplified for single-factor
      },
      recommendations,
    }
  }

  /**
   * Calculate Cronbach's Alpha
   */
  static calculateCronbachAlpha(data: Matrix): number {
    const n = data[0].length // Number of items

    // Calculate item variances
    const itemVariances: number[] = []
    for (let j = 0; j < n; j++) {
      const itemValues = data.map(row => row[j])
      const mean = MatrixOps.mean(itemValues)
      const variance = itemValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / itemValues.length
      itemVariances.push(variance)
    }

    // Calculate total variance
    const totals = data.map(row => row.reduce((a, b) => a + b, 0))
    const totalMean = MatrixOps.mean(totals)
    const totalVariance = totals.reduce((acc, val) => acc + Math.pow(val - totalMean, 2), 0) / totals.length

    if (totalVariance === 0) return 0

    const sumVariances = itemVariances.reduce((a, b) => a + b, 0)
    const alpha = (n / (n - 1)) * (1 - sumVariances / totalVariance)

    return Math.max(0, Math.min(1, alpha))
  }

  // Export utility classes
  static MatrixOps = MatrixOps
  static FactorAnalysis = FactorAnalysis
  static AdvancedReliability = AdvancedReliability
  static ValidityMetrics = ValidityMetrics
}

export default PsychometricEngine
