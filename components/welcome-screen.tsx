'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, Users, Award } from 'lucide-react'

interface WelcomeScreenProps {
  onNext: () => void
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="stellar-card w-full max-w-4xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img 
              src="/soyuz-logo.png" 
              alt="Soyuz Logo" 
              className="h-20 w-auto"
            />
          </div>
          <CardTitle className="text-4xl font-bold text-white">
            Bem-vindo ao RevoDisc
          </CardTitle>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Uma avaliação comportamental completa para profissionais de saúde, 
            desenvolvida para identificar seu perfil DISC, soft skills e capacidade de julgamento situacional.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Benefícios */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto stellar-glow">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-white">Perfil DISC</h3>
              <p className="text-sm text-gray-300">
                Descubra seu estilo comportamental dominante
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto stellar-glow">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-white">Soft Skills</h3>
              <p className="text-sm text-gray-300">
                Avalie suas competências interpessoais
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto stellar-glow">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-white">Julgamento Situacional</h3>
              <p className="text-sm text-gray-300">
                Teste sua capacidade de tomada de decisão
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto stellar-glow">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-white">15-20 Minutos</h3>
              <p className="text-sm text-gray-300">
                Avaliação rápida e eficiente
              </p>
            </div>
          </div>

          {/* Processo */}
          <div className="stellar-border rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">
              Como Funciona a Avaliação
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto text-white font-bold">
                  1
                </div>
                <h4 className="font-medium text-white">MiniDisc</h4>
                <p className="text-sm text-gray-300">
                  24 questões para identificar seu perfil comportamental DISC
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-white font-bold">
                  2
                </div>
                <h4 className="font-medium text-white">Soft Skills</h4>
                <p className="text-sm text-gray-300">
                  Avaliação das suas competências interpessoais e técnicas
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mx-auto text-white font-bold">
                  3
                </div>
                <h4 className="font-medium text-white">Situações Práticas</h4>
                <p className="text-sm text-gray-300">
                  Cenários reais para testar seu julgamento profissional
                </p>
              </div>
            </div>
          </div>

          {/* Instruções */}
          <div className="stellar-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Instruções Importantes
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                Responda com honestidade - não há respostas certas ou erradas
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                Considere seu comportamento natural, não o que você acha que é esperado
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                Reserve 15-20 minutos sem interrupções para completar a avaliação
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                Ao final, você receberá um relatório detalhado com insights personalizados
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button 
              onClick={onNext}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg stellar-glow"
            >
              Iniciar Avaliação
            </Button>
            <p className="text-sm text-gray-400 mt-2">
              Clique para começar sua jornada de autoconhecimento profissional
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
