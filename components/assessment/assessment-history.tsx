'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Eye, Calendar, Filter, RefreshCw, Search, History } from 'lucide-react'
import { Assessment } from '@/lib/supabase/types'
import { AssessmentListResponse } from '@/lib/services/assessment-service'
import { AssessmentDetailView } from './assessment-detail-view'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { useDebounce } from '@/hooks/use-debounce'

interface AssessmentHistoryState {
  assessments: Pick<Assessment, 'id' | 'type' | 'status' | 'created_at' | 'completed_at'>[]
  pagination: {
    total: number
    page: number
    limit: number
  }
  loading: boolean
  error: string | null
}

interface Filters {
  type: 'all' | 'complete' | 'disc' | 'soft_skills' | 'sjt'
  status: 'all' | 'completed' | 'in_progress'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'three_months' | 'six_months'
  search: string
}

const initialFilters: Filters = {
  type: 'all',
  status: 'all',
  dateRange: 'all',
  search: ''
}

const typeLabels = {
  complete: 'Completa',
  disc: 'DISC',
  soft_skills: 'Soft Skills',
  sjt: 'SJT'
}

const statusLabels = {
  completed: 'Concluída',
  in_progress: 'Em andamento'
}

// Constante para evitar dependência de estado stale
const ITEMS_PER_PAGE = 20

