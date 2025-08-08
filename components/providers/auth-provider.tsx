'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Session } from '@supabase/auth-helpers-nextjs'
import { supabase } from '@/lib/supabase/client'
import type { Profile, ProfileInsert } from '@/lib/supabase/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, profileData: Omit<ProfileInsert, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error?: Error }>
  signIn: (email: string, password: string) => Promise<{ error?: Error }>
  signOut: () => Promise<{ error?: Error }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error in getSession:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
        router.refresh()
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(profile || null)
    } catch (error) {
      console.error('Error in fetchProfile:', error)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    profileData: Omit<ProfileInsert, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ error?: Error }> => {
    try {
      setLoading(true)

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (authError) {
        return { error: authError }
      }

      if (data.user && data.session) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            ...profileData,
            email: data.user.email!
          }])

        if (profileError) {
          console.error('Error creating profile:', profileError)
          return { error: new Error('Falha ao criar perfil do usuário') }
        }

        await fetchProfile(data.user.id)
      }

      return {}
    } catch (error) {
      console.error('Error in signUp:', error)
      return { error: error as Error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string): Promise<{ error?: Error }> => {
    try {
      setLoading(true)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      return {}
    } catch (error) {
      console.error('Error in signIn:', error)
      return { error: error as Error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<{ error?: Error }> => {
    try {
      setLoading(true)

      const { error } = await supabase.auth.signOut()

      if (error) {
        return { error }
      }

      setUser(null)
      setProfile(null)
      setSession(null)
      router.refresh()

      return {}
    } catch (error) {
      console.error('Error in signOut:', error)
      return { error: error as Error }
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}