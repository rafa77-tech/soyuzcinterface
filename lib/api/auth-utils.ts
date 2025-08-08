import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '../supabase/server'

/**
 * Authentication result for API routes
 */
export interface AuthResult {
  userId: string
  session: any
  error?: never
}

export interface AuthError {
  userId?: never
  session?: never
  error: NextResponse
}

/**
 * UUID validation regex
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Authenticates the current request and returns user info
 * @param request - The NextRequest object (optional, for future use)
 * @returns AuthResult with userId and session, or AuthError with error response
 */
export async function authenticateApiRequest(request?: NextRequest): Promise<AuthResult | AuthError> {
  try {
    const supabase = createRouteHandlerClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return {
        error: NextResponse.json(
          { error: 'Authentication required' }, 
          { status: 401 }
        )
      }
    }

    return {
      userId: session.user.id,
      session
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      error: NextResponse.json(
        { error: 'Authentication failed' }, 
        { status: 401 }
      )
    }
  }
}

/**
 * Validates UUID format
 * @param uuid - UUID string to validate
 * @returns boolean indicating if UUID format is valid
 */
export function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid)
}

/**
 * Creates a standardized error response
 * @param message - Error message
 * @param status - HTTP status code
 * @param details - Optional additional details
 * @returns NextResponse with error
 */
export function createErrorResponse(
  message: string, 
  status: number, 
  details?: any
): NextResponse {
  const response: any = { error: message }
  if (details) {
    response.details = details
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Creates a standardized success response
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @param message - Optional success message
 * @returns NextResponse with success
 */
export function createSuccessResponse(
  data: any, 
  status: number = 200, 
  message?: string
): NextResponse {
  const response: any = { 
    success: true, 
    data 
  }
  
  if (message) {
    response.message = message
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Validates UUID parameter and returns appropriate error if invalid
 * @param uuid - UUID to validate
 * @param paramName - Name of the parameter for error message
 * @returns null if valid, NextResponse with error if invalid
 */
export function validateUUIDParam(uuid: string, paramName: string = 'ID'): NextResponse | null {
  if (!isValidUUID(uuid)) {
    return createErrorResponse(
      `Invalid ${paramName} format`,
      400
    )
  }
  return null
}

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

/**
 * In-memory rate limit store (use Redis in production)
 * TODO: Replace with Redis for production deployment
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Clean up expired entries from rate limit store (basic memory management)
 */
function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up expired entries every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000)

/**
 * Checks if a user has exceeded their rate limit
 * @param userId - User ID to check
 * @param config - Rate limit configuration
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  userId: string, 
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60 * 1000 }
): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { 
      count: 1, 
      resetTime: now + config.windowMs 
    })
    return true
  }

  if (userLimit.count >= config.maxRequests) {
    return false
  }

  userLimit.count++
  return true
}

/**
 * Creates rate limit exceeded error response
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns NextResponse with rate limit error
 */
export function createRateLimitResponse(
  maxRequests: number, 
  windowMs: number
): NextResponse {
  const windowMinutes = Math.ceil(windowMs / (60 * 1000))
  return createErrorResponse(
    `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMinutes} minute(s).`,
    429
  )
}
