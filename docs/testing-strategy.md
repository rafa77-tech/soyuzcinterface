# Testing Strategy Guide - Assessment System

## 📋 Overview

Este documento define **EXATAMENTE** quando e como usar cada tipo de mock no sistema de assessment. Siga estas orientações para garantir testes consistentes e confiáveis.

## 🎯 Mock Strategy Matrix

### **QUANDO usar cada tipo de mock:**

| **Tipo de Teste** | **O que mockar** | **O que NÃO mockar** | **Quando usar** |
|-------------------|------------------|-----------------------|------------------|
| **Unit Tests** | - Services externos<br>- API calls<br>- Database calls<br>- Hooks complexos | - Utility functions<br>- Pure functions<br>- Simple calculations | - Testando lógica isolada<br>- Validando transformações de dados<br>- Testando error handling |
| **Component Tests** | - Hooks de dados<br>- AuthProvider<br>- External services<br>- Navigation | - UI rendering<br>- Event handlers<br>- State management local | - Testando rendering logic<br>- Validando user interactions<br>- Verificando conditional displays |
| **Integration Tests** | - External APIs<br>- Third-party services<br>- Network calls | - Supabase client<br>- Internal APIs<br>- Database operations | - Testando fluxos end-to-end<br>- Validating API contracts<br>- Verificando data persistence |
| **E2E Tests** | - Payment gateways<br>- Email services<br>- External integrations | - Todo o sistema interno<br>- User interface<br>- Database | - Testando user journeys<br>- Validando business flows<br>- Smoke testing |

## 🔧 Implementation Patterns

### **1. Unit Test Mocking**

**USE CASE**: Testando `assessmentService` business logic

```typescript
// ✅ CORRETO: Mock Supabase client, teste business logic
import { assessmentService } from '@/lib/services/assessment-service'

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}))

describe('AssessmentService', () => {
  it('should transform raw data correctly', async () => {
    // Mock retorna raw data, teste transforma para business logic
    const mockSupabase = require('@/lib/supabase/client').supabase
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { id: '1', type: 'disc', status: 'completed' }
    })

    const result = await assessmentService.getAssessment('1', 'user-123')
    expect(result).toEqual({
      id: '1',
      type: 'disc',
      status: 'completed'
    })
  })
})
```

**❌ INCORRETO**: Testing implementation details
```typescript
// NÃO FAÇA: Testando detalhes internos do Supabase
expect(mockSupabase.from).toHaveBeenCalledWith('assessments')
expect(mockSupabase.select).toHaveBeenCalledWith('*')
```

### **2. Component Test Mocking**

**USE CASE**: Testando `AssessmentHistory` component rendering

```typescript
// ✅ CORRETO: Mock hook, teste rendering behavior
import { AssessmentHistory } from '@/components/assessment/assessment-history'

// Mock the data-fetching hook
const mockUseAssessmentHistory = jest.fn()
jest.mock('@/hooks/use-assessment-history', () => ({
  useAssessmentHistory: mockUseAssessmentHistory
}))

describe('AssessmentHistory Component', () => {
  beforeEach(() => {
    mockUseAssessmentHistory.mockReturnValue({
      assessments: [
        { id: '1', type: 'disc', status: 'completed', created_at: '2025-01-20T10:00:00Z' }
      ],
      stats: { totalCompleted: 1, totalInProgress: 0 },
      isLoading: false,
      error: null,
      setFilters: jest.fn(),
      refresh: jest.fn()
    })
  })

  it('should display assessment stats correctly', () => {
    render(<AssessmentHistory userId="test-user" />)
    
    // Teste what user sees, not implementation
    expect(screen.getByText('1 concluídas • 0 em andamento')).toBeInTheDocument()
    expect(screen.getByText('DISC')).toBeInTheDocument()
  })

  it('should handle loading state', () => {
    mockUseAssessmentHistory.mockReturnValue({
      assessments: [],
      isLoading: true,
      // ... other props
    })

    render(<AssessmentHistory userId="test-user" />)
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })
})
```

**❌ INCORRETO**: Mocking React internals
```typescript
// NÃO FAÇA: Mockando React hooks internos
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn()
}))
```

### **3. Hook Test Mocking**

**USE CASE**: Testando `useAssessmentHistory` data fetching logic

