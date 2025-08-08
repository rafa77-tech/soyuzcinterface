'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ArrowRight, Target, Users, Shield, Brain } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  phone: string
  crm: string
  specialty: string
  isNewUser: boolean
}

interface MiniDiscScreenProps {
  userData: UserData
  onBack: () => void
  onComplete: (results: Record<string, number>) => void
}

const discQuestions = [
  {
    id: 1,
    question: "Em situações de pressão, eu tendo a:",
    options: [
      { value: "D", text: "Tomar decisões rápidas e assumir o controle" },
      { value: "I", text: "Buscar apoio da equipe e manter o otimismo" },
      { value: "S", text: "Manter a calma e seguir protocolos estabelecidos" },
      { value: "C", text: "Analisar cuidadosamente antes de agir" }
    ]
  },
  {
    id: 2,
    question: "Quando trabalho em equipe, eu prefiro:",
    options: [
      { value: "D", text: "Liderar e definir objetivos claros" },
      { value: "I", text: "Motivar e engajar os colegas" },
      { value: "S", text: "Colaborar e apoiar os outros" },
      { value: "C", text: "Contribuir com análises detalhadas" }
    ]
  },
  {
    id: 3,
    question: "Ao enfrentar mudanças no trabalho, eu:",
    options: [
      { value: "D", text: "Adapto-me rapidamente e busco oportunidades" },
      { value: "I", text: "Vejo o lado positivo e ajudo outros a se adaptarem" },
      { value: "S", text: "Preciso de tempo para me ajustar gradualmente" },
      { value: "C", text: "Analiso os impactos antes de aceitar" }
    ]
  },
  {
    id: 4,
    question: "Minha abordagem para resolver problemas é:",
    options: [
      { value: "D", text: "Direta e focada em resultados rápidos" },
      { value: "I", text: "Criativa e envolvendo outras pessoas" },
      { value: "S", text: "Paciente e considerando todos os aspectos" },
      { value: "C", text: "Sistemática e baseada em dados" }
    ]
  },
  {
    id: 5,
    question: "Em reuniões, eu costumo:",
    options: [
      { value: "D", text: "Ser direto e focar nos objetivos" },
      { value: "I", text: "Participar ativamente e compartilhar ideias" },
      { value: "S", text: "Ouvir mais e contribuir quando necessário" },
      { value: "C", text: "Preparar-me bem e apresentar fatos" }
    ]
  },
  {
    id: 6,
    question: "Quando recebo críticas, eu:",
    options: [
      { value: "D", text: "Foco em como melhorar rapidamente" },
      { value: "I", text: "Busco entender e manter relacionamentos" },
      { value: "S", text: "Aceito e reflito calmamente" },
      { value: "C", text: "Analiso objetivamente a validade" }
    ]
  },
  {
    id: 7,
    question: "Meu estilo de comunicação é:",
    options: [
      { value: "D", text: "Direto e objetivo" },
      { value: "I", text: "Expressivo e entusiástico" },
      { value: "S", text: "Calmo e respeitoso" },
      { value: "C", text: "Preciso e detalhado" }
    ]
  },
  {
    id: 8,
    question: "Ao tomar decisões importantes, eu:",
    options: [
      { value: "D", text: "Decido rapidamente com base na experiência" },
      { value: "I", text: "Consulto outros e considero o impacto nas pessoas" },
      { value: "S", text: "Tomo tempo para considerar todas as opções" },
      { value: "C", text: "Analiso dados e evidências detalhadamente" }
    ]
  },
  {
    id: 9,
    question: "Em situações de conflito, eu:",
    options: [
      { value: "D", text: "Enfrento diretamente para resolver logo" },
      { value: "I", text: "Busco mediar e manter a harmonia" },
      { value: "S", text: "Evito confrontos e busco consenso" },
      { value: "C", text: "Analiso os fatos antes de me posicionar" }
    ]
  },
  {
    id: 10,
    question: "Minha motivação principal no trabalho é:",
    options: [
      { value: "D", text: "Alcançar resultados e superar desafios" },
      { value: "I", text: "Trabalhar com pessoas e ser reconhecido" },
      { value: "S", text: "Contribuir para a equipe e ter estabilidade" },
      { value: "C", text: "Fazer um trabalho de qualidade e preciso" }
    ]
  },
  {
    id: 11,
    question: "Quando ensino ou oriento alguém, eu:",
    options: [
      { value: "D", text: "Foco nos resultados e na eficiência" },
      { value: "I", text: "Uso exemplos práticos e mantenho o engajamento" },
      { value: "S", text: "Sou paciente e dou suporte contínuo" },
      { value: "C", text: "Explico detalhadamente e com precisão" }
    ]
  },
  {
    id: 12,
    question: "Minha abordagem para planejamento é:",
    options: [
      { value: "D", text: "Foco nos objetivos principais e ação rápida" },
      { value: "I", text: "Considero as pessoas envolvidas e mantenho flexibilidade" },
      { value: "S", text: "Planejo cuidadosamente e sigo etapas" },
      { value: "C", text: "Analiso todos os detalhes e possíveis cenários" }
    ]
  },
  {
    id: 13,
    question: "Em ambiente de trabalho, eu prefiro:",
    options: [
      { value: "D", text: "Autonomia e responsabilidade por resultados" },
      { value: "I", text: "Interação social e trabalho colaborativo" },
      { value: "S", text: "Ambiente estável e relacionamentos harmoniosos" },
      { value: "C", text: "Organização e processos bem definidos" }
    ]
  },
  {
    id: 14,
    question: "Quando preciso aprender algo novo, eu:",
    options: [
      { value: "D", text: "Vou direto à prática e aprendo fazendo" },
      { value: "I", text: "Busco aprender com outras pessoas" },
      { value: "S", text: "Prefiro aprender gradualmente e com suporte" },
      { value: "C", text: "Estudo teoricamente antes de aplicar" }
    ]
  },
  {
    id: 15,
    question: "Minha reação a prazos apertados é:",
    options: [
      { value: "D", text: "Acelero o ritmo e foco no essencial" },
      { value: "I", text: "Mobilizo a equipe e mantenho o moral alto" },
      { value: "S", text: "Organizo-me melhor e peço ajuda se necessário" },
      { value: "C", text: "Priorizo tarefas e mantenho a qualidade" }
    ]
  },
  {
    id: 16,
    question: "Em apresentações, eu:",
    options: [
      { value: "D", text: "Sou direto e foco nos pontos principais" },
      { value: "I", text: "Sou expressivo e busco engajar a audiência" },
      { value: "S", text: "Sou calmo e organizado" },
      { value: "C", text: "Sou detalhado e preciso" }
    ]
  },
  {
    id: 17,
    question: "Quando trabalho sob supervisão, eu:",
    options: [
      { value: "D", text: "Prefiro autonomia e objetivos claros" },
      { value: "I", text: "Gosto de feedback frequente e reconhecimento" },
      { value: "S", text: "Valorizo orientação clara e suporte" },
      { value: "C", text: "Prefiro instruções detalhadas e padrões definidos" }
    ]
  },
  {
    id: 18,
    question: "Minha abordagem para inovação é:",
    options: [
      { value: "D", text: "Implemento mudanças rapidamente" },
      { value: "I", text: "Busco ideias criativas e envolvo outros" },
      { value: "S", text: "Prefiro mudanças graduais e testadas" },
      { value: "C", text: "Analiso riscos e benefícios cuidadosamente" }
    ]
  },
  {
    id: 19,
    question: "Em situações de estresse, eu:",
    options: [
      { value: "D", text: "Mantenho o foco e tomo decisões firmes" },
      { value: "I", text: "Busco apoio social e mantenho otimismo" },
      { value: "S", text: "Procuro estabilidade e evito conflitos" },
      { value: "C", text: "Analiso a situação e busco soluções lógicas" }
    ]
  },
  {
    id: 20,
    question: "Meu estilo de liderança é:",
    options: [
      { value: "D", text: "Direto e focado em resultados" },
      { value: "I", text: "Inspirador e motivacional" },
      { value: "S", text: "Colaborativo e apoiador" },
      { value: "C", text: "Baseado em competência e padrões" }
    ]
  },
  {
    id: 21,
    question: "Quando recebo uma tarefa complexa, eu:",
    options: [
      { value: "D", text: "Divido em partes e ataco os pontos principais" },
      { value: "I", text: "Busco colaboração e diferentes perspectivas" },
      { value: "S", text: "Organizo-me metodicamente e peço orientação" },
      { value: "C", text: "Analiso todos os aspectos antes de começar" }
    ]
  },
  {
    id: 22,
    question: "Em negociações, eu:",
    options: [
      { value: "D", text: "Sou assertivo e foco em ganhar" },
      { value: "I", text: "Busco soluções criativas que beneficiem todos" },
      { value: "S", text: "Procuro compromissos e evito confrontos" },
      { value: "C", text: "Preparo-me com dados e argumentos sólidos" }
    ]
  },
  {
    id: 23,
    question: "Minha atitude em relação a regras é:",
    options: [
      { value: "D", text: "Sigo quando fazem sentido para os resultados" },
      { value: "I", text: "Sou flexível se não prejudicam as pessoas" },
      { value: "S", text: "Prefiro seguir para manter a harmonia" },
      { value: "C", text: "Valorizo e sigo rigorosamente" }
    ]
  },
  {
    id: 24,
    question: "Ao final de um projeto, eu:",
    options: [
      { value: "D", text: "Foco nos resultados alcançados e próximos desafios" },
      { value: "I", text: "Celebro com a equipe e reconheço contribuições" },
      { value: "S", text: "Reflito sobre o processo e relacionamentos" },
      { value: "C", text: "Analiso o que funcionou e o que pode melhorar" }
    ]
  }
]

