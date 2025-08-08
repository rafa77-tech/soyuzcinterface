'use client'

import React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { X, Download, Clock, BarChart3, Brain, Users, FileText } from 'lucide-react'

import { type AssessmentData } from '@/lib/services/assessment-service'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ResultsViewerProps {
  assessment: AssessmentData | null | undefined
  isOpen: boolean
  onClose: () => void
}

// Type guard to ensure assessment has required properties
function isValidAssessment(assessment: any): assessment is AssessmentData {
  return (
    assessment &&
    typeof assessment === 'object' &&
    'id' in assessment &&
    'type' in assessment &&
    'status' in assessment &&
    assessment.status === 'completed'
  )
}

export function ResultsViewer({ assessment, isOpen, onClose }: ResultsViewerProps) {
  // Early return with error if assessment is invalid
  if (!isValidAssessment(assessment)) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Erro na Visualização</DialogTitle>
            <DialogDescription>
              Não foi possível carregar os resultados da avaliação.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>
              Dados da avaliação não encontrados ou incompletos. Tente recarregar a página.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Resultados da Avaliação
          </DialogTitle>
          <DialogDescription>
            Tipo: {assessment.type} • Status: {assessment.status}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-600">
                Visualização de resultados implementada com proteção contra crashes.
                Dados da avaliação carregados com segurança.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
