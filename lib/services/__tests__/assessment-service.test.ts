import type { SaveAssessmentParams, AssessmentListResponse } from '../assessment-service'
import type { Assessment, DiscResults, SoftSkillsResults, SjtResults } from '@/lib/supabase/types'

// Mock Supabase modules properly  
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    })),
  },
}))

jest.mock('@/lib/supabase/server', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    })),
  })),
}))

// Import after mocking
import { assessmentService } from '../assessment-service'
import { supabase } from '@/lib/supabase/client'
import { createRouteHandlerClient } from '@/lib/supabase/server'

// Get the mocked instances for type-safe testing
const mockSupabase = supabase as jest.Mocked<typeof supabase>
const mockCreateRouteHandlerClient = createRouteHandlerClient as jest.MockedFunction<typeof createRouteHandlerClient>

describe('AssessmentPersistenceService', () => {
  const mockUser = { id: 'test-user-id' }
  const mockDiscResults: DiscResults = { D: 4, I: 3, S: 2, C: 1 }
  const mockSoftSkillsResults: SoftSkillsResults = {
    comunicacao: 8,
    lideranca: 7,
    trabalhoEquipe: 9,
    resolucaoProblemas: 6,
    adaptabilidade: 8,
    criatividade: 5,
    gestaoTempo: 7,
    negociacao: 6
  }
  const mockSjtResults: SjtResults = [8, 7, 9, 6, 5]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('saveAssessment', () => {
    it('should create a new assessment successfully', async () => {
      const params: SaveAssessmentParams = {
        type: 'complete',
        status: 'in_progress',
        disc_results: mockDiscResults,
        soft_skills_results: mockSoftSkillsResults,
        sjt_results: mockSjtResults
      }

      const mockResponse = {
        id: 'new-assessment-id',
        user_id: 'test-user-id',
        ...params
      }

      // Setup mocks
      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockResponse, error: null }),
        maybeSingle: jest.fn(),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryBuilder)

      const result = await assessmentService.saveAssessment(params)

      expect(mockSupabase.from).toHaveBeenCalledWith('assessments')
      expect(mockQueryBuilder.insert).toHaveBeenCalled()
      expect(result).toEqual({
        id: 'new-assessment-id',
        status: 'success',
        message: 'Assessment created successfully'
      })
    })

    it('should update existing assessment successfully', async () => {
      const params: SaveAssessmentParams = {
        id: 'existing-assessment-id',
        type: 'disc',
        status: 'completed',
        disc_results: mockDiscResults
      }

      const mockResponse = {
        id: 'existing-assessment-id',
        user_id: 'test-user-id',
        ...params
      }

      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockResponse, error: null }),
        maybeSingle: jest.fn(),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryBuilder)

      const result = await assessmentService.saveAssessment(params)

      expect(mockSupabase.from).toHaveBeenCalledWith('assessments')
      expect(mockQueryBuilder.update).toHaveBeenCalled()
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'existing-assessment-id')
      expect(result).toEqual({
        id: 'existing-assessment-id',
        status: 'success',
        message: 'Assessment updated successfully'
      })
    })

    it('should use provided userId in server context', async () => {
      const params: SaveAssessmentParams = {
        type: 'complete',
        status: 'in_progress'
      }

      const mockResponse = {
        id: 'server-assessment-id',
        user_id: 'server-user-id'
      }

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockResponse, error: null }),
        maybeSingle: jest.fn(),
      }

      mockCreateRouteHandlerClient.mockReturnValue({
        auth: { getUser: jest.fn() },
        from: jest.fn().mockReturnValue(mockQueryBuilder),
      } as any)

      const result = await assessmentService.saveAssessment(params, 'server-user-id')

      expect(mockCreateRouteHandlerClient).toHaveBeenCalled()
      expect(result.id).toBe('server-assessment-id')
    })

    it('should throw error when user not authenticated', async () => {
      const params: SaveAssessmentParams = {
        type: 'complete',
        status: 'in_progress'
      }

      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: null }, 
        error: null 
      })

      await expect(assessmentService.saveAssessment(params)).rejects.toThrow('User not authenticated')
    })

    it('should implement retry logic with exponential backoff', async () => {
      const params: SaveAssessmentParams = {
        type: 'complete',
        status: 'in_progress'
      }

      const mockError = new Error('Network error')
      
      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockRejectedValueOnce(mockError)
          .mockRejectedValueOnce(mockError)
          .mockResolvedValueOnce({ data: { id: 'retry-success-id' }, error: null }),
        maybeSingle: jest.fn(),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryBuilder)

      // Mock setTimeout to avoid delays in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback()
        return {} as any
      })

      const result = await assessmentService.saveAssessment(params)

      expect(mockQueryBuilder.single).toHaveBeenCalledTimes(3)
      expect(result.id).toBe('retry-success-id')
      expect(console.warn).toHaveBeenCalledTimes(2)
    })

    it('should throw error after max retries exceeded', async () => {
      const params: SaveAssessmentParams = {
        type: 'complete',
        status: 'in_progress'
      }

      const mockError = new Error('Persistent error')
      
      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(mockError),
        maybeSingle: jest.fn(),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryBuilder)

      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback()
        return {} as any
      })

      await expect(assessmentService.saveAssessment(params)).rejects.toThrow('Persistent error')
      expect(mockQueryBuilder.single).toHaveBeenCalledTimes(4) // Initial + 3 retries
    })

    it('should handle Supabase errors properly', async () => {
      const params: SaveAssessmentParams = {
        type: 'complete',
        status: 'in_progress'
      }

      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database constraint error' } }),
        maybeSingle: jest.fn(),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryBuilder)

      await expect(assessmentService.saveAssessment(params)).rejects.toThrow('Failed to create assessment: Database constraint error')
    })
  })

  describe('getAssessmentHistory', () => {
    it('should return paginated assessment history', async () => {
      const mockAssessments = [
        {
          id: 'assessment-1',
          type: 'complete',
          status: 'completed',
          created_at: '2025-01-01T00:00:00Z',
          completed_at: '2025-01-01T01:00:00Z'
        },
        {
          id: 'assessment-2',
          type: 'disc',
          status: 'in_progress', 
          created_at: '2025-01-02T00:00:00Z',
          completed_at: null
        }
      ]

      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      // Mock count query and data query
      const mockCountBuilder = {
        eq: jest.fn().mockResolvedValue({ count: 5, error: null })
      }
      
      const mockDataBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockAssessments, error: null }),
      }

      ;(mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({ select: jest.fn().mockReturnValue(mockCountBuilder) })
        .mockReturnValueOnce(mockDataBuilder)

      const result: AssessmentListResponse = await assessmentService.getAssessmentHistory()

      expect(result.assessments).toEqual(mockAssessments)
      expect(result.pagination).toEqual({
        total: 5,
        page: 1,
        limit: 20
      })
    })

    it('should handle empty results', async () => {
      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockCountBuilder = {
        eq: jest.fn().mockResolvedValue({ count: 0, error: null })
      }
      
      const mockDataBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(mockSupabase.from as jest.Mock)
        .mockReturnValueOnce({ select: jest.fn().mockReturnValue(mockCountBuilder) })
        .mockReturnValueOnce(mockDataBuilder)

      const result = await assessmentService.getAssessmentHistory()

      expect(result.assessments).toEqual([])
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('getAssessment', () => {
    const mockAssessment: Assessment = {
      id: 'test-assessment-id',
      user_id: 'test-user-id',
      type: 'complete',
      status: 'completed',
      disc_results: mockDiscResults as any,
      soft_skills_results: mockSoftSkillsResults as any,
      sjt_results: mockSjtResults as any,
      created_at: '2025-01-01T00:00:00Z',
      completed_at: '2025-01-01T01:00:00Z'
    }

    it('should return assessment by ID for current user', async () => {
      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAssessment, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryBuilder)

      const result = await assessmentService.getAssessment('test-assessment-id')

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-assessment-id')
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(result).toEqual(mockAssessment)
    })

    it('should handle assessment not found', async () => {
      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'No rows returned' } }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryBuilder)

      await expect(assessmentService.getAssessment('non-existent-id'))
        .rejects.toThrow('Failed to fetch assessment: No rows returned')
    })
  })

  describe('getIncompleteAssessment', () => {
    it('should return most recent incomplete assessment', async () => {
      const mockIncompleteAssessment: Assessment = {
        id: 'incomplete-assessment-id',
        user_id: 'test-user-id',
        type: 'complete',
        status: 'in_progress',
        disc_results: mockDiscResults as any,
        soft_skills_results: null,
        sjt_results: null,
        created_at: '2025-01-01T00:00:00Z',
        completed_at: null
      }

      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockIncompleteAssessment, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryBuilder)

      const result = await assessmentService.getIncompleteAssessment()

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'in_progress')
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockIncompleteAssessment)
    })

    it('should return null when no incomplete assessments exist', async () => {
      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryBuilder)

      const result = await assessmentService.getIncompleteAssessment()

      expect(result).toBeNull()
    })
  })

  describe('updateAssessmentResults', () => {
    it('should update assessment results successfully', async () => {
      const results = {
        disc_results: mockDiscResults,
        soft_skills_results: mockSoftSkillsResults
      }

      const mockUpdatedAssessment = {
        id: 'test-assessment-id',
        ...results
      }

      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdatedAssessment, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryBuilder)

      const result = await assessmentService.updateAssessmentResults('test-assessment-id', results)

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        disc_results: results.disc_results,
        soft_skills_results: results.soft_skills_results,
        sjt_results: undefined
      })
      expect(result).toEqual({
        id: 'test-assessment-id',
        status: 'success',
        message: 'Assessment results updated successfully'
      })
    })
  })

  describe('completeAssessment', () => {
    it('should mark assessment as completed', async () => {
      const mockCompletedAssessment = {
        id: 'test-assessment-id',
        status: 'completed',
        completed_at: '2025-01-01T01:00:00Z'
      }

      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCompletedAssessment, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryBuilder)

      const result = await assessmentService.completeAssessment('test-assessment-id')

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        status: 'completed',
        completed_at: expect.any(String) // ISO timestamp
      })
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-assessment-id')
      expect(result).toEqual({
        id: 'test-assessment-id',
        status: 'success',
        message: 'Assessment completed successfully'
      })
    })

    it('should handle completion errors', async () => {
      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryBuilder)

      await expect(assessmentService.completeAssessment('test-id'))
        .rejects.toThrow('Failed to complete assessment: Update failed')
    })
  })

  describe('error handling edge cases', () => {
    it('should handle auth service errors', async () => {
      const params: SaveAssessmentParams = {
        type: 'complete',
        status: 'in_progress'
      }

      ;(mockSupabase.auth.getUser as jest.Mock).mockRejectedValue(new Error('Auth service down'))

      await expect(assessmentService.saveAssessment(params)).rejects.toThrow('Auth service down')
    })
  })

  describe('data validation', () => {
    it('should handle completed assessment with timestamp', async () => {
      const params: SaveAssessmentParams = {
        type: 'complete',
        status: 'completed',
        disc_results: mockDiscResults,
        soft_skills_results: mockSoftSkillsResults,
        sjt_results: mockSjtResults
      }

      const mockResponse = {
        id: 'completed-assessment-id',
        user_id: 'test-user-id',
        ...params,
        completed_at: expect.any(String)
      }

      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockQueryBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockResponse, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryBuilder)

      const result = await assessmentService.saveAssessment(params)

      expect(result.id).toBe('completed-assessment-id')
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          completed_at: expect.any(String)
        })
      )
    })

    it('should handle null results properly', async () => {
      const params: SaveAssessmentParams = {
        type: 'disc',
        status: 'in_progress',
        disc_results: mockDiscResults,
        soft_skills_results: null,
        sjt_results: null
      }

      ;(mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      })
      
      const mockQueryBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'partial-assessment-id' }, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryBuilder)

      const result = await assessmentService.saveAssessment(params)

      expect(result.id).toBe('partial-assessment-id')
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          soft_skills_results: null,
          sjt_results: null
        })
      )
    })
  })
})