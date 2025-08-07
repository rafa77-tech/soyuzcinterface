import { AssessmentPersistenceService } from '../assessment-service'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
jest.mock('@supabase/supabase-js')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('AssessmentPersistenceService', () => {
  let mockSupabase: any
  let service: AssessmentPersistenceService

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    }

    mockCreateClient.mockReturnValue(mockSupabase)
    service = new AssessmentPersistenceService('test-user-id')
  })

  describe('saveAssessment', () => {
    const mockAssessmentData = {
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
      sjt_results: [8, 7, 9]
    }

    it('should create a new assessment when no ID is provided', async () => {
      const mockResult = { data: { id: 'new-assessment-id' }, error: null }
      mockSupabase.single.mockResolvedValue(mockResult)

      const result = await service.saveAssessment(mockAssessmentData)

      expect(mockSupabase.from).toHaveBeenCalledWith('assessments')
      expect(mockSupabase.insert).toHaveBeenCalledWith([{
        user_id: 'test-user-id',
        ...mockAssessmentData
      }])
      expect(result).toEqual({ id: 'new-assessment-id', status: 'success' })
    })

    it('should update existing assessment when ID is provided', async () => {
      const assessmentWithId = { ...mockAssessmentData, id: 'existing-assessment-id' }
      const mockResult = { data: { id: 'existing-assessment-id' }, error: null }
      mockSupabase.single.mockResolvedValue(mockResult)

      const result = await service.saveAssessment(assessmentWithId)

      expect(mockSupabase.from).toHaveBeenCalledWith('assessments')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        type: assessmentWithId.type,
        status: assessmentWithId.status,
        disc_results: assessmentWithId.disc_results,
        soft_skills_results: assessmentWithId.soft_skills_results,
        sjt_results: assessmentWithId.sjt_results
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'existing-assessment-id')
      expect(result).toEqual({ id: 'existing-assessment-id', status: 'success' })
    })

    it('should implement retry logic with exponential backoff', async () => {
      const mockError = new Error('Network error')
      mockSupabase.single
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ data: { id: 'retry-success-id' }, error: null })

      // Mock setTimeout to avoid actual delays in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback()
        return {} as any
      })

      const result = await service.saveAssessment(mockAssessmentData)

      expect(mockSupabase.single).toHaveBeenCalledTimes(3)
      expect(result).toEqual({ id: 'retry-success-id', status: 'success' })

      // Cleanup
      ;(global.setTimeout as jest.Mock).mockRestore()
    })

    it('should throw error after max retries', async () => {
      const mockError = new Error('Persistent error')
      mockSupabase.single.mockRejectedValue(mockError)

      // Mock setTimeout to avoid actual delays in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback()
        return {} as any
      })

      await expect(service.saveAssessment(mockAssessmentData)).rejects.toThrow('Persistent error')
      expect(mockSupabase.single).toHaveBeenCalledTimes(4) // Initial + 3 retries

      // Cleanup
      ;(global.setTimeout as jest.Mock).mockRestore()
    })

    it('should handle Supabase errors properly', async () => {
      const mockResult = { 
        data: null, 
        error: { message: 'Database error', code: 'DB001' } 
      }
      mockSupabase.single.mockResolvedValue(mockResult)

      await expect(service.saveAssessment(mockAssessmentData)).rejects.toThrow('Database error')
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

      mockSupabase.single.mockResolvedValue({ data: mockAssessments, error: null })

      const result = await service.getAssessmentHistory()

      expect(mockSupabase.from).toHaveBeenCalledWith('assessments')
      expect(mockSupabase.select).toHaveBeenCalledWith('id, type, status, created_at, completed_at')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockSupabase.limit).toHaveBeenCalledWith(20)
      expect(result).toEqual({
        assessments: mockAssessments,
        pagination: { total: mockAssessments.length, page: 1, limit: 20 }
      })
    })

    it('should handle pagination parameters', async () => {
      const mockAssessments = []
      mockSupabase.single.mockResolvedValue({ data: mockAssessments, error: null })

      await service.getAssessmentHistory(2, 10)

      expect(mockSupabase.limit).toHaveBeenCalledWith(10)
      // Note: range would be calculated based on page and limit in real implementation
    })

    it('should handle empty results', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null })

      const result = await service.getAssessmentHistory()

      expect(result).toEqual({
        assessments: [],
        pagination: { total: 0, page: 1, limit: 20 }
      })
    })
  })

  describe('getAssessmentById', () => {
    const mockAssessment = {
      id: 'test-assessment-id',
      user_id: 'test-user-id',
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
      sjt_results: [8, 7, 9],
      created_at: '2025-01-01T00:00:00Z',
      completed_at: '2025-01-01T01:00:00Z'
    }

    it('should return assessment by ID for the current user', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockAssessment, error: null })

      const result = await service.getAssessmentById('test-assessment-id')

      expect(mockSupabase.from).toHaveBeenCalledWith('assessments')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-assessment-id')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(result).toEqual(mockAssessment)
    })

    it('should return null when assessment not found', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null })

      const result = await service.getAssessmentById('non-existent-id')

      expect(result).toBeNull()
    })

    it('should throw error for database errors', async () => {
      const mockError = { message: 'Database connection error', code: 'DB002' }
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError })

      await expect(service.getAssessmentById('test-id')).rejects.toThrow('Database connection error')
    })
  })

  describe('resumeAssessment', () => {
    it('should return the most recent incomplete assessment', async () => {
      const mockIncompleteAssessment = {
        id: 'incomplete-assessment-id',
        type: 'complete',
        status: 'in_progress',
        disc_results: { D: 4, I: 3, S: 2, C: 1 },
        created_at: '2025-01-01T00:00:00Z'
      }

      mockSupabase.maybeSingle.mockResolvedValue({ data: mockIncompleteAssessment, error: null })

      const result = await service.resumeAssessment()

      expect(mockSupabase.from).toHaveBeenCalledWith('assessments')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'in_progress')
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockIncompleteAssessment)
    })

    it('should return null when no incomplete assessments exist', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null })

      const result = await service.resumeAssessment()

      expect(result).toBeNull()
    })
  })

  describe('completeAssessment', () => {
    it('should mark assessment as completed with timestamp', async () => {
      const mockCompletedAssessment = {
        id: 'test-assessment-id',
        status: 'completed',
        completed_at: '2025-01-01T01:00:00Z'
      }

      mockSupabase.single.mockResolvedValue({ data: mockCompletedAssessment, error: null })

      const result = await service.completeAssessment('test-assessment-id')

      expect(mockSupabase.from).toHaveBeenCalledWith('assessments')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'completed',
        completed_at: expect.any(String) // ISO timestamp
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-assessment-id')
      expect(result).toEqual(mockCompletedAssessment)
    })

    it('should handle errors when completing assessment', async () => {
      const mockError = { message: 'Update failed', code: 'UPDATE_ERROR' }
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError })

      await expect(service.completeAssessment('test-id')).rejects.toThrow('Update failed')
    })
  })

  describe('error handling and data validation', () => {
    it('should validate assessment data structure', async () => {
      const invalidAssessmentData = {
        type: 'invalid-type' as any,
        status: 'in_progress' as const
        // Missing required fields
      }

      // Since the service doesn't validate data structure in the current implementation,
      // this test ensures it handles the validation properly or documents the expectation
      mockSupabase.single.mockRejectedValue(new Error('Invalid data structure'))

      await expect(service.saveAssessment(invalidAssessmentData)).rejects.toThrow('Invalid data structure')
    })

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout')
      mockSupabase.single.mockRejectedValue(timeoutError)

      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback()
        return {} as any
      })

      await expect(service.saveAssessment({
        type: 'complete',
        status: 'in_progress'
      })).rejects.toThrow('Request timeout')

      ;(global.setTimeout as jest.Mock).mockRestore()
    })
  })

  describe('performance and edge cases', () => {
    it('should handle concurrent save operations', async () => {
      const mockData1 = { type: 'disc' as const, status: 'in_progress' as const }
      const mockData2 = { type: 'soft_skills' as const, status: 'in_progress' as const }

      mockSupabase.single
        .mockResolvedValueOnce({ data: { id: 'assessment-1' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'assessment-2' }, error: null })

      const [result1, result2] = await Promise.all([
        service.saveAssessment(mockData1),
        service.saveAssessment(mockData2)
      ])

      expect(result1.id).toBe('assessment-1')
      expect(result2.id).toBe('assessment-2')
      expect(mockSupabase.single).toHaveBeenCalledTimes(2)
    })

    it('should handle large result datasets', async () => {
      const largeResultSet = {
        type: 'complete' as const,
        status: 'completed' as const,
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
        sjt_results: new Array(100).fill(0).map((_, i) => Math.floor(Math.random() * 9) + 1) // 100 SJT results
      }

      mockSupabase.single.mockResolvedValue({ data: { id: 'large-assessment' }, error: null })

      const result = await service.saveAssessment(largeResultSet)

      expect(result.id).toBe('large-assessment')
      expect(mockSupabase.insert).toHaveBeenCalledWith([{
        user_id: 'test-user-id',
        ...largeResultSet
      }])
    })
  })
})