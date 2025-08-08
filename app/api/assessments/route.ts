import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { assessmentService } from '../../../lib/services/assessment-service'
import { z } from 'zod'

// Validation schema for query parameters
const ListAssessmentsParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: z.enum(['complete', 'disc', 'soft_skills', 'sjt']).optional(),
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional()
})

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const params = ListAssessmentsParamsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      type: searchParams.get('type'),
      status: searchParams.get('status'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to')
    })

    // Get assessments
    const result = await assessmentService.listAssessments({
      userId,
      page: params.page,
      limit: params.limit,
      type: params.type,
      status: params.status,
      dateFrom: params.date_from,
      dateTo: params.date_to
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(result.count / params.limit)
    const hasNextPage = params.page < totalPages
    const hasPrevPage = params.page > 1

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        current_page: params.page,
        total_pages: totalPages,
        total_count: result.count,
        page_size: params.limit,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      }
    })

  } catch (error) {
    console.error('Assessment list error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: error.errors
        }, 
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}