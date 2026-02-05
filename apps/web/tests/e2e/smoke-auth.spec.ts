import { test, expect, Page, chromium } from '@playwright/test'

/**
 * SMOKE TEST MIT AUTHENTIFIZIERUNG
 *
 * Nutzt dein Chrome-Profil (bereits eingeloggt)
 *
 * Ausführen: npx playwright test smoke-auth.spec.ts --headed
 */

// Sammelt alle JS-Fehler
const errors: string[] = []
const clickedElements: string[] = []

test('Smoke Test - Mit Auth durchklicken', async () => {
  // Nutze Chrome mit deinem Profil (wo du eingeloggt bist)
  const browser = await chromium.launchPersistentContext(
    'C:/Users/Bernhard/AppData/Local/Google/Chrome/User Data',
    {
      headless: false,
      channel: 'chrome',
      args: ['--profile-directory=Default'],
    }
  )

  const page = await browser.newPage()

  // Fehler-Listener
  page.on('pageerror', (err) => {
    errors.push(`🔴 ${err.message}`)
    console.error('🔴 JS ERROR:', err.message)
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('ERR_')) {
      errors.push(`⚠️ Console: ${msg.text().substring(0, 200)}`)
    }
  })

  try {
    // === DASHBOARD ===
    console.log('\n📍 Testing: Dashboard')
    await page.goto('https://research.evidenra.com/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Prüfe ob eingeloggt
    if (page.url().includes('/login')) {
      console.log('❌ Nicht eingeloggt! Bitte zuerst in Chrome einloggen.')
      await browser.close()
      return
    }

    console.log('✅ Eingeloggt!')

    // === ERSTES PROJEKT ÖFFNEN ===
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click()
      clickedElements.push('Erstes Projekt')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      console.log('  ✅ Projekt geöffnet')
    }

    // === PROJECT TABS ===
    await safeClick(page, 'button:has-text("Dokumente"), a:has-text("Dokumente")', 'Dokumente')
    await safeClick(page, 'button:has-text("Codes"), a:has-text("Codes")', 'Codes')
    await safeClick(page, 'button:has-text("Analyse"), a:has-text("Analyse")', 'Analyse')

    // === FRAGEBOGEN TAB ===
    await safeClick(page, 'button:has-text("Fragebogen"), a:has-text("Fragebogen")', 'Fragebogen')
    await page.waitForTimeout(1500)

    // === QUESTIONNAIRE MODULE ===
    if (await page.locator('text=Skalen-Browser').first().isVisible({ timeout: 3000 })) {
      console.log('\n📍 Testing: Questionnaire Module')

      await safeClick(page, 'text=Skalen-Browser', 'Skalen-Browser Tab')
      await page.waitForTimeout(1000)

      // Suche nach einer Skala
      const searchInput = page.locator('input[placeholder*="suchen"], input[placeholder*="Search"]').first()
      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.fill('Selbstwirksamkeit')
        await page.waitForTimeout(1000)
        console.log('  ✅ Suche ausgeführt')
      }

      // === DER BUG TEST: Skala adaptieren ===
      await safeClick(page, 'button:has-text("adaptieren"), button:has-text("Adapt")', '⭐ Skala adaptieren (BUG TEST)')
      await page.waitForTimeout(1000)

      // Andere Tabs
      await safeClick(page, 'text=Arbeitsbereich', 'Arbeitsbereich')
      await safeClick(page, 'text=Qualität', 'Qualität')
      await safeClick(page, 'text=Validierung', 'Validierung')
      await safeClick(page, 'button:has-text("Neue Skala")', 'Neue Skala')
    }

    // === SETTINGS ===
    console.log('\n📍 Testing: Settings')
    await page.goto('https://research.evidenra.com/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    clickedElements.push('Settings Page')

  } finally {
    // === ERGEBNIS ===
    console.log('\n' + '='.repeat(60))
    console.log('📊 SMOKE TEST ERGEBNIS')
    console.log('='.repeat(60))
    console.log(`Getestete Elemente: ${clickedElements.length}`)
    clickedElements.forEach(el => console.log(`  ✅ ${el}`))

    if (errors.length > 0) {
      console.log(`\n❌ FEHLER GEFUNDEN: ${errors.length}`)
      errors.forEach(err => console.log(`  ${err}`))
    } else {
      console.log('\n✅ KEINE JS-FEHLER GEFUNDEN!')
    }
    console.log('='.repeat(60))

    await browser.close()

    // Test schlägt fehl wenn Fehler
    expect(errors, `Gefundene Fehler:\n${errors.join('\n')}`).toHaveLength(0)
  }
})

async function safeClick(page: Page, selector: string, name: string) {
  try {
    const element = page.locator(selector).first()
    if (await element.isVisible({ timeout: 2000 })) {
      await element.click()
      clickedElements.push(name)
      await page.waitForTimeout(500)
      console.log(`  ✅ Clicked: ${name}`)
    }
  } catch {
    // Element nicht gefunden
  }
}
