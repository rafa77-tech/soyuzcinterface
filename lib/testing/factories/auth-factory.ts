// Auth Mock Factory
// Provides deterministic auth-related test data and mock implementations

/**
 * Mock user data structure
 */
export interface MockUser {
  id: string
  email: string
  created_at: string
  updated_at?: string
  user_metadata?: Record<string, any>
  app_metadata?: Record<string, any>
}

/**
 * Mock session data structure
 */
export interface MockSession {
  user: MockUser
  access_token: string
  refresh_token: string
  expires_at: number
  token_type: string
}

/**
 * Creates a mock user with realistic data
 * @param overrides - Partial user data to override defaults
 * @returns Complete mock user object
 */
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'mock-user-123',
  email: 'doctor@hospital.com',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  user_metadata: {
    name: 'Dr. João Silva',
    specialty: 'Cardiologia'
  },
  app_metadata: {
    role: 'doctor',
    verified: true
  },
  ...overrides
})

/**
 * Creates a mock session with associated user
 * @param user - User object or null for unauthenticated session
 * @returns Complete mock session object or null
 */
export const createMockSession = (user: MockUser | null = null): MockSession | null => {
  if (!user) return null
  
  return {
    user: user || createMockUser(),
    access_token: 'mock-access-token-' + Date.now(),
    refresh_token: 'mock-refresh-token-' + Date.now(),
    expires_at: Date.now() + 3600000, // 1 hour from now
    token_type: 'bearer'
  }
}

/**
 * Predefined user scenarios for common test cases
 */
export const mockUserScenarios = {
  /**
   * Standard authenticated doctor user
   */
  authenticatedDoctor: (): MockUser => createMockUser({
    id: 'doctor-user-123',
    email: 'dr.silva@hospital.com',
    user_metadata: {
      name: 'Dr. João Silva',
      specialty: 'Cardiologia',
      crm: '12345/SP'
    }
  }),
  
  /**
   * New user without completed profile
   */
  newUser: (): MockUser => createMockUser({
    id: 'new-user-456',
    email: 'novo.doutor@hospital.com',
    user_metadata: {
      name: null,
      specialty: null
    },
    app_metadata: {
      role: 'doctor',
      verified: false
    }
  }),
  
  /**
   * Admin user for testing elevated permissions
   */
  adminUser: (): MockUser => createMockUser({
    id: 'admin-user-789',
    email: 'admin@soyuz.com',
    user_metadata: {
      name: 'Administrator'
    },
    app_metadata: {
      role: 'admin',
      verified: true,
      permissions: ['read_all', 'write_all', 'delete_all']
    }
  }),
  
  /**
   * User with expired session
   */
  expiredSessionUser: (): MockUser => createMockUser({
    id: 'expired-user-999',
    email: 'expired@hospital.com'
  })
}

/**
 * Creates mock AuthProvider context value
 */
export const createMockAuthContext = (
  user: MockUser | null = mockUserScenarios.authenticatedDoctor(),
  overrides = {}
) => {
  const session = createMockSession(user)
  
  return {
    user,
    session,
    loading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    updateProfile: jest.fn(),
    resetPassword: jest.fn(),
    ...overrides
  }
}

/**
 * Creates mock AuthProvider context value for testing
 * Use this in jest.mock() calls instead of component wrapper
 */
export const createMockAuthProviderValue = (
  mockUser: MockUser | null = mockUserScenarios.authenticatedDoctor(),
  loading = false,
  customContext = {}
) => {
  return createMockAuthContext(mockUser, { loading, ...customContext })
}

/**
 * Auth state scenarios for comprehensive testing
 */
export const authStateScenarios = {
  /**
   * Loading state - initial app load
   */
  loading: () => createMockAuthContext(null, { loading: true }),
  
  /**
   * Authenticated state - normal user session
   */
  authenticated: (user?: MockUser) => createMockAuthContext(
    user || mockUserScenarios.authenticatedDoctor()
  ),
  
  /**
   * Unauthenticated state - logged out
   */
  unauthenticated: () => createMockAuthContext(null),
  
  /**
   * Error state - authentication failed
   */
  error: (error = new Error('Authentication failed')) => 
    createMockAuthContext(null, { error, loading: false }),
  
  /**
   * Session expiring - user needs to refresh
   */
  expiring: () => {
    const user = mockUserScenarios.expiredSessionUser()
    const session = createMockSession(user)
    if (session) {
      session.expires_at = Date.now() + 300000 // 5 minutes
    }
    return createMockAuthContext(user, { session })
  }
}

/**
 * Mock Supabase auth client for testing
 */
export const createMockSupabaseAuth = (
  scenario: 'success' | 'error' | 'loading' = 'success',
  user: MockUser | null = mockUserScenarios.authenticatedDoctor()
) => {
  const session = createMockSession(user)
  
  const baseAuth = {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ 
      data: { subscription: { unsubscribe: jest.fn() } }
    }))
  }
  
  switch (scenario) {
    case 'success':
      baseAuth.getSession.mockResolvedValue({ data: { session }, error: null })
      baseAuth.getUser.mockResolvedValue({ data: { user }, error: null })
      baseAuth.signInWithPassword.mockResolvedValue({
        data: { user, session },
        error: null
      })
      break
      
    case 'error':
      baseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Session expired')
      })
      baseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Invalid credentials')
      })
      break
      
    case 'loading':
      baseAuth.getSession.mockImplementation(() => new Promise(() => {})) // Never resolves
      break
  }
  
  return baseAuth
}

/**
 * Helper for mocking auth in tests
 */
export const setupAuthMock = (
  authState: 'authenticated' | 'unauthenticated' | 'loading' = 'authenticated',
  customUser?: MockUser
) => {
  let user: MockUser | null = null
  let loading = false
  
  switch (authState) {
    case 'authenticated':
      user = customUser || mockUserScenarios.authenticatedDoctor()
      break
    case 'loading':
      loading = true
      break
    case 'unauthenticated':
    default:
      user = null
      break
  }
  
  return createMockAuthProviderValue(user, loading)
}

/**
 * Test utilities for auth-related assertions
 */
export const authTestUtils = {
  /**
   * Expects component to show login requirement
   */
  expectLoginRequired: (screen: any) => {
    expect(
      screen.getByText(/fazer login|entrar|login/i) ||
      screen.getByText(/não autenticado|sem permissão/i)
    ).toBeInTheDocument()
  },
  
  /**
   * Expects component to show authenticated content
   */
  expectAuthenticated: (screen: any, userName?: string) => {
    if (userName) {
      expect(screen.getByText(new RegExp(userName, 'i'))).toBeInTheDocument()
    }
    expect(
      screen.queryByText(/fazer login|entrar|login/i)
    ).not.toBeInTheDocument()
  },
  
  /**
   * Expects component to show loading state
   */
  expectLoading: (screen: any) => {
    expect(
      screen.getByTestId('loading') ||
      screen.getByText(/carregando|loading/i) ||
      screen.getByRole('progressbar')
    ).toBeInTheDocument()
  }
}