```typescript
// ✅ CORRETO: Mock service, teste hook behavior
import { renderHook, act } from '@testing-library/react'
import { useAssessmentHistory } from '@/hooks/use-assessment-history'

// Mock the service layer
const mockAssessmentService = {
  listAssessments: jest.fn()
}
jest.mock('@/lib/services/assessment-service', () => ({
  assessmentService: mockAssessmentService
}))

describe('useAssessmentHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch and return assessment data', async () => {
    mockAssessmentService.listAssessments.mockResolvedValue({
      data: [
        { id: '1', type: 'disc', status: 'completed' }
      ],
      count: 1
    })

    const { result } = renderHook(() => useAssessmentHistory('user-123'))

    // Wait for async operation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.assessments).toHaveLength(1)
    expect(result.current.stats.totalCompleted).toBe(1)
    expect(mockAssessmentService.listAssessments).toHaveBeenCalledWith({
      userId: 'user-123',
      page: 1,
      limit: 1000
    })
  })

  it('should handle errors gracefully', async () => {
    const error = new Error('Network error')
    mockAssessmentService.listAssessments.mockRejectedValue(error)

    const { result } = renderHook(() => useAssessmentHistory('user-123'))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.error).toBe(error)
    expect(result.current.assessments).toEqual([])
  })
})
```

### **4. AuthProvider Mocking**

**USE CASE**: Testando componentes que dependem de autenticação

```typescript
// ✅ CORRETO: Mock AuthProvider context
import { AuthProvider } from '@/components/providers/auth-provider'

const MockAuthProvider = ({ children, mockUser = null }) => {
  const mockContextValue = {
    user: mockUser,
    session: mockUser ? { user: mockUser, access_token: 'mock-token' } : null,
    loading: false,
    signOut: jest.fn(),
    signIn: jest.fn()
  }

  return (
    <AuthProvider value={mockContextValue}>
      {children}
    </AuthProvider>
  )
}

// Usage nos testes
describe('Protected Component', () => {
  it('should render when user is authenticated', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    
    render(
      <MockAuthProvider mockUser={mockUser}>
        <ProtectedComponent />
      </MockAuthProvider>
    )

    expect(screen.getByText('Welcome test@example.com')).toBeInTheDocument()
  })

  it('should redirect when user is not authenticated', () => {
    render(
      <MockAuthProvider mockUser={null}>
        <ProtectedComponent />
      </MockAuthProvider>
    )

    expect(screen.getByText('Please log in')).toBeInTheDocument()
  })
})
```

### **5. API Route Testing**

**USE CASE**: Testando endpoints `/api/assessments`

```typescript
// ✅ CORRETO: Integration test com test database
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/assessments/route'

// Use test database instance
const TEST_USER_ID = 'test-user-123'

describe('/api/assessments', () => {
  beforeEach(async () => {
    // Seed test database with known data
    await seedTestDatabase([
      {
        id: '1',
        user_id: TEST_USER_ID,
        type: 'disc',
        status: 'completed',
        created_at: '2025-01-20T10:00:00Z'
      }
    ])
  })

  afterEach(async () => {
    // Clean test database
    await cleanTestDatabase()
  })

  it('should return user assessments', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      url: `/api/assessments?userId=${TEST_USER_ID}`
    })

    // Mock authentication
    req.headers.authorization = 'Bearer mock-token'
    
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.assessments).toHaveLength(1)
    expect(data.assessments[0].type).toBe('disc')
  })
})
```

## 📚 Mock Factories

### **Assessment Data Factory**

```typescript
// lib/testing/factories/assessment-factory.ts
export const createMockAssessment = (overrides = {}) => ({
  id: 'mock-assessment-1',
  user_id: 'mock-user-123',
  type: 'disc',
  status: 'completed',
  created_at: '2025-01-20T10:00:00Z',
  updated_at: '2025-01-20T10:45:00Z',
  completed_at: '2025-01-20T10:45:00Z',
  disc_results: {
    D: 25,
    I: 15,
    S: 20,
    C: 10
  },
  soft_skills_results: null,
  sjt_results: null,
  progress_data: null,
  ...overrides
})

export const createMockAssessmentList = (count = 3) => {
  return Array.from({ length: count }, (_, index) => 
    createMockAssessment({
      id: `mock-assessment-${index + 1}`,
      type: ['disc', 'soft_skills', 'sjt'][index % 3]
    })
  )
}

// Usage
const mockAssessments = createMockAssessmentList(5)
const incompleteAssessment = createMockAssessment({ 
  status: 'in_progress',
  completed_at: null 
})
```

### **Auth Mock Factory**

```typescript
// lib/testing/factories/auth-factory.ts
export const createMockUser = (overrides = {}) => ({
  id: 'mock-user-123',
  email: 'test@example.com',
  created_at: '2025-01-01T00:00:00Z',
  ...overrides
})

export const createMockSession = (user = null) => {
  if (!user) return null
  
  return {
    user: user || createMockUser(),
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 3600000 // 1 hour
  }
}

// Usage
const mockUser = createMockUser({ email: 'doctor@hospital.com' })
const mockSession = createMockSession(mockUser)
```

