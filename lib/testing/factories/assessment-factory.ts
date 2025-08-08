// Assessment Mock Factory
// Provides deterministic, realistic test data for assessment-related tests

import type { AssessmentData } from '@/lib/services/assessment-service'

/**
 * Creates a single mock assessment with realistic data
 * @param overrides - Partial assessment data to override defaults
 * @returns Complete mock assessment object
 */
export const createMockAssessment = (overrides: Partial<AssessmentData> = {}): AssessmentData => ({
  id: 'mock-assessment-1',
  user_id: 'mock-user-123',
  type: 'disc',
  status: 'completed',
  created_at: '2025-01-20T10:00:00Z',
  updated_at: '2025-01-20T10:45:00Z',
  completed_at: '2025-01-20T10:45:00Z',
  disc_results: {
    D: 25,
    I: 15, 
    S: 20,
    C: 10,
    responses: {
      'q1': 'Tomo decisões rapidamente',
      'q2': 'Gosto de trabalhar em equipe'
    }
  },
  soft_skills_results: null,
  sjt_results: null,
  progress_data: null,
  ...overrides
})

/**
 * Creates a list of mock assessments with varied data
 * @param count - Number of assessments to create
 * @param baseOverrides - Common overrides applied to all assessments
 * @returns Array of mock assessments
 */
export const createMockAssessmentList = (
  count = 3, 
  baseOverrides: Partial<AssessmentData> = {}
): AssessmentData[] => {
  const assessmentTypes: Array<'disc' | 'soft_skills' | 'sjt' | 'complete'> = ['disc', 'soft_skills', 'sjt', 'complete']
  const statuses: Array<'completed' | 'in_progress' | 'abandoned'> = ['completed', 'in_progress', 'abandoned']
  
  return Array.from({ length: count }, (_, index) => {
    const type = assessmentTypes[index % assessmentTypes.length]
    const status = index === 0 ? 'completed' : statuses[index % statuses.length]
    const isCompleted = status === 'completed'
    
    // Create realistic timestamps
    const createdDate = new Date('2025-01-20T10:00:00Z')
    createdDate.setDate(createdDate.getDate() + index)
    const updatedDate = new Date(createdDate)
    updatedDate.setMinutes(updatedDate.getMinutes() + 30 + (index * 15)) // Realistic completion times
    
    return createMockAssessment({
      id: `mock-assessment-${index + 1}`,
      type,
      status,
      created_at: createdDate.toISOString(),
      updated_at: updatedDate.toISOString(),
      completed_at: isCompleted ? updatedDate.toISOString() : null,
      ...getResultsForType(type, isCompleted),
      ...baseOverrides
    })
  })
}

/**
 * Creates realistic results based on assessment type
 */
function getResultsForType(type: string, isCompleted: boolean) {
  if (!isCompleted) {
    return {
      disc_results: null,
      soft_skills_results: null,
      sjt_results: null,
      progress_data: { currentStep: 2, totalSteps: 5 }
    }
  }

  switch (type) {
    case 'disc':
      return {
        disc_results: {
          D: Math.floor(Math.random() * 30) + 10, // 10-40 range
          I: Math.floor(Math.random() * 30) + 10,
          S: Math.floor(Math.random() * 30) + 10,
          C: Math.floor(Math.random() * 30) + 10,
          responses: {
            'q1': 'Tomo decisões rapidamente',
            'q2': 'Prefiro trabalhar independentemente'
          }
        },
        soft_skills_results: null,
        sjt_results: null
      }
    
    case 'soft_skills':
      return {
        disc_results: null,
        soft_skills_results: {
          comunicacao: Math.floor(Math.random() * 40) + 60, // 60-100 range
          lideranca: Math.floor(Math.random() * 40) + 60,
          trabalhoEmEquipe: Math.floor(Math.random() * 40) + 60,
          resolucaoProblemas: Math.floor(Math.random() * 40) + 60,
          adaptabilidade: Math.floor(Math.random() * 40) + 60
        },
        sjt_results: null
      }
    
    case 'sjt':
      return {
        disc_results: null,
        soft_skills_results: null,
        sjt_results: {
          responses: [1, 3, 2, 4, 1], // Realistic response pattern
          scores: [0.8, 0.6, 0.9, 0.7, 0.85] // Corresponding scores
        }
      }
    
    case 'complete':
      return {
        disc_results: {
          D: 28,
          I: 22,
          S: 18,
          C: 32,
          responses: {
            'q1': 'Sou orientado a resultados',
            'q2': 'Gosto de analisar dados'
          }
        },
        soft_skills_results: {
          comunicacao: 85,
          lideranca: 78,
          trabalhoEmEquipe: 92,
          resolucaoProblemas: 88,
          adaptabilidade: 75
        },
        sjt_results: {
          responses: [2, 1, 4, 3, 2],
          scores: [0.9, 0.85, 0.7, 0.8, 0.95]
        }
      }
    
    default:
      return {
        disc_results: null,
        soft_skills_results: null,
        sjt_results: null
      }
  }
}

