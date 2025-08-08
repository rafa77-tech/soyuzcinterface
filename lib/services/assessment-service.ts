import { supabase } from '../supabase/client'
import type { 
  Assessment, 
  AssessmentInsert, 
  AssessmentUpdate,
  DiscResults,
  SoftSkillsResults,
  SjtResults 
} from '../supabase/types'

// Export types for external use
export type { DiscResults, SoftSkillsResults, SjtResults }

// Use Assessment type from Supabase types
export type AssessmentData = Assessment

export interface SaveAssessmentParams {
  assessmentData: Partial<AssessmentInsert>
  userId: string
  isUpdate?: boolean
}

export class AssessmentPersistenceService {
  private retryDelays = [1000, 2000, 4000] // Exponential backoff: 1s, 2s, 4s
  
  /**
   * Saves or updates an assessment with retry logic
   */
  async saveAssessment(params: SaveAssessmentParams): Promise<AssessmentData> {
    const { assessmentData, userId, isUpdate = false } = params
    
    // Prepare data for save with proper typing
    const dataToSave: AssessmentInsert = {
      ...assessmentData,
      user_id: userId,
      updated_at: new Date().toISOString(),
      ...(assessmentData.status === 'completed' && !assessmentData.completed_at && {
        completed_at: new Date().toISOString()
      })
    }

    return this.executeWithRetry(async () => {
      if (isUpdate && assessmentData.id) {
        // Use update type for updates
        const updateData: AssessmentUpdate = {
          ...assessmentData,
          updated_at: new Date().toISOString(),
          ...(assessmentData.status === 'completed' && !assessmentData.completed_at && {
            completed_at: new Date().toISOString()
          })
        }

        const { data, error } = await supabase
          .from('assessments')
          .update(updateData)
          .eq('id', assessmentData.id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        return data as AssessmentData
      } else {
        const { data, error } = await supabase
          .from('assessments')
          .insert(dataToSave)
          .select()
          .single()

        if (error) throw error
        return data as AssessmentData
      }
    })
  }

  /**
   * Updates assessment progress incrementally (for auto-save)
   */
  async updateAssessmentProgress(
    assessmentId: string,
    progressData: any,
    userId: string
  ): Promise<AssessmentData> {
    return this.executeWithRetry(async () => {
      const updateData: AssessmentUpdate = {
        progress_data: progressData,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('assessments')
        .update(updateData)
        .eq('id', assessmentId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as AssessmentData
    })
  }

  /**
   * Gets incomplete assessment for a user
   */
  async getIncompleteAssessment(userId: string): Promise<AssessmentData | null> {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  }

  /**
   * Gets assessment by ID
   */
  async getAssessment(assessmentId: string, userId: string): Promise<AssessmentData | null> {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  }

  /**
   * Lists assessments with filters and pagination
   */
  async listAssessments(params: {
    userId: string
    page?: number
    limit?: number
    type?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<{ data: AssessmentData[]; count: number }> {
    const { userId, page = 1, limit = 10, type, status, dateFrom, dateTo } = params
    const offset = (page - 1) * limit

    let query = supabase
      .from('assessments')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    if (type) query = query.eq('type', type)
    if (status) query = query.eq('status', status)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo)

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return { data: data || [], count: count || 0 }
  }

  /**
   * Marks an assessment as abandoned
   */
  async abandonAssessment(assessmentId: string, userId: string): Promise<void> {
    const updateData: AssessmentUpdate = {
      status: 'abandoned',
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('assessments')
      .update(updateData)
      .eq('id', assessmentId)
      .eq('user_id', userId)

    if (error) throw error
  }

  /**
   * Executes a function with exponential backoff retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= this.retryDelays.length; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        
        // Don't retry if it's the last attempt
        if (attempt === this.retryDelays.length) {
          break
        }

        // Don't retry certain errors (auth, validation, etc.)
        if (this.shouldNotRetry(error)) {
          throw error
        }

        // Wait before retry
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelays[attempt])
        )
      }
    }

    throw lastError!
  }

  /**
   * Determines if an error should not be retried
   */
  private shouldNotRetry(error: any): boolean {
    // Don't retry authentication errors, validation errors, etc.
    if (error?.code === 'PGRST301') return true // JWT expired
    if (error?.code === 'PGRST116') return true // Not found
    if (error?.code === '23505') return true // Unique constraint violation
    if (error?.message?.includes('Row level security')) return true
    
    return false
  }
}

// Export singleton instance
export const assessmentService = new AssessmentPersistenceService()