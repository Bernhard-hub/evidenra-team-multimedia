import React, { useState, useCallback } from 'react'
import {
  IconBook,
  IconChevronDown,
  IconChevronRight,
  IconDownload,
  IconLoader2,
  IconSparkles,
  IconCheck,
  IconX,
  IconCopy,
  IconRefresh,
  IconFileText,
  IconSettings,
  IconShieldCheck,
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle
} from '@tabler/icons-react'
import {
  MasterThesisGenerator,
  CHAPTER_TEMPLATES,
  type CompleteChapter,
  type ChapterSection,
  type ResearchData
} from '@services/MasterThesisGenerator'
import {
  CitationValidatorUltra,
  type ArticleValidationReport
} from '@services/CitationValidatorUltra'

interface ThesisGeneratorProps {
  apiKey: string
  researchData: ResearchData
  onClose: () => void
}

type AcademicLevel = 'bachelor' | 'master' | 'phd'
type CitationStyle = 'APA' | 'Harvard' | 'IEEE' | 'Chicago'

interface ThesisConfig {
  title: string
  topic: string
  researchQuestions: string[]
  methodology: string
  academicLevel: AcademicLevel
  citationStyle: CitationStyle
}

const ACADEMIC_LEVELS: { id: AcademicLevel; label: string; targetWords: number }[] = [
  { id: 'bachelor', label: 'Bachelorarbeit', targetWords: 2500 },
  { id: 'master', label: 'Masterarbeit', targetWords: 4000 },
  { id: 'phd', label: 'Dissertation', targetWords: 6000 }
]

const CITATION_STYLES: { id: CitationStyle; label: string }[] = [
  { id: 'APA', label: 'APA 7th Edition' },
  { id: 'Harvard', label: 'Harvard' },
  { id: 'IEEE', label: 'IEEE' },
  { id: 'Chicago', label: 'Chicago' }
]

