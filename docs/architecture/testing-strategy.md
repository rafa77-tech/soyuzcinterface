# Testing Strategy

## Integration with Existing Tests
**Existing Test Framework:** Nenhum configurado - primeira implementação de testes
**Test Organization:** Proposta de estrutura com __tests__ folders adjacentes aos arquivos
**Coverage Requirements:** Mínimo 70% para novas funcionalidades críticas (auth, APIs)

## New Testing Requirements

### Unit Tests for New Components
- **Framework:** Jest + React Testing Library (padrão Next.js)
- **Location:** __tests__ folders co-localizados com components
- **Coverage Target:** 80% para AuthProvider, AssessmentService, API routes
- **Integration with Existing:** Setup inicial de Jest config para projeto

### Integration Tests
- **Scope:** Fluxos completos de auth (login/logout), salvamento de avaliações
- **Existing System Verification:** Garantir que componentes de avaliação existentes funcionam com novo backend
- **New Feature Testing:** Testes E2E para fluxos de cadastro e persistência de dados

### Regression Tests
- **Existing Feature Verification:** Testes automatizados para garantir que avaliações DISC/Soft Skills/SJT continuam funcionando
- **Automated Regression Suite:** GitHub Actions workflow para executar testes em PRs
- **Manual Testing Requirements:** Checklist de QA para testar fluxos críticos antes de releases
