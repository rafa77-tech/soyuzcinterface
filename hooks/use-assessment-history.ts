'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { assessmentService, type AssessmentData } from '@/lib/services/assessment-service'

export interface AssessmentFilters {
  type?: 'complete' | 'disc' | 'soft_skills' | 'sjt' | ''
  status?: 'in_progress' | 'completed' | ''
  dateFrom?: Date | null
  dateTo?: Date | null
  search?: string
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UseAssessmentHistoryResult {
  assessments: AssessmentData[]
  filteredAssessments: AssessmentData[]
  allAssessments: AssessmentData[]
  filters: AssessmentFilters
  pagination: PaginationState
  isLoading: boolean
  error: Error | null
  
  // Actions
  setFilters: (filters: Partial<AssessmentFilters>) => void
  resetFilters: () => void
  setPage: (page: number) => void
  refresh: () => Promise<void>
  
  // Statistics
  stats: {
    totalCompleted: number
    totalInProgress: number
    averageCompletionTime: number | null
    lastAssessmentDate: Date | null
  }
}

const DEFAULT_FILTERS: AssessmentFilters = {
  type: '',
  status: '',
  dateFrom: null,
  dateTo: null,
  search: ''
}

const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
}

export function useAssessmentHistory(userId: string | null): UseAssessmentHistoryResult {
  const [assessments, setAssessments] = useState<AssessmentData[]>([])
  const [filters, setFiltersState] = useState<AssessmentFilters>(DEFAULT_FILTERS)
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Memoized filtered assessments based on client-side filtering
  const filteredAssessments = useMemo(() => {
    let filtered = assessments

    // Type filter
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(assessment => assessment.type === filters.type)
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(assessment => assessment.status === filters.status)
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(assessment => 
        new Date(assessment.created_at!) >= filters.dateFrom!
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(assessment => 
        new Date(assessment.created_at!) <= filters.dateTo!
      )
    }

    // Search filter
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(assessment => 
        assessment.type.toLowerCase().includes(searchTerm) ||
        assessment.status.toLowerCase().includes(searchTerm)
      )
    }

    return filtered
  }, [assessments, filters])

  // Paginated assessments
  const paginatedAssessments = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit
    const end = start + pagination.limit
    return filteredAssessments.slice(start, end)
  }, [filteredAssessments, pagination.page, pagination.limit])

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCompleted = assessments.filter(a => a.status === 'completed').length
    const totalInProgress = assessments.filter(a => a.status === 'in_progress').length
    
    // Calculate average completion time for completed assessments
    const completedAssessments = assessments.filter(a => 
      a.status === 'completed' && a.created_at && a.completed_at
    )
    
    let averageCompletionTime: number | null = null
    if (completedAssessments.length > 0) {
      const totalTime = completedAssessments.reduce((acc, assessment) => {
        const start = new Date(assessment.created_at!).getTime()
        const end = new Date(assessment.completed_at!).getTime()
        return acc + (end - start)
      }, 0)
      averageCompletionTime = totalTime / completedAssessments.length
    }

    // Get last assessment date
    const lastAssessmentDate = assessments.length > 0 
      ? new Date(assessments[0].updated_at!) 
      : null

    return {
      totalCompleted,
      totalInProgress,
      averageCompletionTime,
      lastAssessmentDate
    }
  }, [assessments])

  // Fetch assessments
  const fetchAssessments = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch all assessments without server-side filtering
      // We'll do client-side filtering for better UX
      const result = await assessmentService.listAssessments({
        userId,
        page: 1,
        limit: 1000 // Get all assessments for client-side filtering
      })

      setAssessments(result.data)
      
      // Update pagination based on filtered results
      const totalFiltered = filteredAssessments.length
      setPagination(prev => ({
        ...prev,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / prev.limit)
      }))

    } catch (err) {
      setError(err as Error)
      console.error('Error fetching assessment history:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId, filteredAssessments.length])

  // Update pagination when filtered assessments change
  useEffect(() => {
    const totalFiltered = filteredAssessments.length
    setPagination(prev => ({
      ...prev,
      total: totalFiltered,
      totalPages: Math.ceil(totalFiltered / prev.limit),
      page: Math.min(prev.page, Math.max(1, Math.ceil(totalFiltered / prev.limit)))
    }))
  }, [filteredAssessments.length, pagination.limit])

  // Initial fetch
  useEffect(() => {
    fetchAssessments()
  }, [fetchAssessments])

  // Actions
  const setFilters = useCallback((newFilters: Partial<AssessmentFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when filtering
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const refresh = useCallback(async () => {
    await fetchAssessments()
  }, [fetchAssessments])

  return {
    assessments: paginatedAssessments,
    filteredAssessments,
    allAssessments: assessments,
    filters,
    pagination,
    isLoading,
    error,
    setFilters,
    resetFilters,
    setPage,
    refresh,
    stats
  }
}
