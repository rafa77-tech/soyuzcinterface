'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, Filter, Download, Search, RefreshCw, BarChart3, FileText, Users, Brain } from 'lucide-react'

import { useAssessmentHistory, type AssessmentFilters } from '@/hooks/use-assessment-history'
import { type AssessmentData } from '@/lib/services/assessment-service'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { ResultsViewer } from './results-viewer'

// Quick filter presets
const QUICK_FILTERS = [
  { label: 'Hoje', value: 'today' },
  { label: 'Esta semana', value: 'week' },
  { label: 'Este mês', value: 'month' },
  { label: 'Últimos 3 meses', value: '3months' },
  { label: 'Últimos 6 meses', value: '6months' }
] as const

// Assessment type configurations
const ASSESSMENT_TYPES = {
  complete: { label: 'Avaliação Completa', icon: BarChart3, color: 'bg-blue-500' },
  disc: { label: 'DISC', icon: Users, color: 'bg-green-500' },
  soft_skills: { label: 'Soft Skills', icon: Brain, color: 'bg-purple-500' },
  sjt: { label: 'SJT', icon: FileText, color: 'bg-orange-500' }
} as const

// Status configurations
const STATUS_CONFIG = {
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
  in_progress: { label: 'Em andamento', color: 'bg-yellow-100 text-yellow-800' },
  abandoned: { label: 'Abandonada', color: 'bg-gray-100 text-gray-800' }
} as const

interface AssessmentHistoryProps {
  userId: string
}

export function AssessmentHistory({ userId }: AssessmentHistoryProps) {
  const {
    assessments,
    filteredAssessments,
    allAssessments,
    filters,
    pagination,
    isLoading,
    error,
    setFilters,
    resetFilters,
    setPage,
    refresh,
    stats
  } = useAssessmentHistory(userId)

  // Debug: Log the hook result
  console.log('Hook Result:', { assessments, stats, isLoading, error })

  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentData | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Handle quick filter selection
  const handleQuickFilter = (filterValue: string) => {
    const now = new Date()
    let dateFrom: Date | null = null

    switch (filterValue) {
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case '3months':
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        break
      case '6months':
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        break
    }

    if (dateFrom) {
      setFilters({ dateFrom, dateTo: now })
    }
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof AssessmentFilters, value: any) => {
    setFilters({ [key]: value === '' ? undefined : value })
  }

  // Format completion time
  const formatCompletionTime = (assessment: AssessmentData): string => {
    if (assessment.status !== 'completed' || !assessment.created_at || !assessment.completed_at) {
      return 'N/A'
    }

    const start = new Date(assessment.created_at)
    const end = new Date(assessment.completed_at)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.round(diffMs / (1000 * 60))

    if (diffMins < 60) {
      return `${diffMins}min`
    } else {
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      return `${hours}h ${mins}min`
    }
  }

  // Export functionality
  const handleExport = async (assessment: AssessmentData, format: 'pdf' | 'csv') => {
    try {
      console.log(`Exporting assessment ${assessment.id} as ${format}`)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-8 w-20 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Empty state
  const EmptyState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhuma avaliação encontrada
        </h3>
        <p className="text-gray-500 mb-4">
          {filteredAssessments.length === 0 && allAssessments.length > 0
            ? 'Tente ajustar os filtros para encontrar suas avaliações.'
            : 'Você ainda não possui avaliações. Comece sua primeira avaliação!'}
        </p>
        {filteredAssessments.length === 0 && allAssessments.length > 0 && (
          <Button onClick={resetFilters} variant="outline">
            Limpar filtros
          </Button>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Avaliações</h1>
          <p className="text-gray-500">
            {stats.totalCompleted} concluídas • {stats.totalInProgress} em andamento
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={refresh} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            onClick={() => handleQuickFilter(filter.value)}
            variant="outline"
            size="sm"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar histórico: {error.message}
            <Button onClick={refresh} variant="outline" size="sm" className="ml-2">
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Assessment list */}
      <div className="space-y-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : assessments.length === 0 ? (
          <EmptyState />
        ) : (
          assessments.map((assessment) => {
            const typeConfig = ASSESSMENT_TYPES[assessment.type]
            const statusConfig = STATUS_CONFIG[assessment.status as keyof typeof STATUS_CONFIG]
            const IconComponent = typeConfig.icon

            return (
              <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Type icon */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>

                      {/* Assessment info */}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {typeConfig.label}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {assessment.created_at && format(new Date(assessment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatCompletionTime(assessment)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status and actions */}
                    <div className="flex items-center space-x-3">
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>

                      <div className="flex items-center space-x-2">
                        {assessment.status === 'completed' && (
                          <>
                            <Button
                              onClick={() => setSelectedAssessment(assessment)}
                              variant="outline"
                              size="sm"
                            >
                              Ver resultados
                            </Button>
                            <Button
                              onClick={() => handleExport(assessment, 'pdf')}
                              variant="outline"
                              size="sm"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Results viewer modal */}
      {selectedAssessment && (
        <ResultsViewer
          assessment={selectedAssessment}
          isOpen={!!selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}
    </div>
  )
}
