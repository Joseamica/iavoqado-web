'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { ProcessingStatus as ProcessingStatusType, StageInfo } from '@/lib/api'

interface ProcessingStatusProps {
  status: ProcessingStatusType
  onComplete: () => void
  onError: () => void
}

const stageOrder = [
  'uploading',
  'analyzing_structure',
  'awaiting_confirmation',
  'processing_data',
  'semantic_analysis',
  'validating_quality',
  'generating_examples',
  'ready',
]

const stageIcons: Record<string, string> = {
  uploading: '📤',
  analyzing_structure: '🔍',
  awaiting_confirmation: '✋',
  processing_data: '⚙️',
  semantic_analysis: '🧠',
  validating_quality: '✅',
  generating_examples: '💡',
  ready: '🎉',
  error: '❌',
}

export function ProcessingStatus({ status, onComplete, onError }: ProcessingStatusProps) {
  const [dots, setDots] = useState('')

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Check for completion only - don't auto-redirect on error
  // Let user see the error message and click retry manually
  useEffect(() => {
    if (status.stage === 'ready') {
      onComplete()
    }
    // NOTE: Removed auto-redirect on error - the error UI will show instead
  }, [status.stage, onComplete])

  const currentStageIndex = status.stage ? stageOrder.indexOf(status.stage) : 0
  const overallProgress = ((currentStageIndex + 1) / stageOrder.length) * 100

  if (status.error) {
    // Handle error as string or object
    const errorMessage = typeof status.error === 'string'
      ? status.error
      : (status.error as any)?.message || 'Error desconocido'

    return (
      <Card className="w-full max-w-xl mx-auto border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <span>❌</span>
            Error en el procesamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Algo salio mal</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <Button onClick={onError} className="w-full mt-4">
            Intentar de nuevo
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="text-center">
        <div className="text-6xl mb-4">
          {stageIcons[status.stage || 'uploading']}
        </div>
        <CardTitle className="text-xl">
          {status.stageInfo?.title || 'Procesando'}{dots}
        </CardTitle>
        <CardDescription>
          {status.stageInfo?.description || 'Por favor espera mientras procesamos tus datos.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso general</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Stage Progress (if available) */}
        {status.progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paso actual</span>
              <span className="font-medium">
                {status.progress.current} / {status.progress.total}
              </span>
            </div>
            <Progress value={status.progress.percentage} className="h-1" />
          </div>
        )}

        {/* Stage List */}
        <div className="space-y-2">
          {stageOrder.slice(0, -1).map((stage, index) => {
            const isComplete = currentStageIndex > index
            const isCurrent = status.stage === stage
            const isPending = currentStageIndex < index

            return (
              <div
                key={stage}
                className={`
                  flex items-center gap-3 p-2 rounded-md text-sm
                  ${isCurrent ? 'bg-primary/10' : ''}
                  ${isComplete ? 'text-muted-foreground' : ''}
                  ${isPending ? 'text-muted-foreground/50' : ''}
                `}
              >
                <span className="text-lg">
                  {isComplete ? '✓' : isCurrent ? stageIcons[stage] : '○'}
                </span>
                <span className={isCurrent ? 'font-medium' : ''}>
                  {getStageLabel(stage)}
                </span>
                {isCurrent && (
                  <Badge variant="secondary" className="ml-auto">
                    En progreso
                  </Badge>
                )}
              </div>
            )
          })}
        </div>

        {/* Estimated Time */}
        {status.stageInfo?.estimatedMinutes && status.stageInfo.estimatedMinutes > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Tiempo estimado: ~{status.stageInfo.estimatedMinutes} minutos
          </p>
        )}

        {/* Quality Score (when available) */}
        {status.qualityScore !== undefined && (
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold text-primary">
              {typeof status.qualityScore === 'object'
                ? (status.qualityScore as any)?.score ?? 0
                : status.qualityScore}/100
            </div>
            <div className="text-sm text-muted-foreground">
              Puntuación de calidad
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    uploading: 'Subiendo archivos',
    analyzing_structure: 'Analizando estructura',
    awaiting_confirmation: 'Esperando confirmación',
    processing_data: 'Procesando datos',
    semantic_analysis: 'Entendiendo tu negocio',
    validating_quality: 'Validando calidad',
    generating_examples: 'Generando ejemplos',
    ready: 'Listo',
  }
  return labels[stage] || stage
}
