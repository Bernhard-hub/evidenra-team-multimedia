/**
 * EVIDENRA Research - Stripe Integration
 * Uses evidenra.com API for payment processing
 */

// Stripe Checkout URLs (redirect to main site for payment)
const CHECKOUT_API = 'https://evidenra.com/api/checkout'
const SUCCESS_URL = 'https://research.evidenra.com/success'
const CANCEL_URL = 'https://research.evidenra.com/pricing'

export interface SubscriptionPlan {
  id: 'starter' | 'team' | 'institution'
  name: string
  nameDE: string
  priceMonthly: number
  priceYearly: number
  maxSeats: number
  features: string[]
  featuresDE: string[]
}

export const RESEARCH_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    nameDE: 'Starter',
    priceMonthly: 29,
    priceYearly: 239,
    maxSeats: 3,
    features: [
      '3 Team Members',
      '10 Projects',
      '100 Documents',
      '5GB Storage',
      'AI Features (own API key)',
      'Email Support',
    ],
    featuresDE: [
      '3 Teammitglieder',
      '10 Projekte',
      '100 Dokumente',
      '5GB Speicher',
      'KI-Features (eigener API-Key)',
      'E-Mail Support',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    nameDE: 'Team',
    priceMonthly: 79,
    priceYearly: 639,
    maxSeats: 10,
    features: [
      '10 Team Members',
      'Unlimited Projects',
      'Unlimited Documents',
      '25GB Storage',
      'AI Features (own API key)',
      'Methodology Guide',
      'Priority Support',
    ],
    featuresDE: [
      '10 Teammitglieder',
      'Unbegrenzte Projekte',
      'Unbegrenzte Dokumente',
      '25GB Speicher',
      'KI-Features (eigener API-Key)',
      'Methoden-Guide',
      'Prioritäts-Support',
    ],
  },
  {
    id: 'institution',
    name: 'Institution',
    nameDE: 'Institution',
    priceMonthly: 199,
    priceYearly: 1599,
    maxSeats: 50,
    features: [
      '50 Team Members',
      'Unlimited Everything',
      '100GB Storage',
      'AI Features (own API key)',
      'SSO Integration',
      'Admin Dashboard',
      'Dedicated Support',
    ],
    featuresDE: [
      '50 Teammitglieder',
      'Alles unbegrenzt',
      '100GB Speicher',
      'KI-Features (eigener API-Key)',
      'SSO Integration',
      'Admin Dashboard',
      'Dedizierter Support',
    ],
  },
]

/**
 * Create Stripe Checkout Session for Research subscription
 */
export async function createCheckoutSession(
  planId: 'starter' | 'team' | 'institution',
  billingCycle: 'monthly' | 'yearly',
  organizationId: string,
  userEmail: string
): Promise<{ url: string } | { error: string }> {
  try {
    const response = await fetch(CHECKOUT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product: `research-${planId}`,
        billing: billingCycle,
        metadata: {
          organizationId,
          userEmail,
          app: 'research',
        },
        successUrl: `${SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: CANCEL_URL,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Checkout failed' }
    }

    return { url: data.url }
  } catch (err) {
    console.error('Checkout error:', err)
    return { error: 'Network error' }
  }
}

/**
 * Open Stripe Customer Portal for subscription management
 */
export async function openCustomerPortal(
  stripeCustomerId: string
): Promise<{ url: string } | { error: string }> {
  try {
    const response = await fetch('https://evidenra.com/api/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId: stripeCustomerId,
        returnUrl: 'https://research.evidenra.com/settings',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Portal access failed' }
    }

    return { url: data.url }
  } catch (err) {
    console.error('Portal error:', err)
    return { error: 'Network error' }
  }
}

/**
 * Get plan by ID
 */
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return RESEARCH_PLANS.find((p) => p.id === planId)
}

/**
 * Calculate savings for yearly billing
 */
export function calculateYearlySavings(plan: SubscriptionPlan): number {
  return plan.priceMonthly * 12 - plan.priceYearly
}

export default {
  RESEARCH_PLANS,
  createCheckoutSession,
  openCustomerPortal,
  getPlanById,
  calculateYearlySavings,
}
