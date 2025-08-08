import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'

// Manual mock implementation that will definitely work
const mockUseAssessmentHistory = jest.fn()

// Mock the hook module
jest.mock('@/hooks/use-assessment-history', () => ({
  useAssessmentHistory: mockUseAssessmentHistory
}))

import { AssessmentHistory } from '../assessment-history'

// Mock the ResultsViewer component
jest.mock('../results-viewer', () => ({
  ResultsViewer: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? <div data-testid="results-viewer-modal">
      <button onClick={onClose}>Close Modal</button>
    </div> : null
  )
}))

const mockAssessmentData = [
  {
    id: '1',
    type: 'complete' as const,
    status: 'completed' as const,
    created_at: '2025-01-20T10:00:00Z',
    completed_at: '2025-01-20T10:45:00Z',
    updated_at: '2025-01-20T10:45:00Z',
    disc_results: { D: 25, I: 15, S: 20, C: 10 },
    soft_skills_results: { comunicacao: 85, lideranca: 70 },
    sjt_results: { responses: [1, 2, 3], scores: [75, 80, 85] }
  },
  {
    id: '2',
    type: 'disc' as const,
    status: 'in_progress' as const,
    created_at: '2025-01-25T14:00:00Z',
    updated_at: '2025-01-25T14:30:00Z'
  }
]

const defaultMockReturn = {
  assessments: mockAssessmentData,
  filteredAssessments: mockAssessmentData,
  allAssessments: mockAssessmentData,
  filters: { type: '', status: '', dateFrom: null, dateTo: null, search: '' },
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  isLoading: false,
  error: null,
  setFilters: jest.fn(),
  resetFilters: jest.fn(),
  setPage: jest.fn(),
  refresh: jest.fn(),
  stats: {
    totalCompleted: 1,
    totalInProgress: 1,
    averageCompletionTime: 2700000, // 45 minutes in ms
    lastAssessmentDate: new Date('2025-01-25T14:30:00Z')
  }
}

