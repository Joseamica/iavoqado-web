'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { onboardingApi, type ProcessingStatus as ProcessingStatusType } from '@/lib/api'
import { ProcessingStatus } from '@/components/onboarding/ProcessingStatus'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Leaf, XCircle, Loader2, Check } from 'lucide-react'

const POLL_INTERVAL = 2000 // 2 seconds

export default function ProcessingPage() {
  const { token, user, logout } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<ProcessingStatusType | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Poll for status
  useEffect(() => {
    if (!token) return

    let isMounted = true
    let pollTimeout: NodeJS.Timeout

    const pollStatus = async () => {
      try {
        const result = await onboardingApi.getProcessingStatus(token)
        if (isMounted) {
          setStatus(result)
          setError(null)

          // Continue polling if not done
          if (result.stage !== 'ready' && !result.error) {
            pollTimeout = setTimeout(pollStatus, POLL_INTERVAL)
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error al obtener estado')
        }
      }
    }

    pollStatus()

    return () => {
      isMounted = false
      clearTimeout(pollTimeout)
    }
  }, [token])

  const handleComplete = useCallback(() => {
    toast.success('¡Tu chatbot está listo!')
    router.push('/chat')
  }, [router])

  const handleError = useCallback(() => {
    router.push('/onboarding/upload')
  }, [router])

  // Redirect if not logged in
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-foreground">Debes iniciar sesión para continuar</p>
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
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            <Step number={1} label="Subir archivos" completed />
            <StepConnector completed />
            <Step number={2} label="Revisar modelo" completed />
            <StepConnector completed />
            <Step number={3} label="Procesar" active />
            <StepConnector />
            <Step number={4} label="Listo" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {error ? (
          <div className="text-center space-y-4">
            <div className="rounded-full bg-destructive/10 p-4 inline-block">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-destructive">{error}</p>
            <Button onClick={() => router.push('/onboarding/upload')}>
              Intentar de nuevo
            </Button>
          </div>
        ) : status ? (
          <div className="space-y-8">
            <ProcessingStatus
              status={status}
              onComplete={handleComplete}
              onError={handleError}
            />
            
            {/* Cancel button - only show while processing */}
            {status.stage !== 'ready' && !status.error && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    if (confirm('¿Estás seguro de que quieres cancelar el procesamiento?')) {
                      toast.info('Procesamiento cancelado')
                      router.push('/onboarding/upload')
                    }
                  }}
                >
                  Cancelar y volver
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="rounded-full bg-primary/10 p-4 inline-block mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <p className="text-muted-foreground">Conectando...</p>
          </div>
        )}
      </main>
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

function StepConnector({ completed = false }: { completed?: boolean }) {
  return (
    <div className={`w-12 h-0.5 ${completed ? 'bg-primary' : 'bg-muted'}`} />
  )
}
