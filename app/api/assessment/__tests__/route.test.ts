import { NextRequest } from 'next/server'
import { POST, GET } from '../route'
import assessmentService from '@/lib/services/assessment-service'
import { createRouteHandlerClient } from '@/lib/supabase/server'

// Mock dependencies
jest.mock('@/lib/services/assessment-service')
jest.mock('@/lib/supabase/server')

describe('/api/assessment', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockServiceResponse = {
    id: 'assessment-123',
    status: 'success',
    message: 'Assessment saved successfully'
  }

  const createMockRequest = (body?: any) => {
    return {
      json: jest.fn().mockResolvedValue(body || {}),
      url: 'http://localhost:3000/api/assessment'
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Setup default mocks
    ;(createRouteHandlerClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: mockUser }, 
          error: null 
        })
      }
    })
    
    ;(assessmentService.saveAssessment as jest.Mock).mockResolvedValue(mockServiceResponse)
    ;(assessmentService.getIncompleteAssessment as jest.Mock).mockResolvedValue(null)
  })

  describe('POST /api/assessment', () => {
    it('should create new assessment successfully', async () => {
      const requestBody = {
        type: 'complete',
        status: 'in_progress',
        disc_results: { D: 0.8, I: 0.6, S: 0.7, C: 0.5 }
      }
      
      const request = createMockRequest(requestBody)
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData).toEqual(mockServiceResponse)
      expect(assessmentService.saveAssessment).toHaveBeenCalledWith(requestBody, mockUser.id)
    })

    it('should update existing assessment successfully', async () => {
      const updateData = {
        id: 'existing-123',
        type: 'disc',
        status: 'completed',
        disc_results: { D: 0.9, I: 0.7, S: 0.8, C: 0.6 }
      }
      
      const request = createMockRequest(updateData)
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(assessmentService.saveAssessment).toHaveBeenCalledWith(updateData, mockUser.id)
    })

    it('should handle all assessment types', async () => {
      const assessmentTypes = ['complete', 'disc', 'soft_skills', 'sjt'] as const
      
      for (const type of assessmentTypes) {
        const requestBody = { type }
        const request = createMockRequest(requestBody)
        
        const response = await POST(request)
        expect(response.status).toBe(200)
        
        expect(assessmentService.saveAssessment).toHaveBeenCalledWith(
          expect.objectContaining({ type }),
          mockUser.id
        )
      }
    })

    it('should handle soft skills assessment with results', async () => {
      const requestBody = {
        type: 'soft_skills' as const,
        soft_skills_results: {
          leadership: 0.8,
          communication: 0.9,
          teamwork: 0.7
        }
      }
      
      const request = createMockRequest(requestBody)
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(assessmentService.saveAssessment).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'soft_skills',
          soft_skills_results: requestBody.soft_skills_results
        }),
        mockUser.id
      )
    })

    it('should handle SJT assessment with array results', async () => {
      const requestBody = {
        type: 'sjt' as const,
        sjt_results: [0.8, 0.6, 0.9, 0.7, 0.5]
      }
      
      const request = createMockRequest(requestBody)
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(assessmentService.saveAssessment).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sjt',
          sjt_results: [0.8, 0.6, 0.9, 0.7, 0.5]
        }),
        mockUser.id
      )
    })

    it('should return 401 when user not authenticated', async () => {
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
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Unauthorized - Valid authentication required'
      })
    })

    it('should validate required type field', async () => {
      const request = createMockRequest({}) // Missing type
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Invalid data format')
      expect(responseData.details).toBeDefined()
    })

    it('should validate assessment type enum', async () => {
      const request = createMockRequest({ type: 'invalid_type' })
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Invalid data format')
    })

    it('should validate DISC results structure', async () => {
      const request = createMockRequest({
        type: 'disc',
        disc_results: { D: 'invalid', I: 0.6 } // Invalid number
      })
      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })

    it('should validate UUID format for ID', async () => {
      const request = createMockRequest({
        id: 'invalid-uuid',
        type: 'complete'
      })
      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })

    it('should handle service errors gracefully', async () => {
      ;(assessmentService.saveAssessment as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )
      
      const request = createMockRequest({ type: 'complete' })
      const response = await POST(request)
      
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Internal server error')
      expect(responseData.message).toBe('Database connection failed')
    })

    it('should handle unexpected errors', async () => {
      ;(assessmentService.saveAssessment as jest.Mock).mockRejectedValue('Unexpected error')
      
      const request = createMockRequest({ type: 'complete' })
      const response = await POST(request)
      
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.message).toBe('Unknown error occurred')
    })
  })

  describe('GET /api/assessment', () => {
    it('should return incomplete assessment', async () => {
      const incompleteAssessment = {
        id: 'assessment-123',
        type: 'complete',
        status: 'in_progress',
        disc_results: { D: 0.8, I: 0.6, S: 0.7, C: 0.5 }
      }
      
      ;(assessmentService.getIncompleteAssessment as jest.Mock).mockResolvedValue(incompleteAssessment)
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(incompleteAssessment)
      expect(assessmentService.getIncompleteAssessment).toHaveBeenCalledWith(mockUser.id)
    })

    it('should return 404 when no incomplete assessment found', async () => {
      ;(assessmentService.getIncompleteAssessment as jest.Mock).mockResolvedValue(null)
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'No incomplete assessment found'
      })
    })

    it('should return 401 when user not authenticated', async () => {
      ;(createRouteHandlerClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ 
            data: { user: null }, 
            error: null 
          })
        }
      })
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Unauthorized - Valid authentication required'
      })
    })

    it('should handle service errors in GET', async () => {
      ;(assessmentService.getIncompleteAssessment as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Internal server error')
      expect(responseData.message).toBe('Database error')
    })
  })

  describe('Authentication and Authorization', () => {
    it('should handle auth client errors', async () => {
      ;(createRouteHandlerClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ 
            data: { user: null },
            error: { message: 'Invalid JWT' }
          })
        }
      })
      
      const request = createMockRequest({ type: 'complete' })
      const response = await POST(request)
      
      expect(response.status).toBe(401)
    })

    it('should pass correct user ID to service', async () => {
      const testUserId = 'test-user-456'
      ;(createRouteHandlerClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ 
            data: { user: { id: testUserId } },
            error: null
          })
        }
      })
      
      const request = createMockRequest({ type: 'complete' })
      await POST(request)
      
      expect(assessmentService.saveAssessment).toHaveBeenCalledWith(
        expect.any(Object),
        testUserId
      )
    })
  })

  describe('Data Validation Edge Cases', () => {
    it('should accept null results', async () => {
      const requestBody = {
        type: 'complete' as const,
        disc_results: null,
        soft_skills_results: null,
        sjt_results: null
      }
      
      const request = createMockRequest(requestBody)
      const response = await POST(request)
      
      expect(response.status).toBe(200)
    })

    it('should validate status enum values', async () => {
      const request = createMockRequest({
        type: 'complete',
        status: 'invalid_status'
      })
      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })

    it('should accept valid UUID for id field', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000'
      const request = createMockRequest({
        id: validUuid,
        type: 'complete'
      })
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(assessmentService.saveAssessment).toHaveBeenCalledWith(
        expect.objectContaining({ id: validUuid }),
        mockUser.id
      )
    })
  })
})