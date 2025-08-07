'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { Assessment } from '@/lib/supabase/types'

interface ResumeAssessmentModalProps {
  isOpen: boolean
  assessment: Assessment | null
  onResume: (assessment: Assessment) => void
  onStartNew: () => void
  onClose: () => void
}

export function ResumeAssessmentModal({
  isOpen,
  assessment,
  onResume,
  onStartNew,
  onClose
}: ResumeAssessmentModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!assessment) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAssessmentTypeLabel = (type: string) => {
    switch (type) {
      case 'complete':
        return 'Avaliação Completa'
      case 'disc':
        return 'Análise DISC'
      case 'soft_skills':
        return 'Soft Skills'
      case 'sjt':
        return 'Julgamento Situacional'
      default:
        return 'Avaliação'
    }
  }

  const handleResume = async () => {
    setIsLoading(true)
    try {
      onResume(assessment)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartNew = async () => {
    setIsLoading(true)
    try {
      onStartNew()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="stellar-card border-purple-500/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white text-xl">
            Avaliação Incompleta Encontrada
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 space-y-3">
            <p>
              Encontramos uma avaliação que você começou mas não finalizou.
            </p>
            <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Tipo:</span>
                <span className="text-white">{getAssessmentTypeLabel(assessment.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Iniciada em:</span>
                <span className="text-white">{formatDate(assessment.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-yellow-400 capitalize">{assessment.status === 'in_progress' ? 'Em Progresso' : assessment.status}</span>
              </div>
            </div>
            <p className="text-sm">
              Você gostaria de continuar de onde parou ou começar uma nova avaliação?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="space-x-2">
          <AlertDialogCancel 
            onClick={handleStartNew}
            disabled={isLoading}
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            {isLoading ? 'Carregando...' : 'Começar Nova'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleResume}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 stellar-glow"
          >
            {isLoading ? 'Carregando...' : 'Continuar Avaliação'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 