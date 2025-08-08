// Mock AuthProvider for Testing
// Provides a functional mock implementation of the AuthProvider context

import React, { createContext, useContext, ReactNode } from 'react'
import type { MockUser, MockSession } from '../factories/auth-factory'
import { createMockUser, createMockSession, mockUserScenarios } from '../factories/auth-factory'

/**
 * Mock Auth Context type matching the real AuthProvider
 */
interface MockAuthContextType {
  user: MockUser | null
  session: MockSession | null
  loading: boolean
  signIn: jest.MockedFunction<any>
  signOut: jest.MockedFunction<any>
  signUp: jest.MockedFunction<any>
  updateProfile: jest.MockedFunction<any>
  resetPassword: jest.MockedFunction<any>
}

/**
 * Mock Auth Context
 */
const MockAuthContext = createContext<MockAuthContextType | null>(null)

/**
 * Mock AuthProvider Props
 */
interface MockAuthProviderProps {
  children: ReactNode
  mockUser?: MockUser | null
  loading?: boolean
  customMethods?: Partial<MockAuthContextType>
}

/**
 * Mock AuthProvider Component
 * Use this in tests to provide controlled auth state
 */
export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({
  children,
  mockUser = mockUserScenarios.authenticatedDoctor(),
  loading = false,
  customMethods = {}
}) => {
  const session = createMockSession(mockUser)
  
  const contextValue: MockAuthContextType = {
    user: mockUser,
    session,
    loading,
    signIn: jest.fn().mockResolvedValue({ data: { user: mockUser, session }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: mockUser, session }, error: null }),
    updateProfile: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
    resetPassword: jest.fn().mockResolvedValue({ error: null }),
    ...customMethods
  }

  return (
    <MockAuthContext.Provider value={contextValue}>
      {children}
    </MockAuthContext.Provider>
  )
}

/**
 * Hook to access mock auth context in tests
 */
export const useMockAuth = (): MockAuthContextType => {
  const context = useContext(MockAuthContext)
  if (!context) {
    throw new Error('useMockAuth must be used within MockAuthProvider')
  }
  return context
}

/**
 * Higher-order component for testing components that require auth
 */
export const withMockAuth = (
  Component: React.ComponentType<any>,
  authProps: Partial<MockAuthProviderProps> = {}
) => {
  return (props: any) => (
    <MockAuthProvider {...authProps}>
      <Component {...props} />
    </MockAuthProvider>
  )
}

/**
 * Render function with auth context for testing
 */
export const renderWithMockAuth = (
  ui: React.ReactElement,
  {
    mockUser = mockUserScenarios.authenticatedDoctor(),
    loading = false,
    customMethods = {},
    ...renderOptions
  }: {
    mockUser?: MockUser | null
    loading?: boolean
    customMethods?: Partial<MockAuthContextType>
  } & any = {}
) => {
  const { render } = require('@testing-library/react')
  const React = require('react')
  
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    return React.createElement(MockAuthProvider, {
      mockUser,
      loading,
      customMethods
    }, children)
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Pre-configured auth states for common test scenarios
 */
export const authTestStates = {
  /**
   * Authenticated doctor - standard scenario
   */
  authenticated: {
    mockUser: mockUserScenarios.authenticatedDoctor(),
    loading: false
  },
  
  /**
   * Unauthenticated - user logged out
   */
  unauthenticated: {
    mockUser: null,
    loading: false
  },
  
  /**
   * Loading - authentication in progress
   */
  loading: {
    mockUser: null,
    loading: true
  },
  
  /**
   * New user - incomplete profile
   */
  newUser: {
    mockUser: mockUserScenarios.newUser(),
    loading: false
  },
  
  /**
   * Admin user - elevated permissions
   */
  admin: {
    mockUser: mockUserScenarios.adminUser(),
    loading: false
  },
  
  /**
   * Sign in error - authentication failed
   */
  signInError: {
    mockUser: null,
    loading: false,
    customMethods: {
      signIn: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Invalid credentials')
      })
    }
  }
}

/**
 * Jest setup helpers for mocking the real AuthProvider
 */
export const setupAuthProviderMock = () => {
  // Mock the real AuthProvider module
  jest.mock('@/components/providers/auth-provider', () => ({
    AuthProvider: MockAuthProvider,
    useAuth: useMockAuth,
    AuthContext: MockAuthContext
  }))
}

/**
 * Cleanup auth mocks after tests
 */
export const cleanupAuthProviderMock = () => {
  jest.clearAllMocks()
}
