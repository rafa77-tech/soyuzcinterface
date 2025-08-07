'use client'

import { useState, useEffect } from 'react'
import { X, Download, Calendar, Clock, User, BarChart, PieChart, Target } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Assessment, DiscResults, SoftSkillsResults, SjtResults } from '@/lib/supabase/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AssessmentDetailViewProps {
  assessmentId: string | null
  isOpen: boolean
  onClose: () => void
  onExport?: (assessmentId: string) => void
}

const typeLabels = {
  complete: 'Avaliação Completa',
  disc: 'DISC',
  soft_skills: 'Soft Skills',
  sjt: 'Julgamento Situacional'
}

const statusLabels = {
  completed: 'Concluída',
  in_progress: 'Em andamento'
}

const discLabels = {
  D: 'Dominância',
  I: 'Influência', 
  S: 'Estabilidade',
  C: 'Conformidade'
}

const discColors = {
  D: 'bg-red-500',
  I: 'bg-yellow-500',
  S: 'bg-green-500',
  C: 'bg-blue-500'
}

export function AssessmentDetailView({ 
  assessmentId, 
  isOpen, 
  onClose, 
  onExport 
}: AssessmentDetailViewProps) {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch assessment details
  useEffect(() => {
    if (!assessmentId || !isOpen) {
      setAssessment(null)
      setError(null)
      return
    }

    const fetchAssessment = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/assessment/${assessmentId}`)
        
        if (!response.ok) {
          throw new Error('Falha ao carregar detalhes da avaliação')
        }

        const data: Assessment = await response.json()
        setAssessment(data)
      } catch (error) {
        console.error('Error fetching assessment:', error)
        setError(error instanceof Error ? error.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchAssessment()
  }, [assessmentId, isOpen])

  // Calculate duration
  const calculateDuration = (assessment: Assessment) => {
    if (!assessment.completed_at) return null
    
    const start = new Date(assessment.created_at)
    const end = new Date(assessment.completed_at)
    const diffInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutos`
    } else {
      const hours = Math.floor(diffInMinutes / 60)
      const minutes = diffInMinutes % 60
      return `${hours}h ${minutes}min`
    }
  }

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Render DISC results
  const renderDiscResults = (results: DiscResults) => {
    const total = results.D + results.I + results.S + results.C
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="size-5" />
            Resultados DISC
          </CardTitle>
          <CardDescription>
            Perfil comportamental baseado no método DISC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(results).map(([key, value]) => {
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`size-3 rounded-full ${discColors[key as keyof typeof discColors]}`} />
                      <span className="font-medium">{discLabels[key as keyof typeof discLabels]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{value} pontos</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
          
          {/* DISC Interpretation */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Interpretação do Perfil</h4>
            <p className="text-sm text-muted-foreground">
              {total > 0 && (() => {
                const dominant = Object.entries(results).reduce((a, b) => 
                  results[a[0] as keyof DiscResults] > results[b[0] as keyof DiscResults] ? a : b
                )[0] as keyof DiscResults
                
                const interpretations = {
                  D: 'Perfil dominante: Orientado para resultados, direto e decisivo.',
                  I: 'Perfil influente: Comunicativo, otimista e persuasivo.',
                  S: 'Perfil estável: Colaborativo, paciente e confiável.',
                  C: 'Perfil conforme: Analítico, preciso e sistemático.'
                }
                
                return interpretations[dominant]
              })()}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render Soft Skills results
  const renderSoftSkillsResults = (results: SoftSkillsResults) => {
    const skillLabels: Record<string, string> = {
      comunicacao: 'Comunicação',
      lideranca: 'Liderança',
      trabalho_equipe: 'Trabalho em Equipe',
      adaptabilidade: 'Adaptabilidade',
      resolucao_problemas: 'Resolução de Problemas',
      pensamento_critico: 'Pensamento Crítico',
      gestao_tempo: 'Gestão de Tempo',
      inteligencia_emocional: 'Inteligência Emocional'
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-5" />
            Resultados Soft Skills
          </CardTitle>
          <CardDescription>
            Competências comportamentais e interpessoais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(results).map(([skill, score]) => {
              const skillLabel = skillLabels[skill] || skill
              const percentage = Math.round(score)
              
              return (
                <div key={skill} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{skillLabel}</span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>

          {/* Skills Analysis */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                Pontos Fortes
              </h4>
              <div className="text-sm text-green-700 dark:text-green-300">
                {Object.entries(results)
                  .filter(([_, score]) => score >= 80)
                  .map(([skill, _]) => skillLabels[skill] || skill)
                  .join(', ') || 'Continue desenvolvendo suas habilidades'}
              </div>
            </div>
            
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                Áreas de Melhoria
              </h4>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                {Object.entries(results)
                  .filter(([_, score]) => score < 60)
                  .map(([skill, _]) => skillLabels[skill] || skill)
                  .join(', ') || 'Parabéns! Todas as competências estão bem desenvolvidas'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render SJT results
  const renderSjtResults = (results: SjtResults) => {
    const totalQuestions = results.length
    const correctAnswers = results.reduce((sum, score) => sum + score, 0)
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="size-5" />
            Resultados SJT
          </CardTitle>
          <CardDescription>
            Julgamento Situacional - Respostas e análise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Performance */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">{accuracy}%</div>
              <div className="text-sm text-muted-foreground">
                {correctAnswers} de {totalQuestions} respostas alinhadas com melhores práticas
              </div>
            </div>

            {/* Question by Question */}
            <div className="space-y-3">
              <h4 className="font-semibold">Detalhamento por Questão</h4>
              {results.map((score, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <span className="font-medium">Cenário {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={score > 0.5 ? 'default' : 'secondary'}>
                      {score > 0.5 ? 'Adequada' : 'Pode melhorar'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(score * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Analysis */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Análise de Performance</h4>
              <p className="text-sm text-muted-foreground">
                {accuracy >= 80 
                  ? 'Excelente capacidade de julgamento situacional. Suas respostas demonstram forte alinhamento com práticas recomendadas.'
                  : accuracy >= 60
                  ? 'Boa capacidade de julgamento situacional. Algumas situações podem se beneficiar de maior reflexão.'
                  : 'Há oportunidades de desenvolvimento na tomada de decisões situacionais. Considere estudar mais cenários práticos.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] m-4 bg-background rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Calendar className="size-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">
                {assessment ? typeLabels[assessment.type] : 'Detalhes da Avaliação'}
              </h2>
              {assessment && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(assessment.created_at), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {assessment && onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport(assessment.id)}
              >
                <Download className="size-4" />
                Exportar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading && (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando detalhes...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {assessment && !loading && !error && (
            <div className="p-6 space-y-6">
              {/* Assessment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="size-5" />
                    Informações da Avaliação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                      <p className="font-medium">{typeLabels[assessment.type]}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="flex items-center gap-2">
                        <Badge variant={assessment.status === 'completed' ? 'default' : 'secondary'}>
                          {statusLabels[assessment.status]}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Iniciada em</label>
                      <p className="font-medium">
                        {format(new Date(assessment.created_at), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    {assessment.completed_at && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Duração</label>
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-muted-foreground" />
                          <p className="font-medium">{calculateDuration(assessment)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              {assessment.status === 'completed' && (
                <div className="space-y-6">
                  {/* DISC Results */}
                  {assessment.disc_results && renderDiscResults(assessment.disc_results as unknown as DiscResults)}
                  
                  {/* Soft Skills Results */}
                  {assessment.soft_skills_results && renderSoftSkillsResults(assessment.soft_skills_results as unknown as SoftSkillsResults)}
                  
                  {/* SJT Results */}
                  {assessment.sjt_results && renderSjtResults(assessment.sjt_results as unknown as SjtResults)}
                </div>
              )}

              {/* In Progress Assessment */}
              {assessment.status === 'in_progress' && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="size-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Avaliação em Andamento</h3>
                    <p className="text-muted-foreground mb-4">
                      Esta avaliação ainda não foi concluída. Os resultados serão exibidos após a finalização.
                    </p>
                    <Button>
                      Continuar Avaliação
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 