/**
 * Predefined scenarios for common test cases
 */
export const mockAssessmentScenarios = {
  /**
   * Empty state - no assessments
   */
  empty: (): AssessmentData[] => [],
  
  /**
   * Single completed DISC assessment
   */
  singleCompleted: (): AssessmentData[] => [
    createMockAssessment({
      id: 'completed-disc-1',
      type: 'disc',
      status: 'completed',
      disc_results: {
        D: 35,
        I: 15,
        S: 25,
        C: 25,
        responses: {
          'q1': 'Sou assertivo e direto',
          'q2': 'Gosto de liderar projetos'
        }
      }
    })
  ],
  
  /**
   * Mixed status assessments for testing filters
   */
  mixedStatus: (): AssessmentData[] => [
    createMockAssessment({
      id: 'completed-1',
      status: 'completed',
      type: 'disc'
    }),
    createMockAssessment({
      id: 'in-progress-1', 
      status: 'in_progress',
      type: 'soft_skills',
      completed_at: null,
      progress_data: { currentStep: 3, totalSteps: 5 }
    }),
    createMockAssessment({
      id: 'abandoned-1',
      status: 'abandoned', 
      type: 'sjt',
      completed_at: null
    })
  ],
  
  /**
   * Large dataset for testing pagination
   */
  largeDdataset: (count = 25): AssessmentData[] => 
    createMockAssessmentList(count),
  
  /**
   * Recent assessments for date filtering tests
   */
  recentAssessments: (): AssessmentData[] => {
    const now = new Date()
    return [
      createMockAssessment({
        id: 'today-1',
        created_at: now.toISOString(),
        type: 'disc'
      }),
      createMockAssessment({
        id: 'yesterday-1',
        created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        type: 'soft_skills'
      }),
      createMockAssessment({
        id: 'last-week-1',
        created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'sjt'
      })
    ]
  }
}

/**
 * Creates mock API response for assessment listing
 */
export const createMockAssessmentListResponse = (
  assessments: AssessmentData[],
  overrides: { page?: number; limit?: number; total?: number } = {}
) => ({
  data: assessments,
  count: overrides.total || assessments.length,
  page: overrides.page || 1,
  limit: overrides.limit || 20,
  totalPages: Math.ceil((overrides.total || assessments.length) / (overrides.limit || 20))
})

/**
 * Creates mock hook return value for useAssessmentHistory
 */
export const createMockAssessmentHistoryReturn = (
  assessments: AssessmentData[] = mockAssessmentScenarios.mixedStatus(),
  overrides = {}
) => {
  const completed = assessments.filter(a => a.status === 'completed')
  const inProgress = assessments.filter(a => a.status === 'in_progress')
  
  return {
    assessments,
    filteredAssessments: assessments,
    allAssessments: assessments,
    filters: {
      type: '',
      status: '',
      dateFrom: null,
      dateTo: null,
      search: ''
    },
    pagination: {
      page: 1,
      limit: 20,
      total: assessments.length,
      totalPages: Math.ceil(assessments.length / 20)
    },
    isLoading: false,
    error: null,
    setFilters: jest.fn(),
    resetFilters: jest.fn(),
    setPage: jest.fn(),
    refresh: jest.fn(),
    stats: {
      totalCompleted: completed.length,
      totalInProgress: inProgress.length,
      averageCompletionTime: completed.length > 0 ? 2700000 : null, // 45 minutes
      lastAssessmentDate: assessments.length > 0 
        ? new Date(assessments[0].created_at) 
        : null
    },
    ...overrides
  }
}