export function MiniDiscScreen({ userData, onBack, onComplete }: MiniDiscScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [selectedAnswer, setSelectedAnswer] = useState('')

  const progress = ((currentQuestion + 1) / discQuestions.length) * 100

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value)
  }

  const handleNext = () => {
    if (!selectedAnswer) return

    const newAnswers = { ...answers, [currentQuestion]: selectedAnswer }
    setAnswers(newAnswers)

    if (currentQuestion < discQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(newAnswers[currentQuestion + 1] || '')
    } else {
      // Calcular resultados DISC
      const discScores = { D: 0, I: 0, S: 0, C: 0 }
      Object.values(newAnswers).forEach(answer => {
        discScores[answer as keyof typeof discScores]++
      })

      // Converter para percentuais
      const total = Object.values(discScores).reduce((a, b) => a + b, 0)
      const results = {
        Dominance: Math.round((discScores.D / total) * 100),
        Influence: Math.round((discScores.I / total) * 100),
        Steadiness: Math.round((discScores.S / total) * 100),
        Conscientiousness: Math.round((discScores.C / total) * 100)
      }

      onComplete(results)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedAnswer(answers[currentQuestion - 1] || '')
    }
  }

  const currentQ = discQuestions[currentQuestion]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="stellar-card w-full max-w-3xl">
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
              Avaliação DISC
            </CardTitle>
            <p className="text-gray-300">
              Questão {currentQuestion + 1} de {discQuestions.length}
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
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-white">
              {currentQ.question}
            </h3>
            
            <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect} className="space-y-3">
              {currentQ.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 stellar-border rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                  <RadioGroupItem value={option.value} id={`option-${index}`} className="text-purple-400" />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className="flex-1 text-gray-100 cursor-pointer leading-relaxed"
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Target className="h-4 w-4" />
              <Users className="h-4 w-4" />
              <Shield className="h-4 w-4" />
              <Brain className="h-4 w-4" />
            </div>

            <Button
              onClick={handleNext}
              disabled={!selectedAnswer}
              className="bg-purple-600 hover:bg-purple-700 text-white stellar-glow"
            >
              {currentQuestion === discQuestions.length - 1 ? 'Finalizar' : 'Próxima'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
