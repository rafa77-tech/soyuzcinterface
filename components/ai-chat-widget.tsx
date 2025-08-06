'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, X, Send } from 'lucide-react'

interface Message {
  id: number
  text: string
  isUser: boolean
  timestamp: Date
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Olá! Sou seu assistente virtual da Soyuz. Posso ajudar com dúvidas sobre DISC, soft skills e julgamento situacional. Como posso ajudá-lo?",
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')

  const predefinedResponses = {
    'disc': 'O DISC é uma ferramenta que avalia 4 estilos comportamentais: Dominância (foco em resultados), Influência (foco em pessoas e otimismo), Estabilidade (foco em cooperação) e Conformidade (foco em precisão e qualidade).',
    'soft skills': 'Soft skills são competências interpessoais como comunicação, liderança, trabalho em equipe e resolução de problemas. São essenciais para o sucesso profissional e complementam as habilidades técnicas.',
    'julgamento situacional': 'O teste de julgamento situacional avalia como você toma decisões em cenários profissionais reais. Mede sua capacidade de escolher as melhores ações em situações complexas.',
    'como funciona': 'Nossa avaliação tem 4 etapas: 1) Dados pessoais, 2) Questionário DISC (5 perguntas), 3) Autoavaliação de soft skills, 4) Cenários de julgamento situacional. Leva cerca de 15-20 minutos.',
    'resultados': 'Você receberá um relatório completo com seu perfil DISC dominante, gráfico de soft skills, pontuação em julgamento situacional e recomendações personalizadas de desenvolvimento.',
    'tempo': 'A avaliação completa leva aproximadamente 15-20 minutos. Você pode fazer no seu próprio ritmo.',
    'privacidade': 'Seus dados são tratados com total confidencialidade e usados apenas para gerar seu relatório personalizado.',
    'default': 'Posso ajudar com informações sobre DISC, soft skills, julgamento situacional, como funciona a avaliação, resultados e privacidade. Sobre o que gostaria de saber mais?'
  }

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    // Simple keyword matching for responses
    const lowerInput = inputMessage.toLowerCase()
    let responseKey = 'default'

    for (const key in predefinedResponses) {
      if (lowerInput.includes(key.replace(' ', ''))) {
        responseKey = key
        break
      }
    }

    setTimeout(() => {
      const aiMessage: Message = {
        id: messages.length + 2,
        text: predefinedResponses[responseKey as keyof typeof predefinedResponses],
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    }, 1000)

    setInputMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 stellar-glow z-50"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 h-96 stellar-card z-40">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white">Assistente Soyuz</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-full">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        message.isUser
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta..."
                  className="bg-gray-800/50 border-gray-600 text-white text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
