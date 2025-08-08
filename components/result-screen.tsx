"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Shield, BarChart3 } from "lucide-react"

interface ResultScreenProps {
  results: Record<string, number>
  onBack: () => void
  onFinish: () => void
  onViewDetailedReport: () => void
}

const profileDescriptions = {
  executor: {
    title: "Executor",
    description:
      "Você é orientado para resultados, gosta de desafios e toma decisões rápidas. Prefere ambientes dinâmicos e tem facilidade para liderar em situações de pressão.",
    color: "bg-red-500",
    lightColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  comunicador: {
    title: "Comunicador",
    description:
      "Você é um comunicador natural, gosta de interações, fala com facilidade e lidera pelo entusiasmo. Trabalha bem em equipe e motiva os colegas.",
    color: "bg-yellow-500",
    lightColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  planejador: {
    title: "Planejador",
    description:
      "Você é organizado, metódico e gosta de estrutura. Prefere seguir procedimentos estabelecidos e trabalha bem com prazos e metas claras.",
    color: "bg-green-500",
    lightColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  analista: {
    title: "Analista",
    description:
      "Você é detalhista, preciso e gosta de analisar informações antes de tomar decisões. Valoriza a qualidade e a precisão em tudo que faz.",
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
}

export function ResultScreen({ results, onBack, onFinish, onViewDetailedReport }: ResultScreenProps) {
  const totalAnswers = Object.values(results).reduce((sum, value) => sum + value, 0)

  // Encontrar o perfil dominante
  const dominantProfile = Object.entries(results).reduce((a, b) =>
    (results[a[0]] || 0) > (results[b[0]] || 0) ? a : b,
  )[0] as keyof typeof profileDescriptions

  const dominantProfileData = profileDescriptions[dominantProfile]

  // Calcular percentuais
  const percentages = Object.entries(results)
    .map(([profile, score]) => ({
      profile: profile as keyof typeof profileDescriptions,
      score,
      percentage: totalAnswers > 0 ? Math.round((score / totalAnswers) * 100) : 0,
    }))
    .sort((a, b) => b.score - a.score)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="text-slate-600 hover:text-slate-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Main Result */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Seu Perfil Comportamental</h1>
        </div>

        {/* Dominant Profile Card */}
        <Card className={`mb-8 border-2 ${dominantProfileData.borderColor} ${dominantProfileData.lightColor}`}>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-slate-800">Você é um {dominantProfileData.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto">
              {dominantProfileData.description}
            </p>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <Card className="mb-8 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800 text-center">Distribuição dos Perfis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {percentages.map(({ profile, percentage }) => {
              const profileData = profileDescriptions[profile]
              return (
                <div key={profile} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">{profileData.title}</span>
                    <span className="text-slate-600 font-medium">{percentage}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={percentage} className="h-3 bg-slate-200" />
                    <div
                      className={`absolute top-0 left-0 h-3 rounded-full ${profileData.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Card className="mb-8 border-slate-200 bg-slate-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <strong>Privacidade garantida:</strong> Essas informações são privadas e usadas apenas para melhorar
                  suas oportunidades na Revoluna. Seus dados não são compartilhados com terceiros.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Button
            onClick={onViewDetailedReport}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Ver Relatório Detalhado
          </Button>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onFinish}
              variant="outline"
              className="text-blue-600 border-blue-300 hover:bg-blue-50 bg-transparent"
            >
              Ver Oportunidades Compatíveis
            </Button>
            <Button
              variant="outline"
              onClick={onBack}
              className="text-slate-600 border-slate-300 hover:bg-slate-50 bg-transparent"
            >
              Refazer Avaliação
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
