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

// Helper to safely access localStorage (might fail in Safari private mode)
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Silently fail - private browsing mode
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Silently fail
    }
  }
}

// Timeout wrapper for async operations
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms)
    )
  ])
}

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
        const demoSession = safeLocalStorage.getItem('evidenra-demo-session')
        if (demoSession) {
          try {
            const parsed = JSON.parse(demoSession)
            set({
              user: parsed.user,
              session: parsed,
              isLoading: false,
              isInitialized: true,
            })
          } catch {
            // Invalid JSON, clear it
            safeLocalStorage.removeItem('evidenra-demo-session')
            set({ isLoading: false, isInitialized: true })
          }
        } else {
          set({ isLoading: false, isInitialized: true })
        }
        return
      }

      // Real Supabase mode with timeout (5 seconds)
      const { data, error } = await withTimeout(auth.getSession(), 5000)

      if (error) {
        console.error('Auth initialization error:', error)
        // Don't show error to user, just mark as initialized without session
        set({ isLoading: false, isInitialized: true })
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
        set({
          user: session?.user ?? null,
          session: session,
        })
      })
    } catch (err) {
      console.error('Auth initialization failed:', err)
      // Always mark as initialized even on error - let user try to login manually
      set({
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
        safeLocalStorage.setItem('evidenra-demo-session', JSON.stringify(demoSession))
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
        safeLocalStorage.setItem('evidenra-demo-session', JSON.stringify(demoSession))
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
        safeLocalStorage.removeItem('evidenra-demo-session')
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
