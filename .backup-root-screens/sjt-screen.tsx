'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ArrowRight, AlertCircle, Users, Clock, Stethoscope } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  phone: string
  crm: string
  specialty: string
  isNewUser: boolean
}

interface SJTScreenProps {
  userData: UserData
  onBack: () => void
  onComplete: (results: Record<string, number>) => void
}

const sjtScenarios = [
  {
    id: 1,
    category: 'leadership',
    title: 'Conflito na Equipe',
    scenario: 'Durante um plantão movimentado, você percebe que dois enfermeiros estão tendo um desentendimento que está afetando o atendimento aos pacientes. Como líder da equipe médica, qual seria sua abordagem?',
    options: [
      { id: 'A', text: 'Ignorar o conflito e focar apenas nos pacientes', score: 20 },
      { id: 'B', text: 'Intervir imediatamente e resolver o conflito na frente de todos', score: 60 },
      { id: 'C', text: 'Conversar separadamente com cada enfermeiro para entender o problema', score: 90 },
      { id: 'D', text: 'Reportar o incidente para a supervisão de enfermagem', score: 40 }
    ]
  },
  {
    id: 2,
    category: 'communication',
    title: 'Comunicação de Más Notícias',
    scenario: 'Você precisa informar a uma família que o diagnóstico do paciente é mais grave do que inicialmente esperado. A família está visivelmente ansiosa e fez muitas perguntas. Como você abordaria esta situação?',
    options: [
      { id: 'A', text: 'Ser direto e objetivo, apresentando apenas os fatos médicos', score: 40 },
      { id: 'B', text: 'Preparar um ambiente adequado, usar linguagem acessível e dar tempo para perguntas', score: 95 },
      { id: 'C', text: 'Pedir para outro colega dar a notícia por ter mais experiência', score: 20 },
      { id: 'D', text: 'Minimizar a gravidade para não causar mais ansiedade', score: 10 }
    ]
  },
  {
    id: 3,
    category: 'decision_making',
    title: 'Decisão Sob Pressão',
    scenario: 'Em uma emergência, você tem dois pacientes críticos chegando simultaneamente. Você tem apenas uma equipe disponível e precisa decidir rapidamente qual caso priorizar. Como você procederia?',
    options: [
      { id: 'A', text: 'Atender o primeiro que chegou', score: 30 },
      { id: 'B', text: 'Fazer uma avaliação rápida de triagem e priorizar o caso mais grave', score: 95 },
      { id: 'C', text: 'Dividir a equipe igualmente entre os dois pacientes', score: 50 },
      { id: 'D', text: 'Chamar outro médico para decidir', score: 20 }
    ]
  },
  {
    id: 4,
    category: 'ethics',
    title: 'Dilema Ético',
    scenario: 'Um paciente solicita um procedimento que você considera desnecessário, mas que não oferece riscos significativos. O paciente insiste e menciona que pode procurar outro médico. Como você lidaria com esta situação?',
    options: [
      { id: 'A', text: 'Realizar o procedimento para manter o paciente satisfeito', score: 30 },
      { id: 'B', text: 'Explicar claramente por que o procedimento não é necessário e oferecer alternativas', score: 90 },
      { id: 'C', text: 'Recusar categoricamente e encerrar a consulta', score: 20 },
      { id: 'D', text: 'Encaminhar para outro colega sem explicações', score: 40 }
    ]
  },
  {
    id: 5,
    category: 'teamwork',
    title: 'Trabalho em Equipe',
    scenario: 'Durante uma cirurgia complexa, um membro da equipe comete um erro que você percebe imediatamente. O erro ainda pode ser corrigido sem consequências para o paciente. Qual seria sua ação?',
    options: [
      { id: 'A', text: 'Apontar o erro imediatamente na frente de toda a equipe', score: 40 },
      { id: 'B', text: 'Corrigir discretamente e conversar com o profissional após o procedimento', score: 95 },
      { id: 'C', text: 'Ignorar o erro se não houver consequências imediatas', score: 20 },
      { id: 'D', text: 'Parar o procedimento para discutir o erro', score: 60 }
    ]
  },
  {
    id: 6,
    category: 'adaptability',
    title: 'Adaptação a Mudanças',
    scenario: 'Seu hospital implementou um novo sistema eletrônico que você ainda não domina completamente. Durante um plantão, o sistema apresenta lentidão e você precisa atender pacientes urgentes. Como você reagiria?',
    options: [
      { id: 'A', text: 'Continuar tentando usar o sistema mesmo com dificuldades', score: 30 },
      { id: 'B', text: 'Usar métodos alternativos temporários e buscar ajuda técnica', score: 90 },
      { id: 'C', text: 'Esperar o sistema voltar ao normal antes de atender', score: 10 },
      { id: 'D', text: 'Pedir para outro colega atender os pacientes', score: 40 }
    ]
  },
  {
    id: 7,
    category: 'patient_care',
    title: 'Cuidado Centrado no Paciente',
    scenario: 'Um paciente idoso está com dificuldades para entender as instruções de medicação e não tem acompanhante. Você está com a agenda lotada. Como você garantiria que ele compreenda adequadamente o tratamento?',
    options: [
      { id: 'A', text: 'Explicar rapidamente e entregar as instruções por escrito', score: 40 },
      { id: 'B', text: 'Dedicar tempo extra para explicar detalhadamente e confirmar o entendimento', score: 95 },
      { id: 'C', text: 'Pedir para a enfermagem explicar posteriormente', score: 60 },
      { id: 'D', text: 'Sugerir que ele retorne com um acompanhante', score: 30 }
    ]
  },
  {
    id: 8,
    category: 'continuous_learning',
    title: 'Aprendizado Contínuo',
    scenario: 'Você se depara com um caso raro que não tem certeza sobre o melhor tratamento. Há algumas opções terapêuticas possíveis, mas você gostaria de ter mais informações. Como procederia?',
    options: [
      { id: 'A', text: 'Escolher o tratamento baseado na sua experiência anterior', score: 50 },
      { id: 'B', text: 'Pesquisar rapidamente na literatura médica e consultar colegas especialistas', score: 95 },
      { id: 'C', text: 'Encaminhar imediatamente para um especialista', score: 70 },
      { id: 'D', text: 'Iniciar o tratamento mais comum para a condição', score: 40 }
    ]
  }
]

