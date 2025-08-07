export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          crm: string
          specialty: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          phone?: string | null
          crm: string
          specialty: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          crm?: string
          specialty?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      assessments: {
        Row: {
          id: string
          user_id: string
          type: 'complete' | 'disc' | 'soft_skills' | 'sjt'
          status: 'in_progress' | 'completed'
          disc_results: Json | null
          soft_skills_results: Json | null
          sjt_results: Json | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'complete' | 'disc' | 'soft_skills' | 'sjt'
          status?: 'in_progress' | 'completed'
          disc_results?: Json | null
          soft_skills_results?: Json | null
          sjt_results?: Json | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'complete' | 'disc' | 'soft_skills' | 'sjt'
          status?: 'in_progress' | 'completed'
          disc_results?: Json | null
          soft_skills_results?: Json | null
          sjt_results?: Json | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Assessment = Database['public']['Tables']['assessments']['Row']
export type AssessmentInsert = Database['public']['Tables']['assessments']['Insert']
export type AssessmentUpdate = Database['public']['Tables']['assessments']['Update']

// Assessment-specific types for structured results
export interface DiscResults {
  D: number
  I: number
  S: number
  C: number
}

export interface SoftSkillsResults {
  comunicacao: number
  lideranca: number
  [key: string]: number
}

export type SjtResults = number[]

export interface AssessmentData {
  type: 'complete' | 'disc' | 'soft_skills' | 'sjt'
  status?: 'in_progress' | 'completed'
  disc_results?: DiscResults | null
  soft_skills_results?: SoftSkillsResults | null
  sjt_results?: SjtResults | null
}