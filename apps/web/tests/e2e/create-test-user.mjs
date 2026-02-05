/**
 * Erstellt einen Test-Account für E2E Tests
 *
 * Ausführen: node tests/e2e/create-test-user.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zvkoulhziksfxnxkkrmb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2a291bGh6aWtzZnhueGtrcm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE3NjQsImV4cCI6MjA3OTk4Nzc2NH0.GJ82Zp37DXICVDvhmjSGo6THSmYcSuykRVgN3z4WWW0'

const TEST_EMAIL = 'e2e-test@evidenra.com'
const TEST_PASSWORD = 'TestPassword123!'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function createTestUser() {
  console.log('🔧 Erstelle Test-Account...')
  console.log(`   Email: ${TEST_EMAIL}`)
  console.log(`   Password: ${TEST_PASSWORD}`)

  const { data, error } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    options: {
      data: {
        full_name: 'E2E Test User',
        role: 'tester'
      }
    }
  })

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('\n✅ Account existiert bereits!')
      console.log('\nVersuche Login...')

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })

      if (loginError) {
        console.log('❌ Login fehlgeschlagen:', loginError.message)
      } else {
        console.log('✅ Login erfolgreich!')
        console.log('   User ID:', loginData.user?.id)
      }
    } else {
      console.log('❌ Fehler:', error.message)
    }
    return
  }

  console.log('\n✅ Account erstellt!')
  console.log('   User ID:', data.user?.id)

  if (data.user?.identities?.length === 0) {
    console.log('\n⚠️  Email-Bestätigung erforderlich!')
    console.log('   Prüfe dein Postfach oder deaktiviere Email-Bestätigung in Supabase.')
  } else {
    console.log('\n✅ Account ist sofort nutzbar!')
  }

  console.log('\n📋 Test-Credentials:')
  console.log(`   Email:    ${TEST_EMAIL}`)
  console.log(`   Password: ${TEST_PASSWORD}`)
}

createTestUser()
