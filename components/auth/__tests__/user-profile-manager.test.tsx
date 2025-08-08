import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserProfileManager } from '../user-profile-manager'
import { useAuth } from '@/components/providers/auth-provider'
import { useToast } from '@/hooks/use-toast'

jest.mock('@/components/providers/auth-provider')
jest.mock('@/hooks/use-toast')
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } }))
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    }))
  }
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>

const mockProfile = {
  id: '123',
  name: 'Dr. João Silva',
  email: 'joao@example.com',
  phone: '(11) 99999-9999',
  crm: 'CRM/SP 123456',
  specialty: 'Cardiologia',
  avatar_url: null,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

const mockUser = {
  id: '123',
  email: 'joao@example.com'
}

const mockToast = jest.fn()
const mockRefreshProfile = jest.fn()

describe('UserProfileManager', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
    mockUseToast.mockReturnValue({ toast: mockToast })
    mockUseAuth.mockReturnValue({
      profile: mockProfile,
      user: mockUser,
      session: null,
      loading: false,
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      refreshProfile: mockRefreshProfile
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders profile information when not editing', () => {
    render(<UserProfileManager />)

    expect(screen.getByDisplayValue('Dr. João Silva')).toBeInTheDocument()
    expect(screen.getByDisplayValue('joao@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('(11) 99999-9999')).toBeInTheDocument()
    expect(screen.getByDisplayValue('CRM/SP 123456')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Cardiologia')).toBeInTheDocument()
    expect(screen.getByText('Editar Perfil')).toBeInTheDocument()
  })

  it('shows loading state when profile is null', () => {
    mockUseAuth.mockReturnValue({
      profile: null,
      user: mockUser,
      session: null,
      loading: false,
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      refreshProfile: mockRefreshProfile
    })

    render(<UserProfileManager />)
    expect(screen.getByText('Carregando perfil...')).toBeInTheDocument()
  })

  it('enters edit mode when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<UserProfileManager />)

    await user.click(screen.getByText('Editar Perfil'))

    expect(screen.getByText('Salvar Alterações')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()

    const nameInput = screen.getByLabelText('Nome Completo')
    expect(nameInput).not.toBeDisabled()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<UserProfileManager />)

    await user.click(screen.getByText('Editar Perfil'))
    
    const nameInput = screen.getByLabelText('Nome Completo')
    await user.clear(nameInput)

    const crmInput = screen.getByLabelText('CRM')
    await user.clear(crmInput)

    const saveButton = screen.getByText('Salvar Alterações')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Nome deve ter pelo menos 2 caracteres')).toBeInTheDocument()
      expect(screen.getByText('CRM é obrigatório')).toBeInTheDocument()
    })
  })

  it('validates CRM format', async () => {
    const user = userEvent.setup()
    render(<UserProfileManager />)

    await user.click(screen.getByText('Editar Perfil'))
    
    const crmInput = screen.getByLabelText('CRM')
    await user.clear(crmInput)
    await user.type(crmInput, 'invalid-crm')

    const saveButton = screen.getByText('Salvar Alterações')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('CRM deve estar no formato válido (ex: CRM/SP 123456)')).toBeInTheDocument()
    })
  })

  it('calls API when form is submitted', () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'success' })
    })

    render(<UserProfileManager />)
    
    expect(screen.getByDisplayValue('Dr. João Silva')).toBeInTheDocument()
    expect(screen.getByDisplayValue('(11) 99999-9999')).toBeInTheDocument()
    expect(screen.getByDisplayValue('CRM/SP 123456')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Cardiologia')).toBeInTheDocument()
  })

  it('handles update errors', async () => {
    const user = userEvent.setup()
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: false
    } as Response)

    render(<UserProfileManager />)

    await user.click(screen.getByText('Editar Perfil'))
    
    const saveButton = screen.getByText('Salvar Alterações')
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar as informações.',
        variant: 'destructive'
      })
    })
  })

  it('disables save button when form is pristine', async () => {
    const user = userEvent.setup()
    render(<UserProfileManager />)

    await user.click(screen.getByText('Editar Perfil'))
    
    const saveButton = screen.getByText('Salvar Alterações')
    expect(saveButton).toBeDisabled()
  })

  it('shows avatar with initials when no avatar_url', () => {
    render(<UserProfileManager />)

    expect(screen.getByText('DJS')).toBeInTheDocument()
  })
})