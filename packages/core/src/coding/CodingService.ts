import type { Document, CodingOptions, CodingResult, Code, Coding, CodingMethod } from '../types'
import { DynamicCodingPersonas } from './DynamicCodingPersonas'
import { ThreeExpertCodingSystem } from './ThreeExpertCodingSystem'
import { CalibratedPatternCoding } from './CalibratedPatternCoding'
import { UltraTurboCoding } from './UltraTurboCoding'

export interface CodingService {
  code(document: Document, options: CodingOptions): Promise<CodingResult>
  getAvailableMethods(): CodingMethod[]
  getMethodDescription(method: CodingMethod): string
}

export interface CodingServiceConfig {
  apiKey: string
  model?: string
  baseUrl?: string
}

export function createCodingService(config: CodingServiceConfig): CodingService {
  const dynamicPersonas = new DynamicCodingPersonas(config)
  const threeExpert = new ThreeExpertCodingSystem(config)
  const calibratedPattern = new CalibratedPatternCoding(config)
  const ultraTurbo = new UltraTurboCoding(config)

  const methodDescriptions: Record<CodingMethod, string> = {
    'dynamic-personas': 'Dynamische Personas passen sich an den Textinhalt an und kodieren aus verschiedenen Fachperspektiven.',
    'three-expert': 'Drei KI-Experten kodieren unabhängig voneinander. Nur Codes mit Konsens werden übernommen.',
    'calibrated-pattern': 'Mustererkennung mit Kalibrierung an bestehenden Codes. Ideal für konsistente Kodierung.',
    'ultra-turbo': 'Schnellste Methode mit Single-Pass-Analyse. Gut für erste Exploration.',
  }

  return {
    async code(document: Document, options: CodingOptions): Promise<CodingResult> {
      const startTime = Date.now()

      let result: CodingResult

      switch (options.method) {
        case 'dynamic-personas':
          result = await dynamicPersonas.code(document, options)
          break
        case 'three-expert':
          result = await threeExpert.code(document, options)
          break
        case 'calibrated-pattern':
          result = await calibratedPattern.code(document, options)
          break
        case 'ultra-turbo':
          result = await ultraTurbo.code(document, options)
          break
        default:
          throw new Error(`Unknown coding method: ${options.method}`)
      }

      result.metadata.duration = Date.now() - startTime
      return result
    },

    getAvailableMethods(): CodingMethod[] {
      return ['dynamic-personas', 'three-expert', 'calibrated-pattern', 'ultra-turbo']
    },

    getMethodDescription(method: CodingMethod): string {
      return methodDescriptions[method] || 'Unbekannte Methode'
    },
  }
}