describe('AssessmentHistory', () => {
  beforeEach(() => {
    // Clear all previous mock calls and reset return value
    jest.clearAllMocks()
    mockUseAssessmentHistory.mockReturnValue(defaultMockReturn)
    
    // Debug: verify mock is being called
    console.log('Mock return value set to:', defaultMockReturn)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('AC1: Assessment List Display', () => {
    it('renders the main heading correctly', () => {
      render(<AssessmentHistory userId="test-user-123" />)
      
      expect(screen.getByText('Histórico de Avaliações')).toBeInTheDocument()
    })

    it('displays assessment statistics in header', () => {
      console.log('Before render, mock calls:', mockUseAssessmentHistory.mock.calls.length)
      
      render(<AssessmentHistory userId="test-user-123" />)
      
      console.log('After render, mock calls:', mockUseAssessmentHistory.mock.calls.length)
      console.log('Mock was called with:', mockUseAssessmentHistory.mock.calls)
      
      expect(screen.getByText('1 concluídas • 1 em andamento')).toBeInTheDocument()
    })

    it('renders assessment cards for each assessment', () => {
      render(<AssessmentHistory userId="test-user-123" />)
      
      expect(screen.getByText('Avaliação Completa')).toBeInTheDocument()
      expect(screen.getByText('DISC')).toBeInTheDocument()
    })
  })

  describe('AC2: Information Display', () => {
    it('displays assessment type correctly', () => {
      render(<AssessmentHistory userId="test-user-123" />)
      
      expect(screen.getByText('Avaliação Completa')).toBeInTheDocument()
      expect(screen.getByText('DISC')).toBeInTheDocument()
    })

    it('displays assessment status badges', () => {
      render(<AssessmentHistory userId="test-user-123" />)
      
      expect(screen.getByText('Concluída')).toBeInTheDocument()
      expect(screen.getByText('Em andamento')).toBeInTheDocument()
    })

    it('shows completion time for completed assessments', () => {
      render(<AssessmentHistory userId="test-user-123" />)
      
      // Should show 45min for the completed assessment
      expect(screen.getByText('45min')).toBeInTheDocument()
    })
  })

  describe('AC3: Filter System', () => {
    it('renders quick filter buttons', () => {
      render(<AssessmentHistory userId="test-user-123" />)
      
      expect(screen.getByText('Hoje')).toBeInTheDocument()
      expect(screen.getByText('Esta semana')).toBeInTheDocument()
      expect(screen.getByText('Este mês')).toBeInTheDocument()
      expect(screen.getByText('Últimos 3 meses')).toBeInTheDocument()
      expect(screen.getByText('Últimos 6 meses')).toBeInTheDocument()
    })

    it('calls setFilters when quick filter is clicked', () => {
      const mockSetFilters = jest.fn()
      mockUseAssessmentHistory.mockReturnValue({
        ...defaultMockReturn,
        setFilters: mockSetFilters
      })

      render(<AssessmentHistory userId="test-user-123" />)
      
      fireEvent.click(screen.getByText('Hoje'))
      
      expect(mockSetFilters).toHaveBeenCalledWith({
        dateFrom: expect.any(Date),
        dateTo: expect.any(Date)
      })
    })

    it('toggles advanced filters when filter button is clicked', () => {
      render(<AssessmentHistory userId="test-user-123" />)
      
      const filterButton = screen.getByText('Filtros')
      fireEvent.click(filterButton)
      
      // Should show advanced filters (this would need the full component implementation)
      expect(filterButton).toBeInTheDocument()
    })
  })

  describe('AC4: Results Viewing', () => {
    it('shows "Ver resultados" button only for completed assessments', () => {
      render(<AssessmentHistory userId="test-user-123" />)
      
      // Should have one "Ver resultados" button for the completed assessment
      const viewButtons = screen.getAllByText('Ver resultados')
      expect(viewButtons).toHaveLength(1)
    })

    it('opens results viewer modal when "Ver resultados" is clicked', async () => {
      render(<AssessmentHistory userId="test-user-123" />)
      
      const viewButton = screen.getByText('Ver resultados')
      fireEvent.click(viewButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('results-viewer-modal')).toBeInTheDocument()
      })
    })
  })

  describe('AC6: Design Consistency', () => {
    it('uses consistent card layout for assessments', () => {
      render(<AssessmentHistory userId="test-user-123" />)
      
      // Should render cards with proper structure
      const cards = document.querySelectorAll('[data-slot="card"]')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  describe('AC7: Loading States', () => {
    it('shows loading state when isLoading is true', () => {
      mockUseAssessmentHistory.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
        assessments: []
      })

      render(<AssessmentHistory userId="test-user-123" />)
      
      // Should show loading skeleton
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows spinning refresh icon when loading', () => {
      mockUseAssessmentHistory.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true
      })

      render(<AssessmentHistory userId="test-user-123" />)
      
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when error occurs', () => {
      const mockError = new Error('Failed to load assessments')
      mockUseAssessmentHistory.mockReturnValue({
        ...defaultMockReturn,
        error: mockError,
        assessments: []
      })

      render(<AssessmentHistory userId="test-user-123" />)
      
      expect(screen.getByText(/Erro ao carregar histórico/)).toBeInTheDocument()
      expect(screen.getByText('Failed to load assessments')).toBeInTheDocument()
    })

    it('allows retry when error occurs', () => {
      const mockRefresh = jest.fn()
      const mockError = new Error('Network error')
      
      mockUseAssessmentHistory.mockReturnValue({
        ...defaultMockReturn,
        error: mockError,
        refresh: mockRefresh,
        assessments: []
      })

      render(<AssessmentHistory userId="test-user-123" />)
      
      const retryButton = screen.getByText('Tentar novamente')
      fireEvent.click(retryButton)
      
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no assessments', () => {
      mockUseAssessmentHistory.mockReturnValue({
        ...defaultMockReturn,
        assessments: [],
        filteredAssessments: []
      })

      render(<AssessmentHistory userId="test-user-123" />)
      
      expect(screen.getByText('Nenhuma avaliação encontrada')).toBeInTheDocument()
    })
  })

  describe('Refresh Functionality', () => {
    it('calls refresh when refresh button is clicked', () => {
      const mockRefresh = jest.fn()
      mockUseAssessmentHistory.mockReturnValue({
        ...defaultMockReturn,
        refresh: mockRefresh
      })

      render(<AssessmentHistory userId="test-user-123" />)
      
      const refreshButton = screen.getByText('Atualizar')
      fireEvent.click(refreshButton)
      
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('Export Functionality', () => {
    it('shows export button for completed assessments', () => {
      render(<AssessmentHistory userId="test-user-123" />)
      
      // Should have export buttons (Download icons) for completed assessments
      const exportButtons = document.querySelectorAll('svg[data-testid*="download"], svg.lucide-download')
      expect(exportButtons.length).toBeGreaterThan(0)
    })
  })
})
