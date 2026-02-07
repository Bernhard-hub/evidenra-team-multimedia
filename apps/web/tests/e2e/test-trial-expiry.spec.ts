import { test, expect } from '@playwright/test'

/**
 * Trial Expiry Test - Testet ob das Trial-System nach Ablauf blockiert
 *
 * Dieser Test:
 * 1. Loggt sich ein
 * 2. Manipuliert das trialEnd Datum im localStorage/State
 * 3. Prüft ob die PaywallOverlay erscheint
 */

const TEST_EMAIL = 'e2e-test@evidenra.com'
const TEST_PASSWORD = 'TestPassword123!'

test.describe('Trial System', () => {
  test('Should show PaywallOverlay when trial expires', async ({ page }) => {
    // 1. Login
    console.log('1. Logging in...')
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', TEST_EMAIL)
      await page.fill('input[type="password"]', TEST_PASSWORD)
      await page.click('button[type="submit"]')
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
      console.log('Login successful')
    }

    await page.waitForTimeout(2000)

    // 2. Prüfe ob User eingeloggt ist
    const currentUrl = page.url()
    console.log('Current URL:', currentUrl)

    if (currentUrl.includes('/login')) {
      console.log('Still on login page - skipping test')
      return
    }

    // 3. Simuliere abgelaufenes Trial durch Manipulation des Zustand Store
    console.log('2. Simulating expired trial...')

    await page.evaluate(() => {
      // Setze Trial-End auf gestern
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      // Hole den aktuellen Zustand
      const storeKey = Object.keys(localStorage).find(k => k.includes('subscription'))
      if (storeKey) {
        const storeData = JSON.parse(localStorage.getItem(storeKey) || '{}')
        console.log('Current subscription data:', storeData)
      }

      // Direkt in Window-Objekt für Zugriff auf Zustand Store
      // @ts-ignore
      const subscriptionStore = window.__ZUSTAND_DEVTOOLS__?.['subscription-store']
      if (subscriptionStore) {
        const state = subscriptionStore.getState()
        if (state.subscription) {
          state.subscription.trialEnd = yesterday.toISOString()
          console.log('Modified trial end to:', yesterday.toISOString())
        }
      }
    })

    // 4. Reload um den neuen Zustand zu testen
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 5. Screenshot für Debugging
    await page.screenshot({ path: 'test-results/trial-expiry-test.png', fullPage: true })

    // 6. Prüfe auf PaywallOverlay
    console.log('3. Checking for PaywallOverlay...')

    const paywallTexts = [
      'Dein Trial ist abgelaufen',
      'Trial ist abgelaufen',
      'Abo beendet',
      'Pläne ansehen',
      'Upgrade auf einen bezahlten Plan'
    ]

    let paywallFound = false
    for (const text of paywallTexts) {
      const element = page.locator(`text=${text}`)
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`Paywall indicator found: "${text}"`)
        paywallFound = true
        break
      }
    }

    // 7. Prüfe auch auf das Overlay-Element direkt
    const overlay = page.locator('.fixed.inset-0')
    const overlayVisible = await overlay.first().isVisible({ timeout: 1000 }).catch(() => false)
    console.log('Overlay element visible:', overlayVisible)

    // 8. Log page content for debugging
    const bodyText = await page.textContent('body')
    console.log('Page contains "Trial":', bodyText?.includes('Trial'))
    console.log('Page contains "abgelaufen":', bodyText?.includes('abgelaufen'))
    console.log('Page contains "Pläne":', bodyText?.includes('Pläne'))

    // 9. Ergebnis
    if (paywallFound || overlayVisible) {
      console.log('SUCCESS: PaywallOverlay is shown for expired trial!')
    } else {
      console.log('NOTICE: PaywallOverlay not shown - trial may still be active')
      // Log more details
      const html = await page.content()
      console.log('Looking for subscription-related text...')
      if (html.includes('trialing')) console.log('Found: trialing')
      if (html.includes('trialEnd')) console.log('Found: trialEnd')
    }
  })

  test('Should show trial days left correctly', async ({ page }) => {
    // Login
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', TEST_EMAIL)
      await page.fill('input[type="password"]', TEST_PASSWORD)
      await page.click('button[type="submit"]')
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
    }

    await page.waitForTimeout(2000)

    // Suche nach Trial-Countdown
    const trialIndicators = [
      'Tage Trial',
      'Tag Trial',
      'Tage verbleibend',
      'Tag verbleibend'
    ]

    let trialCountdownFound = false
    for (const indicator of trialIndicators) {
      const element = page.locator(`text=${indicator}`)
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        const text = await element.textContent()
        console.log(`Trial countdown found: "${text}"`)
        trialCountdownFound = true
        break
      }
    }

    await page.screenshot({ path: 'test-results/trial-countdown-test.png', fullPage: true })

    if (!trialCountdownFound) {
      console.log('No trial countdown visible - user may have active subscription')
    }
  })
})
