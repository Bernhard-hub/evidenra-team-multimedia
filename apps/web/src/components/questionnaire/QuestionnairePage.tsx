/**
 * Questionnaire Page
 * EVIDENRA Research - Full-Featured Questionnaire Development Page
 *
 * Main page component that integrates all questionnaire development features:
 * - Scale browser for finding validated instruments
 * - Item generator for creating new items from qualitative data
 * - Scale editor for modifying and creating scales
 * - Validation dashboard for tracking validation progress
 * - Psychometric report viewer for analysis results
 * - Item quality checker for real-time quality analysis
 */

import React, { useState, useCallback, useMemo } from 'react'
import {
  IconSearch,
  IconBulb,
  IconEdit,
  IconChartBar,
  IconChecks,
  IconFileText,
  IconX,
  IconMaximize,
  IconMinimize,
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
  IconSettings,
  IconDownload,
  IconSparkles,
} from '@tabler/icons-react'

import { Scale } from '@services/questionnaire/types'
import { QualitativeCode, QualitativeSegment } from '@services/questionnaire/NexusItemGenerator'
import { ValidationProject } from '@services/questionnaire/ValidationWorkflow'
import { ComprehensivePsychometricReport } from '@services/questionnaire/PsychometricEngine'

import { QuestionnaireWorkspace } from './QuestionnaireWorkspace'
import { ScaleEditor } from './ScaleEditor'
import { ScaleBrowser } from './ScaleBrowser'
import { ValidationDashboard } from './ValidationDashboard'
import { PsychometricReport } from './PsychometricReport'
import { ItemQualityChecker } from './ItemQualityChecker'

// ============================================================================
// TYPES
// ============================================================================

interface QuestionnairePageProps {
  // Project data
  codes: QualitativeCode[]
  segments: QualitativeSegment[]

  // Existing scales (if any)
  scales?: Scale[]
  activeScaleId?: string

  // Callbacks
  onScaleCreate?: (scale: Scale) => void
  onScaleUpdate?: (scale: Scale) => void
  onScaleDelete?: (scaleId: string) => void
  onExport?: (format: string, data: string) => void
  onOpenNexus?: (prompt: string) => void

  // Settings
  language?: 'de' | 'en'
}

type ViewType = 'workspace' | 'browser' | 'editor' | 'validation' | 'report' | 'quality'

