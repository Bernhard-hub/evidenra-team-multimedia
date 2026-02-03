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
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
        }
        Update: {
          name?: string
          slug?: string
          logo_url?: string | null
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at: string
          last_active_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
        }
        Update: {
          role?: 'owner' | 'admin' | 'member'
          last_active_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          created_by: string
        }
        Update: {
          name?: string
          description?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          project_id: string
          name: string
          content: string | null
          file_path: string | null
          file_type: string
          word_count: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          content?: string | null
          file_path?: string | null
          file_type: string
          word_count?: number
          created_by: string
        }
        Update: {
          name?: string
          content?: string | null
          word_count?: number
        }
      }
      codes: {
        Row: {
          id: string
          project_id: string
          parent_id: string | null
          name: string
          description: string | null
          color: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          parent_id?: string | null
          name: string
          description?: string | null
          color?: string
          created_by: string
        }
        Update: {
          parent_id?: string | null
          name?: string
          description?: string | null
          color?: string
        }
      }
      codings: {
        Row: {
          id: string
          document_id: string
          code_id: string
          start_offset: number
          end_offset: number
          selected_text: string
          memo: string | null
          confidence: number | null
          coding_method: string | null
          coded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          code_id: string
          start_offset: number
          end_offset: number
          selected_text: string
          memo?: string | null
          confidence?: number | null
          coding_method?: string | null
          coded_by: string
        }
        Update: {
          memo?: string | null
          confidence?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      organization_role: 'owner' | 'admin' | 'member'
      project_role: 'admin' | 'coder' | 'reviewer' | 'viewer'
    }
  }
}
