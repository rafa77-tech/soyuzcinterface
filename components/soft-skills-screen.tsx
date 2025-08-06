'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

interface SoftSkillsScreenProps {
  onNext: () => void
  onResults: (results: any) => void
}

const skills = [
  { key: 'comunicacao', label: 'Comunicação', description: 'Capacidade de expressar ideias claramente' },
  { key: 'lideranca', label: 'Liderança', description: 'Habilidade para guiar e inspirar equipes' },
  { key: 'trabalhoEquipe', label: 'Trabalho em Equipe', description: 'Colaboração efetiva com colegas' },
  { key: 'resolucaoProblemas', label: 'Resolução de Problemas', description: 'Encontrar soluções criativas e eficazes' },
  { key: 'adaptabilidade', label: 'Adaptabilidade', description: 'Flexibilidade diante de mudanças' },
  { key: 'criatividade', label: 'Criatividade', description: 'Capacidade de inovar e pensar fora da caixa' },
  { key: 'gestaoTempo', label: 'Gestão de Tempo', description: 'Organização e priorização de tarefas' },
  { key: 'negociacao', label: 'Negociação', description: 'Habilidade para alcançar acordos benéficos' }
]

export function SoftSkillsScreen({ onNext, onResults }: SoftSkillsScreenProps) {
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>(
    skills.reduce((acc, skill) => ({ ...acc, [skill.key]: 5 }), {})
  )

  const handleSkillChange = (skillKey: string, value: number[]) => {
    setSkillLevels(prev => ({ ...prev, [skillKey]: value[0] }))
  }

  const handleSubmit = () => {
    onResults(skillLevels)
    onNext()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl stellar-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white text-center">
            Autoavaliação de Soft Skills
          </CardTitle>
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
