import { renderHook, act, waitFor } from '@testing-library/react'
import { useAssessmentHistory } from '../use-assessment-history'
import { useAuth } from '@/components/providers/auth-provider'
import type { Assessment } from '@/lib/supabase/types'
import type { AssessmentListResponse } from '@/lib/services/assessment-service'

// Mock the auth provider
jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock window.location
delete (window as any).location
window.location = { origin: 'http://localhost:3000' } as any

describe('useAssessmentHistory', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  const mockAssessments: Pick<Assessment, 'id' | 'type' | 'status' | 'created_at' | 'completed_at'>[] = [
    {
      id: 'assessment-1',
      type: 'complete',
      status: 'completed',
      created_at: '2024-01-15T10:00:00Z',
      completed_at: '2024-01-15T11:30:00Z',
    },
    {
      id: 'assessment-2',
      type: 'disc',
      status: 'in_progress',
      created_at: '2024-01-16T14:00:00Z',
      completed_at: null,
    },
    {
      id: 'assessment-3',
      type: 'soft_skills',
      status: 'completed',
      created_at: '2024-01-17T09:00:00Z',
      completed_at: '2024-01-17T09:45:00Z',
    },
  ]

  const mockApiResponse: AssessmentListResponse = {
    assessments: mockAssessments,
    pagination: {
      total: 3,
      page: 1,
      limit: 20,
    },
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

  describe('Hook initialization and default state', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAssessmentHistory())

      expect(result.current.assessments).toEqual([])
      expect(result.current.pagination.total).toBe(0)
      expect(result.current.pagination.page).toBe(1)
      expect(result.current.pagination.limit).toBe(20)
      expect(result.current.pagination.totalPages).toBe(0)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.lastUpdated).toBeNull()
      expect(result.current.filters).toEqual({})
    })

    it('should accept custom options', () => {
      const { result } = renderHook(() =>
        useAssessmentHistory({
          initialPage: 2,
          pageSize: 10,
          autoRefresh: true,
          refreshInterval: 15000,
        })
      )

      expect(result.current.pagination.page).toBe(2)
      expect(result.current.pagination.limit).toBe(10)
    })

    it('should initialize computed flags correctly', () => {
      const { result } = renderHook(() => useAssessmentHistory())

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.isFirstPage).toBe(true)
      expect(result.current.isLastPage).toBe(true)
      expect(result.current.hasNextPage).toBe(false)
      expect(result.current.hasPreviousPage).toBe(false)
    })
  })

  describe('Loading state management during API calls', () => {
    it('should set loading state during API calls', async () => {
      let resolvePromise: (value: any) => void
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValueOnce(pendingPromise)

      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments()
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBeNull()

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should clear error state when starting new API call', async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments()
      })

      await waitFor(() => {
        expect(result.current.error).toBe('API Error')
      })

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any)

      act(() => {
        result.current.fetchAssessments()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(true)
    })
  })

  describe('Successful data fetching and state update', () => {
    it('should fetch and update state with successful API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any)

      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.assessments).toEqual(mockAssessments)
        expect(result.current.pagination.total).toBe(3)
        expect(result.current.pagination.totalPages).toBe(1)
        expect(result.current.lastUpdated).toBeInstanceOf(Date)
        expect(result.current.error).toBeNull()
      })
    })

    it('should calculate totalPages correctly', async () => {
      const largeResponse = {
        assessments: mockAssessments,
        pagination: {
          total: 50,
          page: 1,
          limit: 20,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(largeResponse),
      } as any)

      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments()
      })

      await waitFor(() => {
        expect(result.current.pagination.totalPages).toBe(3) // Math.ceil(50/20)
      })
    })

    it('should update computed flags after successful fetch', async () => {
      const multiPageResponse = {
        assessments: mockAssessments,
        pagination: {
          total: 50,
          page: 2,
          limit: 20,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(multiPageResponse),
      } as any)

      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments(2)
      })

      await waitFor(() => {
        expect(result.current.isEmpty).toBe(false)
        expect(result.current.isFirstPage).toBe(false)
        expect(result.current.isLastPage).toBe(false)
        expect(result.current.hasNextPage).toBe(true)
        expect(result.current.hasPreviousPage).toBe(true)
      })
    })
  })

  describe('Error handling during API failures', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error')
      mockFetch.mockRejectedValueOnce(networkError)

      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe('Network error')
        expect(result.current.assessments).toEqual([])
      })
    })

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as any)

      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments()
      })

      await waitFor(() => {
        expect(result.current.error).toBe('HTTP 404: Failed to fetch assessments')
      })
    })

    it('should handle non-Error objects', async () => {
      mockFetch.mockRejectedValueOnce('String error')

      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments()
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Unknown error occurred')
      })
    })

    it('should not fetch when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        loading: false,
        error: null,
      })

      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments()
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.error).toBe('User not authenticated')
    })
  })

  describe('Filters state management', () => {
    it('should update filters and reset to first page', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any)

      const { result } = renderHook(() => useAssessmentHistory())

      // First, navigate to page 2
      act(() => {
        result.current.goToPage(2)
      })

      // Then update filters
      act(() => {
        result.current.updateFilters({ type: 'disc' })
      })

      await waitFor(() => {
        expect(result.current.filters.type).toBe('disc')
      })

      // Should have made API call for page 1
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('page=1&limit=20&type=disc')
      )
    })

    it('should include all filter parameters in API calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any)

      const { result } = renderHook(() => useAssessmentHistory())

      const filters = {
        type: 'disc' as const,
        status: 'completed' as const,
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-01-31'),
        search: 'test',
      }

      act(() => {
        result.current.updateFilters(filters)
      })

      await waitFor(() => {
        const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0] as string
        expect(lastCall).toContain('type=disc')
        expect(lastCall).toContain('status=completed')
        expect(lastCall).toContain('dateFrom=2024-01-01T00%3A00%3A00.000Z')
        expect(lastCall).toContain('dateTo=2024-01-31T00%3A00%3A00.000Z')
        expect(lastCall).toContain('search=test')
      })
    })

    it('should clear all filters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any)

      const { result } = renderHook(() => useAssessmentHistory())

      // Set some filters first
      act(() => {
        result.current.updateFilters({ type: 'disc', status: 'completed' })
      })

      await waitFor(() => {
        expect(result.current.filters.type).toBe('disc')
      })

      // Clear filters
      act(() => {
        result.current.clearFilters()
      })

      await waitFor(() => {
        expect(result.current.filters).toEqual({})
      })
    })
  })

  describe('Pagination state management', () => {
    it('should navigate to specific page', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          ...mockApiResponse,
          pagination: { total: 50, page: 3, limit: 20 },
        }),
      } as any)

      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.goToPage(3)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=3')
        )
      })
    })

    it('should not navigate to invalid pages', async () => {
      const { result } = renderHook(() => useAssessmentHistory())

      // Set up state with known totalPages
      act(() => {
        result.current.fetchAssessments = jest.fn()
      })

      // Try to navigate to page 0
      act(() => {
        result.current.goToPage(0)
      })

      expect(result.current.fetchAssessments).not.toHaveBeenCalled()

      // Try to navigate beyond total pages
      act(() => {
        result.current.goToPage(999)
      })

      expect(result.current.fetchAssessments).not.toHaveBeenCalled()
    })

    it('should handle next and previous page navigation', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          ...mockApiResponse,
          pagination: { total: 50, page: 2, limit: 20 },
        }),
      } as any)

      const { result } = renderHook(() => useAssessmentHistory())

      // Set initial state
      act(() => {
        result.current.fetchAssessments(2)
      })

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(2)
        expect(result.current.pagination.totalPages).toBe(3)
      })

      // Test next page
      act(() => {
        result.current.nextPage()
      })

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('page=3')
      )

      // Test previous page (need to reset mock to track calls)
      mockFetch.mockClear()
      
      act(() => {
        result.current.previousPage()
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1')
      )
    })
  })

  describe('Client-side filtering functionality', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any)
    })

    it('should filter assessments by type', async () => {
      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments()
      })

      await waitFor(() => {
        expect(result.current.assessments).toEqual(mockAssessments)
      })

      const filtered = result.current.getFilteredAssessments({ type: 'disc' })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].type).toBe('disc')
    })

    it('should filter assessments by status', async () => {
      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments()
      })

      await waitFor(() => {
        expect(result.current.assessments).toEqual(mockAssessments)
      })

      const filtered = result.current.getFilteredAssessments({ status: 'completed' })
      expect(filtered).toHaveLength(2)
      expect(filtered.every(a => a.status === 'completed')).toBe(true)
    })

    it('should filter assessments by date range', async () => {
      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments()
      })

      await waitFor(() => {
        expect(result.current.assessments).toEqual(mockAssessments)
      })

      const filtered = result.current.getFilteredAssessments({
        dateFrom: new Date('2024-01-16'),
        dateTo: new Date('2024-01-17'),
      })
      expect(filtered).toHaveLength(2) // assessment-2 and assessment-3
    })

    it('should filter assessments by search term', async () => {
      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments()
      })

      await waitFor(() => {
        expect(result.current.assessments).toEqual(mockAssessments)
      })

      const filtered = result.current.getFilteredAssessments({ search: 'soft' })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].type).toBe('soft_skills')
    })

    it('should combine multiple filters', async () => {
      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments()
      })

      await waitFor(() => {
        expect(result.current.assessments).toEqual(mockAssessments)
      })

      const filtered = result.current.getFilteredAssessments({
        status: 'completed',
        search: 'soft',
      })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].type).toBe('soft_skills')
      expect(filtered[0].status).toBe('completed')
    })
  })

  describe('Individual assessment fetching', () => {
    it('should fetch individual assessment by ID', async () => {
      const mockAssessment = {
        id: 'test-assessment',
        type: 'disc',
        status: 'completed',
        // ... other properties
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAssessment),
      } as any)

      const { result } = renderHook(() => useAssessmentHistory())

      const assessment = await result.current.getAssessment('test-assessment')

      expect(assessment).toEqual(mockAssessment)
      expect(mockFetch).toHaveBeenCalledWith('/api/assessment/test-assessment')
    })

    it('should return null for failed individual assessment fetch', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Not found'))

      const { result } = renderHook(() => useAssessmentHistory())

      const assessment = await result.current.getAssessment('nonexistent')

      expect(assessment).toBeNull()
    })

    it('should not fetch individual assessment when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        loading: false,
        error: null,
      })

      const { result } = renderHook(() => useAssessmentHistory())

      const assessment = await result.current.getAssessment('test-assessment')

      expect(assessment).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Summary statistics', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any)
    })

    it('should calculate summary statistics correctly', async () => {
      const { result } = renderHook(() => useAssessmentHistory())

      act(() => {
        result.current.fetchAssessments()
      })

      await waitFor(() => {
        expect(result.current.assessments).toEqual(mockAssessments)
      })

      const summary = result.current.getSummary()

      expect(summary.total).toBe(3)
      expect(summary.completed).toBe(2)
      expect(summary.inProgress).toBe(1)
      expect(summary.completionRate).toBe(67) // Math.round((2/3)*100)
      expect(summary.averageCompletionTimeMinutes).toBeGreaterThan(0)
    })

    it('should handle empty assessments list', () => {
      const { result } = renderHook(() => useAssessmentHistory())

      const summary = result.current.getSummary()

      expect(summary.total).toBe(0)
      expect(summary.completed).toBe(0)
      expect(summary.inProgress).toBe(0)
      expect(summary.completionRate).toBe(0)
      expect(summary.averageCompletionTimeMinutes).toBe(0)
    })
  })

  describe('Refresh functionality', () => {
    it('should refresh current page data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any)

      const { result } = renderHook(() => useAssessmentHistory())

      // Initial fetch
      act(() => {
        result.current.fetchAssessments(2)
      })

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(2)
      })

      mockFetch.mockClear()

      // Refresh
      act(() => {
        result.current.refresh()
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2') // Should refresh current page
        )
      })
    })
  })

  describe('Cleanup on unmount', () => {
    it('should handle component unmount gracefully', () => {
      const { unmount } = renderHook(() => useAssessmentHistory())

      expect(() => unmount()).not.toThrow()
    })
  })
})
