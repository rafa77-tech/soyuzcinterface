'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { Upload, X, Camera } from 'lucide-react'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  userName: string
  onAvatarChange: (url: string | null) => void
}

export function AvatarUpload({ currentAvatarUrl, userName, onAvatarChange }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const validateFile = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione uma imagem em formato JPEG, PNG ou WebP.',
        variant: 'destructive',
      })
      return false
    }

    if (file.size > maxSize) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 5MB.',
        variant: 'destructive',
      })
      return false
    }

    return true
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !validateFile(file)) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file || !validateFile(file)) {
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erro ao fazer upload da imagem')
      }

      const result = await response.json()
      
      onAvatarChange(result.avatar_url)
      setPreviewUrl(null)
      
      toast({
        title: 'Avatar atualizado',
        description: 'Sua foto de perfil foi atualizada com sucesso.',
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao fazer upload da imagem.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (!currentAvatarUrl) return

    setIsUploading(true)
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao remover avatar')
      }

      onAvatarChange(null)
      
      toast({
        title: 'Avatar removido',
        description: 'Sua foto de perfil foi removida.',
      })
    } catch (error) {
      console.error('Error removing avatar:', error)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao remover a imagem.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayUrl = previewUrl || currentAvatarUrl
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={displayUrl || ''} />
          <AvatarFallback className="text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        {!previewUrl && (
          <Button
            size="sm"
            variant="outline"
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewUrl ? (
        <div className="flex space-x-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            size="sm"
          >
            {isUploading ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={isUploading}
            size="sm"
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex space-x-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Alterar Foto
          </Button>
          
          {currentAvatarUrl && (
            <Button
              onClick={handleRemove}
              variant="outline"
              size="sm"
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-2" />
              Remover
            </Button>
          )}
        </div>
      )}
    </div>
  )
}