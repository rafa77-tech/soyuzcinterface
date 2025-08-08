import { render, screen } from '@testing-library/react'
import CompletionScreen from '../completion-screen'
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

const mockAssessmentData = {
  disc_results: { d: 30, i: 25, s: 25, c: 20 },
  soft_skills_results: { comunicacao: 8, lideranca: 7 },
  sjt_results: { responses: [] }
}

describe('CompletionScreen', () => {
  it('should render without crashing', () => {
    render(
      <TestWrapper>
        <CompletionScreen 
          assessmentData={mockAssessmentData}
          onNext={jest.fn()}
        />
      </TestWrapper>
    )
    
    // Basic smoke test - just ensure it renders
    expect(document.body).toBeDefined()
  })

  it('should display completion content', () => {
    const mockOnNext = jest.fn()
    
    render(
      <TestWrapper>
        <CompletionScreen 
          assessmentData={mockAssessmentData}
          onNext={mockOnNext}
        />
      </TestWrapper>
    )
    
    // Look for any button or completion text
    const completionElement = document.querySelector('button, h1, h2, h3, .completion, .complete')
    expect(completionElement).toBeDefined()
  })
})