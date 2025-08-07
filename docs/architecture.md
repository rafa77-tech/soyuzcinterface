# Projeto Soyuz Brownfield Enhancement Architecture

## Introduction

This document outlines the architectural approach for enhancing Projeto Soyuz with backend implementation and authentication system using Supabase. Its primary goal is to serve as the guiding architectural blueprint for AI-driven development of new features while ensuring seamless integration with the existing system.

**Relationship to Existing Architecture:**
This document supplements existing project architecture by defining how new components will integrate with current systems. Where conflicts arise between new and existing patterns, this document provides guidance on maintaining consistency while implementing enhancements.

### Existing Project Analysis

**Current Project State**
- **Primary Purpose:** Ferramenta de avaliação de soft skills para médicos implementada como aplicação Next.js frontend-only
- **Current Tech Stack:** Next.js 15.2.4, React 19, TypeScript 5, Tailwind CSS 4.1.9, Radix UI components
- **Architecture Style:** Next.js App Router com estrutura baseada em componentes React modulares
- **Deployment Method:** Configurado para Vercel com build otimizado

**Available Documentation**
- docs/PRD_brownfield.md - Comprehensive product requirements document
- docs/documentacao_inicial.md - Initial brownfield analysis and technical overview
- package.json - Dependencies and build configuration

**Identified Constraints**
- Perda de dados: Resultados perdidos ao fechar navegador - nenhuma persistência
- Ausência de autenticação: auth-screen.tsx apenas coleta dados básicos sem validação
- Estado volátil: Todo progresso da avaliação existe apenas na sessão atual
- Escalabilidade limitada: Arquitetura não suporta múltiplos usuários ou sessões concorrentes

### Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial Architecture | 2025-08-07 | 1.0 | Brownfield enhancement architecture for Supabase integration | Winston |

## Enhancement Scope and Integration Strategy

### Enhancement Overview
**Enhancement Type:** Brownfield Backend Integration
**Scope:** Implementação de sistema de autenticação Supabase e persistência de dados para avaliações médicas
**Integration Impact:** Moderado - Requer refatoração do state management e adição de API layer

### Integration Approach
**Code Integration Strategy:** Integração incremental preservando componentes de UI existentes, adicionando layer de persistência através de Supabase SDK
**Database Integration:** PostgreSQL via Supabase com tabelas profiles e assessments conforme definido no PRD
**API Integration:** Next.js API Routes para endpoints RESTful (/api/assessment, /api/profile) com autenticação JWT
**UI Integration:** Refatoração mínima do auth-screen.tsx, mantendo design system Radix UI/Tailwind existente

### Compatibility Requirements
- **Existing API Compatibility:** N/A - Atualmente não há APIs, primeira implementação seguirá padrões RESTful
- **Database Schema Compatibility:** Estrutura nova baseada no PRD, sem conflitos com sistema atual
- **UI/UX Consistency:** Manter tema dark/light existente e padrões de navegação entre telas
- **Performance Impact:** Mínimo - Adição de <200ms para operações de banco devido à latência Supabase

## Tech Stack Alignment

### Existing Technology Stack
| Category | Current Technology | Version | Usage in Enhancement | Notes |
|----------|-------------------|---------|---------------------|--------|
| **Framework** | Next.js | 15.2.4 | API Routes para backend, manter App Router | Base sólida para full-stack |
| **Frontend** | React | 19 | Manter componentes existentes | Compatível com Supabase SDK |
| **Styling** | Tailwind CSS | 4.1.9 | Manter design system atual | Nenhuma mudança necessária |
| **UI Components** | Radix UI | latest | Preservar componentes de form/auth | Compatível com formulários Supabase |
| **TypeScript** | TypeScript | 5 | Tipagem para APIs e Supabase client | Essencial para type safety |
| **Build/Deploy** | Vercel | - | Manter deployment pipeline | Otimizado para Next.js + Supabase |

