# API Design and Integration

## API Integration Strategy
**API Integration Strategy:** REST API usando Next.js API Routes com padrão de recursos aninhados
**Authentication:** JWT tokens via Supabase Auth com middleware de validação em todas as rotas protegidas
**Versioning:** Sem versioning inicial - API interna simples, futuro suporte a /v1/ se necessário

## New API Endpoints

### POST /api/assessment
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

### GET /api/assessments
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

### GET /api/assessment/:id
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

### PUT /api/profile
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
