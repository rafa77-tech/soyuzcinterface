import { renderHook, act } from '@testing-library/react'
import { jest } from '@jest/globals'

import { useAssessmentHistory } from '../use-assessment-history'
import { assessmentService } from '@/lib/services/assessment-service'

// Mock the assessment service
const mockListAssessments = jest.fn()

jest.mock('@/lib/services/assessment-service', () => ({
  assessmentService: {
    listAssessments: mockListAssessments
  }
}))

const mockAssessmentsData = [
  {
    id: '1',
    type: 'complete' as const,
    status: 'completed' as const,
    created_at: '2025-01-20T10:00:00Z',
    completed_at: '2025-01-20T10:45:00Z',
    updated_at: '2025-01-20T10:45:00Z'
  },
  {
    id: '2',
    type: 'disc' as const,
    status: 'in_progress' as const,
    created_at: '2025-01-25T14:00:00Z',
    updated_at: '2025-01-25T14:30:00Z'
  },
  {
    id: '3',
    type: 'soft_skills' as const,
    status: 'completed' as const,
    created_at: '2025-01-22T09:00:00Z',
    completed_at: '2025-01-22T09:30:00Z',
    updated_at: '2025-01-22T09:30:00Z'
  }
]

describe('useAssessmentHistory', () => {
  beforeEach(() => {
    mockListAssessments.mockResolvedValue({
      data: mockAssessmentsData,
      count: mockAssessmentsData.length
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('initializes with correct default values', () => {
      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      expect(result.current.assessments).toEqual([])
      expect(result.current.filteredAssessments).toEqual([])
      expect(result.current.isLoading).toBe(true) // Initially loading
      expect(result.current.error).toBe(null)
      expect(result.current.filters).toEqual({
        type: '',
        status: '',
        dateFrom: null,
        dateTo: null,
        search: ''
      })
      expect(result.current.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      })
    })

    it('does not fetch assessments when userId is null', () => {
      renderHook(() => useAssessmentHistory(null))

      expect(mockListAssessments).not.toHaveBeenCalled()
    })
  })

  describe('Data Fetching', () => {
    it('fetches assessments when userId is provided', async () => {
      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        // Wait for initial fetch to complete
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(mockListAssessments).toHaveBeenCalledWith({
        userId: 'user-123',
        page: 1,
        limit: 1000
      })
    })

    it('updates assessments state after successful fetch', async () => {
      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.assessments).toHaveLength(3)
      expect(result.current.isLoading).toBe(false)
    })

    it('handles fetch errors gracefully', async () => {
      const mockError = new Error('Network error')
      mockListAssessments.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.error).toBe(mockError)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.assessments).toEqual([])
    })
  })

  describe('Filtering', () => {
    it('filters assessments by type', async () => {
      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      act(() => {
        result.current.setFilters({ type: 'disc' })
      })

      expect(result.current.filteredAssessments).toHaveLength(1)
      expect(result.current.filteredAssessments[0].type).toBe('disc')
    })

    it('filters assessments by status', async () => {
      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      act(() => {
        result.current.setFilters({ status: 'completed' })
      })

      expect(result.current.filteredAssessments).toHaveLength(2)
      expect(result.current.filteredAssessments.every(a => a.status === 'completed')).toBe(true)
    })

    it('filters assessments by date range', async () => {
      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const dateFrom = new Date('2025-01-21T00:00:00Z')
      const dateTo = new Date('2025-01-26T00:00:00Z')

      act(() => {
        result.current.setFilters({ dateFrom, dateTo })
      })

      expect(result.current.filteredAssessments).toHaveLength(2)
    })

    it('filters assessments by search term', async () => {
      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      act(() => {
        result.current.setFilters({ search: 'disc' })
      })

      expect(result.current.filteredAssessments).toHaveLength(1)
      expect(result.current.filteredAssessments[0].type).toBe('disc')
    })

    it('combines multiple filters correctly', async () => {
      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      act(() => {
        result.current.setFilters({ 
          status: 'completed',
          search: 'soft'
        })
      })

      expect(result.current.filteredAssessments).toHaveLength(1)
      expect(result.current.filteredAssessments[0].type).toBe('soft_skills')
    })

    it('resets filters correctly', async () => {
      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Apply filters
      act(() => {
        result.current.setFilters({ type: 'disc', status: 'completed' })
      })

      // Reset filters
      act(() => {
        result.current.resetFilters()
      })

      expect(result.current.filters).toEqual({
        type: '',
        status: '',
        dateFrom: null,
        dateTo: null,
        search: ''
      })
      expect(result.current.filteredAssessments).toHaveLength(3)
    })
  })

  describe('Pagination', () => {
    it('calculates pagination correctly', async () => {
      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.pagination.total).toBe(3)
      expect(result.current.pagination.totalPages).toBe(1) // 3 items with limit 20
    })

    it('changes page correctly', async () => {
      // Mock more data to test pagination
      const manyAssessments = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        type: 'disc' as const,
        status: 'completed' as const,
        created_at: `2025-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        updated_at: `2025-01-${String(i + 1).padStart(2, '0')}T10:30:00Z`
      }))

      mockListAssessments.mockResolvedValueOnce({
        data: manyAssessments,
        count: manyAssessments.length
      })

      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.pagination.totalPages).toBe(2) // 25 items with limit 20

      act(() => {
        result.current.setPage(2)
      })

      expect(result.current.pagination.page).toBe(2)
      expect(result.current.assessments).toHaveLength(5) // Remaining items on page 2
    })

    it('resets to page 1 when filters change', async () => {
      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Go to page 2
      act(() => {
        result.current.setPage(2)
      })

      // Apply filter (should reset to page 1)
      act(() => {
        result.current.setFilters({ type: 'disc' })
      })

      expect(result.current.pagination.page).toBe(1)
    })
  })

  describe('Statistics', () => {
    it('calculates statistics correctly', async () => {
      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.stats.totalCompleted).toBe(2)
      expect(result.current.stats.totalInProgress).toBe(1)
      expect(result.current.stats.lastAssessmentDate).toEqual(new Date('2025-01-25T14:30:00Z'))
    })

    it('calculates average completion time', async () => {
      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Should calculate average of 45min and 30min = 37.5min = 2250000ms
      expect(result.current.stats.averageCompletionTime).toBe(2250000)
    })

    it('handles no completed assessments for average time', async () => {
      const inProgressAssessments = [
        {
          id: '1',
          type: 'disc' as const,
          status: 'in_progress' as const,
          created_at: '2025-01-25T14:00:00Z',
          updated_at: '2025-01-25T14:30:00Z'
        }
      ]

      mockListAssessments.mockResolvedValueOnce({
        data: inProgressAssessments,
        count: 1
      })

      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.stats.averageCompletionTime).toBe(null)
    })
  })

  describe('Refresh', () => {
    it('refetches data when refresh is called', async () => {
      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Clear the mock to track new calls
      mockListAssessments.mockClear()

      await act(async () => {
        await result.current.refresh()
      })

      expect(mockListAssessments).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Recovery', () => {
    it('clears error when successful fetch occurs after error', async () => {
      // First call fails
      mockListAssessments
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: mockAssessmentsData,
          count: mockAssessmentsData.length
        })

      const { result } = renderHook(() => useAssessmentHistory('user-123'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.error).toBeInstanceOf(Error)

      // Retry should clear error
      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.error).toBe(null)
      expect(result.current.assessments).toHaveLength(3)
    })
  })
})
