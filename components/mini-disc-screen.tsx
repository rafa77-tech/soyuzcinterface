'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/components/providers/auth-provider'
import { useAssessmentAutoSave } from '@/hooks/use-assessment-autosave'
import { SaveIndicator } from '@/components/assessment/save-indicator'

interface MiniDiscScreenProps {
  onNext: () => void
  onResults: (results: { D: number; I: number; S: number; C: number }) => void
}

const questions = [
  {
    id: 1,
    question: "Em situações de pressão, eu tendo a:",
    options: [
      { text: "Tomar decisões rápidas e assumir o controle", type: "D" },
      { text: "Buscar apoio da equipe e manter o otimismo", type: "I" },
      { text: "Manter a calma e seguir procedimentos estabelecidos", type: "S" },
      { text: "Analisar cuidadosamente antes de agir", type: "C" }
    ]
  },
  {
    id: 2,
    question: "Quando trabalho em equipe, eu prefiro:",
    options: [
      { text: "Liderar e definir objetivos claros", type: "D" },
      { text: "Motivar e envolver todos os membros", type: "I" },
      { text: "Colaborar harmoniosamente e apoiar colegas", type: "S" },
      { text: "Contribuir com análises detalhadas e precisas", type: "C" }
    ]
  },
  {
    id: 3,
    question: "Minha abordagem para resolver problemas é:",
    options: [
      { text: "Ação direta e foco em resultados", type: "D" },
      { text: "Brainstorming criativo com outras pessoas", type: "I" },
      { text: "Buscar consenso e soluções estáveis", type: "S" },
      { text: "Pesquisa minuciosa e análise sistemática", type: "C" }
    ]
  },
  {
    id: 4,
    question: "Em mudanças organizacionais, eu:",
    options: [
      { text: "Abraço rapidamente e busco oportunidades", type: "D" },
      { text: "Vejo o lado positivo e ajudo outros a se adaptarem", type: "I" },
      { text: "Preciso de tempo para me ajustar gradualmente", type: "S" },
      { text: "Analiso impactos e planejo cuidadosamente", type: "C" }
    ]
  },
  {
    id: 5,
    question: "Meu estilo de comunicação é:",
    options: [
      { text: "Direto, objetivo e focado em resultados", type: "D" },
      { text: "Entusiástico, expressivo e envolvente", type: "I" },
      { text: "Paciente, empático e colaborativo", type: "S" },
      { text: "Preciso, factual e bem fundamentado", type: "C" }
    ]
  }
]

export function MiniDiscScreen({ onNext, onResults }: MiniDiscScreenProps) {
  const { user } = useAuth()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState('')
  
  // Use the new auto-save hook
  const { autoSaveState, debouncedSave, completeAssessment, retryManual } = useAssessmentAutoSave({
    assessmentType: 'disc'
  })

  const handleNext = () => {
    if (selectedAnswer) {
      const newAnswers = [...answers, selectedAnswer]
      setAnswers(newAnswers)
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer('')
        
        // Auto-save progress with new hook
        debouncedSave({
          type: 'disc',
          status: 'in_progress',
          progress_data: {
            currentQuestion: currentQuestion + 1,
            answers: newAnswers,
            timestamp: new Date().toISOString()
          }
        })
      } else {
        // Calculate final results
        const results = { D: 0, I: 0, S: 0, C: 0 }
        newAnswers.forEach(answer => {
          results[answer as keyof typeof results]++
        })
        
        // Save final results and mark as completed for this phase
        saveFinalResults(results)
        onResults(results)
        onNext()
      }
    }
  }

  const saveFinalResults = async (results: { D: number; I: number; S: number; C: number }) => {
    try {
      await completeAssessment({
        type: 'disc',
        status: 'completed',
        disc_results: results,
        progress_data: {
          currentQuestion: questions.length,
          answers,
          completed: true,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Error saving final DISC results:', error)
    }
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <main role="main" className="w-full max-w-2xl">
        <Card className="w-full stellar-card">
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <CardTitle className="text-2xl font-bold text-white">Análise DISC</CardTitle>
              <div className="flex items-center space-x-2">
                <SaveIndicator 
                  autoSaveState={autoSaveState} 
                  onRetryManual={retryManual}
                  className="text-xs"
                />
                <span className="text-sm text-gray-400">
                  Questão {currentQuestion + 1} de {questions.length}
                </span>
              </div>
            </div>
            <Progress 
              value={progress} 
              className="w-full" 
              aria-label={`Progresso da avaliação: ${Math.round(progress)}% completo`}
            />
          </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              {questions[currentQuestion].question}
            </h3>
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              {questions[currentQuestion].options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-800/30">
                  <RadioGroupItem value={option.type} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="text-gray-300 cursor-pointer flex-1">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <Button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 stellar-glow"
          >
            {currentQuestion < questions.length - 1 ? 'Próxima' : 'Finalizar DISC'}
          </Button>
        </CardContent>
        </Card>
      </main>
    </div>
  )
}
