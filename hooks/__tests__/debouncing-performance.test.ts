import { renderHook, act, waitFor } from '@testing-library/react'
import { useAssessmentAutoSave } from '../use-assessment-autosave'
import { useAuth } from '@/components/providers/auth-provider'

// Mock the auth provider
jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock timers for precise control
jest.useFakeTimers()

describe('Debouncing Performance Tests', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      loading: false,
      error: null,
    })
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'test-assessment-id' }),
    } as Response)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Debounce timing accuracy', () => {
    it('should respect custom debounce timing', async () => {
      const customDebounceMs = 250
      const { result } = renderHook(() =>
        useAssessmentAutoSave({ 
          assessmentType: 'soft_skills',
          debounceMs: customDebounceMs
        })
      )

      const testData = { soft_skills_results: { comunicacao: 8 } }

      act(() => {
        result.current.saveProgress(null, undefined, testData)
      })

      // Should not have called fetch yet
      expect(mockFetch).not.toHaveBeenCalled()

      // Fast forward to just before debounce time
      act(() => {
        jest.advanceTimersByTime(customDebounceMs - 1)
      })

      // Still should not have called fetch
      expect(mockFetch).not.toHaveBeenCalled()

      // Fast forward to exact debounce time
      act(() => {
        jest.advanceTimersByTime(1)
      })

      // Now should have called fetch
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })
    })

    it('should reset debounce timer on subsequent calls', async () => {
      const debounceMs = 500
      const { result } = renderHook(() =>
        useAssessmentAutoSave({ 
          assessmentType: 'soft_skills',
          debounceMs
        })
      )

      const testData1 = { soft_skills_results: { comunicacao: 8 } }
      const testData2 = { soft_skills_results: { comunicacao: 9 } }

      // First call
      act(() => {
        result.current.saveProgress(null, undefined, testData1)
      })

      // Advance almost to debounce time
      act(() => {
        jest.advanceTimersByTime(400)
      })

      // Second call should reset the timer
      act(() => {
        result.current.saveProgress(null, undefined, testData2)
      })

      // Advance the original remaining time (100ms)
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Should not have called fetch yet (timer was reset)
      expect(mockFetch).not.toHaveBeenCalled()

      // Advance the rest of the new debounce period
      act(() => {
        jest.advanceTimersByTime(400)
      })

      // Now should have called fetch with the second data
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(mockFetch).toHaveBeenCalledWith('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: undefined,
            type: 'soft_skills',
            status: 'in_progress',
            disc_results: null,
            soft_skills_results: testData2.soft_skills_results,
            sjt_results: null,
          }),
        })
      })
    })
  })

  describe('API call frequency optimization', () => {
    it('should drastically reduce API calls with rapid user input', async () => {
      const { result } = renderHook(() =>
        useAssessmentAutoSave({ 
          assessmentType: 'soft_skills',
          debounceMs: 500
        })
      )

      // Simulate rapid user input (e.g., slider changes)
      const rapidUpdates = 20
      
      act(() => {
        for (let i = 1; i <= rapidUpdates; i++) {
          result.current.saveProgress(null, undefined, {
            soft_skills_results: { comunicacao: i }
          })
          // Advance time slightly between calls (faster than debounce)
          jest.advanceTimersByTime(10)
        }
      })

      // Fast forward past final debounce
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Should only have made 1 API call despite 20 updates
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
        
        // Should have the final value
        expect(mockFetch).toHaveBeenCalledWith('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: undefined,
            type: 'soft_skills',
            status: 'in_progress',
            disc_results: null,
            soft_skills_results: { comunicacao: rapidUpdates },
            sjt_results: null,
          }),
        })
      })
    })

    it('should handle mixed timing patterns efficiently', async () => {
      const { result } = renderHook(() =>
        useAssessmentAutoSave({ 
          assessmentType: 'soft_skills',
          debounceMs: 300
        })
      )

      // Pattern: rapid bursts followed by pauses
      
      // Burst 1: 5 rapid calls
      act(() => {
        for (let i = 1; i <= 5; i++) {
          result.current.saveProgress(null, undefined, {
            soft_skills_results: { comunicacao: i }
          })
          jest.advanceTimersByTime(20)
        }
      })

      // Let this burst complete
      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      // Pause
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Burst 2: 3 rapid calls
      act(() => {
        for (let i = 6; i <= 8; i++) {
          result.current.saveProgress(null, undefined, {
            soft_skills_results: { comunicacao: i }
          })
          jest.advanceTimersByTime(30)
        }
      })

      // Let this burst complete
      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Memory and performance efficiency', () => {
    it('should properly cleanup timeouts', () => {
      const { result, unmount } = renderHook(() =>
        useAssessmentAutoSave({ 
          assessmentType: 'soft_skills',
          debounceMs: 500
        })
      )

      // Start a debounced operation
      act(() => {
        result.current.saveProgress(null, undefined, {
          soft_skills_results: { comunicacao: 8 }
        })
      })

      // Unmount before debounce completes
      unmount()

      // Advance time - should not cause any issues
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Should not have made any API calls
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle multiple simultaneous hook instances independently', async () => {
      const { result: result1 } = renderHook(() =>
        useAssessmentAutoSave({ 
          assessmentType: 'soft_skills',
          debounceMs: 300
        })
      )

      const { result: result2 } = renderHook(() =>
        useAssessmentAutoSave({ 
          assessmentType: 'sjt',
          debounceMs: 500
        })
      )

      // Different timing for each hook
      act(() => {
        result1.current.saveProgress(null, undefined, {
          soft_skills_results: { comunicacao: 8 }
        })
      })

      act(() => {
        jest.advanceTimersByTime(100)
      })

      act(() => {
        result2.current.saveProgress(null, undefined, {
          sjt_results: [9, 8, 7]
        })
      })

      // First hook should complete first
      act(() => {
        jest.advanceTimersByTime(200) // Total 300ms for first hook
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(mockFetch).toHaveBeenCalledWith('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('soft_skills_results')
        })
      })

      // Second hook should complete later
      act(() => {
        jest.advanceTimersByTime(300) // Additional 300ms (500ms total for second hook)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(mockFetch).toHaveBeenLastCalledWith('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('sjt_results')
        })
      })
    })
  })

  describe('Edge cases and stress testing', () => {
    it('should handle extremely rapid calls without performance degradation', async () => {
      const { result } = renderHook(() =>
        useAssessmentAutoSave({ 
          assessmentType: 'soft_skills',
          debounceMs: 100
        })
      )

      const startTime = performance.now()

      // 1000 rapid calls
      act(() => {
        for (let i = 1; i <= 1000; i++) {
          result.current.saveProgress(null, undefined, {
            soft_skills_results: { comunicacao: i % 10 + 1 }
          })
        }
      })

      const endTime = performance.now()
      
      // Should complete rapidly (operations are debounced)
      expect(endTime - startTime).toBeLessThan(100) // Should be very fast

      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Should still only make 1 API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle zero debounce time correctly', async () => {
      const { result } = renderHook(() =>
        useAssessmentAutoSave({ 
          assessmentType: 'soft_skills',
          debounceMs: 0
        })
      )

      act(() => {
        result.current.saveProgress(null, undefined, {
          soft_skills_results: { comunicacao: 8 }
        })
      })

      // With zero debounce, should call immediately
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle very large debounce times correctly', async () => {
      const { result } = renderHook(() =>
        useAssessmentAutoSave({ 
          assessmentType: 'soft_skills',
          debounceMs: 10000 // 10 seconds
        })
      )

      act(() => {
        result.current.saveProgress(null, undefined, {
          soft_skills_results: { comunicacao: 8 }
        })
      })

      // Should not call before debounce time
      act(() => {
        jest.advanceTimersByTime(9999)
      })

      expect(mockFetch).not.toHaveBeenCalled()

      // Should call after debounce time
      act(() => {
        jest.advanceTimersByTime(1)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('saveImmediately bypass', () => {
    it('should bypass debounce when using saveImmediately', async () => {
      const { result } = renderHook(() =>
        useAssessmentAutoSave({ 
          assessmentType: 'soft_skills',
          debounceMs: 1000
        })
      )

      // Use saveFinalResults which calls saveImmediately internally
      await act(async () => {
        await result.current.saveFinalResults({
          soft_skills_results: { comunicacao: 8 }
        })
      })

      // Should have called immediately without debounce
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should cancel pending debounced calls when saveImmediately is used', async () => {
      const { result } = renderHook(() =>
        useAssessmentAutoSave({ 
          assessmentType: 'soft_skills',
          debounceMs: 1000
        })
      )

      // Start a debounced save
      act(() => {
        result.current.saveProgress(null, undefined, {
          soft_skills_results: { comunicacao: 8 }
        })
      })

      // Advance partway through debounce
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Use immediate save - should cancel the pending one
      await act(async () => {
        await result.current.saveFinalResults({
          soft_skills_results: { comunicacao: 9 }
        })
      })

      // Advance past original debounce time
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Should only have made 1 call (the immediate one)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('{"comunicacao":9}')
      })
    })
  })
})