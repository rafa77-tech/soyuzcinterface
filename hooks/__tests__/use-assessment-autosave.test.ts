import { renderHook, act, waitFor } from '@testing-library/react'
import { useAssessmentAutoSave } from '../use-assessment-autosave'

// Mock the auth provider
const mockUser = { id: 'user-123', email: 'test@example.com' }
jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: jest.fn(() => ({
    user: mockUser
  }))
}))

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock as any

describe('useAssessmentAutoSave', () => {
  const defaultOptions = {
    assessmentType: 'complete' as const,
    debounceMs: 100,
    enableLocalBackup: true
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Setup default fetch mock
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        id: 'assessment-123',
        status: 'success',
        message: 'Assessment saved successfully'
      })
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      expect(result.current.isSaving).toBe(false)
      expect(result.current.lastSaved).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.assessmentId).toBeNull()
      expect(result.current.saveStatus).toBe('Não salvo')
    })

    it('should update save status based on state', () => {
      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      // Test different status messages
      expect(result.current.saveStatus).toBe('Não salvo')
    })
  })

  describe('saveProgress', () => {
    it('should debounce save operations', async () => {
      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      // Make multiple rapid calls
      act(() => {
        result.current.saveProgress({ question1: 'answer1' }, 1)
        result.current.saveProgress({ question1: 'answer1', question2: 'answer2' }, 2)
        result.current.saveProgress({ question1: 'answer1', question2: 'answer2', question3: 'answer3' }, 3)
      })

      // Should not have called fetch yet
      expect(fetch).not.toHaveBeenCalled()
      expect(result.current.isSaving).toBe(false)

      // Advance timers to trigger debounced save
      act(() => {
        jest.advanceTimersByTime(defaultOptions.debounceMs)
      })

      await waitFor(() => {
        expect(result.current.isSaving).toBe(true)
      })

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1)
      })

      // Verify the last call had the final data
      expect(fetch).toHaveBeenCalledWith('/api/assessment', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('question3')
      }))
    })

    it('should update state during and after save', async () => {
      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      act(() => {
        result.current.saveProgress({ question1: 'answer1' }, 1)
      })

      act(() => {
        jest.advanceTimersByTime(defaultOptions.debounceMs)
      })

      // Should be saving
      await waitFor(() => {
        expect(result.current.isSaving).toBe(true)
        expect(result.current.saveStatus).toBe('Salvando...')
      })

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isSaving).toBe(false)
        expect(result.current.lastSaved).toBeInstanceOf(Date)
        expect(result.current.assessmentId).toBe('assessment-123')
        expect(result.current.saveStatus).toBe('Salvo automaticamente')
      })
    })

    it('should save to localStorage on successful save', async () => {
      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      act(() => {
        result.current.saveProgress({ question1: 'answer1' }, 1)
      })

      act(() => {
        jest.advanceTimersByTime(defaultOptions.debounceMs)
      })

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false)
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringContaining('assessment_backup_complete_user-123'),
        expect.stringContaining('timestamp')
      )
    })
  })

  describe('Error Handling and Retry Logic', () => {
    it('should retry failed saves with exponential backoff', async () => {
      // Mock fetch to fail first two times, succeed third time
      let callCount = 0
      ;(global.fetch as jest.Mock).mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ id: 'assessment-123', status: 'success' })
        })
      })

      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      act(() => {
        result.current.saveProgress({ question1: 'answer1' }, 1)
      })

      act(() => {
        jest.advanceTimersByTime(defaultOptions.debounceMs)
      })

      // First attempt fails
      await waitFor(() => {
        expect(result.current.isSaving).toBe(true)
      })

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled() // Should save to localStorage immediately on error
      })

      // First retry after 1 second
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Second retry after 2 seconds  
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      // Should eventually succeed
      await waitFor(() => {
        expect(result.current.isSaving).toBe(false)
        expect(result.current.error).toBeNull()
        expect(result.current.assessmentId).toBe('assessment-123')
      })

      expect(fetch).toHaveBeenCalledTimes(3)
    })

    it('should set error state after max retries', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Persistent network error'))

      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      act(() => {
        result.current.saveProgress({ question1: 'answer1' }, 1)
      })

      act(() => {
        jest.advanceTimersByTime(defaultOptions.debounceMs)
      })

      // Wait through all retries
      act(() => {
        jest.advanceTimersByTime(1000) // First retry
      })
      act(() => {
        jest.advanceTimersByTime(2000) // Second retry
      })

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false)
        expect(result.current.error).toBe('Network error')
        expect(result.current.saveStatus).toBe('Erro ao salvar')
      })

      expect(fetch).toHaveBeenCalledTimes(3) // Original + 2 retries
      expect(localStorageMock.setItem).toHaveBeenCalled() // Should save to localStorage on error
    })

    it('should handle HTTP errors properly', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad request' })
      })

      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      act(() => {
        result.current.saveProgress({ question1: 'answer1' }, 1)
      })

      act(() => {
        jest.advanceTimersByTime(defaultOptions.debounceMs)
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })
    })
  })

  describe('saveFinalResults', () => {
    it('should save immediately without debounce', async () => {
      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      const finalResults = {
        disc_results: { D: 0.8, I: 0.6, S: 0.7, C: 0.5 }
      }

      act(() => {
        result.current.saveFinalResults(finalResults)
      })

      // Should start saving immediately
      await waitFor(() => {
        expect(result.current.isSaving).toBe(true)
      })

      expect(fetch).toHaveBeenCalledWith('/api/assessment', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"disc_results":')
      }))
    })

    it('should handle different result types', async () => {
      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      const results = {
        disc_results: { D: 0.8, I: 0.6, S: 0.7, C: 0.5 },
        soft_skills_results: { leadership: 0.9, communication: 0.8 },
        sjt_results: [0.7, 0.8, 0.6, 0.9]
      }

      await act(async () => {
        await result.current.saveFinalResults(results)
      })

      const fetchCall = (fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      
      expect(body.disc_results).toEqual(results.disc_results)
      expect(body.soft_skills_results).toEqual(results.soft_skills_results)
      expect(body.sjt_results).toEqual(results.sjt_results)
    })
  })

  describe('Local Storage Management', () => {
    it('should save to localStorage with timestamp', async () => {
      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      act(() => {
        result.current.saveProgress({ question1: 'answer1' }, 1)
      })

      act(() => {
        jest.advanceTimersByTime(defaultOptions.debounceMs)
      })

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled()
      })

      const setItemCall = localStorageMock.setItem.mock.calls[0]
      const savedData = JSON.parse(setItemCall[1])
      
      expect(savedData.timestamp).toBeDefined()
      expect(savedData.answers).toEqual({ question1: 'answer1' })
      expect(savedData.currentStep).toBe(1)
    })

    it('should load from localStorage within 24 hours', () => {
      const mockBackup = {
        assessmentId: 'backup-123',
        type: 'complete',
        answers: { question1: 'answer1' },
        timestamp: new Date().toISOString()
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockBackup))

      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      const loaded = result.current.loadFromLocalStorage()
      expect(loaded).toEqual(mockBackup)
    })

    it('should ignore localStorage backup older than 24 hours', () => {
      const oldDate = new Date()
      oldDate.setHours(oldDate.getHours() - 25) // 25 hours ago

      const mockBackup = {
        assessmentId: 'backup-123',
        type: 'complete',
        timestamp: oldDate.toISOString()
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockBackup))

      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      const loaded = result.current.loadFromLocalStorage()
      expect(loaded).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalled()
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      const loaded = result.current.loadFromLocalStorage()
      expect(loaded).toBeNull()
      expect(console.warn).toHaveBeenCalledWith('Failed to load from localStorage:', expect.any(Error))
    })

    it('should clear localStorage backup', () => {
      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      act(() => {
        result.current.clearLocalBackup()
      })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        expect.stringContaining('assessment_backup_complete_user-123')
      )
    })
  })

  describe('loadIncompleteAssessment', () => {
    it('should load incomplete assessment from API', async () => {
      const mockAssessment = {
        id: 'incomplete-123',
        type: 'complete',
        status: 'in_progress',
        disc_results: { D: 0.8, I: 0.6, S: 0.7, C: 0.5 }
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAssessment)
      })

      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      let loadedAssessment
      await act(async () => {
        loadedAssessment = await result.current.loadIncompleteAssessment()
      })

      expect(loadedAssessment).toEqual(mockAssessment)
      expect(result.current.assessmentId).toBe('incomplete-123')
    })

    it('should return null for 404 response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      })

      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      let loadedAssessment
      await act(async () => {
        loadedAssessment = await result.current.loadIncompleteAssessment()
      })

      expect(loadedAssessment).toBeNull()
    })

    it('should fallback to localStorage on API error', async () => {
      const mockBackup = {
        assessmentId: 'backup-123',
        type: 'complete',
        answers: { question1: 'answer1' },
        timestamp: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockBackup))

      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      let loadedAssessment
      await act(async () => {
        loadedAssessment = await result.current.loadIncompleteAssessment()
      })

      expect(loadedAssessment).toEqual(mockBackup)
      expect(result.current.assessmentId).toBe('backup-123')
    })
  })

  describe('Configuration Options', () => {
    it('should respect custom debounce time', async () => {
      const customOptions = { ...defaultOptions, debounceMs: 1000 }
      const { result } = renderHook(() => useAssessmentAutoSave(customOptions))
      
      act(() => {
        result.current.saveProgress({ question1: 'answer1' }, 1)
      })

      // Should not save after default time
      act(() => {
        jest.advanceTimersByTime(defaultOptions.debounceMs)
      })
      expect(fetch).not.toHaveBeenCalled()

      // Should save after custom time
      act(() => {
        jest.advanceTimersByTime(1000 - defaultOptions.debounceMs)
      })
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      })
    })

    it('should disable localStorage when enableLocalBackup is false', async () => {
      const customOptions = { ...defaultOptions, enableLocalBackup: false }
      const { result } = renderHook(() => useAssessmentAutoSave(customOptions))
      
      act(() => {
        result.current.saveProgress({ question1: 'answer1' }, 1)
      })

      act(() => {
        jest.advanceTimersByTime(defaultOptions.debounceMs)
      })

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false)
      })

      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('should clear timeouts on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      
      const { result, unmount } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      act(() => {
        result.current.saveProgress({ question1: 'answer1' }, 1)
      })

      unmount()
      
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('Duplicate Save Prevention', () => {
    it('should not save identical data twice', async () => {
      const { result } = renderHook(() => useAssessmentAutoSave(defaultOptions))
      
      const sameData = { question1: 'answer1' }
      
      act(() => {
        result.current.saveProgress(sameData, 1)
      })

      act(() => {
        jest.advanceTimersByTime(defaultOptions.debounceMs)
      })

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1)
      })

      // Try to save the same data again
      act(() => {
        result.current.saveProgress(sameData, 1)
      })

      act(() => {
        jest.advanceTimersByTime(defaultOptions.debounceMs)
      })

      // Should still be only 1 call
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })
})