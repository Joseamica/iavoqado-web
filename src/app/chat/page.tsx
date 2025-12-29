'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { onboardingApi, conversationsApi, type ReadyStatus, type ConversationMessage } from '@/lib/api'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { ConversationsSidebar } from '@/components/chat/ConversationsSidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FileUploader } from '@/components/onboarding/FileUploader'
import { toast } from 'sonner'
import { Leaf, FolderOpen, FileSpreadsheet, LogOut, Menu, RefreshCw } from 'lucide-react'

export default function ChatPage() {
  const { token, user, organization, logout } = useAuth()
  const router = useRouter()
  const [readyStatus, setReadyStatus] = useState<ReadyStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)

  // Conversation state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarKey, setSidebarKey] = useState(0) // Force refresh sidebar

  const handleRecalculateQuality = async () => {
    if (!token) return

    setIsRecalculating(true)
    try {
      const result = await onboardingApi.recalculateQuality(token)
      if (result.success) {
        toast.success(`Calidad actualizada: ${result.previousScore} → ${result.newScore}`)
        // Refresh ready status to get new score
        const newStatus = await onboardingApi.checkReady(token)
        setReadyStatus(newStatus)
      }
    } catch (error) {
      console.error('Recalculate error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al recalcular')
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleFilesSelected = async (files: File[]) => {
    if (!token) return

    setIsUploading(true)
    try {
      toast.info('Subiendo y analizando archivos...')
      const result = await onboardingApi.startProcessing(token, files)

      if (result.success) {
        if (result.model) {
          sessionStorage.setItem('proposedModel', JSON.stringify(result.model))
          toast.success('Archivos analizados. Revisa el modelo propuesto.')
          setShowUploadDialog(false)
          router.push('/onboarding/review')
        } else {
          toast.success(result.message || 'Documentos procesados correctamente')
          setShowUploadDialog(false)
          const newStatus = await onboardingApi.checkReady(token)
          setReadyStatus(newStatus)
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al subir archivos')
    } finally {
      setIsUploading(false)
    }
  }

  // Check if chatbot is ready
  useEffect(() => {
    if (!token) return

    const checkReady = async () => {
      try {
        const status = await onboardingApi.checkReady(token)
        setReadyStatus(status)

        if (!status.ready || !status.chatbot.available) {
          toast.error('Tu chatbot aun no esta listo')
          router.push('/onboarding/upload')
        }
      } catch (error) {
        console.error('Ready check error:', error)
        toast.error('Error al verificar estado')
        router.push('/onboarding/upload')
      } finally {
        setIsLoading(false)
      }
    }

    checkReady()
  }, [token, router])

  // Load conversation messages when selected
  useEffect(() => {
    if (!token || !selectedConversationId) {
      setConversationMessages([])
      return
    }

    const loadMessages = async () => {
      try {
        const result = await conversationsApi.get(token, selectedConversationId)
        setConversationMessages(result.messages)
      } catch (error) {
        console.error('Failed to load conversation:', error)
        toast.error('Error al cargar la conversacion')
        setSelectedConversationId(null)
      }
    }

    loadMessages()
  }, [token, selectedConversationId])

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    setSelectedConversationId(null)
    setConversationMessages([])
  }, [])

  // Handle conversation created (from chat)
  const handleConversationCreated = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId)
    // Refresh sidebar to show new conversation
    setSidebarKey((k) => k + 1)
  }, [])

  // Handle message sent (refresh sidebar to update counts)
  const handleMessageSent = useCallback(() => {
    setSidebarKey((k) => k + 1)
  }, [])

  // Redirect if not logged in
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p>Debes iniciar sesion para continuar</p>
          <Button onClick={() => router.push('/')}>Ir a inicio</Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Leaf className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Cargando chatbot...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <ConversationsSidebar
        key={sidebarKey}
        token={token}
        selectedId={selectedConversationId || undefined}
        onSelect={setSelectedConversationId}
        onNewConversation={handleNewConversation}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-background border-b shrink-0">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <Leaf className="h-6 w-6 text-primary" />
              <div>
                <span className="font-semibold">IAvoqado</span>
                {readyStatus?.organizationName && (
                  <span className="text-sm text-muted-foreground ml-2">
                    · {readyStatus.organizationName}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Add Files Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadDialog(true)}
                className="hidden sm:flex items-center gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Agregar datos</span>
              </Button>

              {/* Quality Score */}
              {readyStatus?.qualityScore && (
                <div className="hidden md:flex items-center gap-1">
                  <Badge variant="outline">
                    Calidad: {readyStatus.qualityScore}/100
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleRecalculateQuality}
                    disabled={isRecalculating}
                    title="Recalcular calidad"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRecalculating ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              )}

              {/* Data Sources */}
              {readyStatus?.dataSources && (
                <Badge variant="secondary" className="hidden md:flex">
                  {readyStatus.dataSources.ready} tablas
                </Badge>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm">
                      {user?.name || user?.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowUploadDialog(true)}>
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Agregar datos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/onboarding/upload')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Ver todos los datos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Chat Interface */}
        <main className="flex-1 min-h-0">
          <ChatInterface
            token={token}
            conversationId={selectedConversationId || undefined}
            initialMessages={conversationMessages}
            suggestedQuestions={readyStatus?.chatbot.suggestedQuestions || []}
            organizationName={readyStatus?.organizationName}
            onConversationCreated={handleConversationCreated}
            onMessageSent={handleMessageSent}
          />
        </main>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar mas datos</DialogTitle>
            <DialogDescription>
              Sube archivos adicionales para ampliar tu base de datos. Puedes subir Excel, CSV, PDF o Word.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FileUploader
              onFilesSelected={handleFilesSelected}
              isUploading={isUploading}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
