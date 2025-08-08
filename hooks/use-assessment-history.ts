'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import type { Assessment } from '@/lib/supabase/types'
import { AssessmentListResponse } from '@/lib/services/assessment-service'

export interface UseAssessmentHistoryOptions {
  initialPage?: number
  pageSize?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface AssessmentHistoryState {
  assessments: Pick<Assessment, 'id' | 'type' | 'status' | 'created_at' | 'completed_at'>[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export interface AssessmentFilters {
  type?: 'complete' | 'disc' | 'soft_skills' | 'sjt'
  status?: 'completed' | 'in_progress' 
  dateFrom?: Date
  dateTo?: Date
  search?: string
}

export function useAssessmentHistory(options: UseAssessmentHistoryOptions = {}) {
  const {
    initialPage = 1,
    pageSize = 20,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options

  const { user } = useAuth()
  
  const [state, setState] = useState<AssessmentHistoryState>({
    assessments: [],
    pagination: {
      total: 0,
      page: initialPage,
      limit: pageSize,
      totalPages: 0
    },
    loading: false,
    error: null,
    lastUpdated: null
  })

  const [filters, setFilters] = useState<AssessmentFilters>({})

  /**
   * Fetch assessments from API with current filters and pagination
   */
  const fetchAssessments = useCallback(async (page?: number) => {
    if (!user) {
      setState(prev => ({
        ...prev,
        error: 'User not authenticated',
        loading: false
      }))
      return
    }

    const targetPage = page ?? state.pagination.page
    const currentLimit = pageSize // Use the stable pageSize instead of state.pagination.limit

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null 
    }))

    try {
      const url = new URL('/api/assessments', window.location.origin)
      url.searchParams.set('page', targetPage.toString())
      url.searchParams.set('limit', currentLimit.toString())

      // Add filters to query string
      if (filters.type) {
        url.searchParams.set('type', filters.type)
      }
      if (filters.status) {
        url.searchParams.set('status', filters.status)
      }
      if (filters.dateFrom) {
        url.searchParams.set('dateFrom', filters.dateFrom.toISOString())
      }
      if (filters.dateTo) {
        url.searchParams.set('dateTo', filters.dateTo.toISOString())
      }
      if (filters.search) {
        url.searchParams.set('search', filters.search)
      }

      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch assessments`)
      }

      const data: AssessmentListResponse = await response.json()

      setState(prev => ({
        ...prev,
        assessments: data.assessments,
        pagination: {
          ...data.pagination,
          page: targetPage,
          totalPages: Math.ceil(data.pagination.total / data.pagination.limit)
        },
        loading: false,
        lastUpdated: new Date()
      }))

    } catch (error) {
      // Remove console.error for production - errors should be handled by UI
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        loading: false
      }))
    }
  }, [user, state.pagination.page, pageSize, filters])

  /**
   * Navigate to specific page
   */
  const goToPage = useCallback((page: number) => {
    if (page < 1 || (state.pagination.totalPages > 0 && page > state.pagination.totalPages)) return
    
    // Update page in state immediately to prevent race conditions
    setState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        page: page
      },
      loading: true,
      error: null
    }))
    
    fetchAssessments(page)
  }, [fetchAssessments, state.pagination.totalPages])

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (state.pagination.page < state.pagination.totalPages) {
      goToPage(state.pagination.page + 1)
    }
  }, [goToPage, state.pagination.page, state.pagination.totalPages])

  /**
   * Go to previous page
   */
  const previousPage = useCallback(() => {
    if (state.pagination.page > 1) {
      goToPage(state.pagination.page - 1)
    }
  }, [goToPage, state.pagination.page])

  /**
   * Update filters and refresh data
   */
  const updateFilters = useCallback((newFilters: Partial<AssessmentFilters>) => {
    setFilters(prev => {
      const updatedFilters = { ...prev, ...newFilters }
      // Trigger fetch with new filters immediately by using a ref or callback
      setTimeout(() => {
        const url = new URL('/api/assessments', window.location.origin)
        url.searchParams.set('page', '1')
        url.searchParams.set('limit', pageSize.toString())

        // Add filters to query string
        if (updatedFilters.type) {
          url.searchParams.set('type', updatedFilters.type)
        }
        if (updatedFilters.status) {
          url.searchParams.set('status', updatedFilters.status)
        }
        if (updatedFilters.dateFrom) {
          url.searchParams.set('dateFrom', updatedFilters.dateFrom.toISOString())
        }
        if (updatedFilters.dateTo) {
          url.searchParams.set('dateTo', updatedFilters.dateTo.toISOString())
        }
        if (updatedFilters.search) {
          url.searchParams.set('search', updatedFilters.search)
        }

        if (user) {
          setState(prev => ({ ...prev, loading: true, error: null }))
          
          fetch(url.toString())
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch assessments`)
              }
              return response.json()
            })
            .then((data: AssessmentListResponse) => {
              setState(prev => ({
                ...prev,
                assessments: data.assessments,
                pagination: {
                  ...data.pagination,
                  page: 1,
                  totalPages: Math.ceil(data.pagination.total / data.pagination.limit)
                },
                loading: false,
                lastUpdated: new Date()
              }))
            })
            .catch(error => {
              setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                loading: false
              }))
            })
        }
      }, 0)
      
      return updatedFilters
    })
  }, [user, pageSize])

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({})
    fetchAssessments(1)
  }, [fetchAssessments])

  /**
   * Refresh current page
   */
  const refresh = useCallback(() => {
    fetchAssessments()
  }, [fetchAssessments])

  /**
   * Get a specific assessment by ID
   */
  const getAssessment = useCallback(async (assessmentId: string): Promise<Assessment | null> => {
    if (!user) return null

    try {
      const response = await fetch(`/api/assessment/${assessmentId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch assessment`)
      }

      return await response.json()
    } catch (error) {
      // Remove console.error for production - errors should be handled by UI
      return null
    }
  }, [user])

  /**
   * Filter assessments client-side (for real-time filtering without API calls)
   */
  const getFilteredAssessments = useCallback((clientFilters?: AssessmentFilters) => {
    const activeFilters = clientFilters || filters
    
    return state.assessments.filter(assessment => {
      // Type filter
      if (activeFilters.type && assessment.type !== activeFilters.type) {
        return false
      }

      // Status filter
      if (activeFilters.status && assessment.status !== activeFilters.status) {
        return false
      }

      // Date range filter
      if (activeFilters.dateFrom || activeFilters.dateTo) {
        const assessmentDate = new Date(assessment.created_at)
        
        if (activeFilters.dateFrom) {
          const fromDate = new Date(activeFilters.dateFrom)
          fromDate.setHours(0, 0, 0, 0) // Start of day
          if (assessmentDate < fromDate) {
            return false
          }
        }
        
        if (activeFilters.dateTo) {
          const toDate = new Date(activeFilters.dateTo)
          toDate.setHours(23, 59, 59, 999) // End of day
          if (assessmentDate > toDate) {
            return false
          }
        }
      }

      // Search filter (searches in type)
      if (activeFilters.search) {
        const searchTerm = activeFilters.search.toLowerCase()
        const typeLabel = assessment.type.toLowerCase()
        if (!typeLabel.includes(searchTerm)) {
          return false
        }
      }

      return true
    })
  }, [state.assessments, filters])

  /**
   * Get summary statistics
   */
  const getSummary = useCallback(() => {
    const total = state.assessments.length
    const completed = state.assessments.filter(a => a.status === 'completed').length
    const inProgress = state.assessments.filter(a => a.status === 'in_progress').length
    
    // Calculate average completion time for completed assessments
    const completedAssessments = state.assessments.filter(a => a.completed_at)
    const avgCompletionTime = completedAssessments.length > 0
      ? completedAssessments.reduce((sum, assessment) => {
          const start = new Date(assessment.created_at)
          const end = new Date(assessment.completed_at!)
          return sum + (end.getTime() - start.getTime())
        }, 0) / completedAssessments.length
      : 0

    const avgMinutes = Math.round(avgCompletionTime / (1000 * 60))

    return {
      total,
      completed,
      inProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      averageCompletionTimeMinutes: avgMinutes
    }
  }, [state.assessments])

  // Auto-refresh setup (commented out for now, can be enabled if needed)
  // useEffect(() => {
  //   if (autoRefresh && user) {
  //     const interval = setInterval(refresh, refreshInterval)
  //     return () => clearInterval(interval)
  //   }
  // }, [autoRefresh, user, refresh, refreshInterval])

  return {
    // State
    ...state,
    filters,
    
    // Actions
    fetchAssessments,
    refresh,
    updateFilters,
    clearFilters,
    getAssessment,
    getFilteredAssessments,
    getSummary,
    
    // Pagination
    goToPage,
    nextPage,
    previousPage,
    hasNextPage: state.pagination.page < state.pagination.totalPages,
    hasPreviousPage: state.pagination.page > 1,
    
    // Computed values
    isEmpty: state.assessments.length === 0,
    isFirstPage: state.pagination.page === 1,
    isLastPage: state.pagination.totalPages === 0 || state.pagination.page === state.pagination.totalPages
  }
} 