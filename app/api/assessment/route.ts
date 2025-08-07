import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import assessmentService from '@/lib/services/assessment-service'

// Schema de validação para assessment
const assessmentSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['complete', 'disc', 'soft_skills', 'sjt']),
  status: z.enum(['in_progress', 'completed']).optional(),
  disc_results: z.object({
    D: z.number(),
    I: z.number(),
    S: z.number(),
    C: z.number()
  }).nullable().optional(),
  soft_skills_results: z.record(z.string(), z.number()).nullable().optional(),
  sjt_results: z.array(z.number()).nullable().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid authentication required' },
        { status: 401 }
      )
    }

    // Validar dados de entrada
    const body = await request.json()
    const validationResult = assessmentSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid data format',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const assessmentData = validationResult.data

    // Salvar assessment usando o service  
    const result = await assessmentService.saveAssessment({
      ...assessmentData,
      soft_skills_results: assessmentData.soft_skills_results as any
    }, user.id)

    return NextResponse.json(result, { status: 200 })
    
  } catch (error) {
    console.error('Error in POST /api/assessment:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid authentication required' },
        { status: 401 }
      )
    }

    // Buscar avaliação incompleta para resumir
    const incompleteAssessment = await assessmentService.getIncompleteAssessment(user.id)

    if (!incompleteAssessment) {
      return NextResponse.json(
        { message: 'No incomplete assessment found' },
        { status: 404 }
      )
    }

    return NextResponse.json(incompleteAssessment, { status: 200 })
    
  } catch (error) {
    console.error('Error in GET /api/assessment:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
} 