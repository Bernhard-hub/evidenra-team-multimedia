import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  signOut: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session, user: session?.user ?? null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      signOut: () => {
        set({ user: null, session: null, error: null })
      },

      initialize: async () => {
        set({ isLoading: true, error: null })
        try {
          // Will be connected to Supabase later
          // For now, check if we have a stored session
          const state = get()
          if (state.session) {
            set({ user: state.session.user, isLoading: false })
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Authentication failed',
            isLoading: false
          })
        }
      },
    }),
    {
      name: 'evidenra-auth',
      partialize: (state) => ({ session: state.session }),
    }
  )
)
