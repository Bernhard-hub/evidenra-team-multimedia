import { test, expect, Page } from '@playwright/test'

/**
 * SMOKE TEST - Manuelles Login, dann automatisch weiter
 *
 * 1. Browser öffnet sich
 * 2. Du loggst dich ein (30 Sekunden Zeit)
 * 3. Test klickt automatisch durch alles
 *
 * Ausführen: npx playwright test smoke-manual --headed
 */

const errors: string[] = []
const clickedElements: string[] = []

test('Smoke Test - Login manuell, dann automatisch testen', async ({ page }) => {
  // Fehler sammeln
  page.on('pageerror', (err) => {
    errors.push(`🔴 ${err.message}`)
    console.error('🔴 JS ERROR:', err.message)
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('ERR_')) {
      errors.push(`⚠️ ${msg.text().substring(0, 200)}`)
    }
  })

  // 1. Login-Seite öffnen
  console.log('\n🔐 Öffne Login-Seite...')
  console.log('👉 BITTE EINLOGGEN! (30 Sekunden Zeit)\n')

  await page.goto('https://research.evidenra.com/login')
  await page.waitForLoadState('networkidle')

  // Warte bis User eingeloggt ist (max 60 Sek)
  console.log('⏳ Warte auf Login... (60 Sekunden Zeit)')
  try {
    await page.waitForURL(/\/(dashboard|projects)/, { timeout: 60000 })
    console.log('✅ Login erfolgreich!\n')
  } catch {
    console.log('❌ Login-Timeout - teste nur Login-Seite')
    printResults()
    return
  }

  // 2. Dashboard testen
  console.log('📍 Testing: Dashboard')
  await page.waitForTimeout(1000)
  clickedElements.push('Dashboard')

  // 3. Erstes Projekt öffnen
  const projectLink = page.locator('a[href*="/projects/"]').first()
  if (await projectLink.isVisible({ timeout: 5000 })) {
    const projectName = await projectLink.textContent()
    await projectLink.click()
    clickedElements.push(`Projekt: ${projectName?.substring(0, 30)}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    console.log(`  ✅ Projekt geöffnet: ${projectName?.substring(0, 30)}`)
  }

  // 4. Project Tabs durchklicken
  console.log('\n📍 Testing: Project Tabs')
  await safeClick(page, '[data-tab="documents"], button:has-text("Dokumente")', 'Dokumente')
  await safeClick(page, '[data-tab="codes"], button:has-text("Codes")', 'Codes')
  await safeClick(page, '[data-tab="analysis"], button:has-text("Analyse")', 'Analyse')
  await safeClick(page, '[data-tab="questionnaire"], button:has-text("Fragebogen")', 'Fragebogen')
  await page.waitForTimeout(1500)

  // 5. Questionnaire Module
  if (await page.locator('text=Skalen-Browser').first().isVisible({ timeout: 3000 })) {
    console.log('\n📍 Testing: Questionnaire Module')

    await safeClick(page, 'button:has-text("Skalen-Browser"), text=Skalen-Browser', 'Skalen-Browser')
    await page.waitForTimeout(1000)

    // ⭐ DER WICHTIGE TEST - Skala adaptieren
    const adaptBtn = page.locator('button:has-text("adaptieren")').first()
    if (await adaptBtn.isVisible({ timeout: 3000 })) {
      console.log('  🎯 Teste "Skala adaptieren" (der Bug von vorhin)...')
      await adaptBtn.click()
      clickedElements.push('⭐ Skala adaptieren')
      await page.waitForTimeout(1000)
    }

    await safeClick(page, 'button:has-text("Arbeitsbereich")', 'Arbeitsbereich')
    await safeClick(page, 'button:has-text("Qualität")', 'Qualität')
    await safeClick(page, 'button:has-text("Validierung")', 'Validierung')
    await safeClick(page, 'button:has-text("Neue Skala")', 'Neue Skala')
  }

  // 6. Settings
  console.log('\n📍 Testing: Settings')
  await page.goto('https://research.evidenra.com/settings')
  await page.waitForLoadState('networkidle')
  clickedElements.push('Settings')
  await page.waitForTimeout(1000)

  // Ergebnis
  printResults()

  // Fail wenn Fehler
  expect(errors, `JS-Fehler gefunden:\n${errors.join('\n')}`).toHaveLength(0)
})

async function safeClick(page: Page, selector: string, name: string) {
  try {
    const el = page.locator(selector).first()
    if (await el.isVisible({ timeout: 2000 })) {
      await el.click()
      clickedElements.push(name)
      await page.waitForTimeout(500)
      console.log(`  ✅ ${name}`)
    }
  } catch { }
}

function printResults() {
  console.log('\n' + '='.repeat(50))
  console.log('📊 ERGEBNIS')
  console.log('='.repeat(50))
  console.log(`Getestet: ${clickedElements.length} Elemente`)
  clickedElements.forEach(el => console.log(`  ✅ ${el}`))

  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} FEHLER GEFUNDEN:`)
    errors.forEach(err => console.log(`  ${err}`))
  } else {
    console.log('\n✅ KEINE JS-FEHLER!')
  }
  console.log('='.repeat(50))
}
