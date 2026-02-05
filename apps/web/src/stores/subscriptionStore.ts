/**
 * Subscription Store - Manages organization & subscription state
 *
 * Handles:
 * - Organization membership
 * - Subscription status (trialing, active, past_due, canceled)
 * - Plan limits
 * - Trial tracking
 */

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired' | 'none'
export type PlanId = 'starter' | 'team' | 'institution' | 'free'

export interface Organization {
  id: string
  name: string
  slug: string
  createdAt: string
}

export interface Subscription {
  id: string
  organizationId: string
  planId: PlanId
  status: SubscriptionStatus
  billingCycle: 'monthly' | 'yearly'
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  trialEnd: string | null
  canceledAt: string | null
  seatsUsed: number
}

export interface PlanLimits {
  maxSeats: number
  maxProjects: number | null  // null = unlimited
  maxDocuments: number | null
  maxStorageGB: number
  features: {
    methodologyGuide: boolean
    exportFormats: string[]
    support: string
    sso?: boolean
    adminDashboard?: boolean
  }
}

export interface SubscriptionState {
  // Data
  organization: Organization | null
  subscription: Subscription | null
  planLimits: PlanLimits | null
  memberRole: 'owner' | 'admin' | 'editor' | 'viewer' | null

  // Computed
  isLoading: boolean
  isInitialized: boolean
  error: string | null

  // Getters (computed in selectors)

  // Actions
  initialize: (userId: string) => Promise<void>
  reinitialize: (userId: string) => Promise<void>
  createOrganization: (name: string, userId: string) => Promise<Organization | null>
  refreshSubscription: () => Promise<void>
  checkLimit: (type: 'projects' | 'documents' | 'seats', currentCount: number) => { allowed: boolean; limit: number | null; message?: string }
  clearError: () => void
}

// Plan limits configuration
const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxSeats: 1,
    maxProjects: 2,
    maxDocuments: 10,
    maxStorageGB: 1,
    features: {
      methodologyGuide: false,
      exportFormats: ['md'],
      support: 'community'
    }
  },
  starter: {
    maxSeats: 3,
    maxProjects: 10,
    maxDocuments: 100,
    maxStorageGB: 5,
    features: {
      methodologyGuide: false,
      exportFormats: ['md', 'csv'],
      support: 'email'
    }
  },
  team: {
    maxSeats: 10,
    maxProjects: null,
    maxDocuments: null,
    maxStorageGB: 25,
    features: {
      methodologyGuide: true,
      exportFormats: ['md', 'csv', 'docx', 'pdf'],
      support: 'priority'
    }
  },
  institution: {
    maxSeats: 50,
    maxProjects: null,
    maxDocuments: null,
    maxStorageGB: 100,
    features: {
      methodologyGuide: true,
      exportFormats: ['md', 'csv', 'docx', 'pdf', 'xml'],
      support: 'dedicated',
      sso: true,
      adminDashboard: true
    }
  }
}

