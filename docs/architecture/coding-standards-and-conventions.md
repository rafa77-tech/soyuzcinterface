# Coding Standards and Conventions

## Existing Standards Compliance
**Code Style:** TypeScript strict mode, ESLint configurado, Prettier para formatação
**Linting Rules:** Next.js recommended ESLint config com regras de acessibilidade
**Testing Patterns:** Nenhum framework de teste configurado atualmente
**Documentation Style:** JSDoc para funções complexas, README para setup

## Enhancement-Specific Standards
- **Supabase Client Usage:** Sempre usar server client para API routes, browser client apenas em componentes
- **Error Handling:** Padrão try/catch com logging estruturado para Supabase operations
- **Type Safety:** Definir interfaces TypeScript para todos os modelos de dados
- **Authentication Flow:** Sempre verificar sessão em API routes antes de operações de dados

## Critical Integration Rules
- **Existing API Compatibility:** N/A - primeira implementação de APIs
- **Database Integration:** Usar apenas Supabase client, nunca SQL direto
- **Error Handling:** Manter padrões de tratamento de erro existentes, adicionar Supabase error handling
- **Logging Consistency:** Console.log para desenvolvimento, considerar structured logging para produção
