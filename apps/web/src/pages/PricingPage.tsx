/**
 * EVIDENRA Research - Pricing Page
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconCheck,
  IconSparkles,
  IconUsers,
  IconBuildingBank,
  IconRocket,
} from '@tabler/icons-react'
import { RESEARCH_PLANS, createCheckoutSession, calculateYearlySavings } from '@/lib/stripe'
import { useAuthStore } from '@/stores/authStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

export default function PricingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { organization } = useSubscriptionStore()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleSelectPlan = async (planId: 'starter' | 'team' | 'institution') => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!organization) {
      // User needs to create an organization first
      navigate('/')
      return
    }

    setIsLoading(planId)

    try {
      const result = await createCheckoutSession(
        planId,
        billingCycle,
        organization.id,
        user.email || ''
      )

      if ('url' in result && result.url) {
        window.location.href = result.url
      } else {
        alert('Fehler beim Starten des Checkouts: ' + result.error)
      }
    } catch (err) {
      alert('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(null)
    }
  }

  const planIcons = {
    starter: IconRocket,
    team: IconUsers,
    institution: IconBuildingBank,
  }

  const planColors = {
    starter: 'from-blue-500 to-cyan-500',
    team: 'from-purple-500 to-pink-500',
    institution: 'from-amber-500 to-orange-500',
  }

  return (
    <div className="min-h-screen bg-surface-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Wähle deinen Plan
          </h1>
          <p className="text-lg text-surface-400 mb-8">
            Starte mit 30 Tagen kostenlos. Jederzeit kündbar.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 rounded-xl bg-surface-800">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-primary-500 text-white'
                  : 'text-surface-400 hover:text-white'
              }`}
            >
              Monatlich
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-primary-500 text-white'
                  : 'text-surface-400 hover:text-white'
              }`}
            >
              Jährlich
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                2 Monate gratis
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {RESEARCH_PLANS.map((plan, index) => {
            const Icon = planIcons[plan.id]
            const colorGradient = planColors[plan.id]
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly
            const savings = calculateYearlySavings(plan)
            const isPopular = plan.id === 'team'

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border ${
                  isPopular
                    ? 'border-primary-500 bg-surface-900'
                    : 'border-surface-700 bg-surface-900/50'
                } p-6 flex flex-col`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary-500 text-white text-sm font-medium flex items-center gap-1">
                    <IconSparkles size={14} />
                    Beliebt
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${colorGradient} mb-4`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{plan.nameDE}</h2>
                  <p className="text-surface-400 mt-1">
                    Bis zu {plan.maxSeats} Teammitglieder
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">€{price}</span>
                    <span className="text-surface-400">
                      /{billingCycle === 'monthly' ? 'Monat' : 'Jahr'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-green-400 text-sm mt-1">
                      €{savings} gespart pro Jahr
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.featuresDE.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <IconCheck size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-surface-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isLoading !== null}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    isPopular
                      ? 'bg-primary-500 hover:bg-primary-600 text-white'
                      : 'bg-surface-700 hover:bg-surface-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Wird geladen...
                    </span>
                  ) : (
                    'Kostenlos testen'
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* FAQ / Info */}
        <div className="mt-16 text-center">
          <p className="text-surface-400">
            Fragen? Schreib uns an{' '}
            <a href="mailto:support@evidenra.com" className="text-primary-400 hover:underline">
              support@evidenra.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
