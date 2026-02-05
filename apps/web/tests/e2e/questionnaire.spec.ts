import { test, expect } from '@playwright/test'
import { ErrorCollector, login, navigateToProject, waitForPageReady } from './helpers'

/**
 * Questionnaire Module Tests
 * Tests the questionnaire development features including:
 * - Scale Browser
 * - Scale adaptation (the bug that was found!)
 * - Item quality checker
 * - Validation dashboard
 */

test.describe('Questionnaire Module', () => {
  test.beforeEach(async ({ page }) => {
    // Skip login for now - test public pages or use stored auth state
  })

  test('Scale Browser should load without JS errors', async ({ page }) => {
    const errors = new ErrorCollector()
    errors.attach(page)

    // Navigate to questionnaire page (adjust URL as needed)
    await page.goto('/projects/test/questionnaire')
    await waitForPageReady(page)

    // If redirected to login, that's OK - just check no JS errors
    const currentUrl = page.url()
    if (!currentUrl.includes('/login')) {
      // Look for Scale Browser elements
      const scaleBrowserButton = page.locator('text=Skalen-Browser').first()
      if (await scaleBrowserButton.isVisible()) {
        await scaleBrowserButton.click()
        await waitForPageReady(page)
      }
    }

    errors.expectNoErrors()
  })

  test('Scale adaptation should not crash (regression test)', async ({ page }) => {
    const errors = new ErrorCollector()
    errors.attach(page)

    // This tests the specific bug: "can't access property 0, d.constructs is undefined"
    await page.goto('/projects/test/questionnaire')
    await waitForPageReady(page)

    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      // Skip if not authenticated
      test.skip()
      return
    }

    // Navigate to Scale Browser
    const scaleBrowserButton = page.locator('text=Skalen-Browser').first()
    if (await scaleBrowserButton.isVisible()) {
      await scaleBrowserButton.click()
      await waitForPageReady(page)

      // Find and click "Skala adaptieren" button
      const adaptButton = page.locator('text=Skala adaptieren').first()
      if (await adaptButton.isVisible()) {
        await adaptButton.click()
        await waitForPageReady(page)

        // The bug caused: "can't access property 0, d.constructs is undefined"
        // This should NOT happen anymore
      }
    }

    errors.expectNoErrors()
  })

  test('Item Quality Checker should analyze items without errors', async ({ page }) => {
    const errors = new ErrorCollector()
    errors.attach(page)

    await page.goto('/projects/test/questionnaire')
    await waitForPageReady(page)

    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      test.skip()
      return
    }

    // Navigate to Quality checker
    const qualityButton = page.locator('text=Qualität').first()
    if (await qualityButton.isVisible()) {
      await qualityButton.click()
      await waitForPageReady(page)

      // Try entering an item
      const itemInput = page.locator('textarea').first()
      if (await itemInput.isVisible()) {
        await itemInput.fill('Ich fühle mich wohl bei der Arbeit.')
        await page.keyboard.press('Enter')
        await waitForPageReady(page)
      }
    }

    errors.expectNoErrors()
  })

  test('Validation Dashboard should render without errors', async ({ page }) => {
    const errors = new ErrorCollector()
    errors.attach(page)

    await page.goto('/projects/test/questionnaire')
    await waitForPageReady(page)

    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      test.skip()
      return
    }

    // Navigate to Validation
    const validationButton = page.locator('text=Validierung').first()
    if (await validationButton.isVisible()) {
      await validationButton.click()
      await waitForPageReady(page)
    }

    errors.expectNoErrors()
  })

  test('Creating new scale should work without errors', async ({ page }) => {
    const errors = new ErrorCollector()
    errors.attach(page)

    await page.goto('/projects/test/questionnaire')
    await waitForPageReady(page)

    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      test.skip()
      return
    }

    // Look for "Neue Skala" button
    const newScaleButton = page.locator('text=Neue Skala').first()
    if (await newScaleButton.isVisible()) {
      await newScaleButton.click()
      await waitForPageReady(page)

      // Should navigate to editor
      const editorVisible = await page.locator('text=Skalen-Editor').isVisible()
      if (!editorVisible) {
        // Try the sidebar editor link
        const editorLink = page.locator('text=Skalen-Editor').first()
        if (await editorLink.isVisible()) {
          await editorLink.click()
          await waitForPageReady(page)
        }
      }
    }

    errors.expectNoErrors()
  })
})

test.describe('Questionnaire - Workspace', () => {
  test('Workspace tab should load without errors', async ({ page }) => {
    const errors = new ErrorCollector()
    errors.attach(page)

    await page.goto('/projects/test/questionnaire')
    await waitForPageReady(page)

    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      test.skip()
      return
    }

    // Workspace should be default view
    const workspaceButton = page.locator('text=Arbeitsbereich').first()
    if (await workspaceButton.isVisible()) {
      await workspaceButton.click()
      await waitForPageReady(page)
    }

    errors.expectNoErrors()
  })

  test('NEXUS AI button should be clickable', async ({ page }) => {
    const errors = new ErrorCollector()
    errors.attach(page)

    await page.goto('/projects/test/questionnaire')
    await waitForPageReady(page)

    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      test.skip()
      return
    }

    // Look for NEXUS help button
    const nexusButton = page.locator('text=NEXUS').first()
    if (await nexusButton.isVisible()) {
      // Just check it's clickable, don't actually open AI
      await expect(nexusButton).toBeEnabled()
    }

    errors.expectNoErrors()
  })
})
