import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { AuthScreen } from '../auth-screen'
import { AuthProvider } from '../providers/auth-provider'

// Mock Supabase client
const mockFrom = {
  select: jest.fn(() => ({
    eq: jest.fn(() => ({
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  })),
  insert: jest.fn().mockResolvedValue({ error: null })
}

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ 
        data: { session: null }, 
        error: null 
      }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      signUp: jest.fn().mockResolvedValue({ error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn(() => mockFrom)
  }
}))

const mockOnNext = jest.fn()
const mockOnUserData = jest.fn()

function renderAuthScreen() {
  return render(
    <AuthProvider>
      <AuthScreen onNext={mockOnNext} onUserData={mockOnUserData} />
    </AuthProvider>
  )
}

describe('AuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const mockGetSession = require('@/lib/supabase/client').supabase.auth.getSession
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
  })

  it('should render login form by default', async () => {
    renderAuthScreen()

    await waitFor(() => {
      expect(screen.getByText('Login Médico')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Acesse sua conta para continuar')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail *')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha *')).toBeInTheDocument()
    expect(screen.getByText('Entrar')).toBeInTheDocument()
    expect(screen.getByText('Não tem conta? Cadastre-se aqui')).toBeInTheDocument()
    
    // Should not show signup fields
    expect(screen.queryByLabelText('Nome Completo *')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('CRM *')).not.toBeInTheDocument()
  })

  it('should switch to signup mode when toggle is clicked', async () => {
    const user = userEvent.setup()
    renderAuthScreen()

    await waitFor(() => {
      expect(screen.getByText('Login Médico')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Não tem conta? Cadastre-se aqui'))

    expect(screen.getByText('Cadastro Médico')).toBeInTheDocument()
    expect(screen.getByText('Preencha seus dados profissionais')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome Completo *')).toBeInTheDocument()
    expect(screen.getByLabelText('CRM *')).toBeInTheDocument()
    expect(screen.getByLabelText('Especialidade *')).toBeInTheDocument()
    expect(screen.getByText('Criar Conta')).toBeInTheDocument()
    expect(screen.getByText('Já tem conta? Faça login')).toBeInTheDocument()
  })

  it('should handle signin submission', async () => {
    const user = userEvent.setup()
    const mockSignIn = require('@/lib/supabase/client').supabase.auth.signInWithPassword
    mockSignIn.mockResolvedValue({ error: null })

    renderAuthScreen()

    await waitFor(() => {
      expect(screen.getByText('Login Médico')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('E-mail *'), 'test@example.com')
    await user.type(screen.getByLabelText('Senha *'), 'password123')
    await user.click(screen.getByText('Entrar'))

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('should handle signup submission with validation', async () => {
    const user = userEvent.setup()
    const mockSignUp = require('@/lib/supabase/client').supabase.auth.signUp

    mockSignUp.mockResolvedValue({ 
      data: { 
        user: { id: '123', email: 'test@example.com' }, 
        session: { user: { id: '123' } } 
      }, 
      error: null 
    })

    mockFrom.insert.mockResolvedValue({ error: null })

    renderAuthScreen()

    // Switch to signup mode
    await waitFor(() => {
      expect(screen.getByText('Login Médico')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Não tem conta? Cadastre-se aqui'))

    // Fill out the form
    await user.type(screen.getByLabelText('E-mail *'), 'test@example.com')
    await user.type(screen.getByLabelText('Senha *'), 'password123')
    await user.type(screen.getByLabelText('Nome Completo *'), 'Dr. Test User')
    await user.type(screen.getByLabelText('CRM *'), 'CRM/SP 123456')
    await user.selectOptions(screen.getByLabelText('Especialidade *'), 'Cardiologia')

    await user.click(screen.getByText('Criar Conta'))

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
  })

  it('should show validation errors for invalid signup data', async () => {
    const user = userEvent.setup()
    renderAuthScreen()

    // Mudar para o modo de cadastro
    await user.click(screen.getByText('Não tem conta? Cadastre-se aqui'))
    
    // Esperar o formulário de cadastro carregar
    await waitFor(() => {
      expect(screen.getByText('Cadastro Médico')).toBeInTheDocument()
    })

    // Preencher o formulário com dados inválidos
    await user.type(screen.getByLabelText('E-mail *'), 'invalid-email')
    await user.type(screen.getByLabelText('Senha *'), '123') // Curta demais
    await user.type(screen.getByLabelText('Nome Completo *'), 'A') // Curto demais
    await user.type(screen.getByLabelText('CRM *'), '12') // Curto demais
    
    // Selecionar uma especialidade para habilitar o botão de submissão.
    await user.selectOptions(screen.getByLabelText('Especialidade *'), 'Cardiologia')

    // Clicar para submeter e acionar a validação
    await user.click(screen.getByText('Criar Conta'))

    // Aguardar e verificar se os logs apareceram no console
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Verificar se há alguma mensagem de erro na tela
    await waitFor(() => {
      // Procurar por qualquer elemento com classe de erro
      const hasError = screen.queryByText('Email inválido') || 
                      screen.queryByText('Senha deve ter pelo menos 6 caracteres') ||
                      screen.queryByText('Nome deve ter pelo menos 2 caracteres') ||
                      screen.queryByText('CRM deve ter pelo menos 4 caracteres')
      
      expect(hasError).toBeTruthy()
    }, { timeout: 3000 })
  })

  it('should show authentication errors', async () => {
    const user = userEvent.setup()
    const mockSignIn = require('@/lib/supabase/client').supabase.auth.signInWithPassword
    mockSignIn.mockResolvedValue({ 
      error: { message: 'Invalid login credentials' } 
    })

    renderAuthScreen()

    await waitFor(() => {
      expect(screen.getByText('Login Médico')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('E-mail *'), 'test@example.com')
    await user.type(screen.getByLabelText('Senha *'), 'wrongpassword')
    await user.click(screen.getByText('Entrar'))

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })
  })

  it('should disable submit button when loading', async () => {
    const user = userEvent.setup()
    let resolveSignIn: (value: any) => void
    const signInPromise = new Promise(resolve => { resolveSignIn = resolve })
    
    const mockSignIn = require('@/lib/supabase/client').supabase.auth.signInWithPassword
    mockSignIn.mockReturnValue(signInPromise)

    renderAuthScreen()

    await waitFor(() => {
      expect(screen.getByText('Login Médico')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('E-mail *'), 'test@example.com')
    await user.type(screen.getByLabelText('Senha *'), 'password123')
    
    const submitButton = screen.getByText('Entrar')
    await user.click(submitButton)

    expect(screen.getByText('Processando...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    // Resolve the promise
    resolveSignIn!({ error: null })
  })
})