import { test, expect } from '@playwright/test'

/**
 * AKIH Test - Testet den AKIH Tab auf Production
 */

const TEST_EMAIL = 'e2e-test@evidenra.com'
const TEST_PASSWORD = 'TestPassword123!'

test('AKIH Tab Test', async ({ page }) => {
  const errors: string[] = []

  // Error listener
  page.on('pageerror', (err) => {
    errors.push(`JS ERROR: ${err.message}`)
    console.error('🔴 JS ERROR:', err.message)
  })

  // 1. Login
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

  // 2. Navigate to first project
  console.log('📁 Opening project...')
  const projectLink = page.locator('a[href*="/project/"]').first()
  await projectLink.waitFor({ timeout: 10000 })
  await projectLink.click()
  await page.waitForLoadState('networkidle')
  console.log('✅ Project opened:', page.url())

  // 3. Click on Analyse tab
  console.log('📊 Clicking Analyse tab...')
  const analyseTab = page.locator('button:has-text("Analyse")')
  await analyseTab.waitFor({ timeout: 5000 })
  await analyseTab.click()
  await page.waitForTimeout(1000)
  console.log('✅ Analyse tab clicked')

  // 4. Look for AKIH tab
  console.log('🔍 Looking for AKIH tab...')

  // Take screenshot before
  await page.screenshot({ path: 'test-results/akih-before.png', fullPage: true })

  // Try to find AKIH button
  const akihTab = page.locator('button:has-text("AKIH")')
  const isVisible = await akihTab.isVisible({ timeout: 5000 }).catch(() => false)

  if (isVisible) {
    console.log('✅ AKIH tab found!')
    await akihTab.click()
    await page.waitForTimeout(2000)
    console.log('✅ AKIH tab clicked')

    // Take screenshot of AKIH
    await page.screenshot({ path: 'test-results/akih-dashboard.png', fullPage: true })

    // Check for AKIH content
    const akihContent = page.locator('text=AKIH Score')
    const hasContent = await akihContent.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasContent) {
      console.log('✅ AKIH Dashboard content visible!')
    } else {
      console.log('⚠️ AKIH tab clicked but content not visible')
      // Check what's displayed
      const pageContent = await page.textContent('body')
      console.log('Page contains "AKIH":', pageContent?.includes('AKIH'))
      console.log('Page contains "Score":', pageContent?.includes('Score'))
    }
  } else {
    console.log('❌ AKIH tab NOT found!')

    // List all visible buttons
    const allButtons = await page.locator('button:visible').all()
    console.log(`Found ${allButtons.length} visible buttons:`)
    for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
      const text = await allButtons[i].textContent()
      console.log(`  - ${text?.trim().substring(0, 50)}`)
    }

    // Check if horizontal scrolling is needed
    const tabContainer = page.locator('.flex.border-b')
    if (await tabContainer.isVisible()) {
      const scrollWidth = await tabContainer.evaluate(el => el.scrollWidth)
      const clientWidth = await tabContainer.evaluate(el => el.clientWidth)
      console.log(`Tab container: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`)
      if (scrollWidth > clientWidth) {
        console.log('⚠️ Horizontal scrolling may be needed!')
      }
    }
  }

  // Take final screenshot
  await page.screenshot({ path: 'test-results/akih-final.png', fullPage: true })

  // Report errors
  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:')
    errors.forEach(e => console.log(`  ${e}`))
  } else {
    console.log('\n✅ NO JavaScript errors!')
  }

  expect(errors).toHaveLength(0)
})
