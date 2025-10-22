import { test, expect } from '@playwright/test'

test.describe('UI Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5180')
  })

  test('step_gating_property', async ({ page }) => {
    // Navigate to property step
    await page.click('text=Property')
    await page.waitForTimeout(100)

    // Initially Next should be disabled (zone is empty)
    const nextButton = page.locator('button:has-text("Next")')
    await expect(nextButton).toBeDisabled()

    // Check that step badge shows "todo" (number)
    const propertyStep = page.locator('button:has-text("Property")')
    await expect(propertyStep).toContainText('2') // Step number, not checkmark

    // Fill in zone field
    const zoneField = page.locator('input[placeholder="R1"]')
    await zoneField.fill('R1')

    // Next should now be enabled
    await expect(nextButton).toBeEnabled()

    // Step badge should show "Complete" (checkmark)
    await expect(propertyStep).toContainText('Complete')
  })

  test('location_front_requirement', async ({ page }) => {
    // Navigate to location step
    await page.click('text=Location')
    await page.waitForTimeout(100)

    // Initially BBL is true, so front setback should be disabled
    const frontSetbackField = page.locator('input[aria-label="Front setback in meters"]')
    await expect(frontSetbackField).toBeDisabled()

    // Toggle BBL to false
    const bblSwitch = page.locator('input[type="checkbox"]').first()
    await bblSwitch.uncheck()

    // Front setback should now be enabled and required
    await expect(frontSetbackField).toBeEnabled()

    // Clear front setback to trigger validation error
    await frontSetbackField.clear()

    // Next should be disabled
    const nextButton = page.locator('button:has-text("Next")')
    await expect(nextButton).toBeDisabled()

    // Fill front setback with valid value
    await frontSetbackField.fill('5.0')

    // Next should be enabled
    await expect(nextButton).toBeEnabled()
  })

  test('error_to_neutral_reset', async ({ page }) => {
    // Navigate to property step
    await page.click('text=Property')
    await page.waitForTimeout(100)

    // Clear zone field to trigger error
    const zoneField = page.locator('input[placeholder="R1"]')
    await zoneField.clear()

    // Field should show error styling (red border)
    await expect(zoneField).toHaveCSS('border-color', 'rgb(239, 68, 68)') // red-500

    // Fill valid value
    await zoneField.fill('R1')

    // Field should return to neutral styling
    await expect(zoneField).toHaveCSS('border-color', 'rgb(209, 213, 219)') // neutral-300
  })

  test('review_runs_assessment', async ({ page }) => {
    // Fill out all steps with valid data
    await page.click('text=Property')
    await page.fill('input[placeholder="R1"]', 'R1')
    await page.fill('input[aria-label="Lot size in square meters"]', '450')
    await page.fill('input[aria-label="Frontage in meters"]', '12')

    await page.click('button:has-text("Next")')

    // Structure step
    await page.selectOption('select', 'shed')
    await page.click('button:has-text("Next")')

    // Dimensions step
    await page.fill('input[aria-label="Length in meters"]', '3.0')
    await page.fill('input[aria-label="Width in meters"]', '2.4')
    await page.fill('input[aria-label="Height in meters"]', '2.4')
    await page.click('button:has-text("Next")')

    // Location step
    await page.click('button:has-text("Next")')

    // Siting step
    await page.click('button:has-text("Next")')

    // Context step
    await page.click('button:has-text("Next")')

    // Review step
    await page.click('text=Review')
    await page.waitForTimeout(100)

    // Run rules assessment
    const runRulesButton = page.locator('button:has-text("Run rules check")')
    await runRulesButton.click()

    // Wait for assessment to complete
    await page.waitForTimeout(1000)

    // Decision card should be visible
    const decisionCard = page.locator('[data-testid="decision-card"], .border-l-4')
    await expect(decisionCard).toBeVisible()

    // WHY bullets should have clause references
    const whyBullets = page.locator('text=/Clause/')
    const bulletCount = await whyBullets.count()
    expect(bulletCount).toBeGreaterThan(0)
  })

  test('chat_in_box', async ({ page }) => {
    // Open chat panel (desktop view)
    await page.setViewportSize({ width: 1280, height: 720 })

    // Send multiple messages to test scrolling
    const chatInput = page.locator('textarea[placeholder*="message"]')
    await chatInput.fill('Hello')
    await page.keyboard.press('Enter')

    await chatInput.fill('How does the setback requirement work?')
    await page.keyboard.press('Enter')

    await chatInput.fill('What about heritage items?')
    await page.keyboard.press('Enter')

    // Wait for messages to appear
    await page.waitForTimeout(2000)

    // Check that messages are scrolling inside the panel
    const messagesContainer = page.locator('.overflow-y-auto').first()
    await expect(messagesContainer).toBeVisible()

    // Composer should remain visible at bottom
    await expect(chatInput).toBeVisible()
  })

  test('step_navigation_validation', async ({ page }) => {
    // Try to navigate to step 3 without completing step 2
    await page.click('text=Property')

    // Clear required field
    await page.fill('input[placeholder="R1"]', '')

    // Try to click Next
    const nextButton = page.locator('button:has-text("Next")')
    await nextButton.click()

    // Error summary should appear
    const errorSummary = page.locator('text=Please complete the required fields')
    await expect(errorSummary).toBeVisible()

    // First invalid field should be focused
    const zoneField = page.locator('input[placeholder="R1"]')
    await expect(zoneField).toBeFocused()
  })

  test('conditional_front_setback_ui', async ({ page }) => {
    // Navigate to location step
    await page.click('text=Location')
    await page.waitForTimeout(100)

    // Check initial state (BBL = true)
    const frontSetbackField = page.locator('input[aria-label="Front setback in meters"]')
    const bblSwitch = page.locator('input[type="checkbox"]').first()

    // Front setback should be disabled
    await expect(frontSetbackField).toBeDisabled()

    // Toggle BBL to false
    await bblSwitch.uncheck()

    // Front setback should be enabled and show required asterisk
    await expect(frontSetbackField).toBeEnabled()

    // Check that required asterisk appears
    const frontSetbackLabel = page.locator('text=Front setback').first()
    await expect(frontSetbackLabel).toContainText('*')

    // Toggle BBL back to true
    await bblSwitch.check()

    // Front setback should be disabled again
    await expect(frontSetbackField).toBeDisabled()
  })
})
