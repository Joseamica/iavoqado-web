'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertCircle,
  FileWarning,
  FileX,
  FileQuestion,
  Upload,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import type { ValidationError, ValidationWarning } from '@/lib/api'

interface ValidationErrorsProps {
  errors: ValidationError[]
  warnings?: ValidationWarning[]
  validFilesCount?: number
  onReupload: () => void
  onContinueWithValid?: () => void
}

// Map error types to icons
const errorIcons: Record<string, React.ReactNode> = {
  corrupt: <FileX className="h-5 w-5" />,
  empty: <FileQuestion className="h-5 w-5" />,
  no_headers: <FileWarning className="h-5 w-5" />,
  schema_failed: <FileWarning className="h-5 w-5" />,
  unsupported: <FileX className="h-5 w-5" />,
  too_large: <FileWarning className="h-5 w-5" />,
}

// Human-readable error type labels
const errorLabels: Record<string, string> = {
  corrupt: 'Archivo dañado',
  empty: 'Sin datos',
  no_headers: 'Sin encabezados',
  schema_failed: 'Estructura inválida',
  unsupported: 'Formato no soportado',
  too_large: 'Archivo muy grande',
}

export function ValidationErrors({
  errors,
  warnings = [],
  validFilesCount = 0,
  onReupload,
  onContinueWithValid,
}: ValidationErrorsProps) {
  const hasValidFiles = validFilesCount > 0
  const canContinue = hasValidFiles && onContinueWithValid

  return (
    <Card className="w-full max-w-2xl mx-auto border-destructive/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-destructive/10 p-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-destructive">
              Problemas con algunos archivos
            </CardTitle>
            <CardDescription>
              {errors.length === 1
                ? 'Un archivo no pudo ser procesado'
                : `${errors.length} archivos no pudieron ser procesados`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Errors list */}
        {errors.map((error, index) => (
          <Alert key={`${error.fileId}-${index}`} variant="destructive">
            <div className="flex items-start gap-3">
              {errorIcons[error.errorType] || <FileX className="h-5 w-5" />}
              <div className="flex-1 min-w-0">
                <AlertTitle className="flex items-center gap-2">
                  <span className="truncate">{error.fileName}</span>
                  <span className="text-xs font-normal bg-destructive/20 px-1.5 py-0.5 rounded">
                    {errorLabels[error.errorType] || error.errorType}
                  </span>
                </AlertTitle>
                <AlertDescription className="mt-1">
                  <p>{error.message}</p>
                  {error.suggestion && (
                    <p className="mt-2 text-sm opacity-80">
                      <strong>Sugerencia:</strong> {error.suggestion}
                    </p>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}

        {/* Warnings list (if any) */}
        {warnings.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-3">
              Advertencias
            </h4>
            {warnings.map((warning, index) => (
              <Alert key={`${warning.fileId}-${index}`} className="mb-2 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                <FileWarning className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-300">
                  {warning.fileName}
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-400">
                  {warning.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Valid files notice */}
        {hasValidFiles && (
          <Alert className="bg-green-50/50 border-green-500/30 dark:bg-green-950/20">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <ArrowRight className="h-4 w-4" />
              <span>
                {validFilesCount === 1
                  ? '1 archivo válido puede continuar'
                  : `${validFilesCount} archivos válidos pueden continuar`}
              </span>
            </div>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={onReupload}
          className="w-full sm:w-auto"
        >
          <Upload className="h-4 w-4 mr-2" />
          Subir archivos nuevamente
        </Button>

        {canContinue && (
          <Button
            onClick={onContinueWithValid}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Continuar con archivos válidos
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
