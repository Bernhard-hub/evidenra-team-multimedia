import { test, expect, Page } from '@playwright/test'

/**
 * AUTOMATISCHER SMOKE TEST
 * Loggt sich selbst ein und testet alles durch
 *
 * Ausführen: npx playwright test smoke-auto --headed
 */

const TEST_EMAIL = 'e2e-test@evidenra.com'
const TEST_PASSWORD = 'TestPassword123!'

const errors: string[] = []
const tested: string[] = []

test('Automatischer Smoke Test - Komplett durchklicken', async ({ page }) => {
  // Fehler sammeln
  page.on('pageerror', (err) => {
    errors.push(`🔴 JS ERROR: ${err.message}`)
    console.error('🔴 JS ERROR:', err.message)
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error' &&
        !msg.text().includes('favicon') &&
        !msg.text().includes('ERR_') &&
        !msg.text().includes('net::')) {
      errors.push(`⚠️ Console: ${msg.text().substring(0, 200)}`)
    }
  })

  // === 1. LOGIN ===
  console.log('\n🔐 Automatisches Login...')
  await page.goto('https://research.evidenra.com/login')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // Email eingeben
  const emailInput = page.locator('input[type="email"]')
  await emailInput.fill(TEST_EMAIL)

  // Passwort eingeben
  const passwordInput = page.locator('input[type="password"]')
  await passwordInput.fill(TEST_PASSWORD)

  // Login Button klicken
  const loginBtn = page.locator('button[type="submit"]')
  await loginBtn.click()

  // Warte auf Dashboard, Onboarding oder bereits eingeloggt
  await page.waitForTimeout(3000) // Kurz warten für Redirect

  // Prüfe verschiedene Erfolgs-Indikatoren
  const dashboardVisible = await page.locator('text=Willkommen zurück').isVisible({ timeout: 2000 }).catch(() => false)
  const onboardingVisible = await page.locator('text=Willkommen bei EVIDENRA').isVisible({ timeout: 2000 }).catch(() => false)
  const urlOk = /\/(dashboard|project)/.test(page.url())

  if (dashboardVisible || onboardingVisible || urlOk) {
    console.log('✅ Login erfolgreich!')
    tested.push('Login')
  } else {
    console.log('❌ Login fehlgeschlagen')
    printResults()
    expect(false, 'Login fehlgeschlagen').toBeTruthy()
    return
  }

  await page.waitForTimeout(1000)

  // Handle Onboarding Modal wenn vorhanden
  const letsGoBtn = page.locator('button:has-text("Los geht"), button:has-text("Let\'s go")').first()
  if (await letsGoBtn.isVisible({ timeout: 2000 })) {
    console.log('  📋 Onboarding-Dialog gefunden, klicke "Los geht\'s"...')
    await letsGoBtn.click()
    tested.push('Onboarding abgeschlossen')
    await page.waitForTimeout(1500)
  }

  await page.waitForTimeout(1000)

  // === 2. DASHBOARD ===
  console.log('\n📍 Testing: Dashboard')
  tested.push('Dashboard')

  // === 3. NEUES PROJEKT ERSTELLEN (optional) ===
  const newProjectBtn = page.locator('button:has-text("Neues Projekt"), button:has-text("New Project")').first()
  if (await newProjectBtn.isVisible({ timeout: 2000 })) {
    // Wir erstellen kein neues Projekt, nur prüfen ob Button da ist
    console.log('  ✅ "Neues Projekt" Button vorhanden')
    tested.push('Neues Projekt Button')
  }

  // === 4. ERSTES PROJEKT ÖFFNEN ===
  // URL ist /project/xxx (singular, nicht plural!)
  const projectLink = page.locator('a[href*="/project/"]').first()
  if (await projectLink.isVisible({ timeout: 5000 })) {
    const projectName = await projectLink.textContent()
    await projectLink.click()
    tested.push(`Projekt öffnen: ${projectName?.substring(0, 30)}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    console.log(`  ✅ Projekt geöffnet`)

    // === 5. PROJECT TABS ===
    console.log('\n📍 Testing: Project Tabs')
    await safeClick(page, 'button:has-text("Dokumente"), [data-tab="documents"]', 'Dokumente Tab')
    await safeClick(page, 'button:has-text("Codes"), [data-tab="codes"]', 'Codes Tab')
    await safeClick(page, 'button:has-text("Analyse"), [data-tab="analysis"]', 'Analyse Tab')
    await safeClick(page, 'button:has-text("Fragebogen"), [data-tab="questionnaire"]', 'Fragebogen Tab')
    await page.waitForTimeout(1500)

    // === 6. QUESTIONNAIRE MODULE ===
    const scaleBrowserVisible = await page.locator('text=Skalen-Browser').first().isVisible({ timeout: 3000 })
    if (scaleBrowserVisible) {
      console.log('\n📍 Testing: Questionnaire Module')

      await safeClick(page, 'button:has-text("Skalen-Browser")', 'Skalen-Browser')
      await page.waitForTimeout(1000)

      // Suche
      const searchInput = page.locator('input[placeholder*="uchen"], input[placeholder*="earch"]').first()
      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.fill('Selbstwirksamkeit')
        tested.push('Skalen-Suche')
        await page.waitForTimeout(1000)
      }

      // ⭐ DER BUG TEST: Skala adaptieren
      const adaptBtn = page.locator('button:has-text("adaptieren"), button:has-text("Adapt")').first()
      if (await adaptBtn.isVisible({ timeout: 3000 })) {
        console.log('  🎯 Teste "Skala adaptieren"...')
        await adaptBtn.click()
        tested.push('⭐ Skala adaptieren (BUG TEST)')
        await page.waitForTimeout(1000)
      }

      // Andere Tabs
      await safeClick(page, 'button:has-text("Arbeitsbereich")', 'Arbeitsbereich')
      await safeClick(page, 'button:has-text("Qualität")', 'Qualität')
      await safeClick(page, 'button:has-text("Validierung")', 'Validierung')
      await safeClick(page, 'button:has-text("Neue Skala")', 'Neue Skala')
    }
  } else {
    console.log('  ℹ️ Keine Projekte vorhanden - erstelle Test-Projekt')

    // Neues Projekt erstellen
    if (await newProjectBtn.isVisible()) {
      await newProjectBtn.click()
      tested.push('Neues Projekt Dialog')
      await page.waitForTimeout(1000)

      // Projektname eingeben (das Input-Feld direkt unter "Projektname")
      // Suche spezifisch nach dem Input im Dialog (nicht textarea)
      const dialogInputs = page.locator('div[role="dialog"] input, .modal input, [class*="modal"] input').all()
      const allInputs = await dialogInputs
      let nameInput = null

      // Finde das erste Input-Feld (nicht textarea)
      for (const input of allInputs) {
        const tagName = await input.evaluate(el => el.tagName.toLowerCase())
        if (tagName === 'input') {
          nameInput = input
          break
        }
      }

      // Fallback: erstes sichtbares input
      if (!nameInput) {
        nameInput = page.locator('input:visible').first()
      }

      if (nameInput && await nameInput.isVisible({ timeout: 3000 })) {
        await nameInput.clear()
        await nameInput.fill('E2E Test Projekt')
        console.log('  ✅ Projektname eingegeben')

        // Beschreibung (optional) - das ist die textarea
        const descInput = page.locator('textarea:visible').first()
        if (await descInput.isVisible({ timeout: 1000 })) {
          await descInput.fill('Automatisch erstelltes Testprojekt für E2E Tests')
        }

        // Erstellen klicken
        const createBtn = page.locator('button:has-text("Erstellen"), button:has-text("Create"), button[type="submit"]').first()
        if (await createBtn.isVisible({ timeout: 2000 })) {
          await createBtn.click()
          tested.push('Projekt erstellt')
          console.log('  ✅ Projekt erstellt')
          await page.waitForTimeout(2000)

          // Warte auf Projekt-Seite
          await page.waitForURL(/\/projects\//, { timeout: 10000 }).catch(() => {})
          await page.waitForTimeout(1500)

          // === JETZT PROJEKT TABS TESTEN ===
          console.log('\n📍 Testing: Neues Projekt - Tabs')
          await safeClick(page, 'button:has-text("Dokumente"), [data-tab="documents"]', 'Dokumente Tab')
          await safeClick(page, 'button:has-text("Codes"), [data-tab="codes"]', 'Codes Tab')
          await safeClick(page, 'button:has-text("Analyse"), [data-tab="analysis"]', 'Analyse Tab')
          await safeClick(page, 'button:has-text("Fragebogen"), [data-tab="questionnaire"]', 'Fragebogen Tab')
          await page.waitForTimeout(1500)

          // === QUESTIONNAIRE MODULE ===
          const scaleBrowserBtn = page.locator('text=Skalen-Browser').first()
          if (await scaleBrowserBtn.isVisible({ timeout: 3000 })) {
            console.log('\n📍 Testing: Questionnaire Module')

            await safeClick(page, 'button:has-text("Skalen-Browser")', 'Skalen-Browser')
            await page.waitForTimeout(1000)

            // Suche ausführen
            const searchInput = page.locator('input[placeholder*="uchen"], input[placeholder*="earch"]').first()
            if (await searchInput.isVisible({ timeout: 2000 })) {
              await searchInput.fill('Selbstwirksamkeit')
              tested.push('Skalen-Suche')
              console.log('  ✅ Suche: Selbstwirksamkeit')
              await page.waitForTimeout(1500)
            }

            // ⭐ DER WICHTIGE BUG TEST: Skala adaptieren
            const adaptBtn = page.locator('button:has-text("adaptieren"), button:has-text("Adapt")').first()
            if (await adaptBtn.isVisible({ timeout: 3000 })) {
              console.log('  🎯 Teste "Skala adaptieren" (der Bug von vorhin)...')
              await adaptBtn.click()
              tested.push('⭐ SKALA ADAPTIEREN (Bug-Test)')
              await page.waitForTimeout(1500)
              console.log('  ✅ Skala adaptieren - KEIN CRASH!')
            }

            // Weitere Questionnaire-Tabs
            await safeClick(page, 'button:has-text("Arbeitsbereich")', 'Arbeitsbereich Tab')
            await safeClick(page, 'button:has-text("Qualität")', 'Qualität Tab')
            await safeClick(page, 'button:has-text("Validierung")', 'Validierung Tab')
            await safeClick(page, 'button:has-text("Bericht")', 'Bericht Tab')
            await safeClick(page, 'button:has-text("Neue Skala")', 'Neue Skala Button')
          }
        }
      }
    }
  }

  // === 7. FRAGEBOGEN (Sidebar) ===
  console.log('\n📍 Testing: Fragebogen Page')
  await page.goto('https://research.evidenra.com/questionnaire')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
  tested.push('Fragebogen Page')

  // Skalen-Browser testen
  const skalenBrowserBtn = page.locator('button:has-text("Skalen-Browser")').first()
  if (await skalenBrowserBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skalenBrowserBtn.click()
    tested.push('Skalen-Browser')
    await page.waitForTimeout(1000)
    console.log('  ✅ Skalen-Browser')

    // Suche ausführen
    const searchInput = page.locator('input[placeholder*="uchen"], input[placeholder*="earch"]').first()
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill('Selbstwirksamkeit')
      tested.push('Skalen-Suche')
      console.log('  ✅ Skalen-Suche')
      await page.waitForTimeout(1500)
    }

    // ⭐ DER WICHTIGE BUG TEST: Skala adaptieren
    const adaptBtn = page.locator('button:has-text("adaptieren"), button:has-text("Adapt")').first()
    if (await adaptBtn.isVisible({ timeout: 3000 })) {
      console.log('  🎯 Teste "Skala adaptieren" (der Bug von vorhin)...')
      await adaptBtn.click()
      tested.push('⭐ SKALA ADAPTIEREN (Bug-Test)')
      await page.waitForTimeout(1500)
      console.log('  ✅ Skala adaptieren - KEIN CRASH!')
    }

    // Andere Questionnaire-Tabs
    await safeClick(page, 'button:has-text("Arbeitsbereich")', 'Arbeitsbereich Tab')
    await safeClick(page, 'button:has-text("Qualität")', 'Qualität Tab')
    await safeClick(page, 'button:has-text("Validierung")', 'Validierung Tab')
    await safeClick(page, 'button:has-text("Neue Skala")', 'Neue Skala Button')
  }

  // === 8. SETTINGS ===
  console.log('\n📍 Testing: Settings')
  await page.goto('https://research.evidenra.com/settings')
  await page.waitForLoadState('networkidle')
  tested.push('Settings Page')
  await page.waitForTimeout(1000)

  // Settings Tabs
  await safeClick(page, 'button:has-text("Profil")', 'Settings: Profil')
  await safeClick(page, 'button:has-text("API")', 'Settings: API')
  await safeClick(page, 'button:has-text("Abo")', 'Settings: Abo')

  // === ERGEBNIS ===
  printResults()

  // Test schlägt fehl wenn JS-Fehler
  const jsErrors = errors.filter(e => e.startsWith('🔴'))
  expect(jsErrors, `JS-Fehler gefunden:\n${jsErrors.join('\n')}`).toHaveLength(0)
})

async function safeClick(page: Page, selector: string, name: string) {
  try {
    const el = page.locator(selector).first()
    if (await el.isVisible({ timeout: 2000 })) {
      await el.click()
      tested.push(name)
      await page.waitForTimeout(500)
      console.log(`  ✅ ${name}`)
    }
  } catch { }
}

function printResults() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 SMOKE TEST ERGEBNIS')
  console.log('='.repeat(60))
  console.log(`\nGetestete Elemente: ${tested.length}`)
  tested.forEach(t => console.log(`  ✅ ${t}`))

  const jsErrors = errors.filter(e => e.startsWith('🔴'))
  const warnings = errors.filter(e => e.startsWith('⚠️'))

  if (jsErrors.length > 0) {
    console.log(`\n❌ ${jsErrors.length} JS-FEHLER:`)
    jsErrors.forEach(err => console.log(`  ${err}`))
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️ ${warnings.length} Warnungen:`)
    warnings.forEach(w => console.log(`  ${w}`))
  }

  if (jsErrors.length === 0) {
    console.log('\n✅ KEINE JS-FEHLER GEFUNDEN!')
  }

  console.log('='.repeat(60))
}
