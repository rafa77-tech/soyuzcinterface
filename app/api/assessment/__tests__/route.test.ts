import { NextRequest, NextResponse } from 'next/server'
import { GET, POST } from '../route'

// Mock Supabase
const mockSupabaseSelect = jest.fn()
const mockSupabaseInsert = jest.fn()
const mockSupabaseUpdate = jest.fn()
const mockSupabaseFrom = jest.fn(() => ({
  select: mockSupabaseSelect,
  insert: mockSupabaseInsert,
  update: mockSupabaseUpdate,
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
  single: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: mockSupabaseFrom,
    auth: {
      getUser: jest.fn()
    }
  }))
}))

// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}))

describe('/api/assessment API endpoints', () => {
  let mockRequest: Partial<NextRequest>
  const mockUser = { id: 'test-user-id', email: 'test@example.com' }

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequest = {
      headers: new Headers({
        'authorization': 'Bearer valid-jwt-token',
        'content-type': 'application/json'
      })
    }
    
    // Mock successful auth by default
    require('@/lib/supabase/server').createClient.mockReturnValue({
      from: mockSupabaseFrom,
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    })
  })

  describe('POST /api/assessment', () => {
    it('should create new assessment successfully', async () => {
      const assessmentData = {
        type: 'complete',
        status: 'in_progress',
        disc_results: { D: 4, I: 3, S: 2, C: 1 },
        soft_skills_results: {
          comunicacao: 8,
          lideranca: 7,
          trabalhoEquipe: 9,
          resolucaoProblemas: 6,
          adaptabilidade: 8,
          criatividade: 5,
          gestaoTempo: 7,
          negociacao: 6
        }
      }

      const mockCreatedAssessment = {
        id: 'new-assessment-id',
        user_id: mockUser.id,
        ...assessmentData,
        created_at: '2025-01-01T00:00:00Z'
      }

      mockSupabaseInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockCreatedAssessment,
            error: null
          })
        })
      })

      const request = {
        ...mockRequest,
        json: jest.fn().mockResolvedValue(assessmentData)
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData).toEqual({
        id: 'new-assessment-id',
        status: 'success',
        message: 'Assessment saved successfully'
      })
      expect(mockSupabaseInsert).toHaveBeenCalledWith([{
        user_id: mockUser.id,
        ...assessmentData
      }])
    })

    it('should update existing assessment successfully', async () => {
      const assessmentData = {
        id: 'existing-assessment-id',
        type: 'complete',
        status: 'completed',
        disc_results: { D: 4, I: 3, S: 2, C: 1 },
        completed_at: '2025-01-01T01:00:00Z'
      }

      const mockUpdatedAssessment = {
        ...assessmentData,
        user_id: mockUser.id,
        created_at: '2025-01-01T00:00:00Z'
      }

      mockSupabaseUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedAssessment,
                error: null
              })
            })
          })
        })
      })

      const request = {
        ...mockRequest,
        json: jest.fn().mockResolvedValue(assessmentData)
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toEqual({
        id: 'existing-assessment-id',
        status: 'success',
        message: 'Assessment updated successfully'
      })
    })

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required 'type' field
        status: 'in_progress'
      }

      const request = {
        ...mockRequest,
        json: jest.fn().mockResolvedValue(invalidData)
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('validation')
    })

    it('should handle authentication errors', async () => {
      // Mock failed auth
      require('@/lib/supabase/server').createClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid token' }
          })
        }
      })

      const request = {
        headers: new Headers({
          'authorization': 'Bearer invalid-token',
          'content-type': 'application/json'
        }),
        json: jest.fn().mockResolvedValue({ type: 'complete', status: 'in_progress' })
      } as unknown as NextRequest

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should handle database errors', async () => {
      const assessmentData = {
        type: 'complete',
        status: 'in_progress',
        disc_results: { D: 4, I: 3, S: 2, C: 1 }
      }

      mockSupabaseInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed', code: 'DB_ERROR' }
          })
        })
      })

      const request = {
        ...mockRequest,
        json: jest.fn().mockResolvedValue(assessmentData)
      } as unknown as NextRequest

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should handle malformed JSON', async () => {
      const request = {
        ...mockRequest,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as unknown as NextRequest

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should sanitize and validate JSON results', async () => {
      const assessmentDataWithXSS = {
        type: 'complete',
        status: 'in_progress',
        disc_results: { D: 4, I: 3, S: 2, C: 1 },
        // Attempt XSS injection
        malicious_field: '<script>alert("xss")</script>'
      }

      const mockResult = {
        id: 'test-id',
        user_id: mockUser.id,
        type: 'complete',
        status: 'in_progress',
        disc_results: { D: 4, I: 3, S: 2, C: 1 },
        created_at: '2025-01-01T00:00:00Z'
      }

      mockSupabaseInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockResult,
            error: null
          })
        })
      })

      const request = {
        ...mockRequest,
        json: jest.fn().mockResolvedValue(assessmentDataWithXSS)
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.id).toBe('test-id')
      // Malicious field should be filtered out
      expect(mockSupabaseInsert).toHaveBeenCalledWith([{
        user_id: mockUser.id,
        type: 'complete',
        status: 'in_progress',
        disc_results: { D: 4, I: 3, S: 2, C: 1 }
        // malicious_field should not be present
      }])
    })
  })

  describe('GET /api/assessment', () => {
    it('should return incomplete assessment for user', async () => {
      const mockIncompleteAssessment = {
        id: 'incomplete-assessment-id',
        user_id: mockUser.id,
        type: 'complete',
        status: 'in_progress',
        disc_results: { D: 4, I: 3, S: 2, C: 1 },
        created_at: '2025-01-01T00:00:00Z'
      }

      mockSupabaseSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: mockIncompleteAssessment,
                error: null
              })
            })
          })
        })
      })

      const request = mockRequest as NextRequest

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toEqual(mockIncompleteAssessment)
      expect(mockSupabaseSelect).toHaveBeenCalledWith('*')
    })

    it('should return 404 when no incomplete assessment found', async () => {
      mockSupabaseSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        })
      })

      const request = mockRequest as NextRequest

      const response = await GET(request)

      expect(response.status).toBe(404)
    })

    it('should handle authentication errors on GET', async () => {
      // Mock failed auth
      require('@/lib/supabase/server').createClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Unauthorized' }
          })
        }
      })

      const request = {
        headers: new Headers({
          'authorization': 'Bearer invalid-token'
        })
      } as NextRequest

      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('Rate Limiting and Security', () => {
    it('should handle rapid successive requests', async () => {
      const assessmentData = {
        type: 'complete',
        status: 'in_progress',
        disc_results: { D: 4, I: 3, S: 2, C: 1 }
      }

      mockSupabaseInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'rate-limit-test', ...assessmentData },
            error: null
          })
        })
      })

      const requests = Array.from({ length: 5 }, () => ({
        ...mockRequest,
        json: jest.fn().mockResolvedValue(assessmentData)
      } as unknown as NextRequest))

      const responses = await Promise.all(requests.map(req => POST(req)))

      // All requests should succeed (rate limiting would be implemented at infrastructure level)
      responses.forEach(response => {
        expect([201, 200]).toContain(response.status)
      })
    })

    it('should validate content-type header', async () => {
      const request = {
        headers: new Headers({
          'authorization': 'Bearer valid-jwt-token',
          'content-type': 'text/plain' // Invalid content type
        }),
        json: jest.fn().mockResolvedValue({ type: 'complete', status: 'in_progress' })
      } as unknown as NextRequest

      const response = await POST(request)

      // Should handle gracefully or reject based on implementation
      expect([400, 415]).toContain(response.status)
    })
  })

  describe('Data Integrity and Edge Cases', () => {
    it('should handle very large assessment results', async () => {
      const largeAssessmentData = {
        type: 'complete',
        status: 'completed',
        disc_results: { D: 4, I: 3, S: 2, C: 1 },
        soft_skills_results: {
          comunicacao: 8,
          lideranca: 7,
          trabalhoEquipe: 9,
          resolucaoProblemas: 6,
          adaptabilidade: 8,
          criatividade: 5,
          gestaoTempo: 7,
          negociacao: 6
        },
        sjt_results: new Array(1000).fill(0).map(() => Math.floor(Math.random() * 9) + 1), // Very large array
        notes: 'A'.repeat(10000) // Large text field
      }

      mockSupabaseInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'large-assessment', ...largeAssessmentData },
            error: null
          })
        })
      })

      const request = {
        ...mockRequest,
        json: jest.fn().mockResolvedValue(largeAssessmentData)
      } as unknown as NextRequest

      const response = await POST(request)
      
      expect([201, 413]).toContain(response.status) // Success or Payload Too Large
    })

    it('should handle concurrent assessment updates', async () => {
      const baseAssessment = {
        id: 'concurrent-test-id',
        type: 'complete',
        status: 'in_progress',
        disc_results: { D: 4, I: 3, S: 2, C: 1 }
      }

      const update1 = { ...baseAssessment, disc_results: { D: 5, I: 3, S: 2, C: 1 } }
      const update2 = { ...baseAssessment, disc_results: { D: 4, I: 5, S: 2, C: 1 } }

      mockSupabaseUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn()
                .mockResolvedValueOnce({ data: { ...update1, updated_at: '2025-01-01T00:00:01Z' }, error: null })
                .mockResolvedValueOnce({ data: { ...update2, updated_at: '2025-01-01T00:00:02Z' }, error: null })
            })
          })
        })
      })

      const request1 = {
        ...mockRequest,
        json: jest.fn().mockResolvedValue(update1)
      } as unknown as NextRequest

      const request2 = {
        ...mockRequest,
        json: jest.fn().mockResolvedValue(update2)
      } as unknown as NextRequest

      const [response1, response2] = await Promise.all([
        POST(request1),
        POST(request2)
      ])

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
    })
  })
})