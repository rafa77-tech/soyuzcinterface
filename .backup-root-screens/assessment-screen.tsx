"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, CheckCircle, Users, Clock, Target, Brain } from "lucide-react"
import { useState, useEffect } from "react"

interface Question {
  id: number
  text: string
  block: number
  blockTitle: string
  options: {
    text: string
    profile: "E" | "C" | "P" | "A"
  }[]
}

interface AssessmentScreenProps {
  onComplete: (results: Record<string, number>) => void
  onBack: () => void
  savedAnswers?: Record<number, string>
  onSaveProgress?: (answers: Record<number, string>) => void
}

const questions: Question[] = [
  // Bloco 1: Como você age sob pressão (1-5)
  {
    id: 1,
    text: "Quando surge uma emergência no hospital, você tende a:",
    block: 1,
    blockTitle: "Como você age sob pressão",
    options: [
      { text: "Agir rápido e assumir a liderança", profile: "E" },
      { text: "Falar com todos para entender o cenário", profile: "C" },
      { text: "Esperar instruções e manter a calma", profile: "P" },
      { text: "Analisar os dados antes de agir", profile: "A" },
    ],
  },
  {
    id: 2,
    text: "Em reuniões de equipe, você costuma:",
    block: 1,
    blockTitle: "Como você age sob pressão",
    options: [
      { text: "Ser quem mais fala e motiva os outros", profile: "C" },
      { text: "Ouvir com atenção e contribuir com equilíbrio", profile: "P" },
      { text: "Direcionar a conversa para decisões rápidas", profile: "E" },
      { text: "Trazer informações detalhadas e precisas", profile: "A" },
    ],
  },
  {
    id: 3,
    text: "Seu estilo de trabalho em plantões é:",
    block: 1,
    blockTitle: "Como você age sob pressão",
    options: [
      { text: "Constante e previsível", profile: "P" },
      { text: "Direto e voltado para resultados", profile: "E" },
      { text: "Acolhedor e envolvente", profile: "C" },
      { text: "Técnico e organizado", profile: "A" },
    ],
  },
  {
    id: 4,
    text: "Em relação a mudanças de escala:",
    block: 1,
    blockTitle: "Como você age sob pressão",
    options: [
      { text: "Prefere planejar com antecedência", profile: "A" },
      { text: "Aceita bem e se adapta rápido", profile: "C" },
      { text: "Propõe soluções para otimizar", profile: "E" },
      { text: "Prefere estabilidade e rotina", profile: "P" },
    ],
  },
  {
    id: 5,
    text: "Você é mais reconhecido por:",
    block: 1,
    blockTitle: "Como você age sob pressão",
    options: [
      { text: "Sua facilidade de comunicação", profile: "C" },
      { text: "Sua atenção aos detalhes", profile: "A" },
      { text: "Sua capacidade de tomar decisões", profile: "E" },
      { text: "Sua confiabilidade", profile: "P" },
    ],
  },

  // Bloco 2: Seu estilo em equipe (6-10)
  {
    id: 6,
    text: "Quando há conflito com colegas:",
    block: 2,
    blockTitle: "Seu estilo em equipe",
    options: [
      { text: "Evita o confronto, busca equilíbrio", profile: "P" },
      { text: "Enfrenta o problema diretamente", profile: "E" },
      { text: "Tenta mediar de forma leve", profile: "C" },
      { text: "Prefere discutir com base em fatos", profile: "A" },
    ],
  },
  {
    id: 7,
    text: "Seu ritmo de trabalho é:",
    block: 2,
    blockTitle: "Seu estilo em equipe",
    options: [
      { text: "Organizado e metódico", profile: "A" },
      { text: "Flexível e dinâmico", profile: "C" },
      { text: "Acelerado e direto", profile: "E" },
      { text: "Calmo e constante", profile: "P" },
    ],
  },
  {
    id: 8,
    text: "Quando recebe feedback:",
    block: 2,
    blockTitle: "Seu estilo em equipe",
    options: [
      { text: "Reflete antes de responder", profile: "P" },
      { text: "Conversa e compartilha ideias", profile: "C" },
      { text: "Usa como motivação para ação", profile: "E" },
      { text: "Analisa criticamente para melhorar", profile: "A" },
    ],
  },
  {
    id: 9,
    text: "Ao coordenar uma equipe, você:",
    block: 2,
    blockTitle: "Seu estilo em equipe",
    options: [
      { text: "Dá direção e cobra resultados", profile: "E" },
      { text: "Busca consenso entre todos", profile: "P" },
      { text: "Motiva e inspira", profile: "C" },
      { text: "Define processos e regras claras", profile: "A" },
    ],
  },
  {
    id: 10,
    text: "Como você organiza seu plantão:",
    block: 2,
    blockTitle: "Seu estilo em equipe",
    options: [
      { text: "Com listas e prioridades bem definidas", profile: "A" },
      { text: "De forma flexível, adaptando conforme o dia", profile: "C" },
      { text: "De modo objetivo e funcional", profile: "E" },
      { text: "Mantendo a rotina habitual", profile: "P" },
    ],
  },

  // Bloco 3: Ritmo e rotina (11-15)
  {
    id: 11,
    text: "Quando precisa aprender algo novo:",
    block: 3,
    blockTitle: "Ritmo e rotina",
    options: [
      { text: "Prefere observar antes de testar", profile: "P" },
      { text: "Aprende trocando com colegas", profile: "C" },
      { text: "Vai direto à prática", profile: "E" },
      { text: "Pesquisa profundamente antes de agir", profile: "A" },
    ],
  },
  {
    id: 12,
    text: "Qual frase mais representa seu estilo:",
    block: 3,
    blockTitle: "Ritmo e rotina",
    options: [
      { text: "Gosto de trabalhar com pessoas", profile: "C" },
      { text: "Gosto de fazer com precisão", profile: "A" },
      { text: "Gosto de manter tudo funcionando", profile: "P" },
      { text: "Gosto de alcançar metas rapidamente", profile: "E" },
    ],
  },
  {
    id: 13,
    text: "Em situações estressantes:",
    block: 3,
    blockTitle: "Ritmo e rotina",
    options: [
      { text: "Assume o controle", profile: "E" },
      { text: "Mantém a calma", profile: "P" },
      { text: "Analisa as variáveis", profile: "A" },
      { text: "Conversa com os outros", profile: "C" },
    ],
  },
  {
    id: 14,
    text: "Qual dessas qualidades te descreve melhor:",
    block: 3,
    blockTitle: "Ritmo e rotina",
    options: [
      { text: "Estável", profile: "P" },
      { text: "Determinado", profile: "E" },
      { text: "Carismático", profile: "C" },
      { text: "Detalhista", profile: "A" },
    ],
  },
  {
    id: 15,
    text: "Como você costuma tomar decisões:",
    block: 3,
    blockTitle: "Ritmo e rotina",
    options: [
      { text: "Após analisar prós e contras", profile: "A" },
      { text: "Após conversar com os outros", profile: "C" },
      { text: "Rápido e com firmeza", profile: "E" },
      { text: "Com ponderação e segurança", profile: "P" },
    ],
  },

  // Bloco 4: Tomada de decisão (16-20)
  {
    id: 16,
    text: "Em grupo, você é visto como:",
    block: 4,
    blockTitle: "Tomada de decisão",
    options: [
      { text: "Comunicativo", profile: "C" },
      { text: "Preciso", profile: "A" },
      { text: "Líder", profile: "E" },
      { text: "Confiável", profile: "P" },
    ],
  },
  {
    id: 17,
    text: "Como você reage a novas tecnologias:",
    block: 4,
    blockTitle: "Tomada de decisão",
    options: [
      { text: "Adota rapidamente se for eficiente", profile: "E" },
      { text: "Testa aos poucos", profile: "P" },
      { text: "Analisa antes de implementar", profile: "A" },
      { text: "Gosta da novidade e compartilha", profile: "C" },
    ],
  },
  {
    id: 18,
    text: "Qual dessas tarefas você prefere:",
    block: 4,
    blockTitle: "Tomada de decisão",
    options: [
      { text: "Escrever prontuários detalhados", profile: "A" },
      { text: "Fazer visitas em grupo com troca de ideias", profile: "C" },
      { text: "Resolver intercorrências graves", profile: "E" },
      { text: "Cuidar de pacientes com atenção constante", profile: "P" },
    ],
  },
  {
    id: 19,
    text: "Em relação à escala:",
    block: 4,
    blockTitle: "Tomada de decisão",
    options: [
      { text: "Prefere previsibilidade", profile: "P" },
      { text: "Gosta de variedade e pessoas novas", profile: "C" },
      { text: "Quer desafios e autonomia", profile: "E" },
      { text: "Valoriza lógica e organização", profile: "A" },
    ],
  },
  {
    id: 20,
    text: "Se tivesse que se descrever com uma palavra:",
    block: 4,
    blockTitle: "Tomada de decisão",
    options: [
      { text: "Decisivo", profile: "E" },
      { text: "Entusiasta", profile: "C" },
      { text: "Racional", profile: "A" },
      { text: "Estável", profile: "P" },
    ],
  },
]

