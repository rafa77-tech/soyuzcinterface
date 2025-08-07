'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import type { Assessment } from '@/lib/supabase/types'

interface ResultsViewerProps {
  assessment: Assessment
  onBack: () => void
}

export function ResultsViewer({ assessment, onBack }: ResultsViewerProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateDuration = (created: string, completed: string) => {
    const start = new Date(created)
    const end = new Date(completed)
    const durationMs = end.getTime() - start.getTime()
    const durationMinutes = Math.round(durationMs / (1000 * 60))
    
    if (durationMinutes < 60) {
      return `${durationMinutes} min`
    } else {
      const hours = Math.floor(durationMinutes / 60)
      const minutes = durationMinutes % 60
      return `${hours}h ${minutes}min`
    }
  }

  const renderDiscResults = () => {
    if (!assessment.disc_results) return null
    
    const results = assessment.disc_results as any
    const total = results.D + results.I + results.S + results.C
    
    return (
      <Card className="bg-gray-800/30 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Resultados DISC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(results).map(([dimension, score]) => {
            const percentage = ((score as number) / total) * 100
            return (
              <div key={dimension} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white font-medium">
                    {dimension === 'D' ? 'Dominância' :
                     dimension === 'I' ? 'Influência' :
                     dimension === 'S' ? 'Estabilidade' : 'Conscienciosidade'}
                  </span>
                  <span className="text-gray-300">{score} ({percentage.toFixed(1)}%)</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  const renderSoftSkillsResults = () => {
    if (!assessment.soft_skills_results) return null
    
    const results = assessment.soft_skills_results as any
    
    const skillLabels = {
      comunicacao: 'Comunicação',
      lideranca: 'Liderança',
      trabalhoEquipe: 'Trabalho em Equipe',
      resolucaoProblemas: 'Resolução de Problemas',
      adaptabilidade: 'Adaptabilidade',
      criatividade: 'Criatividade',
      gestaoTempo: 'Gestão de Tempo',
      negociacao: 'Negociação'
    }
    
    return (
      <Card className="bg-gray-800/30 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Resultados Soft Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(results).map(([skill, score]) => {
            const percentage = ((score as number) / 10) * 100
            return (
              <div key={skill} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white font-medium">
                    {skillLabels[skill as keyof typeof skillLabels] || skill}
                  </span>
                  <span className="text-gray-300">{score}/10</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  const renderSjtResults = () => {
    if (!assessment.sjt_results) return null
    
    const results = assessment.sjt_results as number[]
    const average = results.reduce((a, b) => a + b, 0) / results.length
    const maxScore = 9 // Based on the scenario options
    const percentage = (average / maxScore) * 100
    
    return (
      <Card className="bg-gray-800/30 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Resultados Julgamento Situacional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {average.toFixed(1)}/9.0
            </div>
            <div className="text-gray-300 mb-4">Pontuação Média</div>
            <Progress value={percentage} className="h-3 mb-4" />
            <div className="text-sm text-gray-400">
              {percentage >= 80 ? 'Excelente' :
               percentage >= 70 ? 'Muito Bom' :
               percentage >= 60 ? 'Bom' :
               percentage >= 50 ? 'Regular' : 'Precisa Melhorar'}
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-white font-medium mb-3">Pontuações por Cenário:</h4>
            <div className="grid gap-2">
              {results.map((score, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-300">Cenário {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(score / maxScore) * 100} className="h-2 w-20" />
                    <span className="text-white font-medium w-8 text-right">{score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getAssessmentTitle = () => {
    switch (assessment.type) {
      case 'complete':
        return 'Avaliação Completa'
      case 'disc':
        return 'Avaliação DISC'
      case 'soft_skills':
        return 'Avaliação de Soft Skills'
      case 'sjt':
        return 'Julgamento Situacional'
      default:
        return 'Resultados da Avaliação'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl stellar-card">
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          
          <CardTitle className="text-2xl font-bold text-white mb-4">
            {getAssessmentTitle()}
          </CardTitle>
          
          <div className="flex gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Concluída: {formatDate(assessment.completed_at!)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Duração: {calculateDuration(assessment.created_at, assessment.completed_at!)}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {assessment.type === 'complete' && (
            <div className="space-y-6">
              {renderDiscResults()}
              {renderSoftSkillsResults()}
              {renderSjtResults()}
            </div>
          )}
          
          {assessment.type === 'disc' && renderDiscResults()}
          {assessment.type === 'soft_skills' && renderSoftSkillsResults()}
          {assessment.type === 'sjt' && renderSjtResults()}
        </CardContent>
      </Card>
    </div>
  )
}