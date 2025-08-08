import { AssessmentPersistenceService } from '../assessment-service'

// Mock Supabase
jest.mock('../../supabase/client', () => ({
  supabase: {
    from: jest.fn()
  }
}))

describe('AssessmentPersistenceService', () => {
  let service: AssessmentPersistenceService

  beforeEach(() => {
    service = new AssessmentPersistenceService()
  })

  it('should create service instance', () => {
    expect(service).toBeInstanceOf(AssessmentPersistenceService)
  })
})