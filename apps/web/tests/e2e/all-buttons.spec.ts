import { test, expect, Page } from '@playwright/test'

/**
 * COMPREHENSIVE BUTTON TEST
 * Klickt auf JEDEN Button auf jeder Seite und meldet JS-Fehler
 *
 * Ausführen mit: npx playwright test all-buttons.spec.ts --headed
 */

const errors: string[] = []
const clickedElements: string[] = []
const skippedElements: string[] = []

// Buttons die nicht geklickt werden sollen (gefährliche Aktionen)
const SKIP_PATTERNS = [
  'Löschen',
  'Delete',
  'Entfernen',
  'Remove',
  'Abmelden',
  'Logout',
  'Sign out',
  'Konto löschen',
  'Account löschen',
]

test.describe('Comprehensive Button Click Test', () => {
  test.beforeEach(async ({ page }) => {
    // Error listeners
    page.on('pageerror', (err) => {
      errors.push(`🔴 JS ERROR: ${err.message}`)
      console.error('🔴 JS ERROR:', err.message)
    })

    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        const text = msg.text().substring(0, 300)
        if (!text.includes('net::ERR_') && !text.includes('Failed to load resource')) {
          errors.push(`⚠️ Console Error: ${text}`)
        }
      }
    })
  })

  test('Click all buttons on Dashboard', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check if logged in
    if (page.url().includes('/login')) {
      console.log('⚠️ Not logged in - skipping authenticated tests')
      return
    }

    console.log('\n📍 Testing: Dashboard')
    await clickAllButtons(page)
    await clickAllTabs(page)
  })

  test('Click all buttons on Project Page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    if (page.url().includes('/login')) {
      console.log('⚠️ Not logged in - skipping')
      return
    }

    // Navigate to first project
    const projectLink = page.locator('a[href*="/project/"]').first()
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      console.log('\n📍 Testing: Project Page')

      // Test main tabs
      const mainTabs = ['Dokumente', 'Codes', 'Memos', 'Paraphrasen', 'Team', 'Analyse', 'Qualität']
      for (const tab of mainTabs) {
        await safeClick(page, `button:has-text("${tab}")`, `Main Tab: ${tab}`)
        await page.waitForTimeout(500)
        await clickAllButtons(page)
      }
    }
  })

  test('Click all Analysis sub-tabs including AKIH', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    if (page.url().includes('/login')) {
      console.log('⚠️ Not logged in - skipping')
      return
    }

    // Navigate to first project
    const projectLink = page.locator('a[href*="/project/"]').first()
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Go to Analyse tab
      await safeClick(page, 'button:has-text("Analyse")', 'Analyse Tab')
      await page.waitForTimeout(1000)

      console.log('\n📍 Testing: Analysis Sub-Tabs')

      // Test all analysis sub-tabs
      const analysisTabs = [
        'Code-Häufigkeit',
        'Ko-Okkurrenz',
        'Code-Dokument',
        'Netzwerk',
        'Trends',
        'Zeitverlauf',
        'Methoden',
        'IRR',
        'AKIH'
      ]

      for (const tab of analysisTabs) {
        console.log(`  Testing sub-tab: ${tab}`)
        await safeClick(page, `button:has-text("${tab}")`, `Analysis Sub-Tab: ${tab}`)
        await page.waitForTimeout(800)

        // Click all buttons within this tab
        await clickAllButtons(page)

        // Take screenshot for verification
        await page.screenshot({ path: `test-results/analysis-${tab.replace(/\s/g, '-')}.png` })
      }
    }
  })

  test('Click all buttons on Questionnaire Module', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    if (page.url().includes('/login')) {
      console.log('⚠️ Not logged in - skipping')
      return
    }

    // Navigate to questionnaire
    await page.goto('/questionnaire')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    console.log('\n📍 Testing: Questionnaire Module')

    // Test main questionnaire tabs
    const questionnaireTabs = [
      'Skalen-Browser',
      'Arbeitsbereich',
      'Qualität',
      'Validierung',
      'Bericht'
    ]

    for (const tab of questionnaireTabs) {
      await safeClick(page, `button:has-text("${tab}")`, `Questionnaire Tab: ${tab}`)
      await page.waitForTimeout(500)
      await clickAllButtons(page)
    }

    // Test "Skala adaptieren" button specifically (was a bug)
    console.log('\n📍 Testing: Skala adaptieren (Bug Test)')
    await safeClick(page, 'button:has-text("Skalen-Browser")', 'Back to Skalen-Browser')
    await page.waitForTimeout(500)

    // Click on first scale
    await safeClick(page, '[class*="scale-item"]', 'First Scale')
    await page.waitForTimeout(500)

    // Now click Skala adaptieren
    await safeClick(page, 'button:has-text("Skala adaptieren")', 'Skala adaptieren')
    await page.waitForTimeout(1000)
  })

  test('Click all buttons on Settings Page', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    if (page.url().includes('/login')) {
      console.log('⚠️ Not logged in - skipping')
      return
    }

    console.log('\n📍 Testing: Settings Page')
    await clickAllButtons(page)
    await clickAllTabs(page)
  })

  test('Test NEXUS AI Chat', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    if (page.url().includes('/login')) {
      console.log('⚠️ Not logged in - skipping')
      return
    }

    // Navigate to first project
    const projectLink = page.locator('a[href*="/project/"]').first()
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      console.log('\n📍 Testing: NEXUS AI')

      // Open NEXUS
      await safeClick(page, 'button:has-text("NEXUS AI")', 'Open NEXUS')
      await page.waitForTimeout(1000)

      // Check if NEXUS panel is visible
      const nexusPanel = page.locator('[class*="nexus"]').first()
      if (await nexusPanel.isVisible({ timeout: 3000 })) {
        console.log('  ✅ NEXUS panel opened')

        // Click all buttons in NEXUS
        await clickAllButtons(page)

        // Close NEXUS
        await safeClick(page, 'button[aria-label*="close"], button:has-text("×")', 'Close NEXUS')
      }
    }
  })

  test.afterAll(() => {
    // Print summary
    console.log('\n' + '='.repeat(70))
    console.log('📊 COMPREHENSIVE BUTTON TEST SUMMARY')
    console.log('='.repeat(70))
    console.log(`✅ Clicked: ${clickedElements.length} elements`)
    console.log(`⏭️ Skipped: ${skippedElements.length} elements`)

    if (errors.length > 0) {
      console.log(`\n❌ ERRORS FOUND: ${errors.length}`)
      errors.forEach(err => console.log(`  ${err}`))
    } else {
      console.log('\n✅ NO JAVASCRIPT ERRORS FOUND!')
    }

    // Fail if there are errors
    expect(errors, `Found ${errors.length} errors:\n${errors.join('\n')}`).toHaveLength(0)
  })
})

