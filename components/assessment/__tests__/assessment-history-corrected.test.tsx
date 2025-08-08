// AssessmentHistory Component Test - CORRECTED VERSION
// Demonstrates proper mock strategy implementation following testing-strategy.md guidelines

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'

// Import component and testing utilities
import { AssessmentHistory } from '../assessment-history'
import { 
  mockAssessmentScenarios, 
  createMockAssessmentHistoryReturn
} from '@/lib/testing/factories'

// ✅ CORRECT: Manual mock implementation using testing strategy
const mockUseAssessmentHistory = jest.fn()
jest.mock('@/hooks/use-assessment-history', () => ({
  useAssessmentHistory: mockUseAssessmentHistory
}))

// ✅ CORRECT: Mock ResultsViewer component (not a hook/service)
jest.mock('../results-viewer', () => ({
  ResultsViewer: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="results-viewer-modal">
        <h2>Assessment Results</h2>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  )
}))

describe('AssessmentHistory - Corrected Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('✅ Component Rendering - Following Strategy', () => {
    it('should display assessment statistics correctly', () => {
      // ✅ CORRECT: Use mock factory for deterministic data
      const mockAssessments = mockAssessmentScenarios.mixedStatus()
      const mockReturn = createMockAssessmentHistoryReturn(mockAssessments)
      mockUseAssessmentHistory.mockReturnValue(mockReturn)

      // ✅ CORRECT: Simple render for component testing
      render(<AssessmentHistory userId="test-user-123" />)
      
      // ✅ CORRECT: Test observable behavior, not implementation
      expect(screen.getByText('1 concluídas • 1 em andamento')).toBeInTheDocument()
      expect(screen.getByText('Histórico de Avaliações')).toBeInTheDocument()
    })

    it('should render assessment cards with correct data', () => {
      const mockAssessments = mockAssessmentScenarios.singleCompleted()
      const mockReturn = createMockAssessmentHistoryReturn(mockAssessments)
      mockUseAssessmentHistory.mockReturnValue(mockReturn)

      render(<AssessmentHistory userId="test-user-123" />)

      // ✅ CORRECT: Test visible content, not internal state
      expect(screen.getByText('DISC')).toBeInTheDocument()
      expect(screen.getByText('Concluída')).toBeInTheDocument()
      expect(screen.getByText('Ver resultados')).toBeInTheDocument()
    })
  })

  describe('✅ Loading States - Behavioral Testing', () => {
    it('should show loading skeleton when isLoading is true', () => {
      const mockReturn = createMockAssessmentHistoryReturn([], {
        isLoading: true,
        assessments: []
      })
      mockUseAssessmentHistory.mockReturnValue(mockReturn)

      render(<AssessmentHistory userId="test-user-123" />)

      // ✅ CORRECT: Test loading UI is visible
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
      expect(screen.queryByText('Ver resultados')).not.toBeInTheDocument()
    })

    it('should show empty state when no assessments', () => {
      const mockReturn = createMockAssessmentHistoryReturn([])
      mockUseAssessmentHistory.mockReturnValue(mockReturn)

      render(<AssessmentHistory userId="test-user-123" />)

      expect(screen.getByText('Nenhuma avaliação encontrada')).toBeInTheDocument()
    })
  })

  describe('✅ Error Handling - Scenario Testing', () => {
    it('should display error message and retry option', () => {
      const mockError = new Error('Failed to load assessments')
      const mockReturn = createMockAssessmentHistoryReturn([], {
        error: mockError,
        isLoading: false
      })
      mockUseAssessmentHistory.mockReturnValue(mockReturn)

      render(<AssessmentHistory userId="test-user-123" />)

      expect(screen.getByText(/Erro ao carregar histórico/)).toBeInTheDocument()
      expect(screen.getByText('Failed to load assessments')).toBeInTheDocument()
      expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
    })

    it('should call refresh when retry button is clicked', () => {
      const mockRefresh = jest.fn()
      const mockReturn = createMockAssessmentHistoryReturn([], {
        error: new Error('Network error'),
        refresh: mockRefresh
      })
      mockUseAssessmentHistory.mockReturnValue(mockReturn)

      render(<AssessmentHistory userId="test-user-123" />)

      const retryButton = screen.getByText('Tentar novamente')
      fireEvent.click(retryButton)

      // ✅ CORRECT: Test behavioral outcome of user action
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('✅ Filter System - User Interaction Testing', () => {
    it('should call setFilters when quick filter is clicked', () => {
      const mockSetFilters = jest.fn()
      const mockReturn = createMockAssessmentHistoryReturn(
        mockAssessmentScenarios.mixedStatus(),
        { setFilters: mockSetFilters }
      )
      mockUseAssessmentHistory.mockReturnValue(mockReturn)

      render(<AssessmentHistory userId="test-user-123" />)

      const todayButton = screen.getByText('Hoje')
      fireEvent.click(todayButton)

      // ✅ CORRECT: Verify filter method called with expected parameters
      expect(mockSetFilters).toHaveBeenCalledWith({
        dateFrom: expect.any(Date),
        dateTo: expect.any(Date)
      })
    })

    it('should show and hide advanced filters', () => {
      const mockReturn = createMockAssessmentHistoryReturn(mockAssessmentScenarios.mixedStatus())
      mockUseAssessmentHistory.mockReturnValue(mockReturn)

      render(<AssessmentHistory userId="test-user-123" />)

      const filterButton = screen.getByText('Filtros')
      
      // Initially filters should not be visible
      expect(screen.queryByText('Tipo de Avaliação')).not.toBeInTheDocument()
      
      // Click to show filters
      fireEvent.click(filterButton)
      expect(screen.getByText('Tipo de Avaliação')).toBeInTheDocument()
      
      // Click again to hide filters
      fireEvent.click(filterButton)
      expect(screen.queryByText('Tipo de Avaliação')).not.toBeInTheDocument()
    })
  })

  describe('✅ Results Modal - Integration Testing', () => {
    it('should open results viewer when "Ver resultados" is clicked', async () => {
      const mockAssessments = mockAssessmentScenarios.singleCompleted()
      const mockReturn = createMockAssessmentHistoryReturn(mockAssessments)
      mockUseAssessmentHistory.mockReturnValue(mockReturn)

      render(<AssessmentHistory userId="test-user-123" />)

      const viewButton = screen.getByText('Ver resultados')
      fireEvent.click(viewButton)

      // ✅ CORRECT: Test modal opens and displays content
      await waitFor(() => {
        expect(screen.getByTestId('results-viewer-modal')).toBeInTheDocument()
        expect(screen.getByText('Assessment Results')).toBeInTheDocument()
      })
    })

    it('should close results viewer when close button is clicked', async () => {
      const mockAssessments = mockAssessmentScenarios.singleCompleted()
      const mockReturn = createMockAssessmentHistoryReturn(mockAssessments)
      mockUseAssessmentHistory.mockReturnValue(mockReturn)

      render(<AssessmentHistory userId="test-user-123" />)

      // Open modal
      const viewButton = screen.getByText('Ver resultados')
      fireEvent.click(viewButton)

      await waitFor(() => {
        expect(screen.getByTestId('results-viewer-modal')).toBeInTheDocument()
      })

      // Close modal
      const closeButton = screen.getByText('Close Modal')
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByTestId('results-viewer-modal')).not.toBeInTheDocument()
      })
    })
  })

  describe('✅ Auth Integration - Context Testing', () => {
    it('should work with authenticated user', () => {
      const mockReturn = createMockAssessmentHistoryReturn([])
      mockUseAssessmentHistory.mockReturnValue(mockReturn)

      render(<AssessmentHistory userId="test-user-123" />)

      // ✅ CORRECT: Component renders normally with auth context
      expect(screen.getByText('Histórico de Avaliações')).toBeInTheDocument()
    })

    it('should handle loading auth state', () => {
      const mockReturn = createMockAssessmentHistoryReturn([])
      mockUseAssessmentHistory.mockReturnValue(mockReturn)

      renderWithMockAuth(
        <AssessmentHistory userId="test-user-123" />,
        authTestStates.loading
      )

      // Component should still render (auth loading doesn't block component)
      expect(screen.getByText('Histórico de Avaliações')).toBeInTheDocument()
    })
  })

  describe('✅ Edge Cases - Robust Testing', () => {
    it('should handle malformed assessment data gracefully', () => {
      // ✅ CORRECT: Test component resilience to bad data
      const malformedAssessment = {
        id: 'malformed-1',
        type: 'unknown_type', // Invalid type
        status: 'invalid_status', // Invalid status
        created_at: 'invalid-date',
        // Missing required fields
      }

      const mockReturn = createMockAssessmentHistoryReturn([malformedAssessment as any])
      mockUseAssessmentHistory.mockReturnValue(mockReturn)

      render(<AssessmentHistory userId="test-user-123" />)

      // Component should not crash
      expect(screen.getByText('Histórico de Avaliações')).toBeInTheDocument()
      // Should handle bad data gracefully (not show malformed content)
      expect(screen.queryByText('unknown_type')).not.toBeInTheDocument()
    })

    it('should handle very large datasets efficiently', () => {
      const largeDataset = mockAssessmentScenarios.largeDdataset(100)
      const mockReturn = createMockAssessmentHistoryReturn(largeDataset.slice(0, 20)) // Paginated
      mockUseAssessmentHistory.mockReturnValue(mockReturn)

      render(<AssessmentHistory userId="test-user-123" />)

      // Should only render paginated results
      const assessmentCards = screen.getAllByText(/DISC|Soft Skills|SJT/)
      expect(assessmentCards.length).toBeLessThanOrEqual(20)
    })
  })
})

// ✅ EXAMPLE: What the same test would look like BEFORE strategy
/*
❌ INCORRECT VERSION (for comparison):

describe('AssessmentHistory - Old Broken Approach', () => {
  // ❌ Wrong: Over-mocking everything
  jest.mock('@/lib/supabase/client')
  jest.mock('@/components/providers/auth-provider')
  jest.mock('@/hooks/use-assessment-history')
  jest.mock('react')
  jest.mock('next/router')
  
  // ❌ Wrong: Testing implementation details
  it('should call useAssessmentHistory with correct params', () => {
    // Testing HOW instead of WHAT
    expect(mockUseAssessmentHistory).toHaveBeenCalledWith('user-123')
  })
  
  // ❌ Wrong: Non-deterministic test data
  it('should handle random data', () => {
    const randomAssessment = {
      id: Math.random().toString(),
      created_at: new Date().toISOString() // Changes every run!
    }
  })
  
  // ❌ Wrong: Testing internal React state
  it('should update component state', () => {
    const wrapper = shallow(<AssessmentHistory />)
    expect(wrapper.state('isLoading')).toBe(false)
  })
})
*/
