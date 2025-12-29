'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Upload,
  Search,
  Hand,
  Cog,
  Brain,
  CheckCircle,
  Lightbulb,
  PartyPopper,
  XCircle,
  AlertCircle,
  ShieldCheck,
  HelpCircle,
  Check,
  Circle,
} from 'lucide-react'
import type { ProcessingStatus as ProcessingStatusType, StageInfo } from '@/lib/api'

interface ProcessingStatusProps {
  status: ProcessingStatusType
  onComplete: () => void
  onError: () => void
  onClarificationNeeded?: () => void
}

const stageOrder = [
  'uploading',
  'pre_validation',
  'analyzing_structure',
  'awaiting_confirmation',
  'processing_data',
  'semantic_analysis',
  'needs_clarification',
  'validating_quality',
  'generating_examples',
  'ready',
]

// Map stages to Lucide icons
const stageIcons: Record<string, ReactNode> = {
  uploading: <Upload className="h-12 w-12" />,
  pre_validation: <ShieldCheck className="h-12 w-12" />,
  analyzing_structure: <Search className="h-12 w-12" />,
  awaiting_confirmation: <Hand className="h-12 w-12" />,
  processing_data: <Cog className="h-12 w-12 animate-spin" />,
  semantic_analysis: <Brain className="h-12 w-12" />,
  needs_clarification: <HelpCircle className="h-12 w-12 text-amber-500" />,
  validating_quality: <CheckCircle className="h-12 w-12" />,
  generating_examples: <Lightbulb className="h-12 w-12" />,
  ready: <PartyPopper className="h-12 w-12 text-green-500" />,
  error: <XCircle className="h-12 w-12 text-destructive" />,
}

// Small icons for stage list
const stageIconsSmall: Record<string, ReactNode> = {
  uploading: <Upload className="h-5 w-5" />,
  pre_validation: <ShieldCheck className="h-5 w-5" />,
  analyzing_structure: <Search className="h-5 w-5" />,
  awaiting_confirmation: <Hand className="h-5 w-5" />,
  processing_data: <Cog className="h-5 w-5" />,
  semantic_analysis: <Brain className="h-5 w-5" />,
  needs_clarification: <HelpCircle className="h-5 w-5" />,
  validating_quality: <CheckCircle className="h-5 w-5" />,
  generating_examples: <Lightbulb className="h-5 w-5" />,
  ready: <PartyPopper className="h-5 w-5" />,
}

export function ProcessingStatus({ status, onComplete, onError, onClarificationNeeded }: ProcessingStatusProps) {
  const [dots, setDots] = useState('')

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Check for completion, clarification needed, etc.
  useEffect(() => {
    if (status.stage === 'ready') {
      onComplete()
    }
    // Handle clarification stage
    if (status.stage === 'needs_clarification' && onClarificationNeeded) {
      onClarificationNeeded()
    }
  }, [status.stage, onComplete, onClarificationNeeded])

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
            <XCircle className="h-5 w-5" />
            Error en el procesamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
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
        <div className="flex justify-center mb-4 text-primary">
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
                <span className="flex-shrink-0">
                  {isComplete ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : isCurrent ? (
                    stageIconsSmall[stage]
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
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
    pre_validation: 'Validando archivos',
    analyzing_structure: 'Analizando estructura',
    awaiting_confirmation: 'Esperando confirmación',
    processing_data: 'Procesando datos',
    semantic_analysis: 'Entendiendo tu negocio',
    needs_clarification: 'Necesitamos más información',
    validating_quality: 'Validando calidad',
    generating_examples: 'Generando ejemplos',
    ready: 'Listo',
  }
  return labels[stage] || stage
}
