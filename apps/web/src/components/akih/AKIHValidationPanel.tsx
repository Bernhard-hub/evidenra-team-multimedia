/**
 * AKIH Validation Panel
 * UI for validating AI codings
 */

import { useState } from 'react'
import {
  IconCheck,
  IconPencil,
  IconX,
  IconArrowRight,
  IconRobot,
  IconUser,
  IconMessageCircle,
} from '@tabler/icons-react'
import type { ValidationStatus, AKIHScoreResult } from '@/types/akih'

interface CodingToValidate {
  id: string
  codeId: string
  codeName: string
  codeColor: string
  documentName: string
  text: string
  aiReasoning?: string
  codingMethod?: string
}

interface AKIHValidationPanelProps {
  codings: CodingToValidate[]
  codes: Array<{ id: string; name: string; color: string }>
  validationStats: AKIHScoreResult['validationStats']
  onValidate: (codingId: string, status: ValidationStatus, options?: {
    newCodeId?: string
    notes?: string
  }) => void
  onSkip?: (codingId: string) => void
}

export default function AKIHValidationPanel({
  codings,
  codes,
  validationStats,
  onValidate,
  onSkip,
}: AKIHValidationPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const currentCoding = codings[currentIndex]

  if (codings.length === 0) {
    return (
      <div className="bg-surface-900 rounded-xl border border-surface-800 p-6 text-center">
        <IconCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-surface-100 mb-1">
          Alle Kodierungen validiert
        </h3>
        <p className="text-sm text-surface-400">
          Keine weiteren AI-Kodierungen zur Überprüfung vorhanden.
        </p>
      </div>
    )
  }

  const handleValidate = (status: ValidationStatus) => {
    onValidate(currentCoding.id, status, {
      newCodeId: status === 'modified' ? selectedCode || undefined : undefined,
      notes: notes || undefined,
    })

    // Move to next
    if (currentIndex < codings.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedCode(null)
      setNotes('')
      setShowNotes(false)
    }
  }

  const handleSkip = () => {
    onSkip?.(currentCoding.id)
    if (currentIndex < codings.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedCode(null)
      setNotes('')
      setShowNotes(false)
    }
  }

  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
      {/* Progress header */}
      <div className="bg-surface-800/50 px-4 py-3 border-b border-surface-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-surface-400">Validierungs-Fortschritt</span>
          <span className="text-sm text-surface-300">
            {currentIndex + 1} / {codings.length}
          </span>
        </div>
        <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / codings.length) * 100}%` }}
          />
        </div>

        {/* Stats mini */}
        <div className="flex items-center gap-4 mt-2 text-xs">
          <span className="text-green-400">✓ {validationStats.accepted}</span>
          <span className="text-amber-400">✎ {validationStats.modified}</span>
          <span className="text-red-400">✗ {validationStats.rejected}</span>
          <span className="text-surface-500">○ {validationStats.pending}</span>
        </div>
      </div>

      {/* Current coding */}
      <div className="p-4 space-y-4">
        {/* Document info */}
        <div className="text-xs text-surface-500">
          {currentCoding.documentName}
        </div>

        {/* Text excerpt */}
        <div className="bg-surface-800 rounded-lg p-3 border-l-4 border-surface-600">
          <p className="text-sm text-surface-200 leading-relaxed">
            "{currentCoding.text}"
          </p>
        </div>

        {/* AI assigned code */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-surface-400">
            <IconRobot size={14} />
            <span>AI-Code:</span>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
            style={{
              backgroundColor: `${currentCoding.codeColor}20`,
              borderLeft: `3px solid ${currentCoding.codeColor}`,
            }}
          >
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: currentCoding.codeColor }}
            />
            <span className="text-surface-200">{currentCoding.codeName}</span>
          </div>
        </div>

        {/* AI reasoning */}
        {currentCoding.aiReasoning && (
          <div className="bg-surface-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-surface-400 mb-2">
              <IconRobot size={12} />
              <span>AI-Begründung:</span>
            </div>
            <p className="text-xs text-surface-300 italic">
              "{currentCoding.aiReasoning}"
            </p>
          </div>
        )}

        {/* Code selection for modification */}
        {selectedCode !== null && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-surface-400">
              <IconUser size={14} />
              <span>Korrekter Code:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {codes.map((code) => (
                <button
                  key={code.id}
                  onClick={() => setSelectedCode(code.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                    selectedCode === code.id
                      ? 'bg-primary-500/20 border border-primary-500'
                      : 'bg-surface-800 hover:bg-surface-700'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: code.color }}
                  />
                  <span className="truncate text-surface-300">{code.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes input */}
        {showNotes && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-surface-400">
              <IconMessageCircle size={14} />
              <span>Notiz (optional):</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Begründung oder Anmerkung..."
              className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-surface-200 placeholder-surface-500 resize-none focus:outline-none focus:border-primary-500"
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="border-t border-surface-800 p-4">
        <div className="flex items-center gap-2">
          {/* Accept */}
          <button
            onClick={() => handleValidate('accepted')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
          >
            <IconCheck size={18} />
            <span className="text-sm font-medium">Akzeptieren</span>
          </button>

          {/* Modify */}
          <button
            onClick={() => {
              if (selectedCode === null) {
                setSelectedCode(currentCoding.codeId)
              } else {
                handleValidate('modified')
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors"
          >
            <IconPencil size={18} />
            <span className="text-sm font-medium">
              {selectedCode !== null ? 'Speichern' : 'Korrigieren'}
            </span>
          </button>

          {/* Reject */}
          <button
            onClick={() => handleValidate('rejected')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            <IconX size={18} />
            <span className="text-sm font-medium">Ablehnen</span>
          </button>
        </div>

        {/* Secondary actions */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-xs text-surface-400 hover:text-surface-200 transition-colors"
          >
            {showNotes ? 'Notiz ausblenden' : '+ Notiz hinzufügen'}
          </button>

          <button
            onClick={handleSkip}
            className="flex items-center gap-1 text-xs text-surface-400 hover:text-surface-200 transition-colors"
          >
            Überspringen
            <IconArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="bg-surface-800/30 px-4 py-2 text-xs text-surface-500 text-center">
        Tastenkürzel: <kbd className="px-1 py-0.5 bg-surface-700 rounded">A</kbd> Akzeptieren,{' '}
        <kbd className="px-1 py-0.5 bg-surface-700 rounded">M</kbd> Korrigieren,{' '}
        <kbd className="px-1 py-0.5 bg-surface-700 rounded">R</kbd> Ablehnen,{' '}
        <kbd className="px-1 py-0.5 bg-surface-700 rounded">S</kbd> Überspringen
      </div>
    </div>
  )
}
