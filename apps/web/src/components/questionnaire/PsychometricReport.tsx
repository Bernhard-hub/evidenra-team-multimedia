/**
 * Psychometric Report Viewer
 * EVIDENRA Research - Visual Psychometric Analysis Results
 *
 * Features:
 * - Reliability metrics visualization
 * - Factor analysis results display
 * - Validity metrics with thresholds
 * - Item-level statistics
 * - Export to various formats
 */

import React, { useState, useMemo } from 'react'
import {
  IconChartBar,
  IconChartDots,
  IconChartPie,
  IconNetwork,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconMinus,
  IconDownload,
  IconPrinter,
  IconShare,
  IconChevronDown,
  IconChevronRight,
  IconInfoCircle,
  IconTrendingUp,
  IconTrendingDown,
} from '@tabler/icons-react'

import {
  Scale,
  ReliabilityResult,
  FactorAnalysisResult,
  ItemStatistics,
} from '@services/questionnaire/types'

import { ComprehensivePsychometricReport } from '@services/questionnaire/PsychometricEngine'

import {
  RELIABILITY_THRESHOLDS,
  VALIDITY_THRESHOLDS,
  MODEL_FIT_THRESHOLDS,
} from '@services/questionnaire/knowledge'

// ============================================================================
// TYPES
// ============================================================================

interface PsychometricReportProps {
  report: ComprehensivePsychometricReport
  scale: Scale
  onExport?: (format: 'pdf' | 'word' | 'latex') => void
  language?: 'de' | 'en'
}

type ReportSection = 'overview' | 'reliability' | 'validity' | 'factor-analysis' | 'items'

// ============================================================================
// CONSTANTS
// ============================================================================

