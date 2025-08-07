# Product Requirements Document (PRD) - Projeto Soyuz
## Implementação de Backend e Sistema de Autenticação

---

## 📋 Resumo Executivo

### Visão Geral
O projeto Soyuz é uma ferramenta de avaliação de soft skills para médicos, atualmente implementada como um aplicativo Next.js frontend-only. Este PRD define os requisitos para transformar a aplicação em um sistema full-stack, implementando backend com persistência de dados e sistema de autenticação usando Supabase.

### Objetivos do Projeto
- **Primário**: Implementar sistema de autenticação seguro
- **Secundário**: Criar backend para persistência de dados de avaliações
- **Terciário**: Estabelecer fundação para futuras funcionalidades

---

## 🎯 Definição do Problema

### Estado Atual
- Aplicação frontend-only sem persistência de dados
- Formulário de coleta de dados simples sem autenticação real
- Resultados de avaliações são perdidos ao fechar o navegador
- Impossibilidade de rastrear progresso ou histórico do usuário

### Problemas Identificados
1. **Perda de Dados**: Resultados não são salvos permanentemente
2. **Ausência de Autenticação**: Não há controle de acesso ou identificação de usuários
3. **Limitação de Funcionalidades**: Impossível implementar recursos avançados sem backend
4. **Experiência do Usuário Limitada**: Usuários não podem retomar avaliações

---

## 🚀 Objetivos e Metas

### Objetivos de Negócio
- [ ] **Retenção de Usuários**: Permitir que médicos salvem e acessem seus resultados
- [ ] **Segurança**: Implementar autenticação segura para proteger dados sensíveis
- [ ] **Escalabilidade**: Preparar infraestrutura para crescimento futuro
- [ ] **Compliance**: Atender requisitos de segurança para dados médicos

### Métricas de Sucesso
| Métrica | Meta | Prazo |
|---------|------|-------|
| Taxa de Conclusão de Cadastro | > 85% | 30 dias |
| Tempo de Autenticação | < 3 segundos | Imediato |
| Taxa de Retenção de Dados | 100% | Imediato |
| Uptime do Sistema | > 99.9% | Contínuo |

---

## 👥 Personas e Casos de Uso

### Persona Principal: Médico Avaliado
**Perfil:**
- Médico em atividade ou residência
- Busca autoavaliação e desenvolvimento profissional
- Tempo limitado para atividades extras
- Valoriza segurança e privacidade dos dados

**Necessidades:**
- Acesso rápido e seguro
- Salvar progresso da avaliação
- Acessar histórico de resultados
- Interface intuitiva e responsiva

### Casos de Uso Principais

#### CU-01: Cadastro de Usuário
**Ator**: Médico
**Descrição**: Usuário cria conta no sistema
**Fluxo**:
1. Acessa tela de cadastro
2. Preenche dados pessoais e profissionais
3. Confirma email
4. Acessa sistema autenticado

#### CU-02: Autenticação
**Ator**: Médico
**Descrição**: Usuário faz login no sistema
**Fluxo**:
1. Acessa tela de login
2. Insere credenciais
3. Sistema valida autenticação
4. Redireciona para dashboard

#### CU-03: Realizar Avaliação
**Ator**: Médico autenticado
**Descrição**: Usuário completa avaliação de soft skills
**Fluxo**:
1. Inicia nova avaliação
2. Completa módulos (DISC, Soft Skills, SJT)
3. Sistema salva progresso automaticamente
4. Visualiza resultados finais

#### CU-04: Acessar Histórico
**Ator**: Médico autenticado
**Descrição**: Usuário consulta avaliações anteriores
**Fluxo**:
1. Acessa seção de histórico
2. Visualiza lista de avaliações
3. Seleciona avaliação específica
4. Analisa resultados detalhados

---

## 📋 Requisitos Funcionais

### RF-01: Sistema de Autenticação
**Prioridade**: Alta
**Descrição**: Implementar sistema completo de autenticação

**Critérios de Aceitação**:
- [ ] Cadastro com email e senha
- [ ] Login com credenciais válidas
- [ ] Recuperação de senha por email
- [ ] Logout seguro
- [ ] Sessão persistente (remember me)
- [ ] Validação de dados de entrada

### RF-02: Gestão de Perfil de Usuário
**Prioridade**: Alta
**Descrição**: Gerenciar dados do perfil médico

