'use client'

import { cn } from '@/lib/utils'
import { Loader2, Check, AlertCircle } from 'lucide-react'

interface SavingIndicatorProps {
  status: 'saving' | 'saved' | 'error' | 'idle'
  className?: string
  showText?: boolean
}

export function SavingIndicator({ 
  status, 
  className,
  showText = true 
}: SavingIndicatorProps) {
  const getContent = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Salvando...',
          color: 'text-blue-400'
        }
      case 'saved':
        return {
          icon: <Check className="h-4 w-4" />,
          text: 'Salvo automaticamente',
          color: 'text-green-400'
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Erro ao salvar',
          color: 'text-red-400'
        }
      case 'idle':
        return {
          icon: null,
          text: 'Não salvo',
          color: 'text-gray-400'
        }
      default:
        return null
    }
  }

  const content = getContent()
  
  if (!content) {
    return null
  }

  return (
    <div className={cn(
      'flex items-center gap-2 text-sm transition-opacity duration-200',
      content.color,
      className
    )}>
      {content.icon}
      {showText && <span>{content.text}</span>}
    </div>
  )
} 