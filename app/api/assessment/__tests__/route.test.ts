import { NextRequest } from 'next/server'
import { POST, GET } from '../route'
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

describe('/api/assessment', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' }
  
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('POST /api/assessment', () => {
    const validAssessmentData = {
      type: 'complete' as const,
      status: 'in_progress' as const,
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
      sjt_results: [8, 7, 9, 6, 5]
    }

    it('should create a new assessment successfully', async () => {
      // Mock authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock service response
      const mockServiceResponse = {
        id: 'new-assessment-id',
        status: 'success',
        message: 'Assessment created successfully'
      }
      mockAssessmentService.saveAssessment.mockResolvedValue(mockServiceResponse)

      // Create request
      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(validAssessmentData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toEqual(mockServiceResponse)
      expect(mockAssessmentService.saveAssessment).toHaveBeenCalledWith(
        {
          ...validAssessmentData,
          soft_skills_results: validAssessmentData.soft_skills_results
        },
        mockUser.id
      )
    })

    it('should update existing assessment successfully', async () => {
      const updateData = {
        id: 'existing-assessment-id',
        type: 'disc' as const,
        status: 'completed' as const,
        disc_results: { D: 4, I: 3, S: 2, C: 1 }
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockServiceResponse = {
        id: 'existing-assessment-id',
        status: 'success',
        message: 'Assessment updated successfully'
      }
      mockAssessmentService.saveAssessment.mockResolvedValue(mockServiceResponse)

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toEqual(mockServiceResponse)
      expect(mockAssessmentService.saveAssessment).toHaveBeenCalledWith(updateData, mockUser.id)
    })

    it('should return 401 for unauthenticated requests', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not authenticated' },
      })

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(validAssessmentData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData).toEqual({
        error: 'Unauthorized - Valid authentication required'
      })
      expect(mockAssessmentService.saveAssessment).not.toHaveBeenCalled()
    })

    it('should return 401 when user is null', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(validAssessmentData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData).toEqual({
        error: 'Unauthorized - Valid authentication required'
      })
    })

    it('should return 400 for invalid data format', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const invalidData = {
        type: 'invalid-type', // Invalid enum value
        status: 'in_progress',
        disc_results: { D: 'invalid' } // Invalid type
      }

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid data format')
      expect(responseData.details).toBeDefined()
      expect(Array.isArray(responseData.details)).toBe(true)
      expect(mockAssessmentService.saveAssessment).not.toHaveBeenCalled()
    })

    it('should return 400 for malformed JSON', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/assessment', {
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

    it('should return 500 when service throws error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockAssessmentService.saveAssessment.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(validAssessmentData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData).toEqual({
        error: 'Internal server error',
        message: 'Database connection failed'
      })
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle non-Error exceptions', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockAssessmentService.saveAssessment.mockRejectedValue('String error')

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(validAssessmentData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData).toEqual({
        error: 'Internal server error',
        message: 'Unknown error occurred'
      })
    })

    it('should validate required fields', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const incompleteData = {
        // Missing required 'type' field
        status: 'in_progress'
      }

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid data format')
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['type'],
            message: expect.stringContaining('Required')
          })
        ])
      )
    })

    it('should validate UUID format for id field', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const dataWithInvalidUuid = {
        id: 'invalid-uuid',
        type: 'disc',
        status: 'in_progress'
      }

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(dataWithInvalidUuid),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid data format')
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['id'],
            message: expect.stringContaining('uuid')
          })
        ])
      )
    })
  })

  describe('GET /api/assessment', () => {
    it('should return incomplete assessment successfully', async () => {
      const mockIncompleteAssessment = {
        id: 'incomplete-assessment-id',
        user_id: 'test-user-id',
        type: 'complete',
        status: 'in_progress',
        disc_results: { D: 4, I: 3, S: 2, C: 1 },
        soft_skills_results: null,
        sjt_results: null,
        created_at: '2025-01-01T00:00:00Z',
        completed_at: null
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockAssessmentService.getIncompleteAssessment.mockResolvedValue(mockIncompleteAssessment)

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toEqual(mockIncompleteAssessment)
      expect(mockAssessmentService.getIncompleteAssessment).toHaveBeenCalledWith(mockUser.id)
    })

    it('should return 404 when no incomplete assessment found', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockAssessmentService.getIncompleteAssessment.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData).toEqual({
        message: 'No incomplete assessment found'
      })
    })

    it('should return 401 for unauthenticated requests', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not authenticated' },
      })

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData).toEqual({
        error: 'Unauthorized - Valid authentication required'
      })
      expect(mockAssessmentService.getIncompleteAssessment).not.toHaveBeenCalled()
    })

    it('should return 401 when user is null', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData).toEqual({
        error: 'Unauthorized - Valid authentication required'
      })
    })

    it('should return 500 when service throws error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockAssessmentService.getIncompleteAssessment.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData).toEqual({
        error: 'Internal server error',
        message: 'Database connection failed'
      })
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle non-Error exceptions in GET', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockAssessmentService.getIncompleteAssessment.mockRejectedValue('String error')

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData).toEqual({
        error: 'Internal server error',
        message: 'Unknown error occurred'
      })
    })
  })

  describe('Data validation edge cases', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    })

    it('should accept null values for optional result fields', async () => {
      const dataWithNulls = {
        type: 'disc',
        status: 'in_progress',
        disc_results: null,
        soft_skills_results: null,
        sjt_results: null
      }

      const mockServiceResponse = {
        id: 'assessment-with-nulls',
        status: 'success',
        message: 'Assessment created successfully'
      }
      mockAssessmentService.saveAssessment.mockResolvedValue(mockServiceResponse)

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(dataWithNulls),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toEqual(mockServiceResponse)
    })

    it('should validate disc_results structure when provided', async () => {
      const invalidDiscData = {
        type: 'disc',
        status: 'in_progress',
        disc_results: { D: 'invalid', I: 3, S: 2, C: 1 } // D should be number
      }

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(invalidDiscData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid data format')
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['disc_results', 'D'],
            message: expect.stringContaining('number')
          })
        ])
      )
    })

    it('should validate sjt_results as array of numbers when provided', async () => {
      const invalidSjtData = {
        type: 'sjt',
        status: 'in_progress',
        sjt_results: [8, 7, 'invalid', 6, 5] // Third element should be number
      }

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(invalidSjtData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid data format')
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['sjt_results', 2],
            message: expect.stringContaining('number')
          })
        ])
      )
    })

    it('should validate soft_skills_results as record of strings to numbers when provided', async () => {
      const invalidSoftSkillsData = {
        type: 'soft_skills',
        status: 'in_progress',
        soft_skills_results: {
          comunicacao: 8,
          lideranca: 'invalid' // Should be number
        }
      }

      const request = new NextRequest('http://localhost:3000/api/assessment', {
        method: 'POST',
        body: JSON.stringify(invalidSoftSkillsData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid data format')
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['soft_skills_results', 'lideranca'],
            message: expect.stringContaining('number')
          })
        ])
      )
    })
  })
})