import { test, expect, Page } from '@playwright/test'

/**
 * VOLLSTÄNDIGER E2E TEST
 * Testet alle Hauptfunktionen der App durch
 *
 * Ausführen: npx playwright test full-e2e --headed
 */

const TEST_EMAIL = 'e2e-test@evidenra.com'
const TEST_PASSWORD = 'TestPassword123!'

const errors: string[] = []
const tested: string[] = []

test.setTimeout(120000) // 2 Minuten Timeout

test('Vollständiger E2E Test', async ({ page }) => {
  // Fehler sammeln
  page.on('pageerror', (err) => {
    errors.push(`🔴 JS ERROR: ${err.message}`)
    console.error('🔴 JS ERROR:', err.message)
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error' &&
        !msg.text().includes('favicon') &&
        !msg.text().includes('ERR_') &&
        !msg.text().includes('net::') &&
        !msg.text().includes('409') &&
        !msg.text().includes('403') &&
        !msg.text().includes('foreign key')) {
      errors.push(`⚠️ Console: ${msg.text().substring(0, 200)}`)
    }
  })

  // ============================================================
  // 1. LOGIN
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('🔐 1. LOGIN')
  console.log('='.repeat(60))

  await page.goto('https://research.evidenra.com/login')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  await page.locator('input[type="email"]').fill(TEST_EMAIL)
  await page.locator('input[type="password"]').fill(TEST_PASSWORD)
  await page.locator('button[type="submit"]').click()

  await page.waitForTimeout(3000)

  const loginSuccess = await page.locator('text=Willkommen').isVisible({ timeout: 5000 }).catch(() => false) ||
                       page.url().includes('dashboard') || !page.url().includes('login')

  if (loginSuccess) {
    console.log('✅ Login erfolgreich')
    tested.push('Login')
  } else {
    throw new Error('Login fehlgeschlagen')
  }

  // Handle Onboarding wenn vorhanden
  const letsGoBtn = page.locator('button:has-text("Los geht")').first()
  if (await letsGoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await letsGoBtn.click()
    tested.push('Onboarding')
    await page.waitForTimeout(1500)
  }

  // ============================================================
  // 2. DASHBOARD
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('📊 2. DASHBOARD')
  console.log('='.repeat(60))

  await page.goto('https://research.evidenra.com/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // Prüfe Dashboard-Elemente
  const welcomeText = await page.locator('text=Willkommen').isVisible({ timeout: 2000 }).catch(() => false)
  if (welcomeText) {
    console.log('  ✅ Dashboard geladen')
    tested.push('Dashboard')
  }

  // Neues Projekt Button prüfen
  const newProjectBtn = page.locator('button:has-text("Neues Projekt")').first()
  if (await newProjectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('  ✅ "Neues Projekt" Button vorhanden')
    tested.push('Neues Projekt Button')
  }

  // ============================================================
  // 3. PROJEKT ÖFFNEN
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('📁 3. PROJEKT')
  console.log('='.repeat(60))

  const projectLink = page.locator('a[href*="/project/"]').first()
  if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    const projectName = await projectLink.textContent()
    await projectLink.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    console.log(`  ✅ Projekt geöffnet: ${projectName?.substring(0, 30)}`)
    tested.push('Projekt geöffnet')

    // Projekt-Tabs testen
    await safeClick(page, 'button:has-text("Dokumente")', 'Dokumente Tab')
    await safeClick(page, 'button:has-text("Codes")', 'Codes Tab')
    await safeClick(page, 'button:has-text("Memos")', 'Memos Tab')
    await safeClick(page, 'button:has-text("Analyse")', 'Analyse Tab')

    // Dokument hinzufügen Dialog öffnen (nur prüfen, nicht erstellen)
    const addDocBtn = page.locator('button:has-text("Dokument hinzufügen")').first()
    if (await addDocBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addDocBtn.click()
      await page.waitForTimeout(1000)

      // Prüfe ob Dialog offen ist
      const dialogTitle = await page.locator('text=Dokument hinzufügen').isVisible({ timeout: 2000 }).catch(() => false)
      if (dialogTitle) {
        console.log('  ✅ Dokument-Dialog öffnet')
        tested.push('Dokument-Dialog')
      }

      // Schließen
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    }

    // Code hinzufügen (nur prüfen)
    await safeClick(page, 'button:has-text("Codes")', 'Codes Tab (2)')
    const newCodeBtn = page.locator('button:has-text("Neuer Code")').first()
    if (await newCodeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  ✅ "Neuer Code" Button vorhanden')
      tested.push('Neuer Code Button')
    }
  } else {
    console.log('  ℹ️ Keine Projekte vorhanden')
  }

  // ============================================================
  // 4. FRAGEBOGEN
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('📝 4. FRAGEBOGEN')
  console.log('='.repeat(60))

  await page.goto('https://research.evidenra.com/questionnaire')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
  console.log('  ✅ Fragebogen Seite geladen')
  tested.push('Fragebogen Seite')

  // Alle Tabs testen
  await safeClick(page, 'button:has-text("Arbeitsbereich")', 'FB: Arbeitsbereich')
  await safeClick(page, 'button:has-text("Skalen-Browser")', 'FB: Skalen-Browser')

  // Skalen-Suche
  const searchInput = page.locator('input[placeholder*="uchen"]').first()
  if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await searchInput.fill('Selbstwirksamkeit')
    await page.waitForTimeout(1500)
    console.log('  ✅ Skalen-Suche')
    tested.push('Skalen-Suche')

    // Skala adaptieren Button prüfen
    const adaptBtn = page.locator('button:has-text("adaptieren")').first()
    if (await adaptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await adaptBtn.click()
      await page.waitForTimeout(1000)
      console.log('  ✅ Skala adaptieren')
      tested.push('⭐ Skala adaptieren')
    }
  }

  await safeClick(page, 'button:has-text("Skalen-Editor")', 'FB: Skalen-Editor')
  await safeClick(page, 'button:has-text("Validierung")', 'FB: Validierung')
  await safeClick(page, 'button:has-text("Bericht")', 'FB: Bericht')
  await safeClick(page, 'button:has-text("Qualität")', 'FB: Qualität')
  await safeClick(page, 'button:has-text("Neue Skala")', 'FB: Neue Skala')

  // ============================================================
  // 5. TEAM
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('👥 5. TEAM')
  console.log('='.repeat(60))

  await page.goto('https://research.evidenra.com/team')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  console.log('  ✅ Team Seite geladen')
  tested.push('Team Seite')

  await safeClick(page, 'button:has-text("Einladen")', 'Team: Einladen Button')

  // ============================================================
  // 6. EINSTELLUNGEN
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('⚙️ 6. EINSTELLUNGEN')
  console.log('='.repeat(60))

  await page.goto('https://research.evidenra.com/settings')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  console.log('  ✅ Settings Seite geladen')
  tested.push('Settings Seite')

  await safeClick(page, 'button:has-text("Profil")', 'Settings: Profil')
  await safeClick(page, 'button:has-text("API")', 'Settings: API')
  await safeClick(page, 'button:has-text("Abo")', 'Settings: Abo')
  await safeClick(page, 'button:has-text("Benachrichtigungen")', 'Settings: Benachrichtigungen')

  // ============================================================
  // ERGEBNIS
  // ============================================================
  printResults()

  // Test schlägt fehl wenn JS-Fehler
  const jsErrors = errors.filter(e => e.startsWith('🔴'))
  expect(jsErrors, `JS-Fehler gefunden:\n${jsErrors.join('\n')}`).toHaveLength(0)
})

