import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssessmentDetailView } from '../assessment-detail-view'
import { Assessment, DiscResults, SoftSkillsResults, SjtResults } from '@/lib/supabase/types'

// Mock global fetch
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Mock date-fns for consistent test results
jest.mock('date-fns', () => ({
  format: jest.fn(() => '15/01/2024 às 10:00'),
}))

const mockAssessmentBase = {
  id: 'test-assessment-id',
  user_id: 'test-user-id',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T11:30:00Z',
  completed_at: '2024-01-15T11:30:00Z',
  status: 'completed' as const,
}

const mockDiscAssessment: Assessment = {
  ...mockAssessmentBase,
  type: 'disc',
  disc_results: {
    D: 25,
    I: 15,
    S: 20,
    C: 10,
  } as DiscResults,
  soft_skills_results: null,
  sjt_results: null,
}

const mockSoftSkillsAssessment: Assessment = {
  ...mockAssessmentBase,
  type: 'soft_skills',
  disc_results: null,
  soft_skills_results: {
    comunicacao: 85,
    lideranca: 75,
    trabalho_equipe: 90,
    adaptabilidade: 70,
    resolucao_problemas: 80,
    pensamento_critico: 65,
    gestao_tempo: 55,
    inteligencia_emocional: 88,
  } as SoftSkillsResults,
  sjt_results: null,
}

const mockSjtAssessment: Assessment = {
  ...mockAssessmentBase,
  type: 'sjt',
  disc_results: null,
  soft_skills_results: null,
  sjt_results: [0.8, 0.6, 0.9, 0.7, 0.5] as SjtResults,
}

const mockInProgressAssessment: Assessment = {
  ...mockAssessmentBase,
  type: 'complete',
  status: 'in_progress',
  completed_at: null,
  disc_results: null,
  soft_skills_results: null,
  sjt_results: null,
}

