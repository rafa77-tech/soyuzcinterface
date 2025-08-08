import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  AssessmentData, 
  DiscResults, 
  SoftSkillsResults, 
  SjtResults 
} from '../lib/services/assessment-service'

export interface AutoSaveState {
  assessmentId: string | null
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
}

export interface AutoSaveOptions {
  assessmentType: 'complete' | 'disc' | 'soft_skills' | 'sjt'
  debounceMs?: number
  enableLocalStorage?: boolean
}

export interface SaveData {
  type: 'complete' | 'disc' | 'soft_skills' | 'sjt'
  status?: 'in_progress' | 'completed'
  disc_results?: DiscResults
  soft_skills_results?: SoftSkillsResults
  sjt_results?: SjtResults
  progress_data?: Record<string, unknown>
}

export function useAssessmentAutoSave(options: AutoSaveOptions) {
  const { assessmentType, debounceMs = 500, enableLocalStorage = true } = options
  
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    assessmentId: null,
    isSaving: false,
    lastSaved: null,
    error: null
  })

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveDataRef = useRef<string>('')
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load existing assessment ID from localStorage on mount
  useEffect(() => {
    if (enableLocalStorage) {
      const storageKey = `assessment_autosave_${assessmentType}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          const { assessmentId, lastSaved } = JSON.parse(saved)
          if (assessmentId) {
            setAutoSaveState(prev => ({
              ...prev,
              assessmentId,
              lastSaved: lastSaved ? new Date(lastSaved) : null
            }))
          }
        } catch (error) {
          console.warn('Failed to load autosave data from localStorage:', error)
          localStorage.removeItem(storageKey)
        }
      }
    }
  }, [assessmentType, enableLocalStorage])

  // Save to localStorage
  const saveToLocalStorage = useCallback((data: SaveData, assessmentId?: string) => {
    if (!enableLocalStorage) return

    const storageKey = `assessment_autosave_${assessmentType}`
    const backupData = {
      assessmentId: assessmentId || autoSaveState.assessmentId,
      lastSaved: new Date().toISOString(),
      data
    }
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(backupData))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }, [assessmentType, enableLocalStorage, autoSaveState.assessmentId])

  // Clear localStorage
  const clearLocalStorage = useCallback(() => {
    if (!enableLocalStorage) return
    
    const storageKey = `assessment_autosave_${assessmentType}`
    localStorage.removeItem(storageKey)
  }, [assessmentType, enableLocalStorage])

  // Retry logic with exponential backoff
  const executeWithRetry = useCallback(async (
    fn: () => Promise<AssessmentData>,
    retryCount = 0
  ): Promise<AssessmentData> => {
    const maxRetries = 3
    const delays = [1000, 2000, 4000] // 1s, 2s, 4s
    
    try {
      return await fn()
    } catch (error) {
      console.error(`Save attempt ${retryCount + 1} failed:`, error)
      
      if (retryCount < maxRetries) {
        setAutoSaveState(prev => ({
          ...prev,
          error: `⚠️ Erro ao salvar - tentando novamente (${retryCount + 1}/${maxRetries})`
        }))
        
        return new Promise((resolve, reject) => {
          retryTimeoutRef.current = setTimeout(() => {
            executeWithRetry(fn, retryCount + 1)
              .then(resolve)
              .catch(reject)
          }, delays[retryCount])
        })
      } else {
        throw error
      }
    }
  }, [])

  // Actual save function
  const performSave = useCallback(async (data: SaveData): Promise<AssessmentData> => {
    setAutoSaveState(prev => ({ ...prev, isSaving: true, error: null }))
    
    try {
      // Save to localStorage immediately as backup
      saveToLocalStorage(data)

      const savePayload = {
        ...data,
        type: assessmentType
      }

      // Make API call
      const response = await executeWithRetry(async () => {
        const url = autoSaveState.assessmentId 
          ? `/api/assessment`
          : `/api/assessment`
        
        const method = 'POST'
        const body = autoSaveState.assessmentId
          ? { ...savePayload, id: autoSaveState.assessmentId }
          : savePayload

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${res.status}`)
        }

        return res.json()
      })

      const savedAssessment = response.data
      const now = new Date()

      setAutoSaveState(prev => ({
        ...prev,
        assessmentId: savedAssessment.id,
        isSaving: false,
        lastSaved: now,
        error: null
      }))

      // Update localStorage with new assessment ID
      saveToLocalStorage(data, savedAssessment.id)

      return savedAssessment

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        error: `⚠️ Erro ao salvar: ${errorMessage}. Dados salvos localmente.`
      }))

      throw error
    }
  }, [assessmentType, autoSaveState.assessmentId, saveToLocalStorage, executeWithRetry])

  // Debounced save function
  const debouncedSave = useCallback((data: SaveData) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Check if data has actually changed to prevent duplicate saves
    const dataString = JSON.stringify(data)
    if (dataString === lastSaveDataRef.current) {
      return
    }
    lastSaveDataRef.current = dataString

    // Set loading state immediately for user feedback
    setAutoSaveState(prev => ({ ...prev, isSaving: true, error: null }))

    // Debounce the actual save
    debounceTimeoutRef.current = setTimeout(() => {
      performSave(data).catch(error => {
        console.error('Auto-save failed:', error)
      })
    }, debounceMs)
  }, [debounceMs, performSave])

  // Manual save (bypasses debouncing)
  const saveNow = useCallback(async (data: SaveData): Promise<AssessmentData> => {
    // Clear any pending debounced save
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }

    return performSave(data)
  }, [performSave])

  // Complete assessment
  const completeAssessment = useCallback(async (finalData: SaveData): Promise<AssessmentData> => {
    const completedData = {
      ...finalData,
      status: 'completed' as const
    }
    
    const result = await saveNow(completedData)
    
    // Clear localStorage on successful completion
    clearLocalStorage()
    
    return result
  }, [saveNow, clearLocalStorage])

  // Manual retry for failed saves
  const retryManual = useCallback(async () => {
    if (!enableLocalStorage) return
    
    const storageKey = `assessment_autosave_${assessmentType}`
    const saved = localStorage.getItem(storageKey)
    
    if (saved) {
      try {
        const { data } = JSON.parse(saved)
        await performSave(data)
      } catch (error) {
        console.error('Manual retry failed:', error)
      }
    }
  }, [assessmentType, enableLocalStorage, performSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  return {
    autoSaveState,
    debouncedSave,
    saveNow,
    completeAssessment,
    retryManual,
    clearLocalStorage
  }
}