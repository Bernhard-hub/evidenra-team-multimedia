/**
 * Questionnaire Module
 * EVIDENRA Research - Scientific Questionnaire Development System
 *
 * This module provides comprehensive questionnaire development capabilities:
 *
 * LEVEL 1: ADAPTER
 * - Search validated scales from ZIS/GESIS, PROMIS, etc.
 * - Recommend scales based on constructs
 * - Document adaptation process
 *
 * LEVEL 2: VALIDATOR
 * - Calculate reliability (Cronbach's α, McDonald's ω)
 * - Assess content validity (CVI)
 * - Plan validation studies
 * - Factor Analysis (EFA/CFA)
 *
 * LEVEL 3: CREATOR
 * - Extract constructs from qualitative codes
 * - Generate items from qualitative data
 * - Quality-check generated items
 *
 * @module questionnaire
 */

// Types
export * from './types'

// Knowledge Base
export * from './knowledge'

// Main Service
export {
  QuestionnaireService,
  ItemQualityAnalyzer,
  ReliabilityAnalyzer,
  ContentValidityAnalyzer,
  CognitiveInterviewGenerator,
  ValidationStudyPlanner,
  SampleSizeCalculator,
} from './QuestionnaireService'

// Psychometric Engine (Advanced Analysis)
export {
  PsychometricEngine,
  FactorAnalysis,
  AdvancedReliability,
  ValidityMetrics,
} from './PsychometricEngine'
export type { ComprehensivePsychometricReport } from './PsychometricEngine'

// Scale Repositories
export { ZISRepository, ZIS_SCALES_DATABASE } from './repositories'
export type { ZISScale, ZISSearchOptions, ZISSearchResult } from './repositories'

// Nexus AI Prompts
export {
  NexusQuestionnairePrompts,
  QUESTIONNAIRE_EXPERT_SYSTEM_PROMPT,
} from './NexusQuestionnairePrompts'

// Nexus Item Generator (AI-Assisted Item Creation)
export {
  NexusItemGenerator,
  ConstructExtractor,
  ItemGenerator,
  ScaleBuilder,
} from './NexusItemGenerator'
export type {
  QualitativeCode,
  QualitativeSegment,
  ConstructExtractionResult,
  GeneratedItem,
  ItemGenerationResult,
} from './NexusItemGenerator'

// Validation Workflow
export {
  ValidationWorkflowManager,
  ContentValidityWorkflow,
  CognitiveInterviewWorkflow,
  PilotStudyWorkflow,
  FullValidationWorkflow,
} from './ValidationWorkflow'
export type {
  ValidationProject,
  ValidationStatus,
  ValidationPhaseResult,
  ContentValidityPhaseResult,
  CognitiveInterviewPhaseResult,
  PilotStudyPhaseResult,
  FullValidationPhaseResult,
  ExpertReview,
  CognitiveInterviewResult,
} from './ValidationWorkflow'

// Survey Export
export {
  SurveyExporter,
  DDIExporter,
  LimeSurveyExporter,
  QualtricsExporter,
  REDCapExporter,
  CSVExporter,
  MethodsSectionGenerator,
} from './SurveyExporter'
export type {
  ExportFormat,
  ExportOptions,
  ExportResult,
} from './SurveyExporter'

// Nexus AI Integration
export {
  NexusQuestionnaireIntegration,
  NexusQuestionnaireContextBuilder,
  NexusQuestionnaireActionHandler,
  NEXUS_QUESTIONNAIRE_ACTIONS,
  buildQuestionnaireSystemPrompt,
} from './NexusIntegration'
export type {
  NexusQuestionnaireContext,
  NexusQuestionnaireAction,
  NexusQuestionnaireResponse,
} from './NexusIntegration'

// Default instance is available via QuestionnaireService export above
