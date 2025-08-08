'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Download, RotateCcw, TrendingUp, Users, Target, Brain } from 'lucide-react'

interface CompletionScreenProps {
  userData: any
  discResults: { D: number; I: number; S: number; C: number }
  softSkillsResults: any
  sjtResults: number[]
  onRestart: () => void
}

export function CompletionScreen({ 
  userData, 
  discResults, 
  softSkillsResults, 
  sjtResults, 
  onRestart 
}: CompletionScreenProps) {
  // Calculate primary DISC type
  const discEntries = Object.entries(discResults)
  const primaryType = discEntries.reduce((a, b) => discResults[a[0] as keyof typeof discResults] > discResults[b[0] as keyof typeof discResults] ? a : b)[0]
  
  // DISC descriptions
  const discDescriptions = {
    D: { name: 'Dominância', description: 'Orientado para resultados, direto e determinado' },
    I: { name: 'Influência', description: 'Sociável, otimista e persuasivo' },
    S: { name: 'Estabilidade', description: 'Paciente, leal e colaborativo' },
    C: { name: 'Conformidade', description: 'Analítico, preciso e sistemático' }
  }

  // Prepare chart data
  const discChartData = Object.entries(discResults).map(([key, value]) => ({
    type: key,
    score: value,
    percentage: (value / 5) * 100
  }))

  // Chart data for future use
  // const softSkillsChartData = Object.entries(softSkillsResults).map(([key, value]) => ({
  //   skill: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
  //   score: value as number
  // }))

  const radarData = Object.entries(softSkillsResults).map(([key, value]) => ({
    skill: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).substring(0, 10),
    score: value as number
  }))

  const sjtAverage = sjtResults.reduce((a, b) => a + b, 0) / sjtResults.length

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Relatório Completo de Avaliação</h1>
        <p className="text-gray-400">Análise comportamental personalizada para {userData.name}</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
        {/* DISC Analysis */}
        <Card className="stellar-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-400" />
              Análise DISC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-4 py-2 bg-purple-600/20 text-purple-300">
                Perfil Primário: {discDescriptions[primaryType as keyof typeof discDescriptions].name}
              </Badge>
              <p className="text-gray-300 mt-2">
                {discDescriptions[primaryType as keyof typeof discDescriptions].description}
              </p>
            </div>
            
            <ChartContainer
              config={{
                score: {
                  label: "Pontuação",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={discChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="score" fill="var(--color-chart-1)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Soft Skills Radar */}
        <Card className="stellar-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400" />
              Soft Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                score: {
                  label: "Nível",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} />
                  <Radar
                    name="Nível"
                    dataKey="score"
                    stroke="var(--color-chart-2)"
                    fill="var(--color-chart-2)"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* SJT Results */}
        <Card className="stellar-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              Julgamento Situacional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {sjtAverage.toFixed(1)}/10
              </div>
              <p className="text-gray-400">Pontuação média em tomada de decisão</p>
            </div>
            
            <div className="space-y-2">
              {sjtResults.map((score, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-gray-400 w-20">Cenário {index + 1}:</span>
                  <Progress value={(score / 10) * 100} className="flex-1" />
                  <span className="text-white w-12">{score}/10</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="stellar-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-purple-600/10 rounded-lg border border-purple-600/20">
                <h4 className="font-semibold text-purple-300 mb-1">Pontos Fortes</h4>
                <p className="text-gray-300 text-sm">
                  Seu perfil {discDescriptions[primaryType as keyof typeof discDescriptions].name} indica 
                  forte capacidade de {primaryType === 'D' ? 'liderança e tomada de decisão' : 
                  primaryType === 'I' ? 'comunicação e influência' :
                  primaryType === 'S' ? 'colaboração e estabilidade' : 'análise e precisão'}.
                </p>
              </div>
              
              <div className="p-3 bg-blue-600/10 rounded-lg border border-blue-600/20">
                <h4 className="font-semibold text-blue-300 mb-1">Áreas de Desenvolvimento</h4>
                <p className="text-gray-300 text-sm">
                  Considere desenvolver habilidades complementares em 
                  {primaryType === 'D' ? ' paciência e escuta ativa' : 
                  primaryType === 'I' ? ' foco em detalhes e planejamento' :
                  primaryType === 'S' ? ' assertividade e adaptação a mudanças' : ' comunicação interpessoal'}.
                </p>
              </div>
              
              <div className="p-3 bg-green-600/10 rounded-lg border border-green-600/20">
                <h4 className="font-semibold text-green-300 mb-1">Próximos Passos</h4>
                <p className="text-gray-300 text-sm">
                  Baseado em sua avaliação de julgamento situacional ({sjtAverage.toFixed(1)}/10), 
                  recomendamos foco em cenários de {sjtAverage >= 8 ? 'liderança avançada' : 
                  sjtAverage >= 6 ? 'gestão de conflitos' : 'tomada de decisão estruturada'}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <Button
          onClick={onRestart}
          variant="outline"
          className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <RotateCcw className="h-4 w-4" />
          Nova Avaliação
        </Button>
        <Button
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 stellar-glow"
          onClick={() => window.print()}
        >
          <Download className="h-4 w-4" />
          Baixar Relatório
        </Button>
      </div>
    </div>
  )
}
