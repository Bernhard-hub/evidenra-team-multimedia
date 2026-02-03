import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { auth, supabase } from '@/lib/supabase'

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null

  // Actions
  initialize: () => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signInWithOAuth: (provider: 'google' | 'github' | 'azure') => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  clearError: () => void
}

// Check if we're in demo mode (no Supabase credentials)
const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized) return

    set({ isLoading: true })

    try {
      if (isDemoMode) {
        // Demo mode - check localStorage for demo session
        const demoSession = localStorage.getItem('evidenra-demo-session')
        if (demoSession) {
          const parsed = JSON.parse(demoSession)
          set({
            user: parsed.user,
            session: parsed,
            isLoading: false,
            isInitialized: true,
          })
        } else {
          set({ isLoading: false, isInitialized: true })
        }
        return
      }

      // Real Supabase mode
      const { data, error } = await auth.getSession()

      if (error) {
        console.error('Auth initialization error:', error)
        set({ error: error.message, isLoading: false, isInitialized: true })
        return
      }

      if (data.session) {
        set({
          user: data.session.user,
          session: data.session,
          isLoading: false,
          isInitialized: true,
        })
      } else {
        set({ isLoading: false, isInitialized: true })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event)
        set({
          user: session?.user ?? null,
          session: session,
        })
      })
    } catch (err) {
      console.error('Auth initialization failed:', err)
      set({
        error: err instanceof Error ? err.message : 'Initialization failed',
        isLoading: false,
        isInitialized: true,
      })
    }
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true, error: null })

    try {
      if (isDemoMode) {
        // Demo mode - create fake user
        const demoUser = {
          id: `demo-${Date.now()}`,
          email,
          user_metadata: { full_name: fullName },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        }
        const demoSession = {
          user: demoUser,
          access_token: 'demo-token',
          refresh_token: 'demo-refresh',
        }
        localStorage.setItem('evidenra-demo-session', JSON.stringify(demoSession))
        set({ user: demoUser as User, session: demoSession as any, isLoading: false })
        return { success: true }
      }

      const { data, error } = await auth.signUp(email, password, fullName)

      if (error) {
        set({ error: error.message, isLoading: false })
        return { success: false, error: error.message }
      }

      if (data.user && !data.session) {
        // Email confirmation required
        set({ isLoading: false })
        return { success: true, error: 'Bitte bestätigen Sie Ihre E-Mail-Adresse.' }
      }

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
      })
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registrierung fehlgeschlagen'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null })

    try {
      if (isDemoMode) {
        // Demo mode - accept any credentials
        const demoUser = {
          id: `demo-${Date.now()}`,
          email,
          user_metadata: { full_name: email.split('@')[0] },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        }
        const demoSession = {
          user: demoUser,
          access_token: 'demo-token',
          refresh_token: 'demo-refresh',
        }
        localStorage.setItem('evidenra-demo-session', JSON.stringify(demoSession))
        set({ user: demoUser as User, session: demoSession as any, isLoading: false })
        return { success: true }
      }

      const { data, error } = await auth.signIn(email, password)

      if (error) {
        set({ error: error.message, isLoading: false })
        return { success: false, error: error.message }
      }

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
      })
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  signInWithOAuth: async (provider) => {
    set({ isLoading: true, error: null })

    try {
      if (isDemoMode) {
        set({ error: 'OAuth ist im Demo-Modus nicht verfügbar', isLoading: false })
        return { success: false, error: 'OAuth ist im Demo-Modus nicht verfügbar' }
      }

      const { error } = await auth.signInWithOAuth(provider)

      if (error) {
        set({ error: error.message, isLoading: false })
        return { success: false, error: error.message }
      }

      // OAuth will redirect, so we don't set loading to false here
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OAuth fehlgeschlagen'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  signOut: async () => {
    set({ isLoading: true })

    try {
      if (isDemoMode) {
        localStorage.removeItem('evidenra-demo-session')
        set({ user: null, session: null, isLoading: false })
        return
      }

      await auth.signOut()
      set({ user: null, session: null, isLoading: false })
    } catch (err) {
      console.error('Sign out error:', err)
      // Still clear local state even if sign out fails
      set({ user: null, session: null, isLoading: false })
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null })

    try {
      if (isDemoMode) {
        set({ isLoading: false })
        return { success: true }
      }

      const { error } = await auth.resetPassword(email)

      if (error) {
        set({ error: error.message, isLoading: false })
        return { success: false, error: error.message }
      }

      set({ isLoading: false })
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Passwort-Reset fehlgeschlagen'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  clearError: () => set({ error: null }),
}))
