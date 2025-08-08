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
import type { AssessmentData } from '@/lib/services/assessment-service'

export default function Home() {
  const { user } = useAuth()
  const [currentScreen, setCurrentScreen] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentData | null>(null)
  const [incompleteAssessment, setIncompleteAssessment] = useState<AssessmentData | null>(null)
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
      if (user && currentScreen >= 1) { // Verificar após autenticação
        try {
          const response = await fetch('/api/assessments?status=in_progress&limit=1')
          if (response.ok) {
            const { data } = await response.json()
            if (data && data.length > 0) {
              setIncompleteAssessment(data[0])
              setShowResumeModal(true)
            }
          }
        } catch (error) {
          console.error('Error checking incomplete assessment:', error)
        }
      }
    }

    checkIncompleteAssessment()
  }, [user, currentScreen])

  const handleResumeAssessment = (assessment: AssessmentData) => {
    // Restaurar estado dos resultados se existirem
    if (assessment.disc_results) {
      setDiscResults(assessment.disc_results as any)
    }
    if (assessment.soft_skills_results) {
      setSoftSkillsResults(assessment.soft_skills_results as any)
    }
    if (assessment.sjt_results) {
      setSjtResults(assessment.sjt_results as number[])
    }

    // Determinar qual tela mostrar baseado no progresso
    if (assessment.type === 'complete') {
      // Para avaliação completa, determinar baseado no que já foi feito
      if (!assessment.disc_results) {
        setCurrentScreen(2) // DISC Screen
      } else if (!assessment.soft_skills_results) {
        setCurrentScreen(3) // Soft Skills Screen
      } else if (!assessment.sjt_results) {
        setCurrentScreen(4) // SJT Screen
      } else {
        setCurrentScreen(5) // Completion Screen
      }
    } else {
      // Para avaliações específicas
      if (assessment.type === 'disc') {
        setCurrentScreen(2)
      } else if (assessment.type === 'soft_skills') {
        setCurrentScreen(3)
      } else if (assessment.type === 'sjt') {
        setCurrentScreen(4)
      }
    }
    
    setShowResumeModal(false)
  }

  const handleStartNewAssessment = async () => {
    // Abandonar avaliação anterior se existir
    if (incompleteAssessment?.id) {
      try {
        await fetch(`/api/assessment/${incompleteAssessment.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'abandoned' })
        })
      } catch (error) {
        console.error('Error abandoning previous assessment:', error)
      }
    }

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
    setIncompleteAssessment(null)
    setCurrentScreen(2) // Começar do DISC
    setShowResumeModal(false)
  }

  const handleViewHistory = () => {
    setShowHistory(true)
  }

  const handleViewResults = (assessment: AssessmentData) => {
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
          userId={user?.id || ''}
          onViewAssessment={handleViewResults}
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
        onOpenChange={setShowResumeModal}
        assessment={incompleteAssessment}
        onResume={() => incompleteAssessment && handleResumeAssessment(incompleteAssessment)}
        onStartNew={handleStartNewAssessment}
      />
    </main>
  )
}
