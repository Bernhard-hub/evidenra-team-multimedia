/**
 * Item Quality Checker
 * EVIDENRA Research - Real-time Item Quality Analysis
 *
 * Features:
 * - Real-time quality checks while typing
 * - Multiple item input
 * - Detailed issue explanations
 * - Improvement suggestions
 * - Bulk quality report
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconInfoCircle,
  IconPlus,
  IconTrash,
  IconRefresh,
  IconDownload,
  IconCopy,
  IconBulb,
  IconChevronDown,
  IconChevronRight,
  IconSparkles,
  IconClipboard,
} from '@tabler/icons-react'

import { ItemQualityAnalyzer } from '@services/questionnaire/QuestionnaireService'
import { ITEM_WRITING_RULES } from '@services/questionnaire/knowledge'

// ============================================================================
// TYPES
// ============================================================================

interface ItemQualityCheckerProps {
  initialItems?: string[]
  onItemsChange?: (items: string[]) => void
  onRequestAISuggestion?: (item: string, issues: string[]) => void
  language?: 'de' | 'en'
}

interface ItemInput {
  id: string
  text: string
}

interface ItemIssue {
  type: string
  severity: 'error' | 'warning' | 'info'
  description: string
}

interface QualityResult {
  score: number
  issues: (string | ItemIssue)[]
  suggestions: string[]
}

// ============================================================================
// CONSTANTS
// ============================================================================

const QUALITY_RULES = {
  de: [
    {
      id: 'double-barreled',
      name: 'Double-Barreled',
      description: 'Item fragt nach zwei verschiedenen Dingen gleichzeitig',
      example: 'Ich bin glücklich und zufrieden',
      fix: 'In zwei separate Items aufteilen',
    },
    {
      id: 'leading',
      name: 'Suggestiv',
      description: 'Item suggeriert eine bestimmte Antwort',
      example: 'Stimmen Sie zu, dass Sport wichtig ist?',
      fix: 'Neutral formulieren ohne Wertung',
    },
    {
      id: 'double-negative',
      name: 'Doppelte Verneinung',
      description: 'Item enthält zwei Verneinungen',
      example: 'Ich bin nicht unglücklich',
      fix: 'Positiv oder einfach negativ formulieren',
    },
    {
      id: 'too-long',
      name: 'Zu lang',
      description: 'Item hat mehr als 20 Wörter',
      example: '-',
      fix: 'Auf 8-15 Wörter kürzen',
    },
    {
      id: 'jargon',
      name: 'Fachbegriffe',
      description: 'Item verwendet unverständliche Fachsprache',
      example: 'Meine kognitive Dissonanz ist gering',
      fix: 'Alltagssprache verwenden',
    },
    {
      id: 'absolute',
      name: 'Absolute Begriffe',
      description: 'Item verwendet immer/nie/alle/keine',
      example: 'Ich bin immer motiviert',
      fix: 'Relative Formulierungen verwenden',
    },
  ],
  en: [
    {
      id: 'double-barreled',
      name: 'Double-Barreled',
      description: 'Item asks about two different things at once',
      example: 'I am happy and satisfied',
      fix: 'Split into two separate items',
    },
    {
      id: 'leading',
      name: 'Leading',
      description: 'Item suggests a particular answer',
      example: 'Do you agree that exercise is important?',
      fix: 'Formulate neutrally without judgment',
    },
    {
      id: 'double-negative',
      name: 'Double Negative',
      description: 'Item contains two negations',
      example: 'I am not unhappy',
      fix: 'Formulate positively or simply negatively',
    },
    {
      id: 'too-long',
      name: 'Too Long',
      description: 'Item has more than 20 words',
      example: '-',
      fix: 'Shorten to 8-15 words',
    },
    {
      id: 'jargon',
      name: 'Jargon',
      description: 'Item uses incomprehensible technical language',
      example: 'My cognitive dissonance is low',
      fix: 'Use everyday language',
    },
    {
      id: 'absolute',
      name: 'Absolute Terms',
      description: 'Item uses always/never/all/none',
      example: 'I am always motivated',
      fix: 'Use relative formulations',
    },
  ],
}

const TRANSLATIONS = {
  de: {
    title: 'Item-Qualitätsprüfung',
    subtitle: 'Echtzeit-Analyse deiner Fragebogen-Items',
    addItem: 'Item hinzufügen',
    clearAll: 'Alle löschen',
    itemPlaceholder: 'Item-Text eingeben...',
    qualityScore: 'Qualitätswert',
    issues: 'Probleme',
    noIssues: 'Keine Probleme gefunden',
    suggestions: 'Verbesserungsvorschläge',
    askAI: 'KI nach Verbesserung fragen',
    copyItems: 'Items kopieren',
    exportReport: 'Bericht exportieren',
    qualityRules: 'Qualitätsregeln',
    rule: 'Regel',
    description: 'Beschreibung',
    example: 'Beispiel',
    fix: 'Lösung',
    overallScore: 'Gesamtqualität',
    itemsChecked: 'Items geprüft',
    issuesFound: 'Probleme gefunden',
    excellent: 'Exzellent',
    good: 'Gut',
    needsWork: 'Verbesserung nötig',
    pasteItems: 'Items einfügen',
    pasteHint: 'Füge mehrere Items ein (eines pro Zeile)',
  },
  en: {
    title: 'Item Quality Check',
    subtitle: 'Real-time analysis of your questionnaire items',
    addItem: 'Add item',
    clearAll: 'Clear all',
    itemPlaceholder: 'Enter item text...',
    qualityScore: 'Quality score',
    issues: 'Issues',
    noIssues: 'No issues found',
    suggestions: 'Improvement suggestions',
    askAI: 'Ask AI for improvement',
    copyItems: 'Copy items',
    exportReport: 'Export report',
    qualityRules: 'Quality rules',
    rule: 'Rule',
    description: 'Description',
    example: 'Example',
    fix: 'Solution',
    overallScore: 'Overall quality',
    itemsChecked: 'Items checked',
    issuesFound: 'Issues found',
    excellent: 'Excellent',
    good: 'Good',
    needsWork: 'Needs work',
    pasteItems: 'Paste items',
    pasteHint: 'Paste multiple items (one per line)',
  },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ItemQualityChecker: React.FC<ItemQualityCheckerProps> = ({
  initialItems = [],
  onItemsChange,
  onRequestAISuggestion,
  language = 'de',
}) => {
  const t = TRANSLATIONS[language]
  const rules = QUALITY_RULES[language]

  // State
  const [items, setItems] = useState<ItemInput[]>(
    initialItems.length > 0
      ? initialItems.map((text, i) => ({ id: `item-${i}`, text }))
      : [{ id: 'item-0', text: '' }]
  )
  const [showRules, setShowRules] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteText, setPasteText] = useState('')

  // Analyze all items
  const analysisResults = useMemo(() => {
    return items.map(item => {
      if (!item.text.trim()) {
        return { score: 0, issues: [], suggestions: [] }
      }
      const result = ItemQualityAnalyzer.analyze(item.text, language)
      return {
        score: result.score,
        issues: result.issues,
        suggestions: result.suggestions || [],
      }
    })
  }, [items, language])

  // Overall statistics
  const stats = useMemo(() => {
    const validItems = items.filter(i => i.text.trim())
    const totalIssues = analysisResults.reduce((sum, r) => sum + r.issues.length, 0)
    const avgScore = validItems.length > 0
      ? analysisResults.reduce((sum, r) => sum + (r.score || 0), 0) / validItems.length
      : 0

    return {
      itemCount: validItems.length,
      totalIssues,
      avgScore,
    }
  }, [items, analysisResults])

  // Add new item
  const addItem = useCallback(() => {
    const newItem: ItemInput = {
      id: `item-${Date.now()}`,
      text: '',
    }
    setItems(prev => [...prev, newItem])
  }, [])

  // Update item
  const updateItem = useCallback((id: string, text: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, text } : item
    ))
  }, [])

  // Remove item
  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== id)
      return newItems.length > 0 ? newItems : [{ id: 'item-0', text: '' }]
    })
  }, [])

  // Clear all items
  const clearAll = useCallback(() => {
    setItems([{ id: 'item-0', text: '' }])
  }, [])

  // Paste multiple items
  const handlePaste = useCallback(() => {
    const lines = pasteText.split('\n').filter(line => line.trim())
    if (lines.length > 0) {
      const newItems = lines.map((text, i) => ({
        id: `item-paste-${Date.now()}-${i}`,
        text: text.trim(),
      }))
      setItems(prev => {
        // Remove empty items at the end
        const filtered = prev.filter(item => item.text.trim())
        return [...filtered, ...newItems]
      })
      setShowPasteModal(false)
      setPasteText('')
    }
  }, [pasteText])

  // Copy all items
  const copyItems = useCallback(async () => {
    const text = items
      .filter(item => item.text.trim())
      .map((item, i) => `${i + 1}. ${item.text}`)
      .join('\n')
    await navigator.clipboard.writeText(text)
  }, [items])

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400'
    if (score >= 0.6) return 'text-amber-400'
    return 'text-red-400'
  }

  const getScoreBackground = (score: number) => {
    if (score >= 0.8) return 'bg-green-500/20 border-green-500/30'
    if (score >= 0.6) return 'bg-amber-500/20 border-amber-500/30'
    return 'bg-red-500/20 border-red-500/30'
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white">{t.title}</h2>
        <p className="text-sm text-slate-400">{t.subtitle}</p>
      </div>

      {/* Stats bar */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-4">
        {/* Overall score gauge */}
        <div className={`px-4 py-2 rounded-xl border ${getScoreBackground(stats.avgScore)}`}>
          <span className="text-xs text-slate-400">{t.overallScore}</span>
          <p className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
            {stats.itemCount > 0 ? Math.round(stats.avgScore * 100) : 0}%
          </p>
        </div>

        <div className="flex-1 flex items-center gap-6">
          <div>
            <span className="text-xs text-slate-500">{t.itemsChecked}</span>
            <p className="text-lg font-medium text-white">{stats.itemCount}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">{t.issuesFound}</span>
            <p className={`text-lg font-medium ${stats.totalIssues > 0 ? 'text-amber-400' : 'text-green-400'}`}>
              {stats.totalIssues}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPasteModal(true)}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={t.pasteItems}
          >
            <IconClipboard size={18} />
          </button>
          <button
            onClick={copyItems}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={t.copyItems}
          >
            <IconCopy size={18} />
          </button>
          <button
            onClick={() => setShowRules(!showRules)}
            className={`p-2 rounded-lg transition-colors ${
              showRules ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title={t.qualityRules}
          >
            <IconInfoCircle size={18} />
          </button>
        </div>
      </div>

      {/* Rules panel */}
      {showRules && (
        <div className="p-4 border-b border-slate-800 bg-slate-800/30">
          <h3 className="text-sm font-medium text-white mb-3">{t.qualityRules}</h3>
          <div className="grid grid-cols-2 gap-3">
            {rules.map(rule => (
              <div key={rule.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <h4 className="text-sm font-medium text-purple-400">{rule.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{rule.description}</p>
                <p className="text-xs text-slate-500 mt-2 italic">"{rule.example}"</p>
                <p className="text-xs text-green-400 mt-1">{rule.fix}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            index={index}
            result={analysisResults[index]}
            onUpdate={(text) => updateItem(item.id, text)}
            onRemove={() => removeItem(item.id)}
            onRequestAI={() => onRequestAISuggestion?.(item.text, analysisResults[index].issues.map(i => typeof i === 'string' ? i : i.description))}
            language={language}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 flex items-center gap-2">
        <button
          onClick={addItem}
          className="flex-1 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <IconPlus size={16} />
          {t.addItem}
        </button>
        <button
          onClick={clearAll}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          {t.clearAll}
        </button>
      </div>

      {/* Paste modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-white mb-2">{t.pasteItems}</h3>
            <p className="text-sm text-slate-400 mb-4">{t.pasteHint}</p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full h-48 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none"
              placeholder="Item 1&#10;Item 2&#10;Item 3"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowPasteModal(false)
                  setPasteText('')
                }}
                className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePaste}
                disabled={!pasteText.trim()}
                className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {t.addItem}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ITEM ROW COMPONENT
// ============================================================================

interface ItemRowProps {
  item: ItemInput
  index: number
  result: QualityResult
  onUpdate: (text: string) => void
  onRemove: () => void
  onRequestAI: () => void
  language: 'de' | 'en'
}

const ItemRow: React.FC<ItemRowProps> = ({
  item,
  index,
  result,
  onUpdate,
  onRemove,
  onRequestAI,
  language,
}) => {
  const t = TRANSLATIONS[language]
  const [isExpanded, setIsExpanded] = useState(false)

  const hasIssues = result.issues.length > 0
  const scoreColor = result.score >= 0.8 ? 'green' : result.score >= 0.6 ? 'amber' : 'red'

  return (
    <div className={`rounded-xl border overflow-hidden ${
      !item.text.trim()
        ? 'border-slate-700 bg-slate-800/30'
        : hasIssues
        ? 'border-amber-500/30 bg-amber-500/5'
        : 'border-green-500/30 bg-green-500/5'
    }`}>
      {/* Main row */}
      <div className="p-3 flex items-start gap-3">
        {/* Number */}
        <span className="text-xs text-slate-500 font-mono w-6 pt-2">{index + 1}.</span>

        {/* Input */}
        <div className="flex-1">
          <textarea
            value={item.text}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder={t.itemPlaceholder}
            rows={1}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none"
          />

          {/* Quick issues display */}
          {hasIssues && item.text.trim() && (
            <div className="mt-2 flex flex-wrap gap-1">
              {result.issues.map((issue, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs"
                >
                  {typeof issue === 'string' ? issue : issue.description}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Score indicator */}
        {item.text.trim() && (
          <div className={`px-2 py-1 rounded text-xs font-medium bg-${scoreColor}-500/20 text-${scoreColor}-400`}>
            {Math.round(result.score * 100)}%
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          {hasIssues && item.text.trim() && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded hover:bg-slate-700 text-slate-400"
            >
              {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            </button>
          )}
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
          >
            <IconTrash size={14} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && hasIssues && (
        <div className="px-3 pb-3 border-t border-slate-700/50 pt-3 ml-9">
          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs text-slate-500 mb-2">{t.suggestions}</h5>
              <ul className="space-y-1">
                {result.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-xs text-green-400 flex items-start gap-1">
                    <IconBulb size={12} className="mt-0.5 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ask AI button */}
          <button
            onClick={onRequestAI}
            className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/30 transition-colors flex items-center gap-1"
          >
            <IconSparkles size={12} />
            {t.askAI}
          </button>
        </div>
      )}
    </div>
  )
}

export default ItemQualityChecker
