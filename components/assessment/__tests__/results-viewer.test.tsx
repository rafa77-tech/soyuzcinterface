import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { jest } from '@jest/globals'

import { ResultsViewer } from '../results-viewer'
import { type AssessmentData } from '@/lib/services/assessment-service'

// Mock date-fns to avoid timezone issues in tests
jest.mock('date-fns', () => ({
  format: jest.fn(() => '27/01/2025 às 10:45'),
  ptBR: {}
}))

const mockValidAssessment: AssessmentData = {
  id: 'test-assessment-1',
  type: 'complete',
  status: 'completed',
  created_at: '2025-01-27T10:00:00Z',
  completed_at: '2025-01-27T10:45:00Z',
  updated_at: '2025-01-27T10:45:00Z',
  disc_results: { D: 25, I: 15, S: 20, C: 10 },
  soft_skills_results: { comunicacao: 85, lideranca: 70 },
  sjt_results: { responses: [1, 2, 3], scores: [75, 80, 85] }
}

const mockIncompleteAssessment = {
  id: 'test-assessment-2',
  type: 'disc',
  status: 'in_progress'
}

describe('ResultsViewer', () => {
  const mockOnClose = jest.fn()

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Valid Assessment Handling', () => {
    it('renders dialog when open with valid assessment', () => {
      render(
        <ResultsViewer
          assessment={mockValidAssessment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Resultados da Avaliação')).toBeInTheDocument()
    })

    it('displays assessment type and status in description', () => {
      render(
        <ResultsViewer
          assessment={mockValidAssessment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/Tipo: complete/)).toBeInTheDocument()
      expect(screen.getByText(/Status: completed/)).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
      render(
        <ResultsViewer
          assessment={mockValidAssessment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByText('Fechar')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not render dialog when isOpen is false', () => {
      render(
        <ResultsViewer
          assessment={mockValidAssessment}
          isOpen={false}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('Resultados da Avaliação')).not.toBeInTheDocument()
    })
  })

  describe('Invalid Assessment Handling', () => {
    it('shows error state for null assessment', () => {
      render(
        <ResultsViewer
          assessment={null}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Erro na Visualização')).toBeInTheDocument()
      expect(screen.getByText('Não foi possível carregar os resultados da avaliação.')).toBeInTheDocument()
    })

    it('shows error state for undefined assessment', () => {
      render(
        <ResultsViewer
          assessment={undefined}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Erro na Visualização')).toBeInTheDocument()
      expect(screen.getByText(/Dados da avaliação não encontrados ou incompletos/)).toBeInTheDocument()
    })

    it('shows error state for assessment without required properties', () => {
      const invalidAssessment = { someProperty: 'value' }
      
      render(
        <ResultsViewer
          assessment={invalidAssessment as any}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Erro na Visualização')).toBeInTheDocument()
    })

    it('shows error state for incomplete assessment (not completed status)', () => {
      render(
        <ResultsViewer
          assessment={mockIncompleteAssessment as any}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Erro na Visualização')).toBeInTheDocument()
    })

    it('allows closing error dialog', () => {
      render(
        <ResultsViewer
          assessment={null}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByText('Fechar')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Type Guard Validation', () => {
    it('validates assessment with all required properties', () => {
      const validAssessment = {
        id: 'test-id',
        type: 'disc',
        status: 'completed',
        created_at: '2025-01-27T10:00:00Z'
      }

      render(
        <ResultsViewer
          assessment={validAssessment as any}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Resultados da Avaliação')).toBeInTheDocument()
    })

    it('rejects assessment missing id property', () => {
      const invalidAssessment = {
        type: 'disc',
        status: 'completed'
      }

      render(
        <ResultsViewer
          assessment={invalidAssessment as any}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Erro na Visualização')).toBeInTheDocument()
    })

    it('rejects assessment missing type property', () => {
      const invalidAssessment = {
        id: 'test-id',
        status: 'completed'
      }

      render(
        <ResultsViewer
          assessment={invalidAssessment as any}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Erro na Visualização')).toBeInTheDocument()
    })

    it('rejects assessment with wrong status', () => {
      const invalidAssessment = {
        id: 'test-id',
        type: 'disc',
        status: 'in_progress'
      }

      render(
        <ResultsViewer
          assessment={invalidAssessment as any}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Erro na Visualização')).toBeInTheDocument()
    })
  })

  describe('Crash Prevention', () => {
    it('handles assessment with malformed data gracefully', () => {
      const malformedAssessment = {
        id: 'test-id',
        type: 'complete',
        status: 'completed',
        created_at: 'invalid-date',
        completed_at: null,
        disc_results: 'not-an-object'
      }

      // Should not crash, should show error state
      render(
        <ResultsViewer
          assessment={malformedAssessment as any}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Resultados da Avaliação')).toBeInTheDocument()
    })

    it('handles assessment with circular references safely', () => {
      const circularAssessment: any = {
        id: 'test-id',
        type: 'complete',
        status: 'completed'
      }
      // Create circular reference
      circularAssessment.self = circularAssessment

      // Should not crash
      render(
        <ResultsViewer
          assessment={circularAssessment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Resultados da Avaliação')).toBeInTheDocument()
    })
  })

  describe('Content Safety', () => {
    it('displays safe placeholder content for valid assessment', () => {
      render(
        <ResultsViewer
          assessment={mockValidAssessment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/Visualização de resultados implementada com proteção contra crashes/)).toBeInTheDocument()
      expect(screen.getByText(/Dados da avaliação carregados com segurança/)).toBeInTheDocument()
    })

    it('maintains consistent dialog structure for valid and invalid states', () => {
      const { rerender } = render(
        <ResultsViewer
          assessment={mockValidAssessment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      // Should have dialog with header and content
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Fechar')).toBeInTheDocument()

      // Rerender with invalid assessment
      rerender(
        <ResultsViewer
          assessment={null}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      // Should still have dialog structure
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Fechar')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper dialog role and labeling', () => {
      render(
        <ResultsViewer
          assessment={mockValidAssessment}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(screen.getByText('Resultados da Avaliação')).toBeInTheDocument()
    })

    it('provides descriptive error messages', () => {
      render(
        <ResultsViewer
          assessment={null}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/Dados da avaliação não encontrados ou incompletos/)).toBeInTheDocument()
    })
  })
})
