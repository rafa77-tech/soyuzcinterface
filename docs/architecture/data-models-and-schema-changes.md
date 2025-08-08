# Data Models and Schema Changes

## New Data Models

### Profile Model
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

### Assessment Model  
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

## Schema Integration Strategy

**Database Changes Required:**
- **New Tables:** profiles, assessments
- **Modified Tables:** Nenhuma - sistema atual não possui BD
- **New Indexes:** idx_assessments_user_id, idx_assessments_created_at, idx_profiles_crm
- **Migration Strategy:** DDL scripts executados via Supabase Dashboard/CLI

**Backward Compatibility:**
- Sistema atual não possui persistência - compatibilidade garantida por design
- Estrutura JSON preserva formato exato dos resultados em memória atuais
- API endpoints novos não interferem com fluxo frontend existente
