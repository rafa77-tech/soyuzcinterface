/**
 * End-to-End Test for Complete Assessment Flow
 * Tests the entire user journey from authentication through assessment completion
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'
import { AuthProvider } from '@/components/providers/auth-provider'

// Mock external dependencies
jest.mock('@/lib/supabase/client')
jest.mock('@/components/ai-chat-widget', () => {
  return function MockAIChatWidget() {
    return <div data-testid="ai-chat-widget">AI Chat</div>
  }
})

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    })),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn()
  }))
}

jest.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabaseClient
}))

// Test wrapper with AuthProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('Complete Assessment Flow E2E', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock authenticated user session
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          },
          access_token: 'mock-token'
        }
      },
      error: null
    })

    // Mock successful API responses
    ;(global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/assessment') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            id: 'mock-assessment-id',
            status: 'success',
            message: 'Assessment saved successfully'
          })
        })
      }
      
      if (url.includes('/api/assessment') && options?.method === 'GET') {
        return Promise.resolve({
          ok: false,
          status: 404
        })
      }

      if (url.includes('/api/assessments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            assessments: []
          })
        })
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })
  })

  it('should complete full assessment flow: welcome → auth → assessments → completion', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    )

    // Step 1: Welcome Screen
    expect(screen.getByText(/Bem-vindo ao Sistema de Avaliação/i)).toBeInTheDocument()
    
    const startButton = screen.getByRole('button', { name: /começar avaliação/i })
    await user.click(startButton)

    // Step 2: Authentication Screen (Skip if user already authenticated)
    await waitFor(() => {
      // Should either show auth form or skip to next step if already authenticated
      expect(
        screen.queryByText(/login médico/i) || 
        screen.queryByText(/avaliação disc/i) ||
        screen.queryByText(/bem-vindo/i)
      ).toBeInTheDocument()
    })

    // If auth screen is shown, fill it out
    if (screen.queryByText(/login médico/i)) {
      const emailInput = screen.getByLabelText(/e-mail/i)
      const passwordInput = screen.getByLabelText(/senha/i)
      const loginButton = screen.getByRole('button', { name: /entrar/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(loginButton)

      await waitFor(() => {
        expect(screen.queryByText(/login médico/i)).not.toBeInTheDocument()
      })
    }

    // If already authenticated, proceed to assessment
    if (screen.queryByText(/bem-vindo/i) && screen.queryByRole('button', { name: /iniciar nova avaliação/i })) {
      const newAssessmentButton = screen.getByRole('button', { name: /iniciar nova avaliação/i })
      await user.click(newAssessmentButton)
    }

    // Step 3: DISC Assessment
    await waitFor(() => {
      expect(screen.getByText(/avaliação disc/i)).toBeInTheDocument()
    })

    // Fill out DISC questions (simulate quick completion)
    const discQuestions = screen.getAllByRole('radio')
    for (let i = 0; i < Math.min(discQuestions.length, 20); i += 4) {
      // Select first option for each question
      await user.click(discQuestions[i])
    }

    const discNextButton = screen.getByRole('button', { name: /continuar para soft skills/i })
    await user.click(discNextButton)

    // Wait for auto-save to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/assessment',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('disc_results')
        })
      )
    })

    // Step 4: Soft Skills Assessment
    await waitFor(() => {
      expect(screen.getByText(/autoavaliação de soft skills/i)).toBeInTheDocument()
    })

    // Interact with sliders
    const sliders = screen.getAllByRole('slider')
    for (const slider of sliders.slice(0, 3)) { // Test first 3 sliders
      await user.click(slider)
      fireEvent.change(slider, { target: { value: '7' } })
    }

    const softSkillsNextButton = screen.getByRole('button', { name: /continuar para julgamento situacional/i })
    await user.click(softSkillsNextButton)

    // Wait for auto-save
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/assessment',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('soft_skills_results')
        })
      )
    })

    // Step 5: SJT Assessment
    await waitFor(() => {
      expect(screen.getByText(/julgamento situacional/i)).toBeInTheDocument()
    })

    // Answer SJT scenarios
    for (let scenario = 0; scenario < 3; scenario++) {
      // Select first radio option for each scenario
      const radioOptions = screen.getAllByRole('radio')
      if (radioOptions.length > 0) {
        await user.click(radioOptions[0])
      }

      const nextButton = screen.getByRole('button', { 
        name: scenario < 2 ? /próximo cenário/i : /finalizar avaliação/i 
      })
      await user.click(nextButton)

      // Wait for auto-save after each answer
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/assessment',
          expect.objectContaining({
            method: 'POST'
          })
        )
      })

      if (scenario < 2) {
        // Wait for next scenario to load
        await waitFor(() => {
          expect(screen.getByText(`${scenario + 2} de 3`)).toBeInTheDocument()
        })
      }
    }

    // Step 6: Completion Screen
    await waitFor(() => {
      expect(screen.getByText(/parabéns/i) || screen.getByText(/avaliação concluída/i)).toBeInTheDocument()
    })

    // Verify completion screen has expected elements
    expect(screen.getByText(/nova avaliação/i)).toBeInTheDocument()
    expect(screen.getByText(/baixar relatório/i)).toBeInTheDocument()

    // Verify final auto-save with completed status
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/assessment',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('sjt_results')
        })
      )
    })
  }, 30000) // Extended timeout for full flow

  it('should handle assessment resumption flow', async () => {
    // Mock incomplete assessment
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/assessment') && !url.includes('assessments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'incomplete-assessment-id',
            type: 'complete',
            status: 'in_progress',
            disc_results: { D: 4, I: 3, S: 2, C: 1 },
            created_at: '2025-01-01T00:00:00Z'
          })
        })
      }
      return Promise.resolve({ ok: false, status: 404 })
    })

    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    )

    // Navigate past welcome and auth
    const startButton = screen.getByRole('button', { name: /começar avaliação/i })
    await user.click(startButton)

    // Should show resume modal after auth
    await waitFor(() => {
      expect(screen.getByText(/avaliação incompleta encontrada/i)).toBeInTheDocument()
    })

    // Choose to resume
    const resumeButton = screen.getByRole('button', { name: /continuar avaliação/i })
    await user.click(resumeButton)

    // Should go to appropriate assessment screen based on saved progress
    await waitFor(() => {
      expect(
        screen.getByText(/avaliação disc/i) ||
        screen.getByText(/soft skills/i) ||
        screen.getByText(/julgamento situacional/i)
      ).toBeInTheDocument()
    })
  })

  it('should handle auto-save failures gracefully', async () => {
    // Mock API failure
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    )

    // Navigate to assessment
    const startButton = screen.getByRole('button', { name: /começar avaliação/i })
    await user.click(startButton)

    // Skip auth if already authenticated
    await waitFor(() => {
      expect(
        screen.getByText(/avaliação disc/i) ||
        screen.queryByRole('button', { name: /iniciar nova avaliação/i })
      ).toBeInTheDocument()
    })

    if (screen.queryByRole('button', { name: /iniciar nova avaliação/i })) {
      const newAssessmentButton = screen.getByRole('button', { name: /iniciar nova avaliação/i })
      await user.click(newAssessmentButton)
    }

    await waitFor(() => {
      expect(screen.getByText(/avaliação disc/i)).toBeInTheDocument()
    })

    // Answer a question to trigger auto-save
    const firstRadio = screen.getAllByRole('radio')[0]
    await user.click(firstRadio)

    // Should show error indicator but allow user to continue
    await waitFor(() => {
      // Look for error state in saving indicator
      const savingIndicator = screen.getByTestId(/saving-indicator/i) || 
                             screen.queryByText(/erro ao salvar/i)
      
      // Assessment should still be functional despite save error
      expect(screen.getByText(/avaliação disc/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('should maintain assessment state during navigation', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    )

    // Navigate to DISC assessment
    const startButton = screen.getByRole('button', { name: /começar avaliação/i })
    await user.click(startButton)

    await waitFor(() => {
      if (screen.queryByRole('button', { name: /iniciar nova avaliação/i })) {
        const newAssessmentButton = screen.getByRole('button', { name: /iniciar nova avaliação/i })
        fireEvent.click(newAssessmentButton)
      }
    })

    await waitFor(() => {
      expect(screen.getByText(/avaliação disc/i)).toBeInTheDocument()
    })

    // Answer some DISC questions
    const discRadios = screen.getAllByRole('radio').slice(0, 4)
    for (const radio of discRadios) {
      await user.click(radio)
    }

    // Continue to Soft Skills
    const discNextButton = screen.getByRole('button', { name: /continuar para soft skills/i })
    await user.click(discNextButton)

    await waitFor(() => {
      expect(screen.getByText(/soft skills/i)).toBeInTheDocument()
    })

    // Modify some soft skills
    const sliders = screen.getAllByRole('slider')
    if (sliders.length > 0) {
      fireEvent.change(sliders[0], { target: { value: '8' } })
    }

    // Continue to SJT
    const softSkillsNextButton = screen.getByRole('button', { name: /continuar para julgamento situacional/i })
    await user.click(softSkillsNextButton)

    await waitFor(() => {
      expect(screen.getByText(/julgamento situacional/i)).toBeInTheDocument()
    })

    // State should be maintained throughout navigation
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/assessment',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('disc_results')
      })
    )
  })

  it('should handle history viewing flow', async () => {
    // Mock existing assessments
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/assessments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            assessments: [{
              id: 'completed-assessment',
              type: 'complete',
              status: 'completed',
              created_at: '2025-01-01T00:00:00Z',
              completed_at: '2025-01-01T01:00:00Z'
            }]
          })
        })
      }
      if (url.includes('/api/assessment') && !url.includes('assessments')) {
        return Promise.resolve({ ok: false, status: 404 })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })

    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    )

    // Navigate to auth screen
    const startButton = screen.getByRole('button', { name: /começar avaliação/i })
    await user.click(startButton)

    // If already authenticated, should see history option
    await waitFor(() => {
      if (screen.queryByRole('button', { name: /ver histórico/i })) {
        const historyButton = screen.getByRole('button', { name: /ver histórico/i })
        fireEvent.click(historyButton)
      }
    })

    // Should show assessment history
    await waitFor(() => {
      expect(screen.getByText(/histórico de avaliações/i)).toBeInTheDocument()
    })

    // Should show the completed assessment
    await waitFor(() => {
      expect(screen.getByText(/avaliação completa/i)).toBeInTheDocument()
      expect(screen.getByText(/concluída/i)).toBeInTheDocument()
    })
  })
})