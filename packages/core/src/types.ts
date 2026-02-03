/**
 * Core types for EVIDENRA coding systems
 */

export interface Code {
  id: string
  name: string
  description?: string
  color: string
  parentId?: string | null
  children?: Code[]
}

export interface Coding {
  id: string
  documentId: string
  codeId: string
  codeName: string
  startOffset: number
  endOffset: number
  selectedText: string
  memo?: string
  confidence?: number
  codedBy: string
  createdAt: string
}

export interface Document {
  id: string
  name: string
  content: string
  fileType: string
  wordCount: number
}

export interface CodingResult {
  codings: Coding[]
  codes: Code[]
  metadata: {
    method: CodingMethod
    duration: number
    tokenCount?: number
    consensusRate?: number
  }
}

export type CodingMethod =
  | 'dynamic-personas'
  | 'three-expert'
  | 'calibrated-pattern'
  | 'ultra-turbo'

export interface CodingOptions {
  method: CodingMethod
  existingCodes?: Code[]
  language?: 'de' | 'en'
  maxCodes?: number
  minConfidence?: number
}

export interface CoderRatings {
  coderId: string
  coderName: string
  documentId: string
  codings: Coding[]
}

export interface IRRResult {
  metric: IRRMetric
  value: number
  interpretation: string
  details: {
    observedAgreement?: number
    expectedAgreement?: number
    coderCount: number
    categoryCount: number
    unitCount: number
  }
}

export type IRRMetric =
  | 'cohens-kappa'
  | 'fleiss-kappa'
  | 'krippendorff-alpha'
  | 'percent-agreement'

export interface IRROptions {
  metric: IRRMetric
  weightedKappa?: boolean
  bootstrapCI?: boolean
  bootstrapSamples?: number
}
