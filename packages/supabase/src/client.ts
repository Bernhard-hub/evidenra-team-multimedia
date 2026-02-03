import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

let client: SupabaseClient<Database> | null = null

export function createClient(supabaseUrl: string, supabaseAnonKey: string): SupabaseClient<Database> {
  if (client) {
    return client
  }

  client = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

  return client
}

export function getClient(): SupabaseClient<Database> {
  if (!client) {
    throw new Error('Supabase client not initialized. Call createClient first.')
  }
  return client
}
