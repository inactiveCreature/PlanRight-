# Ollama Setup for AI Chat

This application now includes AI chat functionality powered by Ollama (local open-source models).

## Prerequisites

1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
2. **Pull a model**: Run `ollama pull llama3.1` (or your preferred model)

## Running the Application

### Option 1: Full Stack (Recommended)
```bash
# Start both the chat server and frontend
npm run dev:full
```

### Option 2: Manual Setup
```bash
# Terminal 1: Start Ollama server
ollama serve

# Terminal 2: Start chat server
npm run server

# Terminal 3: Start frontend
npm run dev
```

## Configuration

Set environment variables to customize the setup:

```bash
# Chat server port (default: 3001)
PORT=3001

# Ollama URL (default: http://localhost:11434)
OLLAMA_URL=http://localhost:11434

# Model to use (default: llama3.1)
LLM_MODEL=llama3.1
```

## Features

- **Streaming Responses**: Real-time AI responses
- **Tool Actions**: AI can set form fields and run assessments
- **Connection Status**: Visual indicator of Ollama connection
- **Fallback Mode**: Works without Ollama for basic commands

## Troubleshooting

- **"Ollama not connected"**: Make sure `ollama serve` is running
- **Model not found**: Run `ollama pull llama3.1` to download the model
- **Port conflicts**: Change PORT environment variable
- **CORS issues**: Ensure chat server is running on the correct port
