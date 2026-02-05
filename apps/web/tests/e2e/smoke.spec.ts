import { test, expect, Page } from '@playwright/test'

/**
 * SMOKE TEST - Klickt durch alle wichtigen Seiten und meldet JS-Fehler
 *
 * Ausführen mit: npx playwright test smoke.spec.ts --headed
 */

// Sammelt alle JS-Fehler
const errors: string[] = []
const clickedElements: string[] = []

test('Smoke Test - Alle Seiten durchklicken und Fehler finden', async ({ page }) => {
  // Fehler-Listener
  page.on('pageerror', (err) => {
    errors.push(`🔴 ${err.message}`)
    console.error('🔴 JS ERROR:', err.message)
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('favicon')) {
      errors.push(`⚠️ Console: ${msg.text().substring(0, 200)}`)
    }
  })

  // === 1. LOGIN PAGE ===
  console.log('\n📍 Testing: Login Page')
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // === 2. Wenn eingeloggt, Dashboard testen ===
  const isLoggedIn = !page.url().includes('/login')

  if (!isLoggedIn) {
    console.log('ℹ️ Nicht eingeloggt - teste nur öffentliche Seiten')

    // Teste Login-Page Elemente
    await safeClick(page, 'button:has-text("Google")', 'Google OAuth Button')
    await safeClick(page, 'button:has-text("GitHub")', 'GitHub OAuth Button')

  } else {
    console.log('✅ Eingeloggt - teste Dashboard')

    // === DASHBOARD ===
    await testPage(page, '/dashboard', 'Dashboard')

    // Klicke auf erstes Projekt
    await safeClick(page, 'a[href*="/projects/"]', 'Erstes Projekt')
    await page.waitForTimeout(1000)

    if (page.url().includes('/projects/')) {
      // === PROJECT PAGE - Alle Tabs durchklicken ===
      console.log('\n📍 Testing: Project Page')

      await safeClick(page, 'text=Dokumente', 'Dokumente Tab')
      await safeClick(page, 'text=Codes', 'Codes Tab')
      await safeClick(page, 'text=Analyse', 'Analyse Tab')
      await safeClick(page, 'text=Fragebogen', 'Fragebogen Tab')
      await page.waitForTimeout(1000)

      // === QUESTIONNAIRE MODULE ===
      if (page.url().includes('questionnaire') || await page.locator('text=Skalen-Browser').isVisible()) {
        console.log('\n📍 Testing: Questionnaire Module')

        await safeClick(page, 'text=Skalen-Browser', 'Skalen-Browser')
        await page.waitForTimeout(500)

        // Der Bug war hier! "Skala adaptieren" klicken
        await safeClick(page, 'text=Skala adaptieren', 'Skala adaptieren (BUG TEST)')
        await page.waitForTimeout(500)

        await safeClick(page, 'text=Arbeitsbereich', 'Arbeitsbereich')
        await safeClick(page, 'text=Qualität', 'Qualität Tab')
        await safeClick(page, 'text=Validierung', 'Validierung Tab')
        await safeClick(page, 'text=Bericht', 'Bericht Tab')
        await safeClick(page, 'text=Neue Skala', 'Neue Skala')
      }
    }

    // === SETTINGS ===
    await testPage(page, '/settings', 'Settings')

    // === TEAM PAGE ===
    await testPage(page, '/team', 'Team')
  }

  // === ERGEBNIS ===
  console.log('\n' + '='.repeat(60))
  console.log('📊 SMOKE TEST ERGEBNIS')
  console.log('='.repeat(60))
  console.log(`Geklickte Elemente: ${clickedElements.length}`)
  clickedElements.forEach(el => console.log(`  ✅ ${el}`))

  if (errors.length > 0) {
    console.log(`\n❌ FEHLER GEFUNDEN: ${errors.length}`)
    errors.forEach(err => console.log(`  ${err}`))

    // Test schlägt fehl wenn Fehler gefunden
    expect(errors, `Gefundene Fehler:\n${errors.join('\n')}`).toHaveLength(0)
  } else {
    console.log('\n✅ KEINE FEHLER GEFUNDEN!')
  }
})

// Hilfsfunktion: Sicher klicken (ohne Crash wenn Element nicht da)
async function safeClick(page: Page, selector: string, name: string) {
  try {
    const element = page.locator(selector).first()
    if (await element.isVisible({ timeout: 2000 })) {
      await element.click()
      clickedElements.push(name)
      await page.waitForTimeout(300)
      console.log(`  ✅ Clicked: ${name}`)
    }
  } catch {
    // Element nicht gefunden - kein Problem
  }
}

// Hilfsfunktion: Seite testen
async function testPage(page: Page, url: string, name: string) {
  console.log(`\n📍 Testing: ${name}`)
  try {
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    clickedElements.push(`Page: ${name}`)
  } catch (err) {
    console.log(`  ⚠️ Could not load ${name}`)
  }
}
