import { test, expect } from '@playwright/test'

test.describe('Step Completion Behavior', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the chat API to prevent hanging streams during e2e tests
    await page.route('**/api/chat', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ model: 'mock' })
      })
    })
    
    // Navigate to the app
    await page.goto('/')
  })

  test('Structure step shows "To do" on load and flips to "Complete" when selecting "Patio"', async ({ page }) => {
    // Navigate to Structure step
    await page.click('[data-testid="step-structure"]')
    
    // Check that Structure step shows "To do" initially
    const structureStep = page.locator('[data-testid="step-structure"]')
    await expect(structureStep).toContainText('To do')
    
    // Select "Patio" from the dropdown
    await page.selectOption('select', 'patio')
    
    // Check that Structure step now shows "Complete"
    await expect(structureStep).toContainText('Complete')
  })

  test('Siting step flips to "Complete" after pressing Next without toggling fields', async ({ page }) => {
    // Complete previous steps first
    await page.click('[data-testid="step-property"]')
    await page.selectOption('select[name="zone_text"]', 'R1')
    await page.fill('input[name="lot_size_m2"]', '500')
    await page.fill('input[name="frontage_m"]', '10')
    await page.click('button:has-text("Next")')
    
    await page.click('[data-testid="step-structure"]')
    await page.selectOption('select[name="type"]', 'shed')
    await page.click('button:has-text("Next")')
    
    await page.click('[data-testid="step-dimensions"]')
    await page.fill('input[name="length_m"]', '5')
    await page.fill('input[name="width_m"]', '3')
    await page.fill('input[name="height_m"]', '2.5')
    await page.click('button:has-text("Next")')
    
    await page.click('[data-testid="step-location"]')
    await page.fill('input[name="setback_side_m"]', '1')
    await page.fill('input[name="setback_rear_m"]', '1')
    await page.click('button:has-text("Next")')
    
    // Navigate to Siting step
    await page.click('[data-testid="step-siting"]')
    
    // Check that Siting step shows "To do" initially
    const sitingStep = page.locator('[data-testid="step-siting"]')
    await expect(sitingStep).toContainText('To do')
    
    // Press Next without toggling any fields
    await page.click('button:has-text("Next")')
    
    // Check that Siting step now shows "Complete"
    await expect(sitingStep).toContainText('Complete')
  })

  test('Context step flips to "Complete" after any toggle', async ({ page }) => {
    // Complete previous steps first
    await page.click('[data-testid="step-property"]')
    await page.selectOption('select[name="zone_text"]', 'R1')
    await page.fill('input[name="lot_size_m2"]', '500')
    await page.fill('input[name="frontage_m"]', '10')
    await page.click('button:has-text("Next")')
    
    await page.click('[data-testid="step-structure"]')
    await page.selectOption('select[name="type"]', 'shed')
    await page.click('button:has-text("Next")')
    
    await page.click('[data-testid="step-dimensions"]')
    await page.fill('input[name="length_m"]', '5')
    await page.fill('input[name="width_m"]', '3')
    await page.fill('input[name="height_m"]', '2.5')
    await page.click('button:has-text("Next")')
    
    await page.click('[data-testid="step-location"]')
    await page.fill('input[name="setback_side_m"]', '1')
    await page.fill('input[name="setback_rear_m"]', '1')
    await page.click('button:has-text("Next")')
    
    await page.click('[data-testid="step-siting"]')
    await page.click('button:has-text("Next")')
    
    // Navigate to Context step
    await page.click('[data-testid="step-context"]')
    
    // Check that Context step shows "To do" initially
    const contextStep = page.locator('[data-testid="step-context"]')
    await expect(contextStep).toContainText('To do')
    
    // Toggle any field (e.g., heritage_item_bool)
    await page.click('input[name="heritage_item_bool"]')
    
    // Check that Context step now shows "Complete"
    await expect(contextStep).toContainText('Complete')
  })

  test('Resetting a step clears UX flags and returns it to "To do"', async ({ page }) => {
    // Complete Structure step
    await page.click('[data-testid="step-structure"]')
    await page.selectOption('select[name="type"]', 'patio')
    
    // Verify it's complete
    const structureStep = page.locator('[data-testid="step-structure"]')
    await expect(structureStep).toContainText('Complete')
    
    // Reset the step
    await page.click('button[aria-label="Reset Structure step"]')
    await page.click('button:has-text("Reset Step")')
    
    // Check that Structure step is back to "To do"
    await expect(structureStep).toContainText('To do')
  })

  test('Structure step shows placeholder "Choose a structure" on first load', async ({ page }) => {
    // Navigate to Structure step
    await page.click('[data-testid="step-structure"]')
    
    // Check that the select shows the placeholder
    const structureSelect = page.locator('select[name="type"]')
    await expect(structureSelect).toHaveValue('')
    
    // Check that the placeholder text is visible
    await expect(structureSelect).toContainText('Choose a structure')
  })
})