const TRANSLATIONS = {
  de: {
    title: 'Psychometrischer Bericht',
    overview: 'Übersicht',
    reliability: 'Reliabilität',
    validity: 'Validität',
    factorAnalysis: 'Faktorenanalyse',
    itemStatistics: 'Item-Statistiken',
    scaleName: 'Skala',
    sampleSize: 'Stichprobe',
    items: 'Items',
    dimensions: 'Dimensionen',
    cronbachAlpha: "Cronbach's α",
    mcdonaldOmega: "McDonald's ω",
    splitHalf: 'Split-Half',
    guttmanLambda: 'Guttman λ6',
    itemTotal: 'Item-Total r',
    alphaIfDeleted: 'α wenn gelöscht',
    mean: 'Mittelwert',
    sd: 'Standardabweichung',
    skewness: 'Schiefe',
    kurtosis: 'Kurtosis',
    floorEffect: 'Bodeneffekt',
    ceilingEffect: 'Deckeneffekt',
    factorLoadings: 'Faktorladungen',
    eigenvalues: 'Eigenwerte',
    varianceExplained: 'Erklärte Varianz',
    parallelAnalysis: 'Parallel-Analyse',
    optimalFactors: 'Optimale Faktoren',
    modelFit: 'Model Fit',
    cfi: 'CFI',
    tli: 'TLI',
    rmsea: 'RMSEA',
    srmr: 'SRMR',
    ave: 'AVE',
    compositeReliability: 'Composite Reliability',
    htmt: 'HTMT',
    fornellLarcker: 'Fornell-Larcker',
    excellent: 'Exzellent',
    good: 'Gut',
    acceptable: 'Akzeptabel',
    questionable: 'Fragwürdig',
    poor: 'Schlecht',
    unacceptable: 'Unakzeptabel',
    threshold: 'Schwellenwert',
    interpretation: 'Interpretation',
    recommendation: 'Empfehlung',
    exportPDF: 'Als PDF exportieren',
    exportWord: 'Als Word exportieren',
    exportLatex: 'Als LaTeX exportieren',
    print: 'Drucken',
    noData: 'Keine Daten verfügbar',
  },
  en: {
    title: 'Psychometric Report',
    overview: 'Overview',
    reliability: 'Reliability',
    validity: 'Validity',
    factorAnalysis: 'Factor Analysis',
    itemStatistics: 'Item Statistics',
    scaleName: 'Scale',
    sampleSize: 'Sample Size',
    items: 'Items',
    dimensions: 'Dimensions',
    cronbachAlpha: "Cronbach's α",
    mcdonaldOmega: "McDonald's ω",
    splitHalf: 'Split-Half',
    guttmanLambda: 'Guttman λ6',
    itemTotal: 'Item-Total r',
    alphaIfDeleted: 'α if deleted',
    mean: 'Mean',
    sd: 'Standard Deviation',
    skewness: 'Skewness',
    kurtosis: 'Kurtosis',
    floorEffect: 'Floor Effect',
    ceilingEffect: 'Ceiling Effect',
    factorLoadings: 'Factor Loadings',
    eigenvalues: 'Eigenvalues',
    varianceExplained: 'Variance Explained',
    parallelAnalysis: 'Parallel Analysis',
    optimalFactors: 'Optimal Factors',
    modelFit: 'Model Fit',
    cfi: 'CFI',
    tli: 'TLI',
    rmsea: 'RMSEA',
    srmr: 'SRMR',
    ave: 'AVE',
    compositeReliability: 'Composite Reliability',
    htmt: 'HTMT',
    fornellLarcker: 'Fornell-Larcker',
    excellent: 'Excellent',
    good: 'Good',
    acceptable: 'Acceptable',
    questionable: 'Questionable',
    poor: 'Poor',
    unacceptable: 'Unacceptable',
    threshold: 'Threshold',
    interpretation: 'Interpretation',
    recommendation: 'Recommendation',
    exportPDF: 'Export as PDF',
    exportWord: 'Export as Word',
    exportLatex: 'Export as LaTeX',
    print: 'Print',
    noData: 'No data available',
  },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PsychometricReport: React.FC<PsychometricReportProps> = ({
  report,
  scale,
  onExport,
  language = 'de',
}) => {
  const t = TRANSLATIONS[language]

  // State
  const [activeSection, setActiveSection] = useState<ReportSection>('overview')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Toggle item expansion
  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // Navigation tabs
  const tabs: { id: ReportSection; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t.overview, icon: <IconChartPie size={16} /> },
    { id: 'reliability', label: t.reliability, icon: <IconChartBar size={16} /> },
    { id: 'validity', label: t.validity, icon: <IconCheck size={16} /> },
    { id: 'factor-analysis', label: t.factorAnalysis, icon: <IconNetwork size={16} /> },
    { id: 'items', label: t.itemStatistics, icon: <IconChartDots size={16} /> },
  ]

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{t.title}</h2>
          <p className="text-sm text-slate-400">{scale.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExport?.('pdf')}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={t.exportPDF}
          >
            <IconDownload size={18} />
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={t.print}
          >
            <IconPrinter size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeSection === tab.id
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === 'overview' && (
          <OverviewSection report={report} scale={scale} language={language} />
        )}
        {activeSection === 'reliability' && (
          <ReliabilitySection report={report} language={language} />
        )}
        {activeSection === 'validity' && (
          <ValiditySection report={report} language={language} />
        )}
        {activeSection === 'factor-analysis' && (
          <FactorAnalysisSection report={report} language={language} />
        )}
        {activeSection === 'items' && (
          <ItemStatisticsSection
            report={report}
            scale={scale}
            expandedItems={expandedItems}
            onToggleItem={toggleItem}
            language={language}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

interface SectionProps {
  report: ComprehensivePsychometricReport
  language: 'de' | 'en'
}

const OverviewSection: React.FC<SectionProps & { scale: Scale }> = ({
  report,
  scale,
  language,
}) => {
  const t = TRANSLATIONS[language]

  // Calculate overall quality score
  const qualityScore = useMemo(() => {
    let score = 0
    let total = 0

    // Reliability
    if (report.reliability?.cronbachAlpha) {
      total++
      if (report.reliability.cronbachAlpha >= 0.90) score += 1
      else if (report.reliability.cronbachAlpha >= 0.80) score += 0.75
      else if (report.reliability.cronbachAlpha >= 0.70) score += 0.5
    }

    // Validity (AVE)
    if (report.validity?.ave) {
      total++
      if (report.validity.ave >= 0.50) score += 1
      else if (report.validity.ave >= 0.40) score += 0.5
    }

    // Model Fit
    if (report.factorAnalysis?.modelFit) {
      const fit = report.factorAnalysis.modelFit
      total++
      let fitScore = 0
      if (fit.cfi && fit.cfi >= 0.95) fitScore++
      if (fit.tli && fit.tli >= 0.95) fitScore++
      if (fit.rmsea && fit.rmsea <= 0.06) fitScore++
      if (fit.srmr && fit.srmr <= 0.08) fitScore++
      score += fitScore / 4
    }

    return total > 0 ? Math.round((score / total) * 100) : 0
  }, [report])

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label={t.sampleSize}
          value={report.sampleSize}
          icon={<IconChartBar size={20} />}
        />
        <StatCard
          label={t.items}
          value={scale.items?.length || 0}
          icon={<IconChartDots size={20} />}
        />
        <StatCard
          label={t.dimensions}
          value={scale.dimensions?.length || 1}
          icon={<IconNetwork size={20} />}
        />
        <StatCard
          label={t.cronbachAlpha}
          value={report.reliability?.cronbachAlpha?.toFixed(2) || 'N/A'}
          icon={<IconChartPie size={20} />}
          status={getReliabilityStatus(report.reliability?.cronbachAlpha || 0)}
        />
      </div>

      {/* Quality score gauge */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 mb-4 text-center">
          {language === 'de' ? 'Gesamtqualität' : 'Overall Quality'}
        </h3>
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-700"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${qualityScore * 4.4} 440`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">{qualityScore}%</span>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-slate-400 mt-4">
          {qualityScore >= 80
            ? (language === 'de' ? 'Ausgezeichnete psychometrische Qualität' : 'Excellent psychometric quality')
            : qualityScore >= 60
            ? (language === 'de' ? 'Gute psychometrische Qualität' : 'Good psychometric quality')
            : qualityScore >= 40
            ? (language === 'de' ? 'Akzeptable psychometrische Qualität' : 'Acceptable psychometric quality')
            : (language === 'de' ? 'Verbesserung empfohlen' : 'Improvement recommended')}
        </p>
      </div>

      {/* Key metrics summary */}
      <div className="grid grid-cols-2 gap-4">
        <MetricSummaryCard
          title={t.reliability}
          metrics={[
            { label: t.cronbachAlpha, value: report.reliability?.cronbachAlpha, threshold: '≥ 0.70' },
            { label: t.mcdonaldOmega, value: report.reliability?.mcdonaldOmega, threshold: '≥ 0.70' },
          ]}
          language={language}
        />
        <MetricSummaryCard
          title={t.validity}
          metrics={[
            { label: t.ave, value: report.validity?.ave, threshold: '≥ 0.50' },
            { label: t.compositeReliability, value: report.validity?.compositeReliability, threshold: '≥ 0.70' },
          ]}
          language={language}
        />
      </div>
    </div>
  )
}

const ReliabilitySection: React.FC<SectionProps> = ({ report, language }) => {
  const t = TRANSLATIONS[language]
  const reliability = report.reliability

  if (!reliability) {
    return <NoDataMessage language={language} />
  }

  return (
    <div className="space-y-6">
      {/* Main reliability metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label={t.cronbachAlpha}
          value={reliability.cronbachAlpha}
          threshold="≥ 0.70"
          interpretation={getReliabilityInterpretation(reliability.cronbachAlpha, language)}
          status={getReliabilityStatus(reliability.cronbachAlpha)}
        />
        <MetricCard
          label={t.mcdonaldOmega}
          value={reliability.mcdonaldOmega}
          threshold="≥ 0.70"
          interpretation={getReliabilityInterpretation(reliability.mcdonaldOmega || 0, language)}
          status={getReliabilityStatus(reliability.mcdonaldOmega || 0)}
        />
        <MetricCard
          label={t.splitHalf}
          value={reliability.splitHalf}
          threshold="≥ 0.70"
          interpretation={getReliabilityInterpretation(reliability.splitHalf || 0, language)}
          status={getReliabilityStatus(reliability.splitHalf || 0)}
        />
        <MetricCard
          label={t.guttmanLambda}
          value={reliability.guttmanLambda6}
          threshold="≥ 0.70"
          interpretation={getReliabilityInterpretation(reliability.guttmanLambda6 || 0, language)}
          status={getReliabilityStatus(reliability.guttmanLambda6 || 0)}
        />
      </div>

      {/* Item-total correlations */}
      {reliability.itemTotalCorrelations && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h3 className="text-sm font-medium text-white mb-4">{t.itemTotal}</h3>
          <div className="space-y-2">
            {reliability.itemTotalCorrelations.map((corr, i) => (
              <ItemCorrelationBar
                key={i}
                itemNumber={i + 1}
                correlation={corr}
                threshold={0.30}
              />
            ))}
          </div>
        </div>
      )}

      {/* Alpha if deleted */}
      {reliability.alphaIfDeleted && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h3 className="text-sm font-medium text-white mb-4">{t.alphaIfDeleted}</h3>
          <div className="space-y-2">
            {reliability.alphaIfDeleted.map((alpha, i) => (
              <AlphaIfDeletedBar
                key={i}
                itemNumber={i + 1}
                alphaIfDeleted={alpha}
                currentAlpha={reliability.cronbachAlpha}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const ValiditySection: React.FC<SectionProps> = ({ report, language }) => {
  const t = TRANSLATIONS[language]
  const validity = report.validity

  if (!validity) {
    return <NoDataMessage language={language} />
  }

  return (
    <div className="space-y-6">
      {/* Convergent validity */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <h3 className="text-sm font-medium text-white mb-4">
          {language === 'de' ? 'Konvergente Validität' : 'Convergent Validity'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label={t.ave}
            value={validity.ave}
            threshold="≥ 0.50"
            interpretation={
              validity.ave >= 0.50
                ? (language === 'de' ? 'Akzeptable konvergente Validität' : 'Acceptable convergent validity')
                : (language === 'de' ? 'Verbesserung empfohlen' : 'Improvement recommended')
            }
            status={validity.ave >= 0.50 ? 'good' : 'poor'}
          />
          <MetricCard
            label={t.compositeReliability}
            value={validity.compositeReliability}
            threshold="≥ 0.70"
            interpretation={
              validity.compositeReliability >= 0.70
                ? (language === 'de' ? 'Akzeptable Composite Reliability' : 'Acceptable composite reliability')
                : (language === 'de' ? 'Verbesserung empfohlen' : 'Improvement recommended')
            }
            status={validity.compositeReliability >= 0.70 ? 'good' : 'poor'}
          />
        </div>
      </div>

      {/* Discriminant validity */}
      {validity.htmt && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h3 className="text-sm font-medium text-white mb-4">
            {language === 'de' ? 'Diskriminante Validität (HTMT)' : 'Discriminant Validity (HTMT)'}
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            {language === 'de'
              ? 'Alle Werte sollten < 0.85 (streng) oder < 0.90 (liberal) sein'
              : 'All values should be < 0.85 (strict) or < 0.90 (liberal)'}
          </p>
          <HTMTMatrix htmt={validity.htmt} language={language} />
        </div>
      )}
    </div>
  )
}

const FactorAnalysisSection: React.FC<SectionProps> = ({ report, language }) => {
  const t = TRANSLATIONS[language]
  const fa = report.factorAnalysis

  if (!fa) {
    return <NoDataMessage language={language} />
  }

  return (
    <div className="space-y-6">
      {/* Factor count */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-400">{t.optimalFactors}</h3>
          <p className="text-3xl font-bold text-white mt-2">{fa.optimalFactors}</p>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'de' ? 'Basierend auf Parallel-Analyse' : 'Based on parallel analysis'}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-400">{t.varianceExplained}</h3>
          <p className="text-3xl font-bold text-white mt-2">
            {fa.varianceExplained ? `${Math.round(fa.varianceExplained * 100)}%` : 'N/A'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'de' ? 'Gesamtvarianz erklärt' : 'Total variance explained'}
          </p>
        </div>
      </div>

      {/* Model fit */}
      {fa.modelFit && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h3 className="text-sm font-medium text-white mb-4">{t.modelFit}</h3>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              label={t.cfi}
              value={fa.modelFit.cfi}
              threshold="≥ 0.95"
              status={fa.modelFit.cfi >= 0.95 ? 'good' : fa.modelFit.cfi >= 0.90 ? 'acceptable' : 'poor'}
              compact
            />
            <MetricCard
              label={t.tli}
              value={fa.modelFit.tli}
              threshold="≥ 0.95"
              status={fa.modelFit.tli >= 0.95 ? 'good' : fa.modelFit.tli >= 0.90 ? 'acceptable' : 'poor'}
              compact
            />
            <MetricCard
              label={t.rmsea}
              value={fa.modelFit.rmsea}
              threshold="≤ 0.06"
              status={fa.modelFit.rmsea <= 0.06 ? 'good' : fa.modelFit.rmsea <= 0.08 ? 'acceptable' : 'poor'}
              compact
            />
            <MetricCard
              label={t.srmr}
              value={fa.modelFit.srmr}
              threshold="≤ 0.08"
              status={fa.modelFit.srmr <= 0.08 ? 'good' : 'poor'}
              compact
            />
          </div>
        </div>
      )}

      {/* Factor loadings */}
      {fa.factorLoadings && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h3 className="text-sm font-medium text-white mb-4">{t.factorLoadings}</h3>
          <FactorLoadingsTable loadings={fa.factorLoadings} language={language} />
        </div>
      )}

      {/* Eigenvalues */}
      {fa.eigenvalues && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h3 className="text-sm font-medium text-white mb-4">{t.eigenvalues}</h3>
          <EigenvaluesChart eigenvalues={fa.eigenvalues} language={language} />
        </div>
      )}
    </div>
  )
}

interface ItemStatisticsSectionProps extends SectionProps {
  scale: Scale
  expandedItems: Set<string>
  onToggleItem: (itemId: string) => void
}

const ItemStatisticsSection: React.FC<ItemStatisticsSectionProps> = ({
  report,
  scale,
  expandedItems,
  onToggleItem,
  language,
}) => {
  const t = TRANSLATIONS[language]
  const items = report.itemStatistics

  if (!items || items.length === 0) {
    return <NoDataMessage language={language} />
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <ItemStatisticsCard
          key={i}
          itemNumber={i + 1}
          itemText={scale.items[i]?.text || ''}
          statistics={item}
          isExpanded={expandedItems.has(`item-${i}`)}
          onToggle={() => onToggleItem(`item-${i}`)}
          language={language}
        />
      ))}
    </div>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  status?: 'good' | 'acceptable' | 'poor'
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, status }) => {
  const statusColors = {
    good: 'text-green-400',
    acceptable: 'text-amber-400',
    poor: 'text-red-400',
  }

  return (
    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
      <div className="flex items-center gap-3">
        <div className="text-slate-500">{icon}</div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className={`text-xl font-bold ${status ? statusColors[status] : 'text-white'}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value?: number
  threshold: string
  interpretation?: string
  status: 'good' | 'acceptable' | 'poor'
  compact?: boolean
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  threshold,
  interpretation,
  status,
  compact,
}) => {
  const statusColors = {
    good: 'border-green-500/30 bg-green-500/10',
    acceptable: 'border-amber-500/30 bg-amber-500/10',
    poor: 'border-red-500/30 bg-red-500/10',
  }

  const statusTextColors = {
    good: 'text-green-400',
    acceptable: 'text-amber-400',
    poor: 'text-red-400',
  }

  return (
    <div className={`p-${compact ? '3' : '4'} rounded-xl border ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs text-slate-500">{threshold}</span>
      </div>
      <p className={`text-${compact ? 'lg' : '2xl'} font-bold ${statusTextColors[status]}`}>
        {value !== undefined ? value.toFixed(2) : 'N/A'}
      </p>
      {interpretation && !compact && (
        <p className="text-xs text-slate-500 mt-2">{interpretation}</p>
      )}
    </div>
  )
}

interface MetricSummaryCardProps {
  title: string
  metrics: { label: string; value?: number; threshold: string }[]
  language: 'de' | 'en'
}

const MetricSummaryCard: React.FC<MetricSummaryCardProps> = ({ title, metrics, language }) => (
  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
    <h3 className="text-sm font-medium text-white mb-3">{title}</h3>
    <div className="space-y-2">
      {metrics.map((metric, i) => (
        <div key={i} className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{metric.label}</span>
          <span className="text-sm font-medium text-white">
            {metric.value !== undefined ? metric.value.toFixed(2) : 'N/A'}
          </span>
        </div>
      ))}
    </div>
  </div>
)

interface ItemCorrelationBarProps {
  itemNumber: number
  correlation: number
  threshold: number
}

const ItemCorrelationBar: React.FC<ItemCorrelationBarProps> = ({
  itemNumber,
  correlation,
  threshold,
}) => {
  const isBelowThreshold = correlation < threshold

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-12">Item {itemNumber}</span>
      <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${isBelowThreshold ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${Math.max(0, correlation) * 100}%` }}
        />
      </div>
      <span className={`text-xs font-mono w-12 text-right ${isBelowThreshold ? 'text-red-400' : 'text-green-400'}`}>
        {correlation.toFixed(2)}
      </span>
    </div>
  )
}

interface AlphaIfDeletedBarProps {
  itemNumber: number
  alphaIfDeleted: number
  currentAlpha: number
}

const AlphaIfDeletedBar: React.FC<AlphaIfDeletedBarProps> = ({
  itemNumber,
  alphaIfDeleted,
  currentAlpha,
}) => {
  const wouldImprove = alphaIfDeleted > currentAlpha

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-12">Item {itemNumber}</span>
      <div className="flex-1 flex items-center gap-2">
        <span className={`text-sm font-mono ${wouldImprove ? 'text-red-400' : 'text-green-400'}`}>
          {alphaIfDeleted.toFixed(3)}
        </span>
        {wouldImprove && (
          <span className="text-xs text-red-400 flex items-center gap-1">
            <IconTrendingUp size={12} />
            +{(alphaIfDeleted - currentAlpha).toFixed(3)}
          </span>
        )}
      </div>
    </div>
  )
}

interface HTMTMatrixProps {
  htmt: number[][]
  language: 'de' | 'en'
}

const HTMTMatrix: React.FC<HTMTMatrixProps> = ({ htmt, language }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs">
      <thead>
        <tr>
          <th className="p-2 text-left text-slate-400"></th>
          {htmt.map((_, i) => (
            <th key={i} className="p-2 text-center text-slate-400">F{i + 1}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {htmt.map((row, i) => (
          <tr key={i}>
            <td className="p-2 text-slate-400">F{i + 1}</td>
            {row.map((value, j) => (
              <td
                key={j}
                className={`p-2 text-center ${
                  i === j
                    ? 'text-slate-600'
                    : value >= 0.90
                    ? 'text-red-400'
                    : value >= 0.85
                    ? 'text-amber-400'
                    : 'text-green-400'
                }`}
              >
                {i === j ? '-' : value.toFixed(2)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

interface FactorLoadingsTableProps {
  loadings: number[][]
  language: 'de' | 'en'
}

const FactorLoadingsTable: React.FC<FactorLoadingsTableProps> = ({ loadings, language }) => {
  const factorCount = loadings[0]?.length || 0

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left text-slate-400">Item</th>
            {Array.from({ length: factorCount }, (_, i) => (
              <th key={i} className="p-2 text-center text-slate-400">F{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loadings.map((row, i) => (
            <tr key={i} className="border-t border-slate-700/50">
              <td className="p-2 text-slate-400">{i + 1}</td>
              {row.map((loading, j) => (
                <td
                  key={j}
                  className={`p-2 text-center font-mono ${
                    Math.abs(loading) >= 0.40
                      ? 'text-purple-400 font-bold'
                      : Math.abs(loading) >= 0.30
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  {loading.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface EigenvaluesChartProps {
  eigenvalues: number[]
  language: 'de' | 'en'
}

const EigenvaluesChart: React.FC<EigenvaluesChartProps> = ({ eigenvalues, language }) => {
  const maxValue = Math.max(...eigenvalues)

  return (
    <div className="flex items-end gap-2 h-40">
      {eigenvalues.slice(0, 10).map((value, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full rounded-t ${value >= 1 ? 'bg-purple-500' : 'bg-slate-600'}`}
            style={{ height: `${(value / maxValue) * 100}%` }}
          />
          <span className="text-xs text-slate-400">{i + 1}</span>
          <span className="text-xs text-slate-500">{value.toFixed(1)}</span>
        </div>
      ))}
      {/* Kaiser criterion line */}
      <div
        className="absolute left-0 right-0 border-t border-dashed border-red-500/50"
        style={{ bottom: `${(1 / maxValue) * 100}%` }}
      />
    </div>
  )
}

interface ItemStatisticsCardProps {
  itemNumber: number
  itemText: string
  statistics: ItemStatistics
  isExpanded: boolean
  onToggle: () => void
  language: 'de' | 'en'
}

const ItemStatisticsCard: React.FC<ItemStatisticsCardProps> = ({
  itemNumber,
  itemText,
  statistics,
  isExpanded,
  onToggle,
  language,
}) => {
  const t = TRANSLATIONS[language]

  return (
    <div className="rounded-xl border border-slate-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        {isExpanded ? (
          <IconChevronDown size={14} className="text-slate-400" />
        ) : (
          <IconChevronRight size={14} className="text-slate-400" />
        )}
        <span className="text-xs text-slate-500 font-mono">{itemNumber}.</span>
        <span className="flex-1 text-sm text-white text-left truncate">{itemText}</span>
        <span className="text-xs text-slate-400">
          M={statistics.mean.toFixed(2)}, SD={statistics.sd.toFixed(2)}
        </span>
      </button>

      {isExpanded && (
        <div className="p-3 bg-slate-900/50 border-t border-slate-700/50">
          <div className="grid grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500">{t.mean}</span>
              <p className="text-white font-mono">{statistics.mean.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-slate-500">{t.sd}</span>
              <p className="text-white font-mono">{statistics.sd.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-slate-500">{t.skewness}</span>
              <p className="text-white font-mono">{statistics.skewness?.toFixed(2) || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-500">{t.kurtosis}</span>
              <p className="text-white font-mono">{statistics.kurtosis?.toFixed(2) || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const NoDataMessage: React.FC<{ language: 'de' | 'en' }> = ({ language }) => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
    <IconChartBar size={48} className="mb-4 opacity-50" />
    <p>{TRANSLATIONS[language].noData}</p>
  </div>
)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getReliabilityStatus(alpha: number): 'good' | 'acceptable' | 'poor' {
  if (alpha >= 0.80) return 'good'
  if (alpha >= 0.70) return 'acceptable'
  return 'poor'
}

function getReliabilityInterpretation(alpha: number, language: 'de' | 'en'): string {
  const t = TRANSLATIONS[language]
  if (alpha >= 0.90) return t.excellent
  if (alpha >= 0.80) return t.good
  if (alpha >= 0.70) return t.acceptable
  if (alpha >= 0.60) return t.questionable
  if (alpha >= 0.50) return t.poor
  return t.unacceptable
}

export default PsychometricReport