// Helper: Click all visible buttons on the page
async function clickAllButtons(page: Page) {
  const buttons = await page.locator('button:visible').all()

  for (const button of buttons) {
    try {
      const text = await button.textContent() || ''
      const ariaLabel = await button.getAttribute('aria-label') || ''
      const name = text.trim() || ariaLabel || 'Unnamed Button'

      // Skip dangerous buttons
      if (SKIP_PATTERNS.some(pattern => name.toLowerCase().includes(pattern.toLowerCase()))) {
        skippedElements.push(`Skipped (dangerous): ${name}`)
        continue
      }

      // Skip if already clicked
      if (clickedElements.includes(name)) {
        continue
      }

      if (await button.isVisible() && await button.isEnabled()) {
        await button.click({ timeout: 2000 })
        clickedElements.push(name)
        console.log(`    ✅ Clicked: ${name.substring(0, 50)}`)
        await page.waitForTimeout(200)

        // Close any modals that might have opened
        await closeModals(page)
      }
    } catch {
      // Button not clickable - continue
    }
  }
}

// Helper: Click all visible tabs
async function clickAllTabs(page: Page) {
  const tabs = await page.locator('[role="tab"]:visible, [class*="tab"]:visible').all()

  for (const tab of tabs) {
    try {
      const text = await tab.textContent() || ''
      const name = `Tab: ${text.trim()}`

      if (clickedElements.includes(name)) continue

      if (await tab.isVisible()) {
        await tab.click({ timeout: 2000 })
        clickedElements.push(name)
        console.log(`    ✅ ${name}`)
        await page.waitForTimeout(300)
      }
    } catch {
      // Tab not clickable
    }
  }
}

// Helper: Close any open modals
async function closeModals(page: Page) {
  try {
    const closeButtons = page.locator('button:has-text("Abbrechen"), button:has-text("Cancel"), button:has-text("Schließen"), button:has-text("Close"), button[aria-label="Close"]')
    const count = await closeButtons.count()

    for (let i = 0; i < count; i++) {
      const btn = closeButtons.nth(i)
      if (await btn.isVisible({ timeout: 500 })) {
        await btn.click()
        await page.waitForTimeout(200)
      }
    }
  } catch {
    // No modals to close
  }
}

// Helper: Safe click (doesn't fail if element not found)
async function safeClick(page: Page, selector: string, name: string) {
  try {
    const element = page.locator(selector).first()
    if (await element.isVisible({ timeout: 3000 })) {
      await element.click()
      clickedElements.push(name)
      console.log(`  ✅ Clicked: ${name}`)
      await page.waitForTimeout(300)
      return true
    }
  } catch {
    console.log(`  ⏭️ Not found: ${name}`)
  }
  return false
}
