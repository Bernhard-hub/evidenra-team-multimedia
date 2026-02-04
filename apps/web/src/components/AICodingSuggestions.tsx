import { useState, useEffect } from 'react'
import { type Code } from '@/stores/projectStore'

interface AICodingSuggestionsProps {
  selectedText: string
  codes: Code[]
  onApplyCoding: (codeId: string, comment?: string) => void
  onCreateCode: (name: string, color: string) => Promise<string>
  position?: { x: number; y: number }
  onClose: () => void
}

interface Suggestion {
  type: 'existing' | 'new'
  codeId?: string
  codeName: string
  codeColor: string
  confidence: number
  reasoning: string
}

export default function AICodingSuggestions({
  selectedText,
  codes,
  onApplyCoding,
  onCreateCode,
  position,
  onClose,
}: AICodingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (selectedText.trim()) {
      generateSuggestions()
    }
  }, [selectedText])

  const generateSuggestions = async () => {
    setIsLoading(true)

    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // In a real implementation, this would call an AI API
    // For now, use keyword matching and heuristics
    const results = analyzeText(selectedText, codes)
    setSuggestions(results)
    setIsLoading(false)
  }

  const handleApply = async (suggestion: Suggestion) => {
    if (suggestion.type === 'new') {
      const newCodeId = await onCreateCode(suggestion.codeName, suggestion.codeColor)
      if (newCodeId) {
        onApplyCoding(newCodeId, `KI-Vorschlag: ${suggestion.reasoning}`)
      }
    } else if (suggestion.codeId) {
      onApplyCoding(suggestion.codeId, `KI-Vorschlag: ${suggestion.reasoning}`)
    }
    onClose()
  }

  const displayedSuggestions = showAll ? suggestions : suggestions.slice(0, 3)

  return (
    <div
      className="fixed z-50 bg-surface-900 border border-surface-700 rounded-xl shadow-xl w-80"
      style={position ? { left: position.x, top: position.y } : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
    >
      {/* Header */}
      <div className="p-3 border-b border-surface-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-surface-100">KI-Vorschläge</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-surface-800 text-surface-400"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Selected Text Preview */}
      <div className="px-3 py-2 bg-surface-800/50 border-b border-surface-800">
        <p className="text-xs text-surface-500 mb-1">Ausgewählter Text:</p>
        <p className="text-xs text-surface-300 line-clamp-2 italic">
          "{selectedText.slice(0, 100)}{selectedText.length > 100 ? '...' : ''}"
        </p>
      </div>

      {/* Content */}
      <div className="p-3 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-surface-400">Analysiere Text...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-8 text-center">
            <svg className="w-10 h-10 text-surface-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-surface-400">Keine passenden Codes gefunden</p>
            <p className="text-xs text-surface-500 mt-1">Erstellen Sie einen neuen Code manuell</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleApply(suggestion)}
                className="w-full p-3 rounded-lg border border-surface-700 hover:border-surface-600 hover:bg-surface-800/50 transition-colors text-left group"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: suggestion.codeColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-surface-100">{suggestion.codeName}</span>
                      {suggestion.type === 'new' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/10 text-green-400">
                          Neu
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">
                      {suggestion.reasoning}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <div className="flex-1 h-1 bg-surface-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            suggestion.confidence >= 0.8 ? 'bg-green-500' :
                            suggestion.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${suggestion.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-surface-500">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-surface-500 group-hover:text-surface-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </button>
            ))}

            {suggestions.length > 3 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-2 text-sm text-surface-400 hover:text-surface-200"
              >
                +{suggestions.length - 3} weitere Vorschläge anzeigen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-surface-800 flex items-center justify-between">
        <p className="text-[10px] text-surface-500">
          KI-basierte Vorschläge
        </p>
        <button
          onClick={onClose}
          className="text-xs text-surface-400 hover:text-surface-200"
        >
          Manuell kodieren
        </button>
      </div>
    </div>
  )
}

// Text analysis for code suggestions (simplified version)
function analyzeText(text: string, codes: Code[]): Suggestion[] {
  const suggestions: Suggestion[] = []
  const lowerText = text.toLowerCase()

  // Keyword patterns for common qualitative research themes
  const patterns: Record<string, { keywords: string[]; color: string }> = {
    'Emotion': { keywords: ['fühle', 'fühlt', 'gefühl', 'freude', 'angst', 'wut', 'trauer', 'glücklich', 'traurig', 'frustriert'], color: '#ec4899' },
    'Motivation': { keywords: ['motivation', 'antrieb', 'ziel', 'möchte', 'will', 'strebe', 'wunsch'], color: '#8b5cf6' },
    'Erfahrung': { keywords: ['erfahrung', 'erlebnis', 'erlebt', 'passiert', 'geschehen', 'damals'], color: '#06b6d4' },
    'Herausforderung': { keywords: ['problem', 'schwierig', 'herausforderung', 'hürde', 'hindernis', 'konflikt'], color: '#ef4444' },
    'Lösung': { keywords: ['lösung', 'lösen', 'bewältigen', 'überwinden', 'strategie', 'ansatz'], color: '#22c55e' },
    'Beziehung': { keywords: ['beziehung', 'zusammen', 'team', 'kollege', 'chef', 'familie', 'freund'], color: '#f59e0b' },
    'Kommunikation': { keywords: ['kommunikation', 'gespräch', 'erzählt', 'gesagt', 'mitgeteilt', 'austausch'], color: '#3b82f6' },
    'Veränderung': { keywords: ['veränderung', 'wandel', 'entwicklung', 'neu', 'anders', 'früher', 'jetzt'], color: '#14b8a6' },
    'Bewertung': { keywords: ['gut', 'schlecht', 'besser', 'wichtig', 'positiv', 'negativ', 'bewertung'], color: '#eab308' },
    'Arbeit': { keywords: ['arbeit', 'job', 'beruf', 'aufgabe', 'projekt', 'tätigkeit', 'arbeitsplatz'], color: '#6366f1' },
  }

  // Check existing codes first
  for (const code of codes) {
    const codeLower = code.name.toLowerCase()
    const codeWords = codeLower.split(/\s+/)

    // Check if any code word appears in the text
    let matchScore = 0
    for (const word of codeWords) {
      if (word.length >= 3 && lowerText.includes(word)) {
        matchScore += 1
      }
    }

    if (matchScore > 0) {
      const confidence = Math.min(0.95, 0.5 + (matchScore * 0.15))
      suggestions.push({
        type: 'existing',
        codeId: code.id,
        codeName: code.name,
        codeColor: code.color,
        confidence,
        reasoning: `Enthält Schlüsselwörter des Codes "${code.name}"`,
      })
    }
  }

  // Check pattern matches for new code suggestions
  for (const [name, { keywords, color }] of Object.entries(patterns)) {
    // Skip if we already have this code
    if (codes.some(c => c.name.toLowerCase() === name.toLowerCase())) continue

    const matchCount = keywords.filter(kw => lowerText.includes(kw)).length
    if (matchCount > 0) {
      const confidence = Math.min(0.9, 0.3 + (matchCount * 0.1))
      suggestions.push({
        type: 'new',
        codeName: name,
        codeColor: color,
        confidence,
        reasoning: `Text enthält ${matchCount} thematische Schlüsselwörter`,
      })
    }
  }

  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence)

  return suggestions.slice(0, 8)
}

// Compact suggestion chip component
export function AISuggestionChip({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-2 py-1 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-400 hover:from-purple-500/20 hover:to-pink-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      KI-Vorschlag
    </button>
  )
}
