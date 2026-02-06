import { test as setup } from '@playwright/test'

/**
 * Authentication Setup for Playwright Tests
 *
 * Run this first to save auth state:
 * npx playwright test auth-setup.spec.ts --headed --timeout=360000
 *
 * Then run other tests with saved auth:
 * npx playwright test click-everything.spec.ts --headed
 */

const AUTH_FILE = 'playwright/.auth/user.json'

setup.setTimeout(360000) // 6 minutes

setup('Authenticate and save session', async ({ page }) => {
  console.log('\n🔐 Starting authentication setup...')
  console.log('Please log in manually in the browser window.')
  console.log('The test will wait for you to complete login.\n')

  // Go to login page
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Wait for user to complete login manually (max 5 minutes)
  console.log('⏳ Waiting for login... (max 5 minutes)')
  console.log('   After logging in, wait until you see the Dashboard.')

  try {
    // Wait for dashboard to appear (indicates successful login)
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 300000, // 5 minutes
    })

    console.log('\n✅ Login detected! Saving authentication state...')

    // Save auth state
    await page.context().storageState({ path: AUTH_FILE })

    console.log(`✅ Auth state saved to: ${AUTH_FILE}`)
    console.log('\n📋 Next steps:')
    console.log('   1. Run tests with: npx playwright test click-everything.spec.ts --headed')
    console.log('   2. Tests will use your saved session automatically\n')

  } catch (err) {
    console.log('\n❌ Login timeout. Please try again.')
    throw err
  }
})
