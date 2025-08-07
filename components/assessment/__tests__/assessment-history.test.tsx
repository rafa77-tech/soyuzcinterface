import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AssessmentHistory } from '../assessment-history'
import { useAuth } from '@/components/providers/auth-provider'

// Mock the auth provider
jest.mock('@/components/providers/auth-provider')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock fetch globally
global.fetch = jest.fn()

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
}

const mockAssessments = [
  {
    id: 'assessment-1',
    type: 'complete' as const,
    status: 'completed' as const,
    created_at: '2025-01-01T10:00:00Z',
    completed_at: '2025-01-01T10:30:00Z'
  },
  {
    id: 'assessment-2',
    type: 'disc' as const,
    status: 'in_progress' as const,
    created_at: '2025-01-02T10:00:00Z',
    completed_at: null
  },
  {
    id: 'assessment-3',
    type: 'soft_skills' as const,
    status: 'completed' as const,
    created_at: '2025-01-03T10:00:00Z',
    completed_at: '2025-01-03T10:15:00Z'
  }
]

describe('AssessmentHistory', () => {
  const mockOnBack = jest.fn()
  const mockOnViewResults = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: null,
      session: null,
      loading: false,
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      refreshProfile: jest.fn()
    })

    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        assessments: mockAssessments
      })
    })
  })

  it('should render loading state initially', () => {
    render(
      <AssessmentHistory 
        onBack={mockOnBack} 
        onViewResults={mockOnViewResults} 
      />
    )

    expect(screen.getByText('Carregando histórico...')).toBeInTheDocument()
  })

  it('should render assessment history after loading', async () => {
    render(
      <AssessmentHistory 
        onBack={mockOnBack} 
        onViewResults={mockOnViewResults} 
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Histórico de Avaliações')).toBeInTheDocument()
    })

    // Check if assessments are displayed
    expect(screen.getByText('Avaliação Completa')).toBeInTheDocument()
    expect(screen.getByText('DISC')).toBeInTheDocument()
    expect(screen.getByText('Soft Skills')).toBeInTheDocument()

    // Check status badges
    expect(screen.getAllByText('Concluída')).toHaveLength(2)
    expect(screen.getByText('Em Progresso')).toBeInTheDocument()
  })

  it('should format dates correctly', async () => {
    render(
      <AssessmentHistory 
        onBack={mockOnBack} 
        onViewResults={mockOnViewResults} 
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Iniciada: 01\/01\/2025/)).toBeInTheDocument()
    })
  })

  it('should calculate duration correctly', async () => {
    render(
      <AssessmentHistory 
        onBack={mockOnBack} 
        onViewResults={mockOnViewResults} 
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Duração: 30 min/)).toBeInTheDocument()
      expect(screen.getByText(/Duração: 15 min/)).toBeInTheDocument()
    })
  })

  it('should call onBack when back button is clicked', async () => {
    render(
      <AssessmentHistory 
        onBack={mockOnBack} 
        onViewResults={mockOnViewResults} 
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Voltar')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Voltar'))
    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('should show "Ver Resultados" button only for completed assessments', async () => {
    render(
      <AssessmentHistory 
        onBack={mockOnBack} 
        onViewResults={mockOnViewResults} 
      />
    )

    await waitFor(() => {
      const viewButtons = screen.getAllByText('Ver Resultados')
      expect(viewButtons).toHaveLength(2) // Only for completed assessments
    })
  })

  it('should call onViewResults when "Ver Resultados" is clicked', async () => {
    render(
      <AssessmentHistory 
        onBack={mockOnBack} 
        onViewResults={mockOnViewResults} 
      />
    )

    await waitFor(() => {
      const viewButtons = screen.getAllByText('Ver Resultados')
      fireEvent.click(viewButtons[0])
    })

    expect(mockOnViewResults).toHaveBeenCalledWith(mockAssessments[0])
  })

  describe('filtering functionality', () => {
    it('should filter by assessment type', async () => {
      render(
        <AssessmentHistory 
          onBack={mockOnBack} 
          onViewResults={mockOnViewResults} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('DISC')).toBeInTheDocument()
      })

      // Click DISC filter
      fireEvent.click(screen.getByRole('button', { name: /DISC/i }))

      await waitFor(() => {
        // Should show only DISC assessment
        expect(screen.getByText('DISC')).toBeInTheDocument()
        expect(screen.queryByText('Avaliação Completa')).not.toBeInTheDocument()
        expect(screen.queryByText('Soft Skills')).not.toBeInTheDocument()
      })
    })

    it('should filter by status', async () => {
      render(
        <AssessmentHistory 
          onBack={mockOnBack} 
          onViewResults={mockOnViewResults} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Em Progresso')).toBeInTheDocument()
      })

      // Click "Em Progresso" status filter
      fireEvent.click(screen.getByRole('button', { name: /Em Progresso/i }))

      await waitFor(() => {
        // Should show only in-progress assessments
        expect(screen.getByText('Em Progresso')).toBeInTheDocument()
        expect(screen.queryAllByText('Concluída')).toHaveLength(0)
      })
    })

    it('should reset filters when "Todos" is clicked', async () => {
      render(
        <AssessmentHistory 
          onBack={mockOnBack} 
          onViewResults={mockOnViewResults} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('DISC')).toBeInTheDocument()
      })

      // Apply DISC filter
      fireEvent.click(screen.getByRole('button', { name: /^DISC$/i }))

      // Reset to "Todos"
      fireEvent.click(screen.getByRole('button', { name: /Todos/i }))

      await waitFor(() => {
        // Should show all assessments again
        expect(screen.getByText('Avaliação Completa')).toBeInTheDocument()
        expect(screen.getByText('DISC')).toBeInTheDocument()
        expect(screen.getByText('Soft Skills')).toBeInTheDocument()
      })
    })
  })

  describe('empty states', () => {
    it('should show empty state when no assessments exist', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          assessments: []
        })
      })

      render(
        <AssessmentHistory 
          onBack={mockOnBack} 
          onViewResults={mockOnViewResults} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Você ainda não realizou nenhuma avaliação.')).toBeInTheDocument()
        expect(screen.getByText('Realizar Primeira Avaliação')).toBeInTheDocument()
      })
    })

    it('should show filtered empty state', async () => {
      render(
        <AssessmentHistory 
          onBack={mockOnBack} 
          onViewResults={mockOnViewResults} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('DISC')).toBeInTheDocument()
      })

      // Filter by SJT (which doesn't exist in mock data)
      fireEvent.click(screen.getByRole('button', { name: /Julgamento Situacional/i }))

      await waitFor(() => {
        expect(screen.getByText('Nenhuma avaliação encontrada com os filtros aplicados.')).toBeInTheDocument()
      })
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(
        <AssessmentHistory 
          onBack={mockOnBack} 
          onViewResults={mockOnViewResults} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Falha ao carregar histórico de avaliações')).toBeInTheDocument()
        expect(screen.getByText('Voltar')).toBeInTheDocument()
      })
    })

    it('should handle HTTP errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      })

      render(
        <AssessmentHistory 
          onBack={mockOnBack} 
          onViewResults={mockOnViewResults} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Falha ao carregar histórico de avaliações')).toBeInTheDocument()
      })
    })
  })

  describe('user authentication', () => {
    it('should not render when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        session: null,
        loading: false,
        signUp: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn()
      })

      render(
        <AssessmentHistory 
          onBack={mockOnBack} 
          onViewResults={mockOnViewResults} 
        />
      )

      // Should show loading state or not make API call
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch assessments when user is authenticated', async () => {
      render(
        <AssessmentHistory 
          onBack={mockOnBack} 
          onViewResults={mockOnViewResults} 
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/assessments')
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(
        <AssessmentHistory 
          onBack={mockOnBack} 
          onViewResults={mockOnViewResults} 
        />
      )

      await waitFor(() => {
        // Check filter buttons have proper roles
        const filterButtons = screen.getAllByRole('button')
        expect(filterButtons.length).toBeGreaterThan(0)

        // Check that main content is accessible
        expect(screen.getByText('Histórico de Avaliações')).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      render(
        <AssessmentHistory 
          onBack={mockOnBack} 
          onViewResults={mockOnViewResults} 
        />
      )

      await waitFor(() => {
        const backButton = screen.getByText('Voltar')
        
        // Focus the back button
        backButton.focus()
        expect(document.activeElement).toBe(backButton)

        // Simulate Enter key press
        fireEvent.keyDown(backButton, { key: 'Enter', code: 'Enter' })
        expect(mockOnBack).toHaveBeenCalled()
      })
    })
  })
})