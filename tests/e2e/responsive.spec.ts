import { test, expect } from '@playwright/test'

test.describe('Responsive Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5180')
  })

  test('single_column_compact', async ({ page }) => {
    // Set compact viewport
    await page.setViewportSize({ width: 390, height: 800 })

    // Expect one main column; stepper hidden
    const sidebar = page.locator('aside').first()
    await expect(sidebar).not.toBeVisible()

    // Steps button should be visible
    const stepsButton = page.locator('button:has-text("Steps")')
    await expect(stepsButton).toBeVisible()

    // Assistant button should be visible
    const assistantButton = page.locator('button:has-text("Assistant")')
    await expect(assistantButton).toBeVisible()

    // Main content should be full width
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
  })

  test('assistant_drawer_scrolls', async ({ page }) => {
    // Set compact viewport
    await page.setViewportSize({ width: 390, height: 800 })

    // Open assistant drawer
    const assistantButton = page.locator('button:has-text("Assistant")')
    await assistantButton.click()

    // Wait for drawer to open
    const drawer = page.locator('.fixed.inset-x-0.bottom-0')
    await expect(drawer).toBeVisible()

    // Find chat input and send multiple messages
    const chatInput = page.locator('textarea[placeholder*="message"]')

    // Send several messages to test scrolling
    for (let i = 1; i <= 5; i++) {
      await chatInput.fill(`Test message ${i}`)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500) // Wait for message to appear
    }

    // Verify messages are scrolling inside the panel
    const messagesContainer = page.locator('.overflow-y-auto').first()
    await expect(messagesContainer).toBeVisible()

    // Composer should remain visible at bottom
    await expect(chatInput).toBeVisible()
  })

  test('no_hscroll', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 360, height: 640 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1280, height: 720 }, // Desktop
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(100)

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

      expect(scrollWidth).toBe(clientWidth)
    }
  })

  test('fullscreen_toggle', async ({ page }) => {
    // Set compact viewport
    await page.setViewportSize({ width: 390, height: 800 })

    // Check if fullscreen is supported
    const isSupported = await page.evaluate(() => document.fullscreenEnabled)

    if (isSupported) {
      // Fullscreen toggle should be visible
      const fullscreenButton = page.locator('button:has-text("Enter Full Screen")')
      await expect(fullscreenButton).toBeVisible()

      // Click to enter fullscreen
      await fullscreenButton.click()

      // Wait for fullscreen to activate
      await page.waitForTimeout(1000)

      // Check if fullscreen is active
      const isFullscreen = await page.evaluate(() => !!document.fullscreenElement)
      expect(isFullscreen).toBe(true)

      // Button should now show "Exit Full Screen"
      const exitButton = page.locator('button:has-text("Exit Full Screen")')
      await expect(exitButton).toBeVisible()

      // Click to exit fullscreen
      await exitButton.click()

      // Wait for fullscreen to deactivate
      await page.waitForTimeout(1000)

      // Check if fullscreen is inactive
      const isNotFullscreen = await page.evaluate(() => !document.fullscreenElement)
      expect(isNotFullscreen).toBe(true)
    } else {
      // If not supported, button should not be visible
      const fullscreenButton = page.locator('button:has-text("Enter Full Screen")')
      await expect(fullscreenButton).not.toBeVisible()
    }
  })

  test('sidebar_drawer_functionality', async ({ page }) => {
    // Set compact viewport
    await page.setViewportSize({ width: 390, height: 800 })

    // Click Steps button to open sidebar drawer
    const stepsButton = page.locator('button:has-text("Steps")')
    await stepsButton.click()

    // Drawer should be visible
    const drawer = page.locator('.fixed.inset-y-0.left-0')
    await expect(drawer).toBeVisible()

    // Drawer should have proper width
    await expect(drawer).toHaveCSS('width', '280px')

    // Click backdrop to close drawer
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50')
    await backdrop.click()

    // Drawer should be hidden
    await expect(drawer).not.toBeVisible()
  })

  test('desktop_layout_unchanged', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })

    // Sidebar should be visible
    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible()

    // Assistant panel should be visible
    const assistantPanel = page.locator('aside').last()
    await expect(assistantPanel).toBeVisible()

    // Compact buttons should be hidden
    const stepsButton = page.locator('button:has-text("Steps")')
    await expect(stepsButton).not.toBeVisible()

    const assistantButton = page.locator('button:has-text("Assistant")')
    await expect(assistantButton).not.toBeVisible()

    // Fullscreen toggle should be hidden
    const fullscreenButton = page.locator('button:has-text("Enter Full Screen")')
    await expect(fullscreenButton).not.toBeVisible()
  })

  test('form_inputs_full_width_compact', async ({ page }) => {
    // Set compact viewport
    await page.setViewportSize({ width: 390, height: 800 })

    // Navigate to property step
    await page.click('text=Property')
    await page.waitForTimeout(100)

    // Check that form inputs are full width
    const zoneInput = page.locator('input[placeholder="R1"]')
    await expect(zoneInput).toBeVisible()

    // Input should not cause horizontal scroll
    await zoneInput.fill('R1')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

    expect(scrollWidth).toBe(clientWidth)
  })
})
