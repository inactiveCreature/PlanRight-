import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const app = express()
const PORT = process.env.PORT || 3001
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const LLM_MODEL = process.env.LLM_MODEL || 'llama3.2'

// Middleware
app.use(cors())
app.use(express.json())

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  actionsAllowed?: boolean
}

interface ToolAction {
  type: 'set_field' | 'run_assessment' | 'lookup_clause' | 'reset_form'
  field?: string
  value?: any
  clause_id?: string
  scope?: 'all' | 'step'
  stepId?: string
  keepRole?: boolean
  keepChat?: boolean
}

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a helpful planning assistant for a development application system. You can help users fill out forms and explain planning rules, but you cannot make planning decisions.

Available tools:
1. set_field: Set form field values (field, value)
2. run_assessment: Run the rules assessment
3. lookup_clause: Look up specific planning clauses (clause_id)
4. reset_form: Reset form data (scope: "all" or "step", stepId: step name, keepRole: boolean, keepChat: boolean)

Available zones:
- R1: General Residential
- R2: Low Density Residential  
- R3: Medium Density Residential

When users mention zones (e.g., "Zone R2", "set zone to r3"), use set_field with field "property.zone_text" and the appropriate zone code (R1, R2, or R3).

When users want to reset the form (e.g., "reset all", "clear form", "start over"), use reset_form with scope "all" and appropriate keepRole/keepChat settings.

When users want to reset a specific step (e.g., "reset property step", "clear dimensions"), use reset_form with scope "step" and the appropriate stepId.

You can explain rules, help fill out forms, and trigger assessments, but the rules engine makes all final decisions. Always be helpful and accurate.`

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, actionsAllowed = true }: ChatRequest = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' })
    }

    // Prepare messages for Ollama
    const ollamaMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ]

    // Set up streaming response
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Transfer-Encoding', 'chunked')

    // Call Ollama API
    const ollamaResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: ollamaMessages,
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      })
    })

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status}`)
    }

    // Stream the response
    if (!ollamaResponse.body) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    ollamaResponse.body.on('data', (chunk: Buffer) => {
      buffer += decoder.decode(chunk, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line)
            if (data.message?.content) {
              res.write(data.message.content)
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    })

    ollamaResponse.body.on('end', () => {
      res.end()
    })

    ollamaResponse.body.on('error', (error: Error) => {
      console.error('Stream error:', error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error' })
      }
    })

  } catch (error) {
    console.error('Chat API error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: LLM_MODEL })
})

// Start server
app.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`)
  console.log(`Using Ollama at ${OLLAMA_URL} with model ${LLM_MODEL}`)
})

export default app
