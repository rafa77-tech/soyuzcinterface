'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { ArrowLeft, ArrowRight, MessageCircle, Award, Lightbulb, Zap, Heart, Brain } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  phone: string
  crm: string
  specialty: string
  isNewUser: boolean
}

interface SoftSkillsScreenProps {
  userData: UserData
  onBack: () => void
  onComplete: (results: Record<string, number>) => void
}

const softSkills = [
  {
    id: 'communication',
    name: 'Comunicação',
    description: 'Capacidade de transmitir informações de forma clara e eficaz',
    icon: MessageCircle,
    scenarios: [
      'Explicar diagnósticos complexos para pacientes',
      'Apresentar casos em reuniões médicas',
      'Comunicar-se com familiares em situações difíceis'
    ]
  },
  {
    id: 'leadership',
    name: 'Liderança',
    description: 'Habilidade para guiar e motivar equipes',
    icon: Award,
    scenarios: [
      'Coordenar equipe multidisciplinar',
      'Tomar decisões em situações críticas',
      'Mentorear profissionais mais jovens'
    ]
  },
  {
    id: 'creativity',
    name: 'Criatividade',
    description: 'Capacidade de encontrar soluções inovadoras',
    icon: Lightbulb,
    scenarios: [
      'Desenvolver abordagens terapêuticas alternativas',
      'Resolver problemas complexos de diagnóstico',
      'Implementar melhorias nos processos de trabalho'
    ]
  },
  {
    id: 'adaptability',
    name: 'Adaptabilidade',
    description: 'Flexibilidade para se ajustar a mudanças',
    icon: Zap,
    scenarios: [
      'Adaptar-se a novos protocolos médicos',
      'Trabalhar em diferentes ambientes hospitalares',
      'Lidar com situações imprevistas'
    ]
  },
  {
    id: 'empathy',
    name: 'Empatia',
    description: 'Capacidade de compreender e se conectar com outros',
    icon: Heart,
    scenarios: [
      'Compreender as preocupações dos pacientes',
      'Apoiar colegas em momentos difíceis',
      'Demonstrar compaixão em cuidados paliativos'
    ]
  },
  {
    id: 'problem_solving',
    name: 'Resolução de Problemas',
    description: 'Habilidade para analisar e resolver questões complexas',
    icon: Brain,
    scenarios: [
      'Diagnosticar casos complexos',
      'Resolver conflitos na equipe',
      'Otimizar fluxos de atendimento'
    ]
  }
]

export function SoftSkillsScreen({ userData, onBack, onComplete }: SoftSkillsScreenProps) {
  const [currentSkill, setCurrentSkill] = useState(0)
  const [skillRatings, setSkillRatings] = useState<Record<string, number>>({})

  const progress = ((currentSkill + 1) / softSkills.length) * 100
  const skill = softSkills[currentSkill]
  const Icon = skill.icon
  const currentRating = skillRatings[skill.id] || 50

  const handleRatingChange = (value: number[]) => {
    setSkillRatings(prev => ({
      ...prev,
      [skill.id]: value[0]
    }))
  }

  const handleNext = () => {
    if (currentSkill < softSkills.length - 1) {
      setCurrentSkill(currentSkill + 1)
    } else {
      onComplete(skillRatings)
    }
  }

  const handlePrevious = () => {
    if (currentSkill > 0) {
      setCurrentSkill(currentSkill - 1)
    }
  }

  const getRatingLabel = (rating: number) => {
    if (rating <= 20) return 'Iniciante'
    if (rating <= 40) return 'Básico'
    if (rating <= 60) return 'Intermediário'
    if (rating <= 80) return 'Avançado'
    return 'Expert'
  }

  const getRatingColor = (rating: number) => {
    if (rating <= 20) return 'text-red-400'
    if (rating <= 40) return 'text-orange-400'
    if (rating <= 60) return 'text-yellow-400'
    if (rating <= 80) return 'text-blue-400'
    return 'text-green-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="stellar-card w-full max-w-4xl">
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
                className="h-10 w-auto"
              />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-white">
              Avaliação de Soft Skills
            </CardTitle>
            <p className="text-gray-300">
              Habilidade {currentSkill + 1} de {softSkills.length}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center stellar-glow">
                <Icon className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-white">{skill.name}</h3>
                <p className="text-gray-300">{skill.description}</p>
              </div>
            </div>

            <div className="stellar-border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">
                Contextos de Aplicação em {userData.specialty}:
              </h4>
              <ul className="space-y-2 text-gray-300">
                {skill.scenarios.map((scenario, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{scenario}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-white mb-2">
                  Como você avalia seu nível atual nesta habilidade?
                </h4>
                <p className="text-gray-400 text-sm">
                  Considere sua experiência prática e confiança nesta competência
                </p>
              </div>

              <div className="space-y-4">
                <div className="px-4">
                  <Slider
                    value={[currentRating]}
                    onValueChange={handleRatingChange}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-400 px-4">
                  <span>Iniciante</span>
                  <span>Básico</span>
                  <span>Intermediário</span>
                  <span>Avançado</span>
                  <span>Expert</span>
                </div>

                <div className="text-center">
                  <div className={`text-2xl font-bold ${getRatingColor(currentRating)}`}>
                    {currentRating}%
                  </div>
                  <div className={`text-sm ${getRatingColor(currentRating)}`}>
                    {getRatingLabel(currentRating)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentSkill === 0}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-2">
              {softSkills.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentSkill ? 'bg-purple-400' : 
                    index < currentSkill ? 'bg-green-400' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="bg-purple-600 hover:bg-purple-700 text-white stellar-glow"
            >
              {currentSkill === softSkills.length - 1 ? 'Finalizar' : 'Próxima'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
