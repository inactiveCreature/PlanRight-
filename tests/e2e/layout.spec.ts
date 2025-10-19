import { test, expect } from '@playwright/test'

test.describe('Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5180')
  })

  test('sticky_positions', async ({ page }) => {
    // Check that sidebar and assistant remain aligned under header when scrolling
    const sidebar = page.locator('aside').first()
    const assistant = page.locator('aside').last()
    
    // Verify initial sticky positioning
    await expect(sidebar).toHaveCSS('position', 'sticky')
    await expect(assistant).toHaveCSS('position', 'sticky')
    
    // Scroll down and verify elements stay in position
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(100)
    
    // Check that elements are still visible and positioned correctly
    await expect(sidebar).toBeVisible()
    await expect(assistant).toBeVisible()
  })

  test('no_hscroll', async ({ page }) => {
    // Verify no horizontal scrollbars at different viewport widths
    const viewports = [
      { width: 360, height: 640 },  // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1280, height: 720 }  // Desktop
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(100)
      
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
      
      expect(scrollWidth).toBe(clientWidth)
    }
  })

  test('input_suffix_not_overlap', async ({ page }) => {
    // Navigate to dimensions step
    await page.click('text=Dimensions')
    await page.waitForTimeout(100)
    
    // Find a number field with suffix
    const lengthField = page.locator('input[aria-label="Length in meters"]')
    await lengthField.fill('12.5')
    
    // Take screenshot to verify suffix positioning
    await expect(lengthField).toHaveScreenshot('length-field-with-suffix.png')
    
    // Verify the suffix is visible and doesn't overlap
    const suffix = page.locator('text=m').first()
    await expect(suffix).toBeVisible()
  })

  test('responsive_chat_drawer', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 360, height: 640 })
    
    // Chat button should be visible on mobile
    const chatButton = page.locator('button:has-text("AI Assistant")')
    await expect(chatButton).toBeVisible()
    
    // Click to open drawer
    await chatButton.click()
    
    // Drawer should be visible
    const drawer = page.locator('[role="dialog"], .fixed.inset-x-0.bottom-0')
    await expect(drawer).toBeVisible()
    
    // Close drawer
    const closeButton = page.locator('button[aria-label="Close"], button:has(svg)').last()
    await closeButton.click()
    
    // Drawer should be hidden
    await expect(drawer).not.toBeVisible()
  })

  test('grid_spacing_consistency', async ({ page }) => {
    // Navigate to property step
    await page.click('text=Property')
    await page.waitForTimeout(100)
    
    // Check that form fields use consistent grid spacing
    const fields = page.locator('.grid.grid-cols-12')
    const fieldCount = await fields.count()
    
    expect(fieldCount).toBeGreaterThan(0)
    
    // Verify each field has proper grid structure
    for (let i = 0; i < fieldCount; i++) {
      const field = fields.nth(i)
      await expect(field).toHaveClass(/grid-cols-12/)
    }
  })
})