**Critérios de Aceitação**:
- [ ] Campos obrigatórios: nome, email, CRM, especialidade
- [ ] Validação de formato de CRM
- [ ] Edição de dados do perfil
- [ ] Foto de perfil (opcional)

### RF-03: Persistência de Avaliações
**Prioridade**: Alta
**Descrição**: Salvar resultados de avaliações no banco de dados

**Critérios de Aceitação**:
- [ ] Salvamento automático de progresso
- [ ] Armazenamento de resultados completos
- [ ] Vínculo com usuário autenticado
- [ ] Timestamp de criação e conclusão

### RF-04: Dashboard de Resultados
**Prioridade**: Média
**Descrição**: Interface para visualização de resultados

**Critérios de Aceitação**:
- [ ] Lista de avaliações realizadas
- [ ] Visualização de resultados individuais
- [ ] Gráficos e métricas de desempenho
- [ ] Exportação de resultados (PDF)

### RF-05: API Backend
**Prioridade**: Alta
**Descrição**: Endpoints para comunicação frontend-backend

**Critérios de Aceitação**:
- [ ] POST /api/assessment - Salvar avaliação
- [ ] GET /api/assessments - Listar avaliações do usuário
- [ ] GET /api/assessment/:id - Obter avaliação específica
- [ ] PUT /api/profile - Atualizar perfil
- [ ] Autenticação em todos os endpoints

---

## 📋 Requisitos Não Funcionais

### RNF-01: Segurança
- [ ] Autenticação JWT com Supabase
- [ ] Criptografia de dados sensíveis
- [ ] Validação de entrada em todos os endpoints
- [ ] Rate limiting em APIs
- [ ] HTTPS obrigatório

### RNF-02: Performance
- [ ] Tempo de resposta da API < 500ms
- [ ] Carregamento inicial < 2 segundos
- [ ] Suporte a 100 usuários simultâneos
- [ ] Otimização de imagens e assets

### RNF-03: Usabilidade
- [ ] Interface responsiva (mobile-first)
- [ ] Acessibilidade WCAG 2.1 AA
- [ ] Feedback visual para todas as ações
- [ ] Estados de loading apropriados

### RNF-04: Confiabilidade
- [ ] Uptime > 99.9%
- [ ] Backup automático de dados
- [ ] Recuperação de falhas < 1 minuto
- [ ] Monitoramento de saúde do sistema

---

## 🏗️ Arquitetura e Tecnologias

### Stack Tecnológico Escolhido

| Categoria | Tecnologia | Justificativa |
|-----------|------------|---------------|
| **Backend** | Next.js API Routes | Integração nativa com frontend existente |
| **Database** | Supabase PostgreSQL | Solução completa com auth integrada |
| **Authentication** | Supabase Auth | Recursos robustos e seguros |
| **Hosting** | Vercel | Otimização para Next.js |
| **Storage** | Supabase Storage | Integração nativa com auth |

### Modelo de Dados

#### Tabela: profiles
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  crm TEXT NOT NULL,
  specialty TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: assessments