const blockIcons = {
  1: Target,
  2: Users,
  3: Clock,
  4: Brain,
}

const blockColors = {
  1: "bg-red-500",
  2: "bg-blue-500",
  3: "bg-green-500",
  4: "bg-purple-500",
}

const blockLightColors = {
  1: "bg-red-50",
  2: "bg-blue-50",
  3: "bg-green-50",
  4: "bg-purple-50",
}

export function AssessmentScreen({ onComplete, onBack, savedAnswers = {}, onSaveProgress }: AssessmentScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>(savedAnswers)
  const [showBlockTransition, setShowBlockTransition] = useState(false)
  const [completedBlocks, setCompletedBlocks] = useState<number[]>([])

  const question = questions[currentQuestion]
  const currentBlock = question.block
  const questionsInCurrentBlock = questions.filter((q) => q.block === currentBlock)
  const currentQuestionInBlock = questionsInCurrentBlock.findIndex((q) => q.id === question.id) + 1
  const totalQuestionsInBlock = questionsInCurrentBlock.length
  const blockProgress = (currentQuestionInBlock / totalQuestionsInBlock) * 100
  const overallProgress = ((currentQuestion + 1) / questions.length) * 100

  const BlockIcon = blockIcons[currentBlock as keyof typeof blockIcons]

  // Carregar resposta salva se existir
  useEffect(() => {
    if (answers[question.id]) {
      setSelectedOption(answers[question.id])
    } else {
      setSelectedOption(null)
    }
  }, [currentQuestion, answers, question.id])

  // Salvar progresso automaticamente
  useEffect(() => {
    if (Object.keys(answers).length > 0 && onSaveProgress) {
      onSaveProgress(answers)
    }
  }, [answers, onSaveProgress])

  const handleOptionSelect = (profile: string) => {
    setSelectedOption(profile)
    const newAnswers = { ...answers, [question.id]: profile }
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (!selectedOption) return

    // Verificar se completou um bloco
    const isLastQuestionInBlock = currentQuestionInBlock === totalQuestionsInBlock
    const isNewBlockCompleted = isLastQuestionInBlock && !completedBlocks.includes(currentBlock)

    if (isNewBlockCompleted) {
      setCompletedBlocks([...completedBlocks, currentBlock])
      if (currentQuestion < questions.length - 1) {
        setShowBlockTransition(true)
        setTimeout(() => {
          setShowBlockTransition(false)
          setCurrentQuestion(currentQuestion + 1)
          setSelectedOption(null)
        }, 2000)
        return
      }
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedOption(null)
    } else {
      // Calcular resultados finais
      const results = { E: 0, C: 0, P: 0, A: 0 }
      Object.values(answers).forEach((answer) => {
        results[answer as keyof typeof results]++
      })
      onComplete(results)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedOption(null)
    }
  }

  // Tela de transição entre blocos
  if (showBlockTransition) {
    const nextBlock = currentBlock + 1
    const NextBlockIcon = blockIcons[nextBlock as keyof typeof blockIcons]
    const nextBlockColor = blockColors[nextBlock as keyof typeof blockColors]
    const nextBlockLightColor = blockLightColors[nextBlock as keyof typeof blockLightColors]
    const nextBlockTitle = questions.find((q) => q.block === nextBlock)?.blockTitle

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4 animate-pulse">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Bloco {currentBlock} Concluído! 🎉</h2>
            <p className="text-slate-600">
              Você já respondeu {Math.round((currentQuestion / questions.length) * 100)}% do questionário
            </p>
          </div>

          {nextBlock <= 4 && (
            <Card className={`${nextBlockLightColor} border-2 border-slate-200`}>
              <CardContent className="p-8">
                <div className="flex items-center justify-center mb-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${nextBlockColor} rounded-full`}>
                    <NextBlockIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Próximo: {nextBlockTitle}</h3>
                <p className="text-slate-600">Continuando para o bloco {nextBlock} de 4...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={currentQuestion === 0 ? onBack : handlePrevious}
              className="text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="text-center">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  Bloco {currentBlock} de 4
                </Badge>
                <span className="text-sm font-medium text-slate-600">
                  {currentQuestionInBlock} de {totalQuestionsInBlock}
                </span>
              </div>
              <p className="text-xs text-slate-500">Progresso geral: {Math.round(overallProgress)}%</p>
            </div>
          </div>

          {/* Block Header */}
          <div className="text-center mb-6">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 ${blockColors[currentBlock]} rounded-full mb-3`}
            >
              <BlockIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{question.blockTitle}</h2>
            <Progress value={blockProgress} className="h-2 bg-slate-200 max-w-md mx-auto" />
          </div>

          {/* Overall Progress */}
          <Progress value={overallProgress} className="h-1 bg-slate-200" />
        </div>

        {/* Question */}
        <Card className="mb-8 border-slate-200 shadow-lg">
          <CardContent className="p-8">
            <div className="mb-6">
              <Badge variant="outline" className="mb-4">
                Pergunta {question.id}
              </Badge>
              <h3 className="text-2xl font-bold text-slate-800 leading-relaxed">{question.text}</h3>
            </div>

            <div className="space-y-4">
              {question.options.map((option, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-md transform hover:scale-[1.02] ${
                    selectedOption === option.profile
                      ? "border-blue-500 bg-blue-50 shadow-md scale-[1.02]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => handleOptionSelect(option.profile)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-4 flex-shrink-0 transition-all duration-200 ${
                          selectedOption === option.profile
                            ? "border-blue-500 bg-blue-500 scale-110"
                            : "border-slate-300"
                        }`}
                      >
                        {selectedOption === option.profile && <CheckCircle className="w-3 h-3 text-white m-0.5" />}
                      </div>
                      <p className="text-slate-700 font-medium leading-relaxed">{option.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Social Proof */}
        <div className="text-center mb-6">
          <p className="text-sm text-slate-500">
            ✨ Mais de <strong>2.400 médicos</strong> já completaram o RevoDisc
          </p>
          <p className="text-xs text-slate-400 mt-1">80% recebem mais oportunidades alinhadas ao seu perfil</p>
        </div>

        {/* Next Button */}
        <div className="text-center">
          <Button
            onClick={handleNext}
            disabled={!selectedOption}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
          >
            {currentQuestion === questions.length - 1 ? "Finalizar Avaliação" : "Próxima"}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          {currentQuestion === questions.length - 1 && (
            <p className="text-sm text-slate-600 mt-3">🎯 Seu perfil personalizado será gerado em instantes!</p>
          )}
        </div>
      </div>
    </div>
  )
}
