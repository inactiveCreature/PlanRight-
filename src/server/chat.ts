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


// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a helpful planning assistant for a development application system. You can help users fill out forms and explain planning rules, but you cannot make planning decisions.

AVAILABLE TOOLS:
When you need to change form values, include a JSON block in your response with this format:
\`\`\`json
{
  "actions": [
    {"type": "set_field", "field": "field.path", "value": "value"},
    {"type": "set_field", "field": "another.field", "value": "another_value"}
  ]
}
\`\`\`

AVAILABLE FIELDS (use these exact paths):
Property fields:
- property.zone_text: Zone code (R1, R2, R3, RU1, RU2, RU3, RU4, RU5)
- property.lot_size_m2: Lot size in square meters (number)
- property.frontage_m: Frontage in meters (number)
- property.corner_lot_bool: Corner lot flag (true/false)
- property.easement_bool: Easement flag (true/false)

Structure fields:
- structure.type: Structure type (shed, patio, carport)

Dimension fields:
- dimensions.length_m: Length in meters (number)
- dimensions.width_m: Width in meters (number)
- dimensions.height_m: Height in meters (number)
- dimensions.area_m2: Area in square meters (number, auto-calculated if not set)

Location/Setback fields:
- location.setback_front_m: Front setback in meters (number, optional - if empty, assumes behind building line)
- location.setback_side_m: Side setback in meters (number)
- location.setback_rear_m: Rear setback in meters (number)

Siting fields:
- siting.on_easement_bool: On easement flag (true/false)
- siting.over_sewer_bool: Over sewer flag (true/false)
- siting.attached_to_dwelling_bool: Attached to dwelling flag (true/false)

Context fields:
- context.heritage_item_bool: Heritage item flag (true/false)
- context.conservation_area_bool: Conservation area flag (true/false)
- context.flood_prone_bool: Flood prone flag (true/false)
- context.bushfire_bool: Bushfire prone flag (true/false)

AVAILABLE ZONES:
- R1: General Residential
- R2: Low Density Residential  
- R3: Medium Density Residential
- RU1, RU2, RU3, RU4, RU5: Rural zones

EXAMPLES:
- User: "Set zone to R2" → Include: {"type": "set_field", "field": "property.zone_text", "value": "R2"}
- User: "Change lot size to 500 square meters" → Include: {"type": "set_field", "field": "property.lot_size_m2", "value": 500}
- User: "Set length to 3.5 meters and width to 2.4 meters" → Include both fields in actions array
- User: "Make it a shed" → Include: {"type": "set_field", "field": "structure.type", "value": "shed"}
- User: "Set front setback to 5 meters" → Include: {"type": "set_field", "field": "location.setback_front_m", "value": 5}

RESPONSE GUIDELINES:
- Respond naturally and conversationally - DO NOT list all form fields unless specifically asked
- Only mention the specific fields you changed or that are relevant to the user's question
- Keep responses concise and focused on what was actually done or asked
- If changing multiple fields, mention them naturally in your response (e.g., "I've updated the length and width" instead of listing all fields)
- When asked about specific fields, only discuss those fields, not the entire form

IMPORTANT:
- Always respond naturally with a helpful message, then include the JSON block if you're making changes
- For boolean fields, use true/false (not strings)
- For number fields, use actual numbers (not strings)
- For zone and structure type, use the exact values listed above
- You can include multiple field changes in one actions array
- If the user asks to change multiple values, include all of them in the actions array
- DO NOT list all form fields in your response unless the user specifically asks for a complete summary

You can explain rules, help fill out forms, and trigger assessments, but the rules engine makes all final decisions. Always be helpful and accurate.`

app.post('/api/chat', async (_req, res) => {
  try {
    const { messages }: ChatRequest = _req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' })
    }

    // Prepare messages for Ollama
    const ollamaMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]

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
        },
      }),
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
          } catch {
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
