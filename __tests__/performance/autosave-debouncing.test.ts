import { renderHook, act } from '@testing-library/react'
import { useAssessmentAutoSave } from '@/hooks/use-assessment-autosave'

// Mock dependencies
jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com' }
  }))
}))

global.fetch = jest.fn()
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
} as any

describe('Auto-save Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        id: 'assessment-123',
        status: 'success'
      })
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Debouncing Performance', () => {
    it('should handle rapid sequential saves efficiently', async () => {
      const { result } = renderHook(() => useAssessmentAutoSave({
        assessmentType: 'complete',
        debounceMs: 500
      }))

      const saveCount = 100
      const startTime = Date.now()

      // Simulate rapid user input
      act(() => {
        for (let i = 0; i < saveCount; i++) {
          result.current.saveProgress(
            { [`question_${i}`]: `answer_${i}` },
            i + 1
          )
        }
      })

      const rapidInputTime = Date.now() - startTime

      // Should handle rapid input without blocking (< 100ms for 100 calls)
      expect(rapidInputTime).toBeLessThan(100)

      // Fast-forward through debounce period
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Should have made only 1 API call despite 100 save attempts
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(fetch).toHaveBeenCalledTimes(1)

      // Should have saved the latest data
      const lastCall = (fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(lastCall[1].body)
      expect(body.answers).toEqual({ [`question_${saveCount - 1}`]: `answer_${saveCount - 1}` })
    })

    it('should not cause memory leaks during long sessions', async () => {
      const { result } = renderHook(() => useAssessmentAutoSave({
        assessmentType: 'complete',
        debounceMs: 100
      }))

      // Simulate long session with periodic saves
      for (let session = 0; session < 10; session++) {
        act(() => {
          for (let i = 0; i < 50; i++) {
            result.current.saveProgress(
              { sessionData: session, questionIndex: i },
              i
            )
          }
        })

        // Advance time to trigger saves
        act(() => {
          jest.advanceTimersByTime(100)
        })

        await new Promise(resolve => setTimeout(resolve, 0))
      }

      // Should have made multiple saves but not excessive
      expect((fetch as jest.Mock).mock.calls.length).toBeLessThan(20)
      expect((fetch as jest.Mock).mock.calls.length).toBeGreaterThan(5)
    })

    it('should handle varying debounce times efficiently', async () => {
      const debounceTimes = [100, 200, 500, 1000]
      const results: number[] = []

      for (const debounceMs of debounceTimes) {
        jest.clearAllMocks()

        const { result } = renderHook(() => useAssessmentAutoSave({
          assessmentType: 'complete',
          debounceMs
        }))

        const startTime = Date.now()

        act(() => {
          result.current.saveProgress({ test: 'data' }, 1)
        })

        act(() => {
          jest.advanceTimersByTime(debounceMs)
        })

        await new Promise(resolve => setTimeout(resolve, 0))

        const totalTime = Date.now() - startTime
        results.push(totalTime)
      }

      // Performance should not degrade significantly with longer debounce times
      // (within reasonable bounds for test environment)
      results.forEach(time => {
        expect(time).toBeLessThan(50) // All operations should be very fast in test env
      })
    })
  })

  describe('Concurrent Save Operations', () => {
    it('should handle multiple components saving simultaneously', async () => {
      const components = 5
      const hooks = Array.from({ length: components }, () =>
        renderHook(() => useAssessmentAutoSave({
          assessmentType: 'complete',
          debounceMs: 200
        }))
      )

      const startTime = Date.now()

      // All components save at the same time
      act(() => {
        hooks.forEach((hook, index) => {
          hook.result.current.saveProgress(
            { componentId: index, data: 'test' },
            1
          )
        })
      })

      const concurrentTime = Date.now() - startTime

      // Should handle concurrent operations efficiently
      expect(concurrentTime).toBeLessThan(50)

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(200)
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      // Each component should have made its own save call
      expect(fetch).toHaveBeenCalledTimes(components)
    })

    it('should prevent duplicate saves for identical data', async () => {
      const { result } = renderHook(() => useAssessmentAutoSave({
        assessmentType: 'complete',
        debounceMs: 100
      }))

      const identicalData = { question1: 'answer1', question2: 'answer2' }

      act(() => {
        // Save identical data multiple times
        for (let i = 0; i < 10; i++) {
          result.current.saveProgress(identicalData, 1)
        }
      })

      act(() => {
        jest.advanceTimersByTime(100)
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      // Should make the first save
      expect(fetch).toHaveBeenCalledTimes(1)

      // Try to save the same data again after completion
      act(() => {
        result.current.saveProgress(identicalData, 1)
      })

      act(() => {
        jest.advanceTimersByTime(100)
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      // Should not make additional saves for identical data
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Recovery Performance', () => {
    it('should handle retry backoff without blocking UI', async () => {
      let failureCount = 0
      ;(global.fetch as jest.Mock).mockImplementation(() => {
        failureCount++
        if (failureCount <= 2) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'success', status: 'saved' })
        })
      })

      const { result } = renderHook(() => useAssessmentAutoSave({
        assessmentType: 'complete',
        debounceMs: 100
      }))

      const startTime = Date.now()

      // Trigger save that will fail and retry
      act(() => {
        result.current.saveProgress({ test: 'data' }, 1)
      })

      // Initial debounce
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // First retry (1 second)
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Second retry (2 seconds)
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const totalTime = Date.now() - startTime

      // Should complete retries efficiently in test environment
      expect(totalTime).toBeLessThan(100)
      expect(fetch).toHaveBeenCalledTimes(3)
      expect(failureCount).toBe(3)
      expect(result.current.error).toBeNull()
    })

    it('should maintain performance during network instability', async () => {
      let callCount = 0
      ;(global.fetch as jest.Mock).mockImplementation(() => {
        callCount++
        // Simulate intermittent failures
        if (callCount % 3 === 0) {
          return Promise.reject(new Error('Network unstable'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: `save-${callCount}`, status: 'saved' })
        })
      })

      const { result } = renderHook(() => useAssessmentAutoSave({
        assessmentType: 'complete',
        debounceMs: 50
      }))

      const operationTimes: number[] = []

      // Perform multiple save operations
      for (let i = 0; i < 10; i++) {
        const opStart = Date.now()

        act(() => {
          result.current.saveProgress({ operation: i }, i)
        })

        act(() => {
          jest.advanceTimersByTime(50)
        })

        // Allow retries to complete
        act(() => {
          jest.advanceTimersByTime(3000) // Max retry time
        })

        await new Promise(resolve => setTimeout(resolve, 0))

        operationTimes.push(Date.now() - opStart)
      }

      // Performance should remain consistent despite failures
      const avgTime = operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length
      const maxTime = Math.max(...operationTimes)
      
      expect(avgTime).toBeLessThan(20) // Average should be very fast in test env
      expect(maxTime).toBeLessThan(100) // Even slowest should be reasonable
    })
  })

  describe('Memory Usage Optimization', () => {
    it('should clean up timeouts and references properly', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      
      const { result, unmount } = renderHook(() => useAssessmentAutoSave({
        assessmentType: 'complete',
        debounceMs: 100
      }))

      // Create pending operations
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.saveProgress({ pending: i }, i)
        }
      })

      // Unmount before operations complete
      unmount()

      // Should have cleaned up timeouts
      expect(clearTimeoutSpy).toHaveBeenCalled()
      
      clearTimeoutSpy.mockRestore()
    })

    it('should handle localStorage efficiently for large datasets', async () => {
      const { result } = renderHook(() => useAssessmentAutoSave({
        assessmentType: 'complete',
        debounceMs: 100,
        enableLocalBackup: true
      }))

      // Generate large dataset
      const largeAnswers = Array.from({ length: 100 }, (_, i) => ({
        [`question_${i}`]: `This is a long answer for question ${i} with lots of text content that simulates a real user response with detailed explanations and multiple sentences that could potentially stress the localStorage system.`
      }))

      const startTime = Date.now()

      act(() => {
        largeAnswers.forEach((answers, index) => {
          result.current.saveProgress(answers, index)
        })
      })

      const processingTime = Date.now() - startTime

      // Should handle large datasets efficiently
      expect(processingTime).toBeLessThan(100)

      act(() => {
        jest.advanceTimersByTime(100)
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      // Should have attempted localStorage save
      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('Real-world Usage Patterns', () => {
    it('should handle typical user assessment completion efficiently', async () => {
      const { result } = renderHook(() => useAssessmentAutoSave({
        assessmentType: 'complete',
        debounceMs: 500
      }))

      const totalStartTime = Date.now()

      // Simulate DISC assessment (15 questions)
      for (let i = 0; i < 15; i++) {
        act(() => {
          result.current.saveProgress(
            { [`disc_q${i}`]: Math.floor(Math.random() * 4) },
            i + 1
          )
        })
        
        // Simulate user think time between questions
        act(() => {
          jest.advanceTimersByTime(300)
        })
      }

      // Final save for DISC results
      act(() => {
        result.current.saveFinalResults({
          disc_results: { D: 0.3, I: 0.2, S: 0.25, C: 0.25 }
        })
      })

      act(() => {
        jest.advanceTimersByTime(500) // Complete debounce
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const totalTime = Date.now() - totalStartTime

      // Should complete typical assessment flow efficiently
      expect(totalTime).toBeLessThan(200)
      
      // Should not have excessive API calls
      expect((fetch as jest.Mock).mock.calls.length).toBeLessThan(10)
    })

    it('should optimize for mobile performance constraints', async () => {
      // Simulate slower mobile environment
      const originalSetTimeout = global.setTimeout
      global.setTimeout = jest.fn((callback, delay) => 
        originalSetTimeout(callback, delay ? delay * 0.1 : 0) // 10x faster for simulation
      )

      const { result } = renderHook(() => useAssessmentAutoSave({
        assessmentType: 'complete',
        debounceMs: 1000 // Longer debounce for mobile
      }))

      const mobileOperationTimes: number[] = []

      // Simulate mobile interaction patterns
      for (let i = 0; i < 5; i++) {
        const start = Date.now()
        
        act(() => {
          result.current.saveProgress({ mobileData: i }, i)
        })

        mobileOperationTimes.push(Date.now() - start)
      }

      // Mobile operations should be consistently fast
      const avgMobileTime = mobileOperationTimes.reduce((a, b) => a + b, 0) / mobileOperationTimes.length
      expect(avgMobileTime).toBeLessThan(10)

      global.setTimeout = originalSetTimeout
    })
  })
})