export function SJTScreen({ userData, onBack, onComplete }: SJTScreenProps) {
  const [currentScenario, setCurrentScenario] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [selectedAnswer, setSelectedAnswer] = useState('')

  const progress = ((currentScenario + 1) / sjtScenarios.length) * 100
  const scenario = sjtScenarios[currentScenario]

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value)
  }

  const handleNext = () => {
    if (!selectedAnswer) return

    const newAnswers = { ...answers, [currentScenario]: selectedAnswer }
    setAnswers(newAnswers)

    if (currentScenario < sjtScenarios.length - 1) {
      setCurrentScenario(currentScenario + 1)
      setSelectedAnswer(newAnswers[currentScenario + 1] || '')
    } else {
      // Calcular resultados SJT
      const categoryScores: Record<string, number[]> = {}
      
      sjtScenarios.forEach((scenario, index) => {
        const userAnswer = newAnswers[index]
        const selectedOption = scenario.options.find(opt => opt.id === userAnswer)
        
        if (selectedOption) {
          if (!categoryScores[scenario.category]) {
            categoryScores[scenario.category] = []
          }
          categoryScores[scenario.category].push(selectedOption.score)
        }
      })

      // Calcular média por categoria
      const results: Record<string, number> = {}
      Object.entries(categoryScores).forEach(([category, scores]) => {
        const average = scores.reduce((a, b) => a + b, 0) / scores.length
        results[category] = Math.round(average)
      })

      onComplete(results)
    }
  }

  const handlePrevious = () => {
    if (currentScenario > 0) {
      setCurrentScenario(currentScenario - 1)
      setSelectedAnswer(answers[currentScenario - 1] || '')
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      leadership: Users,
      communication: AlertCircle,
      decision_making: Clock,
      ethics: Stethoscope,
      teamwork: Users,
      adaptability: AlertCircle,
      patient_care: Stethoscope,
      continuous_learning: Clock
    }
    return icons[category as keyof typeof icons] || AlertCircle
  }

  const CategoryIcon = getCategoryIcon(scenario.category)

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
              Teste de Julgamento Situacional
            </CardTitle>
            <p className="text-gray-300">
              Cenário {currentScenario + 1} de {sjtScenarios.length}
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
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center stellar-glow">
                <CategoryIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{scenario.title}</h3>
                <p className="text-purple-300 capitalize">{scenario.category.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="stellar-border rounded-lg p-6">
              <p className="text-gray-100 leading-relaxed">
                {scenario.scenario}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-white">
                Qual seria sua abordagem?
              </h4>
              
              <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect} className="space-y-3">
                {scenario.options.map((option) => (
                  <div key={option.id} className="flex items-start space-x-3 stellar-border rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                    <RadioGroupItem value={option.id} id={`option-${option.id}`} className="text-purple-400 mt-1" />
                    <Label 
                      htmlFor={`option-${option.id}`} 
                      className="flex-1 text-gray-100 cursor-pointer leading-relaxed"
                    >
                      <span className="font-medium text-purple-300 mr-2">{option.id})</span>
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentScenario === 0}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-2">
              {sjtScenarios.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentScenario ? 'bg-purple-400' : 
                    index < currentScenario ? 'bg-green-400' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              disabled={!selectedAnswer}
              className="bg-purple-600 hover:bg-purple-700 text-white stellar-glow"
            >
              {currentScenario === sjtScenarios.length - 1 ? 'Finalizar Avaliação' : 'Próximo'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
