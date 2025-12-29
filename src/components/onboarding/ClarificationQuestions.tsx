'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  SkipForward,
  Check,
  Loader2,
  Store,
  Briefcase,
  ShoppingCart,
  Factory,
  UtensilsCrossed,
  Building2,
} from 'lucide-react'
import type { ClarificationQuestion, ClarificationAnswer, ClarificationState } from '@/lib/api'

interface ClarificationQuestionsProps {
  clarification: ClarificationState
  onSubmit: (answers: ClarificationAnswer[]) => Promise<void>
  onSkip: () => Promise<void>
}

// Map icon identifiers to Lucide components
const iconMap: Record<string, React.ReactNode> = {
  'utensils-crossed': <UtensilsCrossed className="h-5 w-5" />,
  'store': <Store className="h-5 w-5" />,
  'briefcase': <Briefcase className="h-5 w-5" />,
  'shopping-cart': <ShoppingCart className="h-5 w-5" />,
  'factory': <Factory className="h-5 w-5" />,
  'building': <Building2 className="h-5 w-5" />,
}

// Importance badge variants
const importanceBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  critical: { label: 'Importante', variant: 'destructive' },
  high: { label: 'Alta prioridad', variant: 'default' },
  medium: { label: 'Media', variant: 'secondary' },
  low: { label: 'Opcional', variant: 'outline' },
}

export function ClarificationQuestions({
  clarification,
  onSubmit,
  onSkip,
}: ClarificationQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)

  const handleOptionSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleSubmit = async () => {
    const answersArray: ClarificationAnswer[] = Object.entries(answers)
      .filter(([_, value]) => value.trim() !== '')
      .map(([questionId, answer]) => ({ questionId, answer }))

    if (answersArray.length === 0) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(answersArray)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    setIsSkipping(true)
    try {
      await onSkip()
    } finally {
      setIsSkipping(false)
    }
  }

  const answeredCount = Object.values(answers).filter((v) => v.trim() !== '').length
  const totalQuestions = clarification.questions.length

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
            <HelpCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle>Necesitamos un poco más de contexto</CardTitle>
            <CardDescription>
              Responde estas preguntas para que el chatbot entienda mejor tus datos
            </CardDescription>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
          <span>Respondidas: {answeredCount} de {totalQuestions}</span>
          {clarification.qualityScore !== undefined && (
            <>
              <span className="text-muted-foreground/50">|</span>
              <span>Calidad actual: {clarification.qualityScore}%</span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {clarification.questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={answers[question.id] || ''}
            onOptionSelect={(value) => handleOptionSelect(question.id, value)}
            onTextChange={(value) => handleTextChange(question.id, value)}
          />
        ))}
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        {/* Skip warning */}
        <Alert variant="default" className="w-full bg-muted/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Si omites estas preguntas, el chatbot puede dar respuestas menos precisas.
          </AlertDescription>
        </Alert>

        {/* Action buttons */}
        <div className="flex justify-between w-full gap-4">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isSubmitting || isSkipping}
          >
            {isSkipping ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <SkipForward className="h-4 w-4 mr-2" />
            )}
            Omitir
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={answeredCount === 0 || isSubmitting || isSkipping}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Continuar
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

// Individual question card component
interface QuestionCardProps {
  question: ClarificationQuestion
  value: string
  onOptionSelect: (value: string) => void
  onTextChange: (value: string) => void
}

function QuestionCard({ question, value, onOptionSelect, onTextChange }: QuestionCardProps) {
  const badge = importanceBadge[question.importance]
  const hasOptions = question.options && question.options.length > 0

  return (
    <div className="p-4 border rounded-xl space-y-4 transition-all hover:shadow-sm">
      {/* Question header */}
      <div className="flex items-start justify-between gap-4">
        <p className="font-medium">{question.question}</p>
        <Badge variant={badge.variant} className="flex-shrink-0">
          {badge.label}
        </Badge>
      </div>

      {/* Sample values context */}
      {question.context?.sampleValues && question.context.sampleValues.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <span>Ejemplos: </span>
          <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
            {question.context.sampleValues.join(', ')}
          </span>
        </div>
      )}

      {/* Options or text input */}
      {hasOptions ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {question.options!.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onOptionSelect(option.value)}
              className={`
                flex items-center gap-3 p-3 rounded-lg border text-left
                transition-all duration-200
                ${
                  value === option.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {option.icon && iconMap[option.icon] && (
                <span className="flex-shrink-0 text-muted-foreground">
                  {iconMap[option.icon]}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {option.description}
                  </div>
                )}
              </div>
              {value === option.value && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      ) : (
        <Input
          placeholder="Escribe tu respuesta..."
          value={value}
          onChange={(e) => onTextChange(e.target.value)}
          className="w-full"
        />
      )}

      {/* Custom answer for options */}
      {hasOptions && (
        <div className="pt-2 border-t">
          <Input
            placeholder="O escribe otra respuesta..."
            value={
              question.options!.some((o) => o.value === value)
                ? ''
                : value
            }
            onChange={(e) => onTextChange(e.target.value)}
            className="w-full text-sm"
          />
        </div>
      )}
    </div>
  )
}
