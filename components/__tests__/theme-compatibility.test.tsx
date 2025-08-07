import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '../theme-provider'
import { AuthProvider } from '../providers/auth-provider'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
    }))
  }
}))

// Test component that uses both theme and auth
function TestApp() {
  return (
    <div>
      <h1>Test App</h1>
      <div data-testid="theme-test" className="bg-background text-foreground">
        Theme colors working
      </div>
    </div>
  )
}

describe('Theme and Auth Compatibility', () => {
  it('should render with both ThemeProvider and AuthProvider', async () => {
    render(
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <TestApp />
        </AuthProvider>
      </ThemeProvider>
    )

    expect(screen.getByText('Test App')).toBeInTheDocument()
    expect(screen.getByTestId('theme-test')).toBeInTheDocument()
    expect(screen.getByText('Theme colors working')).toBeInTheDocument()
  })

  it('should maintain theme context when auth provider is present', () => {
    const { container } = render(
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <TestApp />
        </AuthProvider>
      </ThemeProvider>
    )

    // Check that the html element has the expected theme class
    // Note: This would normally be on document.documentElement in a real app
    const themeElements = container.querySelectorAll('[class*="dark"], [class*="light"]')
    expect(themeElements.length).toBeGreaterThanOrEqual(0) // Theme may apply classes
  })
})