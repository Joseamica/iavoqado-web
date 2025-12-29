'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { chatApi, type ChatMessage, type ConversationMessage } from '@/lib/api'
import { Leaf, Send, Coins, Zap, Database, FileText } from 'lucide-react'

interface ChatInterfaceProps {
  token: string
  conversationId?: string
  initialMessages?: ConversationMessage[]
  suggestedQuestions?: string[]
  organizationName?: string
  onConversationCreated?: (id: string) => void
  onMessageSent?: () => void
}

interface DisplayMessage extends ChatMessage {
  id?: string
}

export function ChatInterface({
  token,
  conversationId,
  initialMessages = [],
  suggestedQuestions = [],
  organizationName,
  onConversationCreated,
  onMessageSent,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Sync with initial messages when conversation changes
  useEffect(() => {
    if (initialMessages.length > 0) {
      const mapped: DisplayMessage[] = initialMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sql: m.sql || undefined,
        data: m.data || undefined,
        timestamp: m.createdAt,
        tokens: m.tokens,
        costUsd: m.costUsd,
        source: m.source || undefined,
      }))
      setMessages(mapped)
    } else {
      setMessages([])
    }
    setCurrentConversationId(conversationId)
  }, [conversationId, initialMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return

    const userMessage: DisplayMessage = {
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await chatApi.ask(token, question, currentConversationId)

      // If this was a new conversation, notify parent
      if (!currentConversationId && response.conversationId) {
        setCurrentConversationId(response.conversationId)
        onConversationCreated?.(response.conversationId)
      }

      const assistantMessage: DisplayMessage = {
        role: 'assistant',
        content: response.answer,
        sql: response.sql,
        data: response.data,
        timestamp: new Date().toISOString(),
        tokens: response.tokens,
        costUsd: response.costUsd,
        source: response.source,
      }

      setMessages((prev) => [...prev, assistantMessage])
      onMessageSent?.()
    } catch (error) {
      const errorMessage: DisplayMessage = {
        role: 'assistant',
        content: 'Lo siento, ocurrio un error al procesar tu pregunta. Por favor intenta de nuevo.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-md mx-auto">
            <div className="rounded-full bg-primary/10 p-6">
              <Leaf className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Hola! Soy tu asistente de datos
              </h2>
              <p className="text-muted-foreground">
                Preguntame lo que quieras sobre tu negocio. Puedo ayudarte con ventas,
                inventario, empleados y mas.
              </p>
            </div>

            {/* Suggested Questions */}
            {suggestedQuestions.length > 0 && (
              <div className="space-y-2 w-full">
                <p className="text-sm text-muted-foreground">Prueba preguntar:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => sendMessage(q)}
                      className="text-left"
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message, i) => (
              <MessageBubble key={i} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    IA
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta..."
            className="resize-none min-h-[44px]"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            size="lg"
            aria-label="Enviar mensaje"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Enter para enviar, Shift+Enter para nueva linea
        </p>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === 'user'

  const formatCost = (cost?: number) => {
    if (!cost || cost === 0) return null
    if (cost < 0.0001) return '<$0.0001'
    return `$${cost.toFixed(4)}`
  }

  const formatTokens = (tokens?: { input: number; output: number }) => {
    if (!tokens) return null
    const total = tokens.input + tokens.output
    if (total === 0) return null
    return `${total.toLocaleString()} tokens`
  }

  const getSourceIcon = (source?: string) => {
    if (!source) return null
    if (source === 'database') return <Database className="h-3 w-3" />
    if (source === 'document') return <FileText className="h-3 w-3" />
    return null
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={isUser ? 'bg-secondary' : 'bg-primary text-primary-foreground'}>
          {isUser ? 'TU' : 'IA'}
        </AvatarFallback>
      </Avatar>

      <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-lg p-3 ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : message.error
              ? 'bg-destructive/10 text-destructive'
              : 'bg-muted'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Message metadata (tokens, cost, source) */}
        {!isUser && (message.tokens || message.costUsd || message.source) && (
          <TooltipProvider>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {message.source && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="gap-1 text-xs py-0 h-5">
                      {getSourceIcon(message.source)}
                      {message.source === 'database' ? 'Datos' : 'Documento'}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {message.source === 'database'
                      ? 'Respuesta generada desde tus tablas de datos'
                      : 'Respuesta generada desde documentos PDF/Word'}
                  </TooltipContent>
                </Tooltip>
              )}
              {formatTokens(message.tokens) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {formatTokens(message.tokens)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Input: {message.tokens?.input.toLocaleString()} | Output: {message.tokens?.output.toLocaleString()}
                  </TooltipContent>
                </Tooltip>
              )}
              {formatCost(message.costUsd) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      {formatCost(message.costUsd)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Costo de esta respuesta</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        )}

        {/* SQL Query */}
        {message.sql && (
          <div className="bg-slate-900 text-slate-100 rounded-md p-3 text-sm font-mono overflow-x-auto">
            <p className="text-xs text-slate-400 mb-1">SQL ejecutado:</p>
            <code>{message.sql}</code>
          </div>
        )}

        {/* Data Table */}
        {message.data && message.data.length > 0 && (
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">
                Resultados ({message.data.length} filas)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(message.data[0]).map((key) => (
                        <TableHead key={key} className="text-xs">
                          {key}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {message.data.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        {Object.values(row).map((value, j) => (
                          <TableCell key={j} className="text-xs">
                            {formatValue(value)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {message.data.length > 10 && (
                <p className="text-xs text-muted-foreground p-2 text-center">
                  Mostrando 10 de {message.data.length} filas
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    return value.toLocaleString('es-MX')
  }
  return String(value)
}
