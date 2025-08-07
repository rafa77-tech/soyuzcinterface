'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { validateCRM } from '@/lib/utils'
import { AvatarUpload } from './avatar-upload'

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
  crm: z.string().min(1, 'CRM é obrigatório').refine(validateCRM, {
    message: 'CRM deve estar no formato válido (ex: CRM/SP 123456)'
  }),
  specialty: z.string().min(2, 'Especialidade é obrigatória')
})

type ProfileFormData = z.infer<typeof profileSchema>

export function UserProfileManager() {
  const { profile, user, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(profile?.avatar_url || null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      phone: profile?.phone || '',
      crm: profile?.crm || '',
      specialty: profile?.specialty || ''
    }
  })

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar perfil')
      }

      const result = await response.json()

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      })

      setIsEditing(false)
      await refreshProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar as informações.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    reset({
      name: profile?.name || '',
      phone: profile?.phone || '',
      crm: profile?.crm || '',
      specialty: profile?.specialty || ''
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
  }

  const handleAvatarChange = (url: string | null) => {
    setCurrentAvatarUrl(url)
    refreshProfile()
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Carregando perfil...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          <AvatarUpload
            currentAvatarUrl={currentAvatarUrl}
            userName={profile.name}
            onAvatarChange={handleAvatarChange}
          />
          <div className="text-center md:text-left">
            <CardTitle>Perfil Profissional</CardTitle>
            <CardDescription>
              Gerencie suas informações profissionais e pessoais
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                {...register('name')}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                Email não pode ser alterado aqui
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register('phone')}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
                placeholder="(11) 99999-9999"
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="crm">CRM</Label>
              <Input
                id="crm"
                {...register('crm')}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
                placeholder="CRM/SP 123456"
              />
              {errors.crm && (
                <p className="text-sm text-red-500">{errors.crm.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Input
                id="specialty"
                {...register('specialty')}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
                placeholder="Ex: Cardiologia"
              />
              {errors.specialty && (
                <p className="text-sm text-red-500">{errors.specialty.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            {!isEditing ? (
              <Button onClick={handleEdit} variant="outline">
                Editar Perfil
              </Button>
            ) : (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isLoading}>
                      Cancelar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar alterações?</AlertDialogTitle>
                      <AlertDialogDescription>
                        As alterações não salvas serão perdidas. Deseja continuar?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Não</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel}>
                        Sim, cancelar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button 
                  type="submit" 
                  disabled={isLoading || !isDirty}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}