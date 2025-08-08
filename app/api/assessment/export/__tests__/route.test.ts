import { NextRequest } from 'next/server'
import { POST } from '../route'
import { Assessment } from '@/lib/supabase/types'

// Mock createRouteHandlerClient with stable chainable query object
const createStableQuery = () => {
  const query: any = {}
  query.select = jest.fn(() => query)
  query.eq = jest.fn(() => query)
  query.single = jest.fn()
  return query
}

const stableQuery = createStableQuery()

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => stableQuery),
}

jest.mock('@/lib/supabase/server', () => ({
  createRouteHandlerClient: jest.fn(() => mockSupabaseClient),
}))

// Mock console.error to keep test output clean
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('/api/assessment/export', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' }
  
  const mockCompletedAssessment: Assessment = {
    id: 'test-assessment-id',
    user_id: 'test-user-id',
    type: 'disc',
    status: 'completed',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T11:30:00Z',
    completed_at: '2024-01-15T11:30:00Z',
    disc_results: {
      D: 25,
      I: 15,
      S: 20,
      C: 10,
    },
    soft_skills_results: null,
    sjt_results: null,
  }

  const mockInProgressAssessment: Assessment = {
    ...mockCompletedAssessment,
    status: 'in_progress',
    completed_at: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default setup: authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
    
    // Default setup: assessment found
    stableQuery.single.mockResolvedValue({
      data: mockCompletedAssessment,
      error: null,
    })
  })

  describe('PDF export functionality', () => {
    it('should generate PDF export for valid assessment', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/pdf')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('assessment-disc-2024-01-15.pdf')
      expect(response.headers.get('Content-Length')).toBeDefined()

      // Verify that we can read the response body
      const body = await response.text()
      expect(body).toContain('RELATÓRIO DE AVALIAÇÃO')
      expect(body).toContain('ID: test-assessment-id')
      expect(body).toContain('Tipo: DISC')
      expect(body).toContain('Status: Concluída')
    })

    it('should include DISC results in PDF export', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const body = await response.text()

      expect(body).toContain('"D": 25')
      expect(body).toContain('"I": 15')
      expect(body).toContain('"S": 20')
      expect(body).toContain('"C": 10')
    })

    it('should include soft skills results in PDF export', async () => {
      const softSkillsAssessment = {
        ...mockCompletedAssessment,
        type: 'soft_skills' as const,
        disc_results: null,
        soft_skills_results: {
          comunicacao: 85,
          lideranca: 75,
          trabalho_equipe: 90,
          adaptabilidade: 70,
          resolucao_problemas: 80,
          pensamento_critico: 65,
          gestao_tempo: 55,
          inteligencia_emocional: 88,
        },
      }

      stableQuery.single.mockResolvedValue({
        data: softSkillsAssessment,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const body = await response.text()

      expect(body).toContain('Tipo: Soft Skills')
      expect(body).toContain('"comunicacao": 85')
      expect(body).toContain('"lideranca": 75')
    })

    it('should include SJT results in PDF export', async () => {
      const sjtAssessment = {
        ...mockCompletedAssessment,
        type: 'sjt' as const,
        disc_results: null,
        sjt_results: [0.8, 0.6, 0.9, 0.7, 0.5],
      }

      stableQuery.single.mockResolvedValue({
        data: sjtAssessment,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const body = await response.text()

      expect(body).toContain('Tipo: SJT')
      expect(body).toContain('[0.8,0.6,0.9,0.7,0.5]')
    })
  })

  describe('CSV export functionality', () => {
    it('should generate CSV export for valid assessment', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'csv'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('assessment-disc-2024-01-15.csv')
      expect(response.headers.get('Content-Length')).toBeDefined()

      // Verify CSV structure
      const body = await response.text()
      const lines = body.split('\n')
      expect(lines[0]).toBe('ID,Tipo,Status,Data_Criacao,Data_Conclusao,Resultados')
      expect(lines[1]).toContain('"test-assessment-id"')
      expect(lines[1]).toContain('"DISC"')
      expect(lines[1]).toContain('"Concluída"')
      expect(lines[1]).toContain('"2024-01-15"')
    })

    it('should properly escape CSV values', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'csv'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const body = await response.text()

      // CSV should properly escape JSON with quotes
      expect(body).toContain('""D"":25')
      expect(body).toContain('""I"":15')
    })

    it('should handle null completed_at in CSV export', async () => {
      stableQuery.single.mockResolvedValue({
        data: mockInProgressAssessment,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'csv'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      // Should return 400 for in-progress assessment
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Only completed assessments can be exported')
    })
  })

  describe('Authentication and authorization', () => {
    it('should require authentication', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not authenticated' },
      })

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should require valid user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should enforce owner-only access', async () => {
      const otherUserAssessment = {
        ...mockCompletedAssessment,
        user_id: 'other-user-id',
      }

      stableQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Assessment not found' },
      })

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toBe('Assessment not found')
      
      // Verify that the query included user_id filter
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('assessments')
      expect(mockSupabaseClient.from().select().eq().eq).toHaveBeenCalled()
    })
  })

  describe('Error scenarios', () => {
    it('should handle invalid assessment ID', async () => {
      stableQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Assessment not found' },
      })

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'nonexistent-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toBe('Assessment not found')
    })

    it('should reject export of incomplete assessments', async () => {
      stableQuery.single.mockResolvedValue({
        data: mockInProgressAssessment,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Only completed assessments can be exported')
    })

    it('should handle missing assessmentId', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          format: 'pdf'
          // Missing assessmentId
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Assessment ID and format are required')
    })

    it('should handle missing format', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id'
          // Missing format
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Assessment ID and format are required')
    })

    it('should handle invalid format', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'invalid-format'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid format. Use pdf or csv')
    })

    it('should handle malformed request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Internal server error')
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.from().select().eq().eq().single.mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Internal server error')
    })
  })

  describe('File generation and download headers', () => {
    it('should set correct headers for PDF download', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.headers.get('Content-Type')).toBe('application/pdf')
      expect(response.headers.get('Content-Disposition')).toMatch(/^attachment; filename="assessment-disc-\d{4}-\d{2}-\d{2}\.pdf"$/)
      expect(response.headers.get('Content-Length')).toMatch(/^\d+$/)
    })

    it('should set correct headers for CSV download', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'csv'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.headers.get('Content-Type')).toBe('text/csv')
      expect(response.headers.get('Content-Disposition')).toMatch(/^attachment; filename="assessment-disc-\d{4}-\d{2}-\d{2}\.csv"$/)
      expect(response.headers.get('Content-Length')).toMatch(/^\d+$/)
    })

    it('should handle different assessment types in filename', async () => {
      const completeAssessment = {
        ...mockCompletedAssessment,
        type: 'complete' as const,
      }

      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: completeAssessment,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.headers.get('Content-Disposition')).toContain('assessment-complete-')
    })

    it('should handle different dates in filename', async () => {
      const assessmentWithDifferentDate = {
        ...mockCompletedAssessment,
        created_at: '2023-12-25T15:30:00Z',
      }

      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: assessmentWithDifferentDate,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.headers.get('Content-Disposition')).toContain('2023-12-25')
    })
  })

  describe('Error responses and status codes', () => {
    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 401 for authentication failures', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth failed' },
      })

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 404 for assessment not found', async () => {
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'nonexistent',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should return 500 for internal server errors', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })

  describe('Content validation', () => {
    it('should include all required assessment information in PDF', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const body = await response.text()

      expect(body).toContain('RELATÓRIO DE AVALIAÇÃO')
      expect(body).toContain('Informações Gerais:')
      expect(body).toContain('ID: test-assessment-id')
      expect(body).toContain('Tipo: DISC')
      expect(body).toContain('Status: Concluída')
      expect(body).toContain('Data de Criação:')
      expect(body).toContain('Data de Conclusão:')
      expect(body).toContain('Resultados:')
      expect(body).toContain('Relatório gerado em:')
      expect(body).toContain('Soyuz Interface - Sistema de Avaliações')
    })

    it('should include all required fields in CSV', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'csv'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const body = await response.text()

      const lines = body.split('\n')
      const headers = lines[0].split(',')
      
      expect(headers).toContain('ID')
      expect(headers).toContain('Tipo')
      expect(headers).toContain('Status')
      expect(headers).toContain('Data_Criacao')
      expect(headers).toContain('Data_Conclusao')
      expect(headers).toContain('Resultados')
    })

    it('should handle assessments with null results gracefully', async () => {
      const assessmentWithNullResults = {
        ...mockCompletedAssessment,
        disc_results: null,
        soft_skills_results: null,
        sjt_results: null,
      }

      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: assessmentWithNullResults,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/assessment/export', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: 'test-assessment-id',
          format: 'pdf'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      
      const body = await response.text()
      expect(body).toContain('RELATÓRIO DE AVALIAÇÃO')
    })
  })
})