### New Technology Additions
| Technology | Version | Purpose | Rationale | Integration Method |
|-----------|---------|---------|-----------|-------------------|
| **Supabase JS SDK** | ^2.39.0 | Authentication & Database | Solução completa auth+DB, integração nativa Next.js | npm install + client setup |
| **Supabase Auth Helpers** | ^0.4.0 | SSR Auth para Next.js | Sessões seguras server-side | Server/Client separation |

## Data Models and Schema Changes

### New Data Models

#### Profile Model
**Purpose:** Armazenar dados profissionais específicos de médicos, estendendo o sistema de auth padrão do Supabase
**Integration:** Relaciona-se com auth.users via Foreign Key, permitindo profile management separado da autenticação

**Key Attributes:**
- `id: UUID` - Chave primária referenciando auth.users(id)
- `name: TEXT NOT NULL` - Nome completo do médico
- `email: TEXT NOT NULL` - Email profissional (sincronizado com auth)
- `phone: TEXT` - Telefone de contato
- `crm: TEXT NOT NULL` - Registro profissional obrigatório
- `specialty: TEXT NOT NULL` - Especialidade médica
- `avatar_url: TEXT` - URL opcional para foto de perfil
- `created_at/updated_at: TIMESTAMPTZ` - Timestamps de auditoria

**Relationships:**
- **With Existing:** One-to-One com auth.users (Supabase managed)
- **With New:** One-to-Many com assessments

#### Assessment Model  
**Purpose:** Persistir resultados completos de avaliações comportamentais, mantendo histórico e permitindo análise longitudinal
**Integration:** Vincula-se ao usuário autenticado e preserva a estrutura JSON dos resultados existentes

**Key Attributes:**
- `id: UUID` - Chave primária gerada automaticamente
- `user_id: UUID NOT NULL` - Referência ao usuário autenticado
- `type: TEXT NOT NULL` - Tipo de avaliação ('complete', 'disc', 'soft_skills', 'sjt')
- `status: TEXT DEFAULT 'in_progress'` - Status da avaliação
- `disc_results: JSONB` - Resultados DISC preservando estrutura atual {D, I, S, C}
- `soft_skills_results: JSONB` - Resultados soft skills {comunicacao, lideranca, etc}
- `sjt_results: JSONB` - Resultados SJT como array de scores
- `created_at: TIMESTAMPTZ` - Início da avaliação
- `completed_at: TIMESTAMPTZ` - Conclusão da avaliação

**Relationships:**
- **With Existing:** Many-to-One com auth.users
- **With New:** Belongs-to Profile via user_id

### Schema Integration Strategy

**Database Changes Required:**
- **New Tables:** profiles, assessments
- **Modified Tables:** Nenhuma - sistema atual não possui BD
- **New Indexes:** idx_assessments_user_id, idx_assessments_created_at, idx_profiles_crm
- **Migration Strategy:** DDL scripts executados via Supabase Dashboard/CLI

**Backward Compatibility:**
- Sistema atual não possui persistência - compatibilidade garantida por design
- Estrutura JSON preserva formato exato dos resultados em memória atuais
- API endpoints novos não interferem com fluxo frontend existente

## Component Architecture

### New Components

#### AuthenticationProvider
**Responsibility:** Gerenciar estado global de autenticação e sessão do usuário através da aplicação
**Integration Points:** Wrapper de alto nível no layout.tsx, fornece contexto para todos os componentes filhos

**Key Interfaces:**
- `useAuth()` hook para acesso ao estado de auth
- `signIn(email, password)` função para login
- `signUp(userData)` função para registro
- `signOut()` função para logout

**Dependencies:**
- **Existing Components:** Integra com app/layout.tsx como provider
- **New Components:** Consumed by AuthScreen, ProtectedRoute
- **Technology Stack:** Supabase Auth SDK, React Context API

#### ProtectedRoute
**Responsibility:** Componente de ordem superior que protege rotas requerendo autenticação válida
**Integration Points:** Envolve componentes de avaliação (MiniDiscScreen, SoftSkillsScreen, SJTScreen)

