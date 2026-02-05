import { chromium, FullConfig } from '@playwright/test'

/**
 * EINMALIG AUSFÜHREN: Speichert deine Login-Session
 *
 * Ausführen: npx ts-node tests/e2e/setup-auth.ts
 *
 * Dann kannst du alle Tests ohne Login ausführen!
 */

async function globalSetup(config: FullConfig) {
  console.log('\n🔐 AUTH SETUP - Einmalig einloggen\n')
  console.log('1. Browser öffnet sich')
  console.log('2. Logge dich bei research.evidenra.com ein')
  console.log('3. Nach erfolgreichem Login schließt sich das Fenster')
  console.log('4. Deine Session wird gespeichert\n')

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto('https://research.evidenra.com/login')

  // Warte auf Dashboard (= erfolgreich eingeloggt)
  console.log('⏳ Warte auf Login... (2 Minuten Zeit)')
  try {
    await page.waitForURL(/\/(dashboard|projects)/, { timeout: 120000 })
    console.log('✅ Login erfolgreich!')

    // Session speichern
    await context.storageState({ path: 'tests/e2e/.auth/user.json' })
    console.log('💾 Session gespeichert in tests/e2e/.auth/user.json')
    console.log('\n✅ Setup fertig! Du kannst jetzt "npm run test:smoke" ausführen.\n')
  } catch (e) {
    console.log('❌ Login fehlgeschlagen oder Timeout')
  }

  await browser.close()
}

// Direkt ausführen
globalSetup({} as FullConfig)
