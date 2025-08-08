import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AssessmentData } from '@/lib/services/assessment-service'
import { 
  Calendar, 
  Clock, 
  FileText, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Download,
  Trash2,
  BarChart3
} from 'lucide-react'
import { CompactSaveIndicator } from './save-indicator'

interface AssessmentHistoryProps {
  userId: string
  onViewAssessment?: (assessment: AssessmentData) => void
  onExportAssessment?: (assessment: AssessmentData) => void
  className?: string
}

interface ListParams {
  page: number
  limit: number
  type?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export function AssessmentHistory({ 
  userId, 
  onViewAssessment, 
  onExportAssessment,
  className = '' 
}: AssessmentHistoryProps) {
  const [assessments, setAssessments] = useState<AssessmentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
    hasNextPage: false,
    hasPrevPage: false
  })

  // Filter state
  const [filters, setFilters] = useState<ListParams>({
    page: 1,
    limit: 10
  })

  // Load assessments
  const loadAssessments = async (params: ListParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('page', params.page.toString())
      queryParams.append('limit', params.limit.toString())
      
      if (params.type) queryParams.append('type', params.type)
      if (params.status) queryParams.append('status', params.status)
      if (params.dateFrom) queryParams.append('date_from', params.dateFrom)
      if (params.dateTo) queryParams.append('date_to', params.dateTo)

      const response = await fetch(`/api/assessments?${queryParams}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      setAssessments(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar avaliações')
      setAssessments([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load assessments on mount and filter changes
  useEffect(() => {
    loadAssessments(filters)
  }, [filters])

  // Update filters
  const updateFilters = (newFilters: Partial<ListParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  // Handle pagination
  const goToPage = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  // Format type for display
  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'disc': return 'DISC'
      case 'soft_skills': return 'Soft Skills'
      case 'sjt': return 'SJT'
      case 'complete': return 'Completa'
      default: return type
    }
  }

  // Format status for display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída'
      case 'in_progress': return 'Em Andamento'
      case 'abandoned': return 'Abandonada'
      default: return status
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400'
      case 'in_progress': return 'bg-blue-500/20 text-blue-400'
      case 'abandoned': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  // Filter assessments by search term
  const filteredAssessments = assessments.filter(assessment => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    const typeMatch = getTypeDisplay(assessment.type).toLowerCase().includes(searchLower)
    const statusMatch = getStatusDisplay(assessment.status).toLowerCase().includes(searchLower)
    const dateMatch = new Date(assessment.created_at!).toLocaleDateString('pt-BR').includes(searchLower)
    
    return typeMatch || statusMatch || dateMatch
  })

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Histórico de Avaliações</h2>
          <p className="text-gray-400 mt-1">
            Gerencie e visualize suas avaliações anteriores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CompactSaveIndicator 
            autoSaveState={{
              assessmentId: null,
              isSaving: isLoading,
              lastSaved: null,
              error: error
            }}
            showText={true}
          />
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="stellar-card border-purple-500/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar avaliações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {/* Type Filter */}
            <Select value={filters.type || ''} onValueChange={(value) => updateFilters({ type: value || undefined })}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Tipo de avaliação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                <SelectItem value="complete">Completa</SelectItem>
                <SelectItem value="disc">DISC</SelectItem>
                <SelectItem value="soft_skills">Soft Skills</SelectItem>
                <SelectItem value="sjt">SJT</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filters.status || ''} onValueChange={(value) => updateFilters({ status: value || undefined })}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="abandoned">Abandonada</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range - Simplified */}
            <Select 
              value={filters.dateFrom || ''} 
              onValueChange={(value) => {
                if (value === '30') {
                  const date = new Date()
                  date.setDate(date.getDate() - 30)
                  updateFilters({ dateFrom: date.toISOString() })
                } else if (value === '7') {
                  const date = new Date()
                  date.setDate(date.getDate() - 7)
                  updateFilters({ dateFrom: date.toISOString() })
                } else {
                  updateFilters({ dateFrom: undefined })
                }
              }}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todo período</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {error && (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-400">
                <Trash2 className="h-4 w-4" />
                <span>Erro ao carregar avaliações: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Carregando avaliações...
            </div>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <Card className="stellar-card">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhuma avaliação encontrada
              </h3>
              <p className="text-gray-400">
                {searchTerm || filters.type || filters.status 
                  ? 'Tente ajustar os filtros para encontrar avaliações.'
                  : 'Você ainda não realizou nenhuma avaliação.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Assessment List */}
            <div className="space-y-3">
              {filteredAssessments.map((assessment) => (
                <Card key={assessment.id} className="stellar-card hover:border-purple-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                          <BarChart3 className="h-5 w-5 text-purple-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-white truncate">
                              Avaliação {getTypeDisplay(assessment.type)}
                            </h3>
                            <Badge className={getStatusColor(assessment.status)}>
                              {getStatusDisplay(assessment.status)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(assessment.created_at!).toLocaleDateString('pt-BR')}
                            </div>
                            {assessment.completed_at && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Concluída em {new Date(assessment.completed_at).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {assessment.status === 'completed' && onViewAssessment && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewAssessment(assessment)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {assessment.status === 'completed' && onExportAssessment && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onExportAssessment(assessment)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-800"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Mostrando {((pagination.currentPage - 1) * pagination.pageSize) + 1} a{' '}
                  {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} de{' '}
                  {pagination.totalCount} avaliações
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => goToPage(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="border-gray-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-white px-3 py-1">
                    {pagination.currentPage} de {pagination.totalPages}
                  </span>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => goToPage(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="border-gray-600"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}