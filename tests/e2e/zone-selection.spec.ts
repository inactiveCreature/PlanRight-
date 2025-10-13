import { test, expect } from '@playwright/test'

test.describe('Zone Selection E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5180')
  })

  test('zone_select_dropdown_works', async ({ page }) => {
    // Navigate to Property step
    await page.click('text=Property')
    await page.waitForTimeout(100)
    
    // Find the zone select field
    const zoneSelect = page.locator('#zone-select')
    await expect(zoneSelect).toBeVisible()
    
    // Click to open dropdown
    await zoneSelect.click()
    
    // Check that dropdown options are visible
    const r1Option = page.locator('text=R1 — General Residential')
    const r2Option = page.locator('text=R2 — Low Density Residential')
    const r3Option = page.locator('text=R3 — Medium Density Residential')
    
    await expect(r1Option).toBeVisible()
    await expect(r2Option).toBeVisible()
    await expect(r3Option).toBeVisible()
    
    // Select R3 option
    await r3Option.click()
    
    // Verify selection
    await expect(zoneSelect).toContainText('R3 — Medium Density Residential')
    
    // Verify Next button is enabled (step should be complete)
    const nextButton = page.locator('button:has-text("Next")')
    await expect(nextButton).not.toBeDisabled()
  })

  test('keyboard_navigation_works', async ({ page }) => {
    // Navigate to Property step
    await page.click('text=Property')
    await page.waitForTimeout(100)
    
    // Focus the zone select field
    const zoneSelect = page.locator('#zone-select')
    await zoneSelect.focus()
    
    // Press ArrowDown to open dropdown
    await page.keyboard.press('ArrowDown')
    
    // Check that dropdown is open
    const r1Option = page.locator('text=R1 — General Residential')
    await expect(r1Option).toBeVisible()
    
    // Press ArrowDown again to highlight next option
    await page.keyboard.press('ArrowDown')
    
    // Press Enter to select
    await page.keyboard.press('Enter')
    
    // Verify R2 is selected (since R1 was default, ArrowDown would select R2)
    await expect(zoneSelect).toContainText('R2 — Low Density Residential')
  })

  test('step_badge_updates_on_zone_selection', async ({ page }) => {
    // Navigate to Property step
    await page.click('text=Property')
    await page.waitForTimeout(100)
    
    // Initially, step should show as incomplete (number badge)
    const propertyStepBadge = page.locator('[data-step-id="property"]')
    await expect(propertyStepBadge).toContainText('2') // Step number, not checkmark
    
    // Select a zone
    const zoneSelect = page.locator('#zone-select')
    await zoneSelect.click()
    
    const r2Option = page.locator('text=R2 — Low Density Residential')
    await r2Option.click()
    
    // Fill other required fields to make step complete
    const lotSizeField = page.locator('input[placeholder*="m²"]').first()
    await lotSizeField.fill('500')
    
    const frontageField = page.locator('input[placeholder*="m"]').first()
    await frontageField.fill('15')
    
    // Step badge should now show as complete (checkmark)
    await expect(propertyStepBadge).toContainText('✓')
  })

  test('zone_selection_clears_error_styling', async ({ page }) => {
    // Navigate to Property step
    await page.click('text=Property')
    await page.waitForTimeout(100)
    
    // Try to go to next step without selecting zone
    const nextButton = page.locator('button:has-text("Next")')
    await nextButton.click()
    
    // Should show error styling on zone field
    const zoneSelect = page.locator('#zone-select')
    await expect(zoneSelect).toHaveClass(/border-red/)
    
    // Now select a zone
    await zoneSelect.click()
    const r1Option = page.locator('text=R1 — General Residential')
    await r1Option.click()
    
    // Error styling should be cleared
    await expect(zoneSelect).not.toHaveClass(/border-red/)
    await expect(zoneSelect).toHaveClass(/border-neutral/)
  })

  test('zone_dependent_hints_update', async ({ page }) => {
    // Complete Property step with R1 zone
    await page.click('text=Property')
    await page.waitForTimeout(100)
    
    const zoneSelect = page.locator('#zone-select')
    await zoneSelect.click()
    const r1Option = page.locator('text=R1 — General Residential')
    await r1Option.click()
    
    // Fill other required fields
    const lotSizeField = page.locator('input[placeholder*="m²"]').first()
    await lotSizeField.fill('500')
    
    const frontageField = page.locator('input[placeholder*="m"]').first()
    await frontageField.fill('15')
    
    // Go to Location step
    await page.click('button:has-text("Next")')
    await page.waitForTimeout(100)
    
    // Check that front setback hint shows R1-specific minimum
    const frontSetbackHint = page.locator('text=Minimum: 5.0 m')
    await expect(frontSetbackHint).toBeVisible()
    
    // Go back to Property step and change zone
    await page.click('text=Property')
    await page.waitForTimeout(100)
    
    await zoneSelect.click()
    const r3Option = page.locator('text=R3 — Medium Density Residential')
    await r3Option.click()
    
    // Go back to Location step
    await page.click('button:has-text("Next")')
    await page.waitForTimeout(100)
    
    // Hint should still show the same minimum (since thresholds are the same for R1/R2/R3)
    await expect(frontSetbackHint).toBeVisible()
  })

  test('chat_zone_command_integration', async ({ page }) => {
    // Open assistant drawer
    await page.click('button:has-text("Assistant")')
    await page.waitForTimeout(100)
    
    // Send zone command
    const chatInput = page.locator('textarea[placeholder*="message"]')
    await chatInput.fill('Zone R2')
    await page.keyboard.press('Enter')
    
    // Wait for response
    await page.waitForTimeout(2000)
    
    // Navigate to Property step to verify zone was set
    await page.click('text=Property')
    await page.waitForTimeout(100)
    
    // Check that R2 is selected
    const zoneSelect = page.locator('#zone-select')
    await expect(zoneSelect).toContainText('R2 — Low Density Residential')
  })
})