// Helper to get typed Supabase client for untyped tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const useSubscriptionStore = create<SubscriptionState>()((set, get) => ({
  organization: null,
  subscription: null,
  planLimits: null,
  memberRole: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async (userId: string) => {
    if (get().isInitialized) return

    set({ isLoading: true, error: null })

    try {
      // 1. Find user's organization membership
      const { data: membership, error: memberError } = await db
        .from('organization_members')
        .select(`
          role,
          organizations (
            id,
            name,
            slug,
            created_at
          )
        `)
        .eq('user_id', userId)
        .single()

      if (memberError && memberError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is OK for new users
        throw memberError
      }

      if (!membership || !membership.organizations) {
        // User has no organization - needs onboarding
        set({
          organization: null,
          subscription: null,
          planLimits: PLAN_LIMITS.free,
          memberRole: null,
          isLoading: false,
          isInitialized: true
        })
        return
      }

      const org = membership.organizations
      const organization: Organization = {
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.created_at
      }

      // 2. Fetch subscription for this organization
      const { data: subData, error: subError } = await db
        .from('organization_subscriptions')
        .select('*')
        .eq('organization_id', organization.id)
        .single()

      let subscription: Subscription | null = null
      let planId: PlanId = 'free'

      if (subData && !subError) {
        subscription = {
          id: subData.id,
          organizationId: subData.organization_id,
          planId: subData.plan_id as PlanId,
          status: subData.status as SubscriptionStatus,
          billingCycle: subData.billing_cycle,
          stripeCustomerId: subData.stripe_customer_id,
          stripeSubscriptionId: subData.stripe_subscription_id,
          currentPeriodStart: subData.current_period_start,
          currentPeriodEnd: subData.current_period_end,
          trialEnd: subData.trial_end,
          canceledAt: subData.canceled_at,
          seatsUsed: subData.seats_used || 1
        }
        planId = subscription.planId
      }

      set({
        organization,
        subscription,
        planLimits: PLAN_LIMITS[planId] || PLAN_LIMITS.free,
        memberRole: membership.role as 'owner' | 'admin' | 'editor' | 'viewer',
        isLoading: false,
        isInitialized: true
      })

    } catch (error) {
      console.error('Failed to initialize subscription:', error)
      set({
        error: error instanceof Error ? error.message : 'Fehler beim Laden der Subscription',
        isLoading: false,
        isInitialized: true
      })
    }
  },

  reinitialize: async (userId: string) => {
    // Reset state and re-initialize (used after joining a new organization)
    set({
      organization: null,
      subscription: null,
      planLimits: null,
      memberRole: null,
      isLoading: false,
      isInitialized: false,
      error: null
    })
    // Call initialize which will now run since isInitialized is false
    await get().initialize(userId)
  },

  createOrganization: async (name: string, userId: string) => {
    set({ isLoading: true, error: null })

    try {
      // Create slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        + '-' + Date.now().toString(36)

      // 1. Create organization
      console.log('Creating organization:', { name, slug })
      const { data: org, error: orgError } = await db
        .from('organizations')
        .insert({
          name,
          slug
        })
        .select()
        .single()

      if (orgError) {
        console.error('Organization creation error:', orgError.message, orgError.details, orgError.hint, orgError.code)
        throw orgError
      }
      if (!org) throw new Error('Failed to create organization')

      // 2. Add user as owner
      console.log('Adding user as owner:', { organization_id: org.id, user_id: userId })
      const { error: memberError } = await db
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: userId,
          role: 'owner'
        })

      if (memberError) {
        console.error('Member creation error:', memberError.message, memberError.details, memberError.hint, memberError.code)
        throw memberError
      }

      // 3. Create trial subscription (14 days) - optional, don't fail if table doesn't exist
      try {
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + 14)

        const { error: subError } = await db
          .from('organization_subscriptions')
          .insert({
            organization_id: org.id,
            plan_id: 'starter',
            status: 'trialing',
            billing_cycle: 'monthly',
            trial_end: trialEnd.toISOString(),
            seats_used: 1
          })

        if (subError) {
          console.warn('Failed to create trial subscription (non-critical):', subError.message)
        }
      } catch (e) {
        console.warn('Subscription table may not exist:', e)
      }

      const organization: Organization = {
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.created_at
      }

      // Update state
      set({
        organization,
        subscription: {
          id: '',
          organizationId: org.id,
          planId: 'starter',
          status: 'trialing',
          billingCycle: 'monthly',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          trialEnd: trialEnd.toISOString(),
          canceledAt: null,
          seatsUsed: 1
        },
        planLimits: PLAN_LIMITS.starter,
        memberRole: 'owner',
        isLoading: false
      })

      return organization

    } catch (error) {
      console.error('Failed to create organization:', error)
      set({
        error: error instanceof Error ? error.message : 'Fehler beim Erstellen der Organisation',
        isLoading: false
      })
      return null
    }
  },

  refreshSubscription: async () => {
    const { organization } = get()
    if (!organization) return

    try {
      const { data: subData, error } = await db
        .from('organization_subscriptions')
        .select('*')
        .eq('organization_id', organization.id)
        .single()

      if (error) throw error
      if (!subData) return

      const subscription: Subscription = {
        id: subData.id,
        organizationId: subData.organization_id,
        planId: subData.plan_id as PlanId,
        status: subData.status as SubscriptionStatus,
        billingCycle: subData.billing_cycle,
        stripeCustomerId: subData.stripe_customer_id,
        stripeSubscriptionId: subData.stripe_subscription_id,
        currentPeriodStart: subData.current_period_start,
        currentPeriodEnd: subData.current_period_end,
        trialEnd: subData.trial_end,
        canceledAt: subData.canceled_at,
        seatsUsed: subData.seats_used || 1
      }

      set({
        subscription,
        planLimits: PLAN_LIMITS[subscription.planId] || PLAN_LIMITS.free
      })

    } catch (error) {
      console.error('Failed to refresh subscription:', error)
    }
  },

  checkLimit: (type, currentCount) => {
    const { planLimits, subscription } = get()

    if (!planLimits) {
      return { allowed: true, limit: null }
    }

    // Check if subscription is active
    if (subscription) {
      const now = new Date()
      const isExpired = subscription.status === 'expired' ||
        subscription.status === 'canceled' ||
        (subscription.trialEnd && new Date(subscription.trialEnd) < now && subscription.status === 'trialing')

      if (isExpired) {
        return {
          allowed: false,
          limit: 0,
          message: 'Dein Abo ist abgelaufen. Bitte upgrade deinen Plan.'
        }
      }
    }

    switch (type) {
      case 'projects': {
        const limit = planLimits.maxProjects
        if (limit === null) return { allowed: true, limit: null }
        const allowed = currentCount < limit
        return {
          allowed,
          limit,
          message: allowed ? undefined : `Du hast das Limit von ${limit} Projekten erreicht.`
        }
      }
      case 'documents': {
        const limit = planLimits.maxDocuments
        if (limit === null) return { allowed: true, limit: null }
        const allowed = currentCount < limit
        return {
          allowed,
          limit,
          message: allowed ? undefined : `Du hast das Limit von ${limit} Dokumenten erreicht.`
        }
      }
      case 'seats': {
        const limit = planLimits.maxSeats
        const allowed = currentCount < limit
        return {
          allowed,
          limit,
          message: allowed ? undefined : `Du hast das Limit von ${limit} Teammitgliedern erreicht.`
        }
      }
      default:
        return { allowed: true, limit: null }
    }
  },

  clearError: () => set({ error: null })
}))

// Selector hooks for computed values
export function useIsTrialing(): boolean {
  const subscription = useSubscriptionStore(state => state.subscription)
  return subscription?.status === 'trialing'
}

export function useTrialDaysLeft(): number {
  const subscription = useSubscriptionStore(state => state.subscription)
  if (!subscription?.trialEnd) return 0

  const now = new Date()
  const trialEnd = new Date(subscription.trialEnd)
  const diffMs = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

export function useHasActiveSubscription(): boolean {
  const subscription = useSubscriptionStore(state => state.subscription)
  if (!subscription) return false

  const validStatuses: SubscriptionStatus[] = ['trialing', 'active']
  return validStatuses.includes(subscription.status)
}

export function useNeedsOnboarding(): boolean {
  const organization = useSubscriptionStore(state => state.organization)
  const isInitialized = useSubscriptionStore(state => state.isInitialized)
  return isInitialized && !organization
}

export function usePlanName(): string {
  const subscription = useSubscriptionStore(state => state.subscription)
  if (!subscription) return 'Free'

  const names: Record<PlanId, string> = {
    free: 'Free',
    starter: 'Starter',
    team: 'Team',
    institution: 'Institution'
  }

  return names[subscription.planId] || 'Free'
}
