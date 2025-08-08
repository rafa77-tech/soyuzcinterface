"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Download,
  Share2,
  TrendingUp,
  Target,
  Users,
  Brain,
  Heart,
  Clock,
  CheckCircle,
  Lightbulb,
  Stethoscope,
  Calendar,
  BarChart3,
} from "lucide-react"

interface DetailedReportScreenProps {
  results: Record<string, number>
  onBack: () => void
  onFinish: () => void
}

const profileDetails = {
  executor: {
    title: "Executor",
    subtitle: "Orientado para Resultados",
    description:
      "Você é um profissional orientado para resultados, que gosta de desafios e toma decisões rápidas. Prefere ambientes dinâmicos e tem facilidade para liderar em situações de pressão.",
    color: "bg-red-500",
    lightColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    strengths: [
      "Tomada de decisão rápida em emergências",
      "Liderança natural em situações críticas",
      "Foco em resultados e eficiência",
      "Capacidade de trabalhar sob pressão",
      "Iniciativa para resolver problemas",
    ],
    challenges: [
      "Pode ser impaciente com processos longos",
      "Tendência a tomar decisões sem consultar a equipe",
      "Dificuldade com tarefas repetitivas",
      "Pode negligenciar detalhes importantes",
    ],
    workStyle: {
      environment: "Pronto-socorro, UTI, cirurgia de emergência",
      communication: "Direto, objetivo, focado em soluções",
      decisionMaking: "Rápido, baseado na experiência",
      teamwork: "Lidera pelo exemplo, delega responsabilidades",
    },
    careerRecommendations: [
      "Medicina de Emergência",
      "Cirurgia Geral",
      "Anestesiologia",
      "Medicina Intensiva",
      "Traumatologia",
    ],
    developmentAreas: [
      "Desenvolver paciência para processos administrativos",
      "Melhorar comunicação com equipe multidisciplinar",
      "Praticar escuta ativa com pacientes",
      "Aprender a delegar de forma mais efetiva",
    ],
  },
  comunicador: {
    title: "Comunicador",
    subtitle: "Focado em Relacionamentos",
    description:
      "Você é um comunicador natural, gosta de interações, fala com facilidade e lidera pelo entusiasmo. Trabalha bem em equipe e motiva os colegas.",
    color: "bg-yellow-500",
    lightColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-700",
    strengths: [
      "Excelente comunicação com pacientes e familiares",
      "Capacidade de motivar e engajar equipes",
      "Habilidade para resolver conflitos",
      "Empatia e inteligência emocional",
      "Facilidade para ensinar e orientar",
    ],
    challenges: [
      "Pode ser muito otimista em situações críticas",
      "Tendência a evitar confrontos necessários",
      "Dificuldade com tarefas solitárias",
      "Pode se distrair com conversas durante o trabalho",
    ],
    workStyle: {
      environment: "Pediatria, psiquiatria, medicina de família",
      communication: "Empático, acolhedor, motivacional",
      decisionMaking: "Colaborativo, busca consenso",
      teamwork: "Facilita discussões, promove harmonia",
    },
    careerRecommendations: ["Pediatria", "Psiquiatria", "Medicina de Família", "Geriatria", "Medicina Preventiva"],
    developmentAreas: [
      "Desenvolver assertividade em situações difíceis",
      "Melhorar foco em tarefas individuais",
      "Aprender a dar feedback construtivo",
      "Equilibrar empatia com objetividade clínica",
    ],
  },
  planejador: {
    title: "Planejador",
    subtitle: "Organizado e Sistemático",
    description:
      "Você é organizado, metódico e gosta de estrutura. Prefere seguir procedimentos estabelecidos e trabalha bem com prazos e metas claras.",
    color: "bg-green-500",
    lightColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    strengths: [
      "Excelente organização e planejamento",
      "Seguimento rigoroso de protocolos",
      "Gestão eficiente de tempo e recursos",
      "Confiabilidade e consistência",
      "Atenção a prazos e procedimentos",
    ],
    challenges: [
      "Pode ser inflexível com mudanças súbitas",
      "Dificuldade em situações não estruturadas",
      "Tendência a ser muito cauteloso",
      "Pode se estressar com imprevistos",
    ],
    workStyle: {
      environment: "Cirurgia eletiva, medicina preventiva, administração",
      communication: "Estruturado, detalhado, por escrito",
      decisionMaking: "Baseado em evidências e protocolos",
      teamwork: "Coordena atividades, mantém organização",
    },
    careerRecommendations: [
      "Cirurgia Eletiva",
      "Medicina Preventiva",
      "Administração Hospitalar",
      "Medicina do Trabalho",
      "Auditoria Médica",
    ],
    developmentAreas: [
      "Desenvolver flexibilidade para mudanças",
      "Melhorar adaptação a emergências",
      "Aprender a tomar decisões rápidas",
      "Equilibrar planejamento com espontaneidade",
    ],
  },
  analista: {
    title: "Analista",
    subtitle: "Preciso e Detalhista",
    description:
      "Você é detalhista, preciso e gosta de analisar informações antes de tomar decisões. Valoriza a qualidade e a precisão em tudo que faz.",
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    strengths: [
      "Análise minuciosa de casos complexos",
      "Precisão em diagnósticos",
      "Pesquisa e atualização constante",
      "Qualidade técnica excepcional",
      "Pensamento crítico apurado",
    ],
    challenges: [
      "Pode ser lento na tomada de decisões",
      "Tendência ao perfeccionismo excessivo",
      "Dificuldade com pressão de tempo",
      "Pode ser crítico demais com colegas",
    ],
    workStyle: {
      environment: "Diagnóstico por imagem, patologia, pesquisa",
      communication: "Técnico, baseado em evidências",
      decisionMaking: "Analítico, baseado em dados",
      teamwork: "Fornece expertise técnica",
    },
    careerRecommendations: ["Radiologia", "Patologia", "Medicina Nuclear", "Pesquisa Clínica", "Medicina Laboratorial"],
    developmentAreas: [
      "Desenvolver agilidade na tomada de decisões",
      "Melhorar comunicação com não-especialistas",
      "Aprender a trabalhar com informações incompletas",
      "Equilibrar precisão com praticidade",
    ],
  },
}

