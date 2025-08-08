import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SJTScreen } from '../sjt-screen'
import { useAuth } from '@/components/providers/auth-provider'
import { useAssessmentAutoSave } from '@/hooks/use-assessment-autosave'

// Mock the dependencies
jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/hooks/use-assessment-autosave', () => ({
  useAssessmentAutoSave: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseAssessmentAutoSave = useAssessmentAutoSave as jest.MockedFunction<typeof useAssessmentAutoSave>

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
}

const defaultAutoSaveMock = {
  saveProgress: jest.fn(),
  saveFinalResults: jest.fn().mockResolvedValue(undefined),
  loadIncompleteAssessment: jest.fn().mockResolvedValue(null),
  isSaving: false,
  error: null,
  lastSaved: null,
  saveStatus: 'Não salvo',
  assessmentId: null,
  completeAssessment: jest.fn(),
  loadFromLocalStorage: jest.fn(),
  clearLocalBackup: jest.fn(),
}

describe('SJTScreen', () => {
  const mockOnNext = jest.fn()
  const mockOnResults = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      loading: false,
      error: null,
    })
    mockUseAssessmentAutoSave.mockReturnValue(defaultAutoSaveMock)
  })

  describe('Component rendering', () => {
    it('should render the first scenario correctly', () => {
      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      expect(screen.getByText('Julgamento Situacional')).toBeInTheDocument()
      expect(screen.getByText('1 de 3')).toBeInTheDocument()
      
      // Check if progress bar is rendered
      expect(screen.getByRole('progressbar')).toBeInTheDocument()

      // Check if the first scenario is rendered
      expect(screen.getByText(/Você está liderando um projeto importante/)).toBeInTheDocument()
      expect(screen.getByText('Qual seria sua abordagem mais efetiva?')).toBeInTheDocument()

      // Check if all options are rendered
      const radioButtons = screen.getAllByRole('radio')
      expect(radioButtons).toHaveLength(4)

      // Check if next button is rendered but disabled
      const nextButton = screen.getByText('Próximo Cenário')
      expect(nextButton).toBeInTheDocument()
      expect(nextButton).toBeDisabled()
    })

    it('should display saving indicator', () => {
      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      expect(screen.getByText('Não salvo')).toBeInTheDocument()
    })

    it('should show correct progress for each scenario', () => {
      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      // Progress bar should show ~33.33% for first scenario (1/3)
      const progressBar = screen.getByRole('progressbar')
      const progressValue = Number(progressBar.getAttribute('aria-valuenow'))
      expect(progressValue).toBeCloseTo(33.33, 2) // Use toBeCloseTo for floating point
    })
  })

  describe('Auto-save integration', () => {
    it('should call useAssessmentAutoSave with correct options', () => {
      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      expect(mockUseAssessmentAutoSave).toHaveBeenCalledWith({
        assessmentType: 'sjt',
        debounceMs: 500,
        enableLocalBackup: true,
      })
    })

    it('should load saved data on component mount', async () => {
      const savedResults = [9, 8] // Partially completed assessment - 2 of 3 scenarios done
      const mockLoadIncompleteAssessment = jest.fn().mockResolvedValue({
        sjt_results: savedResults,
      })
      
      mockUseAssessmentAutoSave.mockReturnValue({
        ...defaultAutoSaveMock,
        loadIncompleteAssessment: mockLoadIncompleteAssessment,
      })

      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      // Wait for async state updates to complete
      await waitFor(() => {
        expect(mockLoadIncompleteAssessment).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByText('3 de 3')).toBeInTheDocument()
      })
    })

    it('should trigger auto-save immediately after answer selection', async () => {
      const user = userEvent.setup()
      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      const firstOption = screen.getAllByRole('radio')[0]
      await user.click(firstOption)

      const nextButton = screen.getByText('Próximo Cenário')
      expect(nextButton).toBeEnabled()

      await user.click(nextButton)

      await waitFor(() => {
        expect(defaultAutoSaveMock.saveProgress).toHaveBeenCalledWith(
          null,
          1, // currentScenario + 1
          { sjt_results: [9] } // First option has score 9
        )
      })
    })

    it('should show different saving states correctly', () => {
      mockUseAssessmentAutoSave.mockReturnValue({
        ...defaultAutoSaveMock,
        isSaving: true,
      })

      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      expect(screen.getByText('Salvando...')).toBeInTheDocument()
    })

    it('should show error state correctly', () => {
      mockUseAssessmentAutoSave.mockReturnValue({
        ...defaultAutoSaveMock,
        error: 'Network error',
      })

      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      expect(screen.getByText('Erro ao salvar')).toBeInTheDocument()
    })

    it('should show saved state correctly', () => {
      mockUseAssessmentAutoSave.mockReturnValue({
        ...defaultAutoSaveMock,
        lastSaved: new Date(),
      })

      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      expect(screen.getByText('Salvo automaticamente')).toBeInTheDocument()
    })
  })

  describe('User flow through scenarios', () => {
    it('should navigate through all scenarios correctly', async () => {
      const user = userEvent.setup()
      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      // Answer first scenario
      await user.click(screen.getAllByRole('radio')[0])
      await user.click(screen.getByText('Próximo Cenário'))

      await waitFor(() => {
        expect(screen.getByText('2 de 3')).toBeInTheDocument()
      })

      // Answer second scenario
      await user.click(screen.getAllByRole('radio')[1])
      await user.click(screen.getByText('Próximo Cenário'))

      await waitFor(() => {
        expect(screen.getByText('3 de 3')).toBeInTheDocument()
      })

      // Answer final scenario
      await user.click(screen.getAllByRole('radio')[2])
      
      // Button should now say "Finalizar Avaliação"
      expect(screen.getByText('Finalizar Avaliação')).toBeInTheDocument()

      await user.click(screen.getByText('Finalizar Avaliação'))

      await waitFor(() => {
        expect(defaultAutoSaveMock.saveFinalResults).toHaveBeenCalledWith({
          sjt_results: [9, 7, 7] // Scores from selected options
        })
        expect(mockOnResults).toHaveBeenCalledWith([9, 7, 7])
        expect(mockOnNext).toHaveBeenCalled()
      })
    })

    it('should handle final submission even with save error', async () => {
      const user = userEvent.setup()
      mockUseAssessmentAutoSave.mockReturnValue({
        ...defaultAutoSaveMock,
        saveFinalResults: jest.fn().mockRejectedValue(new Error('Save failed')),
      })

      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      // Complete all scenarios
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getAllByRole('radio')[0])
        const button = i === 2 ? 'Finalizar Avaliação' : 'Próximo Cenário'
        await user.click(screen.getByText(button))
        
        if (i < 2) {
          await waitFor(() => {
            expect(screen.getByText(`${i + 2} de 3`)).toBeInTheDocument()
          })
        }
      }

      // Should continue with UX flow despite save error
      await waitFor(() => {
        expect(mockOnResults).toHaveBeenCalled()
        expect(mockOnNext).toHaveBeenCalled()
      })
    })

    it('should not proceed without selecting an answer', async () => {
      const user = userEvent.setup()
      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      const nextButton = screen.getByText('Próximo Cenário')
      expect(nextButton).toBeDisabled()

      // Try clicking disabled button (should not proceed)
      await user.click(nextButton)

      // Should still be on first scenario
      expect(screen.getByText('1 de 3')).toBeInTheDocument()
      expect(mockOnNext).not.toHaveBeenCalled()
    })
  })

  describe('Data format validation', () => {
    it('should save correct score values based on selected options', async () => {
      const user = userEvent.setup()
      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      // Select specific options and verify their scores are saved
      const options = screen.getAllByRole('radio')
      
      // First scenario - select second option (score: 6)
      await user.click(options[1])
      await user.click(screen.getByText('Próximo Cenário'))

      await waitFor(() => {
        expect(defaultAutoSaveMock.saveProgress).toHaveBeenCalledWith(
          null,
          1,
          { sjt_results: [6] }
        )
      })
    })

    it('should pass complete results array to final save', async () => {
      const user = userEvent.setup()
      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      // Complete all scenarios with specific selections
      const expectedScores = [9, 7, 9] // First option each time
      
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getAllByRole('radio')[0]) // Always select first option
        const button = i === 2 ? 'Finalizar Avaliação' : 'Próximo Cenário'
        await user.click(screen.getByText(button))
        
        if (i < 2) {
          await waitFor(() => {
            expect(screen.getByText(`${i + 2} de 3`)).toBeInTheDocument()
          })
        }
      }

      await waitFor(() => {
        expect(defaultAutoSaveMock.saveFinalResults).toHaveBeenCalledWith({
          sjt_results: expectedScores
        })
      })
    })
  })

  describe('Progress tracking', () => {
    it('should update progress bar correctly', async () => {
      const user = userEvent.setup()
      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      let progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '33.333333333333336') // 1/3

      // Move to second scenario
      await user.click(screen.getAllByRole('radio')[0])
      await user.click(screen.getByText('Próximo Cenário'))

      await waitFor(() => {
        progressBar = screen.getByRole('progressbar')
        expect(progressBar).toHaveAttribute('aria-valuenow', '66.66666666666667') // 2/3
      })

      // Move to final scenario
      await user.click(screen.getAllByRole('radio')[0])
      await user.click(screen.getByText('Próximo Cenário'))

      await waitFor(() => {
        progressBar = screen.getByRole('progressbar')
        expect(progressBar).toHaveAttribute('aria-valuenow', '100') // 3/3
      })
    })
  })

  describe('Error handling', () => {
    it('should handle loadIncompleteAssessment errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      mockUseAssessmentAutoSave.mockReturnValue({
        ...defaultAutoSaveMock,
        loadIncompleteAssessment: jest.fn().mockRejectedValue(new Error('Load failed')),
      })

      expect(() => {
        render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)
      }).not.toThrow()

      expect(screen.getByText('Julgamento Situacional')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should handle auto-save progress errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const user = userEvent.setup()
      
      mockUseAssessmentAutoSave.mockReturnValue({
        ...defaultAutoSaveMock,
        saveProgress: jest.fn().mockImplementation(() => {
          throw new Error('Save progress failed')
        }),
      })

      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      // Should still be able to proceed
      await user.click(screen.getAllByRole('radio')[0])
      await user.click(screen.getByText('Próximo Cenário'))

      expect(screen.getByText('2 de 3')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and structure', () => {
      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()

      // Check for radio group
      expect(screen.getByRole('radiogroup')).toBeInTheDocument()

      // Check for progress bar
      expect(screen.getByRole('progressbar')).toBeInTheDocument()

      // Check for button
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should have descriptive labels for radio options', () => {
      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      const radioButtons = screen.getAllByRole('radio')
      radioButtons.forEach(radio => {
        expect(radio).toHaveAccessibleName()
      })
    })

    it('should announce progress to screen readers', () => {
      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    })
  })

  describe('Scenario content validation', () => {
    it('should display all scenario content correctly', async () => {
      const user = userEvent.setup()
      render(<SJTScreen onNext={mockOnNext} onResults={mockOnResults} />)

      // First scenario
      expect(screen.getByText(/projeto importante com prazo apertado/)).toBeInTheDocument()
      expect(screen.getByText(/Conversar individualmente para entender/)).toBeInTheDocument()

      // Move to second scenario
      await user.click(screen.getAllByRole('radio')[0])
      await user.click(screen.getByText('Próximo Cenário'))

      await waitFor(() => {
        expect(screen.getByText(/conflito crescente entre dois colegas/)).toBeInTheDocument()
        expect(screen.getByText(/Interromper educadamente e sugerir focar/)).toBeInTheDocument()
      })

      // Move to third scenario
      await user.click(screen.getAllByRole('radio')[0])
      await user.click(screen.getByText('Próximo Cenário'))

      await waitFor(() => {
        expect(screen.getByText(/feedback negativo sobre um projeto/)).toBeInTheDocument()
        expect(screen.getByText(/Agendar uma reunião para esclarecer/)).toBeInTheDocument()
      })
    })
  })
})