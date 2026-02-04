/**
 * MethodologyGuide - Optional geführter Workflow durch qualitative Methoden
 * Kann bei Bedarf aus dem Projekt geöffnet werden
 */

import React, { useState } from 'react'
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
  IconNotes
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
  language?: 'de' | 'en'
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
  language = 'de'
}) => {
  const [state, actions, info] = useMethodologyWorkflow(projectId)
  const [view, setView] = useState<'select' | 'workflow'>(state.methodology ? 'workflow' : 'select')
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [stepNote, setStepNote] = useState('')

  const isDE = language === 'de'
  const methodologies = getAllMethodologies()

  // Handle methodology selection
  const selectMethodology = (id: MethodologyId) => {
    actions.initWorkflow(projectId, id)
    setView('workflow')
  }

  // Handle step completion
  const toggleStepComplete = (stepId: string) => {
    if (state.completedSteps.includes(stepId)) {
      actions.uncompleteStep(stepId)
    } else {
      actions.completeStep(stepId)
    }
  }

  // Save step note
  const saveStepNote = (stepId: string) => {
    actions.setStepNote(stepId, stepNote)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <IconBook className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-semibold text-white">
              {isDE ? 'Methoden-Guide' : 'Methodology Guide'}
            </h2>
            {info.methodology && (
              <span className="text-sm text-slate-400">
                — {isDE ? info.methodology.nameDE : info.methodology.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {state.methodology && (
              <button
                onClick={() => {
                  actions.resetWorkflow()
                  setView('select')
                }}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white"
              >
                {isDE ? 'Methode wechseln' : 'Change method'}
              </button>
            )}
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
            // Methodology Selection
            <div className="p-6">
              <p className="text-slate-300 mb-6">
                {isDE
                  ? 'Wähle eine Methode für dein Forschungsprojekt. Der Guide führt dich durch die einzelnen Schritte.'
                  : 'Choose a methodology for your research project. The guide will walk you through each step.'}
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
                        <p className="text-xs text-slate-500 mt-2">
                          {method.authors}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(isDE ? method.bestForDE : method.bestFor).map((use, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-300"
                            >
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
            // Workflow View
            <div className="flex">
              {/* Steps Sidebar */}
              <div className="w-64 border-r border-slate-700 p-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                    <span>{isDE ? 'Fortschritt' : 'Progress'}</span>
                    <span>{info.completedCount}/{info.totalSteps}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all"
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
                          isCurrent
                            ? 'bg-primary-500/20 text-primary-400'
                            : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {isCompleted ? (
                            <IconCheck className="w-4 h-4" />
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </div>
                        <span className="text-sm truncate">
                          {isDE ? step.nameDE : step.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 p-6">
                {info.currentStep && (
                  <div>
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
                          <>
                            <IconCheck className="w-4 h-4" />
                            {isDE ? 'Abgeschlossen' : 'Completed'}
                          </>
                        ) : (
                          <>
                            <IconCircle className="w-4 h-4" />
                            {isDE ? 'Als erledigt markieren' : 'Mark as complete'}
                          </>
                        )}
                      </button>
                    </div>

                    {/* Tasks */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <IconList className="w-4 h-4" />
                        {isDE ? 'Aufgaben' : 'Tasks'}
                      </h4>
                      <ul className="space-y-2">
                        {(isDE ? info.currentStep.tasksDE : info.currentStep.tasks).map((task, i) => (
                          <li key={i} className="flex items-start gap-3 text-slate-300">
                            <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs">{i + 1}</span>
                            </span>
                            {task}
                          </li>
                        ))}
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
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-sm"
                          >
                            {output}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    {info.currentStep.tips && info.currentStep.tips.length > 0 && (
                      <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                          <IconInfoCircle className="w-4 h-4" />
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
                        {isDE ? 'Notizen zu diesem Schritt' : 'Notes for this step'}
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

        {/* Footer with Navigation */}
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
