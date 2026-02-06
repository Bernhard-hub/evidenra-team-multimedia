/**
 * AKIH Score Dashboard
 * Main dashboard component for AKIH Score display and management
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  IconInfoCircle,
  IconDownload,
  IconRefresh,
  IconSettings,
  IconChevronDown,
  IconChevronUp,
  IconClipboardCheck,
  IconFileText,
  IconFileSpreadsheet,
  IconBrandHtml5,
} from '@tabler/icons-react'
import AKIHScoreGauge from './AKIHScoreGauge'
import AKIHComponentsBreakdown from './AKIHComponentsBreakdown'
import AKIHPhaseProgress from './AKIHPhaseProgress'
import AKIHSuggestions from './AKIHSuggestions'
import { downloadAKIHReport } from '@/services/AKIHExportService'
import type { AKIHScoreResult, AKIHSuggestion } from '@/types/akih'

interface AKIHScoreDashboardProps {
  result: AKIHScoreResult
  projectName?: string
  onRefresh?: () => void
  onExport?: () => void
  onSettingsClick?: () => void
  onValidationClick?: () => void
  onSuggestionClick?: (suggestion: AKIHSuggestion) => void
  isLoading?: boolean
  showValidationButton?: boolean
}

export default function AKIHScoreDashboard({
  result,
  projectName,
  onRefresh,
  onExport,
  onSettingsClick,
  onValidationClick,
  onSuggestionClick,
  isLoading = false,
  showValidationButton = true,
}: AKIHScoreDashboardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('components')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = (format: 'json' | 'csv' | 'html') => {
    downloadAKIHReport(result, format, { projectName })
    setShowExportMenu(false)
    onExport?.()
  }

  // TI and HV as percentages (0.5-1.0 → 0-100%)
  const tiPercent = useMemo(() => Math.round((result.transparencyIndex - 0.5) * 200), [result])
  const hvPercent = useMemo(() => Math.round((result.humanValidation - 0.5) * 200), [result])

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-surface-100">AKIH Score</h2>
          <div className="group relative">
            <IconInfoCircle size={16} className="text-surface-500 cursor-help" />
            <div className="absolute left-0 top-6 w-72 p-3 bg-surface-800 border border-surface-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <p className="text-xs text-surface-300 mb-2">
                <strong>AI-Kodierung Human-Integration Score</strong>
              </p>
              <p className="text-xs text-surface-400">
                Misst die Qualität und Transparenz der KI-gestützten qualitativen Analyse.
              </p>
              <p className="text-xs text-surface-500 mt-2 font-mono">
                AKIH = Σ(wᵢ × Pᵢ) × TI × HV
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showValidationButton && result.validationStats.pending > 0 && (
            <button
              onClick={onValidationClick}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors text-sm"
            >
              <IconClipboardCheck size={16} />
              <span>{result.validationStats.pending} zu validieren</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors disabled:opacity-50"
              title="Neu berechnen"
            >
              <IconRefresh size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}

          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
              title="Exportieren"
            >
              <IconDownload size={16} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface-800 border border-surface-700 rounded-lg shadow-xl z-20 overflow-hidden">
                <button
                  onClick={() => handleExport('html')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-300 hover:bg-surface-700 transition-colors"
                >
                  <IconBrandHtml5 size={16} className="text-orange-400" />
                  <span>HTML Report</span>
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-300 hover:bg-surface-700 transition-colors"
                >
                  <IconFileText size={16} className="text-blue-400" />
                  <span>JSON Export</span>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-300 hover:bg-surface-700 transition-colors"
                >
                  <IconFileSpreadsheet size={16} className="text-green-400" />
                  <span>CSV Export</span>
                </button>
              </div>
            )}
          </div>

          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
              title="Einstellungen"
            >
              <IconSettings size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Score Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Gauge */}
        <div className="bg-surface-900 rounded-xl border border-surface-800 p-6 flex flex-col items-center justify-center">
          <AKIHScoreGauge
            score={result.score}
            qualityLevel={result.qualityLevel}
            size="lg"
            trend={result.trend}
          />

          {/* Calculated at */}
          <p className="text-xs text-surface-500 mt-4">
            Berechnet: {new Date(result.calculatedAt).toLocaleString('de-DE')}
          </p>
        </div>

        {/* Factors */}
        <div className="bg-surface-900 rounded-xl border border-surface-800 p-6 space-y-4">
          <h3 className="text-sm font-medium text-surface-300">Faktoren</h3>

          {/* TI Factor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-surface-400">Transparenz-Index (TI)</span>
              <span className="text-surface-200 font-medium">{result.transparencyIndex.toFixed(2)}</span>
            </div>
            <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${tiPercent}%` }}
              />
            </div>
            <p className="text-xs text-surface-500">
              Dokumentation der AI-Prozesse: {tiPercent}%
            </p>
          </div>

          {/* HV Factor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-surface-400">Human-Validierung (HV)</span>
              <span className="text-surface-200 font-medium">{result.humanValidation.toFixed(2)}</span>
            </div>
            <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${hvPercent}%` }}
              />
            </div>
            <p className="text-xs text-surface-500">
              Validierungsrate: {Math.round(result.validationStats.validationRate * 100)}%
            </p>
          </div>

          {/* Validation Stats */}
          <div className="bg-surface-800/50 rounded-lg p-3">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-surface-200">{result.validationStats.accepted}</p>
                <p className="text-[10px] text-green-400">Akzeptiert</p>
              </div>
              <div>
                <p className="text-lg font-bold text-surface-200">{result.validationStats.modified}</p>
                <p className="text-[10px] text-amber-400">Korrigiert</p>
              </div>
              <div>
                <p className="text-lg font-bold text-surface-200">{result.validationStats.rejected}</p>
                <p className="text-[10px] text-red-400">Abgelehnt</p>
              </div>
              <div>
                <p className="text-lg font-bold text-surface-200">{result.validationStats.pending}</p>
                <p className="text-[10px] text-surface-500">Offen</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formula Display */}
        <div className="bg-surface-900 rounded-xl border border-surface-800 p-6 space-y-4">
          <h3 className="text-sm font-medium text-surface-300">Berechnung</h3>

          <div className="bg-surface-800 rounded-lg p-4 font-mono text-sm">
            <div className="text-surface-400 mb-2">AKIH-Score =</div>
            <div className="flex items-center gap-2 text-surface-200">
              <span className="text-blue-400">{result.phaseScore.toFixed(1)}</span>
              <span className="text-surface-500">×</span>
              <span className="text-cyan-400">{result.transparencyIndex.toFixed(2)}</span>
              <span className="text-surface-500">×</span>
              <span className="text-green-400">{result.humanValidation.toFixed(2)}</span>
            </div>
            <div className="text-lg font-bold text-primary-400 mt-2">
              = {result.score.toFixed(1)}
            </div>
          </div>

          <div className="text-xs text-surface-500 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-400"></span>
              <span>Phasen-Score (gewichtet)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-cyan-400"></span>
              <span>Transparenz-Index</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-green-400"></span>
              <span>Human-Validierung</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-4">
        {/* Components Section */}
        <CollapsibleSection
          title="Komponenten-Analyse"
          isExpanded={expandedSection === 'components'}
          onToggle={() => toggleSection('components')}
        >
          <AKIHComponentsBreakdown components={result.components} height={280} />
        </CollapsibleSection>

        {/* Phases Section */}
        <CollapsibleSection
          title="Forschungsphasen"
          isExpanded={expandedSection === 'phases'}
          onToggle={() => toggleSection('phases')}
        >
          <AKIHPhaseProgress phases={result.phases} />
        </CollapsibleSection>

        {/* Suggestions Section */}
        <CollapsibleSection
          title="Verbesserungsvorschläge"
          isExpanded={expandedSection === 'suggestions'}
          onToggle={() => toggleSection('suggestions')}
          badge={result.suggestions.length > 0 ? result.suggestions.length : undefined}
        >
          <AKIHSuggestions
            suggestions={result.suggestions}
            onSuggestionClick={onSuggestionClick}
          />
        </CollapsibleSection>
      </div>
    </div>
  )
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  badge,
  children,
}: {
  title: string
  isExpanded: boolean
  onToggle: () => void
  badge?: number
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-surface-200">{title}</h3>
          {badge !== undefined && (
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <IconChevronUp size={16} className="text-surface-400" />
        ) : (
          <IconChevronDown size={16} className="text-surface-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-surface-800/50">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}