**Key Interfaces:**
- `fallback` prop para componente de loading/redirect
- `redirectTo` prop para redirecionar usuários não autenticados

**Dependencies:**
- **Existing Components:** Protege MiniDiscScreen, SoftSkillsScreen, SJTScreen, CompletionScreen
- **New Components:** Usa AuthenticationProvider context
- **Technology Stack:** React, Next.js routing

#### AssessmentPersistenceService
**Responsibility:** Service layer para salvar e recuperar dados de avaliação do backend
**Integration Points:** Chamado pelos componentes de tela existentes para auto-save e recuperação de dados

**Key Interfaces:**
- `saveAssessment(assessmentData)` para persistir progresso
- `getAssessmentHistory()` para carregar histórico
- `updateAssessmentResults(id, results)` para atualizar resultados

**Dependencies:**
- **Existing Components:** Integra com page.tsx state management
- **New Components:** Usa AuthenticationProvider para user context
- **Technology Stack:** Supabase client, Next.js API routes

#### UserProfileManager
**Responsibility:** Gerenciar dados do perfil profissional do médico
**Integration Points:** Integra com AuthScreen existente para coleta e validação de dados profissionais

**Key Interfaces:**
- `createProfile(profileData)` para criação inicial
- `updateProfile(profileData)` para atualizações
- `validateCRM(crm)` para validação de registro médico

**Dependencies:**
- **Existing Components:** Refatora auth-screen.tsx existente
- **New Components:** Usa AuthenticationProvider e AssessmentPersistenceService
- **Technology Stack:** Supabase client, React Hook Form, Zod validation

### Component Interaction Diagram

```mermaid
graph TB
    A[app/layout.tsx] --> B[AuthenticationProvider]
    B --> C[app/page.tsx]
    C --> D[ProtectedRoute]
    D --> E[AuthScreen + UserProfileManager]
    D --> F[MiniDiscScreen]
    D --> G[SoftSkillsScreen] 
    D --> H[SJTScreen]
    D --> I[CompletionScreen]
    
    E --> J[AssessmentPersistenceService]
    F --> J
    G --> J
    H --> J
    I --> J
    
    J --> K[Next.js API Routes]
    K --> L[Supabase Database]
    
    B --> M[Supabase Auth]
```

## API Design and Integration

### API Integration Strategy
**API Integration Strategy:** REST API usando Next.js API Routes com padrão de recursos aninhados
**Authentication:** JWT tokens via Supabase Auth com middleware de validação em todas as rotas protegidas
**Versioning:** Sem versioning inicial - API interna simples, futuro suporte a /v1/ se necessário

### New API Endpoints

#### POST /api/assessment
- **Method:** POST
- **Endpoint:** /api/assessment
- **Purpose:** Criar nova avaliação ou salvar progresso de avaliação existente
- **Integration:** Integra com AssessmentPersistenceService e componentes de avaliação

**Request:**
```json
{
  "type": "complete",
  "status": "in_progress",
  "disc_results": { "D": 25, "I": 15, "S": 20, "C": 10 },
  "soft_skills_results": { "comunicacao": 85, "lideranca": 70 },
  "sjt_results": [1, 3, 2, 4, 1]
}
```

**Response:**
```json
{
  "id": "uuid-assessment-id",
  "status": "success",
  "message": "Assessment saved successfully"
}
```

#### GET /api/assessments
- **Method:** GET
- **Endpoint:** /api/assessments
- **Purpose:** Listar todas as avaliações do usuário autenticado com paginação
- **Integration:** Usado pelo dashboard para exibir histórico

**Request:** Query parameters para paginação
**Response:**
```json
{
  "assessments": [
    {
      "id": "uuid",
      "type": "complete",
      "status": "completed",
      "created_at": "2025-08-07T10:00:00Z",
      "completed_at": "2025-08-07T10:45:00Z"
    }
  ],
  "pagination": { "total": 10, "page": 1, "limit": 20 }
}
```

