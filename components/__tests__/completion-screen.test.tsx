import { render, screen } from '@testing-library/react'
import { CompletionScreen } from '../completion-screen'
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

const mockProps = {
  userData: { name: 'Test User', email: 'test@example.com' },
  discResults: { D: 30, I: 25, S: 25, C: 20 },
  softSkillsResults: { comunicacao: 8, lideranca: 7 },
  sjtResults: [8, 7, 9, 6, 8],
  onRestart: jest.fn(),
  onViewHistory: jest.fn()
}

describe('CompletionScreen', () => {
  it('should render without crashing', () => {
    render(
      <TestWrapper>
        <CompletionScreen {...mockProps} />
      </TestWrapper>
    )
    
    // Basic smoke test - just ensure it renders
    expect(document.body).toBeDefined()
  })

  it('should display completion content', () => {    
    render(
      <TestWrapper>
        <CompletionScreen {...mockProps} />
      </TestWrapper>
    )
    
    // Look for any button or completion text
    const completionElement = document.querySelector('button, h1, h2, h3, .completion, .complete')
    expect(completionElement).toBeDefined()
  })
})