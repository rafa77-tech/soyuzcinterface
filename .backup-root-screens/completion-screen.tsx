'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { User, Brain, Target, TrendingUp, Award, MessageCircle, Download, RotateCcw, ArrowRight, Star, Zap, Shield, Heart, Lightbulb, Users, CheckCircle, AlertTriangle, Briefcase, GraduationCap } from 'lucide-react'
import { AIChatWidget } from './ai-chat-widget'

interface UserData {
  id: string
  name: string
  email: string
  phone: string
  crm: string
  specialty: string
  isNewUser: boolean
}

interface TestResults {
  miniDisc: Record<string, number>
  softSkills: Record<string, number>
  sjt: Record<string, number>
}

interface CompletionScreenProps {
  results: TestResults
  userData: UserData
  onReturnToRevoluna: () => void
  onRetakeTest: () => void
}

export function CompletionScreen({ results, userData, onReturnToRevoluna, onRetakeTest }: CompletionScreenProps) {
  const [showAIChat, setShowAIChat] = useState(false)

  // Calcular perfil DISC dominante
  const discProfile = Object.entries(results.miniDisc).reduce((a, b) => 
    results.miniDisc[a[0]] > results.miniDisc[b[0]] ? a : b
  )

  // Calcular soft skills mais fortes e mais fracas
  const sortedSoftSkills = Object.entries(results.softSkills).sort((a, b) => b[1] - a[1])
  const strongestSkills = sortedSoftSkills.slice(0, 3)
  const weakestSkills = sortedSoftSkills.slice(-2)

  // Calcular pontuação SJT média
  const sjtAverage = Object.values(results.sjt).reduce((a, b) => a + b, 0) / Object.values(results.sjt).length

  const getDiscDescription = (trait: string) => {
    const descriptions = {
      'Dominance': 'Orientado para resultados, direto e determinado. Gosta de liderar e tomar decisões rápidas.',
      'Influence': 'Sociável, otimista e persuasivo. Se destaca em comunicação e motivação de equipes.',
      'Steadiness': 'Paciente, leal e colaborativo. Valoriza estabilidade e trabalho em equipe.',
      'Conscientiousness': 'Analítico, preciso e sistemático. Prioriza qualidade e atenção aos detalhes.'
    }
    return descriptions[trait as keyof typeof descriptions] || 'Perfil único com características balanceadas.'
  }

  const getDiscIcon = (trait: string) => {
    const icons = {
      'Dominance': Target,
      'Influence': Users,
      'Steadiness': Shield,
      'Conscientiousness': Brain
    }
    return icons[trait as keyof typeof icons] || Brain
  }

  const getSoftSkillIcon = (skill: string) => {
    const icons = {
      'communication': MessageCircle,
      'leadership': Award,
      'creativity': Lightbulb,
      'adaptability': Zap,
      'empathy': Heart,
      'problem_solving': Brain
    }
    return icons[skill as keyof typeof icons] || Star
  }

  const formatSkillName = (skill: string) => {
    const names = {
      'communication': 'Comunicação',
      'leadership': 'Liderança',
      'creativity': 'Criatividade',
      'adaptability': 'Adaptabilidade',
      'empathy': 'Empatia',
      'problem_solving': 'Resolução de Problemas'
    }
    return names[skill as keyof typeof names] || skill
  }

  const getCareerRecommendations = () => {
    const trait = discProfile[0]
    const recommendations = {
      'Dominance': [
        'Direção Médica',
        'Gestão Hospitalar',
        'Coordenação de Equipes',
        'Medicina de Emergência'
      ],
      'Influence': [
        'Educação Médica',
        'Comunicação em Saúde',
        'Relações com Pacientes',
        'Liderança de Equipes'
      ],
      'Steadiness': [
        'Medicina de Família',
        'Cuidados Continuados',
        'Medicina Preventiva',
        'Trabalho em Equipe'
      ],
      'Conscientiousness': [
        'Pesquisa Clínica',
        'Auditoria Médica',
        'Medicina Baseada em Evidências',
        'Especialização Técnica'
      ]
    }
    return recommendations[trait as keyof typeof recommendations] || ['Desenvolvimento Profissional Personalizado']
  }

  const DiscIcon = getDiscIcon(discProfile[0])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img 
              src="/soyuz-logo.png" 
              alt="Soyuz Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Análise Comportamental Completa
          </h1>
          <p className="text-xl text-gray-300">
            Parabéns, {userData.name}! Sua avaliação foi concluída com sucesso.
          </p>
        </div>

        {/* Resumo Executivo */}
        <Card className="stellar-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-6 w-6 text-purple-400" />
              Resumo Executivo
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-100">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-purple-300">Perfil Profissional</h3>
                <p className="text-sm leading-relaxed">
                  Com base na sua avaliação, você demonstra um perfil <strong>{discProfile[0]}</strong> dominante 
                  ({discProfile[1]}%), indicando características de liderança e excelência técnica. 
                  Sua especialidade em {userData.specialty} combina perfeitamente com suas competências comportamentais.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-purple-300">Destaques da Avaliação</h3>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Perfil DISC: {discProfile[0]} ({discProfile[1]}%)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Soft Skill Principal: {formatSkillName(strongestSkills[0][0])} ({strongestSkills[0][1]}%)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Julgamento Situacional: {sjtAverage.toFixed(0)}% de acerto
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Análise DISC */}
        <Card className="stellar-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <DiscIcon className="h-6 w-6 text-purple-400" />
              Análise DISC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                    <DiscIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{discProfile[0]}</h3>
                    <p className="text-purple-300">{discProfile[1]}% Dominante</p>
                  </div>
                </div>
                <p className="text-gray-100 text-sm leading-relaxed">
                  {getDiscDescription(discProfile[0])}
                </p>
              </div>
              <div className="space-y-3">
                {Object.entries(results.miniDisc).map(([trait, score]) => {
                  const Icon = getDiscIcon(trait)
                  return (
                    <div key={trait} className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-purple-400" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-white">{trait}</span>
                          <span className="text-sm text-purple-300">{score}%</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Soft Skills e Áreas de Desenvolvimento */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pontos Fortes */}
          <Card className="stellar-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-6 w-6 text-green-400" />
                Pontos Fortes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {strongestSkills.map(([skill, score]) => {
                const Icon = getSoftSkillIcon(skill)
                return (
                  <div key={skill} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-white">{formatSkillName(skill)}</span>
                        <Badge variant="secondary" className="bg-green-600 text-white">
                          {score}%
                        </Badge>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Áreas de Desenvolvimento */}
          <Card className="stellar-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
                Áreas de Desenvolvimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weakestSkills.map(([skill, score]) => {
                const Icon = getSoftSkillIcon(skill)
                return (
                  <div key={skill} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-white">{formatSkillName(skill)}</span>
                        <Badge variant="secondary" className="bg-yellow-600 text-white">
                          {score}%
                        </Badge>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Análise de Julgamento Situacional */}
        <Card className="stellar-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Brain className="h-6 w-6 text-purple-400" />
              Análise de Julgamento Situacional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-purple-400 mb-2">
                    {sjtAverage.toFixed(0)}%
                  </div>
                  <p className="text-gray-300">Pontuação Geral</p>
                </div>
                <p className="text-gray-100 text-sm leading-relaxed">
                  Sua capacidade de julgamento situacional demonstra {sjtAverage >= 80 ? 'excelente' : sjtAverage >= 60 ? 'boa' : 'adequada'} 
                  habilidade para tomar decisões em contextos profissionais complexos, especialmente relevante para sua área de atuação em {userData.specialty}.
                </p>
              </div>
              <div className="space-y-3">
                {Object.entries(results.sjt).map(([scenario, score]) => (
                  <div key={scenario} className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-purple-400" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-white capitalize">
                          {scenario.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-purple-300">{score}%</span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recomendações de Carreira */}
        <Card className="stellar-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <GraduationCap className="h-6 w-6 text-purple-400" />
              Recomendações de Carreira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-purple-300">Áreas de Atuação Recomendadas</h3>
                <div className="grid grid-cols-2 gap-2">
                  {getCareerRecommendations().map((career, index) => (
                    <Badge key={index} variant="outline" className="justify-center p-2 text-center border-purple-400 text-purple-300">
                      {career}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-purple-300">Próximos Passos</h3>
                <ul className="space-y-2 text-sm text-gray-100">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    Desenvolver competências em {formatSkillName(weakestSkills[0][0])}
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    Buscar oportunidades de liderança em sua especialidade
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    Considerar certificações em gestão de saúde
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    Participar de programas de mentoria
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="stellar-card">
          <CardContent className="text-center py-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Continue Sua Jornada de Desenvolvimento
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Baixe o app Revoluna para acessar conteúdos personalizados, conectar-se com outros profissionais 
              e continuar desenvolvendo suas competências comportamentais.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <Button 
                onClick={() => setShowAIChat(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat com IA Personalizada
              </Button>
              
              <Button variant="outline" className="border-purple-400 text-purple-300 hover:bg-purple-600 hover:text-white">
                <Download className="h-4 w-4 mr-2" />
                Baixar Relatório PDF
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={onReturnToRevoluna}
                variant="secondary"
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Voltar para Revoluna
              </Button>
              
              <Button 
                onClick={onRetakeTest}
                variant="outline"
                className="border-gray-400 text-gray-300 hover:bg-gray-600 hover:text-white"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Refazer Teste
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Chat Widget */}
      {showAIChat && (
        <AIChatWidget onClose={() => setShowAIChat(false)} />
      )}
    </div>
  )
}
