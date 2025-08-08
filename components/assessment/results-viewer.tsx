import { AssessmentData } from '@/lib/services/assessment-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Calendar, Clock, BarChart3 } from 'lucide-react'

interface ResultsViewerProps {
  assessment: AssessmentData
  onBack: () => void
  onExport?: () => void
}

export function ResultsViewer({ assessment, onBack, onExport }: ResultsViewerProps) {
  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'disc': return 'DISC'
      case 'soft_skills': return 'Soft Skills'
      case 'sjt': return 'Julgamento Situacional'
      case 'complete': return 'Avaliação Completa'
      default: return type
    }
  }

  const renderDiscResults = () => {
    if (!assessment.disc_results) return null

    const results = assessment.disc_results
    const total = results.D + results.I + results.S + results.C
    
    return (
      <Card className="stellar-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resultados DISC
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(results).map(([key, value]) => {
            if (key === 'responses') return null
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0
            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{key}</span>
                  <span className="text-gray-300">{value} ({percentage}%)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  const renderSoftSkillsResults = () => {
    if (!assessment.soft_skills_results) return null

    const results = assessment.soft_skills_results
    
    return (
      <Card className="stellar-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resultados Soft Skills
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(results).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
                <span className="text-gray-300">{value}/10</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                  style={{ width: `${(value / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const renderSjtResults = () => {
    if (!assessment.sjt_results) return null

    const results = assessment.sjt_results
    const averageScore = results.scores?.reduce((a, b) => a + b, 0) / results.scores?.length || 0
    
    return (
      <Card className="stellar-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resultados SJT
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {Math.round(averageScore * 100)}%
            </div>
            <div className="text-gray-400">Pontuação Média</div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-white font-medium">Respostas por Cenário:</h4>
            {results.responses?.map((response, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300">Cenário {index + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white">{response}/10</span>
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                      style={{ width: `${(response / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {getTypeDisplay(assessment.type)}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
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
              <Badge className="bg-green-500/20 text-green-400">
                {assessment.status === 'completed' ? 'Concluída' : 'Em Andamento'}
              </Badge>
            </div>
          </div>
        </div>

        {onExport && (
          <Button
            onClick={onExport}
            variant="outline"
            className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </div>

      {/* Results */}
      <div className="grid gap-6 lg:grid-cols-2">
        {renderDiscResults()}
        {renderSoftSkillsResults()}
        {renderSjtResults()}
      </div>

      {/* Raw Data (for debugging - can be hidden in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="stellar-card">
          <CardHeader>
            <CardTitle className="text-white">Dados Brutos (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-gray-400 overflow-auto">
              {JSON.stringify(assessment, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}