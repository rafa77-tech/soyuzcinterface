'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { useAssessmentAutoSave } from '@/hooks/use-assessment-autosave'
import { SaveIndicator } from '@/components/assessment/save-indicator'

interface SoftSkillsScreenProps {
  onNext: () => void
  onResults: (results: any) => void
}

const skills = [
  { key: 'comunicacao', label: 'Comunicação', description: 'Capacidade de expressar ideias claramente' },
  { key: 'lideranca', label: 'Liderança', description: 'Habilidade para guiar e inspirar equipes' },
  { key: 'trabalhoEmEquipe', label: 'Trabalho em Equipe', description: 'Colaboração efetiva com colegas' },
  { key: 'resolucaoProblemas', label: 'Resolução de Problemas', description: 'Encontrar soluções criativas e eficazes' },
  { key: 'adaptabilidade', label: 'Adaptabilidade', description: 'Flexibilidade diante de mudanças' }
]

export function SoftSkillsScreen({ onNext, onResults }: SoftSkillsScreenProps) {
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>(
    skills.reduce((acc, skill) => ({ ...acc, [skill.key]: 5 }), {})
  )

  // Use the new auto-save hook
  const { autoSaveState, debouncedSave, completeAssessment, retryManual } = useAssessmentAutoSave({
    assessmentType: 'soft_skills'
  })

  const handleSkillChange = (skillKey: string, value: number[]) => {
    const newSkillLevels = { ...skillLevels, [skillKey]: value[0] }
    setSkillLevels(newSkillLevels)
    
    // Auto-save with debounce using the new hook
    const softSkillsResults = {
      comunicacao: newSkillLevels.comunicacao || 5,
      lideranca: newSkillLevels.lideranca || 5,
      trabalhoEmEquipe: newSkillLevels.trabalhoEmEquipe || 5,
      resolucaoProblemas: newSkillLevels.resolucaoProblemas || 5,
      adaptabilidade: newSkillLevels.adaptabilidade || 5
    }
    
    debouncedSave({
      type: 'soft_skills',
      status: 'in_progress',
      soft_skills_results: softSkillsResults,
      progress_data: {
        skillLevels: newSkillLevels,
        timestamp: new Date().toISOString()
      }
    })
  }

  const handleSubmit = async () => {
    try {
      const softSkillsResults = {
        comunicacao: skillLevels.comunicacao || 5,
        lideranca: skillLevels.lideranca || 5,
        trabalhoEmEquipe: skillLevels.trabalhoEmEquipe || 5,
        resolucaoProblemas: skillLevels.resolucaoProblemas || 5,
        adaptabilidade: skillLevels.adaptabilidade || 5
      }
      
      await completeAssessment({
        type: 'soft_skills',
        status: 'completed',
        soft_skills_results: softSkillsResults,
        progress_data: {
          skillLevels,
          completed: true,
          timestamp: new Date().toISOString()
        }
      })
      
      onResults(skillLevels)
      onNext()
    } catch (error) {
      console.error('Erro ao salvar resultados finais:', error)
      // Continue even with save error
      onResults(skillLevels)
      onNext()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl stellar-card">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl font-bold text-white">
              Autoavaliação de Soft Skills
            </CardTitle>
            <SaveIndicator 
              autoSaveState={autoSaveState}
              onRetryManual={retryManual}
              className="text-xs"
            />
          </div>
          <p className="text-gray-400 text-center">
            Avalie seu nível atual em cada competência (1 = Iniciante, 10 = Especialista)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            {skills.map((skill) => (
              <div key={skill.key} className="space-y-3">
                <div>
                  <Label className="text-white font-medium">{skill.label}</Label>
                  <p className="text-sm text-gray-400">{skill.description}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-400 w-8">1</span>
                  <Slider
                    value={[skillLevels[skill.key]]}
                    onValueChange={(value) => handleSkillChange(skill.key, value)}
                    max={10}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-400 w-8">10</span>
                  <span className="text-white font-medium w-8 text-center">
                    {skillLevels[skill.key]}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <Button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 stellar-glow"
          >
            Continuar para Julgamento Situacional
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
