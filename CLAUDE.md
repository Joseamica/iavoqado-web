# IAvoqado Web

Next.js frontend for IAvoqado - AI-powered data chatbot for Mexican B2B businesses.

## Quick Start

```bash
bun install
bun run dev    # Port 3001
```

## Tech Stack

- **Framework**: Next.js 16 (App Router, RSC)
- **UI**: shadcn/ui (new-york style) + Tailwind CSS v4
- **Icons**: Lucide React (NO emojis)
- **State**: React hooks + Context
- **Notifications**: Sonner

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Login/Register
│   ├── chat/             # AI chat interface
│   ├── data/             # Data management
│   └── onboarding/       # File upload flow
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── chat/             # Chat components
│   └── onboarding/       # Onboarding components
└── lib/
    ├── api.ts            # Backend API client
    ├── auth-context.tsx  # Auth context
    └── utils.ts          # Utilities
```

---

## Design Guidelines

> **IMPORTANTE**: Seguir estas reglas para TODA la UI.

### Principios de Diseño 2026

| Principio | Descripción |
|-----------|-------------|
| **Neo-Minimalism** | Simplicidad con calidez. Espaciado generoso, tipografía limpia |
| **Glassmorphism** | Fondos translúcidos con blur en cards y modales |
| **Microinteractions** | Animaciones sutiles en hover, focus y transiciones |
| **Accesibilidad** | Contraste AAA, navegación por teclado, aria-labels |

### Iconos (NO Emojis)

**PROHIBIDO**: Usar emojis (🥑📊🧠💬📁) en cualquier parte de la UI.

**CORRECTO**: Usar iconos de Lucide React:

```tsx
import { FileSpreadsheet, Brain, MessageSquare, Upload, FolderOpen } from 'lucide-react'

// Usar así:
<FileSpreadsheet className="h-5 w-5" />
<Brain className="h-5 w-5" />
<MessageSquare className="h-5 w-5" />
```

**Mapeo de reemplazos**:
| Emoji | Lucide Icon |
|-------|-------------|
| 🥑 | `<Leaf />` o logo SVG |
| 📊 | `<FileSpreadsheet />` |
| 📁 | `<FolderOpen />` |
| 📄 | `<FileText />` |
| 📕 | `<FileType />` (PDF) |
| 📘 | `<FileText />` (Word) |
| 🧠 | `<Brain />` |
| 💬 | `<MessageSquare />` |
| ✅ | `<Check />` o `<CheckCircle />` |
| ❌ | `<X />` o `<XCircle />` |
| ⚠️ | `<AlertTriangle />` |
| 💰 | `<DollarSign />` o `<Banknote />` |
| 📦 | `<Package />` |
| 👥 | `<Users />` |
| 🏪 | `<Store />` |
| 🍽️ | `<UtensilsCrossed />` |

### Paleta de Colores

Usar variables CSS definidas en `globals.css`. Paleta basada en verde aguacate:

```css
/* Hero y fondos principales */
background: linear-gradient(135deg, hsl(145 40% 96%), hsl(160 30% 92%));

/* Glassmorphism */
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

/* Dark mode glass */
.dark .glass {
  background: rgba(30, 30, 30, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Componentes shadcn/ui

**Instalados**: alert, avatar, badge, button, card, dialog, dropdown-menu, input, progress, scroll-area, separator, skeleton, sonner, table, tabs, textarea

**Usar así** (importar desde `@/components/ui/`):

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
```

**Para agregar nuevos componentes**:
```bash
bunx shadcn@latest add tooltip select command sheet
```

### Espaciado

Usar sistema de 4px base. Clases Tailwind recomendadas:

| Uso | Clase |
|-----|-------|
| Entre secciones | `space-y-12` o `gap-12` |
| Entre cards | `space-y-6` o `gap-6` |
| Padding de cards | `p-6` |
| Padding de secciones | `py-16` o `py-24` |
| Margin de texto | `mb-4` |

### Border Radius

Usar radios grandes para look moderno:

```tsx
// Cards y contenedores
className="rounded-2xl"  // 16px

// Botones y inputs
className="rounded-xl"   // 12px

// Badges y chips
className="rounded-full" // píldora
```

### Animaciones y Transiciones

**Transiciones base** (agregar a elementos interactivos):
```tsx
className="transition-all duration-200 ease-out"
```

**Hover effects**:
```tsx
// Cards
className="hover:shadow-lg hover:-translate-y-1"

// Botones
className="hover:scale-[1.02] active:scale-[0.98]"

// Links
className="hover:text-primary"
```

**Loading states**:
```tsx
// Usar Skeleton de shadcn
<Skeleton className="h-4 w-full" />

// O spinner
<Loader2 className="h-4 w-4 animate-spin" />
```

### Tipografía

Usar las fuentes del sistema (Geist Sans/Mono ya configuradas):

```tsx
// Headings
<h1 className="text-4xl font-bold tracking-tight">
<h2 className="text-2xl font-semibold">
<h3 className="text-lg font-medium">

// Body
<p className="text-base text-muted-foreground">

// Small/Caption
<span className="text-sm text-muted-foreground">
```

### Estados de Error

Usar componente Alert de shadcn con iconos:

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>{errorMessage}</AlertDescription>
</Alert>
```

### Empty States

Diseño centrado con icono grande:

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-medium mb-2">Sin datos aún</h3>
  <p className="text-muted-foreground max-w-sm mb-6">
    Sube tus archivos Excel o CSV para comenzar
  </p>
  <Button>
    <Upload className="h-4 w-4 mr-2" />
    Subir archivos
  </Button>
</div>
```

---

## Accesibilidad (A11y)

### Checklist obligatorio

- [ ] Todos los inputs tienen `<label>` asociado
- [ ] Botones de icono tienen `aria-label`
- [ ] Imágenes tienen `alt` descriptivo
- [ ] Contraste mínimo 4.5:1 para texto
- [ ] Focus visible en todos los elementos interactivos
- [ ] Navegación por teclado funcional

```tsx
// Ejemplo botón con aria-label
<Button
  variant="ghost"
  size="icon"
  aria-label="Cerrar diálogo"
>
  <X className="h-4 w-4" />
</Button>
```

---

## Backend API

Base URL: `http://localhost:3000/api/v1`

```typescript
// Autenticación
POST /auth/register
POST /auth/login
GET  /auth/me

// Onboarding
POST /onboarding/process/start   // Upload files
POST /onboarding/process/confirm // Confirm schema
GET  /onboarding/ready           // Check if ready

// Query
POST /query/ask                  // Natural language query
GET  /query/history              // Query history
GET  /query/suggestions          // Suggested queries
```

---

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```
