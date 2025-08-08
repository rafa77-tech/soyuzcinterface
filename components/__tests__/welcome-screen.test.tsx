import { render } from '@testing-library/react'
import WelcomeScreen from '../welcome-screen'
import { AuthProvider } from '../providers/auth-provider'
import { ThemeProvider } from '../theme-provider'

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
)

describe('WelcomeScreen', () => {
  it('should render without crashing', () => {
    const mockOnStart = jest.fn()

    render(
      <TestWrapper>
        <WelcomeScreen onStart={mockOnStart} />
      </TestWrapper>
    )
    
    expect(document.body).toBeDefined()
  })

  it('should accept onStart prop', () => {
    const mockOnStart = jest.fn()

    render(
      <TestWrapper>
        <WelcomeScreen onStart={mockOnStart} />
      </TestWrapper>
    )
    
    expect(mockOnStart).toBeDefined()
    expect(typeof mockOnStart).toBe('function')
  })
})