'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { SavingIndicator } from '@/components/ui/saving-indicator'
import { useAssessmentAutoSave } from '@/hooks/use-assessment-autosave'

interface SJTScreenProps {
  onNext: () => void
  onResults: (results: number[]) => void
}

const scenarios = [
  {
    id: 1,
    situation: "Você está liderando um projeto importante com prazo apertado. Um membro da equipe está consistentemente atrasando suas entregas, impactando todo o cronograma.",
    question: "Qual seria sua abordagem mais efetiva?",
    options: [
      { text: "Conversar individualmente para entender os obstáculos e oferecer suporte", score: 9 },
      { text: "Redistribuir as tarefas entre outros membros da equipe", score: 6 },
      { text: "Estabelecer um plano de acompanhamento mais rigoroso", score: 7 },
      { text: "Reportar a situação ao gestor superior imediatamente", score: 4 }
    ]
  },
  {
    id: 2,
    situation: "Durante uma reunião importante, você percebe que há um conflito crescente entre dois colegas que está afetando a produtividade da discussão.",
    question: "Como você interviria nesta situação?",
    options: [
      { text: "Interromper educadamente e sugerir focar nos objetivos da reunião", score: 8 },
      { text: "Propor uma pausa para que os envolvidos possam se acalmar", score: 7 },
      { text: "Mediar o conflito buscando pontos em comum entre as posições", score: 9 },
      { text: "Aguardar que o conflito se resolva naturalmente", score: 3 }
    ]
  },
  {
    id: 3,
    situation: "Você recebeu feedback negativo sobre um projeto que considerava bem executado. O feedback veio de um cliente importante e inclui críticas que você considera injustas.",
    question: "Qual seria sua reação mais profissional?",
    options: [
      { text: "Agendar uma reunião para esclarecer os pontos e apresentar sua perspectiva", score: 8 },
      { text: "Aceitar o feedback e implementar mudanças imediatamente", score: 6 },
      { text: "Buscar feedback adicional de outros stakeholders antes de agir", score: 7 },
      { text: "Analisar objetivamente o feedback e identificar oportunidades de melhoria", score: 9 }
    ]
  }
]

export function SJTScreen({ onNext, onResults }: SJTScreenProps) {
  const [currentScenario, setCurrentScenario] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)

  const { 
    saveProgress, 
    saveFinalResults, 
    loadIncompleteAssessment,
    isSaving, 
    error,
    lastSaved 
  } = useAssessmentAutoSave({
    assessmentType: 'sjt',
    debounceMs: 500,
    enableLocalBackup: true
  })

  // Carregar dados salvos ao montar o componente
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedAssessment = await loadIncompleteAssessment()
        if (savedAssessment?.sjt_results) {
          setAnswers(savedAssessment.sjt_results)
          // Definir cenário atual baseado no número de respostas
          const savedProgress = savedAssessment.sjt_results.length
          if (savedProgress < scenarios.length) {
            setCurrentScenario(savedProgress)
          }
        }
      } catch (error) {
        console.warn('Falha ao carregar dados salvos:', error)
      }
    }

    loadSavedData()
  }, [loadIncompleteAssessment])

  const handleNext = async () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...answers, selectedAnswer]
      setAnswers(newAnswers)
      
      // Auto-save imediato após resposta
      saveProgress(null, currentScenario + 1, { sjt_results: newAnswers })
      
      if (currentScenario < scenarios.length - 1) {
        setCurrentScenario(currentScenario + 1)
        setSelectedAnswer(null)
      } else {
        try {
          // Salvar resultados finais
          await saveFinalResults({ sjt_results: newAnswers })
          onResults(newAnswers)
          onNext()
        } catch (error) {
          console.error('Erro ao salvar resultados finais:', error)
          // Continuar mesmo com erro de salvamento
          onResults(newAnswers)
          onNext()
        }
      }
    }
  }

  const progress = ((currentScenario + 1) / scenarios.length) * 100

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl stellar-card">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <CardTitle className="text-2xl font-bold text-white">Julgamento Situacional</CardTitle>
            <div className="flex items-center gap-4">
              <SavingIndicator 
                status={isSaving ? 'saving' : error ? 'error' : lastSaved ? 'saved' : 'idle'} 
                className="text-xs"
              />
              <span className="text-sm text-gray-400">
                {currentScenario + 1} de {scenarios.length}
              </span>
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-gray-800/30 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Situação:</h3>
              <p className="text-gray-300 leading-relaxed">
                {scenarios[currentScenario].situation}
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">
                {scenarios[currentScenario].question}
              </h4>
              <RadioGroup 
                value={selectedAnswer?.toString()} 
                onValueChange={(value) => setSelectedAnswer(parseInt(value))}
              >
                {scenarios[currentScenario].options.map((option, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800/30">
                    <RadioGroupItem value={option.score.toString()} id={`option-${index}`} className="mt-1" />
                    <Label htmlFor={`option-${index}`} className="text-gray-300 cursor-pointer flex-1 leading-relaxed">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          
          <Button
            onClick={handleNext}
            disabled={selectedAnswer === null}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 stellar-glow"
          >
            {currentScenario < scenarios.length - 1 ? 'Próximo Cenário' : 'Finalizar Avaliação'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