```sql
CREATE TABLE assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL, -- 'complete', 'disc', 'soft_skills', 'sjt'
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed'
  disc_results JSONB,
  soft_skills_results JSONB,
  sjt_results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

---

## 🎨 Especificações de Design

### Fluxo de Autenticação
1. **Tela de Boas-vindas** → Opções de Login/Cadastro
2. **Tela de Cadastro** → Formulário com validação
3. **Confirmação de Email** → Link de ativação
4. **Dashboard** → Área logada do usuário

### Wireframes Principais

#### Tela de Login
- Campo email
- Campo senha
- Botão "Entrar"
- Link "Esqueci minha senha"
- Link "Criar conta"

#### Tela de Cadastro
- Nome completo
- Email
- Telefone
- CRM
- Especialidade
- Senha
- Confirmação de senha
- Checkbox termos de uso

#### Dashboard
- Header com nome e foto do usuário
- Menu lateral com navegação
- Área principal com cards de avaliações
- Botão "Nova Avaliação"

---

## 🗓️ Cronograma e Milestones

### Fase 1: Configuração Base (Semana 1)
- [ ] Configuração do Supabase
- [ ] Instalação de dependências
- [ ] Configuração de variáveis de ambiente
- [ ] Setup inicial do cliente Supabase

### Fase 2: Autenticação (Semana 2)
- [ ] Implementação de telas de login/cadastro
- [ ] Integração com Supabase Auth
- [ ] Gestão de sessões
- [ ] Proteção de rotas

### Fase 3: Backend API (Semana 3)
- [ ] Criação de API routes
- [ ] Implementação de endpoints CRUD
- [ ] Validação e segurança
- [ ] Testes de integração

### Fase 4: Persistência de Dados (Semana 4)
- [ ] Modificação do fluxo de avaliação
- [ ] Salvamento automático
- [ ] Dashboard de resultados
- [ ] Histórico de avaliações

### Fase 5: Testes e Deploy (Semana 5)
- [ ] Testes de funcionalidade
- [ ] Testes de performance
- [ ] Deploy em produção
- [ ] Monitoramento inicial

---

## 🧪 Estratégia de Testes

### Testes Unitários
- [ ] Funções utilitárias
- [ ] Validações de dados
- [ ] Componentes isolados

### Testes de Integração
- [ ] Fluxo de autenticação
- [ ] APIs do backend
- [ ] Integração com Supabase

### Testes E2E
- [ ] Fluxo completo de cadastro
- [ ] Realização de avaliação
- [ ] Acesso a resultados

---

## 📊 Métricas e Monitoramento

### Métricas de Produto
- Taxa de conversão de cadastro
- Tempo médio para completar avaliação
- Taxa de abandono por etapa
- Frequência de uso por usuário

### Métricas Técnicas
- Tempo de resposta das APIs
- Taxa de erro por endpoint
- Uso de recursos do servidor
- Disponibilidade do sistema

### Ferramentas de Monitoramento
- Vercel Analytics para performance
- Supabase Dashboard para banco de dados
- Sentry para tracking de erros
- Google Analytics para comportamento do usuário

---

## 🔒 Considerações de Segurança

### Autenticação e Autorização
- [ ] Tokens JWT com expiração
- [ ] Refresh tokens seguros
- [ ] Rate limiting por usuário
- [ ] Validação de sessão em cada request

### Proteção de Dados
- [ ] Criptografia de dados sensíveis
- [ ] Sanitização de inputs
- [ ] Prevenção de SQL injection
- [ ] Proteção contra XSS

### Compliance
- [ ] LGPD compliance para dados pessoais
- [ ] Política de privacidade clara
- [ ] Consentimento para uso de dados
- [ ] Direito ao esquecimento

---

## 🚀 Plano de Deploy e Rollout

### Ambiente de Desenvolvimento
- Supabase projeto de desenvolvimento
- Vercel preview deployments
- Dados de teste para validação

### Ambiente de Produção
- Supabase projeto de produção
- Vercel produção com domínio customizado
- Backup automático configurado
- Monitoramento ativo

### Estratégia de Rollout
1. **Beta Fechado**: 10 usuários internos
2. **Beta Aberto**: 50 usuários selecionados
3. **Produção**: Liberação gradual
4. **Monitoramento**: Acompanhamento contínuo

---

## 📚 Documentação e Treinamento

### Documentação Técnica
- [ ] README atualizado
- [ ] Documentação da API
- [ ] Guias de setup local
- [ ] Troubleshooting comum

### Documentação do Usuário
- [ ] Tutorial de primeiro acesso
- [ ] FAQ sobre funcionalidades
- [ ] Guia de uso da plataforma
- [ ] Suporte técnico

---

## ✅ Critérios de Aceite Final

### Funcionalidades Básicas
- [ ] Usuário consegue se cadastrar e fazer login
- [ ] Sistema salva avaliações automaticamente
- [ ] Usuário acessa histórico de resultados
- [ ] Interface responsiva em dispositivos móveis

### Qualidade e Performance
- [ ] Tempo de carregamento < 2 segundos
- [ ] Zero perda de dados durante avaliação
- [ ] Sistema funciona offline (cache local)
- [ ] Feedback visual para todas as ações

### Segurança
- [ ] Autenticação funciona corretamente
- [ ] Dados são transmitidos de forma segura
- [ ] Sessões expiram adequadamente
- [ ] Validação impede ataques comuns

---

## 🎯 Próximos Passos

1. **Aprovação do PRD** pelos stakeholders
2. **Setup do ambiente** de desenvolvimento
3. **Kick-off técnico** com a equipe
4. **Início da implementação** seguindo cronograma
5. **Reviews semanais** de progresso

---

**Documento aprovado por:** _[Aguardando aprovação]_  
**Data de aprovação:** _[Pendente]_  
**Versão:** 1.0  
**Última atualização:** 07/08/2025