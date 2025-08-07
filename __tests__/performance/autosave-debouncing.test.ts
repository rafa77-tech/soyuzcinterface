import { renderHook, act, waitFor } from '@testing-library/react'
import { useAssessmentAutoSave } from '@/hooks/use-assessment-autosave'
import { useAuth } from '@/components/providers/auth-provider'

// Mock the auth provider
jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock timers for performance testing
jest.useFakeTimers()

describe('Auto-save Performance Tests', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: null,
      session: null,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      refreshProfile: jest.fn(),
      loading: false,
    })
    mockFetch.mockClear()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('Debouncing Performance', () => {
    it('should prevent excessive API calls with rapid updates', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'test-assessment-id' }),
      } as Response)

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills', debounceMs: 500 })
      )

      // Simulate rapid successive updates (like user typing/sliding quickly)
      const rapidUpdates = [
        { soft_skills_results: { comunicacao: 1 } },
        { soft_skills_results: { comunicacao: 2 } },
        { soft_skills_results: { comunicacao: 3 } },
        { soft_skills_results: { comunicacao: 4 } },
        { soft_skills_results: { comunicacao: 5 } },
        { soft_skills_results: { comunicacao: 6 } },
        { soft_skills_results: { comunicacao: 7 } },
        { soft_skills_results: { comunicacao: 8 } },
      ]

      const startTime = performance.now()

      // Apply all updates rapidly (within 100ms)
      act(() => {
        rapidUpdates.forEach((update, index) => {
          setTimeout(() => {
            result.current.saveProgress(null, undefined, update)
          }, index * 10) // 10ms between each update
        })
      })

      // Fast-forward only to the point where debounce should trigger
      act(() => {
        jest.advanceTimersByTime(100) // All updates completed
      })

      // No API calls should have been made yet
      expect(mockFetch).toHaveBeenCalledTimes(0)

      // Now advance past the debounce delay
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Should only make 1 API call for all the rapid updates
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(mockFetch).toHaveBeenLastCalledWith('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'soft_skills',
            status: 'in_progress',
            soft_skills_results: { comunicacao: 8 }, // Last update value
          }),
        })
      })

      const endTime = performance.now()
      
      // Verify the debounce worked efficiently
      expect(endTime - startTime).toBeLessThan(1000) // Should complete quickly
    })

    it('should handle high-frequency updates without memory leaks', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'test-assessment-id' }),
      } as Response)

      const { result, unmount } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills', debounceMs: 200 })
      )

      // Simulate very high-frequency updates (100 updates)
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.saveProgress(null, undefined, {
            soft_skills_results: { comunicacao: i % 10 },
          })
        }
      })

      // Only advance time for one debounce period
      act(() => {
        jest.advanceTimersByTime(200)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      // Cleanup should not cause any errors
      expect(() => unmount()).not.toThrow()
    })

    it('should maintain performance with different debounce delays', async () => {
      const testCases = [
        { debounceMs: 100, expectedCalls: 1 },
        { debounceMs: 500, expectedCalls: 1 },
        { debounceMs: 1000, expectedCalls: 1 },
      ]

      for (const testCase of testCases) {
        mockFetch.mockClear()
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ id: 'test-assessment-id' }),
        } as Response)

        const { result, unmount } = renderHook(() =>
          useAssessmentAutoSave({
            assessmentType: 'soft_skills',
            debounceMs: testCase.debounceMs,
          })
        )

        const startTime = performance.now()

        // Make 10 rapid updates
        act(() => {
          for (let i = 0; i < 10; i++) {
            result.current.saveProgress(null, undefined, {
              soft_skills_results: { lideranca: i },
            })
          }
        })

        // Advance time by the debounce delay
        act(() => {
          jest.advanceTimersByTime(testCase.debounceMs)
        })

        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledTimes(testCase.expectedCalls)
        })

        const endTime = performance.now()
        
        // Performance should scale reasonably with debounce delay
        expect(endTime - startTime).toBeLessThan(testCase.debounceMs + 500)
        
        unmount()
      }
    })
  })

  describe('Memory and Resource Management', () => {
    it('should properly cleanup timers on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills', debounceMs: 500 })
      )

      // Start a debounced save
      act(() => {
        result.current.saveProgress(null, undefined, {
          soft_skills_results: { comunicacao: 8 },
        })
      })

      // Unmount before debounce completes
      unmount()

      // Advance time - should not cause any API calls or errors
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle component re-renders efficiently', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'test-assessment-id' }),
      } as Response)

      const { result, rerender } = renderHook(
        (props) => useAssessmentAutoSave(props),
        {
          initialProps: { assessmentType: 'soft_skills' as const, debounceMs: 300 },
        }
      )

      // Make updates, then cause re-renders
      act(() => {
        result.current.saveProgress(null, undefined, {
          soft_skills_results: { comunicacao: 5 },
        })
      })

      // Re-render multiple times
      for (let i = 0; i < 5; i++) {
        rerender({ assessmentType: 'soft_skills' as const, debounceMs: 300 })
      }

      // Complete the debounce
      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle localStorage operations efficiently', async () => {
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      })

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'test-assessment-id' }),
      } as Response)

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills', debounceMs: 200 })
      )

      const startTime = performance.now()

      // Make multiple saves that should backup to localStorage
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.saveProgress(null, undefined, {
            soft_skills_results: { comunicacao: i },
          })
        }
      })

      act(() => {
        jest.advanceTimersByTime(200)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      const endTime = performance.now()

      // localStorage operations should not significantly impact performance
      expect(endTime - startTime).toBeLessThan(1000)
      
      // Should efficiently manage localStorage calls
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      expect(mockLocalStorage.setItem.mock.calls.length).toBeLessThan(25) // Reasonable limit
    })
  })

  describe('Network Performance and Error Recovery', () => {
    it('should handle slow network responses efficiently', async () => {
      // Mock slow network response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'test-assessment-id' }),
          } as Response), 2000) // 2 second delay
        )
      )

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills', debounceMs: 300 })
      )

      const startTime = performance.now()

      act(() => {
        result.current.saveProgress(null, undefined, {
          soft_skills_results: { comunicacao: 8 },
        })
      })

      // Trigger debounce
      act(() => {
        jest.advanceTimersByTime(300)
      })

      // Advance time for slow response
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false)
      }, { timeout: 5000 })

      const endTime = performance.now()
      
      // Should handle slow responses gracefully
      expect(endTime - startTime).toBeLessThan(5000)
    })

    it('should maintain performance during retry scenarios', async () => {
      // Mock failing then succeeding responses
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'test-assessment-id' }),
        } as Response)

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills', debounceMs: 200 })
      )

      const startTime = performance.now()

      act(() => {
        result.current.saveProgress(null, undefined, {
          soft_skills_results: { comunicacao: 9 },
        })
      })

      // Trigger initial save
      act(() => {
        jest.advanceTimersByTime(200)
      })

      // Advance through retry attempts (exponential backoff: 1s, 2s, 4s)
      act(() => {
        jest.advanceTimersByTime(1000) // First retry
      })

      act(() => {
        jest.advanceTimersByTime(2000) // Second retry
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3)
        expect(result.current.error).toBeNull()
      })

      const endTime = performance.now()
      
      // Even with retries, should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(8000)
    })
  })
})