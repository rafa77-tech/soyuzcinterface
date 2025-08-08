// Testing Factories - Central Export
// Provides easy access to all mock factories and utilities

// Re-export all assessment-related factories
export * from './assessment-factory'
export * from './auth-factory'

// Common test utilities
export const testUtils = {
  /**
   * Waits for async operations in tests
   */
  waitForAsync: async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  },
  
  /**
   * Creates deterministic dates for testing
   */
  createTestDate: (offset = 0) => {
    const baseDate = new Date('2025-01-20T10:00:00Z')
    baseDate.setDate(baseDate.getDate() + offset)
    return baseDate
  },
  
  /**
   * Generates deterministic IDs for tests
   */
  createTestId: (prefix = 'test', index = 1) => `${prefix}-${index}`,
  
  /**
   * Creates mock API response structure
   */
  createApiResponse: <T>(data: T, success = true, error?: string) => ({
    data: success ? data : null,
    error: success ? null : error || 'Mock error',
    status: success ? 200 : 500
  })
}

/**
 * Quick access to common scenarios
 */
export const quickMocks = {
  // Auth scenarios
  loggedInUser: () => require('./auth-factory').mockUserScenarios.authenticatedDoctor(),
  loggedOutUser: () => null,
  loadingAuth: () => require('./auth-factory').authStateScenarios.loading(),
  
  // Assessment scenarios  
  emptyAssessments: () => require('./assessment-factory').mockAssessmentScenarios.empty(),
  singleAssessment: () => require('./assessment-factory').mockAssessmentScenarios.singleCompleted(),
  mixedAssessments: () => require('./assessment-factory').mockAssessmentScenarios.mixedStatus(),
  
  // API responses
  successResponse: <T>(data: T) => testUtils.createApiResponse(data, true),
  errorResponse: (error = 'Mock error') => testUtils.createApiResponse(null, false, error)
}
