'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Phone, Briefcase, Building, Lock, History } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { z } from 'zod'

interface AuthScreenProps {
  onNext: () => void
  onUserData: (data: any) => void
  onViewHistory?: () => void
}

const medicalSpecialties = [
  'Cardiologia',
  'Dermatologia',
  'Endocrinologia',
  'Gastroenterologia',
  'Ginecologia',
  'Neurologia',
  'Oftalmologia',
  'Ortopedia',
  'Pediatria',
  'Psiquiatria',
  'Radiologia',
  'Urologia',
  'Outras'
]

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  crm: z.string().min(4, 'CRM deve ter pelo menos 4 caracteres'),
  specialty: z.string().min(1, 'Especialidade é obrigatória'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export function AuthScreen({ onNext, onUserData, onViewHistory }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    crm: '',
    specialty: '',
    password: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  
  const { signIn, signUp, user, profile } = useAuth()

  // Se o usuário já está logado, mostrar opções diferentes
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md stellar-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Bem-vindo!
            </CardTitle>
            <p className="text-gray-400">
              Você já está autenticado. O que deseja fazer?
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={onNext}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 stellar-glow"
            >
              Iniciar Nova Avaliação
            </Button>
            
            {onViewHistory && (
              <Button
                onClick={onViewHistory}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                Ver Histórico de Avaliações
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      if (mode === 'signin') {
        const result = await signIn(formData.email, formData.password)
        if (result.error) {
          setErrors({ auth: result.error.message })
          return
        }
      } else {
        // Validate form for signup
        const validation = profileSchema.safeParse(formData)
        if (!validation.success) {
          const fieldErrors: Record<string, string> = {}
          validation.error.errors.forEach(err => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message
            }
          })
          setErrors(fieldErrors)
          return
        }

        const { password, ...profileData } = formData
        const result = await signUp(formData.email, password, profileData)
        if (result.error) {
          setErrors({ auth: result.error.message })
          return
        }
      }

      // If we reach here, auth was successful
      if (user && profile) {
        onUserData({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          crm: profile.crm,
          specialty: profile.specialty
        })
        onNext()
      }
    } catch (error) {
      setErrors({ auth: 'Erro inesperado. Tente novamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setErrors({})
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md stellar-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            {mode === 'signin' ? 'Login Médico' : 'Cadastro Médico'}
          </CardTitle>
          <p className="text-gray-400">
            {mode === 'signin' 
              ? 'Acesse sua conta para continuar' 
              : 'Preencha seus dados profissionais'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field - shown in both modes */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="bg-gray-800/50 border-gray-600 text-white"
                required
              />
              {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
            </div>

            {/* Password field - shown in both modes */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Senha *
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="bg-gray-800/50 border-gray-600 text-white"
                required
              />
              {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
            </div>

            {/* Additional fields only shown in signup mode */}
            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="bg-gray-800/50 border-gray-600 text-white"
                    required
                  />
                  {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                  {errors.phone && <p className="text-red-400 text-sm">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crm" className="text-white flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    CRM *
                  </Label>
                  <Input
                    id="crm"
                    type="text"
                    value={formData.crm}
                    onChange={(e) => handleChange('crm', e.target.value)}
                    className="bg-gray-800/50 border-gray-600 text-white"
                    placeholder="Ex: CRM/SP 123456"
                    required
                  />
                  {errors.crm && <p className="text-red-400 text-sm">{errors.crm}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-white flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Especialidade *
                  </Label>
                  <select
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => handleChange('specialty', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Selecione sua especialidade</option>
                    {medicalSpecialties.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                  {errors.specialty && <p className="text-red-400 text-sm">{errors.specialty}</p>}
                </div>
              </>
            )}

            {/* Authentication error */}
            {errors.auth && (
              <div className="text-red-400 text-sm text-center p-2 bg-red-900/20 rounded">
                {errors.auth}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 stellar-glow"
              disabled={isLoading || (mode === 'signin' ? !formData.email || !formData.password : !formData.name || !formData.email || !formData.password || !formData.crm || !formData.specialty)}
            >
              {isLoading ? 'Processando...' : (mode === 'signin' ? 'Entrar' : 'Criar Conta')}
            </Button>

            {/* Mode toggle */}
            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-gray-400 hover:text-white text-sm underline"
              >
                {mode === 'signin' 
                  ? 'Não tem conta? Cadastre-se aqui' 
                  : 'Já tem conta? Faça login'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