interface ViewConfig {
  id: ViewType
  label: { de: string; en: string }
  icon: React.ReactNode
  description: { de: string; en: string }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VIEWS: ViewConfig[] = [
  {
    id: 'workspace',
    label: { de: 'Arbeitsbereich', en: 'Workspace' },
    icon: <IconBulb size={20} />,
    description: {
      de: 'Hauptarbeitsbereich für Fragebogenentwicklung',
      en: 'Main workspace for questionnaire development',
    },
  },
  {
    id: 'browser',
    label: { de: 'Skalen-Browser', en: 'Scale Browser' },
    icon: <IconSearch size={20} />,
    description: {
      de: 'Validierte Skalen durchsuchen',
      en: 'Browse validated scales',
    },
  },
  {
    id: 'editor',
    label: { de: 'Skalen-Editor', en: 'Scale Editor' },
    icon: <IconEdit size={20} />,
    description: {
      de: 'Skalen bearbeiten und erstellen',
      en: 'Edit and create scales',
    },
  },
  {
    id: 'validation',
    label: { de: 'Validierung', en: 'Validation' },
    icon: <IconChecks size={20} />,
    description: {
      de: 'Validierungsfortschritt verfolgen',
      en: 'Track validation progress',
    },
  },
  {
    id: 'report',
    label: { de: 'Bericht', en: 'Report' },
    icon: <IconChartBar size={20} />,
    description: {
      de: 'Psychometrische Ergebnisse',
      en: 'Psychometric results',
    },
  },
  {
    id: 'quality',
    label: { de: 'Qualität', en: 'Quality' },
    icon: <IconFileText size={20} />,
    description: {
      de: 'Item-Qualität prüfen',
      en: 'Check item quality',
    },
  },
]

const TRANSLATIONS = {
  de: {
    title: 'Fragebogenentwicklung',
    subtitle: 'Wissenschaftliche Skalenentwicklung mit EVIDENRA',
    myScales: 'Meine Skalen',
    newScale: 'Neue Skala',
    noScales: 'Noch keine Skalen erstellt',
    createFirst: 'Erstelle deine erste Skala oder adaptiere eine existierende',
    items: 'Items',
    lastEdited: 'Zuletzt bearbeitet',
    openEditor: 'Im Editor öffnen',
    startValidation: 'Validierung starten',
    viewReport: 'Bericht anzeigen',
    deleteScale: 'Skala löschen',
    confirmDelete: 'Bist du sicher, dass du diese Skala löschen möchtest?',
    nexusHelp: 'NEXUS-Hilfe',
    settings: 'Einstellungen',
  },
  en: {
    title: 'Questionnaire Development',
    subtitle: 'Scientific scale development with EVIDENRA',
    myScales: 'My Scales',
    newScale: 'New Scale',
    noScales: 'No scales created yet',
    createFirst: 'Create your first scale or adapt an existing one',
    items: 'Items',
    lastEdited: 'Last edited',
    openEditor: 'Open in editor',
    startValidation: 'Start validation',
    viewReport: 'View report',
    deleteScale: 'Delete scale',
    confirmDelete: 'Are you sure you want to delete this scale?',
    nexusHelp: 'NEXUS Help',
    settings: 'Settings',
  },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const QuestionnairePage: React.FC<QuestionnairePageProps> = ({
  codes,
  segments,
  scales = [],
  activeScaleId,
  onScaleCreate,
  onScaleUpdate,
  onScaleDelete,
  onExport,
  onOpenNexus,
  language = 'de',
}) => {
  const t = TRANSLATIONS[language]

  // State
  const [activeView, setActiveView] = useState<ViewType>('workspace')
  const [selectedScaleId, setSelectedScaleId] = useState<string | null>(activeScaleId || null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [validationProjects, setValidationProjects] = useState<Record<string, ValidationProject>>({})
  const [psychometricReports, setPsychometricReports] = useState<Record<string, ComprehensivePsychometricReport>>({})

  // Get selected scale
  const selectedScale = useMemo(() =>
    scales.find(s => s.id === selectedScaleId) || null,
    [scales, selectedScaleId]
  )

  // Handle scale selection from browser
  const handleAdaptScale = useCallback((zisScale: any) => {
    const newScale: Scale = {
      id: `scale-${Date.now()}`,
      name: zisScale.name,
      description: zisScale.description,
      constructDefinition: {
        name: zisScale.constructs[0] || zisScale.name,
        definition: zisScale.description,
        dimensions: [],
      },
      items: zisScale.items.map((item: string, i: number) => ({
        id: `item-${i}`,
        text: item,
        dimensionId: 'main',
        responseFormat: {
          type: 'likert',
          points: zisScale.responseScale.points,
          labels: zisScale.responseScale.labels,
        },
      })),
      responseFormat: {
        type: 'likert',
        points: zisScale.responseScale.points,
        labels: zisScale.responseScale.labels,
      },
      language,
      version: '1.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      sourceScale: {
        id: zisScale.id,
        name: zisScale.name,
        reference: zisScale.reference,
      },
    }

    onScaleCreate?.(newScale)
    setSelectedScaleId(newScale.id)
    setActiveView('editor')
  }, [language, onScaleCreate])

  // Handle scale update from editor
  const handleScaleUpdate = useCallback((updatedScale: Scale) => {
    onScaleUpdate?.(updatedScale)
  }, [onScaleUpdate])

  // Create new empty scale
  const handleCreateNewScale = useCallback(() => {
    const newScale: Scale = {
      id: `scale-${Date.now()}`,
      name: language === 'de' ? 'Neue Skala' : 'New Scale',
      description: '',
      constructDefinition: {
        name: '',
        definition: '',
        dimensions: [],
      },
      items: [],
      responseFormat: {
        type: 'likert',
        points: 5,
        labels: language === 'de'
          ? ['Stimme gar nicht zu', 'Stimme nicht zu', 'Neutral', 'Stimme zu', 'Stimme voll zu']
          : ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      },
      language,
      version: '1.0',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    onScaleCreate?.(newScale)
    setSelectedScaleId(newScale.id)
    setActiveView('editor')
  }, [language, onScaleCreate])

  // Start validation for a scale
  const handleStartValidation = useCallback((scaleId: string) => {
    const scale = scales.find(s => s.id === scaleId)
    if (!scale) return

    const project: ValidationProject = {
      id: `validation-${Date.now()}`,
      scaleId,
      scaleName: scale.name,
      status: 'in-progress',
      phases: {
        contentValidity: { status: 'pending' },
        cognitiveInterviews: { status: 'pending' },
        pilotStudy: { status: 'pending' },
        fullValidation: { status: 'pending' },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setValidationProjects(prev => ({ ...prev, [scaleId]: project }))
    setSelectedScaleId(scaleId)
    setActiveView('validation')
  }, [scales])

  // Render sidebar
  const renderSidebar = () => (
    <div className={`h-full border-r border-slate-800 bg-slate-900/50 flex flex-col transition-all ${
      sidebarCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center z-10 hover:bg-slate-700"
      >
        {sidebarCollapsed ? (
          <IconChevronRight size={14} className="text-slate-400" />
        ) : (
          <IconChevronLeft size={14} className="text-slate-400" />
        )}
      </button>

      {/* Views navigation */}
      <div className="p-2 border-b border-slate-800">
        {VIEWS.map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`w-full p-2 rounded-lg flex items-center gap-3 transition-colors ${
              activeView === view.id
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title={sidebarCollapsed ? view.label[language] : undefined}
          >
            {view.icon}
            {!sidebarCollapsed && (
              <span className="text-sm">{view.label[language]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Scales list */}
      {!sidebarCollapsed && (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs text-slate-500 uppercase">{t.myScales}</h3>
            <button
              onClick={handleCreateNewScale}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-purple-400"
              title={t.newScale}
            >
              <IconPlus size={14} />
            </button>
          </div>

          {scales.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-slate-500">{t.noScales}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {scales.map(scale => (
                <button
                  key={scale.id}
                  onClick={() => {
                    setSelectedScaleId(scale.id)
                    setActiveView('editor')
                  }}
                  className={`w-full p-2 rounded-lg text-left transition-colors ${
                    selectedScaleId === scale.id
                      ? 'bg-purple-500/20 border border-purple-500/30'
                      : 'hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <p className="text-sm text-white truncate">{scale.name}</p>
                  <p className="text-xs text-slate-500">
                    {scale.items?.length || 0} {t.items}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom actions */}
      {!sidebarCollapsed && (
        <div className="p-2 border-t border-slate-800">
          <button
            onClick={() => onOpenNexus?.(
              language === 'de'
                ? 'Hilf mir bei der Fragebogenentwicklung. Was kann ich tun?'
                : 'Help me with questionnaire development. What can I do?'
            )}
            className="w-full p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-sm hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <IconSparkles size={16} />
            {t.nexusHelp}
          </button>
        </div>
      )}
    </div>
  )

  // Render main content
  const renderContent = () => {
    switch (activeView) {
      case 'workspace':
        return (
          <QuestionnaireWorkspace
            codes={codes}
            segments={segments}
            language={language}
            onScaleCreated={(scale) => {
              onScaleCreate?.(scale)
              setSelectedScaleId(scale.id)
            }}
            onExport={onExport}
            onOpenNexus={onOpenNexus}
          />
        )

      case 'browser':
        return (
          <ScaleBrowser
            language={language}
            onAdaptScale={handleAdaptScale}
            onOpenNexus={onOpenNexus}
          />
        )

      case 'editor':
        if (!selectedScale) {
          return (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <IconEdit size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">
                  {language === 'de'
                    ? 'Wähle eine Skala aus oder erstelle eine neue'
                    : 'Select a scale or create a new one'}
                </p>
                <button
                  onClick={handleCreateNewScale}
                  className="mt-4 px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                >
                  {t.newScale}
                </button>
              </div>
            </div>
          )
        }
        return (
          <ScaleEditor
            scale={selectedScale}
            onChange={handleScaleUpdate}
            language={language}
          />
        )

      case 'validation':
        if (!selectedScale) {
          return (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <IconChecks size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">
                  {language === 'de'
                    ? 'Wähle eine Skala für die Validierung aus'
                    : 'Select a scale for validation'}
                </p>
              </div>
            </div>
          )
        }
        return (
          <ValidationDashboard
            project={validationProjects[selectedScale.id] || {
              id: `temp-${selectedScale.id}`,
              scaleId: selectedScale.id,
              scaleName: selectedScale.name,
              status: 'pending',
              phases: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            }}
            scale={selectedScale}
            onStartPhase={(phase) => console.log('Start phase:', phase)}
            onOpenNexus={onOpenNexus}
            language={language}
          />
        )

      case 'report':
        if (!selectedScale || !psychometricReports[selectedScale.id]) {
          return (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <IconChartBar size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">
                  {language === 'de'
                    ? 'Noch keine psychometrischen Daten verfügbar'
                    : 'No psychometric data available yet'}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  {language === 'de'
                    ? 'Führe zuerst eine Pilotstudie oder Vollvalidierung durch'
                    : 'Complete a pilot study or full validation first'}
                </p>
              </div>
            </div>
          )
        }
        return (
          <PsychometricReport
            report={psychometricReports[selectedScale.id]}
            scale={selectedScale}
            language={language}
          />
        )

      case 'quality':
        return (
          <ItemQualityChecker
            initialItems={selectedScale?.items.map(i => i.text) || []}
            onRequestAISuggestion={(item, issues) => {
              onOpenNexus?.(
                language === 'de'
                  ? `Verbessere dieses Fragebogen-Item: "${item}". Probleme: ${issues.join(', ')}`
                  : `Improve this questionnaire item: "${item}". Issues: ${issues.join(', ')}`
              )
            }}
            language={language}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex bg-slate-900">
      {/* Sidebar */}
      <div className="relative">
        {renderSidebar()}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  )
}

export default QuestionnairePage
