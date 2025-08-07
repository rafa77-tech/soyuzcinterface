import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/assessment/route'
import assessmentService from '@/lib/services/assessment-service'

// Mock the assessment service
jest.mock('@/lib/services/assessment-service', () => ({
  saveAssessment: jest.fn(),
  getIncompleteAssessment: jest.fn(),
  default: {
    saveAssessment: jest.fn(),
    getIncompleteAssessment: jest.fn(),
  }
}))

// Mock createRouteHandlerClient
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  }
}

jest.mock('@/lib/supabase/server', () => ({
  createRouteHandlerClient: jest.fn(() => mockSupabaseClient),
}))

const mockAssessmentService = assessmentService as jest.Mocked<typeof assessmentService>

describe('Assessment API Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Authentication Security', () => {
    it('should reject requests without valid authentication', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      })

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify({
          type: 'disc',
          status: 'in_progress',
          disc_results: { D: 4, I: 3, S: 2, C: 1 },
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Unauthorized - Valid authentication required')
      expect(mockAssessmentService.saveAssessment).not.toHaveBeenCalled()
    })

    it('should reject expired or invalid tokens', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' },
      })

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Unauthorized - Valid authentication required')
      expect(mockAssessmentService.getIncompleteAssessment).not.toHaveBeenCalled()
    })

    it('should reject malformed authentication headers', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid JWT format' },
      })

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify({
          type: 'soft_skills',
          status: 'in_progress',
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer malformed-token',
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })
  })

  describe('Data Isolation and Authorization', () => {
    const mockUser1 = { id: 'user-1', email: 'user1@example.com' }
    const mockUser2 = { id: 'user-2', email: 'user2@example.com' }

    it('should ensure users can only access their own assessments', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser1 },
        error: null,
      })

      // Mock service to return null (no assessment found for user)
      mockAssessmentService.getIncompleteAssessment.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'GET',
      })

      const response = await GET(request)

      expect(mockAssessmentService.getIncompleteAssessment).toHaveBeenCalledWith(mockUser1.id)
      expect(mockAssessmentService.getIncompleteAssessment).not.toHaveBeenCalledWith(mockUser2.id)
    })

    it('should validate user ID matches authentication context', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser1 },
        error: null,
      })

      mockAssessmentService.saveAssessment.mockResolvedValue({
        id: 'assessment-id',
        status: 'success',
        message: 'Assessment saved',
      })

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify({
          type: 'disc',
          status: 'in_progress',
          disc_results: { D: 4, I: 3, S: 2, C: 1 },
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      await POST(request)

      // Verify the service is called with the authenticated user's ID only
      expect(mockAssessmentService.saveAssessment).toHaveBeenCalledWith(
        expect.any(Object),
        mockUser1.id
      )
    })

    it('should prevent cross-user data access attempts', async () => {
      // User 1 authenticated
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser1 },
        error: null,
      })

      // Try to create assessment with different user data (if it were possible)
      const maliciousPayload = {
        id: 'existing-assessment-id',
        type: 'disc',
        status: 'in_progress',
        user_id: mockUser2.id, // Attempting to specify different user
        disc_results: { D: 4, I: 3, S: 2, C: 1 },
      }

      mockAssessmentService.saveAssessment.mockResolvedValue({
        id: 'assessment-id',
        status: 'success',
        message: 'Assessment saved',
      })

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(maliciousPayload),
        headers: { 'Content-Type': 'application/json' },
      })

      await POST(request)

      // Should still use authenticated user's ID, not the one in payload
      expect(mockAssessmentService.saveAssessment).toHaveBeenCalledWith(
        expect.any(Object),
        mockUser1.id // Should be the authenticated user, not mockUser2.id
      )
    })
  })

  describe('Input Validation and Sanitization', () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' }

    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    })

    it('should reject requests with XSS attempts in string fields', async () => {
      const xssPayload = {
        type: '<script>alert("xss")</script>',
        status: 'in_progress',
        disc_results: { D: 4, I: 3, S: 2, C: 1 },
      }

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(xssPayload),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid data format')
      expect(mockAssessmentService.saveAssessment).not.toHaveBeenCalled()
    })

    it('should reject requests with SQL injection attempts', async () => {
      const sqlInjectionPayload = {
        id: "'; DROP TABLE assessments; --",
        type: 'disc',
        status: 'in_progress',
        disc_results: { D: 4, I: 3, S: 2, C: 1 },
      }

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(sqlInjectionPayload),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid data format')
      expect(responseData.details).toBeDefined()
    })

    it('should validate and reject oversized payloads', async () => {
      // Create a very large payload
      const oversizedResults = {}
      for (let i = 0; i < 1000; i++) {
        oversizedResults[`skill_${i}`] = Math.random() * 10
      }

      const oversizedPayload = {
        type: 'soft_skills',
        status: 'in_progress',
        soft_skills_results: oversizedResults,
      }

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(oversizedPayload),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      // Should either reject due to size or validation
      expect([400, 413]).toContain(response.status) // Bad Request or Payload Too Large
    })

    it('should validate numeric ranges for assessment scores', async () => {
      const outOfRangePayload = {
        type: 'disc',
        status: 'in_progress',
        disc_results: { D: 999, I: -50, S: 2, C: 1 }, // Invalid ranges
      }

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(outOfRangePayload),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid data format')
    })

    it('should prevent prototype pollution attacks', async () => {
      const prototypePollutionPayload = {
        type: 'disc',
        status: 'in_progress',
        '__proto__': { polluted: true },
        'constructor': { prototype: { polluted: true } },
        disc_results: { D: 4, I: 3, S: 2, C: 1 },
      }

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(prototypePollutionPayload),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      
      // Should not pollute Object prototype
      expect(Object.prototype.hasOwnProperty('polluted')).toBe(false)
      expect({}.polluted).toBeUndefined()
    })
  })

  describe('Rate Limiting and DoS Protection', () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' }

    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      mockAssessmentService.saveAssessment.mockResolvedValue({
        id: 'assessment-id',
        status: 'success',
        message: 'Assessment saved',
      })
    })

    it('should handle rapid successive requests gracefully', async () => {
      const validPayload = {
        type: 'disc',
        status: 'in_progress',
        disc_results: { D: 4, I: 3, S: 2, C: 1 },
      }

      // Simulate rapid requests
      const requests = Array(10).fill(null).map(() => 
        new NextRequest('http://localhost:3000/api/assessment', {
          method: 'POST',
          body: JSON.stringify(validPayload),
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const responses = await Promise.all(requests.map(req => POST(req)))

      // All requests should be processed (though rate limiting might apply)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status) // Success or Rate Limited
      })
    })

    it('should handle malformed requests without crashing', async () => {
      const malformedRequests = [
        // Empty body
        new NextRequest('http://localhost:3000/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
        // Invalid JSON
        new NextRequest('http://localhost:3000/api/assessment', {
          method: 'POST',
          body: '{invalid json',
          headers: { 'Content-Type': 'application/json' },
        }),
        // Wrong content type
        new NextRequest('http://localhost:3000/api/assessment', {
          method: 'POST',
          body: 'plain text',
          headers: { 'Content-Type': 'text/plain' },
        }),
      ]

      for (const request of malformedRequests) {
        const response = await POST(request)
        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(response.status).toBeLessThan(600)
        
        // Should not crash or expose internal errors
        const responseData = await response.json()
        expect(responseData.error).toBeDefined()
        expect(responseData.error).not.toContain('Error:') // No stack traces
      }
    })
  })

  describe('Error Information Disclosure', () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' }

    it('should not expose internal system details in error messages', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock service to throw detailed internal error
      mockAssessmentService.saveAssessment.mockRejectedValue(
        new Error('Database connection failed: host=internal-db-server port=5432')
      )

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify({
          type: 'disc',
          status: 'in_progress',
          disc_results: { D: 4, I: 3, S: 2, C: 1 },
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Internal server error')
      
      // Should not expose internal details
      expect(responseData.message).not.toContain('internal-db-server')
      expect(responseData.message).not.toContain('5432')
      expect(responseData).not.toHaveProperty('stack')
    })

    it('should sanitize validation error messages', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify({
          type: 'invalid',
          status: 'in_progress',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid data format')
      
      // Validation details should be safe and not expose system internals
      if (responseData.details) {
        responseData.details.forEach((detail: any) => {
          expect(detail.message).not.toContain('internal')
          expect(detail.message).not.toContain('server')
          expect(detail.message).not.toContain('database')
        })
      }
    })
  })
})