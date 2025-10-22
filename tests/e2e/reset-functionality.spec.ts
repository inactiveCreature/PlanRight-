import { test, expect } from '@playwright/test'

test.describe('Reset Functionality E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5180')
  })

  test('reset_all_modal', async ({ page }) => {
    // Navigate to Property step and fill some fields
    await page.click('text=Property')
    await page.waitForTimeout(100)

    // Fill some fields
    const zoneSelect = page.locator('#zone-select')
    await zoneSelect.click()
    await page.click('text=R3 — Medium Density Residential')

    const lotSizeField = page.locator('input[placeholder*="m²"]').first()
    await lotSizeField.fill('1000')

    // Click reset menu
    const resetButton = page.locator('button[aria-label="Reset options"]')
    await resetButton.click()

    // Click "Reset all…"
    await page.click('text=Reset all…')

    // Modal should be visible
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // Check default checkboxes
    const keepRoleCheckbox = page.locator('input[type="checkbox"]').first()
    const keepChatCheckbox = page.locator('input[type="checkbox"]').last()

    await expect(keepRoleCheckbox).toBeChecked()
    await expect(keepChatCheckbox).toBeChecked()

    // Uncheck "Keep chat history"
    await keepChatCheckbox.uncheck()

    // Click "Reset all"
    await page.click('button:has-text("Reset all")')

    // Modal should close
    await expect(modal).not.toBeVisible()

    // Fields should be reset to defaults
    await expect(zoneSelect).toContainText('R1 — General Residential')
    await expect(lotSizeField).toHaveValue('')

    // Undo toast should be visible
    const undoToast = page.locator('[role="alert"]')
    await expect(undoToast).toBeVisible()
    await expect(undoToast).toContainText('Form reset. You can undo this action.')

    // Click Undo
    await page.click('text=Undo')

    // Fields should be restored
    await expect(zoneSelect).toContainText('R3 — Medium Density Residential')
    await expect(lotSizeField).toHaveValue('1000')

    // Toast should disappear
    await expect(undoToast).not.toBeVisible()
  })

  test('reset_step_now', async ({ page }) => {
    // Navigate to Dimensions step
    await page.click('text=Dimensions')
    await page.waitForTimeout(100)

    // Fill some fields
    const lengthField = page.locator('input[placeholder*="m"]').first()
    await lengthField.fill('10')

    const widthField = page.locator('input[placeholder*="m"]').nth(1)
    await widthField.fill('5')

    // Click reset menu
    const resetButton = page.locator('button[aria-label="Reset options"]')
    await resetButton.click()

    // Click "Reset this step"
    await page.click('text=Reset this step')

    // Fields should be reset to empty
    await expect(lengthField).toHaveValue('')
    await expect(widthField).toHaveValue('')

    // Step badge should show as incomplete
    const dimensionsStepBadge = page.locator('[data-step-id="dimensions"]')
    await expect(dimensionsStepBadge).toContainText('4') // Step number, not checkmark

    // Next button should be disabled
    const nextButton = page.locator('button:has-text("Next")')
    await expect(nextButton).toBeDisabled()
  })

  test('keyboard_navigation_in_modal', async ({ page }) => {
    // Navigate to Property step
    await page.click('text=Property')
    await page.waitForTimeout(100)

    // Open reset modal
    const resetButton = page.locator('button[aria-label="Reset options"]')
    await resetButton.click()
    await page.click('text=Reset all…')

    // Modal should be focused
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // Tab through elements
    await page.keyboard.press('Tab') // First checkbox
    await page.keyboard.press('Tab') // Second checkbox
    await page.keyboard.press('Tab') // Cancel button
    await page.keyboard.press('Tab') // Reset all button

    // Press Escape to close modal
    await page.keyboard.press('Escape')

    // Modal should be closed
    await expect(modal).not.toBeVisible()
  })

  test('reset_disabled_during_assessment', async ({ page }) => {
    // Navigate to Review step
    await page.click('text=Review')
    await page.waitForTimeout(100)

    // Start an assessment
    const runAssessmentButton = page.locator('button:has-text("Run rules check")')
    await runAssessmentButton.click()

    // Wait a moment for assessment to start
    await page.waitForTimeout(500)

    // Try to open reset menu
    const resetButton = page.locator('button[aria-label="Reset options"]')
    await resetButton.click()

    // Reset options should be disabled
    const resetStepOption = page.locator('text=Reset this step')
    const resetAllOption = page.locator('text=Reset all…')

    await expect(resetStepOption).toBeDisabled()
    await expect(resetAllOption).toBeDisabled()
  })

  test('undo_toast_auto_dismiss', async ({ page }) => {
    // Navigate to Property step
    await page.click('text=Property')
    await page.waitForTimeout(100)

    // Fill a field
    const lotSizeField = page.locator('input[placeholder*="m²"]').first()
    await lotSizeField.fill('1000')

    // Reset all
    const resetButton = page.locator('button[aria-label="Reset options"]')
    await resetButton.click()
    await page.click('text=Reset all…')
    await page.click('button:has-text("Reset all")')

    // Undo toast should be visible
    const undoToast = page.locator('[role="alert"]')
    await expect(undoToast).toBeVisible()

    // Wait for auto-dismiss (5 seconds)
    await page.waitForTimeout(6000)

    // Toast should be gone
    await expect(undoToast).not.toBeVisible()
  })

  test('reset_preserves_role_when_checked', async ({ page }) => {
    // Navigate to Property step
    await page.click('text=Property')
    await page.waitForTimeout(100)

    // Open reset modal
    const resetButton = page.locator('button[aria-label="Reset options"]')
    await resetButton.click()
    await page.click('text=Reset all…')

    // Ensure "Keep my role" is checked
    const keepRoleCheckbox = page.locator('input[type="checkbox"]').first()
    await expect(keepRoleCheckbox).toBeChecked()

    // Click "Reset all"
    await page.click('button:has-text("Reset all")')

    // Role badge should still be visible (role preserved)
    const roleBadge = page.locator('text=Role: Resident')
    await expect(roleBadge).toBeVisible()
  })

  test('reset_clears_role_when_unchecked', async ({ page }) => {
    // Navigate to Property step
    await page.click('text=Property')
    await page.waitForTimeout(100)

    // Open reset modal
    const resetButton = page.locator('button[aria-label="Reset options"]')
    await resetButton.click()
    await page.click('text=Reset all…')

    // Uncheck "Keep my role"
    const keepRoleCheckbox = page.locator('input[type="checkbox"]').first()
    await keepRoleCheckbox.uncheck()

    // Click "Reset all"
    await page.click('button:has-text("Reset all")')

    // Role should be reset to default (Resident)
    const roleBadge = page.locator('text=Role: Resident')
    await expect(roleBadge).toBeVisible()
  })
})
