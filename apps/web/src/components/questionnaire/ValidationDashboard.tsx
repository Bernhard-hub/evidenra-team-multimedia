/**
 * Validation Dashboard
 * EVIDENRA Research - Scale Validation Progress Tracker
 *
 * Features:
 * - Visual validation workflow progress
 * - Phase-specific metrics and status
 * - Expert rating management
 * - Psychometric results display
 * - COSMIN checklist tracking
 */

import React, { useState, useMemo } from 'react'
import {
  IconCheck,
  IconX,
  IconClock,
  IconPlayerPlay,
  IconAlertTriangle,
  IconChevronRight,
  IconChevronDown,
  IconUsers,
  IconFileText,
  IconChartBar,
  IconNetwork,
  IconBook,
  IconClipboardCheck,
  IconChecks,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconInfoCircle,
  IconExternalLink,
  IconPlus,
  IconUpload,
  IconDownload,
} from '@tabler/icons-react'

import {
  ValidationProject,
  ValidationStatus,
  ContentValidityPhaseResult,
  CognitiveInterviewPhaseResult,
  PilotStudyPhaseResult,
  FullValidationPhaseResult,
  ExpertReview,
  CognitiveInterviewResult,
} from '@services/questionnaire/ValidationWorkflow'

import {
  Scale,
  ReliabilityResult,
  FactorAnalysisResult,
} from '@services/questionnaire/types'

import {
  RELIABILITY_THRESHOLDS,
  VALIDITY_THRESHOLDS,
  MODEL_FIT_THRESHOLDS,
  SAMPLE_SIZE_GUIDELINES,
} from '@services/questionnaire/knowledge'

// ============================================================================
// TYPES
// ============================================================================

interface ValidationDashboardProps {
  project: ValidationProject
  scale: Scale
  onUpdateProject?: (project: ValidationProject) => void
  onStartPhase?: (phase: string) => void
  onOpenNexus?: (prompt: string) => void
  language?: 'de' | 'en'
}

type Phase = 'content-validity' | 'cognitive-interviews' | 'pilot-study' | 'full-validation'

// ============================================================================
// CONSTANTS
// ============================================================================

const TRANSLATIONS = {
  de: {
    title: 'Validierungs-Dashboard',
    overallProgress: 'Gesamtfortschritt',
    phase: 'Phase',
    status: 'Status',
    pending: 'Ausstehend',
    inProgress: 'In Bearbeitung',
    completed: 'Abgeschlossen',
    failed: 'Fehlgeschlagen',
    contentValidity: 'Content-Validität',
    contentValidityDesc: 'Expertenrating zur inhaltlichen Validität',
    cognitiveInterviews: 'Kognitive Interviews',
    cognitiveInterviewsDesc: 'Think-Aloud und Verbal Probing',
    pilotStudy: 'Pilot-Studie',
    pilotStudyDesc: 'Item-Analyse und Reliabilität',
    fullValidation: 'Vollvalidierung',
    fullValidationDesc: 'Faktorenanalyse und Konstruktvalidität',
    startPhase: 'Phase starten',
    viewResults: 'Ergebnisse',
    experts: 'Experten',
    iCVI: 'I-CVI',
    sCVI: 'S-CVI/Ave',
    threshold: 'Schwellenwert',
    participants: 'Teilnehmer',
    issues: 'Probleme',
    sampleSize: 'Stichprobe',
    cronbachAlpha: "Cronbach's α",
    mcdonaldOmega: "McDonald's ω",
    itemTotal: 'Item-Total r',
    factors: 'Faktoren',
    cfi: 'CFI',
    tli: 'TLI',
    rmsea: 'RMSEA',
    srmr: 'SRMR',
    ave: 'AVE',
    cr: 'CR',
    excellent: 'Exzellent',
    good: 'Gut',
    acceptable: 'Akzeptabel',
    poor: 'Schlecht',
    recommendation: 'Empfehlung',
    addExpert: 'Experte hinzufügen',
    addInterview: 'Interview hinzufügen',
    uploadData: 'Daten hochladen',
    generateReport: 'Bericht generieren',
    cosminChecklist: 'COSMIN Checkliste',
    askNexusHelp: 'NEXUS um Hilfe bitten',
  },
  en: {
    title: 'Validation Dashboard',
    overallProgress: 'Overall Progress',
    phase: 'Phase',
    status: 'Status',
    pending: 'Pending',
    inProgress: 'In Progress',
    completed: 'Completed',
    failed: 'Failed',
    contentValidity: 'Content Validity',
    contentValidityDesc: 'Expert rating for content validity',
    cognitiveInterviews: 'Cognitive Interviews',
    cognitiveInterviewsDesc: 'Think-aloud and verbal probing',
    pilotStudy: 'Pilot Study',
    pilotStudyDesc: 'Item analysis and reliability',
    fullValidation: 'Full Validation',
    fullValidationDesc: 'Factor analysis and construct validity',
    startPhase: 'Start Phase',
    viewResults: 'Results',
    experts: 'Experts',
    iCVI: 'I-CVI',
    sCVI: 'S-CVI/Ave',
    threshold: 'Threshold',
    participants: 'Participants',
    issues: 'Issues',
    sampleSize: 'Sample Size',
    cronbachAlpha: "Cronbach's α",
    mcdonaldOmega: "McDonald's ω",
    itemTotal: 'Item-Total r',
    factors: 'Factors',
    cfi: 'CFI',
    tli: 'TLI',
    rmsea: 'RMSEA',
    srmr: 'SRMR',
    ave: 'AVE',
    cr: 'CR',
    excellent: 'Excellent',
    good: 'Good',
    acceptable: 'Acceptable',
    poor: 'Poor',
    recommendation: 'Recommendation',
    addExpert: 'Add Expert',
    addInterview: 'Add Interview',
    uploadData: 'Upload Data',
    generateReport: 'Generate Report',
    cosminChecklist: 'COSMIN Checklist',
    askNexusHelp: 'Ask NEXUS for help',
  },
}

