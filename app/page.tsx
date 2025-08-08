'use client'

import { useState } from 'react'
import { WelcomeScreen } from '@/components/welcome-screen'
import { AuthScreen } from '@/components/auth-screen'
import { MiniDiscScreen } from '@/components/mini-disc-screen'
import { SoftSkillsScreen } from '@/components/soft-skills-screen'
import { SJTScreen } from '@/components/sjt-screen'
import { CompletionScreen } from '@/components/completion-screen'
import { AIChatWidget } from '@/components/ai-chat-widget'

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState(0)
  const [userData, setUserData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    crm: '',
    specialty: '',
    isNewUser: true
  })
  const [discResults, setDiscResults] = useState({
    D: 0,
    I: 0,
    S: 0,
    C: 0
  })
  const [softSkillsResults, setSoftSkillsResults] = useState({
    comunicacao: 0,
    lideranca: 0,
    trabalhoEquipe: 0,
    resolucaoProblemas: 0,
    adaptabilidade: 0,
    criatividade: 0,
    gestaoTempo: 0,
    negociacao: 0
  })
  const [sjtResults, setSjtResults] = useState<number[]>([])

  const screens = [
    <WelcomeScreen key="welcome" onNext={() => setCurrentScreen(1)} />,
    <AuthScreen 
      key="auth" 
      onNext={() => setCurrentScreen(2)} 
      onUserData={setUserData}
    />,
    <MiniDiscScreen 
      key="disc" 
      userData={userData}
      onNext={() => setCurrentScreen(3)} 
      onResults={setDiscResults}
    />,
    <SoftSkillsScreen 
      key="softskills" 
      userData={userData}
      onNext={() => setCurrentScreen(4)} 
      onResults={setSoftSkillsResults}
    />,
    <SJTScreen 
      key="sjt" 
      userData={userData}
      onNext={() => setCurrentScreen(5)} 
      onResults={setSjtResults}
    />,
    <CompletionScreen 
      key="completion" 
      userData={userData}
      discResults={discResults}
      softSkillsResults={softSkillsResults}
      sjtResults={sjtResults}
      onRestart={() => setCurrentScreen(0)}
    />
  ]

  return (
    <main className="min-h-screen">
      {screens[currentScreen]}
      <AIChatWidget />
    </main>
  )
}
