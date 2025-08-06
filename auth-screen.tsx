'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, User, Mail, Phone, FileText, Stethoscope } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  phone: string
  crm: string
  specialty: string
  isNewUser: boolean
}

interface AuthScreenProps {
  onBack: () => void
  onAuthenticated: (userData: UserData) => void
}

export function AuthScreen({ onBack, onAuthenticated }: AuthScreenProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    crm: '',
    specialty: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const specialties = [
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
    'Medicina Geral',
    'Medicina de Família',
    'Medicina do Trabalho',
    'Medicina Intensiva',
    'Anestesiologia',
    'Cirurgia Geral',
    'Medicina de Emergência',
    'Patologia',
    'Outro'
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório'
    }

    if (!formData.crm.trim()) {
      newErrors.crm = 'CRM é obrigatório'
    }

    if (!formData.specialty) {
      newErrors.specialty = 'Especialidade é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    // Simular autenticação
    await new Promise(resolve => setTimeout(resolve, 1500))

    const userData: UserData = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      crm: formData.crm,
      specialty: formData.specialty,
      isNewUser: true
    }

    onAuthenticated(userData)
    setIsLoading(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="stellar-card w-full max-w-2xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex justify-center flex-1">
              <img 
                src="/soyuz-logo.png" 
                alt="Soyuz Logo" 
                className="h-12 w-auto"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white text-center">
            Dados Profissionais
          </CardTitle>
          <p className="text-gray-300 text-center">
            Para personalizar sua avaliação, precisamos de algumas informações básicas
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Seu nome completo"
                  className="stellar-border bg-gray-800 text-white placeholder-gray-400"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="seu@email.com"
                  className="stellar-border bg-gray-800 text-white placeholder-gray-400"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="stellar-border bg-gray-800 text-white placeholder-gray-400"
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="crm" className="text-white flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  CRM
                </Label>
                <Input
                  id="crm"
                  value={formData.crm}
                  onChange={(e) => handleInputChange('crm', e.target.value)}
                  placeholder="CRM/UF 123456"
                  className="stellar-border bg-gray-800 text-white placeholder-gray-400"
                />
                {errors.crm && (
                  <p className="text-red-400 text-sm">{errors.crm}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty" className="text-white flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Especialidade
              </Label>
              <Select value={formData.specialty} onValueChange={(value) => handleInputChange('specialty', value)}>
                <SelectTrigger className="stellar-border bg-gray-800 text-white">
                  <SelectValue placeholder="Selecione sua especialidade" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty} className="text-white hover:bg-gray-700">
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specialty && (
                <p className="text-red-400 text-sm">{errors.specialty}</p>
              )}
            </div>

            <div className="stellar-border rounded-lg p-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                <strong className="text-white">Privacidade:</strong> Seus dados são utilizados exclusivamente para 
                personalizar a avaliação e gerar insights relevantes para sua área de atuação. 
                Não compartilhamos informações pessoais com terceiros.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 stellar-glow"
              disabled={isLoading}
            >
              {isLoading ? 'Processando...' : 'Continuar para Avaliação'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
