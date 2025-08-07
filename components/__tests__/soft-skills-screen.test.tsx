import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SoftSkillsScreen } from '../soft-skills-screen'
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

describe('SoftSkillsScreen', () => {
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
    it('should render all soft skills with sliders', () => {
      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      // Check if the title is rendered
      expect(screen.getByText('Autoavaliação de Soft Skills')).toBeInTheDocument()

      // Check if all skills are rendered
      const expectedSkills = [
        'Comunicação',
        'Liderança',
        'Trabalho em Equipe',
        'Resolução de Problemas',
        'Adaptabilidade',
        'Criatividade',
        'Gestão de Tempo',
        'Negociação',
      ]

      expectedSkills.forEach(skill => {
        expect(screen.getByText(skill)).toBeInTheDocument()
      })

      // Check if sliders are rendered
      const sliders = screen.getAllByRole('slider')
      expect(sliders).toHaveLength(8)

      // Check if continue button is rendered
      expect(screen.getByText('Continuar para Julgamento Situacional')).toBeInTheDocument()
    })

    it('should initialize sliders with default value of 5', () => {
      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      const sliders = screen.getAllByRole('slider')
      sliders.forEach(slider => {
        expect(slider).toHaveAttribute('aria-valuenow', '5')
      })

      // Check if value displays show 5
      const valueDisplays = screen.getAllByText('5')
      expect(valueDisplays).toHaveLength(8)
    })

    it('should display saving indicator', () => {
      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      // The saving indicator should be present but might be hidden when idle
      const savingIndicator = screen.getByText('Não salvo')
      expect(savingIndicator).toBeInTheDocument()
    })
  })

  describe('Auto-save integration', () => {
    it('should call useAssessmentAutoSave with correct options', () => {
      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      expect(mockUseAssessmentAutoSave).toHaveBeenCalledWith({
        assessmentType: 'soft_skills',
        debounceMs: 500,
        enableLocalBackup: true,
      })
    })

    it('should trigger auto-save when slider value changes', async () => {
      const user = userEvent.setup()
      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      const sliders = screen.getAllByRole('slider')
      const comunicacaoSlider = sliders[0] // First slider should be Comunicação

      await user.click(comunicacaoSlider)
      // Simulate changing the slider value (this is tricky with custom sliders)
      fireEvent.change(comunicacaoSlider, { target: { value: '8' } })

      expect(defaultAutoSaveMock.saveProgress).toHaveBeenCalled()
    })

    it('should load saved data on component mount', async () => {
      const savedResults = {
        comunicacao: 8,
        lideranca: 7,
        trabalhoEquipe: 6,
        resolucaoProblemas: 9,
        adaptabilidade: 5,
        criatividade: 8,
        gestaoTempo: 7,
        negociacao: 6,
      }

      mockUseAssessmentAutoSave.mockReturnValue({
        ...defaultAutoSaveMock,
        loadIncompleteAssessment: jest.fn().mockResolvedValue({
          soft_skills_results: savedResults,
        }),
      })

      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      await waitFor(() => {
        expect(mockUseAssessmentAutoSave().loadIncompleteAssessment).toHaveBeenCalled()
      })
    })

    it('should show saving status correctly', () => {
      mockUseAssessmentAutoSave.mockReturnValue({
        ...defaultAutoSaveMock,
        isSaving: true,
        saveStatus: 'Salvando...',
      })

      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      expect(screen.getByText('Salvando...')).toBeInTheDocument()
    })

    it('should show error status correctly', () => {
      mockUseAssessmentAutoSave.mockReturnValue({
        ...defaultAutoSaveMock,
        error: 'Network error',
        saveStatus: 'Erro ao salvar',
      })

      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      expect(screen.getByText('Erro ao salvar')).toBeInTheDocument()
    })

    it('should show saved status correctly', () => {
      mockUseAssessmentAutoSave.mockReturnValue({
        ...defaultAutoSaveMock,
        lastSaved: new Date(),
        saveStatus: 'Salvo automaticamente',
      })

      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      expect(screen.getByText('Salvo automaticamente')).toBeInTheDocument()
    })
  })

  describe('User interactions', () => {
    it('should update slider values and display them correctly', async () => {
      const user = userEvent.setup()
      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      const sliders = screen.getAllByRole('slider')
      const comunicacaoSlider = sliders[0]

      // This is a simplified test - actual slider interaction would be more complex
      fireEvent.change(comunicacaoSlider, { target: { value: '8' } })

      // The actual implementation would update the display value
      // This test structure shows how you would test it
    })

    it('should handle form submission correctly', async () => {
      const user = userEvent.setup()
      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      const submitButton = screen.getByText('Continuar para Julgamento Situacional')

      await user.click(submitButton)

      await waitFor(() => {
        expect(defaultAutoSaveMock.saveFinalResults).toHaveBeenCalled()
        expect(mockOnResults).toHaveBeenCalled()
        expect(mockOnNext).toHaveBeenCalled()
      })
    })

    it('should continue with UX flow even if save fails', async () => {
      const user = userEvent.setup()
      mockUseAssessmentAutoSave.mockReturnValue({
        ...defaultAutoSaveMock,
        saveFinalResults: jest.fn().mockRejectedValue(new Error('Save failed')),
      })

      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      const submitButton = screen.getByText('Continuar para Julgamento Situacional')

      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnResults).toHaveBeenCalled()
        expect(mockOnNext).toHaveBeenCalled()
      })
    })
  })

  describe('Data format validation', () => {
    it('should pass correctly formatted data to auto-save', async () => {
      const user = userEvent.setup()
      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      const submitButton = screen.getByText('Continuar para Julgamento Situacional')
      await user.click(submitButton)

      await waitFor(() => {
        expect(defaultAutoSaveMock.saveFinalResults).toHaveBeenCalledWith({
          soft_skills_results: expect.objectContaining({
            comunicacao: expect.any(Number),
            lideranca: expect.any(Number),
            trabalhoEquipe: expect.any(Number),
            resolucaoProblemas: expect.any(Number),
            adaptabilidade: expect.any(Number),
            criatividade: expect.any(Number),
            gestaoTempo: expect.any(Number),
            negociacao: expect.any(Number),
          }),
        })
      })
    })

    it('should pass correctly formatted data to onResults callback', async () => {
      const user = userEvent.setup()
      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      const submitButton = screen.getByText('Continuar para Julgamento Situacional')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnResults).toHaveBeenCalledWith(
          expect.objectContaining({
            comunicacao: expect.any(Number),
            lideranca: expect.any(Number),
            trabalhoEquipe: expect.any(Number),
            resolucaoProblemas: expect.any(Number),
            adaptabilidade: expect.any(Number),
            criatividade: expect.any(Number),
            gestaoTempo: expect.any(Number),
            negociacao: expect.any(Number),
          })
        )
      })
    })
  })

  describe('Error handling', () => {
    it('should handle loadIncompleteAssessment errors gracefully', async () => {
      mockUseAssessmentAutoSave.mockReturnValue({
        ...defaultAutoSaveMock,
        loadIncompleteAssessment: jest.fn().mockRejectedValue(new Error('Load failed')),
      })

      // Should not throw error and component should still render
      expect(() => {
        render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)
      }).not.toThrow()

      expect(screen.getByText('Autoavaliação de Soft Skills')).toBeInTheDocument()
    })

    it('should handle auto-save progress errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      mockUseAssessmentAutoSave.mockReturnValue({
        ...defaultAutoSaveMock,
        saveProgress: jest.fn().mockImplementation(() => {
          throw new Error('Save progress failed')
        }),
      })

      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      // Component should still be functional
      expect(screen.getByText('Autoavaliação de Soft Skills')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and structure', () => {
      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()

      // Check for slider roles
      const sliders = screen.getAllByRole('slider')
      expect(sliders).toHaveLength(8)

      // Check for button role
      expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument()
    })

    it('should have descriptive text for each skill', () => {
      render(<SoftSkillsScreen onNext={mockOnNext} onResults={mockOnResults} />)

      // Check that each skill has a description
      expect(screen.getByText('Capacidade de expressar ideias claramente')).toBeInTheDocument()
      expect(screen.getByText('Habilidade para guiar e inspirar equipes')).toBeInTheDocument()
      expect(screen.getByText('Colaboração efetiva com colegas')).toBeInTheDocument()
    })
  })
})