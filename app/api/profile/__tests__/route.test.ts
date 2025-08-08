/**
 * @jest-environment node
 */
import { GET, PUT } from '../route'
import { NextRequest } from 'next/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}))

describe('/api/profile', () => {
  it('should handle GET requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/profile')
    const response = await GET(request)
    expect(response).toBeDefined()
  })

  it('should handle PUT requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ full_name: 'Test User' }),
    })
    const response = await PUT(request)
    expect(response).toBeDefined()
  })
})