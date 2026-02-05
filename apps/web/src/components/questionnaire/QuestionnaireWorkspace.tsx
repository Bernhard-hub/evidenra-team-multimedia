/**
 * Questionnaire Workspace
 * EVIDENRA Research - Scientific Questionnaire Development UI
 *
 * Main workspace for questionnaire development featuring:
 * - Scale browser and search
 * - Item generation from qualitative data
 * - Psychometric analysis dashboard
 * - Validation workflow tracker
 * - Export functionality
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
  IconSearch,
  IconPlus,
  IconFileText,
  IconChartBar,
  IconChecks,
  IconDownload,
  IconBulb,
  IconListCheck,
  IconClipboardList,
  IconNetwork,
  IconChevronRight,
  IconChevronDown,
  IconX,
  IconCheck,
  IconAlertTriangle,
  IconInfoCircle,
  IconExternalLink,
  IconCopy,
  IconTrash,
  IconEdit,
  IconEye,
  IconPlayerPlay,
  IconBook,
  IconSparkles,
  IconFilter,
  IconSortAscending,
  IconRefresh,
} from '@tabler/icons-react'

import {
  Scale,
  ScaleItem,
  ConstructDefinition,
  ReliabilityResult,
  ValidationStudyPlan,
} from '@services/questionnaire/types'

import {
  ZISRepository,
  ZISSearchResult,
  ZIS_SCALES_DATABASE,
} from '@services/questionnaire/repositories'

import {
  QuestionnaireService,
  ItemQualityAnalyzer,
  ReliabilityAnalyzer,
  ValidationStudyPlanner,
} from '@services/questionnaire/QuestionnaireService'

import {
  NexusItemGenerator,
  QualitativeCode,
  QualitativeSegment,
} from '@services/questionnaire/NexusItemGenerator'

import {
  ValidationWorkflowManager,
  ValidationProject,
} from '@services/questionnaire/ValidationWorkflow'

import {
  SurveyExporter,
  ExportFormat,
} from '@services/questionnaire/SurveyExporter'

// ============================================================================
// TYPES
// ============================================================================

interface QuestionnaireWorkspaceProps {
  // Project context
  codes: QualitativeCode[]
  segments: QualitativeSegment[]
  language?: 'de' | 'en'

  // Callbacks
  onScaleCreated?: (scale: Scale) => void
  onExport?: (format: ExportFormat, data: string) => void
  onOpenNexus?: (prompt: string) => void
}

type TabId = 'search' | 'generate' | 'validate' | 'export'

interface TabConfig {
  id: TabId
  label: { de: string; en: string }
  icon: React.ReactNode
  description: { de: string; en: string }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABS: TabConfig[] = [
  {
    id: 'search',
    label: { de: 'Skalen suchen', en: 'Search Scales' },
    icon: <IconSearch size={18} />,
    description: {
      de: 'Validierte Skalen aus ZIS/GESIS und anderen Repositories',
      en: 'Validated scales from ZIS/GESIS and other repositories',
    },
  },
  {
    id: 'generate',
    label: { de: 'Items generieren', en: 'Generate Items' },
    icon: <IconBulb size={18} />,
    description: {
      de: 'Neue Items aus qualitativen Daten entwickeln',
      en: 'Develop new items from qualitative data',
    },
  },
  {
    id: 'validate',
    label: { de: 'Validieren', en: 'Validate' },
    icon: <IconChecks size={18} />,
    description: {
      de: 'Psychometrische Analyse und Validierung',
      en: 'Psychometric analysis and validation',
    },
  },
  {
    id: 'export',
    label: { de: 'Exportieren', en: 'Export' },
    icon: <IconDownload size={18} />,
    description: {
      de: 'Survey-Export für LimeSurvey, Qualtrics, REDCap',
      en: 'Survey export for LimeSurvey, Qualtrics, REDCap',
    },
  },
]

const TRANSLATIONS = {
  de: {
    title: 'Fragebogen-Entwicklung',
    subtitle: 'Wissenschaftliche Skalenentwicklung',
    searchPlaceholder: 'Konstrukt oder Skalenname suchen...',
    noResults: 'Keine Ergebnisse gefunden',
    recommendedScales: 'Empfohlene Skalen basierend auf deinen Codes',
    allScales: 'Alle verfügbaren Skalen',
    items: 'Items',
    reliability: 'Reliabilität',
    viewScale: 'Skala ansehen',
    adaptScale: 'Skala adaptieren',
    generateFromCodes: 'Aus Codes generieren',
    selectCodes: 'Codes auswählen',
    generateItems: 'Items generieren',
    itemsPerDimension: 'Items pro Dimension',
    responseFormat: 'Antwortformat',
    generating: 'Generiere...',
    generatedItems: 'Generierte Items',
    qualityCheck: 'Qualitätsprüfung',
    passed: 'Bestanden',
    warning: 'Warnung',
    failed: 'Fehlgeschlagen',
    addToScale: 'Zur Skala hinzufügen',
    createScale: 'Neue Skala erstellen',
    scaleName: 'Skalenname',
    scaleDescription: 'Beschreibung',
    validationPlan: 'Validierungsplan',
    createValidationPlan: 'Plan erstellen',
    phases: 'Phasen',
    contentValidity: 'Content-Validität',
    cognitiveInterviews: 'Kognitive Interviews',
    pilotStudy: 'Pilot-Studie',
    fullValidation: 'Vollvalidierung',
    sampleSize: 'Stichprobe',
    exportFormat: 'Export-Format',
    exportScale: 'Skala exportieren',
    methodsSection: 'Methodenteil generieren',
    askNexus: 'NEXUS fragen',
    noCodesSelected: 'Keine Codes ausgewählt',
    selectCodesFirst: 'Bitte wähle zunächst Codes aus',
  },
  en: {
    title: 'Questionnaire Development',
    subtitle: 'Scientific Scale Development',
    searchPlaceholder: 'Search construct or scale name...',
    noResults: 'No results found',
    recommendedScales: 'Recommended scales based on your codes',
    allScales: 'All available scales',
    items: 'Items',
    reliability: 'Reliability',
    viewScale: 'View scale',
    adaptScale: 'Adapt scale',
    generateFromCodes: 'Generate from codes',
    selectCodes: 'Select codes',
    generateItems: 'Generate items',
    itemsPerDimension: 'Items per dimension',
    responseFormat: 'Response format',
    generating: 'Generating...',
    generatedItems: 'Generated items',
    qualityCheck: 'Quality check',
    passed: 'Passed',
    warning: 'Warning',
    failed: 'Failed',
    addToScale: 'Add to scale',
    createScale: 'Create new scale',
    scaleName: 'Scale name',
    scaleDescription: 'Description',
    validationPlan: 'Validation plan',
    createValidationPlan: 'Create plan',
    phases: 'Phases',
    contentValidity: 'Content validity',
    cognitiveInterviews: 'Cognitive interviews',
    pilotStudy: 'Pilot study',
    fullValidation: 'Full validation',
    sampleSize: 'Sample size',
    exportFormat: 'Export format',
    exportScale: 'Export scale',
    methodsSection: 'Generate methods section',
    askNexus: 'Ask NEXUS',
    noCodesSelected: 'No codes selected',
    selectCodesFirst: 'Please select codes first',
  },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const QuestionnaireWorkspace: React.FC<QuestionnaireWorkspaceProps> = ({
  codes,
  segments,
  language = 'de',
  onScaleCreated,
  onExport,
  onOpenNexus,
}) => {
  const t = TRANSLATIONS[language]

  // State
  const [activeTab, setActiveTab] = useState<TabId>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [generatedItems, setGeneratedItems] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentScale, setCurrentScale] = useState<Scale | null>(null)
  const [expandedScale, setExpandedScale] = useState<string | null>(null)

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return ZIS_SCALES_DATABASE
    }
    return ZISRepository.search({ query: searchQuery, language })
  }, [searchQuery, language])

  // Recommended scales based on codes
  const recommendedScales = useMemo(() => {
    if (codes.length === 0) return []
    return ZISRepository.suggestFromCodes(codes)
  }, [codes])

  // Toggle code selection
  const toggleCodeSelection = useCallback((codeId: string) => {
    setSelectedCodes(prev =>
      prev.includes(codeId)
        ? prev.filter(id => id !== codeId)
        : [...prev, codeId]
    )
  }, [])

  // Generate items from selected codes
  const handleGenerateItems = useCallback(async () => {
    if (selectedCodes.length === 0) return

    setIsGenerating(true)
    try {
      const selectedCodeObjects = codes.filter(c => selectedCodes.includes(c.id))
      const relevantSegments = segments.filter(s => selectedCodes.includes(s.codeId))

      const result = await NexusItemGenerator.generateQuestionnaire(
        selectedCodeObjects,
        relevantSegments,
        {
          itemsPerDimension: 4,
          responseFormat: 'likert5',
          language,
        }
      )

      if (result.generatedItems) {
        setGeneratedItems(result.generatedItems.items)
      }
    } catch (error) {
      console.error('Error generating items:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedCodes, codes, segments, language])

  // Export scale
  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!currentScale) return

    try {
      const result = await SurveyExporter.export(currentScale, {
        format,
        language,
        includeInstructions: true,
      })

      onExport?.(format, result.content)
    } catch (error) {
      console.error('Export error:', error)
    }
  }, [currentScale, language, onExport])

  // Render search tab
  const renderSearchTab = () => (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <IconSearch
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
        />
      </div>

      {/* Recommended scales */}
      {recommendedScales.length > 0 && !searchQuery && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-purple-400 flex items-center gap-2">
            <IconSparkles size={16} />
            {t.recommendedScales}
          </h3>
          <div className="space-y-2">
            {recommendedScales.map((result) => (
              <ScaleCard
                key={result.scale.id}
                scale={result.scale}
                relevance={result.relevance}
                matchedConstructs={result.matchedConstructs}
                isExpanded={expandedScale === result.scale.id}
                onToggle={() => setExpandedScale(
                  expandedScale === result.scale.id ? null : result.scale.id
                )}
                onAdapt={() => {
                  // Convert to Scale and set as current
                  setCurrentScale({
                    id: result.scale.id,
                    name: result.scale.name,
                    description: result.scale.description,
                    constructDefinition: {
                      name: result.scale.constructs[0] || result.scale.name,
                      definition: result.scale.description,
                      dimensions: [],
                    },
                    items: result.scale.items.map((item, i) => ({
                      id: `${result.scale.id}-item-${i}`,
                      text: item,
                      dimensionId: 'main',
                      responseFormat: {
                        type: 'likert',
                        points: 5,
                        labels: [],
                      },
                    })),
                    responseFormat: {
                      type: 'likert',
                      points: result.scale.responseScale.points,
                      labels: result.scale.responseScale.labels,
                    },
                    language,
                    version: '1.0',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  })
                  setActiveTab('validate')
                }}
                language={language}
              />
            ))}
          </div>
        </div>
      )}

      {/* All scales / Search results */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-400">
          {searchQuery ? `${searchResults.length} ${t.noResults.split(' ')[0]}` : t.allScales}
        </h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {searchResults.map((scale) => (
            <ScaleCard
              key={scale.id}
              scale={scale}
              isExpanded={expandedScale === scale.id}
              onToggle={() => setExpandedScale(
                expandedScale === scale.id ? null : scale.id
              )}
              onAdapt={() => {
                setCurrentScale({
                  id: scale.id,
                  name: scale.name,
                  description: scale.description,
                  constructDefinition: {
                    name: scale.constructs[0] || scale.name,
                    definition: scale.description,
                    dimensions: [],
                  },
                  items: scale.items.map((item, i) => ({
                    id: `${scale.id}-item-${i}`,
                    text: item,
                    dimensionId: 'main',
                    responseFormat: {
                      type: 'likert',
                      points: 5,
                      labels: [],
                    },
                  })),
                  responseFormat: {
                    type: 'likert',
                    points: scale.responseScale.points,
                    labels: scale.responseScale.labels,
                  },
                  language,
                  version: '1.0',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })
                setActiveTab('validate')
              }}
              language={language}
            />
          ))}
        </div>
      </div>
    </div>
  )

  // Render generate tab
  const renderGenerateTab = () => (
    <div className="space-y-6">
      {/* Code selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <IconListCheck size={16} />
          {t.selectCodes}
        </h3>
        <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-2 bg-slate-800/30 rounded-xl border border-slate-700/50">
          {codes.map((code) => (
            <button
              key={code.id}
              onClick={() => toggleCodeSelection(code.id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                selectedCodes.includes(code.id)
                  ? 'bg-purple-500/30 border-purple-500/50 text-purple-200'
                  : 'bg-slate-700/50 border-slate-600/50 text-slate-400 hover:text-white'
              } border`}
            >
              {selectedCodes.includes(code.id) && (
                <IconCheck size={12} className="inline mr-1" />
              )}
              {code.name}
            </button>
          ))}
          {codes.length === 0 && (
            <p className="text-slate-500 text-sm p-2">{t.noCodesSelected}</p>
          )}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerateItems}
        disabled={selectedCodes.length === 0 || isGenerating}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <IconRefresh size={18} className="animate-spin" />
            {t.generating}
          </>
        ) : (
          <>
            <IconBulb size={18} />
            {t.generateItems}
          </>
        )}
      </button>

      {/* Generated items */}
      {generatedItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-green-400 flex items-center gap-2">
            <IconChecks size={16} />
            {t.generatedItems} ({generatedItems.length})
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {generatedItems.map((item, index) => (
              <GeneratedItemCard
                key={index}
                item={item}
                index={index}
                language={language}
              />
            ))}
          </div>

          {/* Create scale button */}
          <button
            onClick={() => {
              const newScale: Scale = {
                id: `scale-${Date.now()}`,
                name: language === 'de' ? 'Neue Skala' : 'New Scale',
                description: '',
                constructDefinition: {
                  name: '',
                  definition: '',
                  dimensions: [],
                },
                items: generatedItems.map((item, i) => ({
                  id: `item-${i}`,
                  text: item.text,
                  dimensionId: item.dimension || 'main',
                  responseFormat: {
                    type: 'likert',
                    points: 5,
                    labels: [],
                  },
                })),
                responseFormat: {
                  type: 'likert',
                  points: 5,
                  labels: [],
                },
                language,
                version: '1.0',
                createdAt: new Date(),
                updatedAt: new Date(),
              }
              setCurrentScale(newScale)
              onScaleCreated?.(newScale)
              setActiveTab('validate')
            }}
            className="w-full py-2 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <IconPlus size={16} />
            {t.createScale}
          </button>
        </div>
      )}
    </div>
  )

  // Render validate tab
  const renderValidateTab = () => (
    <div className="space-y-6">
      {currentScale ? (
        <>
          {/* Scale info */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-white">{currentScale.name}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {currentScale.items.length} {t.items}
                </p>
              </div>
              <button
                onClick={() => setCurrentScale(null)}
                className="p-1 rounded hover:bg-slate-700"
              >
                <IconX size={16} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Validation phases */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">{t.phases}</h3>

            <ValidationPhaseCard
              icon={<IconChecks size={18} />}
              title={t.contentValidity}
              description={language === 'de' ? '3-10 Experten bewerten Items' : '3-10 experts rate items'}
              status="pending"
              sampleSize="3-10"
            />

            <ValidationPhaseCard
              icon={<IconBook size={18} />}
              title={t.cognitiveInterviews}
              description={language === 'de' ? 'Think-Aloud & Verbal Probing' : 'Think-aloud & verbal probing'}
              status="pending"
              sampleSize="5-15"
            />

            <ValidationPhaseCard
              icon={<IconChartBar size={18} />}
              title={t.pilotStudy}
              description={language === 'de' ? 'Item-Analyse & Reliabilität' : 'Item analysis & reliability'}
              status="pending"
              sampleSize={`n ≥ ${Math.max(50, currentScale.items.length * 5)}`}
            />

            <ValidationPhaseCard
              icon={<IconNetwork size={18} />}
              title={t.fullValidation}
              description={language === 'de' ? 'EFA/CFA & Konstruktvalidität' : 'EFA/CFA & construct validity'}
              status="pending"
              sampleSize={`n ≥ ${Math.max(200, currentScale.items.length * 10)}`}
            />
          </div>

          {/* Create validation plan button */}
          <button
            onClick={() => {
              const prompt = language === 'de'
                ? `Erstelle einen detaillierten Validierungsplan für meine Skala "${currentScale.name}" mit ${currentScale.items.length} Items nach COSMIN-Richtlinien.`
                : `Create a detailed validation plan for my scale "${currentScale.name}" with ${currentScale.items.length} items according to COSMIN guidelines.`
              onOpenNexus?.(prompt)
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2"
          >
            <IconClipboardList size={18} />
            {t.createValidationPlan}
          </button>
        </>
      ) : (
        <div className="text-center py-12">
          <IconClipboardList size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">
            {language === 'de'
              ? 'Wähle oder erstelle zuerst eine Skala'
              : 'Select or create a scale first'}
          </p>
        </div>
      )}
    </div>
  )

  // Render export tab
  const renderExportTab = () => (
    <div className="space-y-6">
      {currentScale ? (
        <>
          {/* Scale preview */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <h3 className="text-lg font-medium text-white mb-2">{currentScale.name}</h3>
            <p className="text-sm text-slate-400">
              {currentScale.items.length} {t.items}
            </p>
          </div>

          {/* Export formats */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">{t.exportFormat}</h3>

            <ExportFormatCard
              format="limesurvey"
              label="LimeSurvey (.lss)"
              description={language === 'de' ? 'Open-Source Survey-Plattform' : 'Open-source survey platform'}
              icon="🍋"
              onExport={() => handleExport('limesurvey')}
            />

            <ExportFormatCard
              format="qualtrics"
              label="Qualtrics (.qsf)"
              description={language === 'de' ? 'Enterprise Survey-Plattform' : 'Enterprise survey platform'}
              icon="Q"
              onExport={() => handleExport('qualtrics')}
            />

            <ExportFormatCard
              format="redcap"
              label="REDCap"
              description={language === 'de' ? 'Clinical Research Data Capture' : 'Clinical research data capture'}
              icon="R"
              onExport={() => handleExport('redcap')}
            />

            <ExportFormatCard
              format="ddi"
              label="DDI-XML"
              description={language === 'de' ? 'Data Documentation Initiative Standard' : 'Data Documentation Initiative standard'}
              icon="📄"
              onExport={() => handleExport('ddi')}
            />

            <ExportFormatCard
              format="csv"
              label="CSV"
              description={language === 'de' ? 'Einfaches Tabellenformat' : 'Simple table format'}
              icon="📊"
              onExport={() => handleExport('csv')}
            />
          </div>

          {/* Methods section */}
          <button
            onClick={() => {
              const prompt = language === 'de'
                ? `Generiere einen wissenschaftlichen Methodenteil (APA 7) für die Validierung meiner Skala "${currentScale.name}" mit ${currentScale.items.length} Items.`
                : `Generate a scientific methods section (APA 7) for the validation of my scale "${currentScale.name}" with ${currentScale.items.length} items.`
              onOpenNexus?.(prompt)
            }}
            className="w-full py-2 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <IconFileText size={16} />
            {t.methodsSection}
          </button>
        </>
      ) : (
        <div className="text-center py-12">
          <IconDownload size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">
            {language === 'de'
              ? 'Wähle oder erstelle zuerst eine Skala zum Exportieren'
              : 'Select or create a scale to export first'}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">{t.title}</h1>
        <p className="text-sm text-slate-400">{t.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label[language]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'generate' && renderGenerateTab()}
        {activeTab === 'validate' && renderValidateTab()}
        {activeTab === 'export' && renderExportTab()}
      </div>

      {/* NEXUS button */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => onOpenNexus?.('')}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <IconSparkles size={16} />
          {t.askNexus}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ScaleCardProps {
  scale: any
  relevance?: number
  matchedConstructs?: string[]
  isExpanded: boolean
  onToggle: () => void
  onAdapt: () => void
  language: 'de' | 'en'
}

const ScaleCard: React.FC<ScaleCardProps> = ({
  scale,
  relevance,
  matchedConstructs,
  isExpanded,
  onToggle,
  onAdapt,
  language,
}) => {
  const t = TRANSLATIONS[language]

  return (
    <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-800/30">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <IconChevronDown size={16} className="text-slate-400" />
          ) : (
            <IconChevronRight size={16} className="text-slate-400" />
          )}
          <div className="text-left">
            <h4 className="text-sm font-medium text-white">{scale.name}</h4>
            <p className="text-xs text-slate-500">
              {scale.items?.length || 0} {t.items} • α = {scale.psychometrics?.cronbachAlpha?.toFixed(2) || 'N/A'}
            </p>
          </div>
        </div>
        {relevance !== undefined && (
          <div className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs">
            {Math.round(relevance * 100)}%
          </div>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-3 pt-0 space-y-3">
          <p className="text-xs text-slate-400">{scale.description}</p>

          {matchedConstructs && matchedConstructs.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {matchedConstructs.map((construct, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-green-500/20 text-green-300 text-xs"
                >
                  {construct}
                </span>
              ))}
            </div>
          )}

          {/* Items preview */}
          <div className="space-y-1">
            {scale.items?.slice(0, 3).map((item: string, i: number) => (
              <p key={i} className="text-xs text-slate-500 pl-2 border-l border-slate-700">
                {item}
              </p>
            ))}
            {scale.items?.length > 3 && (
              <p className="text-xs text-slate-600">
                +{scale.items?.length || 0 - 3} more...
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {scale.sourceUrl && (
              <a
                href={scale.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 rounded-lg border border-slate-600 text-slate-400 text-xs hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
              >
                <IconExternalLink size={12} />
                {t.viewScale}
              </a>
            )}
            <button
              onClick={onAdapt}
              className="flex-1 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs hover:bg-purple-500/30 transition-colors"
            >
              {t.adaptScale}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface GeneratedItemCardProps {
  item: any
  index: number
  language: 'de' | 'en'
}

const GeneratedItemCard: React.FC<GeneratedItemCardProps> = ({
  item,
  index,
  language,
}) => {
  const t = TRANSLATIONS[language]
  const quality = item.quality || { issues: [], score: 1 }
  const hasIssues = quality.issues?.length > 0

  return (
    <div className={`p-3 rounded-lg border ${
      hasIssues
        ? 'border-amber-500/30 bg-amber-500/5'
        : 'border-green-500/30 bg-green-500/5'
    }`}>
      <div className="flex items-start gap-2">
        <span className="text-xs text-slate-500 font-mono">{index + 1}.</span>
        <div className="flex-1">
          <p className="text-sm text-white">{item.text}</p>
          {item.dimension && (
            <span className="text-xs text-slate-500 mt-1 inline-block">
              {item.dimension}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasIssues ? (
            <IconAlertTriangle size={14} className="text-amber-400" />
          ) : (
            <IconCheck size={14} className="text-green-400" />
          )}
        </div>
      </div>
      {hasIssues && (
        <div className="mt-2 pl-6">
          {quality.issues.map((issue: string, i: number) => (
            <p key={i} className="text-xs text-amber-400">
              • {issue}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

interface ValidationPhaseCardProps {
  icon: React.ReactNode
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed'
  sampleSize: string
}

const ValidationPhaseCard: React.FC<ValidationPhaseCardProps> = ({
  icon,
  title,
  description,
  status,
  sampleSize,
}) => {
  const statusColors = {
    pending: 'border-slate-700 bg-slate-800/30',
    'in-progress': 'border-blue-500/30 bg-blue-500/10',
    completed: 'border-green-500/30 bg-green-500/10',
  }

  const statusIcons = {
    pending: <div className="w-2 h-2 rounded-full bg-slate-500" />,
    'in-progress': <IconRefresh size={12} className="text-blue-400 animate-spin" />,
    completed: <IconCheck size={12} className="text-green-400" />,
  }

  return (
    <div className={`p-3 rounded-lg border ${statusColors[status]} flex items-center gap-3`}>
      <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end gap-1 mb-1">
          {statusIcons[status]}
        </div>
        <span className="text-xs text-slate-500">{sampleSize}</span>
      </div>
    </div>
  )
}

interface ExportFormatCardProps {
  format: string
  label: string
  description: string
  icon: string
  onExport: () => void
}

const ExportFormatCard: React.FC<ExportFormatCardProps> = ({
  format,
  label,
  description,
  icon,
  onExport,
}) => (
  <button
    onClick={onExport}
    className="w-full p-3 rounded-lg border border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 transition-colors flex items-center gap-3 text-left"
  >
    <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center text-lg">
      {icon}
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-medium text-white">{label}</h4>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
    <IconDownload size={16} className="text-slate-400" />
  </button>
)

export default QuestionnaireWorkspace
