/**
 * Test helper for mocking the assistant API during e2e tests
 * This prevents hanging streams and makes tests more reliable
 */

export async function mockAssistantAPI(page: any) {
  // Mock the chat API endpoint to prevent hanging streams
  await page.route('**/api/chat', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ model: 'mock' })
    })
  })

  // Mock the health check endpoint
  await page.route('**/api/health', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok', model: 'mock' })
    })
  })
}

export async function visitPageWithAssistantDisabled(page: any, url: string) {
  // Visit pages with assistant disabled to avoid API calls
  await page.goto(`${url}?assistant=off`)
}

export function addAssistantTimeoutToChatService() {
  // Add timeout to chat service to prevent hanging
  const originalFetch = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.includes('/api/chat')) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      
      try {
        const response = await originalFetch(input, {
          ...init,
          signal: controller.signal
        })
        clearTimeout(timeout)
        return response
      } catch (error) {
        clearTimeout(timeout)
        throw error
      }
    }
    return originalFetch(input, init)
  }
}
