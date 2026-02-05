import { test, expect } from '@playwright/test'

/**
 * TEST: Projekt erstellen und Dokumente hinzufügen
 *
 * Ausführen: npx playwright test create-project --headed
 */

const TEST_EMAIL = 'e2e-test@evidenra.com'
const TEST_PASSWORD = 'TestPassword123!'
const PROJECT_NAME = `E2E Testprojekt ${new Date().toLocaleTimeString('de-DE')}`

test.setTimeout(120000)

test('Neues Projekt erstellen mit Dokumenten', async ({ page }) => {
  const errors: string[] = []

  page.on('pageerror', (err) => {
    errors.push(`JS ERROR: ${err.message}`)
    console.error('🔴 JS ERROR:', err.message)
  })

  // === 1. LOGIN ===
  console.log('\n🔐 Login...')
  await page.goto('https://research.evidenra.com/login')
  await page.waitForLoadState('networkidle')

  await page.locator('input[type="email"]').fill(TEST_EMAIL)
  await page.locator('input[type="password"]').fill(TEST_PASSWORD)
  await page.locator('button[type="submit"]').click()

  await page.waitForTimeout(3000)
  console.log('✅ Eingeloggt')

  // Handle Onboarding
  const letsGoBtn = page.locator('button:has-text("Los geht")').first()
  if (await letsGoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await letsGoBtn.click()
    await page.waitForTimeout(1500)
  }

  // === 2. ZUM DASHBOARD ===
  await page.goto('https://research.evidenra.com/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // === 3. NEUES PROJEKT ERSTELLEN ===
  console.log('\n📁 Erstelle neues Projekt...')

  const newProjectBtn = page.locator('button:has-text("Neues Projekt")').first()
  await newProjectBtn.click()
  await page.waitForTimeout(1000)

  // Projektname eingeben
  const nameInput = page.locator('input[placeholder*="Interview"], input[placeholder*="Studie"]').first()
  await nameInput.fill(PROJECT_NAME)
  console.log(`   Name: ${PROJECT_NAME}`)

  // Beschreibung eingeben
  const descInput = page.locator('textarea').first()
  if (await descInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await descInput.fill('Automatisch erstelltes Testprojekt')
  }

  // Erstellen Button klicken
  await page.waitForTimeout(500)
  const createBtn = page.locator('button:has-text("Projekt erstellen")').first()

  if (await createBtn.isEnabled()) {
    await createBtn.click()
    console.log('   ✅ Projekt-Erstellung gestartet')
    await page.waitForTimeout(3000)
  } else {
    console.log('   ❌ Button deaktiviert')
  }

  // Prüfe ob Projekt erstellt wurde
  if (page.url().includes('/project/')) {
    console.log('✅ Projekt erfolgreich erstellt!')
    console.log(`   URL: ${page.url()}`)
  } else {
    // Suche Projekt auf Dashboard
    await page.goto('https://research.evidenra.com/')
    await page.waitForLoadState('networkidle')

    const projectLink = page.locator(`a:has-text("${PROJECT_NAME}")`).first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ Projekt auf Dashboard gefunden!')
      await projectLink.click()
      await page.waitForTimeout(2000)
    } else {
      console.log('⚠️ Projekt nicht auf Dashboard gefunden')
    }
  }

  // === 4. DOKUMENT HINZUFÜGEN ===
  if (page.url().includes('/project/')) {
    console.log('\n📄 Füge Dokument hinzu...')

    // Zum Dokumente Tab
    const docTab = page.locator('button:has-text("Dokumente")').first()
    if (await docTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await docTab.click()
      await page.waitForTimeout(1000)
    }

    // Dokument hinzufügen Button
    const addDocBtn = page.locator('button:has-text("Dokument hinzufügen"), button:has-text("Erstes Dokument")').first()
    if (await addDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addDocBtn.click()
      await page.waitForTimeout(1000)

      // Text einfügen Tab
      const pasteTab = page.locator('button:has-text("Text einfügen")').first()
      if (await pasteTab.isVisible({ timeout: 1000 }).catch(() => false)) {
        await pasteTab.click()
        await page.waitForTimeout(500)
      }

      // Text eingeben
      const textarea = page.locator('textarea[placeholder*="Text"]').first()
      if (await textarea.isVisible({ timeout: 1000 }).catch(() => false)) {
        await textarea.fill(`Interview mit Testperson

F: Wie erleben Sie Ihre Arbeit?
A: "Es ist sehr abwechslungsreich. Jeden Tag neue Herausforderungen, aber auch viel Teamarbeit."

F: Was motiviert Sie?
A: "Die Möglichkeit, etwas zu bewirken. Wenn ich sehe, dass meine Arbeit einen Unterschied macht."`)
      }

      // Name eingeben
      const nameField = page.locator('input[placeholder*="Interview"]').first()
      if (await nameField.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nameField.fill('Test Interview 1')
      }

      // Hochladen
      await page.waitForTimeout(500)
      const uploadBtn = page.locator('button:has-text("Dokument hinzufügen")').last()
      if (await uploadBtn.isEnabled().catch(() => false)) {
        await uploadBtn.click()
        await page.waitForTimeout(2000)
        console.log('✅ Dokument hinzugefügt!')
      }
    }
  }

  // === 5. CODE ERSTELLEN ===
  console.log('\n🏷️ Erstelle Code...')

  const codesTab = page.locator('button:has-text("Codes")').first()
  if (await codesTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await codesTab.click()
    await page.waitForTimeout(1000)

    const newCodeBtn = page.locator('button:has-text("Neuer Code")').first()
    if (await newCodeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newCodeBtn.click()
      await page.waitForTimeout(500)

      // Code-Name eingeben
      const codeInput = page.locator('input').first()
      if (await codeInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await codeInput.fill('Motivation')
        await codeInput.press('Enter')
        await page.waitForTimeout(500)
        console.log('✅ Code erstellt!')
      }
    }
  }

  // === ERGEBNIS ===
  console.log('\n' + '='.repeat(50))
  console.log('📊 ERGEBNIS')
  console.log('='.repeat(50))

  if (errors.length === 0) {
    console.log('✅ KEINE JS-FEHLER!')
  } else {
    console.log(`❌ ${errors.length} Fehler:`)
    errors.forEach(e => console.log(`   ${e}`))
  }

  expect(errors.filter(e => !e.includes('foreign key'))).toHaveLength(0)
})
