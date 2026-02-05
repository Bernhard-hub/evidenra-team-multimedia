/**
 * Scale Editor
 * EVIDENRA Research - Visual Scale & Item Editor
 *
 * Features:
 * - Drag & drop item reordering
 * - Inline item editing
 * - Dimension management
 * - Response format configuration
 * - Real-time quality checks
 */

import React, { useState, useCallback, useMemo } from 'react'
import {
  IconGripVertical,
  IconPlus,
  IconTrash,
  IconEdit,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconArrowUp,
  IconArrowDown,
  IconRefresh,
  IconSettings,
  IconPalette,
} from '@tabler/icons-react'

import {
  Scale,
  ScaleItem,
  Dimension,
  ResponseFormat,
} from '@services/questionnaire/types'

import { ItemQualityAnalyzer } from '@services/questionnaire/QuestionnaireService'

// ============================================================================
// TYPES
// ============================================================================

interface ScaleEditorProps {
  scale: Scale
  onChange: (scale: Scale) => void
  language?: 'de' | 'en'
  readOnly?: boolean
}

interface ItemEditorProps {
  item: ScaleItem
  index: number
  dimension?: Dimension
  onUpdate: (item: ScaleItem) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  isFirst: boolean
  isLast: boolean
  language: 'de' | 'en'
  readOnly?: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RESPONSE_FORMAT_OPTIONS = [
  { value: 'likert5', label: { de: '5-Punkt Likert', en: '5-Point Likert' }, points: 5 },
  { value: 'likert7', label: { de: '7-Punkt Likert', en: '7-Point Likert' }, points: 7 },
  { value: 'likert4', label: { de: '4-Punkt Likert', en: '4-Point Likert' }, points: 4 },
  { value: 'agreement5', label: { de: 'Zustimmung (5)', en: 'Agreement (5)' }, points: 5 },
  { value: 'frequency5', label: { de: 'Häufigkeit (5)', en: 'Frequency (5)' }, points: 5 },
  { value: 'binary', label: { de: 'Ja/Nein', en: 'Yes/No' }, points: 2 },
]

const LIKERT_LABELS = {
  likert5: {
    de: ['Stimme gar nicht zu', 'Stimme nicht zu', 'Neutral', 'Stimme zu', 'Stimme voll zu'],
    en: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
  },
  likert7: {
    de: ['Stimme überhaupt nicht zu', 'Stimme nicht zu', 'Stimme eher nicht zu', 'Neutral', 'Stimme eher zu', 'Stimme zu', 'Stimme voll zu'],
    en: ['Strongly disagree', 'Disagree', 'Somewhat disagree', 'Neutral', 'Somewhat agree', 'Agree', 'Strongly agree'],
  },
  likert4: {
    de: ['Stimme nicht zu', 'Stimme eher nicht zu', 'Stimme eher zu', 'Stimme zu'],
    en: ['Disagree', 'Somewhat disagree', 'Somewhat agree', 'Agree'],
  },
  agreement5: {
    de: ['Trifft nicht zu', 'Trifft wenig zu', 'Teils/teils', 'Trifft zu', 'Trifft voll zu'],
    en: ['Does not apply', 'Applies little', 'Partly applies', 'Applies', 'Fully applies'],
  },
  frequency5: {
    de: ['Nie', 'Selten', 'Manchmal', 'Oft', 'Immer'],
    en: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
  },
  binary: {
    de: ['Nein', 'Ja'],
    en: ['No', 'Yes'],
  },
}

const TRANSLATIONS = {
  de: {
    scaleSettings: 'Skalen-Einstellungen',
    scaleName: 'Skalenname',
    scaleDescription: 'Beschreibung',
    responseFormat: 'Antwortformat',
    dimensions: 'Dimensionen',
    addDimension: 'Dimension hinzufügen',
    items: 'Items',
    addItem: 'Item hinzufügen',
    itemText: 'Item-Text',
    reversed: 'Invertiert',
    dimension: 'Dimension',
    qualityIssues: 'Qualitätsprobleme',
    noIssues: 'Keine Probleme gefunden',
    deleteItem: 'Item löschen',
    duplicateItem: 'Item duplizieren',
    moveUp: 'Nach oben',
    moveDown: 'Nach unten',
    preview: 'Vorschau',
    totalItems: 'Items gesamt',
    reversedItems: 'Invertierte Items',
    dimensionName: 'Dimensionsname',
    dimensionDefinition: 'Definition',
    deleteDimension: 'Dimension löschen',
    noDimensions: 'Keine Dimensionen definiert',
    general: 'Allgemein',
  },
  en: {
    scaleSettings: 'Scale Settings',
    scaleName: 'Scale name',
    scaleDescription: 'Description',
    responseFormat: 'Response format',
    dimensions: 'Dimensions',
    addDimension: 'Add dimension',
    items: 'Items',
    addItem: 'Add item',
    itemText: 'Item text',
    reversed: 'Reversed',
    dimension: 'Dimension',
    qualityIssues: 'Quality issues',
    noIssues: 'No issues found',
    deleteItem: 'Delete item',
    duplicateItem: 'Duplicate item',
    moveUp: 'Move up',
    moveDown: 'Move down',
    preview: 'Preview',
    totalItems: 'Total items',
    reversedItems: 'Reversed items',
    dimensionName: 'Dimension name',
    dimensionDefinition: 'Definition',
    deleteDimension: 'Delete dimension',
    noDimensions: 'No dimensions defined',
    general: 'General',
  },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ScaleEditor: React.FC<ScaleEditorProps> = ({
  scale,
  onChange,
  language = 'de',
  readOnly = false,
}) => {
  const t = TRANSLATIONS[language]

  // State
  const [expandedSections, setExpandedSections] = useState<string[]>(['settings', 'items'])
  const [selectedFormat, setSelectedFormat] = useState('likert5')
  const [showPreview, setShowPreview] = useState(false)

  // Toggle section
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }, [])

