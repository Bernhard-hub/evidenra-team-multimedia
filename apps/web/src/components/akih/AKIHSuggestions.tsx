/**
 * AKIH Suggestions Panel
 * Shows improvement suggestions based on AKIH score analysis
 */

import { useState } from 'react'
import {
  IconBulb,
  IconChevronDown,
  IconChevronUp,
  IconArrowUp,
  IconAlertTriangle,
  IconInfoCircle,
} from '@tabler/icons-react'
import type { AKIHSuggestion } from '@/types/akih'

interface AKIHSuggestionsProps {
  suggestions: AKIHSuggestion[]
  maxVisible?: number
  onSuggestionClick?: (suggestion: AKIHSuggestion) => void
}

export default function AKIHSuggestions({
  suggestions,
  maxVisible = 3,
  onSuggestionClick,
}: AKIHSuggestionsProps) {
  const [expanded, setExpanded] = useState(false)

  if (suggestions.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
        <IconBulb className="w-8 h-8 text-green-400 mx-auto mb-2" />
        <p className="text-sm text-green-300">Keine Verbesserungsvorschläge</p>
        <p className="text-xs text-green-400/70 mt-1">
          Ihr AKIH-Score ist auf einem guten Niveau
        </p>
      </div>
    )
  }

  const visibleSuggestions = expanded
    ? suggestions
    : suggestions.slice(0, maxVisible)

  const hasMore = suggestions.length > maxVisible

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconBulb size={16} className="text-amber-400" />
          <h4 className="text-sm font-medium text-surface-300">Verbesserungsvorschläge</h4>
        </div>
        <span className="text-xs text-surface-500">
          {suggestions.length} {suggestions.length === 1 ? 'Vorschlag' : 'Vorschläge'}
        </span>
      </div>

      {/* Suggestions list */}
      <div className="space-y-2">
        {visibleSuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onClick={() => onSuggestionClick?.(suggestion)}
          />
        ))}
      </div>

      {/* Show more button */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-2 text-xs text-surface-400 hover:text-surface-200 transition-colors"
        >
          {expanded ? (
            <>
              <IconChevronUp size={14} />
              Weniger anzeigen
            </>
          ) : (
            <>
              <IconChevronDown size={14} />
              {suggestions.length - maxVisible} weitere anzeigen
            </>
          )}
        </button>
      )}
    </div>
  )
}

function SuggestionCard({
  suggestion,
  onClick,
}: {
  suggestion: AKIHSuggestion
  onClick?: () => void
}) {
  const priorityConfig = {
    high: {
      icon: IconAlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: 'Hoch',
    },
    medium: {
      icon: IconInfoCircle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      label: 'Mittel',
    },
    low: {
      icon: IconBulb,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      label: 'Niedrig',
    },
  }

  const config = priorityConfig[suggestion.priority]
  const Icon = config.icon

  return (
    <div
      className={`${config.bg} border ${config.border} rounded-lg p-3 cursor-pointer hover:bg-opacity-20 transition-colors`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Priority icon */}
        <div className={`${config.color} mt-0.5`}>
          <Icon size={18} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="text-sm font-medium text-surface-200 truncate">
              {suggestion.title}
            </h5>
            <span className={`text-xs px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-surface-400 line-clamp-2">
            {suggestion.description}
          </p>
        </div>

        {/* Impact indicator */}
        <div className="flex flex-col items-center text-center flex-shrink-0">
          <div className="flex items-center gap-0.5 text-green-400">
            <IconArrowUp size={12} />
            <span className="text-xs font-medium">+{suggestion.impact}</span>
          </div>
          <span className="text-[10px] text-surface-500">Impact</span>
        </div>
      </div>
    </div>
  )
}
