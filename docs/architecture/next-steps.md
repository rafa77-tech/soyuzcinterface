# Next Steps

## Story Manager Handoff

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

## Developer Handoff  

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