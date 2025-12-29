'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { toast } from 'sonner'
import { onboardingApi } from '@/lib/api'
import { Leaf, FileSpreadsheet, Brain, MessageSquare, Loader2 } from 'lucide-react'

export default function HomePage() {
  const { user, token, isLoading, login, register } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')

  // Redirect if already logged in - check onboarding status first
  useEffect(() => {
    if (!isLoading && user && token) {
      setIsCheckingStatus(true)
      onboardingApi.checkReady(token)
        .then((status) => {
          if (status.ready && status.chatbot.available) {
            router.push('/chat')
          } else {
            router.push('/onboarding/upload')
          }
        })
        .catch(() => {
          // If error, default to upload page
          router.push('/onboarding/upload')
        })
        .finally(() => {
          setIsCheckingStatus(false)
        })
    }
  }, [user, token, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        await login(email, password)
        toast.success('¡Bienvenido de vuelta!')
      } else {
        await register({ email, password, name, organizationName })
        toast.success('¡Cuenta creada exitosamente!')
      }
      router.push('/onboarding/upload')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4 inline-block">
            <Leaf className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-4 bg-background">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-primary tracking-tight">IAvoqado</h1>
            </div>

            <h2 className="text-3xl font-semibold text-foreground">
              Tu asistente de datos con IA
            </h2>

            <p className="text-lg text-muted-foreground">
              Pregunta lo que quieras sobre tu negocio en español natural.
              Sin SQL, sin complicaciones. Solo respuestas.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-xl glass transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">Sube tus archivos Excel o CSV</span>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl glass transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">IA entiende tu negocio automáticamente</span>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl glass transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="rounded-lg bg-primary/10 p-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">Pregunta como si hablaras con un experto</span>
              </div>
            </div>
          </div>

          {/* Right: Auth Form */}

          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>
                {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </CardTitle>
              <CardDescription>
                {mode === 'login'
                  ? 'Ingresa a tu cuenta para continuar'
                  : 'Crea tu cuenta para empezar'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Tu nombre</label>
                      <Input
                        type="text"
                        placeholder="Juan Pérez"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Nombre de tu negocio</label>
                      <Input
                        type="text"
                        placeholder="Tacos El Güero"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Contraseña</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Cargando...'
                    : mode === 'login'
                    ? 'Entrar'
                    : 'Crear cuenta'
                  }
                </Button>

                <div className="text-center text-sm">
                  {mode === 'login' ? (
                    <p>
                      ¿No tienes cuenta?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('register')}
                        className="text-primary hover:underline"
                      >
                        Regístrate
                      </button>
                    </p>
                  ) : (
                    <p>
                      ¿Ya tienes cuenta?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-primary hover:underline"
                      >
                        Inicia sesión
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        <p className="flex items-center justify-center gap-1">
          © {new Date().getFullYear()} IAvoqado. Hecho con
          <Leaf className="h-4 w-4 text-primary" />
          en México.
        </p>
      </footer>
    </div>
  )
}
