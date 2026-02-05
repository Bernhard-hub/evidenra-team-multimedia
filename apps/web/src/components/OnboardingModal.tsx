/**
 * OnboardingModal - Welcome flow for new users
 *
 * Shows when user has no organization.
 * Creates personal workspace and starts 14-day trial.
 */

import React, { useState } from 'react'
import {
  IconRocket,
  IconSparkles,
  IconBook,
  IconUsers,
  IconBrain,
  IconArrowRight,
  IconCheck,
  IconLoader2
} from '@tabler/icons-react'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useAuthStore } from '@/stores/authStore'

interface OnboardingModalProps {
  isOpen: boolean
  onComplete: () => void
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const { user } = useAuthStore()
  const { createOrganization, isLoading } = useSubscriptionStore()
  const [step, setStep] = useState<'welcome' | 'setup' | 'done'>('welcome')
  const [workspaceName, setWorkspaceName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Forscher'
  const defaultWorkspaceName = `${userName}'s Workspace`

  const handleCreateWorkspace = async () => {
    if (!user) return

    setError(null)
    const name = workspaceName.trim() || defaultWorkspaceName

    const org = await createOrganization(name, user.id)

    if (org) {
      setStep('done')
      // Auto-close after 2 seconds
      setTimeout(() => {
        onComplete()
      }, 2000)
    } else {
      setError('Fehler beim Erstellen des Workspace. Bitte versuche es erneut.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface-900 rounded-2xl border border-surface-700 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-500 mb-4">
                <IconRocket size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Willkommen bei EVIDENRA Research!
              </h1>
              <p className="text-surface-400">
                Hallo {userName}! Lass uns deinen Workspace einrichten.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-800/50">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <IconBrain size={20} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">KI-gestützte Analyse</h3>
                  <p className="text-sm text-surface-400">Automatisches Kodieren mit Claude AI</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-800/50">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <IconBook size={20} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Methoden-Guide</h3>
                  <p className="text-sm text-surface-400">Grounded Theory, Inhaltsanalyse & mehr</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-800/50">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <IconUsers size={20} className="text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Team-Kollaboration</h3>
                  <p className="text-sm text-surface-400">Echtzeit-Zusammenarbeit im Team</p>
                </div>
              </div>
            </div>

            {/* Trial Info */}
            <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 mb-6">
              <div className="flex items-center gap-2 text-primary-400 mb-1">
                <IconSparkles size={16} />
                <span className="font-medium">14 Tage kostenlos testen</span>
              </div>
              <p className="text-sm text-surface-400">
                Voller Zugriff auf alle Features. Keine Kreditkarte erforderlich.
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep('setup')}
              className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Los geht's
              <IconArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Setup Step */}
        {step === 'setup' && (
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2">
                Workspace erstellen
              </h2>
              <p className="text-surface-400">
                Gib deinem Workspace einen Namen
              </p>
            </div>

            {/* Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder={defaultWorkspaceName}
                className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                autoFocus
              />
              <p className="mt-2 text-sm text-surface-500">
                Z.B. "Meine Forschung", "Uni Projekt" oder dein Teamname
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('welcome')}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                Zurück
              </button>
              <button
                onClick={handleCreateWorkspace}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <IconLoader2 size={18} className="animate-spin" />
                    Erstelle...
                  </>
                ) : (
                  <>
                    Workspace erstellen
                    <IconArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Done Step */}
        {step === 'done' && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
              <IconCheck size={32} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Alles bereit!
            </h2>
            <p className="text-surface-400 mb-4">
              Dein Workspace wurde erstellt. Dein 14-Tage-Trial startet jetzt.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary-400">
              <IconLoader2 size={16} className="animate-spin" />
              <span>Weiterleitung zum Dashboard...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OnboardingModal
