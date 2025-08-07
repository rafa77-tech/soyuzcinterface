'use client'

import { useState, useEffect } from 'react'
import { WelcomeScreen } from '@/components/welcome-screen'
import { AuthScreen } from '@/components/auth-screen'
import { MiniDiscScreen } from '@/components/mini-disc-screen'
import { SoftSkillsScreen } from '@/components/soft-skills-screen'
import { SJTScreen } from '@/components/sjt-screen'
import { CompletionScreen } from '@/components/completion-screen'
import { AIChatWidget } from '@/components/ai-chat-widget'
import { ResumeAssessmentModal } from '@/components/assessment/resume-assessment-modal'
import { AssessmentHistory } from '@/components/assessment/assessment-history'
import { ResultsViewer } from '@/components/assessment/results-viewer'
import { useAuth } from '@/components/providers/auth-provider'
import type { Assessment } from '@/lib/supabase/types'

export default function Home() {
  const { user } = useAuth()
  const [currentScreen, setCurrentScreen] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [incompleteAssessment, setIncompleteAssessment] = useState<Assessment | null>(null)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    company: ''
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

  // Função para verificar avaliações incompletas quando usuário autentica
  useEffect(() => {
    const checkIncompleteAssessment = async () => {
      if (user && currentScreen >= 2) { // Só verificar após autenticação
        try {
          const response = await fetch('/api/assessment')
          if (response.ok) {
            const assessment = await response.json()
            setIncompleteAssessment(assessment)
            setShowResumeModal(true)
          }
        } catch (error) {
          console.error('Error checking incomplete assessment:', error)
        }
      }
    }

    checkIncompleteAssessment()
  }, [user, currentScreen])

  const handleResumeAssessment = (assessment: Assessment) => {
    // Determinar para qual tela ir baseado no tipo da avaliação
    if (assessment.type === 'disc' || assessment.type === 'complete') {
      setCurrentScreen(2) // DISC Screen
    } else if (assessment.type === 'soft_skills') {
      setCurrentScreen(3) // Soft Skills Screen
    } else if (assessment.type === 'sjt') {
      setCurrentScreen(4) // SJT Screen
    }
    
    // Se há resultados salvos, restaurar estado
    if (assessment.disc_results) {
      setDiscResults(assessment.disc_results as any)
    }
    if (assessment.soft_skills_results) {
      setSoftSkillsResults(assessment.soft_skills_results as any)
    }
    if (assessment.sjt_results) {
      setSjtResults(assessment.sjt_results as number[])
    }
    
    setShowResumeModal(false)
  }

  const handleStartNewAssessment = () => {
    // Limpar estados para nova avaliação
    setDiscResults({ D: 0, I: 0, S: 0, C: 0 })
    setSoftSkillsResults({
      comunicacao: 0,
      lideranca: 0,
      trabalhoEquipe: 0,
      resolucaoProblemas: 0,
      adaptabilidade: 0,
      criatividade: 0,
      gestaoTempo: 0,
      negociacao: 0
    })
    setSjtResults([])
    setCurrentScreen(2) // Começar do DISC
    setShowResumeModal(false)
  }

  const handleViewHistory = () => {
    setShowHistory(true)
  }

  const handleViewResults = (assessment: Assessment) => {
    setSelectedAssessment(assessment)
    setShowHistory(false)
  }

  const handleBackToHistory = () => {
    setSelectedAssessment(null)
    setShowHistory(true)
  }

  const handleBackToMain = () => {
    setShowHistory(false)
    setSelectedAssessment(null)
  }

  const screens = [
    <WelcomeScreen key="welcome" onStart={() => setCurrentScreen(1)} />,
    <AuthScreen 
      key="auth" 
      onNext={() => setCurrentScreen(2)} 
      onUserData={setUserData}
      onViewHistory={handleViewHistory}
    />,
    <MiniDiscScreen 
      key="disc" 
      onNext={() => setCurrentScreen(3)} 
      onResults={setDiscResults}
    />,
    <SoftSkillsScreen 
      key="softskills" 
      onNext={() => setCurrentScreen(4)} 
      onResults={setSoftSkillsResults}
    />,
    <SJTScreen 
      key="sjt" 
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
      onViewHistory={handleViewHistory}
    />
  ]

  return (
    <main className="min-h-screen">
      {showHistory && !selectedAssessment && (
        <AssessmentHistory 
          onBack={handleBackToMain}
          onViewResults={handleViewResults}
        />
      )}
      
      {selectedAssessment && (
        <ResultsViewer 
          assessment={selectedAssessment}
          onBack={handleBackToHistory}
        />
      )}
      
      {!showHistory && !selectedAssessment && screens[currentScreen]}
      
      <AIChatWidget />
      <ResumeAssessmentModal
        isOpen={showResumeModal}
        assessment={incompleteAssessment}
        onResume={handleResumeAssessment}
        onStartNew={handleStartNewAssessment}
        onClose={() => setShowResumeModal(false)}
      />
    </main>
  )
}
