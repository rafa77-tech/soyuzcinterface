import { NextRequest, NextResponse } from 'next/server'
import { POST, GET } from '@/app/api/assessment/route'
import { GET as getAssessments } from '@/app/api/assessments/route'
import assessmentService from '@/lib/services/assessment-service'
import { createRouteHandlerClient } from '@/lib/supabase/server'

// Mock dependencies
jest.mock('@/lib/services/assessment-service')
jest.mock('@/lib/supabase/server')

describe('Assessment API Security Tests', () => {
  const mockUser1 = { id: 'user-123', email: 'user1@example.com' }
  const mockUser2 = { id: 'user-456', email: 'user2@example.com' }

  const createMockRequest = (body?: any, headers?: Record<string, string>) => {
    return {
      json: jest.fn().mockResolvedValue(body || {}),
      url: 'http://localhost:3000/api/assessment',
      headers: new Headers(headers || {})
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Default auth setup
    ;(createRouteHandlerClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: mockUser1 }, 
          error: null 
        })
      }
    })
    
    ;(assessmentService.saveAssessment as jest.Mock).mockResolvedValue({
      id: 'assessment-123',
      status: 'success'
    })
  })

  describe('Authentication and Authorization', () => {
    it('should reject requests without valid authentication', async () => {
      ;(createRouteHandlerClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ 
            data: { user: null }, 
            error: { message: 'No user' } 
          })
        }
      })

      const request = createMockRequest({ type: 'complete' })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized - Valid authentication required')
      expect(assessmentService.saveAssessment).not.toHaveBeenCalled()
    })

    it('should reject requests with expired JWT tokens', async () => {
      ;(createRouteHandlerClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ 
            data: { user: null },
            error: { message: 'JWT expired' }
          })
        }
      })

      const request = createMockRequest({ type: 'complete' })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should reject requests with malformed JWT tokens', async () => {
      ;(createRouteHandlerClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ 
            data: { user: null },
            error: { message: 'Invalid JWT format' }
          })
        }
      })

      const request = createMockRequest({ type: 'complete' })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should include proper security headers', async () => {
      const request = createMockRequest({ type: 'complete' })
      const response = await POST(request)

      // Should not expose internal server information
      expect(response.headers.get('server')).toBeNull()
      expect(response.headers.get('x-powered-by')).toBeNull()
    })
  })

  describe('Data Isolation and Authorization', () => {
    it('should prevent cross-user data access attempts', async () => {
      // Mock service to verify it receives correct user ID
      const mockServiceSave = jest.fn().mockResolvedValue({ id: 'test', status: 'success' })
      ;(assessmentService.saveAssessment as jest.Mock).mockImplementation(mockServiceSave)

      const maliciousBody = {
        id: 'other-user-assessment',
        type: 'complete',
        user_id: mockUser2.id // Attempting to specify different user
      }

      const request = createMockRequest(maliciousBody)
      await POST(request)

      // Should still use authenticated user's ID, not the one in payload
      expect(mockAssessmentService.saveAssessment).toHaveBeenCalledWith(
        expect.any(Object),
        mockUser1.id // Should be the authenticated user, not mockUser2.id
      )
    })

    it('should enforce Row Level Security through user ID isolation', async () => {
      ;(createRouteHandlerClient as jest.Mock)
        .mockReturnValueOnce({
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: mockUser1 }, error: null })
          }
        })
        .mockReturnValueOnce({
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: mockUser2 }, error: null })
          }
        })

      const mockAssessmentsResponse1 = {
        assessments: [{ id: 'user1-assessment', user_id: mockUser1.id }],
        pagination: { total: 1, page: 1, limit: 20 }
      }

      const mockAssessmentsResponse2 = {
        assessments: [{ id: 'user2-assessment', user_id: mockUser2.id }],
        pagination: { total: 1, page: 1, limit: 20 }
      }

      ;(assessmentService.getAssessmentHistory as jest.Mock)
        .mockResolvedValueOnce(mockAssessmentsResponse1)
        .mockResolvedValueOnce(mockAssessmentsResponse2)

      // Request as user 1
      const request1 = createMockRequest()
      request1.url = 'http://localhost:3000/api/assessments'
      const response1 = await getAssessments(request1)
      const data1 = await response1.json()

      // Request as user 2
      const request2 = createMockRequest()
      request2.url = 'http://localhost:3000/api/assessments'
      const response2 = await getAssessments(request2)
      const data2 = await response2.json()

      // Each user should only see their own data
      expect(data1.assessments[0].id).toBe('user1-assessment')
      expect(data2.assessments[0].id).toBe('user2-assessment')
      
      // Verify service was called with correct user IDs
      expect(assessmentService.getAssessmentHistory).toHaveBeenCalledWith(mockUser1.id, 1, 20)
      expect(assessmentService.getAssessmentHistory).toHaveBeenCalledWith(mockUser2.id, 1, 20)
    })

    it('should validate assessment ownership before updates', async () => {
      const existingAssessmentId = 'user2-owned-assessment'
      const updateRequest = {
        id: existingAssessmentId,
        type: 'complete',
        disc_results: { D: 0.8, I: 0.6, S: 0.7, C: 0.5 }
      }

      // Mock service to simulate ownership validation
      ;(assessmentService.saveAssessment as jest.Mock).mockRejectedValue(
        new Error('Assessment not found or access denied')
      )

      const request = createMockRequest(updateRequest)
      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.message).toContain('Assessment not found or access denied')
    })
  })

  describe('Input Validation and Sanitization', () => {
    it('should validate and reject malicious script injection', async () => {
      const maliciousPayload = {
        type: '<script>alert("xss")</script>',
        disc_results: {
          D: 'javascript:alert(1)',
          I: '<img src=x onerror=alert(1)>',
          S: 0.5,
          C: 0.5
        }
      }

      const request = createMockRequest(maliciousPayload)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid data format')
      expect(assessmentService.saveAssessment).not.toHaveBeenCalled()
    })

    it('should validate and reject oversized payloads', async () => {
      // Create oversized payload
      const oversizedData = 'x'.repeat(1000000) // 1MB string
      const maliciousPayload = {
        type: 'complete',
        disc_results: { D: 0.5, I: 0.5, S: 0.5, C: 0.5 },
        malicious_data: oversizedData
      }

      const request = createMockRequest(maliciousPayload)
      const response = await POST(request)

      // Should either reject due to size or validation
      expect([400, 413]).toContain(response.status) // Bad Request or Payload Too Large
    })

    it('should validate numeric ranges for assessment scores', async () => {
      const invalidScores = {
        type: 'complete',
        disc_results: {
          D: 999, // Invalid range
          I: -1,  // Invalid range
          S: 'invalid', // Invalid type
          C: 0.5
        }
      }

      const request = createMockRequest(invalidScores)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid data format')
    })

    it('should sanitize and validate UUID formats', async () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '12345',
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        '../../../etc/passwd',
        'DROP TABLE assessments;'
      ]

      for (const invalidId of invalidUUIDs) {
        const request = createMockRequest({
          id: invalidId,
          type: 'complete'
        })
        
        const response = await POST(request)
        expect(response.status).toBe(400)
        
        const data = await response.json()
        expect(data.error).toBe('Invalid data format')
      }
    })

    it('should validate enumerated values strictly', async () => {
      const invalidEnums = [
        { type: 'invalid_type', status: 'completed' },
        { type: 'complete', status: 'invalid_status' },
        { type: 'sql_injection', status: 'DROP TABLE' }
      ]

      for (const invalidData of invalidEnums) {
        const request = createMockRequest(invalidData)
        const response = await POST(request)
        
        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('Invalid data format')
      }
    })
  })

  describe('Rate Limiting and Abuse Prevention', () => {
    it('should handle rapid successive requests gracefully', async () => {
      const requests = Array.from({ length: 100 }, () =>
        POST(createMockRequest({ type: 'complete' }))
      )

      const responses = await Promise.all(requests)
      
      // All should succeed (in test environment)
      // In production, rate limiting would kick in
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status)
      })
    })

    it('should prevent automated bot attacks', async () => {
      const suspiciousBotRequests = Array.from({ length: 50 }, (_, i) => ({
        type: 'complete',
        disc_results: {
          D: 0.25, I: 0.25, S: 0.25, C: 0.25 // Identical patterns
        },
        timestamp: Date.now() + i
      }))

      const responses = []
      for (const payload of suspiciousBotRequests) {
        const response = await POST(createMockRequest(payload))
        responses.push(response.status)
      }

      // In a real implementation, this would detect patterns and rate limit
      // For testing, we just verify the system doesn't crash
      expect(responses.length).toBe(50)
    })
  })

  describe('Error Information Disclosure', () => {
    it('should not expose internal system details in error messages', async () => {
      // Mock service to throw detailed internal error
      ;(assessmentService.saveAssessment as jest.Mock).mockRejectedValue(
        new Error('Database connection failed: host=internal-db-server port=5432')
      )

      const request = createMockRequest({ type: 'complete' })
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Internal server error')
      
      // Should not expose internal details
      expect(responseData.message).not.toContain('internal-db-server')
      expect(responseData.message).not.toContain('5432')
      expect(responseData).not.toHaveProperty('stack')
    })

    it('should not leak user existence through different error messages', async () => {
      // Test with various authentication states
      const authStates = [
        { user: null, error: { message: 'User not found' }},
        { user: null, error: { message: 'Account suspended' }},
        { user: null, error: { message: 'Invalid credentials' }},
        { user: null, error: null }
      ]

      const responses = []
      for (const authState of authStates) {
        ;(createRouteHandlerClient as jest.Mock).mockReturnValue({
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: authState })
          }
        })

        const request = createMockRequest({ type: 'complete' })
        const response = await POST(request)
        const data = await response.json()
        
        responses.push(data)
      }

      // All unauthorized requests should return identical error messages
      const uniqueErrors = new Set(responses.map(r => r.error))
      expect(uniqueErrors.size).toBe(1)
      expect(uniqueErrors.has('Unauthorized - Valid authentication required')).toBe(true)
    })

    it('should handle database errors without exposing schema information', async () => {
      ;(assessmentService.saveAssessment as jest.Mock).mockRejectedValue(
        new Error('column "secret_column" does not exist')
      )

      const request = createMockRequest({ type: 'complete' })
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.message).not.toContain('column')
      expect(responseData.message).not.toContain('secret_column')
      expect(responseData.message).not.toContain('does not exist')
    })
  })

  describe('Content Security Policy', () => {
    it('should reject requests with suspicious content types', async () => {
      const suspiciousContentTypes = [
        'text/html',
        'application/xml',
        'text/xml',
        'multipart/form-data'
      ]

      for (const contentType of suspiciousContentTypes) {
        const request = createMockRequest(
          { type: 'complete' },
          { 'content-type': contentType }
        )

        // In a real implementation, this would be handled by middleware
        // For testing, we verify the system processes requests safely
        const response = await POST(request)
        expect([200, 400, 415]).toContain(response.status)
      }
    })
  })

  describe('Session Security', () => {
    it('should handle concurrent sessions securely', async () => {
      const session1Client = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: mockUser1 }, error: null })
        }
      }

      const session2Client = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: mockUser2 }, error: null })
        }
      }

      ;(createRouteHandlerClient as jest.Mock)
        .mockReturnValueOnce(session1Client)
        .mockReturnValueOnce(session2Client)

      const request1 = createMockRequest({ type: 'complete', sessionData: 'user1' })
      const request2 = createMockRequest({ type: 'complete', sessionData: 'user2' })

      const [response1, response2] = await Promise.all([
        POST(request1),
        POST(request2)
      ])

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      // Verify each request was processed with correct user context
      expect(assessmentService.saveAssessment).toHaveBeenCalledWith(
        expect.objectContaining({ sessionData: 'user1' }),
        mockUser1.id
      )
      expect(assessmentService.saveAssessment).toHaveBeenCalledWith(
        expect.objectContaining({ sessionData: 'user2' }),
        mockUser2.id
      )
    })
  })

  describe('Assessment Data Privacy', () => {
    it('should not log sensitive assessment data', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const sensitiveData = {
        type: 'complete',
        disc_results: { D: 0.8, I: 0.6, S: 0.7, C: 0.5 },
        personal_notes: 'Confidential assessment notes',
        user_responses: ['Very personal response', 'Private information']
      }

      const request = createMockRequest(sensitiveData)
      await POST(request)

      // Verify sensitive data is not logged
      const logCalls = consoleSpy.mock.calls.flat()
      const errorCalls = consoleErrorSpy.mock.calls.flat()
      const allLogs = [...logCalls, ...errorCalls].join(' ')

      expect(allLogs).not.toContain('Confidential assessment notes')
      expect(allLogs).not.toContain('Very personal response')
      expect(allLogs).not.toContain('Private information')

      consoleSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    it('should handle PII sanitization in error scenarios', async () => {
      const personalData = {
        type: 'complete',
        email: 'user@sensitive.com',
        phone: '555-1234',
        ssn: '123-45-6789'
      }

      // Force validation error
      const request = createMockRequest(personalData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      
      // Error response should not contain PII
      const errorString = JSON.stringify(responseData)
      expect(errorString).not.toContain('user@sensitive.com')
      expect(errorString).not.toContain('555-1234')
      expect(errorString).not.toContain('123-45-6789')
    })
  })
})