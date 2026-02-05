import { Page, expect } from '@playwright/test'

/**
 * Test Helpers for EVIDENRA E2E Tests
 */

// Test user credentials (use environment variables in CI)
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@evidenra.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
}

/**
 * Error collector - collects all JS errors during test
 */
export class ErrorCollector {
  errors: string[] = []
  warnings: string[] = []

  attach(page: Page) {
    page.on('pageerror', (error) => {
      this.errors.push(error.message)
      console.error('🔴 Page Error:', error.message)
    })

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.errors.push(msg.text())
      }
      if (msg.type() === 'warning') {
        this.warnings.push(msg.text())
      }
    })
  }

  expectNoErrors() {
    expect(this.errors, `Expected no JS errors but found: ${this.errors.join(', ')}`).toHaveLength(0)
  }

  clear() {
    this.errors = []
    this.warnings = []
  }
}

/**
 * Login helper
 */
export async function login(page: Page, email?: string, password?: string) {
  await page.goto('/login')

  // Wait for login form
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })

  await page.fill('input[type="email"]', email || TEST_USER.email)
  await page.fill('input[type="password"]', password || TEST_USER.password)
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await page.waitForURL(/\/(dashboard|projects)/, { timeout: 15000 })
}

/**
 * Navigate to a project
 */
export async function navigateToProject(page: Page, projectName?: string) {
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')

  // Click on first project or specific project
  if (projectName) {
    await page.click(`text=${projectName}`)
  } else {
    // Click first project card
    const projectCard = page.locator('[data-testid="project-card"]').first()
    if (await projectCard.isVisible()) {
      await projectCard.click()
    } else {
      // Try clicking any project link
      const projectLink = page.locator('a[href*="/projects/"]').first()
      await projectLink.click()
    }
  }

  await page.waitForURL(/\/projects\//, { timeout: 10000 })
}

/**
 * Wait for page to be fully loaded (no pending requests)
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle')
  // Additional wait for React to finish rendering
  await page.waitForTimeout(500)
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await page.screenshot({ path: `tests/screenshots/${name}-${timestamp}.png`, fullPage: true })
}

/**
 * Check if element exists without failing
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 3000 })
    return true
  } catch {
    return false
  }
}
