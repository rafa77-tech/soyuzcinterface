import { render, screen, waitFor } from '@testing-library/react'
import { AssessmentHistory } from '../assessment-history'
import { useAuth } from '@/components/providers/auth-provider'
import { useDebounce } from '@/hooks/use-debounce'
import { useToast } from '@/hooks/use-toast'

// Mock the dependencies
jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: jest.fn(),
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}))

// Mock AssessmentDetailView component
jest.mock('../assessment-detail-view', () => ({
  AssessmentDetailView: () => null,
}))

// Mock global fetch
global.fetch = jest.fn()

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseDebounce = useDebounce as jest.MockedFunction<typeof useDebounce>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
}

const mockToast = jest.fn()

const mockAssessments = [
  {
    id: 'assessment-1',
    type: 'complete' as const,
    status: 'completed' as const,
    created_at: '2024-01-15T10:00:00Z',
    completed_at: '2024-01-15T11:30:00Z',
  },
  {
    id: 'assessment-2', 
    type: 'disc' as const,
    status: 'in_progress' as const,
    created_at: '2024-01-16T14:00:00Z',
    completed_at: null,
  },
]

const mockApiResponse = {
  assessments: mockAssessments,
  pagination: {
    total: 2,
    page: 1,
    limit: 20,
  },
}

describe('AssessmentHistory', () => {
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

    mockUseDebounce.mockImplementation((value) => value)
    
    mockUseToast.mockReturnValue({
      toast: mockToast,
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockApiResponse),
    } as any)
  })

  describe('Component rendering', () => {
    it('should render assessment list with mock data', async () => {
      render(<AssessmentHistory />)

      await waitFor(() => {
        expect(screen.getByText('Histórico de Avaliações')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Completa')).toBeInTheDocument()
        expect(screen.getByText('DISC')).toBeInTheDocument()
      })
    })

    it('should display loading state initially', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        loading: true,
        error: null,
      })

      render(<AssessmentHistory />)

      expect(screen.getByText('Carregando...')).toBeInTheDocument()
    })

    it('should display unauthorized state when user is not logged in', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        loading: false,
        error: null,
      })

      render(<AssessmentHistory />)

      expect(screen.getByText('Você precisa estar autenticado para ver o histórico de avaliações.')).toBeInTheDocument()
    })

    it('should display error state when API call fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      render(<AssessmentHistory />)

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument()
      })
    })

    it('should display empty state when no assessments exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          assessments: [],
          pagination: { total: 0, page: 1, limit: 20 },
        }),
      } as any)

      render(<AssessmentHistory />)

      await waitFor(() => {
        expect(screen.getByText('Nenhuma avaliação encontrada')).toBeInTheDocument()
      })
    })
  })

  describe('Debounce integration', () => {
    it('should call useDebounce with correct parameters', () => {
      render(<AssessmentHistory />)

      expect(mockUseDebounce).toHaveBeenCalledWith('', 300)
    })
  })

  describe('Loading states', () => {
    it('should show loading state while fetching data', async () => {
      // Mock a delayed response
      let resolvePromise: any
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValueOnce(pendingPromise)

      render(<AssessmentHistory />)

      expect(screen.getByText('Carregando avaliações...')).toBeInTheDocument()

      // Resolve the promise
      resolvePromise({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      })

      await waitFor(() => {
        expect(screen.queryByText('Carregando avaliações...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<AssessmentHistory />)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should clear error state when starting new API call', async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const { rerender } = render(<AssessmentHistory />)

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument()
      })

      // Setup successful response for retry
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any)

      // Trigger re-render (simulating user action)
      rerender(<AssessmentHistory />)

      await waitFor(() => {
        expect(screen.queryByText('API Error')).not.toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    it('should display pagination when there are more items than page limit', async () => {
      const paginatedResponse = {
        assessments: mockAssessments,
        pagination: {
          total: 25,
          page: 1,
          limit: 20,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(paginatedResponse),
      } as any)

      render(<AssessmentHistory />)

      await waitFor(() => {
        expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
        expect(screen.getByText('Anterior')).toBeInTheDocument()
        expect(screen.getByText('Próxima')).toBeInTheDocument()
      })
    })

    it('should disable previous button on first page', async () => {
      const paginatedResponse = {
        assessments: mockAssessments,
        pagination: {
          total: 25,
          page: 1,
          limit: 20,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(paginatedResponse),
      } as any)

      render(<AssessmentHistory />)

      await waitFor(() => {
        const previousButton = screen.getByText('Anterior')
        expect(previousButton).toBeDisabled()
      })
    })
  })

  describe('Export functionality', () => {
    it('should show export buttons for completed assessments', async () => {
      render(<AssessmentHistory />)

      await waitFor(() => {
        expect(screen.getByText('Histórico de Avaliações')).toBeInTheDocument()
      })

      await waitFor(() => {
        const exportButtons = screen.getAllByText('Exportar')
        expect(exportButtons.length).toBeGreaterThan(0)
      })
    })
  })
})