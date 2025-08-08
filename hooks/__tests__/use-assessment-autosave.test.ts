import { renderHook } from '@testing-library/react'
import { useAssessmentAutoSave } from '../use-assessment-autosave'

global.fetch = jest.fn()

describe('useAssessmentAutoSave', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with correct state', () => {
    const { result } = renderHook(() => useAssessmentAutoSave({ 
      assessmentType: 'disc' 
    }))

    expect(result.current.autoSaveState).toEqual({
      assessmentId: null,
      isSaving: false,
      lastSaved: null,
      error: null
    })
  })
})