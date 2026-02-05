/**
 * SubscriptionBanner - Shows trial status, plan info, and upgrade prompts
 *
 * Displays:
 * - Trial countdown ("14 Tage verbleibend")
 * - Plan badge ("Team Plan")
 * - Upgrade prompt when trial ends
 * - Past due warning
 */

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  IconClock,
  IconSparkles,
  IconAlertTriangle,
  IconCrown,
  IconArrowRight
} from '@tabler/icons-react'
import {
  useSubscriptionStore,
  useIsTrialing,
  useTrialDaysLeft,
  useHasActiveSubscription,
  usePlanName
} from '@/stores/subscriptionStore'

interface SubscriptionBannerProps {
  variant?: 'header' | 'full'
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ variant = 'header' }) => {
  const navigate = useNavigate()
  const subscription = useSubscriptionStore(state => state.subscription)
  const isTrialing = useIsTrialing()
  const trialDaysLeft = useTrialDaysLeft()
  const hasActive = useHasActiveSubscription()
  const planName = usePlanName()

  // No subscription at all - should be caught by onboarding
  if (!subscription) return null

  // Past due - show warning
  if (subscription.status === 'past_due') {
    return (
      <div className={`${variant === 'full' ? 'p-4 rounded-xl mb-4' : 'px-3 py-1.5 rounded-lg'} bg-red-500/10 border border-red-500/20 flex items-center gap-2`}>
        <IconAlertTriangle size={variant === 'full' ? 20 : 16} className="text-red-400" />
        <span className={`${variant === 'full' ? '' : 'text-sm'} text-red-400`}>
          Zahlung fehlgeschlagen
        </span>
        {variant === 'full' && (
          <button
            onClick={() => navigate('/settings')}
            className="ml-auto px-3 py-1 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
          >
            Zahlungsmethode aktualisieren
          </button>
        )}
      </div>
    )
  }

  // Canceled or expired
  if (subscription.status === 'canceled' || subscription.status === 'expired') {
    return (
      <div className={`${variant === 'full' ? 'p-4 rounded-xl mb-4' : 'px-3 py-1.5 rounded-lg'} bg-amber-500/10 border border-amber-500/20 flex items-center gap-2`}>
        <IconAlertTriangle size={variant === 'full' ? 20 : 16} className="text-amber-400" />
        <span className={`${variant === 'full' ? '' : 'text-sm'} text-amber-400`}>
          Abo beendet
        </span>
        {variant === 'full' ? (
          <button
            onClick={() => navigate('/pricing')}
            className="ml-auto px-3 py-1 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 flex items-center gap-1"
          >
            Plan erneuern
            <IconArrowRight size={14} />
          </button>
        ) : (
          <Link
            to="/pricing"
            className="ml-2 text-sm text-primary-400 hover:text-primary-300"
          >
            Erneuern
          </Link>
        )}
      </div>
    )
  }

  // Trialing
  if (isTrialing) {
    const isUrgent = trialDaysLeft <= 3
    const bgColor = isUrgent ? 'bg-amber-500/10 border-amber-500/20' : 'bg-primary-500/10 border-primary-500/20'
    const textColor = isUrgent ? 'text-amber-400' : 'text-primary-400'

    if (variant === 'header') {
      return (
        <div className={`px-3 py-1.5 rounded-lg ${bgColor} border flex items-center gap-2`}>
          <IconClock size={14} className={textColor} />
          <span className={`text-sm ${textColor}`}>
            {trialDaysLeft} {trialDaysLeft === 1 ? 'Tag' : 'Tage'} Trial
          </span>
          <Link
            to="/pricing"
            className="text-xs text-surface-400 hover:text-white ml-1"
          >
            Upgrade
          </Link>
        </div>
      )
    }

    // Full variant
    return (
      <div className={`p-4 rounded-xl mb-4 ${bgColor} border flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isUrgent ? 'bg-amber-500/20' : 'bg-primary-500/20'}`}>
            <IconClock size={20} className={textColor} />
          </div>
          <div>
            <p className={`font-medium ${textColor}`}>
              {trialDaysLeft} {trialDaysLeft === 1 ? 'Tag' : 'Tage'} verbleibend
            </p>
            <p className="text-sm text-surface-400">
              Dein kostenloser Trial endet bald
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/pricing')}
          className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 flex items-center gap-2"
        >
          <IconSparkles size={16} />
          Jetzt upgraden
        </button>
      </div>
    )
  }

  // Active subscription - show plan badge (header only)
  if (hasActive && variant === 'header') {
    const planColors: Record<string, string> = {
      'Starter': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      'Team': 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      'Institution': 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    }

    return (
      <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${planColors[planName] || 'bg-surface-800 border-surface-700 text-surface-400'}`}>
        <IconCrown size={14} />
        <span className="text-sm font-medium">{planName}</span>
      </div>
    )
  }

  return null
}

/**
 * PaywallOverlay - Shows when subscription expired/canceled
 * Blocks access until user subscribes
 */
export const PaywallOverlay: React.FC = () => {
  const navigate = useNavigate()
  const subscription = useSubscriptionStore(state => state.subscription)
  const hasActive = useHasActiveSubscription()
  const isInitialized = useSubscriptionStore(state => state.isInitialized)

  // Show paywall only if initialized and subscription is not active
  if (!isInitialized || hasActive) return null

  // If no subscription at all, onboarding handles it
  if (!subscription) return null

  // Check if trial has ended
  const isTrialExpired = subscription.status === 'trialing' &&
    subscription.trialEnd &&
    new Date(subscription.trialEnd) < new Date()

  const shouldShowPaywall =
    subscription.status === 'canceled' ||
    subscription.status === 'expired' ||
    isTrialExpired

  if (!shouldShowPaywall) return null

  return (
    <div className="fixed inset-0 z-[90] bg-surface-950/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 rounded-2xl border border-surface-700 shadow-2xl max-w-md w-full p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 mb-4">
          <IconAlertTriangle size={32} className="text-amber-400" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {isTrialExpired ? 'Dein Trial ist abgelaufen' : 'Abo beendet'}
        </h2>

        <p className="text-surface-400 mb-6">
          {isTrialExpired
            ? 'Upgrade auf einen bezahlten Plan um EVIDENRA Research weiter zu nutzen.'
            : 'Dein Abo wurde beendet. Erneuere es um wieder Zugriff zu erhalten.'
          }
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/pricing')}
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium flex items-center justify-center gap-2"
          >
            <IconSparkles size={18} />
            Pläne ansehen
          </button>

          <Link
            to="/settings"
            className="block w-full py-3 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 font-medium"
          >
            Aboverwaltung
          </Link>
        </div>

        <p className="mt-6 text-xs text-surface-500">
          Fragen? <a href="mailto:support@evidenra.com" className="text-primary-400 hover:underline">support@evidenra.com</a>
        </p>
      </div>
    </div>
  )
}

export default SubscriptionBanner
