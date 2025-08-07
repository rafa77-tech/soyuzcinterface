import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import assessmentService from '@/lib/services/assessment-service'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const assessmentId = params.id

    // Validar formato do ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(assessmentId)) {
      return NextResponse.json(
        { 
          error: 'Invalid assessment ID format',
          message: 'Assessment ID must be a valid UUID'
        },
        { status: 400 }
      )
    }

    // Buscar avaliação específica
    const assessment = await assessmentService.getAssessment(assessmentId, user.id)

    return NextResponse.json(assessment, { status: 200 })
    
  } catch (error) {
    console.error('Error in GET /api/assessment/[id]:', error)

    // Se o erro for sobre assessment não encontrado, retornar 404
    if (error instanceof Error && error.message.includes('Failed to fetch assessment')) {
      return NextResponse.json(
        { 
          error: 'Assessment not found',
          message: 'The requested assessment does not exist or you do not have permission to access it'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const assessmentId = params.id

    // Validar formato do ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(assessmentId)) {
      return NextResponse.json(
        { 
          error: 'Invalid assessment ID format',
          message: 'Assessment ID must be a valid UUID'
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Verificar se é uma operação de conclusão
    if (body.action === 'complete') {
      const result = await assessmentService.completeAssessment(assessmentId, user.id)
      return NextResponse.json(result, { status: 200 })
    }

    // Atualizar resultados parciais
    const { disc_results, soft_skills_results, sjt_results } = body
    const results: any = {}
    
    if (disc_results !== undefined) results.disc_results = disc_results
    if (soft_skills_results !== undefined) results.soft_skills_results = soft_skills_results
    if (sjt_results !== undefined) results.sjt_results = sjt_results

    if (Object.keys(results).length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid results provided',
          message: 'Please provide disc_results, soft_skills_results, or sjt_results to update'
        },
        { status: 400 }
      )
    }

    const result = await assessmentService.updateAssessmentResults(assessmentId, results, user.id)

    return NextResponse.json(result, { status: 200 })
    
  } catch (error) {
    console.error('Error in PATCH /api/assessment/[id]:', error)

    // Se o erro for sobre assessment não encontrado, retornar 404
    if (error instanceof Error && (
      error.message.includes('Failed to update assessment') ||
      error.message.includes('Failed to complete assessment')
    )) {
      return NextResponse.json(
        { 
          error: 'Assessment not found',
          message: 'The requested assessment does not exist or you do not have permission to access it'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
} 