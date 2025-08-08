import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AssessmentData } from '@/lib/services/assessment-service'
import { Calendar, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ResumeAssessmentModalProps {
  assessment: AssessmentData | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onResume: () => void
  onStartNew: () => void
}

export function ResumeAssessmentModal({
  assessment,
  isOpen,
  onOpenChange,
  onResume,
  onStartNew
}: ResumeAssessmentModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!assessment) return null

  const handleResume = async () => {
    setIsLoading(true)
    try {
      await onResume()
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartNew = async () => {
    setIsLoading(true)
    try {
      await onStartNew()
    } finally {
      setIsLoading(false)
    }
  }

  // Format assessment type for display
  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'disc': return 'DISC'
      case 'soft_skills': return 'Soft Skills'
      case 'sjt': return 'Julgamento Situacional'
      case 'complete': return 'Avaliação Completa'
      default: return type
    }
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!assessment.progress_data) return 0

    const progressData = assessment.progress_data
    
    if (assessment.type === 'disc') {
      return progressData.currentQuestion ? (progressData.currentQuestion / 5) * 100 : 0
    } else if (assessment.type === 'soft_skills') {
      // Check how many skills have been set (assuming 5 skills)
      const skills = progressData.skillLevels || {}
      const setSkills = Object.values(skills).filter((value: any) => value !== 5).length
      return (setSkills / 5) * 100
    } else if (assessment.type === 'sjt') {
      return progressData.currentScenario ? (progressData.currentScenario / 3) * 100 : 0
    }
    
    return 0
  }

  const progress = calculateProgress()
  const updatedAt = new Date(assessment.updated_at!)
  const timeAgo = getTimeAgo(updatedAt)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg stellar-card border-purple-500/20">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FileText className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Avaliação Incompleta Encontrada
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-1">
                Você tem uma avaliação em andamento. Deseja continuar de onde parou?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Assessment Details Card */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-white">
                    {getTypeDisplay(assessment.type)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  {timeAgo}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Progresso:</span>
                  <span className="text-white font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="h-4 w-4" />
                Iniciado em {updatedAt.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleResume}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 stellar-glow"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Carregando...
                </div>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Continuar Avaliação
                </>
              )}
            </Button>

            <Button
              onClick={handleStartNew}
              disabled={isLoading}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Começar Nova
            </Button>
          </div>

          {/* Warning Message */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-amber-400 font-medium">Importante:</p>
                <p className="text-gray-300 mt-1">
                  Se escolher "Começar Nova", sua avaliação atual será marcada como abandonada 
                  e você perderá todo o progresso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to get time ago string
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return 'agora mesmo'
  if (minutes < 60) return `${minutes}min atrás`
  if (hours < 24) return `${hours}h atrás`
  if (days === 1) return 'ontem'
  return `${days} dias atrás`
}