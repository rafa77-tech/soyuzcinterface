/**
 * @jest-environment node
 */

// Import the actual Next.js objects before mocking
import { NextRequest, NextResponse } from 'next/server'

// Mock dependencies first
jest.mock('@/lib/supabase/server', () => ({
  createRouteHandlerClient: jest.fn(),
}))

jest.mock('@/lib/services/assessment-service', () => ({
  __esModule: true,
  default: {
    getAssessmentHistory: jest.fn(),
  },
}))

// Import after mocking
import { GET } from '../route'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import assessmentService from '@/lib/services/assessment-service'

const mockCreateRouteHandlerClient = createRouteHandlerClient as jest.MockedFunction<typeof createRouteHandlerClient>
const mockAssessmentService = assessmentService as jest.Mocked<typeof assessmentService>

describe('/api/assessments', () => {
  let mockSupabase: any
  const mockUser = { id: 'user-123', email: 'test@example.com' }

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
    }
    
    mockCreateRouteHandlerClient.mockReturnValue(mockSupabase)
  })

  it('should return assessments for authenticated user with default pagination', async () => {
    // Setup
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const mockAssessments = {
      assessments: [
        {
          id: 'assessment-1',
          type: 'complete',
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
      },
    }

    mockAssessmentService.getAssessmentHistory.mockResolvedValue(mockAssessments)

    // Create request
    const request = new NextRequest('http://localhost:3000/api/assessments')

    // Execute
    const response = await GET(request)
    const data = await response.json()

    // Assertions
    expect(response.status).toBe(200)
    expect(data).toEqual(mockAssessments)
    expect(mockAssessmentService.getAssessmentHistory).toHaveBeenCalledWith(mockUser.id, 1, 20)
  })

  it('should return 401 for unauthenticated user', async () => {
    // Setup
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    // Create request
    const request = new NextRequest('http://localhost:3000/api/assessments')

    // Execute
    const response = await GET(request)
    const data = await response.json()

    // Assertions
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized - Valid authentication required')
    expect(mockAssessmentService.getAssessmentHistory).not.toHaveBeenCalled()
  })

  it('should return 400 for invalid pagination parameters', async () => {
    // Setup
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Create request with invalid params
    const request = new NextRequest('http://localhost:3000/api/assessments?page=0&limit=101')

    // Execute
    const response = await GET(request)
    const data = await response.json()

    // Assertions
    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid pagination parameters')
  })

  it('should handle service errors', async () => {
    // Setup
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockAssessmentService.getAssessmentHistory.mockRejectedValue(new Error('Database error'))

    // Create request
    const request = new NextRequest('http://localhost:3000/api/assessments')

    // Execute
    const response = await GET(request)
    const data = await response.json()

    // Assertions
    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})