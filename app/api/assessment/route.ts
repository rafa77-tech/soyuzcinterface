import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { assessmentService, AssessmentData } from '../../../lib/services/assessment-service'
import { z } from 'zod'

// Rate limiting: simple in-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX_SAVES = 10 // 10 saves per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

// Validation schemas
const DiscResultsSchema = z.object({
  D: z.number().min(0).max(100),
  I: z.number().min(0).max(100),
  S: z.number().min(0).max(100),
  C: z.number().min(0).max(100),
  responses: z.record(z.string()).optional()
})

const SoftSkillsResultsSchema = z.object({
  comunicacao: z.number().min(0).max(100),
  lideranca: z.number().min(0).max(100),
  trabalhoEmEquipe: z.number().min(0).max(100),
  resolucaoProblemas: z.number().min(0).max(100),
  adaptabilidade: z.number().min(0).max(100)
}).catchall(z.number().min(0).max(100))

const SjtResultsSchema = z.object({
  responses: z.array(z.number()),
  scores: z.array(z.number().min(0).max(1))
})

const AssessmentSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['complete', 'disc', 'soft_skills', 'sjt']),
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
  disc_results: DiscResultsSchema.optional(),
  soft_skills_results: SoftSkillsResultsSchema.optional(),
  sjt_results: SjtResultsSchema.optional(),
  progress_data: z.any().optional()
})

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_MAX_SAVES) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
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

    // Check rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 10 saves per minute.' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = AssessmentSchema.parse(body)

    // Determine if this is an update
    const isUpdate = !!validatedData.id

    // Save assessment
    const savedAssessment = await assessmentService.saveAssessment({
      assessmentData: validatedData,
      userId,
      isUpdate
    })

    return NextResponse.json({
      success: true,
      data: savedAssessment
    }, { status: isUpdate ? 200 : 201 })

  } catch (error) {
    console.error('Assessment save error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors
        }, 
        { status: 400 }
      )
    }

    // Handle Supabase errors
    if (error && typeof error === 'object' && 'code' in error) {
      const supabaseError = error as any
      if (supabaseError.code === '23505') {
        return NextResponse.json(
          { error: 'Assessment already exists' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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
    const assessmentId = searchParams.get('id')

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    // Check rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 10 saves per minute.' },
        { status: 429 }
      )
    }

    // Parse request body for progress data
    const { progress_data } = await request.json()

    // Update assessment progress
    const updatedAssessment = await assessmentService.updateAssessmentProgress(
      assessmentId,
      progress_data,
      userId
    )

    return NextResponse.json({
      success: true,
      data: updatedAssessment
    })

  } catch (error) {
    console.error('Assessment progress update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}