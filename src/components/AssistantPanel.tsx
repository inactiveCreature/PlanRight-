import React, { useState, useRef, useEffect, useCallback } from 'react'
import { chatService, ChatMessage } from '../services/chatService'
import { assess, isProposalReady } from '../assessment/assess'
import { usePlanRightStore } from '../store'

interface Message {
  who: 'ai' | 'user'
  text: string
  timestamp?: number
}

interface AssistantPanelProps {
  role: string
  className?: string
}

export default function AssistantPanel({ role, className = '' }: AssistantPanelProps) {
  const { setField } = usePlanRightStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      who: 'ai',
      text: `Hi ${role}! I can help you fill out the form and run assessments. Complete the fields, then run the rules check on the Review step.`,
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showJumpToLatest, setShowJumpToLatest] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check connection on mount
  useEffect(() => {
    chatService.checkHealth().then(setIsConnected)
  }, [])

  // Auto-scroll to bottom when at bottom and new messages arrive
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isAtBottom])

  // Handle scroll events to detect if user is at bottom
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return

    const container = messagesContainerRef.current
    const threshold = 50 // pixels from bottom
    const isNearBottom =
      container.scrollTop + container.clientHeight >= container.scrollHeight - threshold

    setIsAtBottom(isNearBottom)
    setShowJumpToLatest(!isNearBottom)
  }, [])

  // ResizeObserver to handle content reflow during streaming
  useEffect(() => {
    if (!messagesContainerRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    })

    resizeObserver.observe(messagesContainerRef.current)
    return () => resizeObserver.disconnect()
  }, [isAtBottom])

  function pushUser(text: string) {
    setMessages((m) => [...m, { who: 'user', text, timestamp: Date.now() }])
  }

  function pushAI(text: string) {
    setMessages((m) => [...m, { who: 'ai', text, timestamp: Date.now() }])
  }

  function jumpToLatest() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setIsAtBottom(true)
    setShowJumpToLatest(false)
  }

  function handleRunRules() {
    if (!isProposalReady()) {
      pushAI(
        'I need you to fill out the required fields first (zone, lot size, structure type, height, and setbacks) before I can run the rules check.'
      )
      return
    }

    const result = assess()

    if (result.decision === 'Cannot assess') {
      pushAI(
        `I couldn't run the assessment because there are validation errors. Please check the form fields and try again.`
      )
    } else {
      pushAI(
        `Assessment complete! Result: ${result.decision}. Check the Review step to see the detailed results.`
      )
    }
  }

  async function sendToOllama(userMessage: string) {
    setIsLoading(true)

    // Convert messages to ChatMessage format
    const chatMessages: ChatMessage[] = [
      ...messages.map((m) => ({
        role: m.who === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      })),
      { role: 'user', content: userMessage },
    ]

    let aiResponse = ''

    try {
      await chatService.sendMessage(
        chatMessages,
        (chunk: string) => {
          aiResponse += chunk
          // Update the last AI message with streaming content
          setMessages((prev) => {
            const newMessages = [...prev]
            if (newMessages[newMessages.length - 1]?.who === 'ai') {
              newMessages[newMessages.length - 1] = {
                who: 'ai',
                text: aiResponse,
                timestamp: Date.now(),
              }
            } else {
              newMessages.push({ who: 'ai', text: aiResponse, timestamp: Date.now() })
            }
            return newMessages
          })
        },
        () => {
          setIsLoading(false)
        },
        (error: string) => {
          setIsLoading(false)
          pushAI(
            `Sorry, I encountered an error: ${error}. Please make sure Ollama is running on localhost:11434.`
          )
        }
      )
    } catch {
      setIsLoading(false)
      pushAI(
        'Sorry, I encountered an error. Please make sure Ollama is running on localhost:11434.'
      )
    }
  }

  function onSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    // Clear typing state and timeout
    setIsTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    pushUser(text)
    setInput('')

    // Handle "run rules" command
    if (text.toLowerCase().includes('run rules') || text.toLowerCase().includes('assess')) {
      setTimeout(() => handleRunRules(), 200)
    }
    // Handle zone chat binding
    else if (text.toLowerCase().includes('zone')) {
      const zoneMatch = text.match(/zone\s+(r[1-5]|ru[1-5])/i)
      if (zoneMatch) {
        const zone = zoneMatch[1].toUpperCase()
        setField('property.zone_text', zone)
        setTimeout(
          () =>
            pushAI(
              `I've set your zone to ${zone}. The thresholds and validation rules have been updated accordingly.`
            ),
          200
        )
      } else {
        setTimeout(
          () =>
            pushAI(
              'I can set your zone! Try saying "Zone R1", "Zone R2", "Zone R3", or "Zone RU1".'
            ),
          200
        )
      }
    } else {
      // Use Ollama for other messages
      if (isConnected) {
        sendToOllama(text)
      } else {
        setTimeout(
          () =>
            pushAI(
              'I can help you fill out the form and run assessments. Complete the fields, then run the rules check on the Review step.'
            ),
          200
        )
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend(e)
    }
  }

  function adjustTextareaHeight() {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 5 * 24 // 5 rows * 24px line height
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setInput(value)

    // Set typing state
    setIsTyping(true)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to hide instruction after user stops typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000) // Hide after 1 second of no typing
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      className={`min-w-0 flex flex-col rounded-3xl border border-slate-200/60 bg-white shadow-xl backdrop-blur-sm max-h-[calc(100vh-80px-24px)] overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200/60 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800 flex items-center gap-2">
                AI Assistant
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
              </div>
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <span className="font-medium">Your planning expert</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
        onScroll={handleScroll}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.who === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
          >
            <div
              className={`rounded-2xl px-4 py-3 max-w-[85%] shadow-sm ${
                m.who === 'user'
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                  : 'bg-slate-50 border border-slate-200 text-slate-800'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-slate-500 text-sm animate-in fade-in duration-200">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">AI is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Jump to Latest Floater */}
      {showJumpToLatest && (
        <button
          onClick={jumpToLatest}
          className="absolute bottom-20 right-4 rounded-full border border-slate-200 bg-white/95 backdrop-blur-sm px-3 py-2 text-xs font-medium text-slate-600 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 z-10 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            Latest
          </div>
        </button>
      )}

      {/* Input */}
      <div className="px-4 sm:px-6 py-5 border-t border-slate-200/60 bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/30 flex-shrink-0">
        <form onSubmit={onSend} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isConnected
                  ? 'Ask about rules, set form values, or get help...'
                  : 'Ollama not connected - basic commands only'
              }
              disabled={isLoading}
              rows={1}
              className={`w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-0 resize-none disabled:opacity-50 disabled:cursor-not-allowed bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg focus:shadow-xl placeholder:text-slate-400 placeholder:font-normal ${
                isTyping ? 'border-blue-400 shadow-lg ring-2 ring-blue-100' : 'border-slate-300'
              }`}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            {input.trim() && !isTyping && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-lg animate-in fade-in duration-200">
                  <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg shadow-sm">
                    Enter
                  </kbd>
                  <span className="text-xs text-slate-600 font-medium">to send</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end sm:justify-start">
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 flex-shrink-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto ${
                isLoading || !input.trim()
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 animate-in zoom-in-95 duration-200'
              }`}
              aria-label="Send message to AI assistant"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </form>
        {!isConnected && (
          <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Start Ollama server to enable AI chat:{' '}
            <code className="bg-amber-100 px-1 rounded">ollama serve</code>
          </div>
        )}
      </div>
    </div>
  )
}
