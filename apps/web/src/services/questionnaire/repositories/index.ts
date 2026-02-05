/**
 * Scale Repository Connectors
 * EVIDENRA Research - Scientific Questionnaire Development System
 *
 * Connectors to validated scale repositories:
 * - ZIS/GESIS: German social science scales
 * - PROMIS: Patient-reported outcome measures (TODO)
 * - PsycTESTS: APA psychological tests (TODO)
 */

export * from './ZISRepository'
export { ZISRepository as default } from './ZISRepository'
