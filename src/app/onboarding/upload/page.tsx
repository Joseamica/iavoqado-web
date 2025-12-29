'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { onboardingApi, type ReadyStatus } from '@/lib/api'
import { FileUploader } from '@/components/onboarding/FileUploader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Leaf, MessageSquare, FileSpreadsheet, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function UploadPage() {
  const { token, user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [showDpaDialog, setShowDpaDialog] = useState(false)
  const [dpaAccepted, setDpaAccepted] = useState(false)
  const [isSigningDpa, setIsSigningDpa] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null)
  const [readyStatus, setReadyStatus] = useState<ReadyStatus | null>(null)

  // Check if there's existing data
  useEffect(() => {
    if (!token) return

    onboardingApi.checkReady(token)
      .then(status => setReadyStatus(status))
      .catch(() => {/* ignore errors */})
  }, [token])

  // Show loading while auth is being validated
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  const handleSignDpa = async () => {
    if (!token) return

    setIsSigningDpa(true)
    try {
      await onboardingApi.signDpa(token)
      setDpaAccepted(true)
      setShowDpaDialog(false)
      toast.success('DPA firmado correctamente')

      // If there are pending files, upload them
      if (pendingFiles) {
        await handleUpload(pendingFiles)
        setPendingFiles(null)
      }
    } catch (error) {
      console.error('Error signing DPA:', error)
      toast.error('Error al firmar el DPA')
    } finally {
      setIsSigningDpa(false)
    }
  }

  const handleUpload = async (files: File[]) => {
    if (!token) return

    setIsUploading(true)
    try {
      toast.info('Subiendo y analizando archivos...')
      const result = await onboardingApi.startProcessing(token, files)

      if (result.success) {
        if (result.model) {
          // Data files uploaded - go to review
          sessionStorage.setItem('proposedModel', JSON.stringify(result.model))
          toast.success('Archivos analizados correctamente')
          router.push('/onboarding/review')
        } else {
          // Only documents uploaded - go directly to chat or stay
          toast.success(result.message || 'Documentos procesados correctamente')
          // Refresh ready status
          const status = await onboardingApi.checkReady(token)
          setReadyStatus(status)
          if (status.ready && status.chatbot.available) {
            router.push('/chat')
          }
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error)

      // Check if it's a DPA error
      if (error?.code === 'DPARequired' || error?.message?.includes('Acuerdo de Procesamiento')) {
        setPendingFiles(files)
        setShowDpaDialog(true)
      } else {
        toast.error(error instanceof Error ? error.message : 'Error al subir archivos')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleFilesSelected = async (files: File[]) => {
    if (!token) {
      toast.error('Debes iniciar sesion primero')
      router.push('/')
      return
    }

    // If DPA not accepted yet, show dialog
    if (!dpaAccepted) {
      setPendingFiles(files)
      setShowDpaDialog(true)
      return
    }

    await handleUpload(files)
  }

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">IAvoqado</span>
          </div>
          <div className="flex items-center gap-4">
            {readyStatus?.chatbot.available && (
              <Button variant="default" size="sm" onClick={() => router.push('/chat')}>
                <MessageSquare className="h-4 w-4 mr-1" />
                Ir al Chat
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Existing Data Banner */}
      {readyStatus?.dataSources && readyStatus.dataSources.ready > 0 && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {readyStatus.dataSources.ready} tabla{readyStatus.dataSources.ready > 1 ? 's' : ''} activa{readyStatus.dataSources.ready > 1 ? 's' : ''}
              </Badge>
              <span className="text-sm text-foreground">
                Ya tienes datos cargados. Puedes subir más archivos o ir al chat.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/data')}>
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                Ver mis datos
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/chat')}>
                Ir al Chat →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            <Step number={1} label="Subir archivos" active />
            <StepConnector />
            <Step number={2} label="Revisar modelo" />
            <StepConnector />
            <Step number={3} label="Procesar" />
            <StepConnector />
            <Step number={4} label="Listo" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {readyStatus?.dataSources && readyStatus.dataSources.ready > 0
              ? 'Agregar más archivos'
              : 'Paso 1: Sube tus archivos'}
          </h1>
          <p className="text-muted-foreground">
            {readyStatus?.dataSources && readyStatus.dataSources.ready > 0
              ? 'Sube archivos adicionales para ampliar tu base de datos. Los nuevos datos se agregarán a los existentes.'
              : 'Sube tus archivos de ventas, inventario, productos, etc. Aceptamos Excel (.xlsx, .xls) y CSV.'}
          </p>
        </div>

        <FileUploader
          onFilesSelected={handleFilesSelected}
          isUploading={isUploading}
        />

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Tus datos estan seguros. Usamos encriptacion de nivel bancario.</p>
        </div>
      </main>

      {/* DPA Dialog */}
      <Dialog open={showDpaDialog} onOpenChange={setShowDpaDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Acuerdo de Procesamiento de Datos</DialogTitle>
            <DialogDescription>
              Para proteger tu informacion, necesitamos que aceptes nuestro acuerdo de procesamiento de datos antes de continuar.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-sm">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">Resumen del Acuerdo:</h3>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                <li>Tus datos seran procesados unicamente para brindarte el servicio de analisis</li>
                <li>No compartimos ni vendemos tu informacion a terceros</li>
                <li>Usamos encriptacion AES-256 para proteger tus datos</li>
                <li>Puedes solicitar la eliminacion de tus datos en cualquier momento</li>
                <li>Cumplimos con la LFPDPPP (Ley Federal de Proteccion de Datos Personales)</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Tus derechos ARCO:</h3>
              <p className="text-blue-800 dark:text-blue-200 text-xs mt-1">
                Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tus datos personales.
                Contactanos en privacy@iavoqado.com para ejercer estos derechos.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDpaDialog(false)} disabled={isSigningDpa}>
              Cancelar
            </Button>
            <Button onClick={handleSignDpa} disabled={isSigningDpa}>
              {isSigningDpa ? 'Firmando...' : 'Acepto el acuerdo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Step({ number, label, active = false, completed = false }: {
  number: number
  label: string
  active?: boolean
  completed?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
          ${active ? 'bg-primary text-primary-foreground' : ''}
          ${completed ? 'bg-primary text-primary-foreground' : ''}
          ${!active && !completed ? 'bg-muted text-muted-foreground' : ''}
        `}
      >
        {completed ? <Check className="h-4 w-4" /> : number}
      </div>
      <span className={`text-sm ${active ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  )
}

function StepConnector() {
  return <div className="w-12 h-0.5 bg-muted" />
}