## 🚫 Anti-Patterns - O que NÃO fazer

### **❌ 1. Mixing Mock Strategies**
```typescript
// ERRADO: Misturando unit e integration mocks
describe('Component Test', () => {
  // Unit mock
  jest.mock('@/lib/services/assessment-service')
  
  // Integration mock
  const testDatabase = setupTestDatabase()
  
  // Agora você tem dois sources of truth conflitantes!
})
```

### **❌ 2. Over-Mocking**
```typescript
// ERRADO: Mockando everything, including DOM
jest.mock('react-dom', () => ({
  render: jest.fn()
}))

// Se você precisa mockar React/DOM, provavelmente é o tipo errado de teste
```

### **❌ 3. Testing Implementation Details**
```typescript
// ERRADO: Testando como funciona, não o que faz
expect(mockService.methodA).toHaveBeenCalledBefore(mockService.methodB)
expect(component.state.internalCounter).toBe(3)

// CORRETO: Testando behavior observável
expect(screen.getByText('Counter: 3')).toBeInTheDocument()
```

### **❌ 4. Non-Deterministic Mocks**
```typescript
// ERRADO: Mock que muda behavior entre test runs
jest.mock('@/lib/utils', () => ({
  generateId: () => Math.random().toString() // ❌ Non-deterministic!
}))

// CORRETO: Mock deterministic
jest.mock('@/lib/utils', () => ({
  generateId: () => 'mock-id-123' // ✅ Always same value
}))
```

## 📁 File Organization

```
project/
├── lib/
│   └── testing/
│       ├── factories/
│       │   ├── assessment-factory.ts
│       │   ├── auth-factory.ts
│       │   └── index.ts
│       ├── mocks/
│       │   ├── auth-provider.tsx
│       │   ├── assessment-service.ts
│       │   └── supabase-client.ts
│       └── setup/
│           ├── test-database.ts
│           ├── msw-handlers.ts
│           └── jest-setup.ts
├── components/
│   └── __tests__/
│       ├── component.test.tsx     # Component tests
│       └── integration.test.tsx   # Integration tests
└── hooks/
    └── __tests__/
        └── hook.test.ts           # Hook tests
```

## 🎯 Quick Decision Tree

**Quando você está escrevendo um teste, pergunte:**

1. **"Estou testando lógica de negócio isolada?"** → **Unit Test** + Mock external dependencies
2. **"Estou testando como um componente renderiza?"** → **Component Test** + Mock data sources
3. **"Estou testando comunicação entre sistemas?"** → **Integration Test** + Mock external APIs only
4. **"Estou testando um fluxo completo de usuário?"** → **E2E Test** + Mock external services only

## ✅ Success Checklist

Seu teste está bem estruturado se:

- [ ] **Purpose is clear**: Você pode explicar em uma frase o que está testando
- [ ] **Mocks are minimal**: Você mocka apenas o necessário, não tudo
- [ ] **Deterministic**: Sempre produz o mesmo resultado
- [ ] **Fast**: Executa em <100ms (unit) ou <1s (integration)
- [ ] **Isolated**: Não depende de outros testes ou estado global
- [ ] **Readable**: Um novo developer entende rapidamente o que está sendo testado

## 🔧 Common Troubleshooting

### **"Mock não está funcionando"**
1. **Verifique o path**: Jest mocks precisam do path exato
2. **Check timing**: Mocks devem ser definidos ANTES dos imports
3. **Validate scope**: Diferentes describe blocks podem ter mocks conflitantes

### **"Teste funciona sozinho mas falha em suite"**
1. **State bleeding**: Use `afterEach(() => jest.clearAllMocks())`
2. **Async issues**: Use `waitFor()` para operações assíncronas
3. **Mock persistence**: Certifique-se de que mocks são resetados

### **"Coverage baixo apesar de muitos testes"**
1. **Wrong test type**: Talvez precise de integration em vez de unit
2. **Missing edge cases**: Teste error states e edge conditions
3. **Dead code**: Remova código não usado identificado pelo coverage

## 📈 Metrics & Goals

**Target Metrics:**
- **Unit Tests**: >95% coverage, <50ms execution time
- **Component Tests**: >85% coverage, <200ms execution time  
- **Integration Tests**: >80% coverage, <1s execution time
- **Overall**: 0 failing tests, deterministic results

**Quality Indicators:**
- **Flaky test rate**: <1% (tests should pass consistently)
- **Test maintenance**: New feature additions require minimal test changes
- **Developer confidence**: Team can refactor without fear of breaking tests
- **Bug detection**: Tests catch regressions before they reach production