#### GET /api/assessment/:id
- **Method:** GET
- **Endpoint:** /api/assessment/:id
- **Purpose:** Recuperar avaliação específica com todos os resultados detalhados
- **Integration:** Usado para visualização de resultados históricos

**Response:**
```json
{
  "id": "uuid",
  "type": "complete",
  "status": "completed",
  "disc_results": { "D": 25, "I": 15, "S": 20, "C": 10 },
  "soft_skills_results": { "comunicacao": 85, "lideranca": 70 },
  "sjt_results": [1, 3, 2, 4, 1],
  "created_at": "2025-08-07T10:00:00Z",
  "completed_at": "2025-08-07T10:45:00Z"
}
```

#### PUT /api/profile
- **Method:** PUT
- **Endpoint:** /api/profile
- **Purpose:** Atualizar dados do perfil profissional do médico
- **Integration:** Usado pelo UserProfileManager para atualizações

**Request:**
```json
{
  "name": "Dr. João Silva",
  "phone": "+5511999999999",
  "crm": "CRM/SP 123456",
  "specialty": "Cardiologia"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "profile": { "id": "uuid", "name": "Dr. João Silva" }
}
```

## Source Tree Integration

### Existing Project Structure
```plaintext
soyuzcinterface/
├── app/
│   ├── globals.css
│   ├── layout.tsx          # Root layout with ThemeProvider
│   └── page.tsx            # Main entry point with state management
├── components/
│   ├── ui/                 # shadcn/ui components (Radix UI)
│   ├── auth-screen.tsx     # Current simple auth form
│   ├── mini-disc-screen.tsx
│   ├── soft-skills-screen.tsx
│   ├── sjt-screen.tsx
│   └── completion-screen.tsx
├── lib/
│   └── utils.ts            # Utility functions
└── docs/
    ├── PRD_brownfield.md
    └── documentacao_inicial.md
```

### New File Organization
```plaintext
soyuzcinterface/
├── app/
│   ├── api/                           # New API routes
│   │   ├── assessment/
│   │   │   └── route.ts              # Assessment CRUD operations
│   │   ├── assessments/
│   │   │   └── route.ts              # List assessments
│   │   └── profile/
│   │       └── route.ts              # Profile management
│   ├── globals.css
│   ├── layout.tsx                     # Enhanced with AuthProvider
│   └── page.tsx                       # Enhanced with ProtectedRoute
├── components/
│   ├── ui/                           # Existing shadcn/ui components
│   ├── providers/                    # New providers folder
│   │   └── auth-provider.tsx         # Authentication context provider
│   ├── auth/                         # New auth components
│   │   ├── protected-route.tsx       # Route protection HOC
│   │   └── user-profile-manager.tsx  # Profile management component
│   ├── auth-screen.tsx               # Enhanced with Supabase auth
│   ├── mini-disc-screen.tsx          # Enhanced with auto-save
│   ├── soft-skills-screen.tsx        # Enhanced with auto-save
│   ├── sjt-screen.tsx                # Enhanced with auto-save
│   └── completion-screen.tsx         # Enhanced with persistence
├── lib/
│   ├── supabase/                     # New Supabase integration
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client for API routes
│   │   └── types.ts                  # TypeScript definitions
│   ├── services/                     # New services folder
│   │   └── assessment-service.ts     # Assessment persistence service
│   └── utils.ts                      # Existing utilities
└── docs/
    ├── PRD_brownfield.md
    ├── documentacao_inicial.md
    └── architecture.md               # This document
```

### Integration Guidelines
- **File Naming:** Manter convenção kebab-case existente para componentes e arquivos
- **Folder Organization:** Seguir padrão App Router do Next.js, agrupar por funcionalidade (auth/, providers/, services/)
- **Import/Export Patterns:** Manter imports absolutos com @ alias, exports nomeados para services e utilities

## Infrastructure and Deployment Integration

### Existing Infrastructure
**Current Deployment:** Vercel deployment otimizado para Next.js com builds automáticos
**Infrastructure Tools:** Vercel CLI, GitHub integration para CI/CD
**Environments:** Desenvolvimento local com next dev, produção via Vercel

### Enhancement Deployment Strategy
**Deployment Approach:** Manter pipeline Vercel existente, adicionar variáveis de ambiente para Supabase
**Infrastructure Changes:** 
- Adicionar projeto Supabase (desenvolvimento e produção)
- Configurar environment variables no Vercel
- Setup de SSL certificates automático via Vercel

**Pipeline Integration:** 
- GitHub webhooks mantidos para deployment automático
- Preview deployments para pull requests
- Environment variables sincronizadas entre dev/prod

### Rollback Strategy
**Rollback Method:** Rollback via Vercel dashboard ou CLI, database migrations revertíveis via Supabase
**Risk Mitigation:** 
- Feature flags para funcionalidades de auth (gradual rollout)
- Database backups automáticos diários no Supabase
- Monitoring de health checks para APIs

**Monitoring:** Vercel Analytics + Supabase Dashboard para métricas de performance e uso

## Coding Standards and Conventions

### Existing Standards Compliance
**Code Style:** TypeScript strict mode, ESLint configurado, Prettier para formatação
**Linting Rules:** Next.js recommended ESLint config com regras de acessibilidade
**Testing Patterns:** Nenhum framework de teste configurado atualmente
**Documentation Style:** JSDoc para funções complexas, README para setup

### Enhancement-Specific Standards
- **Supabase Client Usage:** Sempre usar server client para API routes, browser client apenas em componentes
- **Error Handling:** Padrão try/catch com logging estruturado para Supabase operations
- **Type Safety:** Definir interfaces TypeScript para todos os modelos de dados
- **Authentication Flow:** Sempre verificar sessão em API routes antes de operações de dados

### Critical Integration Rules
- **Existing API Compatibility:** N/A - primeira implementação de APIs
- **Database Integration:** Usar apenas Supabase client, nunca SQL direto
- **Error Handling:** Manter padrões de tratamento de erro existentes, adicionar Supabase error handling
- **Logging Consistency:** Console.log para desenvolvimento, considerar structured logging para produção

## Testing Strategy

### Integration with Existing Tests
**Existing Test Framework:** Nenhum configurado - primeira implementação de testes
**Test Organization:** Proposta de estrutura com __tests__ folders adjacentes aos arquivos
**Coverage Requirements:** Mínimo 70% para novas funcionalidades críticas (auth, APIs)

### New Testing Requirements

#### Unit Tests for New Components
- **Framework:** Jest + React Testing Library (padrão Next.js)
- **Location:** __tests__ folders co-localizados com components
- **Coverage Target:** 80% para AuthProvider, AssessmentService, API routes
- **Integration with Existing:** Setup inicial de Jest config para projeto

#### Integration Tests
- **Scope:** Fluxos completos de auth (login/logout), salvamento de avaliações
- **Existing System Verification:** Garantir que componentes de avaliação existentes funcionam com novo backend
- **New Feature Testing:** Testes E2E para fluxos de cadastro e persistência de dados

#### Regression Tests
- **Existing Feature Verification:** Testes automatizados para garantir que avaliações DISC/Soft Skills/SJT continuam funcionando
- **Automated Regression Suite:** GitHub Actions workflow para executar testes em PRs
- **Manual Testing Requirements:** Checklist de QA para testar fluxos críticos antes de releases

## Security Integration

### Existing Security Measures
**Authentication:** Atualmente inexistente - implementação inicial com Supabase Auth
**Authorization:** N/A - será implementado com RLS (Row Level Security) no Supabase
**Data Protection:** HTTPS via Vercel, será adicionada criptografia de dados sensíveis
**Security Tools:** ESLint security rules, será adicionado Supabase security scanning

### Enhancement Security Requirements
**New Security Measures:**
- JWT token validation em todas as API routes
- Row Level Security policies no Supabase para isolamento de dados por usuário
- Rate limiting básico em endpoints críticos
- Input validation com Zod schemas

**Integration Points:** 
- Middleware de autenticação para API routes
- Client-side auth state management seguro
- Secure cookie configuration para sessões

