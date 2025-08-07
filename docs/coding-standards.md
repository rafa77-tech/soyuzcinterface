# Padrões de Codificação - Soyuz Interface

## Visão Geral

Este documento estabelece os padrões de codificação para o projeto Soyuz Interface, um sistema de avaliação comportamental construído com Next.js, React, TypeScript e Tailwind CSS.

## Stack Tecnológico

- **Frontend**: Next.js 15.2.4, React 19
- **Linguagem**: TypeScript 5 (modo strict)
- **Estilização**: Tailwind CSS 4.1.9
- **UI Components**: shadcn/ui + Radix UI
- **Estado/Auth**: Supabase Auth + Context API
- **Testes**: Jest + Testing Library
- **Gerenciamento de Pacotes**: npm/pnpm

## Estrutura de Diretórios

```
/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial
├── components/            # Componentes React
│   ├── __tests__/         # Testes de componentes
│   ├── providers/         # Context Providers
│   ├── auth/             # Componentes de autenticação
│   └── ui/               # Componentes UI (shadcn/ui)
├── hooks/                # Custom React Hooks
├── lib/                  # Bibliotecas e utilitários
│   ├── supabase/         # Configuração Supabase
│   └── utils.ts          # Funções utilitárias
├── docs/                 # Documentação
└── public/               # Assets estáticos
```

## Convenções de Nomenclatura

### Arquivos e Diretórios
- **Componentes React**: `kebab-case.tsx` (ex: `auth-screen.tsx`)
- **Hooks**: `use-nome-do-hook.ts` (ex: `use-mobile.ts`)
- **Utilitários**: `kebab-case.ts` (ex: `utils.ts`)
- **Testes**: `nome-do-arquivo.test.tsx`
- **Tipos**: `types.ts`
- **Páginas**: seguir convenção Next.js App Router

### Variáveis e Funções
```typescript
// ✅ Correto - camelCase
const userName = 'João'
const isAuthenticated = true

// ✅ Correto - Funções descritivas
function validateCRM(crm: string): boolean
function handleFormSubmission(): void

// ❌ Evitar - snake_case
const user_name = 'João'
```

### Componentes React
```typescript
// ✅ Correto - PascalCase para componentes
export function AuthScreen({ onNext }: AuthScreenProps) {
  // ...
}

// ✅ Correto - Props com sufixo Props
interface AuthScreenProps {
  onNext: () => void
  onUserData: (data: UserData) => void
}
```

## Padrões de TypeScript

### Configuração Base
- Usar `strict: true` sempre
- Target ES6 mínimo
- Utilizar path mapping com `@/*` para imports

### Tipagem
```typescript
// ✅ Correto - Interfaces explícitas
interface UserData {
  id: string
  email: string
  fullName: string
  crm: string
  specialty: string
}

// ✅ Correto - Tipagem de props
interface ComponentProps {
  title: string
  isLoading?: boolean
  onSubmit: (data: FormData) => void
}

// ✅ Correto - Tipagem de funções utilitárias
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

### Importações
```typescript
// ✅ Correto - Order de imports
import React from 'react'
import { NextPage } from 'next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UserData } from '@/types'
```

## Padrões de React

### Componentes Funcionais
```typescript
// ✅ Padrão preferido - Export nomeado
export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <div className="container mx-auto">
      {/* conteúdo */}
    </div>
  )
}

// ✅ Alternativo para páginas - Export default
export default function HomePage() {
  return <div>Home</div>
}
```

### Estado e Hooks
```typescript
// ✅ Correto - useState com tipagem
const [isLoading, setIsLoading] = useState<boolean>(false)
const [userData, setUserData] = useState<UserData | null>(null)

// ✅ Correto - Custom hooks
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)
  // lógica do hook
  return isMobile
}
```

### Context Providers
```typescript
// ✅ Padrão - Provider + Hook personalizado
export function AuthProvider({ children }: { children: ReactNode }) {
  // lógica do provider
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

## Padrões de Estilização

### Tailwind CSS
```tsx
// ✅ Correto - Classes ordenadas logicamente
<button className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90">
  Botão
</button>

// ✅ Correto - Uso do utilitário cn()
<div className={cn("base-classes", variant && "variant-classes", className)}>
  Conteúdo
</div>
```

### Componentes shadcn/ui
```typescript
// ✅ Padrão - Variants com CVA
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-background hover:bg-accent",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

## Testes

### Estrutura de Testes
```typescript
// ✅ Padrão - Describe blocks organizados
describe('AuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render login form by default', async () => {
    renderAuthScreen()
    
    await waitFor(() => {
      expect(screen.getByText('Login Médico')).toBeInTheDocument()
    })
  })
})
```

### Mocking
```typescript
// ✅ Padrão - Mock de módulos externos
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    }
  }
}))
```

## Validação e Utilitários

### Funções de Validação
```typescript
// ✅ Padrão - Funções puras com documentação JSDoc
/**
 * Validates Brazilian CRM (Conselho Regional de Medicina) format
 * @param crm - CRM string to validate (e.g., "CRM/SP 123456")
 * @returns boolean indicating if CRM format is valid
 */
export function validateCRM(crm: string): boolean {
  if (!crm || typeof crm !== 'string') return false
  
  const crmRegex = /^CRM\/[A-Z]{2}\s\d{4,6}$/
  return crmRegex.test(crm.trim())
}
```

## Internacionalização

### Textos em Português
- Interface em português brasileiro (pt-BR)
- Mensagens de erro e validação em português
- Comentários em inglês para código, português para documentação

```typescript
// ✅ Interface em português
export const metadata: Metadata = {
  title: 'Soyuz - Sistema de Avaliação Comportamental',
  description: 'Descubra seu perfil comportamental através de uma análise científica completa'
}

// ✅ Comentários em inglês para código
// Validates user input before submission
```

## Performance e Otimização

### Imports Dinâmicos
```typescript
// ✅ Para componentes pesados
const HeavyComponent = dynamic(() => import('@/components/heavy-component'), {
  loading: () => <div>Carregando...</div>
})
```

### Memoização
```typescript
// ✅ Para computações custosas
const expensiveValue = useMemo(() => {
  return complexCalculation(data)
}, [data])

// ✅ Para componentes com props estáveis
const MemoizedComponent = React.memo(Component)
```

## Configuração de Desenvolvimento

### Scripts NPM
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Ferramentas de Qualidade
- **Linting**: ESLint com config Next.js
- **Testing**: Jest + Testing Library
- **Type Checking**: TypeScript em modo strict

## Boas Práticas

### Segurança
- Nunca commitar chaves de API ou secrets
- Validar sempre dados do cliente
- Usar variáveis de ambiente para configurações

### Acessibilidade
```tsx
// ✅ Labels associadas a inputs
<label htmlFor="email">E-mail *</label>
<input id="email" type="email" required />

// ✅ Atributos ARIA quando necessário
<button aria-label="Fechar modal">×</button>
```

### Performance
- Usar Next.js Image para otimização de imagens
- Implementar loading states adequados
- Evitar re-renders desnecessários

### Manutenibilidade
- Componentes pequenos e focados
- Separar lógica de apresentação
- Documentar APIs e componentes complexos
- Testes para funcionalidades críticas

## Comandos de Verificação

Antes de fazer commit, executar:

```bash
npm run lint        # Verificar linting
npm run test        # Executar testes
npm run build       # Verificar build production
```

---

Este documento é um guia vivo e deve ser atualizado conforme o projeto evolui.