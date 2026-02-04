/**
 * useMethodologyWorkflow Hook
 * Tracks progress through methodology workflow steps
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  METHODOLOGIES,
  type MethodologyId,
  type WorkflowStep
} from '@/services/MethodologyWorkflow'

const STORAGE_KEY = 'evidenra-methodology-workflow'

export interface WorkflowState {
  projectId: string | null
  methodology: MethodologyId | null
  currentStepId: string | null
  completedSteps: string[]
  stepNotes: Record<string, string>
  researchQuestion: string
  startedAt: string | null
}

export interface WorkflowActions {
  initWorkflow: (projectId: string, methodology: MethodologyId, researchQuestion?: string) => void
  setCurrentStep: (stepId: string) => void
  completeStep: (stepId: string) => void
  uncompleteStep: (stepId: string) => void
  setStepNote: (stepId: string, note: string) => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  resetWorkflow: () => void
}

export interface WorkflowInfo {
  methodology: typeof METHODOLOGIES[MethodologyId] | null
  currentStep: WorkflowStep | null
  nextStep: WorkflowStep | null
  previousStep: WorkflowStep | null
  currentStepIndex: number
  totalSteps: number
  completedCount: number
  progress: number
  isFirstStep: boolean
  isLastStep: boolean
  isComplete: boolean
}

const initialState: WorkflowState = {
  projectId: null,
  methodology: null,
  currentStepId: null,
  completedSteps: [],
  stepNotes: {},
  researchQuestion: '',
  startedAt: null
}

/**
 * Hook for managing methodology workflow state
 */
export function useMethodologyWorkflow(projectId?: string): [WorkflowState, WorkflowActions, WorkflowInfo] {
  const [state, setState] = useState<WorkflowState>(() => {
    // Try to load from localStorage
    if (projectId) {
      try {
        const saved = localStorage.getItem(`${STORAGE_KEY}-${projectId}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.methodology && METHODOLOGIES[parsed.methodology as MethodologyId]) {
            return { ...initialState, ...parsed }
          }
        }
      } catch (e) {
        console.error('Failed to load workflow state:', e)
      }
    }
    return initialState
  })

  // Persist state changes
  useEffect(() => {
    if (state.projectId && state.methodology) {
      try {
        localStorage.setItem(`${STORAGE_KEY}-${state.projectId}`, JSON.stringify(state))
      } catch (e) {
        console.error('Failed to save workflow state:', e)
      }
    }
  }, [state])

  // Get current methodology
  const methodology = useMemo(() => {
    return state.methodology ? METHODOLOGIES[state.methodology] : null
  }, [state.methodology])

  // Get current step index
  const currentStepIndex = useMemo(() => {
    if (!methodology || !state.currentStepId) return -1
    return methodology.steps.findIndex(s => s.id === state.currentStepId)
  }, [methodology, state.currentStepId])

  // Actions
  const initWorkflow = useCallback((projectId: string, methodologyId: MethodologyId, researchQuestion?: string) => {
    const method = METHODOLOGIES[methodologyId]
    if (!method) return

    setState({
      projectId,
      methodology: methodologyId,
      currentStepId: method.steps[0]?.id || null,
      completedSteps: [],
      stepNotes: {},
      researchQuestion: researchQuestion || '',
      startedAt: new Date().toISOString()
    })
  }, [])

  const setCurrentStep = useCallback((stepId: string) => {
    setState(prev => ({ ...prev, currentStepId: stepId }))
  }, [])

  const completeStep = useCallback((stepId: string) => {
    setState(prev => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(stepId)
        ? prev.completedSteps
        : [...prev.completedSteps, stepId]
    }))
  }, [])

  const uncompleteStep = useCallback((stepId: string) => {
    setState(prev => ({
      ...prev,
      completedSteps: prev.completedSteps.filter(id => id !== stepId)
    }))
  }, [])

  const setStepNote = useCallback((stepId: string, note: string) => {
    setState(prev => ({
      ...prev,
      stepNotes: { ...prev.stepNotes, [stepId]: note }
    }))
  }, [])

  const goToNextStep = useCallback(() => {
    if (!methodology || currentStepIndex < 0) return
    const nextIndex = currentStepIndex + 1
    if (nextIndex < methodology.steps.length) {
      setState(prev => ({
        ...prev,
        currentStepId: methodology.steps[nextIndex].id
      }))
    }
  }, [methodology, currentStepIndex])

  const goToPreviousStep = useCallback(() => {
    if (!methodology || currentStepIndex <= 0) return
    const prevIndex = currentStepIndex - 1
    setState(prev => ({
      ...prev,
      currentStepId: methodology.steps[prevIndex].id
    }))
  }, [methodology, currentStepIndex])

  const resetWorkflow = useCallback(() => {
    if (state.projectId) {
      try {
        localStorage.removeItem(`${STORAGE_KEY}-${state.projectId}`)
      } catch (e) {
        console.error('Failed to clear workflow state:', e)
      }
    }
    setState(initialState)
  }, [state.projectId])

  // Computed info
  const info: WorkflowInfo = useMemo(() => {
    const totalSteps = methodology?.steps.length || 0
    const completedCount = state.completedSteps.length

    return {
      methodology,
      currentStep: methodology?.steps[currentStepIndex] || null,
      nextStep: methodology?.steps[currentStepIndex + 1] || null,
      previousStep: currentStepIndex > 0 ? methodology?.steps[currentStepIndex - 1] || null : null,
      currentStepIndex,
      totalSteps,
      completedCount,
      progress: totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0,
      isFirstStep: currentStepIndex === 0,
      isLastStep: currentStepIndex === totalSteps - 1,
      isComplete: completedCount === totalSteps && totalSteps > 0
    }
  }, [methodology, currentStepIndex, state.completedSteps])

  const actions: WorkflowActions = {
    initWorkflow,
    setCurrentStep,
    completeStep,
    uncompleteStep,
    setStepNote,
    goToNextStep,
    goToPreviousStep,
    resetWorkflow
  }

  return [state, actions, info]
}

export default useMethodologyWorkflow
