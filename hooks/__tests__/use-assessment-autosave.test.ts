import { renderHook, act, waitFor } from '@testing-library/react'
import { useAssessmentAutoSave } from '../use-assessment-autosave'
import { useAuth } from '@/components/providers/auth-provider'
import type { DiscResults, SoftSkillsResults, SjtResults } from '@/lib/supabase/types'

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

// Mock timers
jest.useFakeTimers()

describe('useAssessmentAutoSave', () => {
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
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
    mockLocalStorage.removeItem.mockClear()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('Initial state', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      expect(result.current.isSaving).toBe(false)
      expect(result.current.lastSaved).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.assessmentId).toBeNull()
      expect(result.current.saveStatus).toBe('Não salvo')
    })

    it('should accept custom options', () => {
      const { result } = renderHook(() =>
        useAssessmentAutoSave({
          assessmentType: 'disc',
          debounceMs: 1000,
          enableLocalBackup: false,
        })
      )

      expect(result.current).toBeDefined()
    })
  })

  describe('saveProgress function', () => {
    it('should debounce save requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test-assessment-id' }),
      } as Response)

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills', debounceMs: 500 })
      )

      const testResults = { comunicacao: 8, lideranca: 7 }

      act(() => {
        result.current.saveProgress(null, undefined, { soft_skills_results: testResults })
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.isSaving).toBe(false)

      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'soft_skills',
            status: 'in_progress',
            soft_skills_results: testResults,
          }),
        })
      })
    })

    it('should prevent duplicate saves', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'test-assessment-id' }),
      } as Response)

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const testResults = { comunicacao: 8, lideranca: 7 }

      act(() => {
        result.current.saveProgress(null, undefined, { soft_skills_results: testResults })
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false)
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      // Try to save the same data again
      act(() => {
        result.current.saveProgress(null, undefined, { soft_skills_results: testResults })
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1) // Should still be 1 due to duplicate prevention
      })
    })

    it('should not save when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        loading: false,
        error: null,
      })

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const testResults = { comunicacao: 8, lideranca: 7 }

      act(() => {
        result.current.saveProgress(null, undefined, { soft_skills_results: testResults })
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Error handling and retry logic', () => {
    it('should retry failed saves with exponential backoff', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'test-assessment-id' }),
        } as Response)

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const testResults = { comunicacao: 8, lideranca: 7 }

      act(() => {
        result.current.saveProgress(null, undefined, { soft_skills_results: testResults })
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Wait for first retry
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Wait for second retry
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3)
        expect(result.current.error).toBeNull()
      })
    })

    it('should save to localStorage on API failure after retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const testResults = { comunicacao: 8, lideranca: 7 }

      act(() => {
        result.current.saveProgress(null, undefined, { soft_skills_results: testResults })
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Wait for all retries to complete
      act(() => {
        jest.advanceTimersByTime(7000) // 1s + 2s + 4s
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          `assessment_backup_soft_skills_${mockUser.id}`,
          expect.stringContaining('"soft_skills_results"')
        )
      })
    })
  })

  describe('localStorage backup functionality', () => {
    it('should save backup data to localStorage', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test-assessment-id' }),
      } as Response)

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const testResults = { comunicacao: 8, lideranca: 7 }

      act(() => {
        result.current.saveProgress(null, undefined, { soft_skills_results: testResults })
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          `assessment_backup_soft_skills_${mockUser.id}`,
          expect.stringContaining('"soft_skills_results"')
        )
      })
    })

    it('should load from localStorage when available', () => {
      const mockBackupData = {
        soft_skills_results: { comunicacao: 8, lideranca: 7 },
        timestamp: new Date().toISOString(),
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockBackupData))

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const loadedData = result.current.loadFromLocalStorage()
      expect(loadedData).toEqual(mockBackupData)
    })

    it('should remove old backup data (>24h)', () => {
      const oldTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
      const mockOldBackupData = {
        soft_skills_results: { comunicacao: 8, lideranca: 7 },
        timestamp: oldTimestamp,
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockOldBackupData))

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const loadedData = result.current.loadFromLocalStorage()
      expect(loadedData).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `assessment_backup_soft_skills_${mockUser.id}`
      )
    })

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const loadedData = result.current.loadFromLocalStorage()
      expect(loadedData).toBeNull()
    })
  })

  describe('saveFinalResults function', () => {
    it('should save final results immediately without debounce', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test-assessment-id' }),
      } as Response)

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const testResults: SoftSkillsResults = { comunicacao: 8, lideranca: 7 }

      await act(async () => {
        await result.current.saveFinalResults({ soft_skills_results: testResults })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: undefined,
          type: 'soft_skills',
          status: 'in_progress',
          disc_results: null,
          soft_skills_results: testResults,
          sjt_results: null,
        }),
      })
    })
  })

  describe('completeAssessment function', () => {
    it('should mark assessment as complete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test-assessment-id' }),
      } as Response)

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      // Set assessment ID first
      act(() => {
        result.current.saveProgress(null, undefined, { soft_skills_results: { comunicacao: 8 } })
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(result.current.assessmentId).toBe('test-assessment-id')
      })

      // Now complete the assessment
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'complete' }),
      } as Response)

      await act(async () => {
        await result.current.completeAssessment()
      })

      expect(mockFetch).toHaveBeenLastCalledWith('/api/assessment/test-assessment-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      })
    })

    it('should throw error when no assessment ID available', async () => {
      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      await expect(result.current.completeAssessment()).rejects.toThrow(
        'No assessment ID available'
      )
    })
  })

  describe('loadIncompleteAssessment function', () => {
    it('should load incomplete assessment from API', async () => {
      const mockAssessment = {
        id: 'test-assessment-id',
        soft_skills_results: { comunicacao: 8, lideranca: 7 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAssessment),
      } as Response)

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const assessment = await result.current.loadIncompleteAssessment()

      expect(assessment).toEqual(mockAssessment)
      expect(result.current.assessmentId).toBe('test-assessment-id')
    })

    it('should return null when no incomplete assessment found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response)

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const assessment = await result.current.loadIncompleteAssessment()

      expect(assessment).toBeNull()
    })

    it('should fallback to localStorage on API error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'))

      const mockBackupData = {
        soft_skills_results: { comunicacao: 8, lideranca: 7 },
        timestamp: new Date().toISOString(),
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockBackupData))

      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      const assessment = await result.current.loadIncompleteAssessment()

      expect(assessment).toEqual(mockBackupData)
    })
  })

  describe('saveStatus computed property', () => {
    it('should return correct status messages', async () => {
      const { result } = renderHook(() =>
        useAssessmentAutoSave({ assessmentType: 'soft_skills' })
      )

      expect(result.current.saveStatus).toBe('Não salvo')

      act(() => {
        result.current.saveProgress(null, undefined, { soft_skills_results: { comunicacao: 8 } })
      })

      expect(result.current.saveStatus).toBe('Não salvo')

      act(() => {
        jest.advanceTimersByTime(100) // During save
      })

      await waitFor(() => {
        expect(result.current.saveStatus).toBe('Salvando...')
      })
    })
  })
})