export function DetailedReportScreen({ results, onBack, onFinish }: DetailedReportScreenProps) {
  const totalAnswers = Object.values(results).reduce((sum, value) => sum + value, 0)

  // Encontrar o perfil dominante
  const dominantProfile = Object.entries(results).reduce((a, b) =>
    (results[a[0]] || 0) > (results[b[0]] || 0) ? a : b,
  )[0] as keyof typeof profileDetails

  const dominantProfileData = profileDetails[dominantProfile]

  // Calcular percentuais
  const percentages = Object.entries(results)
    .map(([profile, score]) => ({
      profile: profile as keyof typeof profileDetails,
      score,
      percentage: totalAnswers > 0 ? Math.round((score / totalAnswers) * 100) : 0,
    }))
    .sort((a, b) => b.score - a.score)

  // Calcular perfil secundário
  const secondaryProfile = percentages[1]?.profile
  // const secondaryProfileData = secondaryProfile ? profileDetails[secondaryProfile] : null

  // Gerar insights baseados na combinação de perfis
  const generateInsights = () => {
    // const primary = dominantProfile
    const secondary = secondaryProfile
    const primaryPercentage = percentages[0]?.percentage || 0
    const secondaryPercentage = percentages[1]?.percentage || 0

    const insights = []

    if (primaryPercentage >= 60) {
      insights.push(
        `Seu perfil ${dominantProfileData.title} é muito bem definido (${primaryPercentage}%), indicando características comportamentais consistentes.`,
      )
    } else if (primaryPercentage >= 40) {
      insights.push(
        `Você apresenta um perfil ${dominantProfileData.title} moderado (${primaryPercentage}%), com influências de outros estilos.`,
      )
    }

    if (secondary && secondaryPercentage >= 25) {
      insights.push(
        `Sua característica secundária ${profileDetails[secondary].title} (${secondaryPercentage}%) complementa bem seu perfil principal, oferecendo versatilidade.`,
      )
    }

    return insights
  }

  const insights = generateInsights()

  // Dados estruturados para futura integração com IA
  const reportData = {
    timestamp: new Date().toISOString(),
    assessment: {
      totalQuestions: 5,
      completionRate: 100,
      results: results,
    },
    profiles: {
      dominant: {
        type: dominantProfile,
        percentage: percentages[0]?.percentage || 0,
        ...dominantProfileData,
      },
      secondary: secondaryProfile
        ? {
            type: secondaryProfile,
            percentage: percentages[1]?.percentage || 0,
            ...profileDetails[secondaryProfile],
          }
        : null,
      distribution: percentages,
    },
    insights: insights,
    recommendations: {
      career: dominantProfileData.careerRecommendations,
      development: dominantProfileData.developmentAreas,
      workEnvironment: dominantProfileData.workStyle,
    },
    metadata: {
      version: "1.0",
      language: "pt-BR",
      readyForAI: true,
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack} className="text-slate-600 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Resultados
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-slate-600 bg-transparent">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
              <Button variant="outline" size="sm" className="text-slate-600 bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Report Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Relatório Comportamental Detalhado</h1>
          <p className="text-slate-600">Análise completa do seu perfil profissional RevoDisc</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString("pt-BR")}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Versão 1.0
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <Card className="mb-8 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Resumo Executivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`p-6 rounded-lg ${dominantProfileData.lightColor} border ${dominantProfileData.borderColor}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Badge className={`${dominantProfileData.color} text-white`}>Perfil Dominante</Badge>
                <h3 className="text-2xl font-bold text-slate-800">{dominantProfileData.title}</h3>
                <span className="text-lg font-semibold text-slate-600">({percentages[0]?.percentage}%)</span>
              </div>
              <p className="text-slate-700 leading-relaxed">{dominantProfileData.description}</p>
            </div>

            {insights.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  Insights Principais
                </h4>
                {insights.map((insight, index) => (
                  <p key={index} className="text-slate-600 pl-6">
                    {insight}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Distribution */}
        <Card className="mb-8 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Distribuição Detalhada dos Perfis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {percentages.map(({ profile, percentage }, index) => {
              const profileData = profileDetails[profile]
              return (
                <div key={profile} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0 ? "Dominante" : index === 1 ? "Secundário" : "Complementar"}
                      </Badge>
                      <span className="font-semibold text-slate-800">{profileData.title}</span>
                      <span className="text-slate-500">{profileData.subtitle}</span>
                    </div>
                    <span className="text-slate-600 font-bold text-lg">{percentage}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={percentage} className="h-4 bg-slate-200" />
                    <div
                      className={`absolute top-0 left-0 h-4 rounded-full ${profileData.color} transition-all duration-1000`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Detailed Analysis */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-800">
                <CheckCircle className="w-5 h-5" />
                Pontos Fortes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {dominantProfileData.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-green-800">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Development Areas */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-orange-800">
                <Target className="w-5 h-5" />
                Áreas de Desenvolvimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {dominantProfileData.developmentAreas.map((area, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Target className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-orange-800">{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Work Style Analysis */}
        <Card className="mb-8 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <Users className="w-5 h-5 text-blue-600" />
              Análise do Estilo de Trabalho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    Ambiente Ideal
                  </h4>
                  <p className="text-slate-600">{dominantProfileData.workStyle.environment}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    Tomada de Decisão
                  </h4>
                  <p className="text-slate-600">{dominantProfileData.workStyle.decisionMaking}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-600" />
                    Comunicação
                  </h4>
                  <p className="text-slate-600">{dominantProfileData.workStyle.communication}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    Trabalho em Equipe
                  </h4>
                  <p className="text-slate-600">{dominantProfileData.workStyle.teamwork}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Career Recommendations */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-blue-800">
              <Stethoscope className="w-5 h-5" />
              Especialidades Recomendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dominantProfileData.careerRecommendations.map((specialty, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="p-3 text-center justify-center bg-blue-100 text-blue-800 border-blue-200"
                >
                  {specialty}
                </Badge>
              ))}
            </div>
            <p className="text-blue-700 mt-4 text-sm">
              Essas especialidades são altamente compatíveis com seu perfil comportamental e podem proporcionar maior
              satisfação profissional.
            </p>
          </CardContent>
        </Card>

        {/* AI Integration Data (Hidden but structured for future use) */}
        <div className="hidden" data-report-data={JSON.stringify(reportData)}>
          {/* Dados estruturados para integração futura com IA */}
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Button
            onClick={onFinish}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Encontrar Oportunidades Compatíveis
          </Button>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-50 bg-transparent">
              Agendar Consultoria Personalizada
            </Button>
            <Button
              variant="outline"
              onClick={onBack}
              className="text-slate-600 border-slate-300 hover:bg-slate-50 bg-transparent"
            >
              Voltar aos Resultados
            </Button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            Este relatório foi gerado pelo RevoDisc v1.0 • Revoluna Healthcare Solutions
          </p>
        </div>
      </div>
    </div>
  )
}
