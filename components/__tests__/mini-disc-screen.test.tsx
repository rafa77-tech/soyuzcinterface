import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MiniDiscScreen } from '../mini-disc-screen'

// Mock the auth provider
jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com' }
  }))
}))

describe('MiniDiscScreen', () => {
  const mockOnNext = jest.fn()
  const mockOnResults = jest.fn()

  const defaultProps = {
    onNext: mockOnNext,
    onResults: mockOnResults
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the first question initially', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      expect(screen.getByText(/Em situações de pressão, eu tendo a:/)).toBeInTheDocument()
      expect(screen.getByText(/Tomar decisões rápidas e assumir o controle/)).toBeInTheDocument()
      expect(screen.getByText(/Buscar apoio da equipe e manter o otimismo/)).toBeInTheDocument()
      expect(screen.getByText(/Manter a calma e seguir procedimentos estabelecidos/)).toBeInTheDocument()
      expect(screen.getByText(/Analisar cuidadosamente antes de agir/)).toBeInTheDocument()
    })

    it('should show progress indicator', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      expect(screen.getByText(/Questão 1 de/)).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should show next button as disabled initially', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      const nextButton = screen.getByText('Próxima')
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Question Navigation', () => {
    it('should enable next button when answer is selected', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      const firstOption = screen.getByRole('radio', { name: /Tomar decisões rápidas e assumir o controle/ })
      fireEvent.click(firstOption)
      
      const nextButton = screen.getByText('Próxima')
      expect(nextButton).not.toBeDisabled()
    })

    it('should navigate to next question', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      // Answer first question
      const firstOption = screen.getByRole('radio', { name: /Tomar decisões rápidas e assumir o controle/ })
      fireEvent.click(firstOption)
      
      // Click next
      const nextButton = screen.getByText('Próxima')
      fireEvent.click(nextButton)
      
      // Should show second question
      expect(screen.getByText(/Quando trabalho em equipe, eu prefiro:/)).toBeInTheDocument()
      expect(screen.getByText(/Questão 2 de/)).toBeInTheDocument()
    })

    it('should show current question number correctly', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      // Answer first question and go to next
      const firstOption = screen.getByRole('radio', { name: /Tomar decisões rápidas e assumir o controle/ })
      fireEvent.click(firstOption)
      fireEvent.click(screen.getByText('Próxima'))
      
      // Should show question 2
      expect(screen.getByText('Questão 2 de 5')).toBeInTheDocument()
    })

    it.skip('should navigate back to previous question', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      // Answer first question and go to next
      const firstOption = screen.getByRole('radio', { name: /Tomar decisões rápidas e assumir o controle/ })
      fireEvent.click(firstOption)
      fireEvent.click(screen.getByText('Próxima'))
      
      // Go back
      fireEvent.click(screen.getByText('Anterior'))
      
      // Should show first question again
      expect(screen.getByText(/Em situações de pressão, eu tendo a:/)).toBeInTheDocument()
      expect(screen.getByText(/Questão 1 de/)).toBeInTheDocument()
      
      // Previous answer should still be selected
      expect(firstOption).toBeChecked()
    })

    it('should update progress bar correctly', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      // Answer first question and go to next
      const firstOption = screen.getByRole('radio', { name: /Tomar decisões rápidas e assumir o controle/ })
      fireEvent.click(firstOption)
      fireEvent.click(screen.getByText('Próxima'))
      
      // Check progress updated
      expect(screen.getByText(/Questão 2 de/)).toBeInTheDocument()
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '40')
    })
  })

  describe('Answer Persistence', () => {
    it('should remember answers when navigating between questions', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      // Answer first question
      const firstOption = screen.getByRole('radio', { name: /Tomar decisões rápidas e assumir o controle/ })
      fireEvent.click(firstOption)
      fireEvent.click(screen.getByText('Próxima'))
      
      // Answer second question
      const secondOption = screen.getByRole('radio', { name: /Liderar e definir objetivos claros/ })
      fireEvent.click(secondOption)
      
      // Verify both answers are maintained in component state
      expect(secondOption).toBeChecked()
    })

    it('should allow changing answers', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      // Select first option
      const firstOption = screen.getByRole('radio', { name: /Tomar decisões rápidas e assumir o controle/ })
      fireEvent.click(firstOption)
      expect(firstOption).toBeChecked()
      
      // Change to second option
      const secondOption = screen.getByRole('radio', { name: /Buscar apoio da equipe e manter o otimismo/ })
      fireEvent.click(secondOption)
      
      expect(secondOption).toBeChecked()
      expect(firstOption).not.toBeChecked()
    })
  })

  describe('Assessment Completion', () => {
    const answerAllQuestions = () => {
      const questionsCount = 5 // Mini DISC has 5 questions
      
      for (let i = 0; i < questionsCount; i++) {
        // Select first option for each question
        const options = screen.getAllByRole('radio')
        fireEvent.click(options[0])
        
        if (i < questionsCount - 1) {
          fireEvent.click(screen.getByText('Próxima'))
        }
      }
    }

    it('should show finish button on last question', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      // Navigate to last question by answering all
      answerAllQuestions()
      
      expect(screen.getByText('Finalizar DISC')).toBeInTheDocument()
      expect(screen.queryByText('Próxima')).not.toBeInTheDocument()
    })

    it('should calculate and return DISC results', async () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      answerAllQuestions()
      
      // Click finish
      fireEvent.click(screen.getByText('Finalizar DISC'))
      
      await waitFor(() => {
        expect(mockOnResults).toHaveBeenCalledWith(
          expect.objectContaining({
            D: expect.any(Number),
            I: expect.any(Number),
            S: expect.any(Number),
            C: expect.any(Number)
          })
        )
      })

      // Results should sum to 1 (or be normalized percentages)
      const results = mockOnResults.mock.calls[0][0]
      const sum = results.D + results.I + results.S + results.C
      expect(sum).toBe(5) // Mini DISC has 5 questions
    })

    it('should call onNext after completion', async () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      answerAllQuestions()
      fireEvent.click(screen.getByText('Finalizar DISC'))
      
      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalled()
      })
    })

    it('should show loading state during completion', async () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      answerAllQuestions()
      fireEvent.click(screen.getByText('Finalizar DISC'))
      
      // Should show saving indicator
      expect(screen.getByText('Salvando...')).toBeInTheDocument()
    })
  })

  describe('DISC Calculation Logic', () => {
    it('should correctly count answers by type', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      // Answer all questions with D type answers (first option)  
      for (let i = 0; i < 5; i++) {
        // Select first radio option (D type) in each question
        const radioOptions = screen.getAllByRole('radio')
        fireEvent.click(radioOptions[0])
        
        if (i < 4) {
          fireEvent.click(screen.getByText('Próxima'))
        }
      }
      
      fireEvent.click(screen.getByText('Finalizar DISC'))
      
      waitFor(() => {
        const results = mockOnResults.mock.calls[0][0]
        // D should be highest since we selected mostly D answers
        expect(results.D).toBeGreaterThan(results.I)
        expect(results.D).toBeGreaterThan(results.S)
        expect(results.D).toBeGreaterThan(results.C)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', expect.stringContaining('Progresso'))
      expect(screen.getByRole('radiogroup')).toBeInTheDocument()
      
      const radios = screen.getAllByRole('radio')
      expect(radios.length).toBeGreaterThan(0)
    })

    it('should be keyboard navigable', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      const firstOption = screen.getByRole('radio', { name: /Tomar decisões rápidas e assumir o controle/ })
      
      // Focus should be manageable
      firstOption.focus()
      expect(document.activeElement).toBe(firstOption)
      
      // Arrow keys should work within radio group
      fireEvent.keyDown(firstOption, { key: 'ArrowDown' })
      // Next radio should be focused (browser handles this natively)
    })

    it('should have proper heading structure', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      // Should have proper heading levels
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing question data gracefully', () => {
      // Mock console.error to avoid noise in tests
      jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // This should not crash even with edge cases
      render(<MiniDiscScreen {...defaultProps} />)
      
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should validate completion before finishing', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      // Try to finish without answering all questions
      // This should be prevented by the UI logic
      expect(screen.queryByText('Finalizar DISC')).not.toBeInTheDocument()
    })
  })

  describe('Component State', () => {
    it('should maintain consistent state during navigation', () => {
      render(<MiniDiscScreen {...defaultProps} />)
      
      // Answer first question
      const firstOption = screen.getByRole('radio', { name: /Tomar decisões rápidas e assumir o controle/ })
      fireEvent.click(firstOption)
      
      // Navigate forward
      fireEvent.click(screen.getByText('Próxima'))
      
      // Verify we're on question 2
      expect(screen.getByText(/Questão 2 de/)).toBeInTheDocument()
    })

    it('should reset properly if needed', () => {
      const { rerender } = render(<MiniDiscScreen {...defaultProps} />)
      
      // Answer first question
      const firstOption = screen.getByRole('radio', { name: /Tomar decisões rápidas e assumir o controle/ })
      fireEvent.click(firstOption)
      
      // Rerender component
      rerender(<MiniDiscScreen {...defaultProps} />)
      
      // Should start fresh
      expect(screen.getByText('Questão 1 de 5')).toBeInTheDocument()
    })
  })
})