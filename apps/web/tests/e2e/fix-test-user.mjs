/**
 * Fügt den Test-User in die public.profiles Tabelle ein
 * (Die Tabelle heißt "profiles", nicht "users")
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zvkoulhziksfxnxkkrmb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2a291bGh6aWtzZnhueGtrcm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE3NjQsImV4cCI6MjA3OTk4Nzc2NH0.GJ82Zp37DXICVDvhmjSGo6THSmYcSuykRVgN3z4WWW0'

const TEST_USER_ID = '9f15ca5f-7e8e-4630-9e22-e878ceb8a4e5'
const TEST_EMAIL = 'e2e-test@evidenra.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function fixTestUser() {
  console.log('🔧 Füge Test-User in public.profiles Tabelle ein...')

  // Erst einloggen um Session zu bekommen
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: 'TestPassword123!'
  })

  if (authError) {
    console.log('❌ Login fehlgeschlagen:', authError.message)
    return
  }

  console.log('✅ Eingeloggt als:', authData.user?.email)
  console.log('   User ID:', authData.user?.id)

  // Prüfe ob Profil bereits existiert
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('id', authData.user.id)
    .single()

  if (existingProfile) {
    console.log('✅ Profil existiert bereits in public.profiles')
    console.log('   Email:', existingProfile.email)
    return
  }

  console.log('⚠️ Profil fehlt - erstelle es jetzt...')

  // Profil einfügen (mit korrekten Spalten laut Schema)
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: TEST_EMAIL,
      full_name: 'E2E Test User',
      avatar_url: null
    })

  if (error) {
    console.log('❌ Fehler beim Einfügen:', error.message)

    // Versuche upsert
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: TEST_EMAIL,
        full_name: 'E2E Test User'
      })

    if (upsertError) {
      console.log('❌ Upsert auch fehlgeschlagen:', upsertError.message)
    } else {
      console.log('✅ Profil via Upsert eingefügt')
    }
  } else {
    console.log('✅ Profil erfolgreich eingefügt!')
  }
}

fixTestUser()
