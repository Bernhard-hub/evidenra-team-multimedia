/**
 * Scale Browser
 * EVIDENRA Research - Browse & Search Validated Scales
 *
 * Features:
 * - Search across ZIS/GESIS and other repositories
 * - Filter by construct, domain, language
 * - View scale details and psychometric properties
 * - Compare scales side by side
 * - Adapt scales for use in projects
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
  IconSearch,
  IconFilter,
  IconX,
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
  IconCopy,
  IconCheck,
  IconPlus,
  IconStar,
  IconStarFilled,
  IconAdjustments,
  IconLanguage,
  IconUsers,
  IconChartBar,
  IconBook,
  IconInfoCircle,
  IconArrowRight,
  IconColumns,
  IconLayoutList,
} from '@tabler/icons-react'

import {
  ZISRepository,
  ZISScale,
  ZISSearchOptions,
  ZISSearchResult,
  ZIS_SCALES_DATABASE,
} from '@services/questionnaire/repositories'

import { Scale } from '@services/questionnaire/types'

// ============================================================================
// TYPES
// ============================================================================

interface ScaleBrowserProps {
  onSelectScale?: (scale: ZISScale) => void
  onAdaptScale?: (scale: ZISScale) => void
  onOpenNexus?: (prompt: string) => void
  language?: 'de' | 'en'
}

type ViewMode = 'list' | 'grid'
type SortOption = 'name' | 'reliability' | 'items' | 'relevance'

// ============================================================================
// CONSTANTS
// ============================================================================

const DOMAINS = [
  { id: 'personality', label: { de: 'Persönlichkeit', en: 'Personality' } },
  { id: 'health', label: { de: 'Gesundheit', en: 'Health' } },
  { id: 'work', label: { de: 'Arbeit & Beruf', en: 'Work & Career' } },
  { id: 'wellbeing', label: { de: 'Wohlbefinden', en: 'Well-being' } },
  { id: 'social', label: { de: 'Soziales', en: 'Social' } },
  { id: 'education', label: { de: 'Bildung', en: 'Education' } },
]

const TRANSLATIONS = {
  de: {
    title: 'Skalen-Browser',
    subtitle: 'Validierte Messinstrumente durchsuchen',
    searchPlaceholder: 'Konstrukt, Skalenname oder Autor suchen...',
    filters: 'Filter',
    domain: 'Bereich',
    allDomains: 'Alle Bereiche',
    itemCount: 'Itemanzahl',
    reliability: 'Reliabilität',
    language: 'Sprache',
    sortBy: 'Sortieren nach',
    name: 'Name',
    items: 'Items',
    results: 'Ergebnisse',
    noResults: 'Keine Skalen gefunden',
    tryDifferent: 'Versuche andere Suchbegriffe',
    viewDetails: 'Details anzeigen',
    adaptScale: 'Skala adaptieren',
    copyItems: 'Items kopieren',
    copied: 'Kopiert!',
    originalSource: 'Originalquelle',
    psychometrics: 'Psychometrische Eigenschaften',
    cronbachAlpha: "Cronbach's α",
    validationSample: 'Validierungsstichprobe',
    constructs: 'Konstrukte',
    responseScale: 'Antwortskala',
    points: 'Punkte',
    reference: 'Referenz',
    askNexus: 'NEXUS nach Alternativen fragen',
    favorites: 'Favoriten',
    addToFavorites: 'Zu Favoriten hinzufügen',
    removeFromFavorites: 'Aus Favoriten entfernen',
    compareScales: 'Skalen vergleichen',
    clearSelection: 'Auswahl löschen',
    selected: 'ausgewählt',
  },
  en: {
    title: 'Scale Browser',
    subtitle: 'Browse validated measurement instruments',
    searchPlaceholder: 'Search construct, scale name or author...',
    filters: 'Filters',
    domain: 'Domain',
    allDomains: 'All domains',
    itemCount: 'Item count',
    reliability: 'Reliability',
    language: 'Language',
    sortBy: 'Sort by',
    name: 'Name',
    items: 'Items',
    results: 'Results',
    noResults: 'No scales found',
    tryDifferent: 'Try different search terms',
    viewDetails: 'View details',
    adaptScale: 'Adapt scale',
    copyItems: 'Copy items',
    copied: 'Copied!',
    originalSource: 'Original source',
    psychometrics: 'Psychometric properties',
    cronbachAlpha: "Cronbach's α",
    validationSample: 'Validation sample',
    constructs: 'Constructs',
    responseScale: 'Response scale',
    points: 'points',
    reference: 'Reference',
    askNexus: 'Ask NEXUS for alternatives',
    favorites: 'Favorites',
    addToFavorites: 'Add to favorites',
    removeFromFavorites: 'Remove from favorites',
    compareScales: 'Compare scales',
    clearSelection: 'Clear selection',
    selected: 'selected',
  },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ScaleBrowser: React.FC<ScaleBrowserProps> = ({
  onSelectScale,
  onAdaptScale,
  onOpenNexus,
  language = 'de',
}) => {
  const t = TRANSLATIONS[language]

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedScale, setExpandedScale] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Search and filter results
  const searchResults = useMemo(() => {
    let results: ZISScale[]

    if (searchQuery.trim()) {
      results = ZISRepository.search({
        query: searchQuery,
        language,
        domain: selectedDomain || undefined,
      })
    } else {
      results = [...ZIS_SCALES_DATABASE]
    }

    // Filter by domain
    if (selectedDomain) {
      results = results.filter(scale =>
        scale.constructs.some(c =>
          c.toLowerCase().includes(selectedDomain.toLowerCase())
        )
      )
    }

    // Sort results
    switch (sortBy) {
      case 'reliability':
        results.sort((a, b) =>
          (b.psychometrics.cronbachAlpha || 0) - (a.psychometrics.cronbachAlpha || 0)
        )
        break
      case 'items':
        results.sort((a, b) => a.items.length - b.items.length)
        break
      case 'name':
      default:
        results.sort((a, b) => a.name.localeCompare(b.name, language))
    }

    return results
  }, [searchQuery, selectedDomain, sortBy, language])

  // Toggle favorite
  const toggleFavorite = useCallback((scaleId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev)
      if (newSet.has(scaleId)) {
        newSet.delete(scaleId)
      } else {
        newSet.add(scaleId)
      }
      return newSet
    })
  }, [])

  // Toggle compare selection
  const toggleCompare = useCallback((scaleId: string) => {
    setSelectedForCompare(prev => {
      const newSet = new Set(prev)
      if (newSet.has(scaleId)) {
        newSet.delete(scaleId)
      } else if (newSet.size < 3) {
        newSet.add(scaleId)
      }
      return newSet
    })
  }, [])

  // Copy items to clipboard
  const copyItems = useCallback(async (scale: ZISScale) => {
    const itemsText = scale.items.map((item, i) => `${i + 1}. ${item}`).join('\n')
    await navigator.clipboard.writeText(itemsText)
    setCopiedId(scale.id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  // Favorite scales
  const favoriteScales = useMemo(() =>
    ZIS_SCALES_DATABASE.filter(s => favorites.has(s.id)),
    [favorites]
  )

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white">{t.title}</h2>
        <p className="text-sm text-slate-400">{t.subtitle}</p>
      </div>

      {/* Search & Filters */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        {/* Search bar */}
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
            className="w-full pl-10 pr-10 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <IconX size={18} />
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Domain filter */}
          <select
            value={selectedDomain || ''}
            onChange={(e) => setSelectedDomain(e.target.value || null)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
          >
            <option value="">{t.allDomains}</option>
            {DOMAINS.map(domain => (
              <option key={domain.id} value={domain.id}>
                {domain.label[language]}
              </option>
            ))}
          </select>

          {/* Sort by */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
          >
            <option value="name">{t.sortBy}: {t.name}</option>
            <option value="reliability">{t.sortBy}: {t.reliability}</option>
            <option value="items">{t.sortBy}: {t.items}</option>
          </select>

          {/* View mode */}
          <div className="flex rounded-lg border border-slate-700 overflow-hidden ml-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'}`}
            >
              <IconLayoutList size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'}`}
            >
              <IconColumns size={18} />
            </button>
          </div>
        </div>

        {/* Compare bar */}
        {selectedForCompare.size > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <span className="text-sm text-purple-300">
              {selectedForCompare.size} {t.selected}
            </span>
            <button
              onClick={() => setSelectedForCompare(new Set())}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              {t.clearSelection}
            </button>
            <button
              className="ml-auto px-3 py-1 rounded bg-purple-500 text-white text-sm hover:bg-purple-600"
            >
              {t.compareScales}
            </button>
          </div>
        )}
      </div>

      {/* Favorites */}
      {favoriteScales.length > 0 && !searchQuery && (
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-medium text-amber-400 flex items-center gap-2 mb-3">
            <IconStarFilled size={16} />
            {t.favorites}
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {favoriteScales.map(scale => (
              <button
                key={scale.id}
                onClick={() => setExpandedScale(scale.id)}
                className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm whitespace-nowrap hover:bg-amber-500/20 transition-colors"
              >
                {scale.shortName || scale.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs text-slate-500 mb-3">
          {searchResults.length} {t.results}
        </p>

        {searchResults.length === 0 ? (
          <div className="text-center py-12">
            <IconSearch size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">{t.noResults}</p>
            <p className="text-sm text-slate-500 mt-1">{t.tryDifferent}</p>
            <button
              onClick={() => onOpenNexus?.(
                language === 'de'
                  ? `Ich suche eine validierte Skala für "${searchQuery}". Kannst du mir helfen?`
                  : `I'm looking for a validated scale for "${searchQuery}". Can you help me?`
              )}
              className="mt-4 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30 transition-colors"
            >
              {t.askNexus}
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
            {searchResults.map(scale => (
              <ScaleListItem
                key={scale.id}
                scale={scale}
                isExpanded={expandedScale === scale.id}
                isFavorite={favorites.has(scale.id)}
                isSelectedForCompare={selectedForCompare.has(scale.id)}
                copiedId={copiedId}
                onToggleExpand={() => setExpandedScale(
                  expandedScale === scale.id ? null : scale.id
                )}
                onToggleFavorite={() => toggleFavorite(scale.id)}
                onToggleCompare={() => toggleCompare(scale.id)}
                onAdapt={() => onAdaptScale?.(scale)}
                onCopyItems={() => copyItems(scale)}
                language={language}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {searchResults.map(scale => (
              <ScaleGridItem
                key={scale.id}
                scale={scale}
                isFavorite={favorites.has(scale.id)}
                onSelect={() => setExpandedScale(scale.id)}
                onToggleFavorite={() => toggleFavorite(scale.id)}
                language={language}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ScaleListItemProps {
  scale: ZISScale
  isExpanded: boolean
  isFavorite: boolean
  isSelectedForCompare: boolean
  copiedId: string | null
  onToggleExpand: () => void
  onToggleFavorite: () => void
  onToggleCompare: () => void
  onAdapt: () => void
  onCopyItems: () => void
  language: 'de' | 'en'
}

const ScaleListItem: React.FC<ScaleListItemProps> = ({
  scale,
  isExpanded,
  isFavorite,
  isSelectedForCompare,
  copiedId,
  onToggleExpand,
  onToggleFavorite,
  onToggleCompare,
  onAdapt,
  onCopyItems,
  language,
}) => {
  const t = TRANSLATIONS[language]

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors ${
      isExpanded ? 'border-purple-500/30 bg-slate-800/50' : 'border-slate-700 bg-slate-800/30'
    }`}>
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full p-4 flex items-center gap-3 hover:bg-slate-800/50 transition-colors"
      >
        {isExpanded ? (
          <IconChevronDown size={16} className="text-slate-400" />
        ) : (
          <IconChevronRight size={16} className="text-slate-400" />
        )}

        <div className="flex-1 text-left">
          <h4 className="text-sm font-medium text-white">
            {scale.name}
            {scale.shortName && (
              <span className="ml-2 text-xs text-slate-400">({scale.shortName})</span>
            )}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {scale.authors.join(', ')} ({scale.year})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Item count */}
          <span className="px-2 py-1 rounded bg-slate-700/50 text-xs text-slate-400">
            {scale.items.length} {t.items}
          </span>

          {/* Reliability */}
          <span className={`px-2 py-1 rounded text-xs ${
            scale.psychometrics.cronbachAlpha >= 0.80
              ? 'bg-green-500/20 text-green-400'
              : scale.psychometrics.cronbachAlpha >= 0.70
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            α = {scale.psychometrics.cronbachAlpha?.toFixed(2)}
          </span>

          {/* Favorite */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite()
            }}
            className="p-1 rounded hover:bg-slate-700"
          >
            {isFavorite ? (
              <IconStarFilled size={16} className="text-amber-400" />
            ) : (
              <IconStar size={16} className="text-slate-500" />
            )}
          </button>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 border-t border-slate-700/50 space-y-4">
          {/* Description */}
          <p className="text-sm text-slate-300">{scale.description}</p>

          {/* Constructs */}
          <div>
            <h5 className="text-xs text-slate-500 mb-2">{t.constructs}</h5>
            <div className="flex flex-wrap gap-1">
              {scale.constructs.map((construct, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs"
                >
                  {construct}
                </span>
              ))}
            </div>
          </div>

          {/* Psychometrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2 rounded bg-slate-800/50">
              <span className="text-xs text-slate-500">{t.cronbachAlpha}</span>
              <p className="text-lg font-bold text-white">
                {scale.psychometrics.cronbachAlpha?.toFixed(2)}
              </p>
            </div>
            <div className="p-2 rounded bg-slate-800/50">
              <span className="text-xs text-slate-500">{t.validationSample}</span>
              <p className="text-lg font-bold text-white">
                n = {scale.psychometrics.validationSampleSize}
              </p>
            </div>
            <div className="p-2 rounded bg-slate-800/50">
              <span className="text-xs text-slate-500">{t.responseScale}</span>
              <p className="text-lg font-bold text-white">
                {scale.responseScale.points} {t.points}
              </p>
            </div>
          </div>

          {/* Items preview */}
          <div>
            <h5 className="text-xs text-slate-500 mb-2">{t.items}</h5>
            <div className="space-y-1 max-h-[150px] overflow-y-auto">
              {scale.items.map((item, i) => (
                <p key={i} className="text-xs text-slate-400 pl-4 border-l border-slate-700">
                  {i + 1}. {item}
                </p>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onAdapt}
              className="flex-1 py-2 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
            >
              <IconPlus size={16} />
              {t.adaptScale}
            </button>
            <button
              onClick={onCopyItems}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors flex items-center gap-2"
            >
              {copiedId === scale.id ? (
                <>
                  <IconCheck size={16} className="text-green-400" />
                  {t.copied}
                </>
              ) : (
                <>
                  <IconCopy size={16} />
                  {t.copyItems}
                </>
              )}
            </button>
            {scale.sourceUrl && (
              <a
                href={scale.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                <IconExternalLink size={16} />
              </a>
            )}
          </div>

          {/* Reference */}
          {scale.reference && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <h5 className="text-xs text-slate-500 mb-1">{t.reference}</h5>
              <p className="text-xs text-slate-400 italic">{scale.reference}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ScaleGridItemProps {
  scale: ZISScale
  isFavorite: boolean
  onSelect: () => void
  onToggleFavorite: () => void
  language: 'de' | 'en'
}

const ScaleGridItem: React.FC<ScaleGridItemProps> = ({
  scale,
  isFavorite,
  onSelect,
  onToggleFavorite,
  language,
}) => {
  const t = TRANSLATIONS[language]

  return (
    <button
      onClick={onSelect}
      className="p-4 rounded-xl border border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 transition-colors text-left"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-white">
          {scale.shortName || scale.name}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
          className="p-1 -mr-1 -mt-1"
        >
          {isFavorite ? (
            <IconStarFilled size={14} className="text-amber-400" />
          ) : (
            <IconStar size={14} className="text-slate-500" />
          )}
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-3 line-clamp-2">
        {scale.description}
      </p>

      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded bg-slate-700/50 text-xs text-slate-400">
          {scale.items.length} items
        </span>
        <span className={`px-2 py-0.5 rounded text-xs ${
          scale.psychometrics.cronbachAlpha >= 0.80
            ? 'bg-green-500/20 text-green-400'
            : 'bg-amber-500/20 text-amber-400'
        }`}>
          α = {scale.psychometrics.cronbachAlpha?.toFixed(2)}
        </span>
      </div>
    </button>
  )
}

export default ScaleBrowser
