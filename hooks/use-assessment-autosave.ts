import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import type { DiscResults, SoftSkillsResults, SjtResults } from '@/lib/supabase/types'

interface AssessmentProgress {
  assessmentId?: string
  type: 'complete' | 'disc' | 'soft_skills' | 'sjt'
  disc_results?: DiscResults | null
  soft_skills_results?: SoftSkillsResults | null
  sjt_results?: SjtResults | null
  currentStep?: number
  answers?: any
}

interface UseAssessmentAutoSaveOptions {
  assessmentType: 'complete' | 'disc' | 'soft_skills' | 'sjt'
  debounceMs?: number
  enableLocalBackup?: boolean
}

interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
  assessmentId: string | null
}

export function useAssessmentAutoSave({
  assessmentType,
  debounceMs = 500,
  enableLocalBackup = true
}: UseAssessmentAutoSaveOptions) {
  const auth = useAuth()
  const user = auth.user
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    error: null,
    assessmentId: null
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveRef = useRef<AssessmentProgress | null>(null)

  // Local storage backup key
  const localStorageKey = `assessment_backup_${assessmentType}_${user?.id || 'anonymous'}`

  // Função para salvar no localStorage como backup
  const saveToLocalStorage = useCallback((progress: AssessmentProgress) => {
    if (!enableLocalBackup) return
    
    try {
      const backup = {
        ...progress,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(localStorageKey, JSON.stringify(backup))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }, [localStorageKey, enableLocalBackup])

  // Função para carregar do localStorage
  const loadFromLocalStorage = useCallback((): AssessmentProgress | null => {
    if (!enableLocalBackup) return null
    
    try {
      const backup = localStorage.getItem(localStorageKey)
      if (backup) {
        const parsed = JSON.parse(backup)
        // Verificar se o backup não é muito antigo (24h)
        const backupTime = new Date(parsed.timestamp)
        const now = new Date()
        const hoursDiff = (now.getTime() - backupTime.getTime()) / (1000 * 60 * 60)
        
        if (hoursDiff < 24) {
          return parsed
        } else {
          // Remover backup antigo
          localStorage.removeItem(localStorageKey)
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
    }
    return null
  }, [localStorageKey, enableLocalBackup])

  // Função para limpar backup local
  const clearLocalBackup = useCallback(() => {
    if (!enableLocalBackup) return
    try {
      localStorage.removeItem(localStorageKey)
    } catch (error) {
      console.warn('Failed to clear localStorage backup:', error)
    }
  }, [localStorageKey, enableLocalBackup])

  // Função principal de auto-save
  const performAutoSave = useCallback(async (progress: AssessmentProgress) => {
    if (!user) {
      console.warn('User not authenticated, skipping auto-save')
      return
    }

    // Evitar salvamentos duplicados
    if (lastSaveRef.current && JSON.stringify(lastSaveRef.current) === JSON.stringify(progress)) {
      return
    }

    setAutoSaveState(prev => ({ ...prev, isSaving: true, error: null }))

    try {
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: progress.assessmentId,
          type: progress.type,
          status: 'in_progress',
          disc_results: progress.disc_results,
          soft_skills_results: progress.soft_skills_results,
          sjt_results: progress.sjt_results
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        assessmentId: result.id,
        error: null
      }))

      lastSaveRef.current = { ...progress, assessmentId: result.id }

      // Salvar backup local após sucesso
      saveToLocalStorage({ ...progress, assessmentId: result.id })

    } catch (error) {
      console.error('Auto-save failed:', error)
      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))

      // Salvar backup local em caso de falha
      saveToLocalStorage(progress)
    }
  }, [user, saveToLocalStorage])

  // Função debounced para auto-save
  const debouncedAutoSave = useCallback((progress: AssessmentProgress) => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Configurar novo timeout
    timeoutRef.current = setTimeout(() => {
      performAutoSave(progress)
    }, debounceMs)
  }, [performAutoSave, debounceMs])

  // Função para salvar imediatamente (sem debounce)
  const saveImmediately = useCallback((progress: AssessmentProgress) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    return performAutoSave(progress)
  }, [performAutoSave])

  // Função para salvar progresso de respostas intermediárias
  const saveProgress = useCallback((answers: any, currentStep?: number, results?: any) => {
    const progress: AssessmentProgress = {
      assessmentId: autoSaveState.assessmentId || undefined,
      type: assessmentType,
      answers,
      currentStep,
      ...results
    }

    debouncedAutoSave(progress)
  }, [assessmentType, autoSaveState.assessmentId, debouncedAutoSave])

  // Função para salvar resultados finais
  const saveFinalResults = useCallback(async (results: {
    disc_results?: DiscResults
    soft_skills_results?: SoftSkillsResults  
    sjt_results?: SjtResults
  }) => {
    const progress: AssessmentProgress = {
      assessmentId: autoSaveState.assessmentId || undefined,
      type: assessmentType,
      disc_results: results.disc_results || null,
      soft_skills_results: results.soft_skills_results || null,
      sjt_results: results.sjt_results || null
    }

    await saveImmediately(progress)
  }, [assessmentType, autoSaveState.assessmentId, saveImmediately])

  // Função para marcar avaliação como completa
  const completeAssessment = useCallback(async () => {
    if (!autoSaveState.assessmentId) {
      throw new Error('No assessment ID available')
    }

    try {
      const response = await fetch(`/api/assessment/${autoSaveState.assessmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'complete' })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Limpar backup local após conclusão
      clearLocalBackup()

      return await response.json()
    } catch (error) {
      console.error('Failed to complete assessment:', error)
      throw error
    }
  }, [autoSaveState.assessmentId, clearLocalBackup])

  // Função para carregar avaliação incompleta
  const loadIncompleteAssessment = useCallback(async () => {
    try {
      const response = await fetch('/api/assessment')
      if (response.status === 404) {
        return null // Nenhuma avaliação incompleta encontrada
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const assessment = await response.json()
      
      setAutoSaveState(prev => ({
        ...prev,
        assessmentId: assessment.id
      }))

      return assessment
    } catch (error) {
      console.error('Failed to load incomplete assessment:', error)
      // Em caso de erro, tentar carregar do localStorage
      return loadFromLocalStorage()
    }
  }, [loadFromLocalStorage])

  // Cleanup na desmontagem do componente
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    // Estado
    ...autoSaveState,
    
    // Funções
    saveProgress,
    saveFinalResults,
    completeAssessment,
    loadIncompleteAssessment,
    loadFromLocalStorage,
    clearLocalBackup,
    
    // Status de salvamento legível
    saveStatus: autoSaveState.isSaving ? 'Salvando...' : 
                autoSaveState.error ? 'Erro ao salvar' :
                autoSaveState.lastSaved ? 'Salvo automaticamente' : 
                'Não salvo'
  }
} 