export const ThesisGenerator: React.FC<ThesisGeneratorProps> = ({
  apiKey,
  researchData,
  onClose
}) => {
  // Config state
  const [config, setConfig] = useState<ThesisConfig>({
    title: researchData.projectName || '',
    topic: '',
    researchQuestions: researchData.researchQuestion ? [researchData.researchQuestion] : [''],
    methodology: researchData.methodologyName || 'Qualitative Inhaltsanalyse',
    academicLevel: 'master',
    citationStyle: 'APA'
  })

  // UI state
  const [activeStep, setActiveStep] = useState<'config' | 'chapters' | 'preview'>('config')
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [generatedChapters, setGeneratedChapters] = useState<Map<number, CompleteChapter>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [validationReport, setValidationReport] = useState<ArticleValidationReport | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [showValidation, setShowValidation] = useState(false)

  const chapters = CHAPTER_TEMPLATES.de
  const levelConfig = ACADEMIC_LEVELS.find(l => l.id === config.academicLevel)!

  // Handle research question changes
  const updateResearchQuestion = (index: number, value: string) => {
    const updated = [...config.researchQuestions]
    updated[index] = value
    setConfig({ ...config, researchQuestions: updated })
  }

  const addResearchQuestion = () => {
    if (config.researchQuestions.length < 5) {
      setConfig({ ...config, researchQuestions: [...config.researchQuestions, ''] })
    }
  }

  const removeResearchQuestion = (index: number) => {
    if (config.researchQuestions.length > 1) {
      const updated = config.researchQuestions.filter((_, i) => i !== index)
      setConfig({ ...config, researchQuestions: updated })
    }
  }

  // Generate chapter
  const generateChapter = useCallback(async (chapterNum: number) => {
    if (!apiKey) {
      setError('Kein Claude API Key konfiguriert. Bitte in den Einstellungen hinterlegen.')
      return
    }

    setIsGenerating(true)
    setSelectedChapter(chapterNum)
    setError(null)
    setProgress(0)
    setProgressMessage('Initialisiere...')

    try {
      const chapterTemplate = chapters[chapterNum as keyof typeof chapters]

      // Build summary of previous chapters
      let previousSummary = ''
      for (let i = 1; i < chapterNum; i++) {
        const prev = generatedChapters.get(i)
        if (prev) {
          previousSummary += `Kapitel ${i} (${prev.chapterTitle}): ${prev.abstract}\n`
        }
      }

      const chapter = await MasterThesisGenerator.generateCompleteChapter(
        {
          thesisTitle: config.title,
          thesisTopic: config.topic,
          chapterNumber: chapterNum,
          chapterTitle: chapterTemplate.title,
          targetWords: chapterNum === 1 || chapterNum === 6 ? levelConfig.targetWords / 2 : levelConfig.targetWords,
          previousChaptersSummary: previousSummary || undefined,
          researchQuestions: config.researchQuestions.filter(q => q.trim()),
          methodology: config.methodology
        },
        apiKey,
        {
          language: 'de',
          academicLevel: config.academicLevel,
          citationStyle: config.citationStyle,
          researchData,
          onProgress: (percent, message) => {
            setProgress(percent)
            setProgressMessage(message)
          }
        }
      )

      setGeneratedChapters(prev => new Map(prev).set(chapterNum, chapter))
      setActiveStep('preview')
      setExpandedChapter(chapterNum)

    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message || 'Fehler bei der Generierung')
    } finally {
      setIsGenerating(false)
      setSelectedChapter(null)
    }
  }, [apiKey, chapters, config, generatedChapters, levelConfig, researchData])

  // Copy section to clipboard
  const copySection = async (section: ChapterSection) => {
    await navigator.clipboard.writeText(section.content)
    setCopiedSection(section.sectionNumber)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  // Export chapter to markdown
  const exportChapter = (chapter: CompleteChapter) => {
    const markdown = MasterThesisGenerator.exportToMarkdown(chapter)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Kapitel_${chapter.chapterNumber}_${chapter.chapterTitle.replace(/\s+/g, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Validate citations in all generated chapters
  const validateCitations = useCallback(async () => {
    if (generatedChapters.size === 0) return

    setIsValidating(true)
    setShowValidation(true)

    try {
      // Combine all chapter content
      let fullText = ''
      for (const [, chapter] of generatedChapters) {
        fullText += chapter.sections.map(s => s.content).join('\n\n')
      }

      // Prepare documents for validation
      const documents = (researchData.documents || []).map(doc => ({
        name: doc.name || doc.id || 'Unknown',
        content: doc.content || ''
      }))

      if (documents.length === 0) {
        setValidationReport({
          totalCitations: 0,
          validCitations: 0,
          invalidCitations: 0,
          suspiciousCitations: 0,
          validationRate: 0,
          citationScore: 0,
          levelBreakdown: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 },
          results: [],
          hallucinations: [],
          warnings: [],
          autoFixSuggestions: [],
          summary: 'Keine Quelldokumente vorhanden für Validierung.',
          skipped: true,
          skipReason: 'Keine Dokumente in Forschungsdaten verfügbar'
        })
        return
      }

      // Run validation
      const report = CitationValidatorUltra.validateArticle(fullText, documents)
      setValidationReport(report)

    } catch (err) {
      console.error('Validation error:', err)
      setValidationReport({
        totalCitations: 0,
        validCitations: 0,
        invalidCitations: 0,
        suspiciousCitations: 0,
        validationRate: 0,
        citationScore: 0,
        levelBreakdown: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 },
        results: [],
        hallucinations: [],
        warnings: ['Fehler bei der Validierung: ' + (err as Error).message],
        autoFixSuggestions: [],
        summary: 'Validierung fehlgeschlagen',
        skipped: true,
        skipReason: (err as Error).message
      })
    } finally {
      setIsValidating(false)
    }
  }, [generatedChapters, researchData])

  // Export all chapters
  const exportAllChapters = () => {
    let fullMarkdown = `# ${config.title}\n\n`
    fullMarkdown += `*${config.topic}*\n\n`
    fullMarkdown += `---\n\n`

    for (let i = 1; i <= 6; i++) {
      const chapter = generatedChapters.get(i)
      if (chapter) {
        fullMarkdown += MasterThesisGenerator.exportToMarkdown(chapter)
        fullMarkdown += '\n\n---\n\n'
      }
    }

    const blob = new Blob([fullMarkdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${config.title.replace(/\s+/g, '_')}_Volltext.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <IconBook size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Thesis Generator</h2>
              <p className="text-sm text-slate-400">
                {generatedChapters.size > 0
                  ? `${generatedChapters.size}/6 Kapitel generiert`
                  : 'Generiere Kapitel für deine Abschlussarbeit'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {generatedChapters.size > 0 && (
              <>
                <button
                  onClick={validateCitations}
                  disabled={isValidating}
                  className="px-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-sm font-medium flex items-center gap-2"
                >
                  {isValidating ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconShieldCheck size={16} />
                  )}
                  Zitate prüfen
                </button>
                <button
                  onClick={exportAllChapters}
                  className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium flex items-center gap-2"
                >
                  <IconDownload size={16} />
                  Alle exportieren
                </button>
              </>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
            >
              <IconSettings size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
            >
              <IconX size={20} />
            </button>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-800/30">
          {['config', 'chapters', 'preview'].map((step, i) => (
            <React.Fragment key={step}>
              <button
                onClick={() => setActiveStep(step as any)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeStep === step
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {step === 'config' && '1. Konfiguration'}
                {step === 'chapters' && '2. Kapitel'}
                {step === 'preview' && '3. Vorschau'}
              </button>
              {i < 2 && <IconChevronRight size={16} className="text-slate-600" />}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
              <IconX size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Fehler</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Configuration */}
          {activeStep === 'config' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Titel der Arbeit *
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  placeholder="z.B. Motivation in der digitalen Arbeitswelt"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Thema / Abstract *
                </label>
                <textarea
                  value={config.topic}
                  onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                  placeholder="Kurze Beschreibung des Themas und der Zielsetzung..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Forschungsfragen
                </label>
                <div className="space-y-2">
                  {config.researchQuestions.map((q, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={q}
                        onChange={(e) => updateResearchQuestion(i, e.target.value)}
                        placeholder={`Forschungsfrage ${i + 1}...`}
                        className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                      {config.researchQuestions.length > 1 && (
                        <button
                          onClick={() => removeResearchQuestion(i)}
                          className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400"
                        >
                          <IconX size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  {config.researchQuestions.length < 5 && (
                    <button
                      onClick={addResearchQuestion}
                      className="text-sm text-amber-400 hover:text-amber-300"
                    >
                      + Weitere Forschungsfrage
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Methodik
                </label>
                <input
                  type="text"
                  value={config.methodology}
                  onChange={(e) => setConfig({ ...config, methodology: e.target.value })}
                  placeholder="z.B. Qualitative Inhaltsanalyse nach Mayring"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Arbeit
                  </label>
                  <select
                    value={config.academicLevel}
                    onChange={(e) => setConfig({ ...config, academicLevel: e.target.value as AcademicLevel })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    {ACADEMIC_LEVELS.map(level => (
                      <option key={level.id} value={level.id}>{level.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Zitationsstil
                  </label>
                  <select
                    value={config.citationStyle}
                    onChange={(e) => setConfig({ ...config, citationStyle: e.target.value as CitationStyle })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    {CITATION_STYLES.map(style => (
                      <option key={style.id} value={style.id}>{style.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Research data info */}
              {researchData.documents && researchData.documents.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <p className="text-sm text-slate-400 mb-2">Verfügbare Forschungsdaten:</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-blue-400">{researchData.documents?.length || 0} Dokumente</span>
                    <span className="text-purple-400">{researchData.categories?.length || 0} Codes</span>
                    <span className="text-green-400">{researchData.codings?.length || 0} Kodierungen</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setActiveStep('chapters')}
                disabled={!config.title.trim() || !config.topic.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/20 transition-all"
              >
                Weiter zu Kapiteln
              </button>
            </div>
          )}

          {/* Step 2: Chapters */}
          {activeStep === 'chapters' && (
            <div className="space-y-3">
              {Object.entries(chapters).map(([num, chapter]) => {
                const chapterNum = parseInt(num)
                const generated = generatedChapters.get(chapterNum)
                const isExpanded = expandedChapter === chapterNum
                const isCurrentlyGenerating = isGenerating && selectedChapter === chapterNum

                return (
                  <div
                    key={num}
                    className={`rounded-xl border transition-colors ${
                      generated
                        ? 'bg-green-500/5 border-green-500/30'
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => setExpandedChapter(isExpanded ? null : chapterNum)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          generated
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {generated ? <IconCheck size={18} /> : num}
                        </div>
                        <div>
                          <h3 className="font-medium text-white">
                            Kapitel {num}: {chapter.title}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {chapter.sections.length} Abschnitte
                            {generated && ` • ${generated.totalWordCount.toLocaleString()} Wörter`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {generated && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              exportChapter(generated)
                            }}
                            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
                            title="Exportieren"
                          >
                            <IconDownload size={18} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            generateChapter(chapterNum)
                          }}
                          disabled={isGenerating}
                          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                            isCurrentlyGenerating
                              ? 'bg-amber-500/20 text-amber-400'
                              : generated
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                : 'bg-amber-500 text-white hover:bg-amber-600'
                          }`}
                        >
                          {isCurrentlyGenerating ? (
                            <>
                              <IconLoader2 size={16} className="animate-spin" />
                              {progress}%
                            </>
                          ) : generated ? (
                            <>
                              <IconRefresh size={16} />
                              Neu
                            </>
                          ) : (
                            <>
                              <IconSparkles size={16} />
                              Generieren
                            </>
                          )}
                        </button>
                        {isExpanded ? (
                          <IconChevronDown size={20} className="text-slate-500" />
                        ) : (
                          <IconChevronRight size={20} className="text-slate-500" />
                        )}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-700/50 pt-3">
                        {isCurrentlyGenerating ? (
                          <div className="space-y-3">
                            <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-sm text-slate-400 text-center">{progressMessage}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-slate-500 mb-3">Geplante Abschnitte:</p>
                            {chapter.sections.map((section, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-sm text-slate-300"
                              >
                                <span className="text-slate-500">{num}.{i + 1}</span>
                                <span>{section}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Step 3: Preview */}
          {activeStep === 'preview' && (
            <div className="space-y-6">
              {/* Validation Panel */}
              {showValidation && validationReport && (
                <div className="rounded-xl border border-slate-700 overflow-hidden">
                  <div className={`p-4 flex items-center justify-between ${
                    validationReport.skipped
                      ? 'bg-slate-800'
                      : validationReport.validationRate >= 0.8
                        ? 'bg-green-500/10'
                        : validationReport.validationRate >= 0.5
                          ? 'bg-amber-500/10'
                          : 'bg-red-500/10'
                  }`}>
                    <div className="flex items-center gap-3">
                      {validationReport.skipped ? (
                        <IconInfoCircle size={24} className="text-slate-400" />
                      ) : validationReport.validationRate >= 0.8 ? (
                        <IconCircleCheck size={24} className="text-green-400" />
                      ) : validationReport.validationRate >= 0.5 ? (
                        <IconAlertTriangle size={24} className="text-amber-400" />
                      ) : (
                        <IconAlertTriangle size={24} className="text-red-400" />
                      )}
                      <div>
                        <h3 className="font-bold text-white">Zitat-Validierung</h3>
                        <p className="text-sm text-slate-400">
                          {validationReport.skipped
                            ? validationReport.skipReason
                            : validationReport.summary}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowValidation(false)}
                      className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
                    >
                      <IconX size={18} />
                    </button>
                  </div>

                  {!validationReport.skipped && validationReport.totalCitations > 0 && (
                    <div className="p-4 space-y-4">
                      {/* Score & Stats */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-lg bg-slate-800/50">
                          <div className={`text-2xl font-bold ${
                            validationReport.citationScore >= 80 ? 'text-green-400' :
                            validationReport.citationScore >= 50 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {validationReport.citationScore}
                          </div>
                          <div className="text-xs text-slate-500">Score</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-slate-800/50">
                          <div className="text-2xl font-bold text-green-400">{validationReport.validCitations}</div>
                          <div className="text-xs text-slate-500">Valide</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-slate-800/50">
                          <div className="text-2xl font-bold text-amber-400">{validationReport.suspiciousCitations}</div>
                          <div className="text-xs text-slate-500">Verdächtig</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-slate-800/50">
                          <div className="text-2xl font-bold text-red-400">{validationReport.invalidCitations}</div>
                          <div className="text-xs text-slate-500">Ungültig</div>
                        </div>
                      </div>

                      {/* Level Breakdown */}
                      <div className="p-3 rounded-lg bg-slate-800/30">
                        <h4 className="text-sm font-medium text-slate-300 mb-2">5-Level Validierung</h4>
                        <div className="flex gap-2 text-xs">
                          <span className="px-2 py-1 rounded bg-green-500/20 text-green-400">
                            L1: {validationReport.levelBreakdown.level1}
                          </span>
                          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                            L2: {validationReport.levelBreakdown.level2}
                          </span>
                          <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                            L3: {validationReport.levelBreakdown.level3}
                          </span>
                          <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400">
                            L4: {validationReport.levelBreakdown.level4}
                          </span>
                          <span className="px-2 py-1 rounded bg-slate-500/20 text-slate-400">
                            L5: {validationReport.levelBreakdown.level5}
                          </span>
                        </div>
                      </div>

                      {/* Hallucinations Warning */}
                      {validationReport.hallucinations.length > 0 && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                            <IconAlertTriangle size={16} />
                            Mögliche Halluzinationen ({validationReport.hallucinations.length})
                          </h4>
                          <ul className="space-y-2 text-sm">
                            {validationReport.hallucinations.slice(0, 5).map((h, i) => (
                              <li key={i} className="text-slate-300">
                                <span className="text-red-300 font-mono text-xs">
                                  {h.citation.fullCitation}
                                </span>
                                <span className="text-slate-500 ml-2">— {h.issue}</span>
                              </li>
                            ))}
                            {validationReport.hallucinations.length > 5 && (
                              <li className="text-slate-500">
                                ...und {validationReport.hallucinations.length - 5} weitere
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Recommendation */}
                      <div className={`p-3 rounded-lg text-sm ${
                        validationReport.validationRate >= 0.8
                          ? 'bg-green-500/10 text-green-300'
                          : validationReport.validationRate >= 0.5
                            ? 'bg-amber-500/10 text-amber-300'
                            : 'bg-red-500/10 text-red-300'
                      }`}>
                        {validationReport.validationRate >= 0.8
                          ? 'Exzellent! Zitate sind gut belegt. Export empfohlen.'
                          : validationReport.validationRate >= 0.5
                            ? 'Mittlere Qualität. Verdächtige Einträge vor Export prüfen.'
                            : 'Probleme erkannt. Manuelle Überprüfung vor Export erforderlich.'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {generatedChapters.size === 0 ? (
                <div className="text-center py-12">
                  <IconFileText size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400">Noch keine Kapitel generiert</p>
                  <button
                    onClick={() => setActiveStep('chapters')}
                    className="mt-4 text-amber-400 hover:text-amber-300"
                  >
                    Zurück zu Kapiteln
                  </button>
                </div>
              ) : (
                Array.from(generatedChapters.entries())
                  .sort(([a], [b]) => a - b)
                  .map(([num, chapter]) => (
                    <div key={num} className="rounded-xl border border-slate-700 overflow-hidden">
                      <div className="bg-slate-800 p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-white">
                            Kapitel {chapter.chapterNumber}: {chapter.chapterTitle}
                          </h3>
                          <p className="text-sm text-slate-400 mt-1">
                            {chapter.totalWordCount.toLocaleString()} Wörter •
                            {chapter.sections.length} Abschnitte •
                            Qualität: {Math.round(chapter.qualityScore * 100)}%
                          </p>
                        </div>
                        <button
                          onClick={() => exportChapter(chapter)}
                          className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 text-sm flex items-center gap-2"
                        >
                          <IconDownload size={16} />
                          Export
                        </button>
                      </div>

                      {/* Abstract */}
                      <div className="p-4 bg-slate-800/30 border-b border-slate-700">
                        <p className="text-sm text-slate-400 italic">{chapter.abstract}</p>
                      </div>

                      {/* Sections */}
                      <div className="divide-y divide-slate-800">
                        {chapter.sections.map((section) => (
                          <div key={section.sectionNumber} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-slate-200">
                                {section.sectionNumber} {section.sectionTitle}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                  {section.wordCount} Wörter
                                </span>
                                <button
                                  onClick={() => copySection(section)}
                                  className="p-1.5 rounded hover:bg-slate-700 text-slate-400"
                                  title="Kopieren"
                                >
                                  {copiedSection === section.sectionNumber ? (
                                    <IconCheck size={14} className="text-green-400" />
                                  ) : (
                                    <IconCopy size={14} />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {section.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="absolute top-16 right-4 w-72 bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-xl z-10">
            <h4 className="font-medium text-white mb-3">Einstellungen</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Ziel-Wörter/Kapitel</span>
                <span className="text-white">{levelConfig.targetWords.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sprache</span>
                <span className="text-white">Deutsch</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">API Key</span>
                <span className={apiKey ? 'text-green-400' : 'text-red-400'}>
                  {apiKey ? 'Konfiguriert' : 'Fehlt'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ThesisGenerator
