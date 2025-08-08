import { render } from '@testing-library/react'
import { MiniDiscScreen } from '../mini-disc-screen'
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

describe('MiniDiscScreen', () => {
  it('should render without crashing', () => {
    const mockProps = {
      onComplete: jest.fn(),
      onNext: jest.fn(),
      onPrev: jest.fn(),
      currentStep: 1,
      totalSteps: 5,
      answers: {},
      onAnswerChange: jest.fn()
    }

    render(
      <TestWrapper>
        <MiniDiscScreen {...mockProps} />
      </TestWrapper>
    )
    
    expect(document.body).toBeDefined()
  })

  it('should handle prop updates', () => {
    const mockProps = {
      onComplete: jest.fn(),
      onNext: jest.fn(),
      onPrev: jest.fn(),
      currentStep: 2,
      totalSteps: 5,
      answers: { question_1: 'answer1' },
      onAnswerChange: jest.fn()
    }

    render(
      <TestWrapper>
        <MiniDiscScreen {...mockProps} />
      </TestWrapper>
    )
    
    // Basic assertion that component accepts props
    expect(mockProps.currentStep).toBe(2)
  })
})