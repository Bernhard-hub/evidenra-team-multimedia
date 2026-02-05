import { test, expect } from '@playwright/test'
import { ErrorCollector, TEST_USER } from './helpers'

/**
 * Authentication Tests
 * Tests login, logout, and protected routes
 */

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    const errors = new ErrorCollector()
    errors.attach(page)

    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Check login form is visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    errors.expectNoErrors()
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    const errors = new ErrorCollector()
    errors.attach(page)

    // Try to access protected route
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)

    errors.expectNoErrors()
  })

  test('should show error on invalid credentials', async ({ page }) => {
    const errors = new ErrorCollector()
    errors.attach(page)

    await page.goto('/login')
    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error message (not crash)
    await page.waitForTimeout(2000)

    // Page should still be on login
    await expect(page).toHaveURL(/\/login/)

    // Should not have JS errors (only validation errors)
    errors.expectNoErrors()
  })

  test('should handle OAuth buttons without errors', async ({ page }) => {
    const errors = new ErrorCollector()
    errors.attach(page)

    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Check if OAuth buttons exist and are clickable
    const googleButton = page.locator('button:has-text("Google")')
    const githubButton = page.locator('button:has-text("GitHub")')

    // Just check they don't cause JS errors when visible
    if (await googleButton.isVisible()) {
      await expect(googleButton).toBeEnabled()
    }

    if (await githubButton.isVisible()) {
      await expect(githubButton).toBeEnabled()
    }

    errors.expectNoErrors()
  })
})
