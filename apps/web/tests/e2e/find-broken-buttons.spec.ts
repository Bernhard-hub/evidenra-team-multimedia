import { test, expect, Page } from '@playwright/test'

/**
 * Find Broken Buttons Test
 *
 * Findet alle Buttons ohne Funktion auf Production
 * Klickt jeden Button und prüft ob etwas passiert
 */

const TEST_EMAIL = 'e2e-test@evidenra.com'
const TEST_PASSWORD = 'TestPassword123!'

interface ButtonReport {
  text: string
  selector: string
  page: string
  status: 'working' | 'broken' | 'error' | 'skipped'
  details?: string
}

const brokenButtons: ButtonReport[] = []
const workingButtons: ButtonReport[] = []
const errorButtons: ButtonReport[] = []

// Skip these buttons (dangerous or navigation)
const SKIP_PATTERNS = [
  'abmelden', 'logout', 'löschen', 'delete', 'entfernen',
  'schließen', 'close', 'abbrechen', 'cancel'
]

test.describe('Find Broken Buttons', () => {
  test.setTimeout(300000) // 5 minutes

  test('Find all non-functional buttons on production', async ({ page }) => {
    const errors: string[] = []

    // Capture JS errors
    page.on('pageerror', (err) => {
      errors.push(`JS ERROR: ${err.message}`)
      console.error('🔴 JS ERROR:', err.message)
    })

    // Login
    console.log('🔐 Logging in...')
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', TEST_EMAIL)
      await page.fill('input[type="password"]', TEST_PASSWORD)
      await page.click('button[type="submit"]')
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
      console.log('✅ Login successful')
    }

    await page.waitForTimeout(2000)

    // Test Dashboard
    await testPageButtons(page, '/', 'Dashboard')

    // Test Project Page
    const projectLink = page.locator('a[href*="/project/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      const href = await projectLink.getAttribute('href')
      if (href) {
        await testPageButtons(page, href, 'Project Page')

        // Test each tab
        const tabs = ['Dokumente', 'Codes', 'Memos', 'Analyse']
        for (const tab of tabs) {
          await page.goto(href)
          await page.waitForLoadState('networkidle')
          const tabBtn = page.locator(`button:has-text("${tab}")`).first()
          if (await tabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await tabBtn.click()
            await page.waitForTimeout(500)
            await testPageButtons(page, page.url(), `${tab} Tab`)
          }
        }
      }
    }

    // Test Questionnaire
    await testPageButtons(page, '/questionnaire', 'Questionnaire')

    // Test Settings
    await testPageButtons(page, '/settings', 'Settings')

    // Generate Report
    console.log('\n' + '='.repeat(80))
    console.log('📊 BUTTON ANALYSIS REPORT')
    console.log('='.repeat(80))

    console.log(`\n✅ Working Buttons: ${workingButtons.length}`)
    console.log(`❌ Broken Buttons: ${brokenButtons.length}`)
    console.log(`⚠️ Error Buttons: ${errorButtons.length}`)

    if (brokenButtons.length > 0) {
      console.log('\n❌ BROKEN BUTTONS (no reaction):')
      brokenButtons.forEach((btn, i) => {
        console.log(`  ${i + 1}. [${btn.page}] "${btn.text}"`)
        if (btn.details) console.log(`     Details: ${btn.details}`)
      })
    }

    if (errorButtons.length > 0) {
      console.log('\n⚠️ BUTTONS WITH ERRORS:')
      errorButtons.forEach((btn, i) => {
        console.log(`  ${i + 1}. [${btn.page}] "${btn.text}"`)
        if (btn.details) console.log(`     Error: ${btn.details}`)
      })
    }

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        working: workingButtons.length,
        broken: brokenButtons.length,
        errors: errorButtons.length,
      },
      brokenButtons,
      errorButtons,
      jsErrors: errors,
    }

    console.log('\n📝 Full report saved to console')
    console.log(JSON.stringify(report, null, 2))

    // Take final screenshot
    await page.screenshot({ path: 'test-results/broken-buttons-report.png', fullPage: true })
  })
})

async function testPageButtons(page: Page, url: string, pageName: string) {
  console.log(`\n📍 Testing: ${pageName}`)

  try {
    if (!page.url().includes(url.replace(/^\//, ''))) {
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
    }
  } catch (e) {
    console.log(`⚠️ Could not navigate to ${url}`)
    return
  }

  // Find all visible buttons
  const buttons = await page.locator('button:visible').all()
  console.log(`  Found ${buttons.length} buttons`)

  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i]

    try {
      const text = (await btn.textContent() || '').trim().substring(0, 50)
      const ariaLabel = await btn.getAttribute('aria-label') || ''
      const buttonId = text || ariaLabel || `button-${i}`

      // Skip dangerous buttons
      if (SKIP_PATTERNS.some(p => buttonId.toLowerCase().includes(p))) {
        console.log(`  ⏭️ Skipped: "${buttonId}"`)
        continue
      }

      // Skip if disabled
      if (await btn.isDisabled()) {
        console.log(`  ⏭️ Disabled: "${buttonId}"`)
        continue
      }

      // Get page state before click
      const urlBefore = page.url()
      const htmlBefore = await page.content()

      // Try to click
      await btn.click({ timeout: 2000 })
      await page.waitForTimeout(300)

      // Get page state after click
      const urlAfter = page.url()
      const htmlAfter = await page.content()

      // Check if something happened
      const urlChanged = urlBefore !== urlAfter
      const contentChanged = htmlBefore !== htmlAfter

      // Check for new modals/dialogs
      const hasModal = await page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first().isVisible({ timeout: 500 }).catch(() => false)

      if (urlChanged || contentChanged || hasModal) {
        workingButtons.push({
          text: buttonId,
          selector: `button:nth-of-type(${i + 1})`,
          page: pageName,
          status: 'working',
          details: urlChanged ? 'URL changed' : hasModal ? 'Modal opened' : 'Content changed'
        })
        console.log(`  ✅ Working: "${buttonId}"`)

        // Close any modals
        await page.keyboard.press('Escape')
        await page.waitForTimeout(200)

        // Navigate back if URL changed
        if (urlChanged && !urlAfter.includes('/login')) {
          await page.goto(urlBefore)
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(500)
        }
      } else {
        brokenButtons.push({
          text: buttonId,
          selector: `button:nth-of-type(${i + 1})`,
          page: pageName,
          status: 'broken',
          details: 'No visible reaction to click'
        })
        console.log(`  ❌ Broken: "${buttonId}"`)
      }

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      const text = await btn.textContent().catch(() => `button-${i}`)

      errorButtons.push({
        text: (text || '').trim().substring(0, 50),
        selector: `button:nth-of-type(${i + 1})`,
        page: pageName,
        status: 'error',
        details: errMsg.substring(0, 100)
      })
      console.log(`  ⚠️ Error: "${text}" - ${errMsg.substring(0, 50)}`)
    }
  }
}
