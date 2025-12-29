'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import type { ProposedModel, ProposedTable } from '@/lib/api'

interface ModelReviewProps {
  model: ProposedModel
  onConfirm: (modifications?: any) => void
  onCancel: () => void
  isConfirming?: boolean
}

const semanticTypeLabels: Record<string, string> = {
  identifier: 'ID',
  text: 'Texto',
  date: 'Fecha',
  datetime: 'Fecha/Hora',
  currency: 'Dinero',
  number: 'Número',
  percentage: 'Porcentaje',
  email: 'Email',
  phone: 'Teléfono',
  boolean: 'Sí/No',
}

const semanticTypeColors: Record<string, string> = {
  identifier: 'bg-purple-100 text-purple-800',
  date: 'bg-blue-100 text-blue-800',
  datetime: 'bg-blue-100 text-blue-800',
  currency: 'bg-green-100 text-green-800',
  number: 'bg-yellow-100 text-yellow-800',
  text: 'bg-gray-100 text-gray-800',
}

function TableCard({ table }: { table: ProposedTable }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{table.name}</CardTitle>
            {table.isMasterData ? (
              <Badge variant="secondary">Datos Maestros</Badge>
            ) : (
              <Badge variant="outline">Transaccional</Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            ~{table.estimatedRows.toLocaleString()} filas
          </span>
        </div>
        <CardDescription>
          Fuente: {table.sourceFiles.join(', ')}
          {table.mergedFrom && (
            <span className="block text-xs mt-1">
              Fusionado de: {table.mergedFrom.join(' + ')}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Columna</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Original</TableHead>
              <TableHead className="text-right">Rol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.columns.map((col) => (
              <TableRow key={col.name}>
                <TableCell className="font-medium">{col.name}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={semanticTypeColors[col.semanticType] || ''}
                  >
                    {semanticTypeLabels[col.semanticType] || col.semanticType}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {col.originalNames.join(', ')}
                </TableCell>
                <TableCell className="text-right">
                  {col.isPrimaryKey && <Badge>PK</Badge>}
                  {col.isForeignKey && <Badge variant="outline">FK</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function ModelReview({ model, onConfirm, onCancel, isConfirming }: ModelReviewProps) {
  const [activeTab, setActiveTab] = useState('tables')

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Revisa el Modelo Propuesto</h1>
        <p className="text-muted-foreground">
          Analizamos tus archivos y proponemos esta estructura. Revísala antes de continuar.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{model.summary.totalFiles}</div>
            <div className="text-sm text-muted-foreground">Archivos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{model.summary.totalTables}</div>
            <div className="text-sm text-muted-foreground">Tablas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{model.summary.totalRows.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Filas estimadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {model.warnings.length > 0 && (
        <Alert>
          <AlertTitle>Advertencias</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {model.warnings.map((warning, i) => (
                <li key={i} className="text-sm">{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tables">
            Tablas ({model.tables.length})
          </TabsTrigger>
          <TabsTrigger value="relationships">
            Relaciones ({model.relationships.length})
          </TabsTrigger>
          <TabsTrigger value="terminology">
            Terminología ({model.terminology.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          {model.tables.map((table) => (
            <TableCard key={table.name} table={table} />
          ))}
        </TabsContent>

        <TabsContent value="relationships" className="space-y-4">
          {model.relationships.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No se detectaron relaciones entre tablas.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Desde</TableHead>
                      <TableHead></TableHead>
                      <TableHead>Hacia</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Confianza</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {model.relationships.map((rel, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <span className="font-medium">{rel.fromTable}</span>
                          <span className="text-muted-foreground">.{rel.fromColumn}</span>
                        </TableCell>
                        <TableCell className="text-center">→</TableCell>
                        <TableCell>
                          <span className="font-medium">{rel.toTable}</span>
                          <span className="text-muted-foreground">.{rel.toColumn}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rel.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {Math.round(rel.confidence * 100)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="terminology" className="space-y-4">
          {model.terminology.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No se detectó terminología específica del negocio.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {model.terminology.map((term, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <Badge variant="secondary" className="mt-0.5">
                        {term.term}
                      </Badge>
                      <div>
                        <p className="font-medium">{term.meaning}</p>
                        <p className="text-sm text-muted-foreground">
                          Encontrado en: {term.foundIn.join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isConfirming}
        >
          Cancelar y empezar de nuevo
        </Button>
        <Button
          onClick={() => onConfirm()}
          disabled={isConfirming}
          size="lg"
        >
          {isConfirming ? 'Confirmando...' : 'Confirmar y procesar datos'}
        </Button>
      </div>
    </div>
  )
}
