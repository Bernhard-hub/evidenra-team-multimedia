/**
 * MethodologyContext - Globaler Workflow-Kontext
 *
 * Macht den Methoden-Guide überall verfügbar:
 * - Floating Button auf allen Seiten
 * - Workflow-Status für NEXUS
 * - Kontextbezogene Hilfe
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useMethodologyWorkflow } from '@/hooks/useMethodologyWorkflow'
import { getMethodology, type MethodologyId, type WorkflowStep } from '@/services/MethodologyWorkflow'
import {
  IconBook,
  IconChevronRight,
  IconSparkles
} from '@tabler/icons-react'

interface MethodologyContextType {
  // State
  isGuideOpen: boolean
  isMinimized: boolean
  currentProjectId: string | null

  // Workflow info
  methodologyId: MethodologyId | null
  methodologyName: string | null
  currentStep: WorkflowStep | null
  currentStepIndex: number
  totalSteps: number
  progress: number

  // Actions
  openGuide: () => void
  closeGuide: () => void
  minimizeGuide: () => void
  maximizeGuide: () => void
  setProjectId: (id: string | null) => void

  // For NEXUS context
  getWorkflowContext: () => WorkflowContext | null
}

export interface WorkflowContext {
  methodology: string
  methodologyDE: string
  currentStep: string
  currentStepDE: string
  stepDescription: string
  stepDescriptionDE: string
  tasks: string[]
  tasksDE: string[]
  tips: string[]
  tipsDE: string[]
  progress: number
  stepIndex: number
  totalSteps: number
}

const MethodologyContext = createContext<MethodologyContextType | null>(null)

export function MethodologyProvider({ children }: { children: React.ReactNode }) {
  const [isGuideOpen, setIsGuideOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)

  // Get workflow state for current project
  const [state, actions, info] = useMethodologyWorkflow(currentProjectId || '')

  const openGuide = useCallback(() => {
    setIsGuideOpen(true)
    setIsMinimized(false)
  }, [])

  const closeGuide = useCallback(() => {
    setIsGuideOpen(false)
    setIsMinimized(false)
  }, [])

  const minimizeGuide = useCallback(() => {
    setIsMinimized(true)
  }, [])

  const maximizeGuide = useCallback(() => {
    setIsMinimized(false)
  }, [])

  const setProjectId = useCallback((id: string | null) => {
    setCurrentProjectId(id)
  }, [])

  // Get workflow context for NEXUS
  const getWorkflowContext = useCallback((): WorkflowContext | null => {
    if (!state.methodology || !info.methodology || !info.currentStep) {
      return null
    }

    return {
      methodology: info.methodology.name,
      methodologyDE: info.methodology.nameDE,
      currentStep: info.currentStep.name,
      currentStepDE: info.currentStep.nameDE,
      stepDescription: info.currentStep.description,
      stepDescriptionDE: info.currentStep.descriptionDE,
      tasks: info.currentStep.tasks,
      tasksDE: info.currentStep.tasksDE,
      tips: info.currentStep.tips || [],
      tipsDE: info.currentStep.tipsDE || [],
      progress: info.progress,
      stepIndex: info.currentStepIndex,
      totalSteps: info.totalSteps
    }
  }, [state.methodology, info])

  const value: MethodologyContextType = {
    isGuideOpen,
    isMinimized,
    currentProjectId,
    methodologyId: state.methodology,
    methodologyName: info.methodology?.name || null,
    currentStep: info.currentStep,
    currentStepIndex: info.currentStepIndex,
    totalSteps: info.totalSteps,
    progress: info.progress,
    openGuide,
    closeGuide,
    minimizeGuide,
    maximizeGuide,
    setProjectId,
    getWorkflowContext
  }

  return (
    <MethodologyContext.Provider value={value}>
      {children}
    </MethodologyContext.Provider>
  )
}

export function useMethodologyContext() {
  const context = useContext(MethodologyContext)
  if (!context) {
    throw new Error('useMethodologyContext must be used within MethodologyProvider')
  }
  return context
}

/**
 * Floating Guide Button - Zeigt sich überall wenn Guide aktiv & minimiert
 */
export function FloatingGuideButton() {
  const {
    isMinimized,
    currentProjectId,
    methodologyId,
    currentStep,
    progress,
    maximizeGuide,
    openGuide
  } = useMethodologyContext()

  // Only show if we have an active workflow and it's minimized or there's a workflow to resume
  const shouldShow = currentProjectId && methodologyId && isMinimized

  if (!shouldShow) return null

  const methodology = methodologyId ? getMethodology(methodologyId) : null

  return (
    <button
      onClick={() => {
        maximizeGuide()
        openGuide()
      }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-500 text-white shadow-2xl shadow-primary-500/30 hover:scale-105 hover:shadow-primary-500/40 transition-all duration-300 animate-in slide-in-from-bottom-4 group"
    >
      <div className="relative">
        <IconBook className="w-5 h-5" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      </div>

      <div className="flex flex-col items-start">
        <span className="font-medium text-sm">Workflow-Guide</span>
        {currentStep && (
          <span className="text-xs text-white/70">
            {currentStep.nameDE}
          </span>
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-white/70">{Math.round(progress)}%</span>
      </div>

      <IconChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
}

/**
 * Hook um NEXUS mit Workflow-Kontext zu versorgen
 */
export function useNexusWorkflowContext() {
  const { getWorkflowContext, currentStep, methodologyId } = useMethodologyContext()

  const buildNexusPrompt = useCallback((userMessage: string): string => {
    const context = getWorkflowContext()

    if (!context) {
      return userMessage
    }

    // Build context-aware system message
    const contextInfo = `
[WORKFLOW-KONTEXT]
Methode: ${context.methodologyDE} (${context.methodology})
Aktueller Schritt: ${context.currentStepDE} (${context.stepIndex + 1}/${context.totalSteps})
Beschreibung: ${context.stepDescriptionDE}

Aufgaben in diesem Schritt:
${context.tasksDE.map((t, i) => `${i + 1}. ${t}`).join('\n')}

${context.tipsDE.length > 0 ? `Tipps:\n${context.tipsDE.map(t => `• ${t}`).join('\n')}` : ''}

Fortschritt: ${Math.round(context.progress)}%
[/WORKFLOW-KONTEXT]

Der Nutzer arbeitet gerade an diesem Schritt. Hilf ihm dabei, die Aufgaben zu erfüllen. Beziehe dich auf die Methodik und gib konkrete, praktische Hinweise.

Nutzer-Frage: ${userMessage}
`
    return contextInfo
  }, [getWorkflowContext])

  return {
    hasWorkflowContext: !!methodologyId,
    currentStep,
    buildNexusPrompt,
    getWorkflowContext
  }
}

export default MethodologyContext