describe('AssessmentDetailView', () => {
  const mockOnClose = jest.fn()
  const mockOnExport = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock body style for modal behavior
    Object.defineProperty(document.body, 'style', {
      writable: true,
      value: { overflow: 'unset' },
    })
  })

  afterEach(() => {
    document.body.style.overflow = 'unset'
  })

  describe('Modal behavior', () => {
    it('should not render when isOpen is false', () => {
      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={false}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      expect(screen.queryByText('Detalhes da Avaliação')).not.toBeInTheDocument()
    })

    it('should render modal when isOpen is true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDiscAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      expect(screen.getByText('Detalhes da Avaliação')).toBeInTheDocument()
    })

    it('should close modal when backdrop is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDiscAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      const backdrop = document.querySelector('.absolute.inset-0.bg-black\\/50')
      expect(backdrop).toBeInTheDocument()
      
      fireEvent.click(backdrop!)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close modal when X button is clicked', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDiscAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      const closeButton = screen.getByRole('button', { name: '' }) // X button has no text
      await user.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close modal when ESC key is pressed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDiscAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should lock body overflow when modal is open', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDiscAssessment),
      } as any)

      const { rerender } = render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      expect(document.body.style.overflow).toBe('hidden')

      rerender(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={false}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      expect(document.body.style.overflow).toBe('unset')
    })
  })

  describe('Data rendering for different assessment types', () => {
    it('should render mini-disc assessment type correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDiscAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      await waitFor(() => {
        expect(screen.getAllByText('DISC')[0]).toBeInTheDocument()
        expect(screen.getByText('Resultados DISC')).toBeInTheDocument()
        expect(screen.getByText('Perfil comportamental baseado no método DISC')).toBeInTheDocument()
      })

      // Check DISC dimensions
      expect(screen.getByText('Dominância')).toBeInTheDocument()
      expect(screen.getByText('Influência')).toBeInTheDocument()
      expect(screen.getByText('Estabilidade')).toBeInTheDocument()
      expect(screen.getByText('Conformidade')).toBeInTheDocument()

      // Check score values
      expect(screen.getByText('25 pontos')).toBeInTheDocument()
      expect(screen.getByText('15 pontos')).toBeInTheDocument()
      expect(screen.getByText('20 pontos')).toBeInTheDocument()
      expect(screen.getByText('10 pontos')).toBeInTheDocument()

      // Check interpretation section
      expect(screen.getByText('Interpretação do Perfil')).toBeInTheDocument()
    })

    it('should render soft-skills assessment type correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSoftSkillsAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      await waitFor(() => {
        expect(screen.getAllByText('Soft Skills')[0]).toBeInTheDocument()
        expect(screen.getByText('Resultados Soft Skills')).toBeInTheDocument()
        expect(screen.getByText('Competências comportamentais e interpessoais')).toBeInTheDocument()
      })

      // Check skill labels
      expect(screen.getByText('Comunicação')).toBeInTheDocument()
      expect(screen.getByText('Liderança')).toBeInTheDocument()
      expect(screen.getByText('Trabalho em Equipe')).toBeInTheDocument()
      expect(screen.getByText('Adaptabilidade')).toBeInTheDocument()

      // Check analysis sections
      expect(screen.getByText('Pontos Fortes')).toBeInTheDocument()
      expect(screen.getByText('Áreas de Melhoria')).toBeInTheDocument()
    })

    it('should render SJT assessment type correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSjtAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      await waitFor(() => {
        expect(screen.getAllByText('Julgamento Situacional')[0]).toBeInTheDocument()
        expect(screen.getByText('Resultados SJT')).toBeInTheDocument()
        expect(screen.getByText('Julgamento Situacional - Respostas e análise')).toBeInTheDocument()
      })

      // Check overall performance
      expect(screen.getAllByText('70%')[0]).toBeInTheDocument() // (0.8+0.6+0.9+0.7+0.5)/5 * 100 = 70%
      expect(screen.getByText('3.5 de 5 respostas alinhadas com melhores práticas')).toBeInTheDocument()

      // Check question breakdown
      expect(screen.getByText('Detalhamento por Questão')).toBeInTheDocument()
      expect(screen.getByText('Cenário 1')).toBeInTheDocument()
      expect(screen.getByText('Cenário 2')).toBeInTheDocument()
      expect(screen.getByText('Cenário 3')).toBeInTheDocument()
      expect(screen.getByText('Cenário 4')).toBeInTheDocument()
      expect(screen.getByText('Cenário 5')).toBeInTheDocument()

      // Check performance analysis
      expect(screen.getByText('Análise de Performance')).toBeInTheDocument()
    })

    it('should render in-progress assessment correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockInProgressAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      await waitFor(() => {
        expect(screen.getAllByText('Avaliação Completa')[0]).toBeInTheDocument()
        expect(screen.getByText('Avaliação em Andamento')).toBeInTheDocument()
        expect(screen.getByText('Esta avaliação ainda não foi concluída. Os resultados serão exibidos após a finalização.')).toBeInTheDocument()
        expect(screen.getByText('Continuar Avaliação')).toBeInTheDocument()
      })
    })
  })

  describe('Export button functionality', () => {
    it('should show export button for completed assessments', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDiscAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument()
      })
    })

    it('should call onExport when export button is clicked', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDiscAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument()
      })

      const exportButton = screen.getByText('Exportar')
      await user.click(exportButton)

      expect(mockOnExport).toHaveBeenCalledWith('test-assessment-id')
    })

    it('should not show export button when onExport is not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDiscAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          // onExport not provided
        />
      )

      await waitFor(() => {
        expect(screen.getAllByText('DISC')[0]).toBeInTheDocument()
      })

      expect(screen.queryByText('Exportar')).not.toBeInTheDocument()
    })
  })

  describe('Error handling for malformed assessment data', () => {
    it('should handle API fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument()
      })
    })

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Falha ao carregar detalhes da avaliação')).toBeInTheDocument()
      })
    })

    it('should handle malformed DISC results gracefully', async () => {
      const malformedDiscAssessment = {
        ...mockDiscAssessment,
        disc_results: { D: null, I: undefined, S: 'invalid', C: 10 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(malformedDiscAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      await waitFor(() => {
        expect(screen.getAllByText('DISC')[0]).toBeInTheDocument()
      })

      // Component should still render without crashing
      expect(screen.getByText('Resultados DISC')).toBeInTheDocument()
    })

    it('should handle empty or null assessment data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(null),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      // Should show loading state and then handle gracefully
      expect(screen.getByText('Carregando detalhes...')).toBeInTheDocument()

      await waitFor(() => {
        // Should not crash, loading should disappear
        expect(screen.queryByText('Carregando detalhes...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Loading states', () => {
    it('should show loading state while fetching data', async () => {
      // Create a promise that doesn't resolve immediately
      let resolvePromise: (value: any) => void
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValueOnce(pendingPromise)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      expect(screen.getByText('Carregando detalhes...')).toBeInTheDocument()

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDiscAssessment),
      })

      await waitFor(() => {
        expect(screen.queryByText('Carregando detalhes...')).not.toBeInTheDocument()
      })
    })

    it('should not fetch data when assessmentId is null', () => {
      render(
        <AssessmentDetailView
          assessmentId={null}
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      expect(mockFetch).not.toHaveBeenCalled()
      expect(screen.getByText('Detalhes da Avaliação')).toBeInTheDocument()
    })

    it('should not fetch data when modal is closed', () => {
      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={false}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Modal accessibility features', () => {
    it('should have proper modal structure and focus management', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDiscAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      // Check for proper modal structure
      const modal = document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0')
      expect(modal).toBeInTheDocument()

      // Check for close buttons
      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument() // X button
    })

    it('should have proper heading hierarchy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDiscAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      await waitFor(() => {
        // Main heading
        expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
      })
    })

    it('should manage focus and scroll properly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDiscAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      // Body overflow should be managed
      expect(document.body.style.overflow).toBe('hidden')
    })
  })

  describe('Duration calculation', () => {
    it('should display duration correctly for completed assessments', async () => {
      const assessmentWithDuration = {
        ...mockDiscAssessment,
        created_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T11:30:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(assessmentWithDuration),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Duração')).toBeInTheDocument()
      })
    })

    it('should not display duration for in-progress assessments', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockInProgressAssessment),
      } as any)

      render(
        <AssessmentDetailView
          assessmentId="test-id"
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Avaliação em Andamento')).toBeInTheDocument()
      })

      expect(screen.queryByText('Duração')).not.toBeInTheDocument()
    })
  })
})
