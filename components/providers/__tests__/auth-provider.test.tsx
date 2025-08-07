import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../auth-provider'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => {
  const mockSelect = jest.fn()
  const mockEq = jest.fn()
  const mockSingle = jest.fn()
  const mockInsert = jest.fn()
  const mockFrom = jest.fn()

  // Setup mock chain
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert
  })
  mockSelect.mockReturnValue({
    eq: mockEq
  })
  mockEq.mockReturnValue({
    single: mockSingle
  })
  
  return {
    supabase: {
      auth: {
        getSession: jest.fn(),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } }
        })),
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
      },
      from: mockFrom
    },
    mockSelect,
    mockEq,
    mockSingle,
    mockInsert,
    mockFrom
  }
})

// Test component that uses the auth hook
function TestComponent() {
  const { user, loading, signIn, signUp, signOut } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{user ? `User: ${user.email}` : 'No User'}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>
        Sign In
      </button>
      <button onClick={() => signUp('test@example.com', 'password', {
        name: 'Test User',
        email: 'test@example.com',
        crm: 'CRM123',
        specialty: 'Cardiologia'
      })}>
        Sign Up
      </button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { mockSingle } = require('@/lib/supabase/client')
    mockSingle.mockResolvedValue({ data: null, error: null })
  })

  it('should provide auth context to children', async () => {
    const mockGetSession = require('@/lib/supabase/client').supabase.auth.getSession
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })
    
    expect(screen.getByTestId('user')).toHaveTextContent('No User')
    expect(mockGetSession).toHaveBeenCalled()
  })

  it('should handle sign in', async () => {
    const user = userEvent.setup()
    const mockSignIn = require('@/lib/supabase/client').supabase.auth.signInWithPassword
    const mockGetSession = require('@/lib/supabase/client').supabase.auth.getSession
    
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSignIn.mockResolvedValue({ error: null })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    await user.click(screen.getByText('Sign In'))

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    })
  })

  it('should handle sign up', async () => {
    const user = userEvent.setup()
    const mockSignUp = require('@/lib/supabase/client').supabase.auth.signUp
    const mockGetSession = require('@/lib/supabase/client').supabase.auth.getSession
    const { mockInsert } = require('@/lib/supabase/client')
    
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSignUp.mockResolvedValue({ 
      data: { 
        user: { id: '123', email: 'test@example.com' }, 
        session: { user: { id: '123' } } 
      }, 
      error: null 
    })
    mockInsert.mockResolvedValue({ error: null })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    await user.click(screen.getByText('Sign Up'))

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([{
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        crm: 'CRM123',
        specialty: 'Cardiologia'
      }])
    })
  })

  it('should handle sign out', async () => {
    const user = userEvent.setup()
    const mockSignOut = require('@/lib/supabase/client').supabase.auth.signOut
    const mockGetSession = require('@/lib/supabase/client').supabase.auth.getSession
    
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSignOut.mockResolvedValue({ error: null })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    await user.click(screen.getByText('Sign Out'))

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('should throw error when useAuth is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleError.mockRestore()
  })
})