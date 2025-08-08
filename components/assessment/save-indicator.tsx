import { AutoSaveState } from '../../hooks/use-assessment-autosave'
import { CheckCircle, AlertTriangle, Loader2, Wifi, WifiOff } from 'lucide-react'
import { Button } from '../ui/button'

interface SaveIndicatorProps {
  autoSaveState: AutoSaveState
  onRetryManual?: () => void
  className?: string
}

export function SaveIndicator({ autoSaveState, onRetryManual, className = '' }: SaveIndicatorProps) {
  const { isSaving, lastSaved, error } = autoSaveState

  // Determine the current save status
  const getStatus = () => {
    if (isSaving) return 'saving'
    if (error) return 'error'
    if (lastSaved) return 'saved'
    return 'idle'
  }

  const status = getStatus()

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'agora mesmo' // Less than 1 minute
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás` // Less than 1 hour
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  // Determine if we're offline (basic check)
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine

  const renderContent = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Salvando...</span>
          </div>
        )

      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">
              ✓ Salvo {lastSaved && formatLastSaved(lastSaved)}
            </span>
          </div>
        )

      case 'error':
        return (
          <div className="flex items-center gap-2 text-amber-600">
            <div className="flex items-center gap-2">
              {isOffline ? (
                <WifiOff className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span className="text-sm">
                {isOffline 
                  ? '📴 Salvando localmente - sincronizará quando online'
                  : error || 'Erro ao salvar'
                }
              </span>
            </div>
            {onRetryManual && !isOffline && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetryManual}
                className="h-6 px-2 py-1 text-xs"
              >
                Tentar novamente
              </Button>
            )}
          </div>
        )

      default:
        return (
          <div className="flex items-center gap-2 text-gray-500">
            <Wifi className="h-4 w-4" />
            <span className="text-sm">Pronto para salvar</span>
          </div>
        )
    }
  }

  return (
    <div className={`transition-all duration-200 ${className}`}>
      {renderContent()}
    </div>
  )
}

// Compact version for minimal space
interface CompactSaveIndicatorProps {
  autoSaveState: AutoSaveState
  showText?: boolean
}

export function CompactSaveIndicator({ 
  autoSaveState, 
  showText = false 
}: CompactSaveIndicatorProps) {
  const { isSaving, lastSaved, error } = autoSaveState

  if (isSaving) {
    return (
      <div className="flex items-center gap-1 text-blue-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        {showText && <span className="text-xs">Salvando...</span>}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-1 text-amber-600" title={error}>
        <AlertTriangle className="h-3 w-3" />
        {showText && <span className="text-xs">Erro</span>}
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle className="h-3 w-3" />
        {showText && <span className="text-xs">Salvo</span>}
      </div>
    )
  }

  return null
}