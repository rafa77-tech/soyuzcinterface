"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Download,
  Share2,
  Smartphone,
  Star,
  CheckCircle,
  ExternalLink,
  MessageCircle,
  Trophy,
  Gift,
  QrCode,
} from "lucide-react"
import { AIChatWidget } from "./ai-chat-widget"

interface UserData {
  id: string
  name: string
  email: string
  phone: string
  crm: string
  specialty: string
  isNewUser: boolean
}

interface FinalReportScreenProps {
  results: Record<string, number>
  userData: UserData
  onBack: () => void
  onStartOver: () => void
}

const profileDetails = {
  E: {
    title: "Executor",
    subtitle: "Orientado para Resultados",
    description: "Você é um profissional orientado para resultados, que gosta de desafios e toma decisões rápidas.",
    color: "bg-red-500",
    lightColor: "bg-red-50",
    borderColor: "border-red-200",
    emoji: "🎯",
  },
  C: {
    title: "Comunicador",
    subtitle: "Focado em Relacionamentos",
    description: "Você é um comunicador natural, gosta de interações e trabalha bem em equipe.",
    color: "bg-yellow-500",
    lightColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    emoji: "🤝",
  },
  P: {
    title: "Planejador",
    subtitle: "Organizado e Sistemático",
    description: "Você é organizado, metódico e gosta de estrutura e procedimentos estabelecidos.",
    color: "bg-green-500",
    lightColor: "bg-green-50",
    borderColor: "border-green-200",
    emoji: "📋",
  },
  A: {
    title: "Analista",
    subtitle: "Preciso e Detalhista",
    description: "Você é detalhista, preciso e gosta de analisar informações antes de tomar decisões.",
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    borderColor: "border-blue-200",
    emoji: "🔬",
  },
}

export function FinalReportScreen({ results, userData, onBack, onStartOver }: FinalReportScreenProps) {
  const totalAnswers = Object.values(results).reduce((sum, value) => sum + value, 0)

  // Encontrar o perfil dominante
  const dominantProfile = Object.entries(results).reduce((a, b) =>
    results[a[0]] > results[b[0]] ? a : b,
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

  const userProfile = {
    dominantProfile: dominantProfileData.title,
    profileData: dominantProfileData,
    results: results,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack} className="text-slate-600 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
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

        {/* Welcome Message */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Parabéns, {userData.name.split(" ")[0]}! 🎉</h1>
              <p className="text-lg text-slate-600">
                Seu perfil RevoDisc está completo e pronto para revolucionar sua carreira médica!
              </p>
            </div>

            {userData.isNewUser && (
              <Badge className="bg-green-600 text-white px-4 py-2">
                <Gift className="w-4 h-4 mr-2" />
                Bem-vindo à Revoluna!
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Main Profile Result */}
        <Card className={`mb-8 border-2 ${dominantProfileData.borderColor} ${dominantProfileData.lightColor}`}>
          <CardHeader className="text-center pb-4">
            <div className="text-6xl mb-4">{dominantProfileData.emoji}</div>
            <CardTitle className="text-3xl font-bold text-slate-800 mb-2">
              Você é um {dominantProfileData.title}
            </CardTitle>
            <p className="text-lg text-slate-600">{dominantProfileData.subtitle}</p>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto mb-6">
              {dominantProfileData.description}
            </p>
            <Badge className={`${dominantProfileData.color} text-white text-lg px-4 py-2`}>
              {percentages[0]?.percentage}% de predominância
            </Badge>
          </CardContent>
        </Card>

        {/* Profile Distribution */}
        <Card className="mb-8 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800 text-center">
              Distribuição Completa do seu Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {percentages.map(({ profile, percentage }, index) => {
              const profileData = profileDetails[profile]
              return (
                <div key={profile} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{profileData.emoji}</span>
                      <div>
                        <span className="font-semibold text-slate-800">{profileData.title}</span>
                        <p className="text-sm text-slate-500">{profileData.subtitle}</p>
                      </div>
                      {index === 0 && <Badge className="bg-yellow-500 text-white">Dominante</Badge>}
                    </div>
                    <span className="text-slate-600 font-bold text-xl">{percentage}%</span>
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

        {/* AI Chat Promotion */}
        <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">💬 Converse com a RevoIA sobre seu perfil!</h3>
                  <p className="text-slate-600 text-sm">
                    Tire dúvidas, receba dicas personalizadas e descubra como maximizar seu potencial
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-purple-600 text-white mb-2">Novidade!</Badge>
                <p className="text-xs text-slate-500">Clique no ícone no canto inferior direito</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Download Section */}
        <Card className="mb-8 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800 text-center flex items-center justify-center gap-2">
              <Smartphone className="w-6 h-6 text-blue-600" />
              Baixe o App Revoluna
            </CardTitle>
            <p className="text-center text-slate-600">
              Acesse seus plantões, perfil e muito mais direto do seu celular
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* iOS */}
              <Card className="border-slate-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">📱</span>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">iOS (iPhone)</h3>
                  <p className="text-sm text-slate-600 mb-4">Disponível na App Store</p>
                  <Button
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                    onClick={() => window.open("https://apps.apple.com/app/revoluna", "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Baixar para iOS
                  </Button>
                  <div className="flex items-center justify-center gap-1 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                    ))}
                    <span className="text-xs text-slate-500 ml-1">4.8 (2.1k)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Android */}
              <Card className="border-slate-200 hover:border-green-300 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">🤖</span>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">Android</h3>
                  <p className="text-sm text-slate-600 mb-4">Disponível no Google Play</p>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => window.open("https://play.google.com/store/apps/details?id=com.revoluna", "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Baixar para Android
                  </Button>
                  <div className="flex items-center justify-center gap-1 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                    ))}
                    <span className="text-xs text-slate-500 ml-1">4.9 (3.2k)</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* QR Code Section */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <QrCode className="w-8 h-8 text-slate-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-800">Escaneie o QR Code</p>
                  <p className="text-sm text-slate-600">Para baixar direto no seu celular</p>
                </div>
              </div>
            </div>

            {/* App Features */}
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-800">Plantões Personalizados</p>
              </div>
              <div className="text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-800">Notificações em Tempo Real</p>
              </div>
              <div className="text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-800">Perfil Sempre Atualizado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-800 text-center">🚀 Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-blue-800">Baixe o app Revoluna</p>
                  <p className="text-sm text-blue-700">Acesse plantões exclusivos baseados no seu perfil</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-blue-800">Converse com a RevoIA</p>
                  <p className="text-sm text-blue-700">Receba dicas personalizadas sobre seu desenvolvimento</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-blue-800">Explore oportunidades</p>
                  <p className="text-sm text-blue-700">Encontre plantões que combinam perfeitamente com você</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.open("https://app.revoluna.com/opportunities", "_blank")}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Ver Plantões Compatíveis
              <ExternalLink className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              onClick={onStartOver}
              className="text-slate-600 border-slate-300 hover:bg-slate-50 bg-transparent px-8 py-3"
            >
              Refazer Avaliação
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 mb-2">
            Este relatório foi gerado pelo RevoDisc v1.0 • Revoluna Healthcare Solutions
          </p>
          <p className="text-xs text-slate-400">Seus dados são privados e seguros • Política de Privacidade</p>
        </div>
      </div>

      {/* AI Chat Widget */}
      <AIChatWidget userProfile={userProfile} userName={userData.name.split(" ")[0]} />
    </div>
  )
}
