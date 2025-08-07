import { supabase } from '@/lib/supabase/client'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { 
  Assessment, 
  AssessmentInsert, 
  AssessmentUpdate, 
  AssessmentData,
  DiscResults,
  SoftSkillsResults,
  SjtResults,
  Json
} from '@/lib/supabase/types'

export interface SaveAssessmentParams {
  id?: string
  type: 'complete' | 'disc' | 'soft_skills' | 'sjt'
  status?: 'in_progress' | 'completed'
  disc_results?: DiscResults | null
  soft_skills_results?: SoftSkillsResults | null
  sjt_results?: SjtResults | null
}

export interface AssessmentListResponse {
  assessments: Pick<Assessment, 'id' | 'type' | 'status' | 'created_at' | 'completed_at'>[]
  pagination: {
    total: number
    page: number
    limit: number
  }
}

class AssessmentPersistenceService {
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY_BASE = 1000 // 1 segundo

  /**
   * Retry logic com exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (retries > 0) {
        const delay = this.RETRY_DELAY_BASE * Math.pow(2, this.MAX_RETRIES - retries)
        console.warn(`Assessment operation failed, retrying in ${delay}ms. Retries left: ${retries}`, error)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.withRetry(operation, retries - 1)
      }
      
      console.error('Assessment operation failed after all retries:', error)
      throw error
    }
  }

  /**
   * Salva ou atualiza uma avaliação (auto-save capability)
   */
  async saveAssessment(params: SaveAssessmentParams, userId?: string): Promise<{ id: string; status: string; message: string }> {
    return this.withRetry(async () => {
      const client = userId ? createRouteHandlerClient() : supabase
      
      // Se não temos userId, pegamos do client (browser context)
      let currentUserId = userId
      if (!currentUserId) {
        const { data: { user } } = await client.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        currentUserId = user.id
      }

      const now = new Date().toISOString()
      
      if (params.id) {
        // Atualizar avaliação existente
        const updateData: AssessmentUpdate = {
          type: params.type,
          status: params.status || 'in_progress',
          disc_results: params.disc_results as Json || null,
          soft_skills_results: params.soft_skills_results as Json || null,
          sjt_results: params.sjt_results as Json || null,
          ...(params.status === 'completed' && { completed_at: now })
        }

        const { data, error } = await client
          .from('assessments')
          .update(updateData)
          .eq('id', params.id)
          .eq('user_id', currentUserId)
          .select()
          .single()

        if (error) {
          throw new Error(`Failed to update assessment: ${error.message}`)
        }

        return {
          id: data.id,
          status: 'success',
          message: 'Assessment updated successfully'
        }
      } else {
        // Criar nova avaliação
        const insertData: AssessmentInsert = {
          user_id: currentUserId!,
          type: params.type,
          status: params.status || 'in_progress',
          disc_results: params.disc_results as Json || null,
          soft_skills_results: params.soft_skills_results as Json || null,
          sjt_results: params.sjt_results as Json || null,
          created_at: now,
          ...(params.status === 'completed' && { completed_at: now })
        }

        const { data, error } = await client
          .from('assessments')
          .insert(insertData)
          .select()
          .single()

        if (error) {
          throw new Error(`Failed to create assessment: ${error.message}`)
        }

        return {
          id: data.id,
          status: 'success',
          message: 'Assessment created successfully'
        }
      }
    })
  }

  /**
   * Lista todas as avaliações do usuário com paginação
   */
  async getAssessmentHistory(
    userId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<AssessmentListResponse> {
    return this.withRetry(async () => {
      const client = userId ? createRouteHandlerClient() : supabase
      
      // Se não temos userId, pegamos do client (browser context)
      let currentUserId = userId
      if (!currentUserId) {
        const { data: { user } } = await client.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        currentUserId = user.id
      }

      const offset = (page - 1) * limit

      // Buscar total de registros
      const { count, error: countError } = await client
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId)

      if (countError) {
        throw new Error(`Failed to count assessments: ${countError.message}`)
      }

      // Buscar avaliações paginadas
      const { data, error } = await client
        .from('assessments')
        .select('id, type, status, created_at, completed_at')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw new Error(`Failed to fetch assessments: ${error.message}`)
      }

      return {
        assessments: data || [],
        pagination: {
          total: count || 0,
          page,
          limit
        }
      }
    })
  }

  /**
   * Recupera uma avaliação específica por ID
   */
  async getAssessment(assessmentId: string, userId?: string): Promise<Assessment> {
    return this.withRetry(async () => {
      const client = userId ? createRouteHandlerClient() : supabase
      
      // Se não temos userId, pegamos do client (browser context)
      let currentUserId = userId
      if (!currentUserId) {
        const { data: { user } } = await client.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        currentUserId = user.id
      }

      const { data, error } = await client
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .eq('user_id', currentUserId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch assessment: ${error.message}`)
      }

      return data
    })
  }

  /**
   * Busca avaliação incompleta mais recente do usuário para resumir
   */
  async getIncompleteAssessment(userId?: string): Promise<Assessment | null> {
    return this.withRetry(async () => {
      const client = userId ? createRouteHandlerClient() : supabase
      
      // Se não temos userId, pegamos do client (browser context)
      let currentUserId = userId
      if (!currentUserId) {
        const { data: { user } } = await client.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        currentUserId = user.id
      }

      const { data, error } = await client
        .from('assessments')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        throw new Error(`Failed to fetch incomplete assessment: ${error.message}`)
      }

      return data
    })
  }

  /**
   * Atualiza apenas os resultados de uma avaliação específica
   */
  async updateAssessmentResults(
    assessmentId: string, 
    results: Partial<Pick<AssessmentData, 'disc_results' | 'soft_skills_results' | 'sjt_results'>>,
    userId?: string
  ): Promise<{ id: string; status: string; message: string }> {
    return this.withRetry(async () => {
      const client = userId ? createRouteHandlerClient() : supabase
      
      // Se não temos userId, pegamos do client (browser context)
      let currentUserId = userId
      if (!currentUserId) {
        const { data: { user } } = await client.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        currentUserId = user.id
      }

      const updateData: AssessmentUpdate = {
        disc_results: results.disc_results as Json,
        soft_skills_results: results.soft_skills_results as Json,
        sjt_results: results.sjt_results as Json
      }

      const { data, error } = await client
        .from('assessments')
        .update(updateData)
        .eq('id', assessmentId)
        .eq('user_id', currentUserId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update assessment results: ${error.message}`)
      }

      return {
        id: data.id,
        status: 'success',
        message: 'Assessment results updated successfully'
      }
    })
  }

  /**
   * Marca uma avaliação como completa
   */
  async completeAssessment(assessmentId: string, userId?: string): Promise<{ id: string; status: string; message: string }> {
    return this.withRetry(async () => {
      const client = userId ? createRouteHandlerClient() : supabase
      
      // Se não temos userId, pegamos do client (browser context)
      let currentUserId = userId
      if (!currentUserId) {
        const { data: { user } } = await client.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        currentUserId = user.id
      }

      const { data, error } = await client
        .from('assessments')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', assessmentId)
        .eq('user_id', currentUserId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to complete assessment: ${error.message}`)
      }

      return {
        id: data.id,
        status: 'success',
        message: 'Assessment completed successfully'
      }
    })
  }
}

// Singleton instance
export const assessmentService = new AssessmentPersistenceService()
export default assessmentService 