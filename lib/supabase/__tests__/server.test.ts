import { createRouteHandlerClient } from '../server'
import { cookies } from 'next/headers'

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('Supabase Server Client', () => {
  it('should create route handler client', () => {
    ;(cookies as jest.Mock).mockReturnValue({
      getAll: jest.fn().mockReturnValue([]),
    })
    
    const client = createRouteHandlerClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
    expect(client.from).toBeInstanceOf(Function)
  })
})