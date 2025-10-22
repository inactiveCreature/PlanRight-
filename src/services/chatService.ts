export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  actionsAllowed?: boolean
}

export interface ToolAction {
  type: 'set_field' | 'run_assessment' | 'lookup_clause'
  field?: string
  value?: any
  clause_id?: string
}

export class ChatService {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl
  }

  async sendMessage(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          actionsAllowed: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          onChunk(chunk)
        }
      } finally {
        reader.releaseLock()
      }

      onComplete()
    } catch (error) {
      console.error('Chat service error:', error)
      onError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`)
      return response.ok
    } catch {
      return false
    }
  }
}

export const chatService = new ChatService()
