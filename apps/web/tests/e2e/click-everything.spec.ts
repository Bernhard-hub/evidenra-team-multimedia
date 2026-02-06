import { test, expect, Page, Locator } from '@playwright/test'

/**
 * CLICK EVERYTHING TEST - WIRKLICH JEDEN BUTTON!
 *
 * Dieser Test klickt auf JEDEN interaktiven Element auf JEDER Seite.
 * Er findet automatisch alle Buttons, Links, Tabs, Toggles, etc.
 *
 * Ausführen: npx playwright test click-everything.spec.ts --headed --timeout=600000
 */

interface ClickResult {
  element: string
  success: boolean
  error?: string
}

const errors: string[] = []
const clicked: ClickResult[] = []
const visitedUrls: Set<string> = new Set()

// NUR diese Aktionen überspringen (wirklich gefährlich)
const DANGEROUS_ACTIONS = [
  'löschen',
  'delete',
  'abmelden',
  'logout',
  'sign out',
  'konto löschen',
  'entfernen', // only if it deletes data
]

test.describe('CLICK EVERYTHING - Comprehensive Interactive Test', () => {
  test.setTimeout(600000) // 10 minutes

  test('Click EVERY button on EVERY page', async ({ page }) => {
    // Setup error listeners
    page.on('pageerror', (err) => {
      const msg = `🔴 JS ERROR: ${err.message}`
      errors.push(msg)
      console.error(msg)
    })

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (!text.includes('favicon') && !text.includes('net::ERR_')) {
          errors.push(`⚠️ Console: ${text.substring(0, 200)}`)
        }
      }
    })

    // Start at home
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    if (page.url().includes('/login')) {
      console.log('\n⚠️ NOT LOGGED IN - Testing login page only')
      await clickEverythingOnPage(page, 'Login Page')

      // Try demo login if available
      await tryClick(page, 'button:has-text("Demo")', 'Demo Login')
      await page.waitForTimeout(2000)
    }

    // If logged in, test all pages
    if (!page.url().includes('/login')) {
      console.log('\n✅ LOGGED IN - Testing all pages')

      // ========== DASHBOARD ==========
      await testPage(page, '/', 'Dashboard')

      // ========== FIRST PROJECT ==========
      const projectLink = page.locator('a[href*="/project/"]').first()
      if (await projectLink.isVisible({ timeout: 5000 })) {
        const href = await projectLink.getAttribute('href')
        if (href) {
          await testPage(page, href, 'Project Page')

          // Test ALL main tabs
          const mainTabs = [
            'Dokumente', 'Codes', 'Memos', 'Paraphrasen',
            'Team', 'Analyse', 'Qualität'
          ]
          for (const tabName of mainTabs) {
            console.log(`\n📍 Testing Tab: ${tabName}`)
            await tryClick(page, `button:has-text("${tabName}")`, `Tab: ${tabName}`)
            await page.waitForTimeout(800)
            await clickEverythingOnPage(page, `${tabName} Tab`)
          }

          // Test ALL Analysis sub-tabs
          await tryClick(page, 'button:has-text("Analyse")', 'Analyse Tab')
          await page.waitForTimeout(500)

          const analysisTabs = [
            'Code-Häufigkeit', 'Ko-Okkurrenz', 'Code-Dokument',
            'Netzwerk', 'Trends', 'Zeitverlauf', 'Methoden', 'IRR', 'AKIH'
          ]
          for (const subTab of analysisTabs) {
            console.log(`\n📍 Testing Analysis Sub-Tab: ${subTab}`)
            await tryClick(page, `button:has-text("${subTab}")`, `Analysis: ${subTab}`)
            await page.waitForTimeout(800)
            await clickEverythingOnPage(page, `Analysis ${subTab}`)
            await page.screenshot({ path: `test-results/analysis-${subTab}.png` })
          }

          // Test NEXUS AI
          console.log('\n📍 Testing NEXUS AI')
          await tryClick(page, 'button:has-text("NEXUS AI")', 'Open NEXUS')
          await page.waitForTimeout(1000)
          await clickEverythingOnPage(page, 'NEXUS AI Panel')
          await tryClick(page, 'button:has([class*="close"]), button:has-text("×")', 'Close NEXUS')
          await page.waitForTimeout(500)

          // Test all header buttons
          console.log('\n📍 Testing Header Buttons')
          await tryClick(page, 'button:has-text("Suchen")', 'Search Button')
          await page.waitForTimeout(500)
          await page.keyboard.press('Escape')

          await tryClick(page, 'button:has-text("Bericht")', 'Report Button')
          await page.waitForTimeout(500)
          await tryClick(page, 'button:has-text("Abbrechen"), button:has-text("Schließen")', 'Close Report')

          await tryClick(page, 'button:has-text("Thesis")', 'Thesis Button')
          await page.waitForTimeout(500)
          await tryClick(page, 'button:has-text("Abbrechen"), button:has-text("Schließen")', 'Close Thesis')

          await tryClick(page, 'button:has-text("Guide")', 'Guide Button')
          await page.waitForTimeout(500)
          await tryClick(page, 'button:has-text("Schließen")', 'Close Guide')

          await tryClick(page, 'button:has-text("Export")', 'Export Button')
          await page.waitForTimeout(500)
          await clickEverythingOnPage(page, 'Export Modal')
          await tryClick(page, 'button:has-text("Abbrechen"), button:has-text("Schließen")', 'Close Export')
        }
      }

      // ========== QUESTIONNAIRE ==========
      await testPage(page, '/questionnaire', 'Questionnaire')

      // Test questionnaire tabs
      const questTabs = ['Skalen-Browser', 'Arbeitsbereich', 'Qualität', 'Validierung', 'Bericht']
      for (const tab of questTabs) {
        console.log(`\n📍 Testing Questionnaire Tab: ${tab}`)
        await tryClick(page, `button:has-text("${tab}")`, `Quest Tab: ${tab}`)
        await page.waitForTimeout(800)
        await clickEverythingOnPage(page, `Questionnaire ${tab}`)
      }

      // Test "Skala adaptieren" specifically
      console.log('\n📍 Testing Skala adaptieren')
      await tryClick(page, 'button:has-text("Skalen-Browser")', 'Back to Skalen-Browser')
      await page.waitForTimeout(500)

      // Click first scale card
      const scaleCards = page.locator('[class*="scale"], [class*="card"]').first()
      if (await scaleCards.isVisible({ timeout: 2000 })) {
        await scaleCards.click()
        await page.waitForTimeout(500)
      }

      await tryClick(page, 'button:has-text("Skala adaptieren")', 'Skala adaptieren')
      await page.waitForTimeout(1000)
      await clickEverythingOnPage(page, 'Skala adaptieren Dialog')

      // ========== SETTINGS ==========
      await testPage(page, '/settings', 'Settings')

      // ========== TEAM ==========
      await testPage(page, '/team', 'Team')

      // ========== PRICING ==========
      await testPage(page, '/pricing', 'Pricing')
    }

    // ========== FINAL REPORT ==========
    console.log('\n' + '='.repeat(80))
    console.log('📊 CLICK EVERYTHING TEST - FINAL REPORT')
    console.log('='.repeat(80))

    const successful = clicked.filter(c => c.success).length
    const failed = clicked.filter(c => !c.success).length

    console.log(`\n✅ Successfully clicked: ${successful} elements`)
    console.log(`❌ Failed to click: ${failed} elements`)
    console.log(`🔴 JavaScript errors: ${errors.length}`)

    if (errors.length > 0) {
      console.log('\n🔴 ERRORS:')
      errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`))
    }

    // Create report file
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalClicked: successful,
        totalFailed: failed,
        totalErrors: errors.length,
      },
      clicked: clicked.filter(c => c.success).map(c => c.element),
      failed: clicked.filter(c => !c.success).map(c => ({ element: c.element, error: c.error })),
      errors,
    }

    await page.evaluate((r) => {
      console.log('REPORT:', JSON.stringify(r, null, 2))
    }, report)

    // Test fails if there are JS errors
    expect(errors, `Found ${errors.length} JS errors`).toHaveLength(0)
  })
})

// ========== HELPER FUNCTIONS ==========

async function testPage(page: Page, url: string, name: string) {
  if (visitedUrls.has(url)) return

  console.log(`\n${'='.repeat(60)}`)
  console.log(`📍 Testing Page: ${name} (${url})`)
  console.log('='.repeat(60))

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(1500)
    visitedUrls.add(url)
    await clickEverythingOnPage(page, name)
  } catch (err) {
    console.log(`⚠️ Could not load ${name}: ${err}`)
  }
}

async function clickEverythingOnPage(page: Page, pageName: string) {
  console.log(`\n🔍 Finding all clickable elements on: ${pageName}`)

  // 1. All buttons
  await clickAllOfType(page, 'button:visible', 'button')

  // 2. All links (but don't navigate)
  await clickAllOfType(page, 'a:visible:not([href^="http"]):not([href^="mailto"])', 'link')

  // 3. All tabs
  await clickAllOfType(page, '[role="tab"]:visible', 'tab')

  // 4. All toggles/switches
  await clickAllOfType(page, '[role="switch"]:visible, [class*="toggle"]:visible, [class*="switch"]:visible', 'toggle')

  // 5. All checkboxes
  await clickAllOfType(page, 'input[type="checkbox"]:visible', 'checkbox')

  // 6. All radio buttons
  await clickAllOfType(page, 'input[type="radio"]:visible', 'radio')

  // 7. All expandable items
  await clickAllOfType(page, '[aria-expanded]:visible, [class*="collapse"]:visible, [class*="expand"]:visible', 'expandable')

  // 8. All dropdown triggers
  await clickAllOfType(page, '[class*="dropdown"]:visible, [aria-haspopup]:visible', 'dropdown')

  // 9. All menu items
  await clickAllOfType(page, '[role="menuitem"]:visible', 'menuitem')

  // 10. All clickable divs with onclick
  await clickAllOfType(page, '[onclick]:visible', 'onclick-div')
}

async function clickAllOfType(page: Page, selector: string, type: string) {
  try {
    const elements = await page.locator(selector).all()
    console.log(`  Found ${elements.length} ${type}(s)`)

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i]

      try {
        // Get element identifier
        const text = await el.textContent() || ''
        const ariaLabel = await el.getAttribute('aria-label') || ''
        const title = await el.getAttribute('title') || ''
        const id = await el.getAttribute('id') || ''
        const name = text.trim().substring(0, 40) || ariaLabel || title || id || `${type}-${i}`

        // Skip dangerous actions
        if (isDangerous(name)) {
          console.log(`    ⏭️ SKIPPED (dangerous): ${name}`)
          clicked.push({ element: `[SKIPPED] ${name}`, success: false, error: 'Dangerous action' })
          continue
        }

        // Check if visible and enabled
        if (!(await el.isVisible())) continue
        if (await el.isDisabled()) continue

        // Click it!
        await el.click({ timeout: 2000, force: false })
        clicked.push({ element: `${type}: ${name}`, success: true })
        console.log(`    ✅ ${type}: ${name}`)
        await page.waitForTimeout(150)

        // Handle modals/dialogs that might have opened
        await closeAnyModals(page)

      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        if (!errMsg.includes('timeout') && !errMsg.includes('intercept')) {
          // Only log unexpected errors
          clicked.push({ element: `${type}-${i}`, success: false, error: errMsg.substring(0, 100) })
        }
      }
    }
  } catch {
    // Selector not found - OK
  }
}

async function tryClick(page: Page, selector: string, name: string): Promise<boolean> {
  try {
    const el = page.locator(selector).first()
    if (await el.isVisible({ timeout: 2000 })) {
      await el.click({ timeout: 3000 })
      clicked.push({ element: name, success: true })
      console.log(`  ✅ ${name}`)
      await page.waitForTimeout(200)
      return true
    }
  } catch {
    console.log(`  ⏭️ ${name} (not found)`)
  }
  return false
}

async function closeAnyModals(page: Page) {
  try {
    // Try multiple ways to close modals
    const closeSelectors = [
      'button:has-text("Abbrechen")',
      'button:has-text("Cancel")',
      'button:has-text("Schließen")',
      'button:has-text("Close")',
      'button[aria-label="Close"]',
      'button[aria-label="Schließen"]',
      '[class*="modal"] button:has-text("×")',
      '[class*="dialog"] button:has-text("×")',
    ]

    for (const selector of closeSelectors) {
      const btn = page.locator(selector).first()
      if (await btn.isVisible({ timeout: 300 })) {
        await btn.click({ timeout: 1000 })
        await page.waitForTimeout(100)
      }
    }

    // Also try pressing Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
  } catch {
    // No modal to close
  }
}

function isDangerous(text: string): boolean {
  const lowerText = text.toLowerCase()
  return DANGEROUS_ACTIONS.some(action => lowerText.includes(action))
}