const PHASE_ORDER: Phase[] = [
  'content-validity',
  'cognitive-interviews',
  'pilot-study',
  'full-validation',
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ValidationDashboard: React.FC<ValidationDashboardProps> = ({
  project,
  scale,
  onUpdateProject,
  onStartPhase,
  onOpenNexus,
  language = 'de',
}) => {
  const t = TRANSLATIONS[language]

  // State
  const [expandedPhase, setExpandedPhase] = useState<Phase | null>('content-validity')

  // Calculate overall progress
  const progress = useMemo(() => {
    const phases = project.phases || {}
    let completed = 0
    let total = 4

    if (phases.contentValidity?.status === 'completed') completed++
    if (phases.cognitiveInterviews?.status === 'completed') completed++
    if (phases.pilotStudy?.status === 'completed') completed++
    if (phases.fullValidation?.status === 'completed') completed++

    return Math.round((completed / total) * 100)
  }, [project])

  // Get phase status
  const getPhaseStatus = (phase: Phase): ValidationStatus => {
    const phases = project.phases || {}
    switch (phase) {
      case 'content-validity':
        return phases.contentValidity?.status || 'pending'
      case 'cognitive-interviews':
        return phases.cognitiveInterviews?.status || 'pending'
      case 'pilot-study':
        return phases.pilotStudy?.status || 'pending'
      case 'full-validation':
        return phases.fullValidation?.status || 'pending'
      default:
        return 'pending'
    }
  }

  // Get status color
  const getStatusColor = (status: ValidationStatus): string => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'in-progress':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      case 'failed':
        return 'text-red-400 bg-red-500/20 border-red-500/30'
      default:
        return 'text-slate-400 bg-slate-700/50 border-slate-600/50'
    }
  }

  // Get status icon
  const getStatusIcon = (status: ValidationStatus) => {
    switch (status) {
      case 'completed':
        return <IconCheck size={14} />
      case 'in-progress':
        return <IconClock size={14} className="animate-pulse" />
      case 'failed':
        return <IconX size={14} />
      default:
        return <IconMinus size={14} />
    }
  }

  // Phase configs
  const phaseConfigs = [
    {
      id: 'content-validity' as Phase,
      title: t.contentValidity,
      description: t.contentValidityDesc,
      icon: <IconUsers size={20} />,
      minSample: '3-10',
    },
    {
      id: 'cognitive-interviews' as Phase,
      title: t.cognitiveInterviews,
      description: t.cognitiveInterviewsDesc,
      icon: <IconBook size={20} />,
      minSample: '5-15',
    },
    {
      id: 'pilot-study' as Phase,
      title: t.pilotStudy,
      description: t.pilotStudyDesc,
      icon: <IconChartBar size={20} />,
      minSample: `n ≥ ${Math.max(50, scale.items.length * 5)}`,
    },
    {
      id: 'full-validation' as Phase,
      title: t.fullValidation,
      description: t.fullValidationDesc,
      icon: <IconNetwork size={20} />,
      minSample: `n ≥ ${Math.max(200, scale.items.length * 10)}`,
    },
  ]

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white">{t.title}</h2>
        <p className="text-sm text-slate-400">{scale.name}</p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">{t.overallProgress}</span>
            <span className="text-white font-medium">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {phaseConfigs.map((config, index) => {
          const status = getPhaseStatus(config.id)
          const isExpanded = expandedPhase === config.id
          const isPreviousCompleted = index === 0 || getPhaseStatus(phaseConfigs[index - 1].id) === 'completed'

          return (
            <div
              key={config.id}
              className={`rounded-xl border overflow-hidden ${
                isExpanded ? 'border-purple-500/30' : 'border-slate-700'
              }`}
            >
              {/* Phase header */}
              <button
                onClick={() => setExpandedPhase(isExpanded ? null : config.id)}
                className="w-full p-4 flex items-center gap-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  status === 'completed'
                    ? 'bg-green-500/20 text-green-400'
                    : status === 'in-progress'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {config.icon}
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-medium text-white">{config.title}</h3>
                  <p className="text-xs text-slate-500">{config.description}</p>
                </div>

                {/* Status badge */}
                <div className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 border ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                  <span>{t[status as keyof typeof t]}</span>
                </div>

                {/* Expand icon */}
                {isExpanded ? (
                  <IconChevronDown size={16} className="text-slate-400" />
                ) : (
                  <IconChevronRight size={16} className="text-slate-400" />
                )}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="p-4 bg-slate-900/50 border-t border-slate-700/50">
                  {config.id === 'content-validity' && (
                    <ContentValidityPhaseContent
                      result={project.phases?.contentValidity}
                      scale={scale}
                      onStartPhase={() => onStartPhase?.(config.id)}
                      onOpenNexus={onOpenNexus}
                      language={language}
                    />
                  )}
                  {config.id === 'cognitive-interviews' && (
                    <CognitiveInterviewPhaseContent
                      result={project.phases?.cognitiveInterviews}
                      scale={scale}
                      isEnabled={isPreviousCompleted}
                      onStartPhase={() => onStartPhase?.(config.id)}
                      onOpenNexus={onOpenNexus}
                      language={language}
                    />
                  )}
                  {config.id === 'pilot-study' && (
                    <PilotStudyPhaseContent
                      result={project.phases?.pilotStudy}
                      scale={scale}
                      isEnabled={isPreviousCompleted}
                      onStartPhase={() => onStartPhase?.(config.id)}
                      onOpenNexus={onOpenNexus}
                      language={language}
                    />
                  )}
                  {config.id === 'full-validation' && (
                    <FullValidationPhaseContent
                      result={project.phases?.fullValidation}
                      scale={scale}
                      isEnabled={isPreviousCompleted}
                      onStartPhase={() => onStartPhase?.(config.id)}
                      onOpenNexus={onOpenNexus}
                      language={language}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-slate-800 flex gap-2">
        <button
          onClick={() => onOpenNexus?.(
            language === 'de'
              ? `Hilf mir bei der Validierung meiner Skala "${scale.name}". Aktueller Fortschritt: ${progress}%. Was ist der nächste Schritt?`
              : `Help me validate my scale "${scale.name}". Current progress: ${progress}%. What's the next step?`
          )}
          className="flex-1 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <IconInfoCircle size={16} />
          {t.askNexusHelp}
        </button>
        <button
          onClick={() => {/* Generate report */}}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors text-sm flex items-center gap-2"
        >
          <IconDownload size={16} />
          {t.generateReport}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// PHASE CONTENT COMPONENTS
// ============================================================================

interface ContentValidityPhaseContentProps {
  result?: ContentValidityPhaseResult
  scale: Scale
  onStartPhase?: () => void
  onOpenNexus?: (prompt: string) => void
  language: 'de' | 'en'
}

const ContentValidityPhaseContent: React.FC<ContentValidityPhaseContentProps> = ({
  result,
  scale,
  onStartPhase,
  onOpenNexus,
  language,
}) => {
  const t = TRANSLATIONS[language]

  if (!result || result.status === 'pending') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          {language === 'de'
            ? 'Content-Validität prüft, ob die Items den Inhalt des Konstrukts angemessen repräsentieren.'
            : 'Content validity checks if items adequately represent the construct content.'}
        </p>

        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <h4 className="text-xs font-medium text-slate-300 mb-2">{t.recommendation}:</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• 3-10 {language === 'de' ? 'Experten für Bewertung rekrutieren' : 'experts for evaluation'}</li>
            <li>• I-CVI ≥ 0.78 {language === 'de' ? 'für akzeptable Items' : 'for acceptable items'}</li>
            <li>• S-CVI/Ave ≥ 0.90 {language === 'de' ? 'für gesamte Skala' : 'for overall scale'}</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onStartPhase}
            className="flex-1 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <IconPlayerPlay size={16} />
            {t.startPhase}
          </button>
          <button
            onClick={() => onOpenNexus?.(
              language === 'de'
                ? 'Erstelle eine Content-Validitäts-Bewertungsmatrix für meine Skala und erkläre das Vorgehen.'
                : 'Create a content validity rating matrix for my scale and explain the procedure.'
            )}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors text-sm"
          >
            NEXUS
          </button>
        </div>
      </div>
    )
  }

  // Show results
  return (
    <div className="space-y-4">
      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label={t.experts}
          value={result.expertReviews?.length || 0}
          threshold="3-10"
          status={
            (result.expertReviews?.length || 0) >= 3 ? 'good' : 'poor'
          }
        />
        <MetricCard
          label={t.iCVI}
          value={result.itemCVI?.reduce((a, b) => a + b, 0) / (result.itemCVI?.length || 1) || 0}
          threshold="≥ 0.78"
          isPercentage
          status={
            (result.itemCVI?.reduce((a, b) => a + b, 0) / (result.itemCVI?.length || 1) || 0) >= 0.78
              ? 'good'
              : 'poor'
          }
        />
        <MetricCard
          label={t.sCVI}
          value={result.scaleCVI || 0}
          threshold="≥ 0.90"
          isPercentage
          status={
            (result.scaleCVI || 0) >= 0.90
              ? 'good'
              : (result.scaleCVI || 0) >= 0.80
              ? 'acceptable'
              : 'poor'
          }
        />
      </div>

      {/* Items with low CVI */}
      {result.itemCVI && result.itemCVI.some(cvi => cvi < 0.78) && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <h4 className="text-xs font-medium text-amber-400 mb-2 flex items-center gap-1">
            <IconAlertTriangle size={14} />
            {language === 'de' ? 'Items mit niedrigem I-CVI' : 'Items with low I-CVI'}
          </h4>
          <ul className="text-xs text-slate-400 space-y-1">
            {result.itemCVI.map((cvi, i) =>
              cvi < 0.78 && (
                <li key={i}>
                  Item {i + 1}: I-CVI = {cvi.toFixed(2)}
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

interface CognitiveInterviewPhaseContentProps {
  result?: CognitiveInterviewPhaseResult
  scale: Scale
  isEnabled: boolean
  onStartPhase?: () => void
  onOpenNexus?: (prompt: string) => void
  language: 'de' | 'en'
}

const CognitiveInterviewPhaseContent: React.FC<CognitiveInterviewPhaseContentProps> = ({
  result,
  scale,
  isEnabled,
  onStartPhase,
  onOpenNexus,
  language,
}) => {
  const t = TRANSLATIONS[language]

  if (!isEnabled) {
    return (
      <div className="p-4 text-center text-slate-500">
        <IconClock size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">
          {language === 'de'
            ? 'Schließe zuerst die Content-Validität ab.'
            : 'Complete content validity first.'}
        </p>
      </div>
    )
  }

  if (!result || result.status === 'pending') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          {language === 'de'
            ? 'Kognitive Interviews identifizieren Verständnisprobleme bei den Items.'
            : 'Cognitive interviews identify comprehension problems with items.'}
        </p>

        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <h4 className="text-xs font-medium text-slate-300 mb-2">{t.recommendation}:</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• 5-15 {language === 'de' ? 'Teilnehmer aus Zielgruppe' : 'participants from target group'}</li>
            <li>• Think-Aloud {language === 'de' ? 'und Verbal Probing' : 'and verbal probing'}</li>
            <li>• {language === 'de' ? 'Iterative Itemanpassung' : 'Iterative item refinement'}</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onStartPhase}
            className="flex-1 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <IconPlayerPlay size={16} />
            {t.startPhase}
          </button>
          <button
            onClick={() => onOpenNexus?.(
              language === 'de'
                ? 'Generiere ein Cognitive Interview Protokoll für meine Skala mit Think-Aloud und Verbal Probing Fragen.'
                : 'Generate a cognitive interview protocol for my scale with think-aloud and verbal probing questions.'
            )}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors text-sm"
          >
            NEXUS
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label={t.participants}
          value={result.interviews?.length || 0}
          threshold="5-15"
          status={(result.interviews?.length || 0) >= 5 ? 'good' : 'poor'}
        />
        <MetricCard
          label={t.issues}
          value={result.totalIssues || 0}
          threshold="-"
          status={(result.totalIssues || 0) === 0 ? 'good' : 'acceptable'}
        />
      </div>
    </div>
  )
}

interface PilotStudyPhaseContentProps {
  result?: PilotStudyPhaseResult
  scale: Scale
  isEnabled: boolean
  onStartPhase?: () => void
  onOpenNexus?: (prompt: string) => void
  language: 'de' | 'en'
}

const PilotStudyPhaseContent: React.FC<PilotStudyPhaseContentProps> = ({
  result,
  scale,
  isEnabled,
  onStartPhase,
  onOpenNexus,
  language,
}) => {
  const t = TRANSLATIONS[language]
  const minSample = Math.max(50, scale.items.length * 5)

  if (!isEnabled) {
    return (
      <div className="p-4 text-center text-slate-500">
        <IconClock size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">
          {language === 'de'
            ? 'Schließe zuerst die kognitiven Interviews ab.'
            : 'Complete cognitive interviews first.'}
        </p>
      </div>
    )
  }

  if (!result || result.status === 'pending') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          {language === 'de'
            ? 'Die Pilotstudie prüft Item-Kennwerte und Reliabilität.'
            : 'The pilot study examines item statistics and reliability.'}
        </p>

        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <h4 className="text-xs font-medium text-slate-300 mb-2">{t.recommendation}:</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• n ≥ {minSample} ({scale.items.length} Items × 5)</li>
            <li>• Cronbach's α ≥ 0.70</li>
            <li>• Item-Total r ≥ 0.30</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onStartPhase}
            className="flex-1 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <IconUpload size={16} />
            {t.uploadData}
          </button>
          <button
            onClick={() => onOpenNexus?.(
              language === 'de'
                ? `Erkläre mir die Item-Analyse für meine Pilotstudie. Skala: "${scale.name}" mit ${scale.items.length} Items. Benötigte Stichprobe: n ≥ ${minSample}.`
                : `Explain the item analysis for my pilot study. Scale: "${scale.name}" with ${scale.items.length} items. Required sample: n ≥ ${minSample}.`
            )}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors text-sm"
          >
            NEXUS
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label={t.sampleSize}
          value={result.sampleSize || 0}
          threshold={`≥ ${minSample}`}
          status={(result.sampleSize || 0) >= minSample ? 'good' : 'poor'}
        />
        <MetricCard
          label={t.cronbachAlpha}
          value={result.reliability?.cronbachAlpha || 0}
          threshold="≥ 0.70"
          isPercentage
          status={
            (result.reliability?.cronbachAlpha || 0) >= 0.80
              ? 'good'
              : (result.reliability?.cronbachAlpha || 0) >= 0.70
              ? 'acceptable'
              : 'poor'
          }
        />
        <MetricCard
          label={t.itemTotal}
          value={
            result.reliability?.itemTotalCorrelations
              ? Math.min(...result.reliability.itemTotalCorrelations)
              : 0
          }
          threshold="≥ 0.30"
          isPercentage
          status={
            result.reliability?.itemTotalCorrelations &&
            Math.min(...result.reliability.itemTotalCorrelations) >= 0.30
              ? 'good'
              : 'poor'
          }
        />
      </div>
    </div>
  )
}

interface FullValidationPhaseContentProps {
  result?: FullValidationPhaseResult
  scale: Scale
  isEnabled: boolean
  onStartPhase?: () => void
  onOpenNexus?: (prompt: string) => void
  language: 'de' | 'en'
}

const FullValidationPhaseContent: React.FC<FullValidationPhaseContentProps> = ({
  result,
  scale,
  isEnabled,
  onStartPhase,
  onOpenNexus,
  language,
}) => {
  const t = TRANSLATIONS[language]
  const minSample = Math.max(200, scale.items.length * 10)

  if (!isEnabled) {
    return (
      <div className="p-4 text-center text-slate-500">
        <IconClock size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">
          {language === 'de'
            ? 'Schließe zuerst die Pilotstudie ab.'
            : 'Complete pilot study first.'}
        </p>
      </div>
    )
  }

  if (!result || result.status === 'pending') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          {language === 'de'
            ? 'Die Vollvalidierung umfasst EFA/CFA und Konstruktvalidität.'
            : 'Full validation includes EFA/CFA and construct validity.'}
        </p>

        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <h4 className="text-xs font-medium text-slate-300 mb-2">{t.recommendation}:</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• n ≥ {minSample} ({scale.items.length} Items × 10)</li>
            <li>• CFI/TLI ≥ 0.95, RMSEA ≤ 0.06</li>
            <li>• AVE ≥ 0.50, CR ≥ 0.70</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onStartPhase}
            className="flex-1 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <IconUpload size={16} />
            {t.uploadData}
          </button>
          <button
            onClick={() => onOpenNexus?.(
              language === 'de'
                ? `Hilf mir bei der Interpretation meiner Faktorenanalyse für "${scale.name}". Erkläre EFA vs CFA, Fit-Indices und Konstruktvalidität.`
                : `Help me interpret my factor analysis for "${scale.name}". Explain EFA vs CFA, fit indices, and construct validity.`
            )}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors text-sm"
          >
            NEXUS
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label={t.sampleSize}
          value={result.sampleSize || 0}
          threshold={`≥ ${minSample}`}
          status={(result.sampleSize || 0) >= minSample ? 'good' : 'poor'}
        />
        <MetricCard
          label={t.factors}
          value={result.factorAnalysis?.optimalFactors || 0}
          threshold="-"
          status="good"
        />
      </div>

      {result.factorAnalysis && (
        <div className="grid grid-cols-4 gap-2">
          <MetricCard
            label={t.cfi}
            value={result.factorAnalysis.modelFit?.cfi || 0}
            threshold="≥ 0.95"
            isPercentage
            status={
              (result.factorAnalysis.modelFit?.cfi || 0) >= 0.95
                ? 'good'
                : (result.factorAnalysis.modelFit?.cfi || 0) >= 0.90
                ? 'acceptable'
                : 'poor'
            }
            compact
          />
          <MetricCard
            label={t.tli}
            value={result.factorAnalysis.modelFit?.tli || 0}
            threshold="≥ 0.95"
            isPercentage
            status={
              (result.factorAnalysis.modelFit?.tli || 0) >= 0.95
                ? 'good'
                : (result.factorAnalysis.modelFit?.tli || 0) >= 0.90
                ? 'acceptable'
                : 'poor'
            }
            compact
          />
          <MetricCard
            label={t.rmsea}
            value={result.factorAnalysis.modelFit?.rmsea || 0}
            threshold="≤ 0.06"
            isPercentage
            status={
              (result.factorAnalysis.modelFit?.rmsea || 0) <= 0.06
                ? 'good'
                : (result.factorAnalysis.modelFit?.rmsea || 0) <= 0.08
                ? 'acceptable'
                : 'poor'
            }
            compact
          />
          <MetricCard
            label={t.srmr}
            value={result.factorAnalysis.modelFit?.srmr || 0}
            threshold="≤ 0.08"
            isPercentage
            status={
              (result.factorAnalysis.modelFit?.srmr || 0) <= 0.08
                ? 'good'
                : 'poor'
            }
            compact
          />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// METRIC CARD
// ============================================================================

interface MetricCardProps {
  label: string
  value: number
  threshold: string
  isPercentage?: boolean
  status: 'good' | 'acceptable' | 'poor'
  compact?: boolean
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  threshold,
  isPercentage,
  status,
  compact,
}) => {
  const statusColors = {
    good: 'text-green-400 bg-green-500/10 border-green-500/30',
    acceptable: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    poor: 'text-red-400 bg-red-500/10 border-red-500/30',
  }

  const statusIcons = {
    good: <IconTrendingUp size={12} />,
    acceptable: <IconMinus size={12} />,
    poor: <IconTrendingDown size={12} />,
  }

  return (
    <div className={`p-${compact ? '2' : '3'} rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-${compact ? 'xs' : 'xs'} text-slate-400`}>{label}</span>
        {statusIcons[status]}
      </div>
      <div className={`text-${compact ? 'sm' : 'lg'} font-bold`}>
        {isPercentage ? value.toFixed(2) : value}
      </div>
      <div className="text-xs text-slate-500">{threshold}</div>
    </div>
  )
}

export default ValidationDashboard
