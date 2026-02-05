/**
 * ParaphrasePanel - Create and edit paraphrases with AI assistance
 *
 * Supports Mayring's summarizing content analysis method:
 * 1. Paraphrasierung - Summarize in own words (max 255 chars like MAXQDA)
 * 2. Generalisierung - Abstract to higher level
 * 3. Integration with categories for reduction step
 */

import { useState, useEffect, useCallback } from 'react'
import {
  IconX,
  IconSparkles,
  IconCheck,
  IconLoader2,
  IconPencil,
  IconTrash,
  IconWand,
  IconArrowUp,
  IconCategory
} from '@tabler/icons-react'
import { claude } from '@/lib/claude'
import { useParaphraseStore, Paraphrase } from '@/stores/paraphraseStore'

interface ParaphrasePanelProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  projectId: string
  selection: {
    start: number
    end: number
    text: string
  } | null
  existingParaphrase?: Paraphrase | null
  onParaphraseCreated?: (paraphrase: Paraphrase) => void
}

const MAX_PARAPHRASE_LENGTH = 255  // MAXQDA standard

export default function ParaphrasePanel({
  isOpen,
  onClose,
  documentId,
  projectId,
  selection,
  existingParaphrase,
  onParaphraseCreated
}: ParaphrasePanelProps) {
  const {
    createParaphrase,
    updateParaphrase,
    deleteParaphrase,
    categories,
    isLoading
  } = useParaphraseStore()

  const [paraphraseText, setParaphraseText] = useState('')
  const [generalization, setGeneralization] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingGen, setIsGeneratingGen] = useState(false)
  const [wasAiGenerated, setWasAiGenerated] = useState(false)
  const [showGeneralization, setShowGeneralization] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize from existing paraphrase or reset
  useEffect(() => {
    if (existingParaphrase) {
      setParaphraseText(existingParaphrase.paraphraseText)
      setGeneralization(existingParaphrase.generalization || '')
      setSelectedCategory(existingParaphrase.categoryId)
      setShowGeneralization(!!existingParaphrase.generalization)
      setWasAiGenerated(existingParaphrase.isAiGenerated)
    } else {
      setParaphraseText('')
      setGeneralization('')
      setSelectedCategory(null)
      setShowGeneralization(false)
      setWasAiGenerated(false)
    }
    setError(null)
  }, [existingParaphrase, selection])

  // AI-assisted paraphrasing
  const handleAIParaphrase = useCallback(async () => {
    if (!selection?.text) return

    setIsGenerating(true)
    setError(null)

    try {
      const prompt = `Du bist ein Experte für qualitative Inhaltsanalyse nach Mayring.

Paraphrasiere den folgenden Textabschnitt:
- Fasse den Inhalt in eigenen Worten zusammen
- Streiche nicht-inhaltsrelevante Teile (Füllwörter, Wiederholungen)
- Formuliere knapp und prägnant (max. ${MAX_PARAPHRASE_LENGTH} Zeichen)
- Behalte den Sinngehalt bei
- Verwende die grammatikalische Form des Originals

Originaltext:
"${selection.text}"

Antworte NUR mit der Paraphrase, ohne Erklärungen oder Anführungszeichen.`

      const response = await claude.sendMessage([
        { role: 'user', content: prompt }
      ])

      const paraphrase = response.content[0]?.type === 'text'
        ? response.content[0].text.trim().slice(0, MAX_PARAPHRASE_LENGTH)
        : ''

      setParaphraseText(paraphrase)
      setWasAiGenerated(true)
    } catch (err) {
      console.error('AI paraphrase error:', err)
      setError('KI-Paraphrasierung fehlgeschlagen. Bitte manuell eingeben.')
    } finally {
      setIsGenerating(false)
    }
  }, [selection?.text])

  // AI-assisted generalization
  const handleAIGeneralization = useCallback(async () => {
    if (!paraphraseText) return

    setIsGeneratingGen(true)
    setError(null)

    try {
      const prompt = `Du bist ein Experte für qualitative Inhaltsanalyse nach Mayring.

Generalisiere die folgende Paraphrase auf ein höheres Abstraktionsniveau:
- Abstrahiere auf ein einheitliches Abstraktionsniveau
- Verallgemeinere spezifische Aussagen
- Behalte den wesentlichen Inhalt bei
- Formuliere kurz (max. 100 Zeichen)

Paraphrase:
"${paraphraseText}"

Antworte NUR mit der Generalisierung, ohne Erklärungen oder Anführungszeichen.`

      const response = await claude.sendMessage([
        { role: 'user', content: prompt }
      ])

      const gen = response.content[0]?.type === 'text'
        ? response.content[0].text.trim().slice(0, 100)
        : ''

      setGeneralization(gen)
      setShowGeneralization(true)
    } catch (err) {
      console.error('AI generalization error:', err)
      setError('KI-Generalisierung fehlgeschlagen.')
    } finally {
      setIsGeneratingGen(false)
    }
  }, [paraphraseText])

  // Save paraphrase
  const handleSave = async () => {
    if (!paraphraseText.trim()) {
      setError('Bitte gib eine Paraphrase ein.')
      return
    }

    if (existingParaphrase) {
      // Update existing
      await updateParaphrase(existingParaphrase.id, {
        paraphraseText: paraphraseText.trim(),
        generalization: generalization.trim() || undefined,
        categoryId: selectedCategory
      })
      onClose()
    } else if (selection) {
      // Create new
      const result = await createParaphrase({
        documentId,
        projectId,
        startOffset: selection.start,
        endOffset: selection.end,
        originalText: selection.text,
        paraphraseText: paraphraseText.trim(),
        generalization: generalization.trim() || undefined,
        isAiGenerated: wasAiGenerated
      })

      if (result) {
        onParaphraseCreated?.(result)
        onClose()
      }
    }
  }

  // Delete paraphrase
  const handleDelete = async () => {
    if (!existingParaphrase) return

    if (confirm('Paraphrase wirklich löschen?')) {
      await deleteParaphrase(existingParaphrase.id)
      onClose()
    }
  }

  if (!isOpen) return null

  const originalText = existingParaphrase?.originalText || selection?.text || ''
  const charCount = paraphraseText.length
  const isOverLimit = charCount > MAX_PARAPHRASE_LENGTH

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-900 rounded-2xl border border-surface-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <IconPencil size={20} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {existingParaphrase ? 'Paraphrase bearbeiten' : 'Neue Paraphrase'}
              </h2>
              <p className="text-sm text-surface-400">
                Mayring: Zusammenfassende Inhaltsanalyse
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Original Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-surface-300 mb-2">
              Originaltext
            </label>
            <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700 text-surface-300 text-sm leading-relaxed max-h-32 overflow-y-auto">
              "{originalText}"
            </div>
          </div>

          {/* Paraphrase Input */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-surface-300">
                Paraphrase
              </label>
              <span className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-surface-500'}`}>
                {charCount}/{MAX_PARAPHRASE_LENGTH}
              </span>
            </div>
            <div className="relative">
              <textarea
                value={paraphraseText}
                onChange={(e) => setParaphraseText(e.target.value)}
                placeholder="Fasse den Text in eigenen Worten zusammen..."
                className={`w-full px-4 py-3 rounded-xl bg-surface-800 border text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none ${
                  isOverLimit ? 'border-red-500/50' : 'border-surface-700'
                }`}
                rows={4}
              />
              <button
                onClick={handleAIParaphrase}
                disabled={isGenerating || !originalText}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 text-sm font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                title="KI-Vorschlag generieren"
              >
                {isGenerating ? (
                  <IconLoader2 size={14} className="animate-spin" />
                ) : (
                  <IconSparkles size={14} />
                )}
                KI-Vorschlag
              </button>
            </div>
            {isOverLimit && (
              <p className="mt-1 text-xs text-red-400">
                Maximum {MAX_PARAPHRASE_LENGTH} Zeichen (MAXQDA-Standard)
              </p>
            )}
          </div>

          {/* Generalization (Mayring Step 2) */}
          {showGeneralization ? (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-surface-300 flex items-center gap-2">
                  <IconArrowUp size={14} className="text-purple-400" />
                  Generalisierung
                </label>
                <button
                  onClick={() => setShowGeneralization(false)}
                  className="text-xs text-surface-500 hover:text-surface-300"
                >
                  Ausblenden
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={generalization}
                  onChange={(e) => setGeneralization(e.target.value)}
                  placeholder="Auf höheres Abstraktionsniveau bringen..."
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  maxLength={100}
                />
                <button
                  onClick={handleAIGeneralization}
                  disabled={isGeneratingGen || !paraphraseText}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-surface-700 text-surface-400"
                  title="KI-Generalisierung"
                >
                  {isGeneratingGen ? (
                    <IconLoader2 size={14} className="animate-spin" />
                  ) : (
                    <IconWand size={14} />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowGeneralization(true)}
              className="mb-6 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1.5"
            >
              <IconArrowUp size={14} />
              Generalisierung hinzufügen (Mayring Schritt 2)
            </button>
          )}

          {/* Category (Mayring Step 3 - Reduction) */}
          {categories.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-surface-300 mb-2 flex items-center gap-2">
                <IconCategory size={14} className="text-amber-400" />
                Kategorie (Reduktion)
              </label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="">Keine Kategorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface-800 bg-surface-900/50">
          <div>
            {existingParaphrase && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-sm font-medium flex items-center gap-2"
              >
                <IconTrash size={16} />
                Löschen
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm font-medium"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !paraphraseText.trim() || isOverLimit}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <IconLoader2 size={16} className="animate-spin" />
              ) : (
                <IconCheck size={16} />
              )}
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