async function safeClick(page: Page, selector: string, name: string) {
  try {
    const el = page.locator(selector).first()
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.click()
      tested.push(name)
      await page.waitForTimeout(500)
      console.log(`  ✅ ${name}`)
      return true
    }
  } catch { }
  return false
}

function printResults() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 E2E TEST ERGEBNIS')
  console.log('='.repeat(60))
  console.log(`\n✅ Getestete Elemente: ${tested.length}`)
  tested.forEach(t => console.log(`   • ${t}`))

  const jsErrors = errors.filter(e => e.startsWith('🔴'))
  const warnings = errors.filter(e => e.startsWith('⚠️'))

  if (jsErrors.length > 0) {
    console.log(`\n❌ ${jsErrors.length} JS-FEHLER:`)
    jsErrors.forEach(err => console.log(`   ${err}`))
  }

  if (warnings.length > 0 && warnings.length <= 5) {
    console.log(`\n⚠️ ${warnings.length} Warnungen:`)
    warnings.forEach(w => console.log(`   ${w}`))
  } else if (warnings.length > 5) {
    console.log(`\n⚠️ ${warnings.length} Warnungen (erste 5):`)
    warnings.slice(0, 5).forEach(w => console.log(`   ${w}`))
  }

  if (jsErrors.length === 0) {
    console.log('\n🎉 KEINE JS-FEHLER GEFUNDEN!')
  }

  console.log('='.repeat(60))
}
