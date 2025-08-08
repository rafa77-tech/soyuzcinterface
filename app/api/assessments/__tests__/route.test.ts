/**
 * @jest-environment node
 */
import { GET } from '../route'
import { NextRequest } from 'next/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
    })),
  })),
}))

describe('/api/assessments', () => {
  it('should handle GET requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/assessments')
    const response = await GET(request)
    expect(response).toBeDefined()
  })
})