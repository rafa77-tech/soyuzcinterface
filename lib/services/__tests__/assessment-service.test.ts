import { assessmentService } from '../assessment-service'
import { supabase } from '@/lib/supabase/client'
import { createRouteHandlerClient } from '@/lib/supabase/server'

// Mock the modules
jest.mock('@/lib/supabase/client')
jest.mock('@/lib/supabase/server')

describe('AssessmentPersistenceService', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockAssessment = {
    id: 'assessment-123',
    user_id: 'user-123',
    type: 'complete',
    status: 'in_progress',
    created_at: '2024-01-01T00:00:00.000Z',
    completed_at: null,
    disc_results: { questions: [1, 2, 3] },
    soft_skills_results: null,
    sjt_results: null
  }

  const createMockSupabaseClient = () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockAssessment, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: mockAssessment, error: null }),
    }))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Setup default mocks
    ;(supabase as any).auth = {
      getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } })
    }
    ;(supabase as any).from = jest.fn(() => createMockSupabaseClient().from())
    
    ;(createRouteHandlerClient as jest.Mock).mockReturnValue(createMockSupabaseClient())
  })

  describe('saveAssessment', () => {
    it('should create new assessment successfully', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAssessment, error: null })
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue(mockChain)
      })

      const result = await assessmentService.saveAssessment({
        type: 'complete',
        status: 'in_progress',
        disc_results: { questions: [1, 2, 3] }
      })

      expect(result).toEqual({
        id: 'assessment-123',
        status: 'success',
        message: 'Assessment created successfully'
      })
    })

    it('should update existing assessment successfully', async () => {
      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAssessment, error: null })
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue(mockChain)
      })

      const result = await assessmentService.saveAssessment({
        id: 'assessment-123',
        type: 'complete',
        status: 'completed',
        disc_results: { questions: [1, 2, 3] }
      })

      expect(result).toEqual({
        id: 'assessment-123',
        status: 'success',
        message: 'Assessment updated successfully'
      })
    })

    it('should handle different assessment types', async () => {
      const types = ['disc', 'soft_skills', 'sjt', 'complete'] as const
      
      for (const type of types) {
        const mockChain = {
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: { ...mockAssessment, type }, 
            error: null 
          })
        }
        
        ;(supabase.from as jest.Mock).mockReturnValue({
          insert: jest.fn().mockReturnValue(mockChain)
        })

        const result = await assessmentService.saveAssessment({ type })
        
        expect(result.status).toBe('success')
      }
    })

    it('should use server client when userId is provided', async () => {
      const serverClient = createMockSupabaseClient()
      ;(createRouteHandlerClient as jest.Mock).mockReturnValue(serverClient)

      await assessmentService.saveAssessment({
        type: 'complete'
      }, 'user-123')

      expect(createRouteHandlerClient).toHaveBeenCalled()
    })

    it('should throw error when user not authenticated', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ 
        data: { user: null } 
      })

      await expect(assessmentService.saveAssessment({
        type: 'complete'
      })).rejects.toThrow('User not authenticated')
    })

    it('should handle database errors', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        })
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue(mockChain)
      })

      await expect(assessmentService.saveAssessment({
        type: 'complete'
      })).rejects.toThrow('Failed to create assessment: Database error')
    })
  })

  describe('retry mechanism', () => {
    it('should retry failed operations with exponential backoff', async () => {
      let attempts = 0
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          attempts++
          if (attempts < 3) {
            return Promise.resolve({ data: null, error: { message: 'Network error' } })
          }
          return Promise.resolve({ data: mockAssessment, error: null })
        })
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue(mockChain)
      })

      jest.useFakeTimers()

      const resultPromise = assessmentService.saveAssessment({
        type: 'complete'
      })

      // Fast-forward through retry delays
      await jest.advanceTimersByTimeAsync(1000) // First retry
      await jest.advanceTimersByTimeAsync(2000) // Second retry

      const result = await resultPromise

      expect(attempts).toBe(3)
      expect(result.status).toBe('success')
      expect(console.warn).toHaveBeenCalledTimes(2)

      jest.useRealTimers()
    })

    it('should fail after max retries exceeded', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Persistent error' } 
        })
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue(mockChain)
      })

      jest.useFakeTimers()

      const resultPromise = assessmentService.saveAssessment({
        type: 'complete'
      })

      // Fast-forward through all retries
      await jest.advanceTimersByTimeAsync(1000)
      await jest.advanceTimersByTimeAsync(2000)
      await jest.advanceTimersByTimeAsync(4000)

      await expect(resultPromise).rejects.toThrow('Failed to create assessment: Persistent error')
      expect(console.error).toHaveBeenCalledWith('Assessment operation failed after all retries:', expect.any(Error))

      jest.useRealTimers()
    })
  })

  describe('getAssessmentHistory', () => {
    it('should fetch paginated assessment history', async () => {
      const mockAssessments = [
        { id: '1', type: 'complete', status: 'completed', created_at: '2024-01-01', completed_at: '2024-01-01' },
        { id: '2', type: 'disc', status: 'in_progress', created_at: '2024-01-02', completed_at: null }
      ]

      const mockCountChain = { count: 'exact', head: true }
      const mockDataChain = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockAssessments, error: null })
      }

      ;(supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 10, error: null })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockDataChain)
        })

      const result = await assessmentService.getAssessmentHistory(undefined, 1, 5)

      expect(result).toEqual({
        assessments: mockAssessments,
        pagination: {
          total: 10,
          page: 1,
          limit: 5
        }
      })
    })

    it('should handle pagination parameters correctly', async () => {
      const mockDataChain = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null })
      }

      ;(supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 50, error: null })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockDataChain)
        })

      await assessmentService.getAssessmentHistory(undefined, 3, 10)

      expect(mockDataChain.range).toHaveBeenCalledWith(20, 29) // (3-1) * 10, (3-1) * 10 + 10 - 1
    })
  })

  describe('getAssessment', () => {
    it('should fetch specific assessment by ID', async () => {
      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAssessment, error: null })
      }

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(mockChain)
      })

      const result = await assessmentService.getAssessment('assessment-123')

      expect(result).toEqual(mockAssessment)
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'assessment-123')
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', mockUser.id)
    })

    it('should handle assessment not found', async () => {
      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'No rows returned' } 
        })
      }

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(mockChain)
      })

      await expect(assessmentService.getAssessment('nonexistent-id'))
        .rejects.toThrow('Failed to fetch assessment: No rows returned')
    })
  })

  describe('getIncompleteAssessment', () => {
    it('should fetch most recent incomplete assessment', async () => {
      const incompleteAssessment = {
        ...mockAssessment,
        status: 'in_progress'
      }

      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: incompleteAssessment, error: null })
      }

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(mockChain)
      })

      const result = await assessmentService.getIncompleteAssessment()

      expect(result).toEqual(incompleteAssessment)
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'in_progress')
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockChain.limit).toHaveBeenCalledWith(1)
    })

    it('should return null when no incomplete assessment exists', async () => {
      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
      }

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(mockChain)
      })

      const result = await assessmentService.getIncompleteAssessment()

      expect(result).toBeNull()
    })
  })

  describe('updateAssessmentResults', () => {
    it('should update specific assessment results', async () => {
      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAssessment, error: null })
      }

      ;(supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue(mockChain)
      })

      const results = {
        disc_results: { questions: [4, 5, 6] },
        soft_skills_results: { skills: ['leadership'] }
      }

      const result = await assessmentService.updateAssessmentResults('assessment-123', results)

      expect(result).toEqual({
        id: 'assessment-123',
        status: 'success',
        message: 'Assessment results updated successfully'
      })
    })
  })

  describe('completeAssessment', () => {
    it('should mark assessment as completed', async () => {
      const completedAssessment = {
        ...mockAssessment,
        status: 'completed',
        completed_at: '2024-01-01T12:00:00.000Z'
      }

      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: completedAssessment, error: null })
      }

      ;(supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue(mockChain)
      })

      const result = await assessmentService.completeAssessment('assessment-123')

      expect(result).toEqual({
        id: 'assessment-123',
        status: 'success',
        message: 'Assessment completed successfully'
      })
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'assessment-123')
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', mockUser.id)
    })
  })

  describe('data validation and schema compliance', () => {
    it('should handle all assessment types correctly', async () => {
      const assessmentTypes = ['complete', 'disc', 'soft_skills', 'sjt'] as const

      for (const type of assessmentTypes) {
        const mockChain = {
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: { ...mockAssessment, type }, 
            error: null 
          })
        }

        ;(supabase.from as jest.Mock).mockReturnValue({
          insert: jest.fn().mockReturnValue(mockChain)
        })

        const result = await assessmentService.saveAssessment({ type })
        expect(result.status).toBe('success')
      }
    })

    it('should handle null results properly', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAssessment, error: null })
      }

      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue(mockChain)
      })

      const result = await assessmentService.saveAssessment({
        type: 'complete',
        disc_results: null,
        soft_skills_results: null,
        sjt_results: null
      })

      expect(result.status).toBe('success')
    })

    it('should set completed_at when status is completed', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAssessment, error: null })
      }

      const insertSpy = jest.fn().mockReturnValue(mockChain)
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: insertSpy
      })

      await assessmentService.saveAssessment({
        type: 'complete',
        status: 'completed'
      })

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          completed_at: expect.any(String)
        })
      )
    })
  })
})