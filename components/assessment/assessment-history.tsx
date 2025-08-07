'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Filter, Eye } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import type { Assessment } from '@/lib/supabase/types'

interface AssessmentHistoryProps {
  onBack: () => void
  onViewResults: (assessment: Assessment) => void
}

const assessmentTypeLabels = {
  complete: 'Avaliação Completa',
  disc: 'DISC',
  soft_skills: 'Soft Skills',
  sjt: 'Julgamento Situacional'
}

const statusLabels = {
  in_progress: 'Em Progresso',
  completed: 'Concluída'
}

const statusColors = {
  in_progress: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  completed: 'bg-green-500/20 text-green-300 border-green-500/30'
}

export function AssessmentHistory({ onBack, onViewResults }: AssessmentHistoryProps) {
  const { user } = useAuth()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (!user) return

    const fetchAssessments = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/assessments')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setAssessments(data.assessments || [])
        setFilteredAssessments(data.assessments || [])
      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
        setError('Falha ao carregar histórico de avaliações')
      } finally {
        setLoading(false)
      }
    }

    fetchAssessments()
  }, [user])

  useEffect(() => {
    let filtered = assessments

    if (typeFilter !== 'all') {
      filtered = filtered.filter(assessment => assessment.type === typeFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(assessment => assessment.status === statusFilter)
    }

    setFilteredAssessments(filtered)
  }, [assessments, typeFilter, statusFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateDuration = (created: string, completed?: string) => {
    if (!completed) return 'Em andamento'
    
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl stellar-card">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-300">Carregando histórico...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl stellar-card">
          <CardContent className="text-center p-8">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={onBack} variant="outline">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl stellar-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-white">
              Histórico de Avaliações
            </CardTitle>
            <Button onClick={onBack} variant="outline" size="sm">
              Voltar
            </Button>
          </div>
          
          {/* Filtros */}
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Filtros:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-400">Tipo:</span>
              {(['all', 'complete', 'disc', 'soft_skills', 'sjt'] as const).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={typeFilter === type ? "default" : "outline"}
                  onClick={() => setTypeFilter(type)}
                  className="text-xs"
                >
                  {type === 'all' ? 'Todos' : assessmentTypeLabels[type as keyof typeof assessmentTypeLabels] || type}
                </Button>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-400">Status:</span>
              {(['all', 'completed', 'in_progress'] as const).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter === status ? "default" : "outline"}
                  onClick={() => setStatusFilter(status)}
                  className="text-xs"
                >
                  {status === 'all' ? 'Todos' : statusLabels[status as keyof typeof statusLabels] || status}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {filteredAssessments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">
                {assessments.length === 0 
                  ? 'Você ainda não realizou nenhuma avaliação.' 
                  : 'Nenhuma avaliação encontrada com os filtros aplicados.'
                }
              </p>
              {assessments.length === 0 && (
                <Button onClick={onBack}>
                  Realizar Primeira Avaliação
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAssessments.map((assessment) => (
                <Card key={assessment.id} className="bg-gray-800/30 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">
                            {assessmentTypeLabels[assessment.type as keyof typeof assessmentTypeLabels]}
                          </h3>
                          <Badge 
                            className={`${statusColors[assessment.status as keyof typeof statusColors]} border`}
                          >
                            {statusLabels[assessment.status as keyof typeof statusLabels]}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Iniciada: {formatDate(assessment.created_at)}</span>
                          </div>
                          
                          {assessment.completed_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Duração: {calculateDuration(assessment.created_at, assessment.completed_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {assessment.status === 'completed' && (
                        <Button
                          onClick={() => onViewResults(assessment)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Resultados
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}