  // Update scale property
  const updateScale = useCallback((updates: Partial<Scale>) => {
    onChange({ ...scale, ...updates, updatedAt: new Date() })
  }, [scale, onChange])

  // Add new item
  const addItem = useCallback((dimensionId?: string) => {
    const newItem: ScaleItem = {
      id: `item-${Date.now()}`,
      text: '',
      dimensionId: dimensionId || scale.dimensions?.[0]?.id || 'general',
      responseFormat: scale.responseFormat,
      isReversed: false,
    }
    updateScale({ items: [...scale.items, newItem] })
  }, [scale, updateScale])

  // Update item
  const updateItem = useCallback((index: number, item: ScaleItem) => {
    const newItems = [...scale.items]
    newItems[index] = item
    updateScale({ items: newItems })
  }, [scale, updateScale])

  // Delete item
  const deleteItem = useCallback((index: number) => {
    updateScale({ items: scale.items.filter((_, i) => i !== index) })
  }, [scale, updateScale])

  // Move item
  const moveItem = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= scale.items?.length || 0) return

    const newItems = [...scale.items]
    const [item] = newItems.splice(index, 1)
    newItems.splice(newIndex, 0, item)
    updateScale({ items: newItems })
  }, [scale, updateScale])

  // Duplicate item
  const duplicateItem = useCallback((index: number) => {
    const item = scale.items[index]
    const newItem: ScaleItem = {
      ...item,
      id: `item-${Date.now()}`,
    }
    const newItems = [...scale.items]
    newItems.splice(index + 1, 0, newItem)
    updateScale({ items: newItems })
  }, [scale, updateScale])

  // Add dimension
  const addDimension = useCallback(() => {
    const newDimension: Dimension = {
      id: `dim-${Date.now()}`,
      name: language === 'de' ? 'Neue Dimension' : 'New Dimension',
      definition: '',
    }
    updateScale({
      dimensions: [...(scale.dimensions || []), newDimension],
    })
  }, [scale, language, updateScale])

  // Update dimension
  const updateDimension = useCallback((index: number, dimension: Dimension) => {
    const newDimensions = [...(scale.dimensions || [])]
    newDimensions[index] = dimension
    updateScale({ dimensions: newDimensions })
  }, [scale, updateScale])

  // Delete dimension
  const deleteDimension = useCallback((index: number) => {
    const dimension = scale.dimensions?.[index]
    if (!dimension) return

    // Move items to general
    const newItems = scale.items.map(item =>
      item.dimensionId === dimension.id
        ? { ...item, dimensionId: 'general' }
        : item
    )

    updateScale({
      dimensions: (scale.dimensions || []).filter((_, i) => i !== index),
      items: newItems,
    })
  }, [scale, updateScale])

  // Update response format
  const handleFormatChange = useCallback((formatKey: string) => {
    const format = RESPONSE_FORMAT_OPTIONS.find(f => f.value === formatKey)
    if (!format) return

    setSelectedFormat(formatKey)
    const labels = LIKERT_LABELS[formatKey as keyof typeof LIKERT_LABELS]?.[language] || []

    updateScale({
      responseFormat: {
        type: 'likert',
        points: format.points,
        labels,
      },
    })
  }, [language, updateScale])

  // Stats
  const stats = useMemo(() => ({
    totalItems: scale.items?.length || 0,
    reversedItems: scale.items.filter(i => i.isReversed).length,
    dimensions: scale.dimensions?.length || 0,
  }), [scale])

  // Items grouped by dimension
  const itemsByDimension = useMemo(() => {
    const groups: Record<string, ScaleItem[]> = {}

    scale.items.forEach(item => {
      const dimId = item.dimensionId || 'general'
      if (!groups[dimId]) groups[dimId] = []
      groups[dimId].push(item)
    })

    return groups
  }, [scale.items])

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{scale.name || t.scaleName}</h2>
          <p className="text-xs text-slate-500">
            {stats.totalItems} {t.totalItems} • {stats.reversedItems} {t.reversedItems}
          </p>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`p-2 rounded-lg transition-colors ${
            showPreview
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {showPreview ? <IconEyeOff size={18} /> : <IconEye size={18} />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showPreview ? (
          <ScalePreview scale={scale} language={language} />
        ) : (
          <div className="p-4 space-y-4">
            {/* Settings Section */}
            <CollapsibleSection
              title={t.scaleSettings}
              icon={<IconSettings size={16} />}
              isExpanded={expandedSections.includes('settings')}
              onToggle={() => toggleSection('settings')}
            >
              <div className="space-y-4 pt-3">
                {/* Scale name */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.scaleName}</label>
                  <input
                    type="text"
                    value={scale.name}
                    onChange={(e) => updateScale({ name: e.target.value })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.scaleDescription}</label>
                  <textarea
                    value={scale.description || ''}
                    onChange={(e) => updateScale({ description: e.target.value })}
                    disabled={readOnly}
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Response format */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.responseFormat}</label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => handleFormatChange(e.target.value)}
                    disabled={readOnly}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                  >
                    {RESPONSE_FORMAT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label[language]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CollapsibleSection>

            {/* Dimensions Section */}
            <CollapsibleSection
              title={`${t.dimensions} (${scale.dimensions?.length || 0})`}
              icon={<IconPalette size={16} />}
              isExpanded={expandedSections.includes('dimensions')}
              onToggle={() => toggleSection('dimensions')}
            >
              <div className="space-y-2 pt-3">
                {(scale.dimensions || []).map((dimension, index) => (
                  <DimensionEditor
                    key={dimension.id}
                    dimension={dimension}
                    onUpdate={(dim) => updateDimension(index, dim)}
                    onDelete={() => deleteDimension(index)}
                    itemCount={itemsByDimension[dimension.id]?.length || 0}
                    language={language}
                    readOnly={readOnly}
                  />
                ))}

                {!readOnly && (
                  <button
                    onClick={addDimension}
                    className="w-full py-2 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:text-purple-400 hover:border-purple-500/50 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <IconPlus size={14} />
                    {t.addDimension}
                  </button>
                )}
              </div>
            </CollapsibleSection>

            {/* Items Section */}
            <CollapsibleSection
              title={`${t.items} (${scale.items?.length || 0})`}
              icon={<IconEdit size={16} />}
              isExpanded={expandedSections.includes('items')}
              onToggle={() => toggleSection('items')}
            >
              <div className="space-y-2 pt-3">
                {scale.items.map((item, index) => (
                  <ItemEditor
                    key={item.id}
                    item={item}
                    index={index}
                    dimension={scale.dimensions?.find(d => d.id === item.dimensionId)}
                    onUpdate={(updatedItem) => updateItem(index, updatedItem)}
                    onDelete={() => deleteItem(index)}
                    onMoveUp={() => moveItem(index, 'up')}
                    onMoveDown={() => moveItem(index, 'down')}
                    onDuplicate={() => duplicateItem(index)}
                    isFirst={index === 0}
                    isLast={index === scale.items?.length || 0 - 1}
                    language={language}
                    readOnly={readOnly}
                  />
                ))}

                {!readOnly && (
                  <button
                    onClick={() => addItem()}
                    className="w-full py-2 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:text-purple-400 hover:border-purple-500/50 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <IconPlus size={14} />
                    {t.addItem}
                  </button>
                )}
              </div>
            </CollapsibleSection>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
}) => (
  <div className="rounded-xl border border-slate-800 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 transition-colors"
    >
      {isExpanded ? (
        <IconChevronDown size={14} className="text-slate-400" />
      ) : (
        <IconChevronRight size={14} className="text-slate-400" />
      )}
      <span className="text-slate-400">{icon}</span>
      <span className="text-sm font-medium text-white">{title}</span>
    </button>
    {isExpanded && (
      <div className="px-4 pb-4 bg-slate-900/50">
        {children}
      </div>
    )}
  </div>
)

interface DimensionEditorProps {
  dimension: Dimension
  onUpdate: (dimension: Dimension) => void
  onDelete: () => void
  itemCount: number
  language: 'de' | 'en'
  readOnly?: boolean
}

const DimensionEditor: React.FC<DimensionEditorProps> = ({
  dimension,
  onUpdate,
  onDelete,
  itemCount,
  language,
  readOnly,
}) => {
  const t = TRANSLATIONS[language]
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
      {isEditing && !readOnly ? (
        <div className="space-y-2">
          <input
            type="text"
            value={dimension.name}
            onChange={(e) => onUpdate({ ...dimension, name: e.target.value })}
            placeholder={t.dimensionName}
            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-purple-500/50"
            autoFocus
          />
          <input
            type="text"
            value={dimension.definition || ''}
            onChange={(e) => onUpdate({ ...dimension, definition: e.target.value })}
            placeholder={t.dimensionDefinition}
            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-purple-500/50"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
            >
              <IconCheck size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-white">{dimension.name}</h4>
            <p className="text-xs text-slate-500">
              {itemCount} {language === 'de' ? 'Items' : 'items'}
            </p>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded hover:bg-slate-700 text-slate-400"
              >
                <IconEdit size={14} />
              </button>
              <button
                onClick={onDelete}
                className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
              >
                <IconTrash size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const ItemEditor: React.FC<ItemEditorProps> = ({
  item,
  index,
  dimension,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  isFirst,
  isLast,
  language,
  readOnly,
}) => {
  const t = TRANSLATIONS[language]
  const [isExpanded, setIsExpanded] = useState(false)

  // Quality check
  const quality = useMemo(() => {
    if (!item.text) return { issues: [], score: 0 }
    return ItemQualityAnalyzer.analyze(item.text, language)
  }, [item.text, language])

  const hasIssues = quality.issues.length > 0

  return (
    <div className={`rounded-lg border ${
      hasIssues
        ? 'border-amber-500/30 bg-amber-500/5'
        : 'border-slate-700 bg-slate-800/30'
    }`}>
      {/* Main row */}
      <div className="p-3 flex items-start gap-2">
        {/* Drag handle & number */}
        <div className="flex items-center gap-1 pt-1">
          {!readOnly && (
            <IconGripVertical size={14} className="text-slate-600 cursor-grab" />
          )}
          <span className="text-xs text-slate-500 font-mono w-6">{index + 1}.</span>
        </div>

        {/* Item text */}
        <div className="flex-1">
          <textarea
            value={item.text}
            onChange={(e) => onUpdate({ ...item, text: e.target.value })}
            disabled={readOnly}
            placeholder={t.itemText}
            rows={1}
            className="w-full px-2 py-1 bg-transparent text-white text-sm focus:outline-none resize-none disabled:opacity-75"
          />

          {/* Quality issues */}
          {hasIssues && (
            <div className="mt-1 flex flex-wrap gap-1">
              {quality.issues.map((issue, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs"
                >
                  {issue}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Reversed toggle */}
          <button
            onClick={() => onUpdate({ ...item, isReversed: !item.isReversed })}
            disabled={readOnly}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              item.isReversed
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-slate-700/50 text-slate-500 hover:text-white'
            }`}
            title={t.reversed}
          >
            R
          </button>

          {/* Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-slate-700 text-slate-400"
          >
            {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
          </button>

          {!readOnly && (
            <>
              {/* Move up */}
              <button
                onClick={onMoveUp}
                disabled={isFirst}
                className="p-1 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-30"
                title={t.moveUp}
              >
                <IconArrowUp size={14} />
              </button>

              {/* Move down */}
              <button
                onClick={onMoveDown}
                disabled={isLast}
                className="p-1 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-30"
                title={t.moveDown}
              >
                <IconArrowDown size={14} />
              </button>

              {/* Duplicate */}
              <button
                onClick={onDuplicate}
                className="p-1 rounded hover:bg-slate-700 text-slate-400"
                title={t.duplicateItem}
              >
                <IconCopy size={14} />
              </button>

              {/* Delete */}
              <button
                onClick={onDelete}
                className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                title={t.deleteItem}
              >
                <IconTrash size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-slate-700/50 pt-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">{t.dimension}:</span>
              <span className="text-slate-300 ml-1">{dimension?.name || t.general}</span>
            </div>
            <div>
              <span className="text-slate-500">{t.reversed}:</span>
              <span className="text-slate-300 ml-1">{item.isReversed ? '✓' : '✗'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ScalePreviewProps {
  scale: Scale
  language: 'de' | 'en'
}

const ScalePreview: React.FC<ScalePreviewProps> = ({ scale, language }) => {
  const labels = scale.responseFormat.labels || []

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">{scale.name}</h2>
        {scale.description && (
          <p className="text-sm text-slate-400 mt-2">{scale.description}</p>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
        <p className="text-sm text-slate-300">
          {language === 'de'
            ? 'Bitte geben Sie an, inwieweit die folgenden Aussagen auf Sie zutreffen.'
            : 'Please indicate to what extent the following statements apply to you.'}
        </p>
      </div>

      {/* Response scale header */}
      <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
        {labels.map((label, i) => (
          <div key={i} className="w-16 text-center">{label}</div>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {scale.items.map((item, index) => (
          <div
            key={item.id}
            className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 flex items-center gap-4"
          >
            <span className="text-xs text-slate-500 font-mono w-6">{index + 1}.</span>
            <p className="flex-1 text-sm text-white">
              {item.text}
              {item.isReversed && (
                <span className="ml-2 text-xs text-blue-400">(R)</span>
              )}
            </p>
            <div className="flex gap-2">
              {labels.map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-xs text-slate-500"
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScaleEditor
