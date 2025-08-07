# Documento de Arquitetura Brownfield do Projeto Soyuz

## Introdução

Este documento captura o **ESTADO ATUAL** da base de código do projeto Soyuz e descreve a arquitetura para a melhoria solicitada: a criação de um backend simples e um sistema de login usando o Supabase. Ele serve como referência para os agentes de IA que trabalharão nas melhorias.

## Escopo do Documento

Focado nas áreas relevantes para: **"Criar um backend e sistema de login (usar Supabase)"**.

## Histórico de Alterações

| Data       | Versão | Descrição                                      | Autor   |
|------------|--------|------------------------------------------------|---------|
| 07/08/2024 | 1.0    | Análise brownfield inicial e plano de melhoria | Gemini  |

## Referência Rápida - Arquivos e Pontos de Entrada Chave

### Arquivos Críticos para Entender o Sistema

- **Entrada Principal**: `app/page.tsx` (Controla o fluxo entre as diferentes telas da avaliação)

**Componentes de Avaliação:**
- `components/mini-disc-screen.tsx`
- `components/soft-skills-screen.tsx`
- `components/sjt-screen.tsx`

**Lógica de Autenticação (Atual)**: `components/auth-screen.tsx` (Atualmente um formulário simples de coleta de dados)

**Exibição de Resultados**: 
- `components/completion-screen.tsx`
- `detailed-report-screen.tsx`

**Utilitários**: `lib/utils.ts`

### Áreas de Impacto da Melhoria

- **`components/auth-screen.tsx`**: Será refatorado para usar o Supabase Auth
- **`app/page.tsx`**: A lógica de estado precisará ser atualizada para gerenciar o estado de autenticação do usuário
- **Nova Pasta `app/api/`**: Conterá os novos endpoints do backend para salvar os resultados da avaliação
- **Nova Pasta `lib/supabase/`**: Conterá a configuração do cliente Supabase

## Arquitetura de Alto Nível

### Resumo Técnico

O projeto é atualmente um aplicativo Next.js apenas de frontend que funciona como uma ferramenta de avaliação de soft skills em várias etapas para médicos. A arquitetura proposta introduzirá um backend usando Next.js API Routes e o Supabase para autenticação e armazenamento de dados. Isso transformará o aplicativo em uma aplicação full-stack, permitindo a persistência dos dados do usuário e dos resultados da avaliação.

### Stack de Tecnologia Atual (a partir do package.json)

| Categoria | Tecnologia | Versão | Notas |
|-----------|------------|--------|--------|
| Runtime | Node.js | - | Ambiente de execução padrão para o Next.js |
| Framework | Next.js | 15.2.4 | Framework principal do aplicativo |
| UI Library | React | 19 | Biblioteca para construção da interface |
| Styling | Tailwind CSS | 4.1.9 | Framework de CSS para estilização |
| Componentes | Radix UI / shadcn | latest | Para componentes de UI acessíveis e reutilizáveis |
| Gráficos | Recharts | latest | Para visualização dos resultados da avaliação |

### Estrutura do Repositório (Atual)

O projeto segue uma estrutura padrão do Next.js App Router.

```
soyuzcinterface/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx      # Ponto de entrada principal
├── components/
│   ├── ui/           # Componentes base (shadcn)
│   ├── auth-screen.tsx
│   ├── mini-disc-screen.tsx
│   ├── soft-skills-screen.tsx
│   └── ...           # Outras telas e componentes
├── lib/
│   └── utils.ts
└── package.json
```

## Arquitetura Proposta para a Melhoria

### 1. Sistema de Login com Supabase

- **Autenticação**: O Supabase Auth será usado para gerenciar a autenticação do usuário (inscrição, login). A `auth-screen.tsx` será modificada para interagir com a API de autenticação do Supabase.

- **Cliente Supabase**: Um cliente Supabase será configurado em `lib/supabase/client.ts` para uso no lado do cliente e em `lib/supabase/server.ts` para uso no lado do servidor (API Routes).

- **Gerenciamento de Sessão**: O Supabase SSR será usado para gerenciar as sessões do usuário de forma segura através de cookies, integrando-se perfeitamente com os Server Components e API Routes do Next.js.

- **Tabela de Usuários**: A tabela `auth.users` padrão do Supabase será usada. Uma tabela adicional `profiles` será criada para armazenar dados específicos do usuário, como CRM e especialidade.

### 2. Backend Simples com API Routes

- **API Endpoints**: Os endpoints da API serão criados dentro da pasta `app/api/`. Um endpoint principal será `app/api/assessment/route.ts`.

- **Responsabilidade**: Este endpoint será responsável por receber os resultados da avaliação do frontend, verificar a sessão do usuário e salvar os dados nas tabelas apropriadas do banco de dados Supabase.

- **Segurança**: O endpoint da API será protegido, exigindo que um usuário esteja autenticado para enviar os resultados. Isso será feito verificando a sessão do usuário usando o cliente Supabase do lado do servidor.

### 3. Modelos de Dados e Banco de Dados (Supabase)

**Tabela `profiles`:**
- `id` (UUID, FK para auth.users.id)
- `name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `crm` (TEXT)
- `specialty` (TEXT)

**Tabela `assessments`:**
- `id` (UUID, PK)
- `user_id` (UUID, FK para auth.users.id)
- `created_at` (TIMESTAMPTZ)
- `disc_results` (JSONB)
- `soft_skills_results` (JSONB)
- `sjt_results` (JSONB)

### Estrutura do Projeto (Proposta)

```
soyuzcinterface/
├── app/
│   ├── api/
│   │   └── assessment/
│   │       └── route.ts     # Endpoint para salvar resultados
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ...
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Cliente Supabase para o browser
│   │   └── server.ts        # Cliente Supabase para o servidor
│   └── utils.ts
└── package.json
```

## Dívida Técnica e Problemas Conhecidos

### Gerenciamento de Estado
O estado do aplicativo é atualmente gerenciado através de `useState` no componente `app/page.tsx`. À medida que o aplicativo cresce, isso pode se tornar difícil de gerenciar. Considerar o uso de uma biblioteca de gerenciamento de estado mais robusta (como Zustand ou Jotai) ou React Context pode ser benéfico no futuro.

### Ausência de Testes
Não há testes automatizados no projeto. A introdução de testes unitários e de integração (por exemplo, com Jest e React Testing Library) é recomendada para garantir a qualidade e a estabilidade do código.

## Pontos de Integração e Dependências Externas

### Serviços Externos

| Serviço | Finalidade | Tipo de Integração | Arquivos Chave |
|---------|------------|---------------------|----------------|
| Supabase | Autenticação e Banco de Dados | SDK | `lib/supabase/client.ts`, `lib/supabase/server.ts`, `components/auth-screen.tsx`, `app/api/assessment/route.ts` |

## Configuração de Desenvolvimento Local

1. Clonar o repositório
2. Instalar as dependências com `npm install`
3. Criar um projeto no Supabase
4. Criar um arquivo `.env.local` na raiz do projeto com as chaves de API do Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```
5. Executar o servidor de desenvolvimento com `npm run dev`