export function AssessmentHistory() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [state, setState] = useState<AssessmentHistoryState>({
    assessments: [],
    pagination: { total: 0, page: 1, limit: ITEMS_PER_PAGE },
    loading: true,
    error: null
  })
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [exportingAssessment, setExportingAssessment] = useState<string | null>(null)

  // Debounce search input for better performance
  const debouncedSearchTerm = useDebounce(filters.search, 300)

  // Fetch assessment history
  const fetchAssessments = useCallback(async (page = 1) => {
    if (!user) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const url = new URL('/api/assessments', window.location.origin)
      url.searchParams.set('page', page.toString())
      url.searchParams.set('limit', ITEMS_PER_PAGE.toString())

      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error('Falha ao carregar histórico de avaliações')
      }

      const data: AssessmentListResponse = await response.json()

      setState(prev => ({
        ...prev,
        assessments: data.assessments,
        pagination: { ...data.pagination, page },
        loading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        loading: false
      }))
    }
  }, [user])

  // Export functionality implementation
  const handleExportAssessment = useCallback(async (assessmentId: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado para exportar.",
        variant: "destructive"
      })
      return
    }

    setExportingAssessment(assessmentId)
    
    try {
      // First, fetch the complete assessment data
      const response = await fetch(`/api/assessment/${assessmentId}`)
      
      if (!response.ok) {
        throw new Error('Falha ao buscar dados da avaliação')
      }

      const assessmentData: Assessment = await response.json()

      // Generate PDF export
      const exportResponse = await fetch('/api/assessment/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId,
          format: 'pdf'
        })
      })

      if (!exportResponse.ok) {
        throw new Error('Falha ao gerar exportação')
      }

      // Download the file
      const blob = await exportResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `avaliacao-${assessmentData.type}-${format(new Date(assessmentData.created_at), 'yyyy-MM-dd')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Sucesso",
        description: "Avaliação exportada com sucesso!",
      })

    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : 'Erro desconhecido ao exportar',
        variant: "destructive"
      })
    } finally {
      setExportingAssessment(null)
    }
  }, [user, toast])

  // Navigate to resume assessment
  const handleResumeAssessment = useCallback((assessmentId: string) => {
    // Navigate to the appropriate assessment screen based on type
    const assessment = state.assessments.find(a => a.id === assessmentId)
    if (!assessment) return

    let resumeUrl = ''
    switch (assessment.type) {
      case 'complete':
        resumeUrl = `/assessment/complete?resume=${assessmentId}`
        break
      case 'disc':
        resumeUrl = `/assessment/disc?resume=${assessmentId}`
        break
      case 'soft_skills':
        resumeUrl = `/assessment/soft-skills?resume=${assessmentId}`
        break
      case 'sjt':
        resumeUrl = `/assessment/sjt?resume=${assessmentId}`
        break
      default:
        toast({
          title: "Erro",
          description: "Tipo de avaliação não reconhecido",
          variant: "destructive"
        })
        return
    }

    // Navigate to resume URL
    window.location.href = resumeUrl
  }, [state.assessments, toast])

  // Filter assessments client-side with optimized memoization
  const filteredAssessments = useMemo(() => {
    return state.assessments.filter(assessment => {
      // Type filter
      if (filters.type !== 'all' && assessment.type !== filters.type) {
        return false
      }

      // Status filter
      if (filters.status !== 'all' && assessment.status !== filters.status) {
        return false
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date()
        const assessmentDate = new Date(assessment.created_at)
        
        const diffInDays = Math.floor((now.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24))
        
        switch (filters.dateRange) {
          case 'today':
            if (diffInDays > 0) return false
            break
          case 'week':
            if (diffInDays > 7) return false
            break
          case 'month':
            if (diffInDays > 30) return false
            break
          case 'three_months':
            if (diffInDays > 90) return false
            break
          case 'six_months':
            if (diffInDays > 180) return false
            break
        }
      }

      // Search filter (using debounced search term for performance)
      if (debouncedSearchTerm) {
        const searchTerm = debouncedSearchTerm.toLowerCase()
        const typeLabel = typeLabels[assessment.type].toLowerCase()
        if (!typeLabel.includes(searchTerm)) {
          return false
        }
      }

      return true
    })
  }, [state.assessments, filters.type, filters.status, filters.dateRange, debouncedSearchTerm])

  // Memoize filter statistics for performance
  const filterStats = useMemo(() => ({
    total: state.assessments.length,
    filtered: filteredAssessments.length,
    hasFilters: filters.type !== 'all' || filters.status !== 'all' || 
                filters.dateRange !== 'all' || debouncedSearchTerm !== ''
  }), [state.assessments.length, filteredAssessments.length, filters.type, 
       filters.status, filters.dateRange, debouncedSearchTerm])

  // Calculate duration for completed assessments
  const calculateDuration = useCallback((assessment: Pick<Assessment, 'created_at' | 'completed_at'>) => {
    if (!assessment.completed_at) return null
    
    const start = new Date(assessment.created_at)
    const end = new Date(assessment.completed_at)
    const diffInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}min`
    } else {
      const hours = Math.floor(diffInMinutes / 60)
      const minutes = diffInMinutes % 60
      return `${hours}h ${minutes}min`
    }
  }, [])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [])

  // Load assessments when user changes or component mounts
  useEffect(() => {
    if (user && !authLoading) {
      fetchAssessments()
    }
  }, [user, authLoading, fetchAssessments])

  // Show loading when auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando...</span>
      </div>
    )
  }

  // Show unauthorized state
  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          Você precisa estar autenticado para ver o histórico de avaliações.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="size-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Histórico de Avaliações</h1>
            <p className="text-muted-foreground">
              Acompanhe sua evolução e revise resultados passados
            </p>
          </div>
        </div>
        <Button 
          variant="outline"
          onClick={() => fetchAssessments(state.pagination.page)}
          disabled={state.loading}
        >
          <RefreshCw className={`size-4 ${state.loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="size-4" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por tipo de avaliação..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as Filters['type'] }))}
                  className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="complete">Completa</option>
                  <option value="disc">DISC</option>
                  <option value="soft_skills">Soft Skills</option>
                  <option value="sjt">SJT</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as Filters['status'] }))}
                  className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md"
                >
                  <option value="all">Todos os status</option>
                  <option value="completed">Concluída</option>
                  <option value="in_progress">Em andamento</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as Filters['dateRange'] }))}
                  className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md"
                >
                  <option value="all">Todos os períodos</option>
                  <option value="today">Hoje</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mês</option>
                  <option value="three_months">Últimos 3 meses</option>
                  <option value="six_months">Últimos 6 meses</option>
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Limpar Filtros
              </Button>
              <span className="text-sm text-muted-foreground">
                {filterStats.filtered} de {filterStats.total} avaliações
              </span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Error State */}
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {state.loading && (
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Carregando avaliações...</span>
        </div>
      )}

      {/* Empty State */}
      {!state.loading && filteredAssessments.length === 0 && !state.error && (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {filterStats.total === 0 
                ? 'Você ainda não possui avaliações. Comece uma nova avaliação para ver o histórico aqui.'
                : 'Nenhuma avaliação corresponde aos filtros aplicados. Tente ajustar os critérios de busca.'
              }
            </p>
            {filterStats.hasFilters && (
              <Button variant="outline" onClick={resetFilters}>
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assessment List */}
      {!state.loading && filteredAssessments.length > 0 && (
        <div className="space-y-4">
          {filteredAssessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Assessment Type Icon */}
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="size-6 text-primary" />
                    </div>

                    {/* Assessment Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{typeLabels[assessment.type]}</h3>
                        <Badge 
                          variant={assessment.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {statusLabels[assessment.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {format(new Date(assessment.created_at), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                        </span>
                        {assessment.completed_at && (
                          <span>Duração: {calculateDuration(assessment)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {assessment.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAssessment(assessment.id)}
                        >
                          <Eye className="size-4" />
                          Ver Detalhes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportAssessment(assessment.id)}
                          disabled={exportingAssessment === assessment.id}
                        >
                          {exportingAssessment === assessment.id ? (
                            <RefreshCw className="size-4 animate-spin" />
                          ) : (
                            <Download className="size-4" />
                          )}
                          {exportingAssessment === assessment.id ? 'Exportando...' : 'Exportar'}
                        </Button>
                      </>
                    )}
                    {assessment.status === 'in_progress' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleResumeAssessment(assessment.id)}
                      >
                        Continuar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!state.loading && state.pagination.total > state.pagination.limit && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchAssessments(state.pagination.page - 1)}
            disabled={state.pagination.page <= 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Página {state.pagination.page} de {Math.ceil(state.pagination.total / state.pagination.limit)}
          </span>
          <Button
            variant="outline"
            onClick={() => fetchAssessments(state.pagination.page + 1)}
            disabled={state.pagination.page >= Math.ceil(state.pagination.total / state.pagination.limit)}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Assessment Detail Modal */}
      <AssessmentDetailView
        assessmentId={selectedAssessment}
        isOpen={selectedAssessment !== null}
        onClose={() => setSelectedAssessment(null)}
        onExport={handleExportAssessment}
      />
    </div>
  )
}