import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import assessmentService from '@/lib/services/assessment-service'

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

    // Extrair parâmetros de paginação da URL
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    // Validar parâmetros de paginação
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { 
          error: 'Invalid pagination parameters',
          message: 'Page must be >= 1 and limit must be between 1 and 100'
        },
        { status: 400 }
      )
    }

    // Buscar histórico de avaliações
    const result = await assessmentService.getAssessmentHistory(user.id, page, limit)

    return NextResponse.json(result, { status: 200 })
    
  } catch (error) {
    console.error('Error in GET /api/assessments:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
} 