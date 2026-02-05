/**
 * MethodologyGuide - Intelligenter Workflow-Begleiter für qualitative Forschung
 *
 * Features:
 * - Minimierbar (schwebt am Rand)
 * - "Zurück zum Guide" nach Navigation
 * - KI-Assistent pro Schritt
 * - Kontextbezogene Hilfe
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconX,
  IconChevronRight,
  IconChevronLeft,
  IconCheck,
  IconCircle,
  IconBook,
  IconBrain,
  IconList,
  IconNetwork,
  IconEye,
  IconMessageCircle,
  IconInfoCircle,
  IconNotes,
  IconFileText,
  IconTags,
  IconNote,
  IconChartBar,
  IconUsers,
  IconRobot,
  IconArrowRight,
  IconSparkles,
  IconMinimize,
  IconMaximize,
  IconWand,
  IconBulb,
  IconTargetArrow,
  IconRefresh
} from '@tabler/icons-react'
import {
  METHODOLOGIES,
  getAllMethodologies,
  type MethodologyId,
  type WorkflowStep
} from '@/services/MethodologyWorkflow'
import { useMethodologyWorkflow } from '@/hooks/useMethodologyWorkflow'

interface MethodologyGuideProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
  onMinimize?: () => void
  language?: 'de' | 'en'
  onOpenMemos?: () => void
  onOpenCodes?: () => void
  onOpenAnalysis?: () => void
  onOpenDocuments?: () => void
  onOpenAICoding?: () => void
  onOpenIRR?: () => void
  onOpenNexus?: () => void
  // Project context for AI
  documentCount?: number
  codeCount?: number
  codingCount?: number
  memoCount?: number
}

// Step-specific AI actions
interface StepAIAction {
  id: string
  labelDE: string
  labelEN: string
  descriptionDE: string
  descriptionEN: string
  icon: React.ReactNode
  action: () => void
}

// Get AI actions specific to each workflow step
const getStepAIActions = (
  stepId: string,
  methodologyId: MethodologyId,
  handlers: {
    onAICoding?: () => void
    onOpenNexus?: () => void
    onOpenAnalysis?: () => void
    onOpenIRR?: () => void
  }
): StepAIAction[] => {
  const actions: StepAIAction[] = []

  // Grounded Theory steps
  if (methodologyId === 'grounded-theory') {
    if (stepId === 'open-coding') {
      actions.push({
        id: 'ai-suggest-codes',
        labelDE: 'KI: Codes vorschlagen',
        labelEN: 'AI: Suggest Codes',
        descriptionDE: 'KI analysiert deine Dokumente und schlägt initiale Codes vor',
        descriptionEN: 'AI analyzes your documents and suggests initial codes',
        icon: <IconWand className="w-4 h-4" />,
        action: () => handlers.onAICoding?.()
      })
      actions.push({
        id: 'ai-help',
        labelDE: 'KI-Berater fragen',
        labelEN: 'Ask AI Advisor',
        descriptionDE: 'Frage den KI-Berater zu offenem Kodieren',
        descriptionEN: 'Ask the AI advisor about open coding',
        icon: <IconBulb className="w-4 h-4" />,
        action: () => handlers.onOpenNexus?.()
      })
    }
    if (stepId === 'axial-coding') {
      actions.push({
        id: 'ai-find-relations',
        labelDE: 'KI: Beziehungen finden',
        labelEN: 'AI: Find Relations',
        descriptionDE: 'KI analysiert Kategorienbeziehungen nach dem Paradigmenmodell',
        descriptionEN: 'AI analyzes category relationships using the paradigm model',
        icon: <IconNetwork className="w-4 h-4" />,
        action: () => handlers.onOpenAnalysis?.()
      })
    }
    if (stepId === 'selective-coding') {
      actions.push({
        id: 'ai-core-category',
        labelDE: 'KI: Kernkategorie identifizieren',
        labelEN: 'AI: Identify Core Category',
        descriptionDE: 'KI hilft bei der Identifikation der zentralen Kategorie',
        descriptionEN: 'AI helps identify the central category',
        icon: <IconTargetArrow className="w-4 h-4" />,
        action: () => handlers.onOpenNexus?.()
      })
    }
  }

  // Content Analysis steps
  if (methodologyId === 'content-analysis-mayring') {
    if (stepId === 'category-development') {
      actions.push({
        id: 'ai-suggest-categories',
        labelDE: 'KI: Kategorien vorschlagen',
        labelEN: 'AI: Suggest Categories',
        descriptionDE: 'KI schlägt Kategorien basierend auf deinem Material vor',
        descriptionEN: 'AI suggests categories based on your material',
        icon: <IconWand className="w-4 h-4" />,
        action: () => handlers.onAICoding?.()
      })
    }
    if (stepId === 'coding-process') {
      actions.push({
        id: 'ai-auto-code',
        labelDE: 'KI: Automatisch kodieren',
        labelEN: 'AI: Auto-code',
        descriptionDE: 'KI wendet dein Kategoriensystem auf alle Dokumente an',
        descriptionEN: 'AI applies your category system to all documents',
        icon: <IconRobot className="w-4 h-4" />,
        action: () => handlers.onAICoding?.()
      })
    }
    if (stepId === 'reliability-check') {
      actions.push({
        id: 'ai-irr',
        labelDE: 'KI: IRR mit virtuellem Kodierer',
        labelEN: 'AI: IRR with Virtual Coder',
        descriptionDE: 'KI simuliert einen zweiten Kodierer für Reliabilitätsprüfung',
        descriptionEN: 'AI simulates a second coder for reliability check',
        icon: <IconUsers className="w-4 h-4" />,
        action: () => handlers.onOpenIRR?.()
      })
    }
  }

  // Thematic Analysis steps
  if (methodologyId === 'thematic-analysis') {
    if (stepId === 'initial-coding') {
      actions.push({
        id: 'ai-pattern-coding',
        labelDE: 'KI: Muster erkennen',
        labelEN: 'AI: Detect Patterns',
        descriptionDE: 'KI identifiziert semantische und latente Muster',
        descriptionEN: 'AI identifies semantic and latent patterns',
        icon: <IconSparkles className="w-4 h-4" />,
        action: () => handlers.onAICoding?.()
      })
    }
    if (stepId === 'searching-themes') {
      actions.push({
        id: 'ai-find-themes',
        labelDE: 'KI: Themen clustern',
        labelEN: 'AI: Cluster Themes',
        descriptionDE: 'KI gruppiert deine Codes zu potenziellen Themen',
        descriptionEN: 'AI groups your codes into potential themes',
        icon: <IconNetwork className="w-4 h-4" />,
        action: () => handlers.onOpenAnalysis?.()
      })
    }
  }

  // Default AI help for any step
  if (actions.length === 0) {
    actions.push({
      id: 'ai-help-general',
      labelDE: 'KI-Berater fragen',
      labelEN: 'Ask AI Advisor',
      descriptionDE: 'Frage den KI-Berater zu diesem Schritt',
      descriptionEN: 'Ask the AI advisor about this step',
      icon: <IconBulb className="w-4 h-4" />,
      action: () => handlers.onOpenNexus?.()
    })
  }

  return actions
}

// Task action types
type TaskAction =
  | 'open-documents'
  | 'open-document'
  | 'create-code'
  | 'open-codes'
  | 'create-memo'
  | 'open-memos'
  | 'open-analysis'
  | 'open-irr'
  | 'ai-coding'
  | 'open-team'
  | 'export-report'

interface TaskActionConfig {
  action: TaskAction
  labelDE: string
  labelEN: string
  icon: React.ReactNode
}

// Map task keywords to actions
const getTaskActions = (task: string, taskDE: string): TaskActionConfig[] => {
  const actions: TaskActionConfig[] = []
  const combined = (task + ' ' + taskDE).toLowerCase()

  if (combined.includes('read') || combined.includes('lesen') || combined.includes('data') || combined.includes('daten') || combined.includes('material') || combined.includes('transcript') || combined.includes('transkri')) {
    actions.push({
      action: 'open-documents',
      labelDE: 'Dokumente öffnen',
      labelEN: 'Open Documents',
      icon: <IconFileText className="w-3.5 h-3.5" />
    })
  }

  if (combined.includes('code') || combined.includes('kodier') || combined.includes('categor') || combined.includes('kategor')) {
    actions.push({
      action: 'open-codes',
      labelDE: 'Code-Manager',
      labelEN: 'Code Manager',
      icon: <IconTags className="w-3.5 h-3.5" />
    })
  }

  if (combined.includes('memo') || combined.includes('note') || combined.includes('notiz') || combined.includes('reflex')) {
    actions.push({
      action: 'create-memo',
      labelDE: 'Memo schreiben',
      labelEN: 'Write Memo',
      icon: <IconNote className="w-3.5 h-3.5" />
    })
  }

  if (combined.includes('analy') || combined.includes('frequenc') || combined.includes('häufig') || combined.includes('pattern') || combined.includes('muster')) {
    actions.push({
      action: 'open-analysis',
      labelDE: 'Analyse-Dashboard',
      labelEN: 'Analysis Dashboard',
      icon: <IconChartBar className="w-3.5 h-3.5" />
    })
  }

  if (combined.includes('reliab') || combined.includes('kappa') || combined.includes('inter-coder') || combined.includes('übereinstimmung')) {
    actions.push({
      action: 'open-irr',
      labelDE: 'IRR berechnen',
      labelEN: 'Calculate IRR',
      icon: <IconUsers className="w-3.5 h-3.5" />
    })
  }

  if (combined.includes('report') || combined.includes('bericht') || combined.includes('write-up') || combined.includes('verschrift')) {
    actions.push({
      action: 'export-report',
      labelDE: 'Bericht erstellen',
      labelEN: 'Generate Report',
      icon: <IconFileText className="w-3.5 h-3.5" />
    })
  }

  return actions
}

const METHODOLOGY_ICONS: Record<MethodologyId, React.ReactNode> = {
  'grounded-theory': <IconBrain className="w-6 h-6" />,
  'content-analysis-mayring': <IconList className="w-6 h-6" />,
  'thematic-analysis': <IconNetwork className="w-6 h-6" />,
  'phenomenology': <IconEye className="w-6 h-6" />,
  'narrative-analysis': <IconMessageCircle className="w-6 h-6" />
}

const METHODOLOGY_COLORS: Record<MethodologyId, string> = {
  'grounded-theory': 'from-purple-500 to-indigo-600',
  'content-analysis-mayring': 'from-blue-500 to-cyan-600',
  'thematic-analysis': 'from-green-500 to-emerald-600',
  'phenomenology': 'from-amber-500 to-orange-600',
  'narrative-analysis': 'from-pink-500 to-rose-600'
}

export const MethodologyGuide: React.FC<MethodologyGuideProps> = ({
  projectId,
  isOpen,
  onClose,
  onMinimize,
  language = 'de',
  onOpenMemos,
  onOpenCodes,
  onOpenAnalysis,
  onOpenDocuments,
  onOpenAICoding,
  onOpenIRR,
  onOpenNexus,
  documentCount = 0,
  codeCount = 0,
  codingCount = 0,
  memoCount = 0
}) => {
  const navigate = useNavigate()
  const [state, actions, info] = useMethodologyWorkflow(projectId)
  const [view, setView] = useState<'select' | 'workflow'>(state.methodology ? 'workflow' : 'select')
  const [showReturnHint, setShowReturnHint] = useState(false)

  // Use context minimize if provided, otherwise fallback to close
  const handleMinimize = onMinimize || onClose

  const isDE = language === 'de'
  const methodologies = getAllMethodologies()

  // Show return hint when navigating away
  useEffect(() => {
    if (!isOpen && state.methodology) {
      setShowReturnHint(true)
      const timer = setTimeout(() => setShowReturnHint(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, state.methodology])

  // Handle action - minimize instead of close
  const handleActionWithReturn = (action: TaskAction) => {
    handleMinimize()

    switch (action) {
      case 'open-documents':
        onOpenDocuments?.()
        break
      case 'create-code':
      case 'open-codes':
        onOpenCodes?.()
        break
      case 'create-memo':
      case 'open-memos':
        onOpenMemos?.()
        break
      case 'open-analysis':
        onOpenAnalysis?.()
        break
      case 'open-irr':
        onOpenIRR?.()
        break
      case 'ai-coding':
        onOpenAICoding?.()
        break
      case 'export-report':
        setTimeout(() => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', ctrlKey: true, shiftKey: true }))
        }, 100)
        break
    }
  }

  const selectMethodology = (id: MethodologyId) => {
    actions.initWorkflow(projectId, id)
    setView('workflow')
  }

  const toggleStepComplete = (stepId: string) => {
    if (state.completedSteps.includes(stepId)) {
      actions.uncompleteStep(stepId)
    } else {
      actions.completeStep(stepId)
    }
  }

  // Get step-specific AI actions
  const stepAIActions = info.currentStep && state.methodology
    ? getStepAIActions(info.currentStep.id, state.methodology, {
        onAICoding: () => { handleMinimize(); onOpenAICoding?.() },
        onOpenNexus: () => { handleMinimize(); onOpenNexus?.() },
        onOpenAnalysis: () => { handleMinimize(); onOpenAnalysis?.() },
        onOpenIRR: () => { handleMinimize(); onOpenIRR?.() }
      })
    : []

  // Calculate step progress hints
  const getStepProgress = () => {
    if (!info.currentStep) return null
    const stepId = info.currentStep.id

    // Check what's needed for this step
    if (stepId.includes('coding') || stepId.includes('code')) {
      if (codingCount === 0) return { status: 'empty', messageDE: 'Noch keine Kodierungen', messageEN: 'No codings yet' }
      if (codingCount < 10) return { status: 'low', messageDE: `${codingCount} Kodierungen - mehr für Analyse empfohlen`, messageEN: `${codingCount} codings - more recommended` }
      return { status: 'good', messageDE: `${codingCount} Kodierungen vorhanden`, messageEN: `${codingCount} codings available` }
    }
    if (stepId.includes('memo') || stepId.includes('note')) {
      if (memoCount === 0) return { status: 'empty', messageDE: 'Noch keine Memos', messageEN: 'No memos yet' }
      return { status: 'good', messageDE: `${memoCount} Memos geschrieben`, messageEN: `${memoCount} memos written` }
    }
    if (stepId.includes('reliab') || stepId.includes('irr')) {
      if (codingCount < 20) return { status: 'low', messageDE: 'Mehr Kodierungen für IRR empfohlen', messageEN: 'More codings recommended for IRR' }
      return { status: 'good', messageDE: 'Bereit für Reliabilitätsprüfung', messageEN: 'Ready for reliability check' }
    }
    return null
  }

  const stepProgress = getStepProgress()

  // Floating button is now handled by FloatingGuideButton in MethodologyContext
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-slate-700 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-blue-500/5" />

          <div className="relative flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-500/20 text-primary-400">
              <IconBook className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {isDE ? 'Workflow-Begleiter' : 'Workflow Guide'}
              </h2>
              {info.methodology && (
                <span className="text-sm text-slate-400">
                  {isDE ? info.methodology.nameDE : info.methodology.name}
                </span>
              )}
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            {state.methodology && (
              <button
                onClick={() => { actions.resetWorkflow(); setView('select') }}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white"
              >
                {isDE ? 'Methode wechseln' : 'Change method'}
              </button>
            )}
            <button
              onClick={handleMinimize}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              title={isDE ? 'Minimieren' : 'Minimize'}
            >
              <IconMinimize className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {view === 'select' ? (
            <div className="p-6">
              <p className="text-slate-300 mb-6">
                {isDE
                  ? 'Wähle eine Methode für dein Forschungsprojekt. Der Guide begleitet dich durch jeden Schritt mit KI-Unterstützung.'
                  : 'Choose a methodology for your research project. The guide will accompany you through each step with AI support.'}
              </p>

              <div className="grid gap-4">
                {methodologies.map(method => (
                  <button
                    key={method.id}
                    onClick={() => selectMethodology(method.id)}
                    className="group p-4 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800 text-left transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${METHODOLOGY_COLORS[method.id]} text-white`}>
                        {METHODOLOGY_ICONS[method.id]}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-white group-hover:text-primary-400">
                          {isDE ? method.nameDE : method.name}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {isDE ? method.descriptionDE : method.description}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">{method.authors}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(isDE ? method.bestForDE : method.bestFor).map((use, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-300">
                              {use}
                            </span>
                          ))}
                        </div>
                      </div>
                      <IconChevronRight className="w-5 h-5 text-slate-500 group-hover:text-primary-400 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full">
              {/* Steps Sidebar */}
              <div className="w-64 border-r border-slate-700 p-4 overflow-y-auto">
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                    <span>{isDE ? 'Fortschritt' : 'Progress'}</span>
                    <span>{info.completedCount}/{info.totalSteps}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
                      style={{ width: `${info.progress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  {info.methodology?.steps.map((step, index) => {
                    const isCompleted = state.completedSteps.includes(step.id)
                    const isCurrent = state.currentStepId === step.id

                    return (
                      <button
                        key={step.id}
                        onClick={() => actions.setCurrentStep(step.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                          isCurrent ? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/30' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {isCompleted ? <IconCheck className="w-4 h-4" /> : <span className="text-xs">{index + 1}</span>}
                        </div>
                        <span className="text-sm truncate">{isDE ? step.nameDE : step.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {info.currentStep && (
                  <div>
                    {/* Step Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-semibold text-white">
                          {isDE ? info.currentStep.nameDE : info.currentStep.name}
                        </h3>
                        <p className="text-slate-400 mt-1">
                          {isDE ? info.currentStep.descriptionDE : info.currentStep.description}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleStepComplete(info.currentStep!.id)}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                          state.completedSteps.includes(info.currentStep.id)
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {state.completedSteps.includes(info.currentStep.id) ? (
                          <><IconCheck className="w-4 h-4" />{isDE ? 'Erledigt' : 'Done'}</>
                        ) : (
                          <><IconCircle className="w-4 h-4" />{isDE ? 'Abschließen' : 'Complete'}</>
                        )}
                      </button>
                    </div>

                    {/* Step Progress Indicator */}
                    {stepProgress && (
                      <div className={`mb-4 px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${
                        stepProgress.status === 'good' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        stepProgress.status === 'low' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-700/50 text-slate-400 border border-slate-600'
                      }`}>
                        {stepProgress.status === 'good' ? <IconCheck className="w-4 h-4" /> :
                         stepProgress.status === 'low' ? <IconInfoCircle className="w-4 h-4" /> :
                         <IconCircle className="w-4 h-4" />}
                        <span>{isDE ? stepProgress.messageDE : stepProgress.messageEN}</span>
                      </div>
                    )}

                    {/* KI-Assistent Box */}
                    {stepAIActions.length > 0 && (
                      <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-purple-500/20">
                        <h4 className="text-sm font-medium text-purple-300 mb-3 flex items-center gap-2">
                          <IconSparkles className="w-4 h-4" />
                          {isDE ? 'KI-Assistent für diesen Schritt' : 'AI Assistant for this step'}
                        </h4>
                        <div className="grid gap-2">
                          {stepAIActions.map(aiAction => (
                            <button
                              key={aiAction.id}
                              onClick={aiAction.action}
                              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/30 hover:bg-slate-800 transition-all group text-left"
                            >
                              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30 transition-colors">
                                {aiAction.icon}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-white group-hover:text-purple-300 transition-colors">
                                  {isDE ? aiAction.labelDE : aiAction.labelEN}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {isDE ? aiAction.descriptionDE : aiAction.descriptionEN}
                                </div>
                              </div>
                              <IconArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <IconList className="w-4 h-4" />
                        {isDE ? 'Aufgaben' : 'Tasks'}
                      </h4>
                      <ul className="space-y-3">
                        {info.currentStep.tasks.map((task, i) => {
                          const taskDE = info.currentStep!.tasksDE[i]
                          const taskActions = getTaskActions(task, taskDE)
                          const displayTask = isDE ? taskDE : task

                          return (
                            <li key={i}>
                              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all">
                                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-white font-medium text-xs shadow-lg shadow-primary-500/20">
                                  {i + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="text-slate-200">{displayTask}</p>
                                  {taskActions.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {taskActions.map((actionConfig, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => handleActionWithReturn(actionConfig.action)}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:bg-primary-500/20 transition-all"
                                        >
                                          {actionConfig.icon}
                                          <span>{isDE ? actionConfig.labelDE : actionConfig.labelEN}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>

                    {/* Expected Outputs */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <IconCheck className="w-4 h-4" />
                        {isDE ? 'Erwartete Ergebnisse' : 'Expected Outputs'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(isDE ? info.currentStep.outputsDE : info.currentStep.outputs).map((output, i) => (
                          <span key={i} className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-sm">
                            {output}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    {info.currentStep.tips && info.currentStep.tips.length > 0 && (
                      <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                          <IconBulb className="w-4 h-4" />
                          {isDE ? 'Tipps' : 'Tips'}
                        </h4>
                        <ul className="space-y-1 text-sm text-amber-200/80">
                          {(isDE ? info.currentStep.tipsDE : info.currentStep.tips)?.map((tip, i) => (
                            <li key={i}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <IconNotes className="w-4 h-4" />
                        {isDE ? 'Notizen' : 'Notes'}
                      </h4>
                      <textarea
                        value={state.stepNotes[info.currentStep.id] || ''}
                        onChange={(e) => actions.setStepNote(info.currentStep!.id, e.target.value)}
                        placeholder={isDE ? 'Notizen hier eingeben...' : 'Enter notes here...'}
                        className="w-full h-24 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {view === 'workflow' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/50">
            <button
              onClick={actions.goToPreviousStep}
              disabled={info.isFirstStep}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconChevronLeft className="w-4 h-4" />
              {isDE ? 'Zurück' : 'Back'}
            </button>

            <div className="text-sm text-slate-400">
              {isDE ? 'Schritt' : 'Step'} {info.currentStepIndex + 1} {isDE ? 'von' : 'of'} {info.totalSteps}
            </div>

            <button
              onClick={actions.goToNextStep}
              disabled={info.isLastStep}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDE ? 'Weiter' : 'Next'}
              <IconChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MethodologyGuide
