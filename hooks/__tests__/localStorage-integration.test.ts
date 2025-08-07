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

// Mock localStorage with real-like behavior
const createMockLocalStorage = () => {
  const storage: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key]
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    }),
    _storage: storage, // For testing access
  }
}

const mockLocalStorage = createMockLocalStorage()
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock timers
jest.useFakeTimers()

describe('localStorage Integration Tests', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.clear()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      loading: false,
      error: null,
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Fallback behavior when API fails', () => {
    it('should save to localStorage when API is completely down', async () => {
      // Mock complete API failure
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const testData = {
        soft_skills_results: { comunicacao: 8, lideranca: 7 }
      }

      act(() => {
        result.current.saveProgress(null, undefined, testData)
      })

      // Fast forward through debounce and all retries
      act(() => {
        jest.advanceTimersByTime(8000) // 500ms debounce + 7000ms retries
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          `assessment_backup_soft_skills_${mockUser.id}`,
          expect.stringContaining('"soft_skills_results"')
        )
      })

      // Verify the saved data structure
      const savedData = JSON.parse(mockLocalStorage._storage[`assessment_backup_soft_skills_${mockUser.id}`])
      expect(savedData).toMatchObject({
        soft_skills_results: { comunicacao: 8, lideranca: 7 },
        timestamp: expect.any(String),
      })
    })

    it('should restore from localStorage when API fails on load', async () => {
      // Pre-populate localStorage with backup data
      const backupData = {
        assessmentId: 'local-backup-id',
        type: 'soft_skills' as const,
        soft_skills_results: { comunicacao: 9, lideranca: 8 },
        timestamp: new Date().toISOString(),
      }

      mockLocalStorage.setItem(
        `assessment_backup_soft_skills_${mockUser.id}`,
        JSON.stringify(backupData)
      )

      // Mock API failure for loading
      mockFetch.mockRejectedValue(new Error('API unavailable'))

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const loadedData = await result.current.loadIncompleteAssessment()

      expect(loadedData).toEqual(backupData)
      expect(mockFetch).toHaveBeenCalledWith('/api/assessment')
    })

    it('should sync localStorage data when API comes back online', async () => {
      // Start with API down - data goes to localStorage
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'sjt' })
      )

      const testData = { sjt_results: [9, 8, 7] }

      act(() => {
        result.current.saveProgress(null, undefined, testData)
      })

      act(() => {
        jest.advanceTimersByTime(8000)
      })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
        expect(result.current.error).toBe('Network error')
      })

      // Now API comes back online
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'synced-assessment-id' }),
      } as Response)

      // Try saving again - should succeed and sync
      const newData = { sjt_results: [9, 8, 7, 6] }

      act(() => {
        result.current.saveProgress(null, undefined, newData)
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(result.current.error).toBeNull()
        expect(result.current.assessmentId).toBe('synced-assessment-id')
        expect(mockFetch).toHaveBeenLastCalledWith('/api/assessment', expect.any(Object))
      })
    })
  })

  describe('Data persistence and recovery', () => {
    it('should maintain data integrity across hook remounts', async () => {
      const testData = {
        soft_skills_results: { comunicacao: 8, lideranca: 7, adaptabilidade: 9 }
      }

      // First hook instance - save data
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'test-assessment-id' }),
      } as Response)

      const { result: firstResult, unmount } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      act(() => {
        firstResult.current.saveProgress(null, undefined, testData)
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
      })

      unmount()

      // Second hook instance - should load from localStorage
      const { result: secondResult } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const recoveredData = secondResult.current.loadFromLocalStorage()
      expect(recoveredData).toMatchObject({
        soft_skills_results: testData.soft_skills_results,
      })
    })

    it('should handle corrupt localStorage data gracefully', () => {
      // Set corrupt data
      mockLocalStorage.setItem(
        `assessment_backup_soft_skills_${mockUser.id}`,
        'invalid-json-data'
      )

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const loadedData = result.current.loadFromLocalStorage()
      expect(loadedData).toBeNull()
    })

    it('should clean up expired localStorage data', () => {
      // Set expired data (25 hours old)
      const expiredTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      const expiredData = {
        soft_skills_results: { comunicacao: 8 },
        timestamp: expiredTimestamp,
      }

      mockLocalStorage.setItem(
        `assessment_backup_soft_skills_${mockUser.id}`,
        JSON.stringify(expiredData)
      )

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const loadedData = result.current.loadFromLocalStorage()

      expect(loadedData).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `assessment_backup_soft_skills_${mockUser.id}`
      )
    })
  })

  describe('Multi-assessment type isolation', () => {
    it('should keep different assessment types separate in localStorage', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      // Create hooks for different assessment types
      const { result: softSkillsResult } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const { result: sjtResult } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'sjt' })
      )

      const { result: discResult } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'disc' })
      )

      // Save different data for each type
      const softSkillsData = { soft_skills_results: { comunicacao: 8 } }
      const sjtData = { sjt_results: [9, 8, 7] }
      const discData = { disc_results: { D: 8, I: 7, S: 6, C: 9 } }

      act(() => {
        softSkillsResult.current.saveProgress(null, undefined, softSkillsData)
        sjtResult.current.saveProgress(null, undefined, sjtData)
        discResult.current.saveProgress(null, undefined, discData)
      })

      act(() => {
        jest.advanceTimersByTime(8000)
      })

      // Verify each type has its own localStorage key
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          `assessment_backup_soft_skills_${mockUser.id}`,
          expect.stringContaining('"soft_skills_results"')
        )
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          `assessment_backup_sjt_${mockUser.id}`,
          expect.stringContaining('"sjt_results"')
        )
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          `assessment_backup_disc_${mockUser.id}`,
          expect.stringContaining('"disc_results"')
        )
      })

      // Verify data isolation
      const softSkillsBackup = JSON.parse(mockLocalStorage._storage[`assessment_backup_soft_skills_${mockUser.id}`])
      const sjtBackup = JSON.parse(mockLocalStorage._storage[`assessment_backup_sjt_${mockUser.id}`])
      const discBackup = JSON.parse(mockLocalStorage._storage[`assessment_backup_disc_${mockUser.id}`])

      expect(softSkillsBackup.soft_skills_results).toBeDefined()
      expect(softSkillsBackup.sjt_results).toBeUndefined()

      expect(sjtBackup.sjt_results).toBeDefined()
      expect(sjtBackup.soft_skills_results).toBeUndefined()

      expect(discBackup.disc_results).toBeDefined()
      expect(discBackup.soft_skills_results).toBeUndefined()
    })
  })

  describe('User isolation', () => {
    it('should isolate localStorage data by user ID', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const user1 = { id: 'user-1', email: 'user1@test.com' }
      const user2 = { id: 'user-2', email: 'user2@test.com' }

      // Test with first user
      mockUseAuth.mockReturnValue({
        user: user1,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        loading: false,
        error: null,
      })

      const { result: user1Result, unmount: unmountUser1 } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      act(() => {
        user1Result.current.saveProgress(null, undefined, {
          soft_skills_results: { comunicacao: 8 }
        })
      })

      act(() => {
        jest.advanceTimersByTime(8000)
      })

      unmountUser1()

      // Switch to second user
      mockUseAuth.mockReturnValue({
        user: user2,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        loading: false,
        error: null,
      })

      const { result: user2Result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      act(() => {
        user2Result.current.saveProgress(null, undefined, {
          soft_skills_results: { comunicacao: 9 }
        })
      })

      act(() => {
        jest.advanceTimersByTime(8000)
      })

      // Verify separate storage keys
      await waitFor(() => {
        expect(mockLocalStorage._storage[`assessment_backup_soft_skills_user-1`]).toBeDefined()
        expect(mockLocalStorage._storage[`assessment_backup_soft_skills_user-2`]).toBeDefined()

        const user1Data = JSON.parse(mockLocalStorage._storage[`assessment_backup_soft_skills_user-1`])
        const user2Data = JSON.parse(mockLocalStorage._storage[`assessment_backup_soft_skills_user-2`])

        expect(user1Data.soft_skills_results.comunicacao).toBe(8)
        expect(user2Data.soft_skills_results.comunicacao).toBe(9)
      })
    })

    it('should handle anonymous users gracefully', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        loading: false,
        error: null,
      })

      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      act(() => {
        result.current.saveProgress(null, undefined, {
          soft_skills_results: { comunicacao: 8 }
        })
      })

      act(() => {
        jest.advanceTimersByTime(8000)
      })

      // Should save with 'anonymous' user
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'assessment_backup_soft_skills_anonymous',
          expect.any(String)
        )
      })
    })
  })

  describe('Storage quota and error handling', () => {
    it('should handle localStorage quota exceeded gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      // Mock storage quota exceeded
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      act(() => {
        result.current.saveProgress(null, undefined, {
          soft_skills_results: { comunicacao: 8 }
        })
      })

      act(() => {
        jest.advanceTimersByTime(8000)
      })

      // Should not crash and should log warning
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save to localStorage:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should handle localStorage access denied gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Access denied')
      })

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const loadedData = result.current.loadFromLocalStorage()
      expect(loadedData).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('Concurrent access scenarios', () => {
    it('should handle multiple rapid saves correctly', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills', debounceMs: 100 })
      )

      // Multiple rapid saves
      act(() => {
        result.current.saveProgress(null, undefined, { soft_skills_results: { comunicacao: 8 } })
        result.current.saveProgress(null, undefined, { soft_skills_results: { comunicacao: 9 } })
        result.current.saveProgress(null, undefined, { soft_skills_results: { comunicacao: 10 } })
      })

      act(() => {
        jest.advanceTimersByTime(8200) // Debounce + retries
      })

      // Should only save the final value due to debouncing
      await waitFor(() => {
        const savedData = JSON.parse(mockLocalStorage._storage[`assessment_backup_soft_skills_${mockUser.id}`])
        expect(savedData.soft_skills_results.comunicacao).toBe(10)
      })
    })
  })
})