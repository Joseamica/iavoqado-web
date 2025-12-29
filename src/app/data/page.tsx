'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { dataSourcesApi, type DataSource, type DataSourcePreview, type DocumentContent } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Leaf, MessageSquare, Upload, FileSpreadsheet, FileText, 
  FileType, Database, FolderOpen, Eye, Trash2, Loader2 
} from 'lucide-react'

export default function DataPage() {
  const { token, user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [previewData, setPreviewData] = useState<DataSourcePreview | null>(null)
  const [previewSource, setPreviewSource] = useState<DataSource | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [documentData, setDocumentData] = useState<DocumentContent | null>(null)
  const [documentSource, setDocumentSource] = useState<DataSource | null>(null)
  const [isLoadingDocument, setIsLoadingDocument] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<DataSource | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load data sources
  useEffect(() => {
    if (!token) return

    setIsLoadingData(true)
    dataSourcesApi.list(token)
      .then(result => {
        setDataSources(result.dataSources)
      })
      .catch(error => {
        console.error('Error loading data sources:', error)
        toast.error('Error al cargar los datos')
      })
      .finally(() => {
        setIsLoadingData(false)
      })
  }, [token])

  // Handle preview
  const handlePreview = async (source: DataSource) => {
    if (!token) return

    setPreviewSource(source)
    setIsLoadingPreview(true)
    setPreviewData(null)

    try {
      const result = await dataSourcesApi.preview(token, source.id, 10)
      setPreviewData(result)
    } catch (error) {
      console.error('Preview error:', error)
      toast.error('Error al cargar la vista previa')
      setPreviewSource(null)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  // Handle document preview (PDF/Word)
  const handleDocumentPreview = async (source: DataSource) => {
    if (!token) return

    setDocumentSource(source)
    setIsLoadingDocument(true)
    setDocumentData(null)

    try {
      const result = await dataSourcesApi.document(token, source.id)
      setDocumentData(result)
    } catch (error) {
      console.error('Document preview error:', error)
      toast.error('Error al cargar el documento')
      setDocumentSource(null)
    } finally {
      setIsLoadingDocument(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!token || !deleteConfirm) return

    setIsDeleting(true)
    try {
      await dataSourcesApi.delete(token, deleteConfirm.id)
      setDataSources(prev => prev.filter(ds => ds.id !== deleteConfirm.id))
      toast.success('Datos eliminados correctamente')
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Error al eliminar los datos')
    } finally {
      setIsDeleting(false)
    }
  }

  // Format file size
  const formatSize = (bytes?: number) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Hoy'
    if (days === 1) return 'Ayer'
    if (days < 7) return `Hace ${days} dias`
    return date.toLocaleDateString('es-MX')
  }

  // Format number
  const formatNumber = (num?: number) => {
    if (!num) return '-'
    return num.toLocaleString('es-MX')
  }

  // Get status badge
  const getStatusBadge = (status: DataSource['status']) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Listo</Badge>
      case 'processing':
      case 'syncing':
        return <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">Procesando...</Badge>
      case 'error':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Error</Badge>
      case 'pending':
        return <Badge className="bg-muted text-muted-foreground">Pendiente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get file icon
  const getFileIcon = (type: string) => {
    const iconClass = "h-6 w-6 text-primary"
    switch (type) {
      case 'excel': return <FileSpreadsheet className={iconClass} />
      case 'csv': return <FileText className={iconClass} />
      case 'pdf': return <FileType className={iconClass} />
      case 'docx':
      case 'doc': return <FileText className={iconClass} />
      case 'postgresql':
      case 'mysql':
      case 'sqlserver': return <Database className={iconClass} />
      default: return <FolderOpen className={iconClass} />
    }
  }

  // Show loading while auth is being validated
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Redirect if not logged in
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-foreground">Debes iniciar sesion para continuar</p>
          <Button onClick={() => router.push('/')}>Ir a inicio</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">IAvoqado</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/chat')}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Chat
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/onboarding/upload')}>
              <Upload className="h-4 w-4 mr-1" />
              Subir archivos
            </Button>
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mis Datos</h1>
            <p className="text-muted-foreground">
              {dataSources.length} archivo{dataSources.length !== 1 ? 's' : ''} cargado{dataSources.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {isLoadingData ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground mt-4">Cargando datos...</p>
          </div>
        ) : dataSources.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <div className="rounded-full bg-primary/10 p-4 inline-block mb-4">
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-foreground">No tienes datos cargados</h3>
            <p className="text-muted-foreground mb-4">
              Sube archivos Excel o CSV para empezar a analizar tus datos con IA
            </p>
            <Button onClick={() => router.push('/onboarding/upload')}>
              Subir archivos
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {dataSources.map(source => (
              <div
                key={source.id}
                className="bg-card rounded-lg border p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      {getFileIcon(source.type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{source.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getStatusBadge(source.status)}
                        <span>•</span>
                        <span>{formatNumber(source.rowCount)} filas</span>
                        <span>•</span>
                        <span>{formatSize(source.sizeBytes)}</span>
                        <span>•</span>
                        <span>{formatDate(source.createdAt)}</span>
                      </div>
                      {source.status === 'error' && source.errorMessage && (
                        <p className="text-sm text-destructive mt-1">
                          Error: {source.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Preview button for Excel/CSV with data */}
                    {source.status === 'ready' && (source.type === 'excel' || source.type === 'csv') && source.rowCount && source.rowCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(source)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    )}
                    {/* View button for documents (PDF/Word) */}
                    {source.status === 'ready' && (source.type === 'pdf' || source.type === 'docx' || source.type === 'doc') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDocumentPreview(source)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteConfirm(source)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Preview Dialog */}
      <Dialog open={!!previewSource} onOpenChange={() => { setPreviewSource(null); setPreviewData(null) }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewSource && getFileIcon(previewSource.type)}
              {previewSource?.name}
            </DialogTitle>
            <DialogDescription>
              {previewData ? (
                <>
                  Mostrando {previewData.previewRows} de {formatNumber(previewData.totalRows)} filas
                </>
              ) : (
                'Cargando vista previa...'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {isLoadingPreview ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-4">Cargando datos...</p>
              </div>
            ) : previewData ? (
              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewData.columns.map(col => (
                        <TableHead key={col.name} className="whitespace-nowrap">
                          {col.name}
                          {col.semanticType && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({col.semanticType})
                            </span>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.rows.map((row, idx) => (
                      <TableRow key={idx}>
                        {previewData.columns.map(col => (
                          <TableCell key={col.name} className="whitespace-nowrap max-w-[200px] truncate">
                            {row[col.name] ?? '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setPreviewSource(null); setPreviewData(null) }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar datos</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que quieres eliminar "{deleteConfirm?.name}"?
              Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!documentSource} onOpenChange={() => { setDocumentSource(null); setDocumentData(null) }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {documentSource && getFileIcon(documentSource.type)}
              {documentSource?.name}
            </DialogTitle>
            <DialogDescription>
              {documentData ? (
                <>
                  {documentData.wordCount} palabras
                  {documentData.category && <> • Categoria: {documentData.category}</>}
                </>
              ) : (
                'Cargando documento...'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {isLoadingDocument ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-4">Cargando documento...</p>
              </div>
            ) : documentData ? (
              <div className="space-y-4">
                {/* Summary if available */}
                {documentData.content.summary && (
                  <div className="bg-primary/10 rounded-lg p-4">
                    <h4 className="font-medium text-primary mb-2">Resumen</h4>
                    <p className="text-sm text-foreground">
                      {documentData.content.summary}
                    </p>
                  </div>
                )}

                {/* Extracted entities if available */}
                {documentData.content.extractedEntities && documentData.content.extractedEntities.length > 0 && (
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium mb-2 text-foreground">Entidades detectadas</h4>
                    <div className="flex flex-wrap gap-2">
                      {documentData.content.extractedEntities.slice(0, 10).map((entity: any, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {typeof entity === 'string' ? entity : entity.name || entity.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw text */}
                {documentData.content.rawText && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2 text-foreground">Contenido</h4>
                    <div className="text-sm whitespace-pre-wrap max-h-[300px] overflow-auto bg-muted p-3 rounded font-mono text-foreground">
                      {documentData.content.rawText}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDocumentSource(null); setDocumentData(null) }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
