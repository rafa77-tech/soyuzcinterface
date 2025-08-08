import { NextRequest, NextResponse } from 'next/server'
import { assessmentService } from '../../../../lib/services/assessment-service'
import { 
  authenticateApiRequest, 
  validateUUIDParam, 
  createErrorResponse, 
  createSuccessResponse 
} from '../../../../lib/api/auth-utils'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authResult = await authenticateApiRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { userId } = authResult
    const { id: assessmentId } = await context.params

    // Validate UUID format
    const validationError = validateUUIDParam(assessmentId, 'assessment ID')
    if (validationError) {
      return validationError
    }

    // Get assessment
    const assessment = await assessmentService.getAssessment(assessmentId, userId)

    if (!assessment) {
      return createErrorResponse('Assessment not found', 404)
    }

    return createSuccessResponse(assessment)

  } catch (error) {
    console.error('Assessment get error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authResult = await authenticateApiRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { userId } = authResult
    const { id: assessmentId } = await context.params
    const body = await request.json()

    // Validate UUID format
    const validationError = validateUUIDParam(assessmentId, 'assessment ID')
    if (validationError) {
      return validationError
    }

    // Update assessment
    const updatedAssessment = await assessmentService.saveAssessment({
      assessmentData: { id: assessmentId, ...body },
      userId,
      isUpdate: true
    })

    return createSuccessResponse(updatedAssessment)

  } catch (error) {
    console.error('Assessment update error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authResult = await authenticateApiRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { userId } = authResult
    const { id: assessmentId } = await context.params

    // Validate UUID format
    const validationError = validateUUIDParam(assessmentId, 'assessment ID')
    if (validationError) {
      return validationError
    }

    // Mark assessment as abandoned
    await assessmentService.abandonAssessment(assessmentId, userId)

    return createSuccessResponse(
      null, 
      200, 
      'Assessment marked as abandoned'
    )

  } catch (error) {
    console.error('Assessment abandon error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}