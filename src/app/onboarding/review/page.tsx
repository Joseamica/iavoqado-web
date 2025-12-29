'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { onboardingApi, type ProposedModel } from '@/lib/api'
import { ModelReview } from '@/components/onboarding/ModelReview'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Leaf, Loader2, Check } from 'lucide-react'

export default function ReviewPage() {
  const { token, user, logout } = useAuth()
  const router = useRouter()
  const [model, setModel] = useState<ProposedModel | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  // Load model from sessionStorage
  useEffect(() => {
    const storedModel = sessionStorage.getItem('proposedModel')
    if (storedModel) {
      try {
        setModel(JSON.parse(storedModel))
      } catch {
        toast.error('Error al cargar el modelo')
        router.push('/onboarding/upload')
      }
    } else {
      toast.error('No hay modelo para revisar')
      router.push('/onboarding/upload')
    }
  }, [router])

  const handleConfirm = async () => {
    if (!token) return

    setIsConfirming(true)

    try {
      const result = await onboardingApi.confirmModel(token, true)

      if (result.success) {
        toast.success('Modelo confirmado. Procesando datos...')
        // Clear stored model
        sessionStorage.removeItem('proposedModel')
        router.push('/onboarding/processing')
      }
    } catch (error) {
      console.error('Confirm error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al confirmar')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCancel = async () => {
    if (!token) return

    try {
      await onboardingApi.confirmModel(token, false)
      sessionStorage.removeItem('proposedModel')
      toast.info('Análisis cancelado. Puedes empezar de nuevo.')
      router.push('/onboarding/upload')
    } catch (error) {
      console.error('Cancel error:', error)
      // Even if cancel fails, redirect back
      router.push('/onboarding/upload')
    }
  }

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

  if (!model) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="rounded-full bg-primary/10 p-4 inline-block mb-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <p className="text-muted-foreground">Cargando modelo...</p>
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
            <Step number={2} label="Revisar modelo" active />
            <StepConnector />
            <Step number={3} label="Procesar" />
            <StepConnector />
            <Step number={4} label="Listo" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ModelReview
          model={model}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isConfirming={isConfirming}
        />
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
