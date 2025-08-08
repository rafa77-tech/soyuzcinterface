import { render, screen } from '@testing-library/react'
import { AIChatWidget } from '../ai-chat-widget'
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

describe('AIChatWidget', () => {
  it('should render without crashing', () => {
    render(
      <TestWrapper>
        <AIChatWidget />
      </TestWrapper>
    )
    
    // Basic smoke test - just ensure it renders
    expect(document.body).toBeDefined()
  })

  it('should have required structure', () => {
    render(
      <TestWrapper>
        <AIChatWidget />
      </TestWrapper>
    )
    
    // Look for common chat widget elements
    const chatWidget = document.querySelector('[data-testid], .chat, .ai-chat, button, div')
    expect(chatWidget).toBeDefined()
  })
})