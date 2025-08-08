import { NextRequest } from 'next/server'
import { GET } from '../route'
import assessmentService from '@/lib/services/assessment-service'
import { createRouteHandlerClient } from '@/lib/supabase/server'

// Mock dependencies
jest.mock('@/lib/services/assessment-service')
jest.mock('@/lib/supabase/server')

describe('/api/assessments', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockAssessmentsResponse = {
    assessments: [
      {
        id: 'assessment-1',
        type: 'complete',
        status: 'completed',
        created_at: '2024-01-01T00:00:00.000Z',
        completed_at: '2024-01-01T01:00:00.000Z'
      },
      {
        id: 'assessment-2',
        type: 'disc',
        status: 'in_progress',
        created_at: '2024-01-02T00:00:00.000Z',
        completed_at: null
      }
    ],
    pagination: {
      total: 15,
      page: 1,
      limit: 20
    }
  }

  const createMockRequest = (searchParams?: Record<string, string>) => {
    const url = new URL('http://localhost:3000/api/assessments')
    
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }
    
    return {
      url: url.toString()
    } as NextRequest
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
    
    ;(assessmentService.getAssessmentHistory as jest.Mock).mockResolvedValue(mockAssessmentsResponse)
  })

  describe('GET /api/assessments', () => {
    it('should return assessment history with default pagination', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData).toEqual(mockAssessmentsResponse)
      expect(assessmentService.getAssessmentHistory).toHaveBeenCalledWith(mockUser.id, 1, 20)
    })

    it('should handle custom pagination parameters', async () => {
      const request = createMockRequest({ page: '2', limit: '10' })
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      expect(assessmentService.getAssessmentHistory).toHaveBeenCalledWith(mockUser.id, 2, 10)
    })

    it('should handle string pagination parameters correctly', async () => {
      const request = createMockRequest({ page: '3', limit: '5' })
      await GET(request)
      
      expect(assessmentService.getAssessmentHistory).toHaveBeenCalledWith(mockUser.id, 3, 5)
    })

    it('should return empty results when no assessments', async () => {
      const emptyResponse = {
        assessments: [],
        pagination: { total: 0, page: 1, limit: 20 }
      }
      
      ;(assessmentService.getAssessmentHistory as jest.Mock).mockResolvedValue(emptyResponse)
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(emptyResponse)
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
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Unauthorized - Valid authentication required'
      })
    })

    describe('Pagination Validation', () => {
      it('should reject page less than 1', async () => {
        const request = createMockRequest({ page: '0' })
        const response = await GET(request)
        
        expect(response.status).toBe(400)
        const responseData = await response.json()
        expect(responseData.error).toBe('Invalid pagination parameters')
        expect(responseData.message).toBe('Page must be >= 1 and limit must be between 1 and 100')
      })

      it('should reject negative page', async () => {
        const request = createMockRequest({ page: '-1' })
        const response = await GET(request)
        
        expect(response.status).toBe(400)
      })

      it('should reject limit less than 1', async () => {
        const request = createMockRequest({ limit: '0' })
        const response = await GET(request)
        
        expect(response.status).toBe(400)
      })

      it('should reject limit greater than 100', async () => {
        const request = createMockRequest({ limit: '101' })
        const response = await GET(request)
        
        expect(response.status).toBe(400)
      })

      it('should accept limit of exactly 100', async () => {
        const request = createMockRequest({ limit: '100' })
        const response = await GET(request)
        
        expect(response.status).toBe(200)
        expect(assessmentService.getAssessmentHistory).toHaveBeenCalledWith(mockUser.id, 1, 100)
      })

      it('should accept limit of exactly 1', async () => {
        const request = createMockRequest({ limit: '1' })
        const response = await GET(request)
        
        expect(response.status).toBe(200)
        expect(assessmentService.getAssessmentHistory).toHaveBeenCalledWith(mockUser.id, 1, 1)
      })

      it('should handle invalid numeric strings', async () => {
        const request = createMockRequest({ page: 'abc', limit: 'xyz' })
        const response = await GET(request)
        
        expect(response.status).toBe(400)
      })

      it('should handle decimal numbers by rounding down', async () => {
        const request = createMockRequest({ page: '2.7', limit: '15.3' })
        const response = await GET(request)
        
        expect(response.status).toBe(200)
        expect(assessmentService.getAssessmentHistory).toHaveBeenCalledWith(mockUser.id, 2, 15)
      })
    })

    describe('Error Handling', () => {
      it('should handle service errors gracefully', async () => {
        ;(assessmentService.getAssessmentHistory as jest.Mock).mockRejectedValue(
          new Error('Database connection failed')
        )
        
        const request = createMockRequest()
        const response = await GET(request)
        
        expect(response.status).toBe(500)
        const responseData = await response.json()
        expect(responseData.error).toBe('Internal server error')
        expect(responseData.message).toBe('Database connection failed')
      })

      it('should handle unexpected errors', async () => {
        ;(assessmentService.getAssessmentHistory as jest.Mock).mockRejectedValue('Unexpected error')
        
        const request = createMockRequest()
        const response = await GET(request)
        
        expect(response.status).toBe(500)
        const responseData = await response.json()
        expect(responseData.message).toBe('Unknown error occurred')
      })

      it('should log errors to console', async () => {
        const error = new Error('Test error')
        ;(assessmentService.getAssessmentHistory as jest.Mock).mockRejectedValue(error)
        
        const request = createMockRequest()
        await GET(request)
        
        expect(console.error).toHaveBeenCalledWith('Error in GET /api/assessments:', error)
      })
    })

    describe('Authentication Edge Cases', () => {
      it('should handle auth client returning null user with no error', async () => {
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
      })

      it('should pass correct user ID to service', async () => {
        const testUserId = 'different-user-456'
        ;(createRouteHandlerClient as jest.Mock).mockReturnValue({
          auth: {
            getUser: jest.fn().mockResolvedValue({ 
              data: { user: { id: testUserId } },
              error: null
            })
          }
        })
        
        const request = createMockRequest()
        await GET(request)
        
        expect(assessmentService.getAssessmentHistory).toHaveBeenCalledWith(
          testUserId,
          1,
          20
        )
      })
    })

    describe('URL Parameter Edge Cases', () => {
      it('should handle missing parameters gracefully', async () => {
        const request = createMockRequest()
        const response = await GET(request)
        
        expect(response.status).toBe(200)
        // Should use defaults: page=1, limit=20
        expect(assessmentService.getAssessmentHistory).toHaveBeenCalledWith(mockUser.id, 1, 20)
      })

      it('should handle empty string parameters', async () => {
        const request = createMockRequest({ page: '', limit: '' })
        const response = await GET(request)
        
        expect(response.status).toBe(200)
        // Should use defaults when empty strings
        expect(assessmentService.getAssessmentHistory).toHaveBeenCalledWith(mockUser.id, 1, 20)
      })

      it('should handle extra query parameters', async () => {
        const request = createMockRequest({ 
          page: '2', 
          limit: '10', 
          extra: 'ignored',
          filter: 'also-ignored' 
        })
        const response = await GET(request)
        
        expect(response.status).toBe(200)
        expect(assessmentService.getAssessmentHistory).toHaveBeenCalledWith(mockUser.id, 2, 10)
      })
    })

    describe('Response Structure Validation', () => {
      it('should return properly structured response for large datasets', async () => {
        const largeResponse = {
          assessments: Array.from({ length: 50 }, (_, i) => ({
            id: `assessment-${i}`,
            type: 'complete',
            status: 'completed',
            created_at: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
            completed_at: `2024-01-${String(i + 1).padStart(2, '0')}T01:00:00.000Z`
          })),
          pagination: {
            total: 150,
            page: 2,
            limit: 50
          }
        }
        
        ;(assessmentService.getAssessmentHistory as jest.Mock).mockResolvedValue(largeResponse)
        
        const request = createMockRequest({ page: '2', limit: '50' })
        const response = await GET(request)
        
        expect(response.status).toBe(200)
        const responseData = await response.json()
        expect(responseData.assessments).toHaveLength(50)
        expect(responseData.pagination.total).toBe(150)
        expect(responseData.pagination.page).toBe(2)
        expect(responseData.pagination.limit).toBe(50)
      })
    })
  })
})