**Compliance Requirements:** 
- LGPD compliance para dados médicos brasileiros
- Supabase SOC2 compliance herdada
- Audit trail para mudanças de dados sensíveis

### Security Testing
**Existing Security Tests:** Nenhum - primeira implementação
**New Security Test Requirements:** 
- Testes de autorização (usuários não podem acessar dados de outros)
- Validation testing para inputs maliciosos
- Session management testing (logout adequado, token expiration)

**Penetration Testing:** Não necessário para MVP, considerar para futuras versões com mais usuários

## Next Steps

### Story Manager Handoff

**Development Ready Prompt for Story Manager:**

"Implementar sistema de autenticação e backend para projeto Soyuz conforme arquitetura brownfield documentada em docs/architecture.md. 

**Key Integration Requirements Validated:**
- Preservar componentes React existentes (MiniDiscScreen, SoftSkillsScreen, SJTScreen)  
- Manter design system Tailwind CSS + Radix UI atual
- Integrar com estrutura Next.js App Router existente
- Usar Supabase para auth e persistência seguindo padrões definidos no PRD

**Existing System Constraints Based on Analysis:**
- State management centralizado em app/page.tsx precisa ser refatorado
- Componentes de avaliação devem manter interface atual mas adicionar auto-save
- Estrutura modular de telas deve ser preservada para UX consistency

**First Story to Implement:**
Criar AuthenticationProvider e configuração básica do Supabase - Story crítica que estabelece fundação para todas as outras funcionalidades. 

**Integration Checkpoints:**
1. Verificar que tema dark/light continua funcionando após AuthProvider
2. Confirmar que navegação entre telas mantém fluxo atual
3. Validar que tipos TypeScript não quebram build existente

**Maintain System Integrity:** Cada story deve incluir testes de regressão para garantir que funcionalidades existentes não sejam afetadas."

### Developer Handoff  

**Implementation Ready Prompt for Developers:**

"Implementar backend e autenticação para projeto Soyuz seguindo arquitetura brownfield definida em docs/architecture.md.

**Reference Documents:**
- docs/architecture.md - Arquitetura técnica completa baseada em análise real do projeto
- docs/PRD_brownfield.md - Requisitos funcionais detalhados
- Estrutura de código existente analisada e documentada na seção 'Existing Project Analysis'

**Integration Requirements with Existing Codebase:**
- Preservar todos os componentes UI existentes em components/
- Manter estrutura de state management em app/page.tsx durante transição
- Seguir convenções TypeScript strict e ESLint rules já configuradas  
- Usar padrões de import/export existentes (@ alias, named exports)

**Key Technical Decisions Based on Real Project Constraints:**
- Next.js 15.2.4 App Router como base - não migrar para Pages Router
- Supabase SDK ^2.39.0 como única adição de dependência crítica  
- Manter Radix UI + Tailwind CSS 4.1.9 design system existente
- API Routes em app/api/ seguindo RESTful patterns definidos

**Existing System Compatibility Requirements:**
- AuthScreen component refactor deve manter interface props atual  
- Assessment components (DISC/SoftSkills/SJT) adicionam persistence sem mudar UX
- Layout.tsx integração com AuthProvider não pode quebrar ThemeProvider existente

**Clear Sequencing to Minimize Risk:**
1. Setup Supabase configuration (lib/supabase/) - zero impact em código existente
2. Criar AuthenticationProvider - wrapper que não altera comportamento atual  
3. Implementar API routes - novas rotas não interferem com frontend atual
4. Refatorar AuthScreen - single component change com fallback para comportamento atual
5. Adicionar persistence aos assessment components - incremental enhancement

**Verification Steps for Each Implementation Phase:**
- `npm run build` deve executar sem erros
- `npm run dev` deve manter funcionalidade atual
- Todos os fluxos de avaliação existentes devem continuar funcionando
- Theme switching (dark/light) deve permanecer operacional

Este sequenciamento garante que o sistema existente continue operacional durante toda a implementação."